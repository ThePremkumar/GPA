/**
 * Regulation and Batch Management
 * Full CRUD operations for regulations and batches
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useToast } from '../../../contexts/ToastContext';
import { FileText, Plus, Trash2, Calendar, ChevronRight, X, RefreshCw, Edit2, Check, Users, BookOpen } from 'lucide-react';
import { rtdb } from '../../../firebase/config';
import { ref, get, set } from 'firebase/database';
import { RegulationMapping } from '../../../data/regulations';

export default function RegulationManagement() {
  const { userData, currentUser } = useAuth();
  const { addToast } = useToast();
  
  const [regulations, setRegulations] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedReg, setSelectedReg] = useState(null);
  
  // Modals
  const [showAddRegModal, setShowAddRegModal] = useState(false);
  const [showAddBatchModal, setShowAddBatchModal] = useState(false);
  const [showEditRegModal, setShowEditRegModal] = useState(false);
  const [showEditBatchModal, setShowEditBatchModal] = useState(false);
  const [confirmModal, setConfirmModal] = useState({ show: false, title: '', message: '', onConfirm: null });
  
  // Form data
  const [newRegYear, setNewRegYear] = useState('');
  const [newBatch, setNewBatch] = useState('');
  const [editRegData, setEditRegData] = useState({ oldYear: '', newYear: '' });
  const [editBatchData, setEditBatchData] = useState({ oldBatch: '', newBatch: '' });
  
  // Stats
  const [batchStats, setBatchStats] = useState({});

  useEffect(() => { 
    fetchRegulations(); 
  }, []);

  useEffect(() => {
    if (Object.keys(regulations).length > 0) {
      fetchBatchStats();
    }
  }, [regulations]);

  async function fetchRegulations() {
    setLoading(true);
    try {
      const snapshot = await get(ref(rtdb, 'regulations'));
      if (snapshot.exists()) {
        setRegulations(snapshot.val());
      } else {
        // Fallback to static data
        setRegulations(RegulationMapping);
      }
    } catch (error) {
      console.error('Error fetching regulations:', error);
      setRegulations(RegulationMapping);
    } finally {
      setLoading(false);
    }
  }

  async function fetchBatchStats() {
    try {
      const studentsSnapshot = await get(ref(rtdb, 'students'));
      const stats = {};
      
      if (studentsSnapshot.exists()) {
        const students = studentsSnapshot.val();
        Object.values(students).forEach(student => {
          const batch = student.batch;
          if (batch) {
            stats[batch] = (stats[batch] || 0) + 1;
          }
        });
      }
      
      setBatchStats(stats);
    } catch (error) {
      console.error('Error fetching batch stats:', error);
    }
  }

  async function saveRegulations(updatedRegs, successMessage = 'Saved successfully') {
    setSaving(true);
    try {
      await set(ref(rtdb, 'regulations'), updatedRegs);
      setRegulations(updatedRegs);
      addToast(successMessage, 'success');
      return true;
    } catch (error) {
      console.error('Error saving regulations:', error);
      addToast('Failed to save', 'error');
      return false;
    } finally {
      setSaving(false);
    }
  }

  // Add Regulation
  async function handleAddRegulation(e) {
    e.preventDefault();
    if (!newRegYear) return;
    
    if (regulations[newRegYear]) {
      addToast('Regulation already exists', 'error');
      return;
    }
    
    const updatedRegs = { ...regulations, [newRegYear]: [] };
    const success = await saveRegulations(updatedRegs, 'Regulation added successfully');
    if (success) {
      setNewRegYear('');
      setShowAddRegModal(false);
      setSelectedReg(newRegYear);
    }
  }

  // Edit Regulation
  async function handleEditRegulation(e) {
    e.preventDefault();
    if (!editRegData.oldYear || !editRegData.newYear) return;
    
    if (editRegData.oldYear === editRegData.newYear) {
      setShowEditRegModal(false);
      return;
    }
    
    if (regulations[editRegData.newYear]) {
      addToast('Regulation already exists', 'error');
      return;
    }
    
    const updatedRegs = { ...regulations };
    updatedRegs[editRegData.newYear] = updatedRegs[editRegData.oldYear];
    delete updatedRegs[editRegData.oldYear];
    
    const success = await saveRegulations(updatedRegs, 'Regulation updated successfully');
    if (success) {
      setSelectedReg(editRegData.newYear);
      setShowEditRegModal(false);
      setEditRegData({ oldYear: '', newYear: '' });
    }
  }

  // Delete Regulation
  function handleDeleteRegulation(regYear) {
    const batchCount = regulations[regYear]?.length || 0;
    const studentCount = (regulations[regYear] || []).reduce((sum, batch) => sum + (batchStats[batch] || 0), 0);
    
    const confirmMsg = studentCount > 0 
      ? `This regulation has ${batchCount} batches and ${studentCount} students. Are you sure you want to delete it?`
      : `Are you sure you want to delete Regulation ${regYear}?`;
    
    setConfirmModal({
      show: true,
      title: `Delete Regulation ${regYear}`,
      message: confirmMsg,
      onConfirm: async () => {
        setSaving(true);
        try {
          const updatedRegs = { ...regulations };
          delete updatedRegs[regYear];
          
          if (Object.keys(updatedRegs).filter(k => k !== 'placeholder').length === 0) {
            await set(ref(rtdb, 'regulations'), { _placeholder: true });
            setRegulations({});
          } else {
            await set(ref(rtdb, 'regulations'), updatedRegs);
            setRegulations(updatedRegs);
          }
          
          addToast('Regulation deleted successfully', 'success');
          
          if (selectedReg === regYear) {
            setSelectedReg(null);
          }
        } catch (error) {
          console.error('Error deleting regulation:', error);
          addToast('Failed to delete regulation', 'error');
        } finally {
          setSaving(false);
          setConfirmModal({ show: false, title: '', message: '', onConfirm: null });
        }
      }
    });
  }

  // Add Batch
  async function handleAddBatch(e) {
    e.preventDefault();
    if (!selectedReg || !newBatch) return;
    
    if ((regulations[selectedReg] || []).includes(newBatch)) {
      addToast('Batch already exists', 'error');
      return;
    }
    
    const updatedRegs = { 
      ...regulations, 
      [selectedReg]: [...(regulations[selectedReg] || []), newBatch] 
    };
    
    const success = await saveRegulations(updatedRegs, 'Batch added successfully');
    if (success) {
      setNewBatch('');
      setShowAddBatchModal(false);
    }
  }

  // Edit Batch
  async function handleEditBatch(e) {
    e.preventDefault();
    if (!selectedReg || !editBatchData.oldBatch || !editBatchData.newBatch) return;
    
    if (editBatchData.oldBatch === editBatchData.newBatch) {
      setShowEditBatchModal(false);
      return;
    }
    
    if ((regulations[selectedReg] || []).includes(editBatchData.newBatch)) {
      addToast('Batch already exists', 'error');
      return;
    }
    
    const updatedBatches = (regulations[selectedReg] || []).map(b => 
      b === editBatchData.oldBatch ? editBatchData.newBatch : b
    );
    
    const updatedRegs = { ...regulations, [selectedReg]: updatedBatches };
    
    const success = await saveRegulations(updatedRegs, 'Batch updated successfully');
    if (success) {
      setShowEditBatchModal(false);
      setEditBatchData({ oldBatch: '', newBatch: '' });
    }
  }

  // Delete Batch
  function handleDeleteBatch(regulation, batchToDelete) {
    const studentCount = batchStats[batchToDelete] || 0;
    
    const confirmMsg = studentCount > 0 
      ? `Batch ${batchToDelete} has ${studentCount} students. Are you sure you want to delete it?`
      : `Are you sure you want to delete batch ${batchToDelete}?`;
    
    setConfirmModal({
      show: true,
      title: `Delete Batch ${batchToDelete}`,
      message: confirmMsg,
      onConfirm: async () => {
        setSaving(true);
        try {
          const currentBatches = regulations[regulation] || [];
          const updatedBatches = currentBatches.filter(b => b !== batchToDelete);
          
          const updatedRegs = { 
            ...regulations, 
            [regulation]: updatedBatches
          };
          
          await set(ref(rtdb, 'regulations'), updatedRegs);
          setRegulations(updatedRegs);
          addToast('Batch deleted successfully', 'success');
        } catch (error) {
          console.error('Error deleting batch:', error);
          addToast('Failed to delete batch', 'error');
        } finally {
          setSaving(false);
          setConfirmModal({ show: false, title: '', message: '', onConfirm: null });
        }
      }
    });
  }

  // Open edit modals
  function openEditRegModal(regYear) {
    setEditRegData({ oldYear: regYear, newYear: regYear });
    setShowEditRegModal(true);
  }

  function openEditBatchModal(batch) {
    setEditBatchData({ oldBatch: batch, newBatch: batch });
    setShowEditBatchModal(true);
  }

  const regulationsList = Object.keys(regulations).filter(k => !k.includes('placeholder')).sort((a, b) => b - a);
  const totalBatches = regulationsList.reduce((sum, reg) => sum + (regulations[reg]?.length || 0), 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ margin: '0 0 8px', fontSize: '24px', fontWeight: '700' }}>Regulations & Batches</h1>
          <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
            {regulationsList.length} regulations • {totalBatches} batches
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button 
            onClick={fetchRegulations} 
            disabled={loading} 
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'var(--text-primary)', cursor: 'pointer' }}
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
          <button className="btn-primary" onClick={() => setShowAddRegModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Plus size={18} /> Add Regulation
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(280px, 300px) 1fr', gap: '24px', minHeight: '500px' }}>
        {/* Regulations List */}
        <div className="glass-panel" style={{ padding: 0, alignSelf: 'start' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <h3 style={{ margin: 0, fontSize: '15px' }}>Regulations</h3>
          </div>
          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading...</div>
          ) : (
            <div>
              {regulationsList.map(reg => (
                <div 
                  key={reg} 
                  style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    padding: '14px 20px', 
                    cursor: 'pointer', 
                    background: selectedReg === reg ? 'rgba(59,130,246,0.1)' : 'transparent', 
                    borderLeft: selectedReg === reg ? '3px solid var(--accent-primary)' : '3px solid transparent',
                    transition: 'all 0.2s'
                  }}
                >
                  <div 
                    onClick={() => setSelectedReg(reg)} 
                    style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}
                  >
                    <FileText size={18} color={selectedReg === reg ? '#3b82f6' : 'var(--text-secondary)'} />
                    <span style={{ fontWeight: selectedReg === reg ? '600' : '400' }}>Regulation {reg}</span>
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: '4px' }}>
                      {regulations[reg]?.length || 0}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button 
                      onClick={(e) => { e.stopPropagation(); openEditRegModal(reg); }}
                      style={{ background: 'none', border: 'none', padding: '6px', color: 'var(--text-secondary)', cursor: 'pointer', borderRadius: '4px' }}
                      title="Edit"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleDeleteRegulation(reg); }}
                      style={{ background: 'none', border: 'none', padding: '6px', color: '#ef4444', cursor: 'pointer', borderRadius: '4px' }}
                      title="Delete"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
              {regulationsList.length === 0 && (
                <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  <FileText size={40} style={{ marginBottom: '12px', opacity: 0.5 }} />
                  <p>No regulations yet</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Batches Panel */}
        <div className="glass-panel" style={{ padding: 0 }}>
          {selectedReg ? (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <div>
                  <h3 style={{ margin: '0 0 4px', fontSize: '17px', fontWeight: '600' }}>Regulation {selectedReg}</h3>
                  <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                    {regulations[selectedReg]?.length || 0} batches
                  </span>
                </div>
                <button 
                  onClick={() => setShowAddBatchModal(true)} 
                  className="btn-primary"
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px' }}
                >
                  <Plus size={16} /> Add Batch
                </button>
              </div>
              
              <div style={{ padding: '20px' }}>
                {regulations[selectedReg]?.length > 0 ? (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
                    {regulations[selectedReg].map(batch => {
                      const studentCount = batchStats[batch] || 0;
                      return (
                        <div 
                          key={batch} 
                          style={{ 
                            padding: '16px', 
                            background: 'rgba(255,255,255,0.03)', 
                            border: '1px solid rgba(255,255,255,0.08)', 
                            borderRadius: '12px',
                            transition: 'all 0.2s'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <div style={{ 
                                width: '36px', 
                                height: '36px', 
                                borderRadius: '10px', 
                                background: 'linear-gradient(135deg, rgba(59,130,246,0.2), rgba(139,92,246,0.2))',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}>
                                <Calendar size={18} color="#60a5fa" />
                              </div>
                              <span style={{ fontWeight: '600', fontSize: '15px' }}>{batch}</span>
                            </div>
                            <div style={{ display: 'flex', gap: '4px' }}>
                              <button 
                                onClick={() => openEditBatchModal(batch)}
                                style={{ background: 'none', border: 'none', padding: '6px', color: 'var(--text-secondary)', cursor: 'pointer', borderRadius: '4px' }}
                                title="Edit"
                              >
                                <Edit2 size={14} />
                              </button>
                              <button 
                                onClick={() => handleDeleteBatch(selectedReg, batch)}
                                style={{ background: 'none', border: 'none', padding: '6px', color: '#ef4444', cursor: 'pointer', borderRadius: '4px' }}
                                title="Delete"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: '16px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <Users size={14} /> {studentCount} students
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-secondary)' }}>
                    <Calendar size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
                    <h4 style={{ margin: '0 0 8px' }}>No batches yet</h4>
                    <p style={{ margin: 0 }}>Add a batch to this regulation</p>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '400px', color: 'var(--text-secondary)', flexDirection: 'column', gap: '12px' }}>
              <ChevronRight size={40} style={{ opacity: 0.3 }} />
              <p>Select a regulation to view batches</p>
            </div>
          )}
        </div>
      </div>

      {/* Add Regulation Modal */}
      {showAddRegModal && (
        <Modal title="Add Regulation" onClose={() => setShowAddRegModal(false)}>
          <form onSubmit={handleAddRegulation}>
            <div style={{ padding: '24px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: 'var(--text-secondary)' }}>Regulation Year *</label>
              <input 
                className="input-field" 
                placeholder="e.g., 2024" 
                value={newRegYear} 
                onChange={e => setNewRegYear(e.target.value)} 
                required 
              />
              <p style={{ margin: '12px 0 0', fontSize: '12px', color: 'var(--text-secondary)' }}>
                Enter the academic year for this regulation (e.g., 2021, 2023, 2024)
              </p>
            </div>
            <ModalFooter onCancel={() => setShowAddRegModal(false)} submitText="Add Regulation" saving={saving} />
          </form>
        </Modal>
      )}

      {/* Edit Regulation Modal */}
      {showEditRegModal && (
        <Modal title="Edit Regulation" onClose={() => setShowEditRegModal(false)}>
          <form onSubmit={handleEditRegulation}>
            <div style={{ padding: '24px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: 'var(--text-secondary)' }}>Regulation Year *</label>
              <input 
                className="input-field" 
                placeholder="e.g., 2024" 
                value={editRegData.newYear} 
                onChange={e => setEditRegData({ ...editRegData, newYear: e.target.value })} 
                required 
              />
            </div>
            <ModalFooter onCancel={() => setShowEditRegModal(false)} submitText="Save Changes" saving={saving} />
          </form>
        </Modal>
      )}

      {/* Add Batch Modal */}
      {showAddBatchModal && (
        <Modal title={`Add Batch to Regulation ${selectedReg}`} onClose={() => setShowAddBatchModal(false)}>
          <form onSubmit={handleAddBatch}>
            <div style={{ padding: '24px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: 'var(--text-secondary)' }}>Batch Name *</label>
              <input 
                className="input-field" 
                placeholder="e.g., 2024-2028" 
                value={newBatch} 
                onChange={e => setNewBatch(e.target.value)} 
                required 
              />
              <p style={{ margin: '12px 0 0', fontSize: '12px', color: 'var(--text-secondary)' }}>
                Format: start year - end year (e.g., 2022-2026, 2023-2027)
              </p>
            </div>
            <ModalFooter onCancel={() => setShowAddBatchModal(false)} submitText="Add Batch" saving={saving} />
          </form>
        </Modal>
      )}

      {/* Edit Batch Modal */}
      {showEditBatchModal && (
        <Modal title="Edit Batch" onClose={() => setShowEditBatchModal(false)}>
          <form onSubmit={handleEditBatch}>
            <div style={{ padding: '24px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: 'var(--text-secondary)' }}>Batch Name *</label>
              <input 
                className="input-field" 
                placeholder="e.g., 2024-2028" 
                value={editBatchData.newBatch} 
                onChange={e => setEditBatchData({ ...editBatchData, newBatch: e.target.value })} 
                required 
              />
            </div>
            <ModalFooter onCancel={() => setShowEditBatchModal(false)} submitText="Save Changes" saving={saving} />
          </form>
        </Modal>
      )}

      {/* Confirm Delete Modal */}
      {confirmModal.show && (
        <div 
          style={{ 
            position: 'fixed', 
            inset: 0, 
            background: 'rgba(0,0,0,0.75)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            zIndex: 1001, 
            padding: '16px' 
          }}
        >
          <div style={{ 
            background: 'var(--bg-secondary)', 
            border: '1px solid rgba(255,255,255,0.1)', 
            borderRadius: '16px', 
            width: '100%', 
            maxWidth: '400px',
            animation: 'fadeIn 0.2s ease'
          }}>
            <div style={{ padding: '24px', textAlign: 'center' }}>
              <div style={{ 
                width: '56px', 
                height: '56px', 
                borderRadius: '50%', 
                background: 'rgba(239,68,68,0.15)', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                margin: '0 auto 16px'
              }}>
                <Trash2 size={28} color="#ef4444" />
              </div>
              <h3 style={{ margin: '0 0 8px', fontSize: '18px', fontWeight: '600' }}>
                {confirmModal.title}
              </h3>
              <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '14px', lineHeight: 1.5 }}>
                {confirmModal.message}
              </p>
            </div>
            <div style={{ 
              display: 'flex', 
              gap: '12px', 
              padding: '16px 24px', 
              borderTop: '1px solid rgba(255,255,255,0.05)' 
            }}>
              <button 
                onClick={() => setConfirmModal({ show: false, title: '', message: '', onConfirm: null })}
                style={{ 
                  flex: 1,
                  padding: '12px', 
                  background: 'rgba(255,255,255,0.05)', 
                  border: '1px solid rgba(255,255,255,0.1)', 
                  borderRadius: '8px', 
                  color: 'var(--text-primary)', 
                  cursor: 'pointer',
                  fontWeight: '500'
                }}
              >
                Cancel
              </button>
              <button 
                onClick={confirmModal.onConfirm}
                disabled={saving}
                style={{ 
                  flex: 1,
                  padding: '12px', 
                  background: '#ef4444', 
                  border: 'none', 
                  borderRadius: '8px', 
                  color: 'white', 
                  cursor: 'pointer',
                  fontWeight: '500'
                }}
              >
                {saving ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Reusable Modal Component
function Modal({ title, children, onClose }) {
  return (
    <div 
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }} 
      onClick={onClose}
    >
      <div 
        onClick={e => e.stopPropagation()} 
        style={{ background: 'var(--bg-secondary)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', width: '100%', maxWidth: '420px' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <h2 style={{ margin: 0, fontSize: '18px' }}>{title}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '4px' }}>
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

// Reusable Modal Footer
function ModalFooter({ onCancel, submitText, saving }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', padding: '16px 24px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
      <button 
        type="button" 
        onClick={onCancel} 
        style={{ padding: '10px 20px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'var(--text-primary)', cursor: 'pointer' }}
      >
        Cancel
      </button>
      <button type="submit" className="btn-primary" disabled={saving}>
        {saving ? 'Saving...' : submitText}
      </button>
    </div>
  );
}
