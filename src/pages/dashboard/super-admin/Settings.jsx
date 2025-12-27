/**
 * Settings Panel
 * Account settings and preferences
 */

import React, { useState } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useToast } from '../../../contexts/ToastContext';
import { Settings, User, Lock, Bell, Shield, Save } from 'lucide-react';

export default function SettingsPanel() {
  const { userData, currentUser } = useAuth();
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState('profile');

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'security', label: 'Security', icon: Lock },
    { id: 'notifications', label: 'Notifications', icon: Bell },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h1 style={{ margin: '0 0 8px', fontSize: '24px', fontWeight: '700' }}>Settings</h1>
        <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Manage your account settings and preferences</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: '24px' }}>
        {/* Tabs */}
        <div className="glass-panel" style={{ padding: '12px' }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                width: '100%',
                padding: '12px 16px',
                background: activeTab === tab.id ? 'rgba(59,130,246,0.1)' : 'transparent',
                border: 'none',
                borderRadius: '8px',
                color: activeTab === tab.id ? 'var(--accent-primary)' : 'var(--text-secondary)',
                cursor: 'pointer',
                fontSize: '14px',
                textAlign: 'left',
                marginBottom: '4px',
                transition: 'all 0.2s'
              }}
            >
              <tab.icon size={18} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          {activeTab === 'profile' && (
            <div>
              <h3 style={{ margin: '0 0 20px', display: 'flex', alignItems: 'center', gap: '10px' }}><User size={20} /> Profile Information</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: 'var(--text-secondary)' }}>Full Name</label>
                  <input className="input-field" value={userData?.fullName || ''} readOnly />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: 'var(--text-secondary)' }}>Email</label>
                  <input className="input-field" value={userData?.email || ''} readOnly />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: 'var(--text-secondary)' }}>Role</label>
                  <input className="input-field" value={userData?.role?.replace('_', ' ').toUpperCase() || ''} readOnly style={{ textTransform: 'capitalize' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: 'var(--text-secondary)' }}>Assigned Batch</label>
                  <input className="input-field" value={userData?.assignedBatch || userData?.assignedYear || 'All Batches'} readOnly />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div>
              <h3 style={{ margin: '0 0 20px', display: 'flex', alignItems: 'center', gap: '10px' }}><Lock size={20} /> Security Settings</h3>
              <div style={{ padding: '20px', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: '10px', marginBottom: '20px' }}>
                <p style={{ margin: 0, color: '#f59e0b', fontSize: '14px' }}>
                  <Shield size={16} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                  Password changes must be performed by a Super Admin
                </p>
              </div>
              <div>
                <h4 style={{ margin: '0 0 12px', fontSize: '14px' }}>Account Security</h4>
                <ul style={{ margin: 0, padding: '0 0 0 20px', color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '2' }}>
                  <li>All credentials are encrypted using AES-256</li>
                  <li>Session expires after 24 hours of inactivity</li>
                  <li>All actions are logged for audit purposes</li>
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div>
              <h3 style={{ margin: '0 0 20px', display: 'flex', alignItems: 'center', gap: '10px' }}><Bell size={20} /> Notification Preferences</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                Notification settings coming soon. Stay tuned for email and push notification options.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
