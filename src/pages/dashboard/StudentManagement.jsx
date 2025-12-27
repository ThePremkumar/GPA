import React, { useState, useEffect } from 'react';
import { rtdb } from '../../firebase/config';
import { ref, get, set, remove, update } from 'firebase/database';
import { auth } from '../../firebase/config';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { Trash2, Plus, Search, X, Users, Filter, RefreshCw, Edit2, Check, Eye } from 'lucide-react';
import { useRegulations } from '../../hooks/useRegulations';

export default function StudentManagement() {
  const { userData, userRole } = useAuth();
  const { addToast } = useToast();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBatch, setFilterBatch] = useState('');
  const [filterRegulation, setFilterRegulation] = useState('');
  const [saving, setSaving] = useState(false);
  
  // Edit state
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});
  
  const [formData, setFormData] = useState({
    regNum: '',
    name: '',
    dob: '',
    email: '',
    regulation: '2021',
    batch: ''
  });

  const { regulations, regulationYears, allBatches, getBatches } = useRegulations();

  useEffect(() => {
    if (userRole === 'year_admin' && userData?.assignedYear) {
      setFormData(prev => ({ ...prev, batch: userData.assignedYear }));
      setFilterBatch(userData.assignedYear);
    }
    fetchStudents();
  }, [userRole, userData]);

  async function fetchStudents() {
    setLoading(true);
    try {
      const studentsRef = ref(rtdb, 'students');
      const snapshot = await get(studentsRef);
      
      if (snapshot.exists()) {
        const data = snapshot.val();
        let list = Object.entries(data).map(([id, student]) => ({
          id,
          ...student
        }));
        
        if (userRole === 'year_admin' && userData?.assignedYear) {
          list = list.filter(s => s.batch === userData.assignedYear);
        }
        
        setStudents(list);
      } else {
        setStudents([]);
      }
    } catch (e) {
      console.error("Error fetching students:", e);
      addToast('Failed to fetch students', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function handleAddStudent(e) {
    e.preventDefault();
    setSaving(true);
    
    try {
      const studentEmail = `${formData.regNum}@csbs.com`;
      const studentPassword = formData.dob;
      
      const [year, month, day] = formData.dob.split('-');
      const formattedDob = `${day}/${month}/${year}`;
      
      const userCredential = await createUserWithEmailAndPassword(auth, studentEmail, studentPassword);
      const userId = userCredential.user.uid;
      
      const studentRef = ref(rtdb, `students/${userId}`);
      await set(studentRef, {
        uid: userId,
        regNum: formData.regNum,
        name: formData.name,
        email: formData.email,
        dob: formattedDob,
        regulation: formData.regulation,
        batch: formData.batch,
        role: 'student',
        status: 'active',
        createdAt: Date.now()
      });
      
      addToast('Student added successfully!', 'success');
      setShowForm(false);
      fetchStudents();
      
      setFormData({
        regNum: '',
        name: '',
        dob: '',
        email: '',
        regulation: '2021',
        batch: userRole === 'year_admin' ? userData?.assignedYear : ''
      });
    } catch (e) {
      console.error("Error adding student:", e);
      if (e.code === 'auth/email-already-in-use') {
        addToast('Student with this register number already exists', 'error');
      } else {
        addToast('Failed to add student: ' + e.message, 'error');
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id, regNum) {
    if (!window.confirm(`Are you sure you want to delete student ${regNum}?`)) return;
    
    try {
      await remove(ref(rtdb, `students/${id}`));
      addToast('Student deleted successfully', 'success');
      fetchStudents();
    } catch (e) {
      console.error("Error deleting student:", e);
      addToast('Failed to delete student', 'error');
    }
  }

  function handleStartEdit(student) {
    setEditingId(student.id);
    setEditData({
      name: student.name || '',
      email: student.email || '',
      dob: student.dob || '',
      regulation: student.regulation || '2021',
      batch: student.batch || '',
      status: student.status || 'active'
    });
  }

  function handleCancelEdit() {
    setEditingId(null);
    setEditData({});
  }

  async function handleSaveEdit() {
    if (!editData.name || !editData.batch) {
      addToast('Name and Batch are required', 'error');
      return;
    }
    
    setSaving(true);
    try {
      await update(ref(rtdb, `students/${editingId}`), {
        ...editData,
        updatedAt: Date.now()
      });
      
      addToast('Student updated successfully!', 'success');
      setEditingId(null);
      setEditData({});
      fetchStudents();
    } catch (e) {
      console.error("Error updating student:", e);
      addToast('Failed to update student', 'error');
    } finally {
      setSaving(false);
    }
  }

  const filteredStudents = students.filter(student => {
    const matchesSearch = searchTerm === '' || 
      student.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.regNum?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesBatch = filterBatch === '' || student.batch === filterBatch;
    const matchesRegulation = filterRegulation === '' || student.regulation === filterRegulation;
    
    return matchesSearch && matchesBatch && matchesRegulation;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ margin: '0 0 8px', fontSize: '24px', fontWeight: '700' }}>Student Management</h1>
          <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
            {students.length} students registered
          </p>
        </div>
        <button 
          className="btn-primary" 
          onClick={() => setShowForm(!showForm)}
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          {showForm ? <X size={18} /> : <Plus size={18} />}
          {showForm ? 'Cancel' : 'Add Student'}
        </button>
      </div>

      {/* Add Student Form */}
      {showForm && (
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ margin: '0 0 20px' }}>Register New Student</h3>
          <form onSubmit={handleAddStudent}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: 'var(--text-secondary)' }}>
                  Register Number *
                </label>
                <input required className="input-field" placeholder="e.g., 2021503001" value={formData.regNum} onChange={e => setFormData({...formData, regNum: e.target.value})} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: 'var(--text-secondary)' }}>
                  Full Name *
                </label>
                <input required className="input-field" placeholder="Student's full name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: 'var(--text-secondary)' }}>
                  Date of Birth * (Password)
                </label>
                <input required className="input-field" type="date" value={formData.dob} onChange={e => setFormData({...formData, dob: e.target.value})} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: 'var(--text-secondary)' }}>
                  Email Address *
                </label>
                <input required className="input-field" type="email" placeholder="student@email.com" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: 'var(--text-secondary)' }}>
                  Regulation *
                </label>
                <select className="input-field" value={formData.regulation} onChange={e => setFormData({...formData, regulation: e.target.value, batch: ''})}>
                  {regulations.map(reg => (<option key={reg} value={reg}>Regulation {reg}</option>))}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: 'var(--text-secondary)' }}>
                  Batch *
                </label>
                <select required className="input-field" value={formData.batch} onChange={e => setFormData({...formData, batch: e.target.value})} disabled={userRole === 'year_admin'}>
                  <option value="">Select Batch</option>
                  {getBatches(formData.regulation).map(batch => (<option key={batch} value={batch}>{batch}</option>))}
                </select>
              </div>
            </div>
            <div style={{ marginTop: '24px', display: 'flex', gap: '12px' }}>
              <button type="submit" className="btn-primary" disabled={saving} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {saving ? 'Creating...' : 'Create Student Account'}
              </button>
              <button type="button" onClick={() => setShowForm(false)} style={{ padding: '12px 24px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: 'var(--text-primary)', cursor: 'pointer' }}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filters */}
      <div className="glass-panel" style={{ padding: '16px' }}>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: '1', minWidth: '200px' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
            <input className="input-field" placeholder="Search by name, register number, or email..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} style={{ paddingLeft: '40px' }} />
          </div>
          <select className="input-field" value={filterBatch} onChange={e => setFilterBatch(e.target.value)} style={{ width: 'auto', minWidth: '150px' }} disabled={userRole === 'year_admin'}>
            <option value="">All Batches</option>
            {allBatches.map(batch => (<option key={batch} value={batch}>{batch}</option>))}
          </select>
          <select className="input-field" value={filterRegulation} onChange={e => setFilterRegulation(e.target.value)} style={{ width: 'auto', minWidth: '150px' }}>
            <option value="">All Regulations</option>
            {regulations.map(reg => (<option key={reg} value={reg}>Regulation {reg}</option>))}
          </select>
          <button onClick={fetchStudents} disabled={loading} style={{ padding: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: 'var(--text-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
        <div style={{ marginTop: '12px', fontSize: '14px', color: 'var(--text-secondary)' }}>
          Showing {filteredStudents.length} of {students.length} students
          {(searchTerm || filterBatch || filterRegulation) && (
            <button onClick={() => { setSearchTerm(''); setFilterBatch(''); setFilterRegulation(''); }} style={{ marginLeft: '12px', background: 'none', border: 'none', color: 'var(--accent-primary)', cursor: 'pointer', textDecoration: 'underline' }}>
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Students Table */}
      <div className="glass-panel" style={{ padding: '0', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading students...</div>
        ) : filteredStudents.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <Users size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
            <p>No students found</p>
            {(searchTerm || filterBatch || filterRegulation) && (<p style={{ fontSize: '14px' }}>Try adjusting your filters</p>)}
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.03)' }}>
                  <th style={{ padding: '16px', fontSize: '13px', color: 'var(--text-secondary)', fontWeight: '600' }}>Register No.</th>
                  <th style={{ padding: '16px', fontSize: '13px', color: 'var(--text-secondary)', fontWeight: '600' }}>Name</th>
                  <th style={{ padding: '16px', fontSize: '13px', color: 'var(--text-secondary)', fontWeight: '600' }}>Email</th>
                  <th style={{ padding: '16px', fontSize: '13px', color: 'var(--text-secondary)', fontWeight: '600' }}>Batch</th>
                  <th style={{ padding: '16px', fontSize: '13px', color: 'var(--text-secondary)', fontWeight: '600' }}>Regulation</th>
                  <th style={{ padding: '16px', fontSize: '13px', color: 'var(--text-secondary)', fontWeight: '600' }}>Status</th>
                  <th style={{ padding: '16px', fontSize: '13px', color: 'var(--text-secondary)', fontWeight: '600' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map(student => (
                  <tr key={student.id} style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                    {/* Register Number - Not editable */}
                    <td style={{ padding: '16px', fontFamily: 'monospace' }}>{student.regNum}</td>
                    
                    {/* Editable Name */}
                    <td style={{ padding: '16px' }}>
                      {editingId === student.id ? (
                        <input className="input-field" value={editData.name} onChange={e => setEditData({...editData, name: e.target.value})} style={{ padding: '8px 12px', fontSize: '14px', width: '100%', minWidth: '150px' }} />
                      ) : (
                        <span style={{ fontWeight: '500' }}>{student.name}</span>
                      )}
                    </td>
                    
                    {/* Editable Email */}
                    <td style={{ padding: '16px' }}>
                      {editingId === student.id ? (
                        <input 
                          className="input-field" 
                          type="email" 
                          value={editData.email} 
                          onChange={e => setEditData({...editData, email: e.target.value})} 
                          style={{ padding: '8px 12px', fontSize: '14px', width: '100%', minWidth: '180px' }}
                          title="This updates contact email only. Login email remains unchanged."
                        />
                      ) : (
                        <span style={{ color: 'var(--text-secondary)' }}>{student.email}</span>
                      )}
                    </td>
                    
                    {/* Editable Batch */}
                    <td style={{ padding: '16px' }}>
                      {editingId === student.id ? (
                        <select className="input-field" value={editData.batch} onChange={e => setEditData({...editData, batch: e.target.value})} style={{ padding: '8px 12px', fontSize: '14px' }}>
                          {allBatches.map(b => <option key={b} value={b}>{b}</option>)}
                        </select>
                      ) : (
                        <span style={{ padding: '4px 10px', background: 'rgba(139,92,246,0.15)', borderRadius: '6px', fontSize: '13px', color: '#a78bfa' }}>{student.batch}</span>
                      )}
                    </td>
                    
                    {/* Editable Regulation */}
                    <td style={{ padding: '16px' }}>
                      {editingId === student.id ? (
                        <select className="input-field" value={editData.regulation} onChange={e => setEditData({...editData, regulation: e.target.value})} style={{ padding: '8px 12px', fontSize: '14px' }}>
                          {regulations.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                      ) : (
                        <span style={{ padding: '4px 10px', background: 'rgba(59,130,246,0.15)', borderRadius: '6px', fontSize: '13px', color: '#60a5fa' }}>{student.regulation}</span>
                      )}
                    </td>
                    
                    {/* Editable Status */}
                    <td style={{ padding: '16px' }}>
                      {editingId === student.id ? (
                        <select className="input-field" value={editData.status} onChange={e => setEditData({...editData, status: e.target.value})} style={{ padding: '8px 12px', fontSize: '14px' }}>
                          <option value="active">Active</option>
                          <option value="inactive">Inactive</option>
                          <option value="graduated">Graduated</option>
                        </select>
                      ) : (
                        <span style={{ padding: '4px 10px', background: student.status === 'active' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)', borderRadius: '6px', fontSize: '13px', color: student.status === 'active' ? '#10b981' : '#ef4444' }}>
                          {student.status || 'active'}
                        </span>
                      )}
                    </td>
                    
                    {/* Actions */}
                    <td style={{ padding: '16px' }}>
                      {editingId === student.id ? (
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button onClick={handleSaveEdit} disabled={saving} style={{ background: 'rgba(16,185,129,0.15)', border: 'none', padding: '8px', borderRadius: '6px', color: '#10b981', cursor: 'pointer', display: 'flex', alignItems: 'center' }} title="Save">
                            <Check size={16} />
                          </button>
                          <button onClick={handleCancelEdit} style={{ background: 'rgba(107,114,128,0.15)', border: 'none', padding: '8px', borderRadius: '6px', color: '#9ca3af', cursor: 'pointer', display: 'flex', alignItems: 'center' }} title="Cancel">
                            <X size={16} />
                          </button>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button onClick={() => handleStartEdit(student)} style={{ background: 'rgba(59,130,246,0.15)', border: 'none', padding: '8px', borderRadius: '6px', color: '#60a5fa', cursor: 'pointer', display: 'flex', alignItems: 'center' }} title="Edit">
                            <Edit2 size={16} />
                          </button>
                          <button onClick={() => handleDelete(student.id, student.regNum)} style={{ background: 'rgba(239,68,68,0.1)', border: 'none', padding: '8px', borderRadius: '6px', color: '#ef4444', cursor: 'pointer', display: 'inline-flex', alignItems: 'center' }} title="Delete">
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
    </div>
  );
}
