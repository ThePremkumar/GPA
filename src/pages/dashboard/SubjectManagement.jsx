import React, { useState, useEffect } from 'react';
import { rtdb } from '../../firebase/config';
import { ref, get, set } from 'firebase/database';
import { useRegulations } from '../../hooks/useRegulations';
import { subjectsData as initialSubjects } from '../../data/subjects';
import { Plus, Trash2, Edit2, Save, X, BookOpen, RefreshCw, Check } from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';
import { useAuth } from '../../contexts/AuthContext';

export default function SubjectManagement() {
  const { userRole, userData } = useAuth();
  const { addToast } = useToast();
  
  const isYearAdmin = userRole === 'year_admin';
  const assignedBatch = isYearAdmin ? userData?.assignedYear : null;
  
  const [regulation, setRegulation] = useState('2021');
  const [batch, setBatch] = useState(assignedBatch || '');
  const [semester, setSemester] = useState('1');
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newSubject, setNewSubject] = useState({ code: '', name: '', credits: 3 });
  
  // Edit state
  const [editingIndex, setEditingIndex] = useState(null);
  const [editData, setEditData] = useState({ code: '', name: '', credits: 3 });

  const { regulations: regulationData, regulationYears, getBatches, getRegulationByBatch } = useRegulations();
  const batches = getBatches(regulation);

  useEffect(() => {
    if (assignedBatch) {
      setBatch(assignedBatch);
      const reg = getRegulationByBatch(assignedBatch);
      setRegulation(reg);
    }
  }, [assignedBatch, getRegulationByBatch]);

  useEffect(() => {
    if (batch && semester) {
      fetchSubjects();
    }
  }, [batch, semester]);

  const fetchSubjects = async () => {
    setLoading(true);
    try {
      const subjectsRef = ref(rtdb, `subjects/${batch}/${semester}`);
      const snapshot = await get(subjectsRef);
      
      if (snapshot.exists()) {
        const data = snapshot.val();
        const subjectsList = Array.isArray(data) ? data : Object.values(data);
        setSubjects(subjectsList);
      } else {
        setSubjects(initialSubjects[batch]?.[semester] || []);
      }
    } catch (e) {
      console.error("Error fetching subjects:", e);
      setSubjects(initialSubjects[batch]?.[semester] || []);
    }
    setLoading(false);
  };

  const saveToRTDB = async (updatedSubjects) => {
    setSaving(true);
    try {
      const subjectsRef = ref(rtdb, `subjects/${batch}/${semester}`);
      await set(subjectsRef, updatedSubjects);
      addToast('Changes saved!', 'success');
    } catch (e) {
      console.error("Error saving subjects:", e);
      addToast('Failed to save changes', 'error');
    }
    setSaving(false);
  };

  const handleAddSubject = async () => {
    if (!newSubject.code || !newSubject.name || !newSubject.credits) {
      addToast('Please fill code, name and credits', 'error');
      return;
    }
    
    // Check for duplicate code
    if (subjects.some(s => s.code.toLowerCase() === newSubject.code.toLowerCase())) {
      addToast('Subject code already exists', 'error');
      return;
    }
    
    const updated = [...subjects, { ...newSubject, sem: parseInt(semester) }];
    setSubjects(updated);
    await saveToRTDB(updated);
    setNewSubject({ code: '', name: '', credits: 3 });
  };

  const handleDeleteSubject = async (index) => {
    if (!window.confirm('Delete this subject?')) return;
    const updated = subjects.filter((_, i) => i !== index);
    setSubjects(updated);
    await saveToRTDB(updated);
  };

  const handleStartEdit = (index) => {
    setEditingIndex(index);
    setEditData({
      code: subjects[index].code,
      name: subjects[index].name,
      credits: subjects[index].credits
    });
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
    setEditData({ code: '', name: '', credits: 3 });
  };

  const handleSaveEdit = async () => {
    if (!editData.code || !editData.name || !editData.credits) {
      addToast('Please fill all fields', 'error');
      return;
    }
    
    // Check for duplicate code (except current subject)
    const duplicateExists = subjects.some((s, i) => 
      i !== editingIndex && s.code.toLowerCase() === editData.code.toLowerCase()
    );
    if (duplicateExists) {
      addToast('Subject code already exists', 'error');
      return;
    }
    
    const updated = subjects.map((subject, index) => 
      index === editingIndex 
        ? { ...editData, credits: parseInt(editData.credits), sem: parseInt(semester) }
        : subject
    );
    
    setSubjects(updated);
    await saveToRTDB(updated);
    setEditingIndex(null);
    setEditData({ code: '', name: '', credits: 3 });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ margin: '0 0 8px', fontSize: '24px', fontWeight: '700' }}>Subject Management</h1>
          <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
            {isYearAdmin ? `Managing subjects for batch: ${assignedBatch}` : 'Add, edit, or remove subjects'}
          </p>
        </div>
        <button 
          onClick={fetchSubjects}
          disabled={loading}
          style={{ 
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '10px 16px', background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px',
            color: 'var(--text-primary)', cursor: 'pointer'
          }}
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: 'var(--text-secondary)' }}>Regulation</label>
            <select 
              className="input-field" 
              value={regulation} 
              onChange={e => { setRegulation(e.target.value); setBatch(''); }}
              disabled={isYearAdmin}
            >
              {regulations.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: 'var(--text-secondary)' }}>Batch</label>
            <select 
              className="input-field" 
              value={batch} 
              onChange={e => setBatch(e.target.value)}
              disabled={isYearAdmin}
            >
              <option value="">Select Batch</option>
              {batches.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: 'var(--text-secondary)' }}>Semester</label>
            <select className="input-field" value={semester} onChange={e => setSemester(e.target.value)}>
              {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>Semester {s}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Add Subject Form */}
      {batch && (
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: '600' }}>Add New Subject</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px', alignItems: 'end' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: 'var(--text-secondary)' }}>Subject Code *</label>
              <input 
                className="input-field" 
                placeholder="e.g., CS301"
                required
                value={newSubject.code} 
                onChange={e => setNewSubject({...newSubject, code: e.target.value.toUpperCase()})} 
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: 'var(--text-secondary)' }}>Subject Name *</label>
              <input 
                className="input-field" 
                placeholder="e.g., Data Structures"
                required
                value={newSubject.name} 
                onChange={e => setNewSubject({...newSubject, name: e.target.value})} 
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: 'var(--text-secondary)' }}>Credits *</label>
              <input 
                className="input-field" 
                type="number" 
                min="1" 
                max="6"
                required
                value={newSubject.credits} 
                onChange={e => setNewSubject({...newSubject, credits: parseInt(e.target.value) || 3})} 
              />
            </div>
            <button 
              className="btn-primary" 
              onClick={handleAddSubject}
              disabled={saving}
              style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <Plus size={16} /> Add Subject
            </button>
          </div>
        </div>
      )}

      {/* Subjects Table */}
      <div className="glass-panel" style={{ padding: '0', overflow: 'hidden' }}>
        {!batch ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <BookOpen size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
            <p>Select a batch to view subjects</p>
          </div>
        ) : loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading subjects...</div>
        ) : subjects.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <BookOpen size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
            <p>No subjects found for this batch/semester</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.03)' }}>
                  <th style={{ padding: '16px', fontSize: '13px', color: 'var(--text-secondary)', width: '50px' }}>#</th>
                  <th style={{ padding: '16px', fontSize: '13px', color: 'var(--text-secondary)', width: '120px' }}>Code</th>
                  <th style={{ padding: '16px', fontSize: '13px', color: 'var(--text-secondary)' }}>Name</th>
                  <th style={{ padding: '16px', fontSize: '13px', color: 'var(--text-secondary)', width: '100px' }}>Credits</th>
                  <th style={{ padding: '16px', fontSize: '13px', color: 'var(--text-secondary)', width: '120px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {subjects.map((subject, index) => (
                  <tr key={index} style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '16px', color: 'var(--text-secondary)' }}>{index + 1}</td>
                    
                    {/* Editable Code */}
                    <td style={{ padding: '16px' }}>
                      {editingIndex === index ? (
                        <input 
                          className="input-field"
                          value={editData.code}
                          onChange={e => setEditData({...editData, code: e.target.value.toUpperCase()})}
                          style={{ padding: '8px 12px', fontSize: '14px' }}
                        />
                      ) : (
                        <span style={{ fontFamily: 'monospace' }}>{subject.code}</span>
                      )}
                    </td>
                    
                    {/* Editable Name */}
                    <td style={{ padding: '16px' }}>
                      {editingIndex === index ? (
                        <input 
                          className="input-field"
                          value={editData.name}
                          onChange={e => setEditData({...editData, name: e.target.value})}
                          style={{ padding: '8px 12px', fontSize: '14px', width: '100%' }}
                        />
                      ) : (
                        <span style={{ fontWeight: '500' }}>{subject.name}</span>
                      )}
                    </td>
                    
                    {/* Editable Credits */}
                    <td style={{ padding: '16px' }}>
                      {editingIndex === index ? (
                        <input 
                          className="input-field"
                          type="number"
                          min="1"
                          max="6"
                          value={editData.credits}
                          onChange={e => setEditData({...editData, credits: parseInt(e.target.value) || 3})}
                          style={{ padding: '8px 12px', fontSize: '14px', width: '70px' }}
                        />
                      ) : (
                        <span style={{ 
                          padding: '4px 10px', 
                          background: 'rgba(139,92,246,0.15)', 
                          borderRadius: '6px', 
                          fontSize: '13px',
                          color: '#a78bfa'
                        }}>
                          {subject.credits}
                        </span>
                      )}
                    </td>
                    
                    {/* Actions */}
                    <td style={{ padding: '16px' }}>
                      {editingIndex === index ? (
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button 
                            onClick={handleSaveEdit}
                            disabled={saving}
                            style={{ 
                              background: 'rgba(16,185,129,0.15)', 
                              border: 'none', 
                              padding: '8px', 
                              borderRadius: '6px', 
                              color: '#10b981', 
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center'
                            }}
                            title="Save"
                          >
                            <Check size={16} />
                          </button>
                          <button 
                            onClick={handleCancelEdit}
                            style={{ 
                              background: 'rgba(107,114,128,0.15)', 
                              border: 'none', 
                              padding: '8px', 
                              borderRadius: '6px', 
                              color: '#9ca3af', 
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center'
                            }}
                            title="Cancel"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button 
                            onClick={() => handleStartEdit(index)}
                            style={{ 
                              background: 'rgba(59,130,246,0.15)', 
                              border: 'none', 
                              padding: '8px', 
                              borderRadius: '6px', 
                              color: '#60a5fa', 
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center'
                            }}
                            title="Edit"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button 
                            onClick={() => handleDeleteSubject(index)} 
                            style={{ 
                              background: 'rgba(239,68,68,0.15)', 
                              border: 'none', 
                              padding: '8px', 
                              borderRadius: '6px', 
                              color: '#ef4444', 
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center'
                            }}
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

      {/* Summary */}
      {batch && subjects.length > 0 && (
        <div className="glass-panel" style={{ padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: 'var(--text-secondary)' }}>
            Total: <strong style={{ color: 'var(--text-primary)' }}>{subjects.length}</strong> subjects
          </span>
          <span style={{ color: 'var(--text-secondary)' }}>
            Total Credits: <strong style={{ color: 'var(--text-primary)' }}>{subjects.reduce((sum, s) => sum + (parseInt(s.credits) || 0), 0)}</strong>
          </span>
        </div>
      )}
    </div>
  );
}
