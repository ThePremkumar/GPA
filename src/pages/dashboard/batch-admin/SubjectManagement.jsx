/**
 * Batch Admin Subject Management
 * View and manage subjects for assigned batch
 */
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useToast } from '../../../contexts/ToastContext';
import { Plus, Trash2, BookOpen, Edit2, Check, X, RefreshCw } from 'lucide-react';
import { rtdb } from '../../../firebase/config';
import { ref, get, set } from 'firebase/database';
import { getRegulationByBatch } from '../../../data/regulations';
import { subjectsData } from '../../../data/subjects';
import { logActivity, ACTIVITY_TYPES } from '../../../services/activityService';

export default function BatchSubjectManagement() {
  const { userData, currentUser } = useAuth();
  const { addToast } = useToast();
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedSemester, setSelectedSemester] = useState('1');
  
  // Edit state
  const [editingIndex, setEditingIndex] = useState(null);
  const [editData, setEditData] = useState({ code: '', name: '', credits: '' });
  
  // New subject state
  const [showAddForm, setShowAddForm] = useState(false);
  const [newSubject, setNewSubject] = useState({ code: '', name: '', credits: '' });
  
  const assignedBatch = userData?.assignedBatch || userData?.assignedYear;
  const regulation = getRegulationByBatch(assignedBatch);
  const semesters = ['1', '2', '3', '4', '5', '6', '7', '8'];

  useEffect(() => {
    if (assignedBatch && selectedSemester) {
      fetchSubjects();
    }
  }, [assignedBatch, selectedSemester]);

  async function fetchSubjects() {
    setLoading(true);
    try {
      const subjectRef = ref(rtdb, `subjects/${assignedBatch}/${selectedSemester}`);
      const snapshot = await get(subjectRef);
      
      if (snapshot.exists()) {
        const data = snapshot.val();
        setSubjects(Array.isArray(data) ? data : Object.values(data));
      } else {
        // Fallback to local data
        const localSubjects = subjectsData[assignedBatch]?.[selectedSemester] || [];
        setSubjects(localSubjects);
      }
    } catch (error) {
      console.error('Error fetching subjects:', error);
      addToast('Failed to fetch subjects', 'error');
      // Fallback to local data
      const localSubjects = subjectsData[assignedBatch]?.[selectedSemester] || [];
      setSubjects(localSubjects);
    } finally {
      setLoading(false);
    }
  }

  async function saveSubjectsToRTDB(updatedSubjects) {
    try {
      const subjectRef = ref(rtdb, `subjects/${assignedBatch}/${selectedSemester}`);
      await set(subjectRef, updatedSubjects);
      
      // Update timestamp
      const metaRef = ref(rtdb, `subjects/${assignedBatch}/updatedAt`);
      await set(metaRef, Date.now());
      
      return true;
    } catch (error) {
      console.error('Error saving subjects:', error);
      throw error;
    }
  }

  async function handleAddSubject(e) {
    e.preventDefault();
    
    if (!newSubject.code || !newSubject.name || !newSubject.credits) {
      addToast('All fields are required', 'error');
      return;
    }
    
    // Check for duplicate code
    const codeExists = subjects.some(s => s.code.toLowerCase() === newSubject.code.toLowerCase());
    if (codeExists) {
      addToast('Subject code already exists', 'error');
      return;
    }
    
    setSaving(true);
    try {
      const subjectToAdd = {
        sem: parseInt(selectedSemester),
        code: newSubject.code.toUpperCase(),
        name: newSubject.name,
        credits: parseFloat(newSubject.credits)
      };
      
      const updatedSubjects = [...subjects, subjectToAdd];
      await saveSubjectsToRTDB(updatedSubjects);
      
      setSubjects(updatedSubjects);
      setNewSubject({ code: '', name: '', credits: '' });
      setShowAddForm(false);
      
      // Log activity
      await logActivity({
        type: ACTIVITY_TYPES.SUBJECT_CREATED,
        adminId: currentUser.uid,
        adminName: userData?.fullName || userData?.email,
        adminEmail: userData?.email,
        batch: assignedBatch,
        details: { subjectCode: newSubject.code, subjectName: newSubject.name, semester: selectedSemester }
      });
      
      addToast('Subject added successfully!', 'success');
    } catch (error) {
      addToast('Failed to add subject', 'error');
    } finally {
      setSaving(false);
    }
  }

  function handleStartEdit(index) {
    const subject = subjects[index];
    setEditingIndex(index);
    setEditData({
      code: subject.code,
      name: subject.name,
      credits: subject.credits.toString()
    });
  }

  function handleCancelEdit() {
    setEditingIndex(null);
    setEditData({ code: '', name: '', credits: '' });
  }

  async function handleSaveEdit() {
    if (!editData.code || !editData.name || !editData.credits) {
      addToast('All fields are required', 'error');
      return;
    }
    
    // Check for duplicate code (excluding current)
    const codeExists = subjects.some((s, i) => 
      i !== editingIndex && s.code.toLowerCase() === editData.code.toLowerCase()
    );
    if (codeExists) {
      addToast('Subject code already exists', 'error');
      return;
    }
    
    setSaving(true);
    try {
      const updatedSubjects = subjects.map((subject, index) => {
        if (index === editingIndex) {
          return {
            ...subject,
            code: editData.code.toUpperCase(),
            name: editData.name,
            credits: parseFloat(editData.credits)
          };
        }
        return subject;
      });
      
      await saveSubjectsToRTDB(updatedSubjects);
      
      setSubjects(updatedSubjects);
      setEditingIndex(null);
      setEditData({ code: '', name: '', credits: '' });
      
      // Log activity
      await logActivity({
        type: ACTIVITY_TYPES.SUBJECT_UPDATED,
        adminId: currentUser.uid,
        adminName: userData?.fullName || userData?.email,
        adminEmail: userData?.email,
        batch: assignedBatch,
        details: { subjectCode: editData.code, subjectName: editData.name, semester: selectedSemester }
      });
      
      addToast('Subject updated successfully!', 'success');
    } catch (error) {
      addToast('Failed to update subject', 'error');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(index) {
    if (!window.confirm('Delete this subject?')) return;
    
    const subjectToDelete = subjects[index];
    
    setSaving(true);
    try {
      const updatedSubjects = subjects.filter((_, i) => i !== index);
      await saveSubjectsToRTDB(updatedSubjects);
      
      // Log activity
      await logActivity({
        type: ACTIVITY_TYPES.SUBJECT_DELETED,
        adminId: currentUser.uid,
        adminName: userData?.fullName || userData?.email,
        adminEmail: userData?.email,
        batch: assignedBatch,
        details: { subjectCode: subjectToDelete.code, subjectName: subjectToDelete.name, semester: selectedSemester }
      });
      
      setSubjects(updatedSubjects);
      addToast('Subject deleted', 'success');
    } catch (error) {
      addToast('Failed to delete subject', 'error');
    } finally {
      setSaving(false);
    }
  }

  const totalCredits = subjects.reduce((sum, s) => sum + (parseFloat(s.credits) || 0), 0);

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ margin: '0 0 8px', fontSize: '24px' }}>Subject Management</h1>
          <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
            Manage subjects for {assignedBatch} • Regulation {regulation}
          </p>
        </div>
        <button 
          className="btn-primary" 
          onClick={() => setShowAddForm(!showAddForm)}
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          {showAddForm ? <X size={18} /> : <Plus size={18} />}
          {showAddForm ? 'Cancel' : 'Add Subject'}
        </button>
      </div>

      {/* Semester Selector */}
      <div className="glass-panel" style={{ padding: '16px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <span style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Select Semester:</span>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {semesters.map(sem => (
              <button
                key={sem}
                onClick={() => setSelectedSemester(sem)}
                style={{
                  padding: '8px 16px',
                  background: selectedSemester === sem ? 'var(--accent-primary)' : 'rgba(255,255,255,0.05)',
                  border: selectedSemester === sem ? 'none' : '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  color: selectedSemester === sem ? 'white' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontWeight: selectedSemester === sem ? '600' : '400',
                  transition: 'all 0.2s'
                }}
              >
                Sem {sem}
              </button>
            ))}
          </div>
          <button 
            onClick={fetchSubjects} 
            disabled={loading}
            style={{ 
              padding: '8px', 
              background: 'rgba(255,255,255,0.05)', 
              border: '1px solid rgba(255,255,255,0.1)', 
              borderRadius: '8px', 
              color: 'var(--text-secondary)', 
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center'
            }}
            title="Refresh"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Add Subject Form */}
      {showAddForm && (
        <div className="glass-panel" style={{ padding: '24px', marginBottom: '24px' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: '16px' }}>Add New Subject</h3>
          <form onSubmit={handleAddSubject}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                  Subject Code *
                </label>
                <input 
                  className="input-field" 
                  placeholder="e.g., CS301" 
                  value={newSubject.code} 
                  onChange={e => setNewSubject({...newSubject, code: e.target.value})}
                  required
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                  Subject Name *
                </label>
                <input 
                  className="input-field" 
                  placeholder="e.g., Data Structures" 
                  value={newSubject.name} 
                  onChange={e => setNewSubject({...newSubject, name: e.target.value})}
                  required
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                  Credits *
                </label>
                <input 
                  className="input-field" 
                  type="number" 
                  step="0.5"
                  min="0"
                  placeholder="e.g., 3" 
                  value={newSubject.credits} 
                  onChange={e => setNewSubject({...newSubject, credits: e.target.value})}
                  required
                />
              </div>
            </div>
            <div style={{ marginTop: '16px' }}>
              <button type="submit" className="btn-primary" disabled={saving}>
                {saving ? 'Adding...' : 'Add Subject'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Subjects Table */}
      <div className="glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            Loading subjects...
          </div>
        ) : subjects.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <BookOpen size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
            <h3>No subjects found</h3>
            <p>Add subjects for Semester {selectedSemester}</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.03)' }}>
                  <th style={{ padding: '14px 20px', textAlign: 'left', fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', width: '50px' }}>#</th>
                  <th style={{ padding: '14px 20px', textAlign: 'left', fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Code</th>
                  <th style={{ padding: '14px 20px', textAlign: 'left', fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Subject Name</th>
                  <th style={{ padding: '14px 20px', textAlign: 'center', fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Credits</th>
                  <th style={{ padding: '14px 20px', textAlign: 'left', fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {subjects.map((subject, index) => (
                  <tr key={index} style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '14px 20px', color: 'var(--text-secondary)' }}>{index + 1}</td>
                    
                    {/* Code */}
                    <td style={{ padding: '14px 20px' }}>
                      {editingIndex === index ? (
                        <input 
                          className="input-field" 
                          value={editData.code} 
                          onChange={e => setEditData({...editData, code: e.target.value})}
                          style={{ padding: '8px 12px', fontSize: '14px', width: '100px' }}
                        />
                      ) : (
                        <span style={{ fontFamily: 'monospace', padding: '4px 8px', background: 'rgba(59,130,246,0.15)', borderRadius: '4px', color: '#60a5fa' }}>
                          {subject.code}
                        </span>
                      )}
                    </td>
                    
                    {/* Name */}
                    <td style={{ padding: '14px 20px' }}>
                      {editingIndex === index ? (
                        <input 
                          className="input-field" 
                          value={editData.name} 
                          onChange={e => setEditData({...editData, name: e.target.value})}
                          style={{ padding: '8px 12px', fontSize: '14px', width: '100%', minWidth: '200px' }}
                        />
                      ) : (
                        <span style={{ fontWeight: '500' }}>{subject.name}</span>
                      )}
                    </td>
                    
                    {/* Credits */}
                    <td style={{ padding: '14px 20px', textAlign: 'center' }}>
                      {editingIndex === index ? (
                        <input 
                          className="input-field" 
                          type="number"
                          step="0.5"
                          min="0"
                          value={editData.credits} 
                          onChange={e => setEditData({...editData, credits: e.target.value})}
                          style={{ padding: '8px 12px', fontSize: '14px', width: '70px', textAlign: 'center' }}
                        />
                      ) : (
                        <span style={{ padding: '4px 12px', background: 'rgba(139,92,246,0.15)', borderRadius: '12px', color: '#a78bfa', fontWeight: '600' }}>
                          {subject.credits}
                        </span>
                      )}
                    </td>
                    
                    {/* Actions */}
                    <td style={{ padding: '14px 20px' }}>
                      {editingIndex === index ? (
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
                            onClick={() => handleStartEdit(index)}
                            style={{ background: 'rgba(59,130,246,0.15)', border: 'none', padding: '8px', borderRadius: '6px', color: '#60a5fa', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                            title="Edit"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button 
                            onClick={() => handleDelete(index)}
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
        
        {/* Summary */}
        {subjects.length > 0 && (
          <div style={{ 
            padding: '16px 20px', 
            borderTop: '1px solid rgba(255,255,255,0.05)', 
            background: 'rgba(255,255,255,0.02)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            <span style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
              Total: <strong style={{ color: 'var(--text-primary)' }}>{subjects.length}</strong> subjects
            </span>
            <span style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
              Total Credits: <strong style={{ color: '#a78bfa' }}>{totalCredits}</strong>
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
