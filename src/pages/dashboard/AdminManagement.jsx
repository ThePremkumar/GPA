import React, { useState, useEffect } from 'react';
import { rtdb } from '../../firebase/config';
import { ref, get, set, remove } from 'firebase/database';
import { useToast } from '../../contexts/ToastContext';
import { Trash2, Plus, X, Users, RefreshCw } from 'lucide-react';
import { useRegulations } from '../../hooks/useRegulations';

export default function AdminManagement() {
  const { addToast } = useToast();
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  
  const [formData, setFormData] = useState({
    email: '',
    fullName: '',
    role: 'batch_admin',
    assignedBatch: ''
  });

  const { allBatches } = useRegulations();

  useEffect(() => {
    fetchAdmins();
  }, []);

  async function fetchAdmins() {
    setLoading(true);
    try {
      const snapshot = await get(ref(rtdb, 'admins'));
      if (snapshot.exists()) {
        const adminList = Object.entries(snapshot.val()).map(([id, data]) => ({
          id,
          ...data
        }));
        setAdmins(adminList);
      } else {
        setAdmins([]);
      }
    } catch (e) {
      console.error("Error fetching admins:", e);
      addToast('Failed to fetch admins', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function handleAddAdmin(e) {
    e.preventDefault();
    try {
      // Generate a simple ID
      const newId = `admin_${Date.now()}`;
      
      await set(ref(rtdb, `admins/${newId}`), {
        ...formData,
        uid: newId,
        status: 'active',
        isActive: true,
        createdAt: Date.now()
      });
      
      addToast('Admin added successfully!', 'success');
      setShowForm(false);
      setFormData({ email: '', fullName: '', role: 'batch_admin', assignedBatch: '' });
      fetchAdmins();
    } catch (e) {
      console.error("Error adding admin:", e);
      addToast('Failed to add admin', 'error');
    }
  }

  async function handleDelete(id, email) {
    if (!window.confirm(`Delete admin ${email}?`)) return;
    
    try {
      await remove(ref(rtdb, `admins/${id}`));
      addToast('Admin deleted', 'success');
      fetchAdmins();
    } catch(e) {
      console.error("Error deleting:", e);
      addToast('Failed to delete admin', 'error');
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ margin: '0 0 8px', fontSize: '24px', fontWeight: '700' }}>Admin Management</h1>
          <p style={{ color: 'var(--text-secondary)', margin: 0 }}>{admins.length} admins registered</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button 
            onClick={fetchAdmins}
            disabled={loading}
            style={{ 
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '10px 16px', background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px',
              color: 'var(--text-primary)', cursor: 'pointer'
            }}
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
          <button className="btn-primary" onClick={() => setShowForm(!showForm)} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {showForm ? <X size={16} /> : <Plus size={16} />}
            {showForm ? 'Cancel' : 'Add Admin'}
          </button>
        </div>
      </div>

      {/* Add Form */}
      {showForm && (
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ margin: '0 0 20px' }}>Create New Admin</h3>
          <form onSubmit={handleAddAdmin}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: 'var(--text-secondary)' }}>Email *</label>
                <input className="input-field" type="email" placeholder="admin@example.com" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} required />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: 'var(--text-secondary)' }}>Full Name *</label>
                <input className="input-field" placeholder="Admin Name" value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} required />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: 'var(--text-secondary)' }}>Role *</label>
                <select className="input-field" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})}>
                  <option value="batch_admin">Batch Admin</option>
                  <option value="super_admin">Super Admin</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: 'var(--text-secondary)' }}>Assigned Batch</label>
                <select className="input-field" value={formData.assignedBatch} onChange={e => setFormData({...formData, assignedBatch: e.target.value})}>
                  <option value="">None</option>
                  {batches.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
            </div>
            <div style={{ marginTop: '20px' }}>
              <button type="submit" className="btn-primary">Create Admin</button>
            </div>
          </form>
        </div>
      )}

      {/* Admins Table */}
      <div className="glass-panel" style={{ padding: '0', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading admins...</div>
        ) : admins.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <Users size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
            <p>No admins found</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.03)' }}>
                  <th style={{ padding: '16px', fontSize: '13px', color: 'var(--text-secondary)' }}>Name</th>
                  <th style={{ padding: '16px', fontSize: '13px', color: 'var(--text-secondary)' }}>Email</th>
                  <th style={{ padding: '16px', fontSize: '13px', color: 'var(--text-secondary)' }}>Role</th>
                  <th style={{ padding: '16px', fontSize: '13px', color: 'var(--text-secondary)' }}>Assigned Batch</th>
                  <th style={{ padding: '16px', fontSize: '13px', color: 'var(--text-secondary)' }}>Status</th>
                  <th style={{ padding: '16px', fontSize: '13px', color: 'var(--text-secondary)' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {admins.map(admin => (
                  <tr key={admin.id} style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '16px', fontWeight: '500' }}>{admin.fullName || '-'}</td>
                    <td style={{ padding: '16px', color: 'var(--text-secondary)' }}>{admin.email}</td>
                    <td style={{ padding: '16px' }}>
                      <span style={{ 
                        padding: '4px 10px', 
                        background: admin.role === 'super_admin' ? 'rgba(239,68,68,0.15)' : 'rgba(59,130,246,0.15)', 
                        borderRadius: '6px', fontSize: '13px',
                        color: admin.role === 'super_admin' ? '#ef4444' : '#60a5fa'
                      }}>
                        {admin.role === 'super_admin' ? 'Super Admin' : 'Batch Admin'}
                      </span>
                    </td>
                    <td style={{ padding: '16px' }}>{admin.assignedBatch || admin.assignedYear || '-'}</td>
                    <td style={{ padding: '16px' }}>
                      <span style={{ 
                        padding: '4px 10px', 
                        background: admin.status === 'active' || admin.isActive ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)', 
                        borderRadius: '6px', fontSize: '13px',
                        color: admin.status === 'active' || admin.isActive ? '#10b981' : '#ef4444'
                      }}>
                        {admin.status || (admin.isActive ? 'Active' : 'Inactive')}
                      </span>
                    </td>
                    <td style={{ padding: '16px' }}>
                      {admin.role !== 'super_admin' && (
                        <button 
                          onClick={() => handleDelete(admin.id, admin.email)} 
                          style={{ background: 'rgba(239,68,68,0.1)', border: 'none', padding: '8px', borderRadius: '6px', color: '#ef4444', cursor: 'pointer' }}
                        >
                          <Trash2 size={16} />
                        </button>
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
