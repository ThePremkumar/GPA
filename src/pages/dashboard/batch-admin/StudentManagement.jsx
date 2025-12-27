/**
 * Batch Admin Student Management
 * Only manages students in assigned batch
 */
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useToast } from '../../../contexts/ToastContext';
import { Plus, Trash2, Search, GraduationCap, X, Edit2, Check } from 'lucide-react';
import { rtdb } from '../../../firebase/config';
import { ref, get, set, remove, update } from 'firebase/database';
import { auth } from '../../../firebase/config';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { getRegulationByBatch } from '../../../data/regulations';
import { useRegulations } from '../../../hooks/useRegulations';
import { logActivity, ACTIVITY_TYPES } from '../../../services/activityService';

export default function BatchStudentManagement() {
  const { userData, currentUser } = useAuth();
  const { addToast } = useToast();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // Edit state
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});
  const [saving, setSaving] = useState(false);
  
  const assignedBatch = userData?.assignedBatch || userData?.assignedYear;
  const regulation = getRegulationByBatch(assignedBatch);
  const { regulationYears } = useRegulations();

  const [formData, setFormData] = useState({
    registerNumber: '',
    fullName: '',
    email: '',
    dateOfBirth: ''
  });

  useEffect(() => {
    if (assignedBatch) fetchStudents();
  }, [assignedBatch]);

  async function fetchStudents() {
    setLoading(true);
    try {
      const studentsRef = ref(rtdb, 'students');
      const snapshot = await get(studentsRef);
      
      if (snapshot.exists()) {
        const data = snapshot.val();
        let list = Object.entries(data)
          .map(([id, student]) => ({ id, ...student }))
          .filter(s => s.batch === assignedBatch);
        setStudents(list);
      } else {
        setStudents([]);
      }
    } catch (error) {
      addToast('Failed to fetch students', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function handleAddStudent(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const studentEmail = `${formData.registerNumber}@csbs.com`;
      const studentPassword = formData.dateOfBirth;
      
      const [year, month, day] = formData.dateOfBirth.split('-');
      const formattedDob = `${day}/${month}/${year}`;
      
      const userCredential = await createUserWithEmailAndPassword(auth, studentEmail, studentPassword);
      const userId = userCredential.user.uid;
      
      const studentRef = ref(rtdb, `students/${userId}`);
      await set(studentRef, {
        uid: userId,
        regNum: formData.registerNumber,
        name: formData.fullName,
        email: formData.email,
        dob: formattedDob,
        regulation: regulation,
        batch: assignedBatch,
        role: 'student',
        status: 'active',
        createdAt: Date.now(),
        createdBy: currentUser.uid
      });
      
      addToast('Student added successfully!', 'success');
      
      // Log activity
      await logActivity({
        type: ACTIVITY_TYPES.STUDENT_CREATED,
        adminId: currentUser.uid,
        adminName: userData?.fullName || userData?.email,
        adminEmail: userData?.email,
        batch: assignedBatch,
        targetId: userId,
        targetType: 'student',
        details: { studentName: formData.fullName, regNum: formData.registerNumber }
      });
      
      setShowAddModal(false);
      setFormData({ registerNumber: '', fullName: '', email: '', dateOfBirth: '' });
      fetchStudents();
    } catch (error) {
      if (error.code === 'auth/email-already-in-use') {
        addToast('Student with this register number already exists', 'error');
      } else {
        addToast(error.message || 'Failed to add student', 'error');
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(studentId) {
    if (!window.confirm('Delete this student?')) return;
    
    // Find student details before deleting
    const studentToDelete = students.find(s => s.id === studentId);
    
    try {
      await remove(ref(rtdb, `students/${studentId}`));
      
      // Log activity
      await logActivity({
        type: ACTIVITY_TYPES.STUDENT_DELETED,
        adminId: currentUser.uid,
        adminName: userData?.fullName || userData?.email,
        adminEmail: userData?.email,
        batch: assignedBatch,
        targetId: studentId,
        targetType: 'student',
        details: { 
          studentName: studentToDelete?.name || studentToDelete?.fullName, 
          regNum: studentToDelete?.regNum || studentToDelete?.registerNumber 
        }
      });
      
      addToast('Student deleted', 'success');
      fetchStudents();
    } catch (error) {
      addToast('Failed to delete', 'error');
    }
  }

  function handleStartEdit(student) {
    setEditingId(student.id);
    setEditData({
      name: student.name || student.fullName || '',
      email: student.email || '',
      regulation: student.regulation || regulation,
      status: student.status || 'active'
    });
  }

  function handleCancelEdit() {
    setEditingId(null);
    setEditData({});
  }

  async function handleSaveEdit() {
    if (!editData.name) {
      addToast('Name is required', 'error');
      return;
    }
    
    setSaving(true);
    try {
      await update(ref(rtdb, `students/${editingId}`), {
        name: editData.name,
        email: editData.email,
        regulation: editData.regulation,
        status: editData.status,
        updatedAt: Date.now(),
        updatedBy: currentUser.uid
      });
      
      addToast('Student updated successfully!', 'success');
      
      // Log activity
      await logActivity({
        type: ACTIVITY_TYPES.STUDENT_UPDATED,
        adminId: currentUser.uid,
        adminName: userData?.fullName || userData?.email,
        adminEmail: userData?.email,
        batch: assignedBatch,
        targetId: editingId,
        targetType: 'student',
        details: { studentName: editData.name, changes: editData }
      });
      
      setEditingId(null);
      setEditData({});
      fetchStudents();
    } catch (error) {
      addToast('Failed to update student', 'error');
    } finally {
      setSaving(false);
    }
  }

  const filteredStudents = students.filter(s => 
    s.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.registerNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.regNum?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ margin: '0 0 8px', fontSize: '24px' }}>Student Management</h1>
          <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
            Manage students in batch {assignedBatch} • {students.length} students
          </p>
        </div>
        <button className="btn-primary" onClick={() => setShowAddModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Plus size={18} /> Add Student
        </button>
      </div>

      {/* Search */}
      <div className="glass-panel" style={{ padding: '16px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '0 16px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px' }}>
          <Search size={18} color="var(--text-secondary)" />
          <input 
            style={{ flex: 1, background: 'none', border: 'none', padding: '12px 0', color: 'var(--text-primary)', fontSize: '14px', outline: 'none' }} 
            placeholder="Search by name or register number..." 
            value={searchTerm} 
            onChange={e => setSearchTerm(e.target.value)} 
          />
        </div>
      </div>

      {/* Student List */}
      <div className="glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading...</div>
        ) : filteredStudents.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <GraduationCap size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
            <h3>No students found</h3>
            <p>Add students to get started</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.03)' }}>
                  <th style={{ padding: '14px 20px', textAlign: 'left', fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Student</th>
                  <th style={{ padding: '14px 20px', textAlign: 'left', fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Reg. Number</th>
                  <th style={{ padding: '14px 20px', textAlign: 'left', fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Email</th>
                  <th style={{ padding: '14px 20px', textAlign: 'left', fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Regulation</th>
                  <th style={{ padding: '14px 20px', textAlign: 'left', fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Status</th>
                  <th style={{ padding: '14px 20px', textAlign: 'left', fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map(student => (
                  <tr key={student.id} style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                    {/* Name */}
                    <td style={{ padding: '14px 20px' }}>
                      {editingId === student.id ? (
                        <input 
                          className="input-field" 
                          value={editData.name} 
                          onChange={e => setEditData({...editData, name: e.target.value})} 
                          style={{ padding: '8px 12px', fontSize: '14px', minWidth: '150px' }} 
                        />
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{ width: '36px', height: '36px', background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '600', color: 'white' }}>
                            {(student.name || student.fullName || 'S').charAt(0).toUpperCase()}
                          </div>
                          <span style={{ fontWeight: '500' }}>{student.name || student.fullName}</span>
                        </div>
                      )}
                    </td>
                    
                    {/* Register Number - Not editable */}
                    <td style={{ padding: '14px 20px', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
                      {student.registerNumber || student.regNum}
                    </td>
                    
                    {/* Email */}
                    <td style={{ padding: '14px 20px' }}>
                      {editingId === student.id ? (
                        <input 
                          className="input-field" 
                          type="email" 
                          value={editData.email} 
                          onChange={e => setEditData({...editData, email: e.target.value})} 
                          style={{ padding: '8px 12px', fontSize: '14px', minWidth: '180px' }} 
                        />
                      ) : (
                        <span style={{ color: 'var(--text-secondary)' }}>{student.email}</span>
                      )}
                    </td>
                    
                    {/* Regulation */}
                    <td style={{ padding: '14px 20px' }}>
                      {editingId === student.id ? (
                        <select 
                          className="input-field" 
                          value={editData.regulation} 
                          onChange={e => setEditData({...editData, regulation: e.target.value})} 
                          style={{ padding: '8px 12px', fontSize: '14px' }}
                        >
                          {regulations.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                      ) : (
                        <span style={{ padding: '4px 10px', background: 'rgba(59,130,246,0.15)', borderRadius: '6px', fontSize: '13px', color: '#60a5fa' }}>
                          {student.regulation || regulation}
                        </span>
                      )}
                    </td>
                    
                    {/* Status */}
                    <td style={{ padding: '14px 20px' }}>
                      {editingId === student.id ? (
                        <select 
                          className="input-field" 
                          value={editData.status} 
                          onChange={e => setEditData({...editData, status: e.target.value})} 
                          style={{ padding: '8px 12px', fontSize: '14px' }}
                        >
                          <option value="active">Active</option>
                          <option value="inactive">Inactive</option>
                          <option value="graduated">Graduated</option>
                        </select>
                      ) : (
                        <span style={{ 
                          padding: '4px 10px', 
                          background: student.status === 'active' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)', 
                          borderRadius: '6px', 
                          fontSize: '13px', 
                          color: student.status === 'active' ? '#10b981' : '#ef4444' 
                        }}>
                          {student.status || 'active'}
                        </span>
                      )}
                    </td>
                    
                    {/* Actions */}
                    <td style={{ padding: '14px 20px' }}>
                      {editingId === student.id ? (
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button 
                            onClick={handleSaveEdit} 
                            disabled={saving}
                            style={{ background: 'rgba(16,185,129,0.15)', border: 'none', padding: '8px', borderRadius: '6px', color: '#10b981', cursor: 'pointer', display: 'flex', alignItems: 'center' }} 
                            title="Save"
                          >
                            <Check size={16} />
                          </button>
                          <button 
                            onClick={handleCancelEdit} 
                            style={{ background: 'rgba(107,114,128,0.15)', border: 'none', padding: '8px', borderRadius: '6px', color: '#9ca3af', cursor: 'pointer', display: 'flex', alignItems: 'center' }} 
                            title="Cancel"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button 
                            onClick={() => handleStartEdit(student)} 
                            style={{ background: 'rgba(59,130,246,0.15)', border: 'none', padding: '8px', borderRadius: '6px', color: '#60a5fa', cursor: 'pointer', display: 'flex', alignItems: 'center' }} 
                            title="Edit"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button 
                            onClick={() => handleDelete(student.id)} 
                            style={{ background: 'rgba(239,68,68,0.1)', border: 'none', padding: '8px', borderRadius: '6px', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }} onClick={() => setShowAddModal(false)}>
          <div onClick={e => e.stopPropagation()} style={{ background: 'var(--bg-secondary)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', width: '100%', maxWidth: '480px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '20px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <h2 style={{ margin: 0, fontSize: '18px' }}>Add New Student</h2>
              <button onClick={() => setShowAddModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <form onSubmit={handleAddStudent}>
              <div style={{ padding: '24px', display: 'grid', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: 'var(--text-secondary)' }}>Full Name *</label>
                  <input className="input-field" value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} required />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: 'var(--text-secondary)' }}>Register Number *</label>
                  <input className="input-field" value={formData.registerNumber} onChange={e => setFormData({...formData, registerNumber: e.target.value})} required />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: 'var(--text-secondary)' }}>Email *</label>
                  <input className="input-field" type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} required />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: 'var(--text-secondary)' }}>Date of Birth * (This will be the password)</label>
                  <input className="input-field" type="date" value={formData.dateOfBirth} onChange={e => setFormData({...formData, dateOfBirth: e.target.value})} required />
                </div>
                <div style={{ padding: '12px', background: 'rgba(59,130,246,0.1)', borderRadius: '8px', fontSize: '13px', color: 'var(--accent-primary)' }}>
                  📋 Batch: {assignedBatch} • Regulation: {regulation}
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', padding: '16px 24px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <button type="button" onClick={() => setShowAddModal(false)} style={{ padding: '10px 20px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'var(--text-primary)', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={submitting}>{submitting ? 'Adding...' : 'Add Student'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
