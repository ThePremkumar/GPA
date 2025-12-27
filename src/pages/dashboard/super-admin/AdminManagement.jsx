/**
 * Enhanced Admin Management Page
 * Full CRUD for admin accounts with password management and activity tracking
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useToast } from '../../../contexts/ToastContext';
import { 
  Users, 
  Plus, 
  Trash2, 
  Edit2, 
  Key, 
  Search,
  Filter,
  MoreVertical,
  Shield,
  UserCheck,
  Mail,
  Calendar,
  Clock,
  X,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

// Import services
import { 
  createAdmin, 
  getAllAdmins, 
  deleteAdmin, 
  updateAdminPassword,
  sendAdminPasswordReset,
  updateAdminRole,
  updateAdminBatch,
  updateAdmin
} from '../../../services/adminService';
import { generateSecurePassword } from '../../../utils/encryption';
import { ROLES } from '../../../utils/constants';
import { useRegulations } from '../../../hooks/useRegulations';

export default function AdminManagement() {
  const { userData, currentUser } = useAuth();
  const { addToast } = useToast();
  
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  
  // Form state
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    registerNumber: '',
    dateOfBirth: '',
    role: ROLES.BATCH_ADMIN,
    assignedBatch: '',
    assignedRegulation: ''
  });
  
  const [generatedPassword, setGeneratedPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [passwordMode, setPasswordMode] = useState('auto'); // 'auto' or 'manual'
  const [manualPassword, setManualPassword] = useState('');
  
  const { regulations, regulationYears, allBatches, getBatches } = useRegulations();

  useEffect(() => {
    fetchAdmins();
  }, []);

  async function fetchAdmins() {
    setLoading(true);
    try {
      const adminsList = await getAllAdmins();
      setAdmins(adminsList);
    } catch (error) {
      console.error('Error fetching admins:', error);
      addToast('Failed to fetch admins', 'error');
    } finally {
      setLoading(false);
    }
  }

  function openAddModal() {
    setFormData({
      fullName: '',
      email: '',
      registerNumber: '',
      dateOfBirth: '',
      role: ROLES.BATCH_ADMIN,
      assignedBatch: '',
      assignedRegulation: ''
    });
    const password = generateSecurePassword(12);
    setGeneratedPassword(password);
    setPasswordMode('auto');
    setManualPassword('');
    setShowPassword(false);
    setShowAddModal(true);
  }

  async function handleAddAdmin(e) {
    e.preventDefault();
    setSubmitting(true);

    try {
      const finalPassword = passwordMode === 'manual' ? manualPassword : generatedPassword;
      
      if (passwordMode === 'manual' && manualPassword.length < 6) {
        addToast('Password must be at least 6 characters', 'error');
        setSubmitting(false);
        return;
      }
      
      await createAdmin({
        ...formData,
        password: finalPassword,
        currentAdmin: {
          uid: currentUser.uid,
          fullName: userData?.fullName,
          email: userData?.email
        }
      });
      
      addToast('Admin created successfully!', 'success');
      setShowAddModal(false);
      fetchAdmins();
    } catch (error) {
      console.error('Error creating admin:', error);
      addToast(error.message || 'Failed to create admin', 'error');
    } finally {
      setSubmitting(false);
    }
  }

  function openPasswordModal(admin) {
    setSelectedAdmin(admin);
    const newPassword = generateSecurePassword(12);
    setGeneratedPassword(newPassword);
    setPasswordMode('auto');
    setManualPassword('');
    setShowPassword(false);
    setShowPasswordModal(true);
  }

  async function handleChangePassword() {
    if (!selectedAdmin) return;
    setSubmitting(true);

    try {
      // Send password reset email - this is the proper way to change passwords
      // Firebase Auth doesn't allow changing another user's password from client-side
      await sendAdminPasswordReset(
        selectedAdmin.email,
        {
          uid: currentUser.uid,
          fullName: userData?.fullName,
          email: userData?.email
        }
      );
      
      addToast(`Password reset email sent to ${selectedAdmin.email}!`, 'success');
      setShowPasswordModal(false);
      setSelectedAdmin(null);
    } catch (error) {
      console.error('Error sending password reset:', error);
      addToast('Failed to send password reset email', 'error');
    } finally {
      setSubmitting(false);
    }
  }

  function openEditModal(admin) {
    setSelectedAdmin(admin);
    setFormData({
      fullName: admin.fullName || '',
      email: admin.email || '',
      registerNumber: admin.registerNumber || '',
      dateOfBirth: '',
      role: admin.role || ROLES.BATCH_ADMIN,
      assignedBatch: admin.assignedBatch || admin.assignedYear || '',
      assignedRegulation: admin.assignedRegulation || '',
      status: admin.status || 'active'
    });
    setShowEditModal(true);
  }

  async function handleUpdateAdmin(e) {
    e.preventDefault();
    if (!selectedAdmin) return;
    setSubmitting(true);

    try {
      // Update all admin fields
      await updateAdmin(
        selectedAdmin.id,
        {
          fullName: formData.fullName,
          email: formData.email,
          registerNumber: formData.registerNumber,
          role: formData.role,
          assignedRegulation: formData.assignedRegulation,
          assignedBatch: formData.assignedBatch,
          assignedYear: formData.assignedBatch, // Backwards compatibility
          status: formData.status || 'active'
        },
        { uid: currentUser.uid, fullName: userData?.fullName, email: userData?.email }
      );
      
      addToast('Admin updated successfully!', 'success');
      setShowEditModal(false);
      fetchAdmins();
    } catch (error) {
      console.error('Error updating admin:', error);
      addToast('Failed to update admin', 'error');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteAdmin(admin) {
    if (admin.role === ROLES.SUPER_ADMIN) {
      addToast('Cannot delete Super Admin', 'error');
      return;
    }

    if (!window.confirm(`Are you sure you want to delete ${admin.fullName || admin.email}?`)) {
      return;
    }

    try {
      await deleteAdmin(admin.id, {
        uid: currentUser.uid,
        fullName: userData?.fullName,
        email: userData?.email
      });
      
      addToast('Admin deleted successfully', 'success');
      fetchAdmins();
    } catch (error) {
      console.error('Error deleting admin:', error);
      addToast('Failed to delete admin', 'error');
    }
  }

  // Filter admins
  const filteredAdmins = admins.filter(admin => {
    const matchesSearch = 
      (admin.fullName?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (admin.email?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (admin.registerNumber?.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesRole = filterRole === 'all' || admin.role === filterRole;
    
    return matchesSearch && matchesRole;
  });

  // Get available batches based on regulation
  const availableBatches = formData.assignedRegulation 
    ? getBatches(formData.assignedRegulation)
    : allBatches;

  return (
    <div className="admin-management">
      {/* Header */}
      <div className="page-header">
        <div className="header-left">
          <h1>Admin Management</h1>
          <p>Manage administrator accounts and permissions</p>
        </div>
        <button className="btn-primary" onClick={openAddModal}>
          <Plus size={18} />
          Add New Admin
        </button>
      </div>

      {/* Filters */}
      <div className="filters-bar glass-panel">
        <div className="search-box">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search by name, email, or register number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filter-group">
          <Filter size={16} />
          <select 
            value={filterRole} 
            onChange={(e) => setFilterRole(e.target.value)}
            className="input-field"
          >
            <option value="all">All Roles</option>
            <option value={ROLES.SUPER_ADMIN}>Super Admin</option>
            <option value={ROLES.BATCH_ADMIN}>Batch Admin</option>
            <option value="year_admin">Year Admin (Legacy)</option>
          </select>
        </div>
      </div>

      {/* Admin List */}
      <div className="admin-list glass-panel">
        {loading ? (
          <div className="loading-state">Loading admins...</div>
        ) : filteredAdmins.length === 0 ? (
          <div className="empty-state">
            <Users size={48} />
            <h3>No admins found</h3>
            <p>Add a new admin to get started</p>
          </div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Admin</th>
                <th>Role</th>
                <th>Assigned Batch</th>
                <th>Last Login</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAdmins.map((admin) => (
                <tr key={admin.id}>
                  <td>
                    <div className="admin-info">
                      <div className="admin-avatar">
                        {(admin.fullName || admin.email || 'A').charAt(0).toUpperCase()}
                      </div>
                      <div className="admin-details">
                        <span className="admin-name">{admin.fullName || 'N/A'}</span>
                        <span className="admin-email">{admin.email}</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={`role-badge ${admin.role}`}>
                      {admin.role === ROLES.SUPER_ADMIN ? (
                        <><Shield size={12} /> Super Admin</>
                      ) : (
                        <><UserCheck size={12} /> Batch Admin</>
                      )}
                    </span>
                  </td>
                  <td>
                    {admin.assignedBatch || admin.assignedYear || '-'}
                  </td>
                  <td>
                    <span className="last-login">
                      {admin.lastLogin 
                        ? new Date(admin.lastLogin).toLocaleDateString()
                        : 'Never'
                      }
                    </span>
                  </td>
                  <td>
                    <span className={`status-badge ${admin.status || 'active'}`}>
                      {admin.status === 'active' ? (
                        <><CheckCircle size={12} /> Active</>
                      ) : (
                        <><AlertCircle size={12} /> Inactive</>
                      )}
                    </span>
                  </td>
                  <td>
                    <div className="actions">
                      <button onClick={() => openEditModal(admin)} title="Edit">
                        <Edit2 size={16} />
                      </button>
                      <button onClick={() => openPasswordModal(admin)} title="Change Password">
                        <Key size={16} />
                      </button>
                      {admin.role !== ROLES.SUPER_ADMIN && (
                        <button onClick={() => handleDeleteAdmin(admin)} title="Delete" className="danger">
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add Admin Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add New Admin</h2>
              <button className="close-btn" onClick={() => setShowAddModal(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleAddAdmin}>
              <div className="modal-body">
                <div className="form-grid">
                  <div className="form-group">
                    <label>Full Name</label>
                    <input
                      type="text"
                      className="input-field"
                      value={formData.fullName}
                      onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Email</label>
                    <input
                      type="email"
                      className="input-field"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Register Number</label>
                    <input
                      type="text"
                      className="input-field"
                      value={formData.registerNumber}
                      onChange={(e) => setFormData({...formData, registerNumber: e.target.value})}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Date of Birth</label>
                    <input
                      type="date"
                      className="input-field"
                      value={formData.dateOfBirth}
                      onChange={(e) => setFormData({...formData, dateOfBirth: e.target.value})}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Role</label>
                    <select
                      className="input-field"
                      value={formData.role}
                      onChange={(e) => setFormData({...formData, role: e.target.value})}
                    >
                      <option value={ROLES.BATCH_ADMIN}>Batch Admin</option>
                      <option value={ROLES.SUPER_ADMIN}>Super Admin</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Regulation</label>
                    <select
                      className="input-field"
                      value={formData.assignedRegulation}
                      onChange={(e) => setFormData({
                        ...formData, 
                        assignedRegulation: e.target.value,
                        assignedBatch: ''
                      })}
                    >
                      <option value="">Select Regulation</option>
                      {regulationYears.map(reg => (
                        <option key={reg} value={reg}>Regulation {reg}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group full-width">
                    <label>Assigned Batch</label>
                    <select
                      className="input-field"
                      value={formData.assignedBatch}
                      onChange={(e) => setFormData({...formData, assignedBatch: e.target.value})}
                      disabled={formData.role === ROLES.SUPER_ADMIN}
                    >
                      <option value="">Select Batch</option>
                      {availableBatches.map(batch => (
                        <option key={batch} value={batch}>{batch}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Password Section */}
                <div className="password-section">
                  <div className="password-mode-toggle">
                    <label>Password</label>
                    <div className="toggle-buttons">
                      <button 
                        type="button" 
                        className={passwordMode === 'auto' ? 'active' : ''}
                        onClick={() => setPasswordMode('auto')}
                      >
                        Auto Generate
                      </button>
                      <button 
                        type="button" 
                        className={passwordMode === 'manual' ? 'active' : ''}
                        onClick={() => setPasswordMode('manual')}
                      >
                        Manual
                      </button>
                    </div>
                  </div>
                  
                  {passwordMode === 'auto' ? (
                    <div className="password-display">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={generatedPassword}
                        readOnly
                      />
                      <button type="button" onClick={() => setShowPassword(!showPassword)}>
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                      <button 
                        type="button" 
                        onClick={() => {
                          setGeneratedPassword(generateSecurePassword(12));
                          addToast('New password generated', 'success');
                        }}
                      >
                        Regenerate
                      </button>
                      <button 
                        type="button" 
                        onClick={() => {
                          navigator.clipboard.writeText(generatedPassword);
                          addToast('Password copied!', 'success');
                        }}
                      >
                        Copy
                      </button>
                    </div>
                  ) : (
                    <div className="password-display manual">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={manualPassword}
                        onChange={(e) => setManualPassword(e.target.value)}
                        placeholder="Enter password (min 6 characters)"
                        minLength={6}
                      />
                      <button type="button" onClick={() => setShowPassword(!showPassword)}>
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  )}
                  <p className="password-note">
                    ⚠️ Save this password! The admin will need it to login.
                  </p>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={submitting}>
                  {submitting ? 'Creating...' : 'Create Admin'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Change Password Modal - Email Reset */}
      {showPasswordModal && (
        <div className="modal-overlay" onClick={() => setShowPasswordModal(false)}>
          <div className="modal small" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Reset Password</h2>
              <button className="close-btn" onClick={() => setShowPasswordModal(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div className="email-reset-info">
                <div className="info-icon">
                  <Mail size={32} />
                </div>
                <h3>Send Password Reset Email</h3>
                <p>
                  A password reset link will be sent to:
                </p>
                <div className="target-email">
                  {selectedAdmin?.email}
                </div>
                <p className="info-note">
                  The admin will receive an email with instructions to set a new password.
                  This is the secure way to change passwords in Firebase.
                </p>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowPasswordModal(false)}>
                Cancel
              </button>
              <button className="btn-primary" onClick={handleChangePassword} disabled={submitting}>
                {submitting ? 'Sending...' : 'Send Reset Email'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Admin Modal */}
      {showEditModal && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Edit Admin Details</h2>
              <button className="close-btn" onClick={() => setShowEditModal(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleUpdateAdmin}>
              <div className="modal-body">
                <div className="form-grid">
                  {/* Full Name */}
                  <div className="form-group">
                    <label>Full Name</label>
                    <input
                      type="text"
                      className="input-field"
                      value={formData.fullName}
                      onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                      required
                    />
                  </div>
                  
                  {/* Email */}
                  <div className="form-group">
                    <label>Email Address <span className="field-note">(display only)</span></label>
                    <input
                      type="email"
                      className="input-field"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      required
                    />
                    <small className="field-hint">
                      ℹ️ Changing email here updates contact info only. Login email remains unchanged.
                    </small>
                  </div>
                  
                  {/* Register Number */}
                  <div className="form-group">
                    <label>Register Number</label>
                    <input
                      type="text"
                      className="input-field"
                      value={formData.registerNumber}
                      onChange={(e) => setFormData({...formData, registerNumber: e.target.value})}
                    />
                  </div>
                  
                  {/* Role */}
                  <div className="form-group">
                    <label>Role</label>
                    <select
                      className="input-field"
                      value={formData.role}
                      onChange={(e) => setFormData({...formData, role: e.target.value})}
                      disabled={selectedAdmin?.role === ROLES.SUPER_ADMIN}
                    >
                      <option value={ROLES.BATCH_ADMIN}>Batch Admin</option>
                      <option value={ROLES.SUPER_ADMIN}>Super Admin</option>
                    </select>
                  </div>
                  
                  {/* Regulation */}
                  <div className="form-group">
                    <label>Assigned Regulation</label>
                    <select
                      className="input-field"
                      value={formData.assignedRegulation}
                      onChange={(e) => setFormData({
                        ...formData, 
                        assignedRegulation: e.target.value,
                        assignedBatch: '' // Reset batch when regulation changes
                      })}
                      disabled={formData.role === ROLES.SUPER_ADMIN}
                    >
                      <option value="">Select Regulation</option>
                      {regulationYears.map(reg => (
                        <option key={reg} value={reg}>Regulation {reg}</option>
                      ))}
                    </select>
                  </div>
                  
                  {/* Assigned Batch */}
                  <div className="form-group">
                    <label>Assigned Batch</label>
                    <select
                      className="input-field"
                      value={formData.assignedBatch}
                      onChange={(e) => setFormData({...formData, assignedBatch: e.target.value})}
                      disabled={formData.role === ROLES.SUPER_ADMIN}
                    >
                      <option value="">Select Batch</option>
                      {availableBatches.map(batch => (
                        <option key={batch} value={batch}>{batch}</option>
                      ))}
                    </select>
                  </div>
                  
                  {/* Status */}
                  <div className="form-group full-width">
                    <label>Status</label>
                    <select
                      className="input-field"
                      value={formData.status || 'active'}
                      onChange={(e) => setFormData({...formData, status: e.target.value})}
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="suspended">Suspended</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setShowEditModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={submitting}>
                  {submitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .admin-management {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }

        .header-left h1 {
          font-size: 24px;
          font-weight: 700;
          margin: 0 0 8px 0;
        }

        .header-left p {
          color: var(--text-secondary);
          margin: 0;
        }

        .filters-bar {
          display: flex;
          gap: 16px;
          padding: 16px;
        }

        .search-box {
          flex: 1;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 0 16px;
          background: rgba(255,255,255,0.03);
          border-radius: 10px;
          color: var(--text-secondary);
        }

        .search-box input {
          flex: 1;
          background: none;
          border: none;
          padding: 12px 0;
          color: var(--text-primary);
          font-size: 14px;
        }

        .search-box input:focus {
          outline: none;
        }

        .filter-group {
          display: flex;
          align-items: center;
          gap: 8px;
          color: var(--text-secondary);
        }

        .filter-group select {
          max-width: 200px;
          padding-left: 12px;
        }

        .admin-list {
          padding: 0;
          overflow: hidden;
        }

        .loading-state,
        .empty-state {
          padding: 60px;
          text-align: center;
          color: var(--text-secondary);
        }

        .empty-state h3 {
          margin: 16px 0 8px;
        }

        .admin-table {
          width: 100%;
          border-collapse: collapse;
        }

        .admin-table th,
        .admin-table td {
          padding: 16px;
          text-align: left;
        }

        .admin-table th {
          background: rgba(255,255,255,0.03);
          color: var(--text-secondary);
          font-weight: 500;
          font-size: 13px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .admin-table tr {
          border-bottom: 1px solid rgba(255,255,255,0.05);
        }

        .admin-table tr:hover {
          background: rgba(255,255,255,0.02);
        }

        .admin-info {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .admin-avatar {
          width: 40px;
          height: 40px;
          background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary));
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          color: white;
        }

        .admin-details {
          display: flex;
          flex-direction: column;
        }

        .admin-name {
          font-weight: 500;
        }

        .admin-email {
          font-size: 13px;
          color: var(--text-secondary);
        }

        .role-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 10px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 500;
        }

        .role-badge.super_admin {
          background: rgba(251, 191, 36, 0.15);
          color: #fbbf24;
        }

        .role-badge.batch_admin,
        .role-badge.year_admin {
          background: rgba(59, 130, 246, 0.15);
          color: #3b82f6;
        }

        .status-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 12px;
        }

        .status-badge.active {
          color: #22c55e;
        }

        .status-badge.inactive {
          color: #ef4444;
        }

        .last-login {
          font-size: 13px;
          color: var(--text-secondary);
        }

        .actions {
          display: flex;
          gap: 8px;
        }

        .actions button {
          background: rgba(255,255,255,0.05);
          border: none;
          padding: 8px;
          border-radius: 6px;
          color: var(--text-secondary);
          cursor: pointer;
          transition: all 0.2s;
        }

        .actions button:hover {
          background: rgba(255,255,255,0.1);
          color: var(--text-primary);
        }

        .actions button.danger:hover {
          background: rgba(239, 68, 68, 0.1);
          color: #ef4444;
        }

        /* Modal Styles */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.7);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .modal {
          background: var(--bg-secondary);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 16px;
          width: 100%;
          max-width: 560px;
          max-height: 90vh;
          overflow: hidden;
        }

        .modal.small {
          max-width: 420px;
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 24px;
          border-bottom: 1px solid rgba(255,255,255,0.05);
        }

        .modal-header h2 {
          margin: 0;
          font-size: 18px;
        }

        .close-btn {
          background: none;
          border: none;
          padding: 8px;
          color: var(--text-secondary);
          cursor: pointer;
          transition: color 0.2s;
        }

        .close-btn:hover {
          color: var(--text-primary);
        }

        .modal-body {
          padding: 24px;
          overflow-y: auto;
          max-height: 60vh;
        }

        .form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .form-group.full-width {
          grid-column: span 2;
        }

        .form-group label {
          font-size: 13px;
          font-weight: 500;
          color: var(--text-secondary);
        }

        .password-section {
          margin-top: 24px;
          padding: 16px;
          background: rgba(59, 130, 246, 0.1);
          border: 1px solid rgba(59, 130, 246, 0.2);
          border-radius: 10px;
        }

        .password-section label {
          display: block;
          font-size: 13px;
          font-weight: 500;
          color: var(--accent-primary);
          margin-bottom: 12px;
        }

        .password-display {
          display: flex;
          gap: 8px;
        }

        .password-display input {
          flex: 1;
          padding: 10px 12px;
          background: rgba(0,0,0,0.3);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 8px;
          color: var(--text-primary);
          font-family: monospace;
        }

        .password-display button {
          padding: 10px 12px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 8px;
          color: var(--text-secondary);
          cursor: pointer;
          transition: all 0.2s;
        }

        .password-display button:hover {
          background: rgba(255,255,255,0.1);
          color: var(--text-primary);
        }

        .password-display.manual input {
          font-family: inherit;
        }

        .password-mode-toggle {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }

        .toggle-buttons {
          display: flex;
          gap: 4px;
          background: rgba(255,255,255,0.05);
          padding: 4px;
          border-radius: 8px;
        }

        .toggle-buttons button {
          padding: 8px 14px;
          background: transparent;
          border: none;
          border-radius: 6px;
          color: var(--text-secondary);
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .toggle-buttons button:hover {
          color: var(--text-primary);
        }

        .toggle-buttons button.active {
          background: var(--primary);
          color: white;
        }

        .password-note {
          margin-top: 12px;
          font-size: 12px;
          color: #f59e0b;
        }

        .modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          padding: 16px 24px;
          border-top: 1px solid rgba(255,255,255,0.05);
        }

        .btn-secondary {
          padding: 10px 20px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 8px;
          color: var(--text-primary);
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-secondary:hover {
          background: rgba(255,255,255,0.1);
        }

        .email-reset-info {
          text-align: center;
          padding: 20px 0;
        }

        .email-reset-info .info-icon {
          width: 64px;
          height: 64px;
          background: linear-gradient(135deg, var(--primary), var(--accent-cyan));
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 16px;
          color: white;
        }

        .email-reset-info h3 {
          margin: 0 0 12px;
          font-size: 18px;
        }

        .email-reset-info p {
          color: var(--text-secondary);
          margin: 0 0 8px;
          font-size: 14px;
        }

        .email-reset-info .target-email {
          background: rgba(26, 115, 232, 0.1);
          border: 1px solid rgba(26, 115, 232, 0.3);
          border-radius: 8px;
          padding: 12px 16px;
          font-family: monospace;
          font-size: 14px;
          color: var(--primary);
          margin: 12px 0;
        }

        .email-reset-info .info-note {
          font-size: 12px;
          color: var(--text-muted);
          margin-top: 12px;
          line-height: 1.5;
        }

        .field-note {
          font-size: 11px;
          color: var(--text-muted);
          font-weight: 400;
        }

        .field-hint {
          display: block;
          margin-top: 6px;
          font-size: 12px;
          color: var(--text-secondary);
          line-height: 1.4;
        }
      `}</style>
    </div>
  );
}
