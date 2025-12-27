import React, { useState, useEffect } from 'react';
import { auth, rtdb } from '../firebase/config';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signOut 
} from 'firebase/auth';
import { ref, set, get } from 'firebase/database';
import { useNavigate } from 'react-router-dom';
import { Shield, CheckCircle, AlertCircle, Loader } from 'lucide-react';

export default function AdminSetup() {
  const navigate = useNavigate();
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [existingAdmin, setExistingAdmin] = useState(null);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: 'Super Admin'
  });

  // Check if super admin already exists in Realtime Database
  useEffect(() => {
    checkExistingAdmin();
  }, []);

  async function checkExistingAdmin() {
    try {
      const adminsRef = ref(rtdb, 'admins');
      const snapshot = await get(adminsRef);
      
      if (snapshot.exists()) {
        const admins = snapshot.val();
        const superAdmin = Object.values(admins).find(a => a.role === 'super_admin');
        if (superAdmin) {
          setExistingAdmin(superAdmin);
        }
      }
    } catch (error) {
      console.error('Error checking admin:', error);
    }
  }

  async function handleCreateAdmin(e) {
    e.preventDefault();
    if (!formData.email || !formData.password) {
      setStatus('Please fill in all fields');
      return;
    }

    setLoading(true);
    setStatus('');

    try {
      let userId;

      // Try to create a new user first
      try {
        const userCredential = await createUserWithEmailAndPassword(
          auth, 
          formData.email, 
          formData.password
        );
        userId = userCredential.user.uid;
        setStatus('User created in Firebase Auth...');
      } catch (authError) {
        // If email already exists, try to sign in
        if (authError.code === 'auth/email-already-in-use') {
          setStatus('Email exists, signing in to update profile...');
          try {
            const userCredential = await signInWithEmailAndPassword(
              auth,
              formData.email,
              formData.password
            );
            userId = userCredential.user.uid;
          } catch (signInError) {
            throw new Error('Email exists but password is incorrect. Please use the correct password.');
          }
        } else {
          throw authError;
        }
      }

      // Create/Update admin in Realtime Database
      setStatus('Setting up admin profile in Realtime Database...');
      
      const adminRef = ref(rtdb, `admins/${userId}`);
      const existingSnap = await get(adminRef);
      
      const adminData = {
        uid: userId,
        email: formData.email,
        fullName: formData.fullName,
        role: 'super_admin',
        assignedBatch: null,
        permissions: ['all'],
        isActive: true,
        status: 'active',
        updatedAt: Date.now()
      };

      if (!existingSnap.exists()) {
        adminData.createdAt = Date.now();
      }

      await set(adminRef, adminData);

      // Sign out so user can login through normal flow
      await signOut(auth);

      setStatus('SUCCESS');
      
    } catch (error) {
      console.error('Error:', error);
      setStatus('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleLoginAsAdmin() {
    navigate('/login');
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
      padding: '20px'
    }}>
      <div className="glass-panel" style={{ 
        maxWidth: '480px', 
        width: '100%', 
        padding: '40px',
        textAlign: 'center'
      }}>
        <div style={{ 
          width: '64px', 
          height: '64px', 
          background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', 
          borderRadius: '16px', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          margin: '0 auto 24px'
        }}>
          <Shield size={32} color="white" />
        </div>

        <h1 style={{ margin: '0 0 8px', fontSize: '24px', fontWeight: '700' }}>Super Admin Setup</h1>
        <p style={{ color: 'var(--text-secondary)', margin: '0 0 32px' }}>
          One-time setup for the primary administrator account
        </p>

        {existingAdmin && (
          <div style={{ 
            padding: '16px', 
            background: 'rgba(245,158,11,0.1)', 
            border: '1px solid rgba(245,158,11,0.2)', 
            borderRadius: '10px',
            marginBottom: '24px'
          }}>
            <AlertCircle size={20} color="#f59e0b" style={{ marginBottom: '8px' }} />
            <p style={{ margin: 0, color: '#f59e0b', fontSize: '14px' }}>
              A Super Admin already exists: <strong>{existingAdmin.email}</strong>
            </p>
          </div>
        )}

        {status === 'SUCCESS' ? (
          <div>
            <div style={{ 
              padding: '24px', 
              background: 'rgba(34,197,94,0.1)', 
              border: '1px solid rgba(34,197,94,0.3)', 
              borderRadius: '12px',
              marginBottom: '24px'
            }}>
              <CheckCircle size={48} color="#22c55e" style={{ marginBottom: '16px' }} />
              <h3 style={{ margin: '0 0 8px', color: '#22c55e' }}>Setup Complete!</h3>
              <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '14px' }}>
                Super Admin account has been created/updated successfully.
              </p>
            </div>
            <button className="btn-primary" onClick={handleLoginAsAdmin} style={{ width: '100%' }}>
              Go to Login
            </button>
            <p style={{ marginTop: '16px', color: '#ef4444', fontSize: '13px' }}>
              ⚠️ DELETE this route (/admin-setup-secret) for security!
            </p>
          </div>
        ) : (
          <form onSubmit={handleCreateAdmin}>
            <div style={{ marginBottom: '16px', textAlign: 'left' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: 'var(--text-secondary)' }}>
                Admin Email
              </label>
              <input 
                className="input-field"
                type="email"
                value={formData.email}
                onChange={e => setFormData({...formData, email: e.target.value})}
                placeholder="admin@example.com"
                required
              />
            </div>

            <div style={{ marginBottom: '16px', textAlign: 'left' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: 'var(--text-secondary)' }}>
                Password
              </label>
              <input 
                className="input-field"
                type="password"
                value={formData.password}
                onChange={e => setFormData({...formData, password: e.target.value})}
                placeholder="Strong password"
                required
                minLength={6}
              />
            </div>

            <div style={{ marginBottom: '24px', textAlign: 'left' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: 'var(--text-secondary)' }}>
                Display Name
              </label>
              <input 
                className="input-field"
                type="text"
                value={formData.fullName}
                onChange={e => setFormData({...formData, fullName: e.target.value})}
                placeholder="Super Admin"
              />
            </div>

            <button 
              type="submit"
              className="btn-primary" 
              disabled={loading}
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            >
              {loading ? (
                <>
                  <Loader size={18} className="animate-spin" />
                  Setting up...
                </>
              ) : (
                <>
                  <Shield size={18} />
                  Create Super Admin
                </>
              )}
            </button>

            {status && status !== 'SUCCESS' && (
              <p style={{ 
                marginTop: '16px', 
                padding: '12px', 
                background: status.includes('Error') ? 'rgba(239,68,68,0.1)' : 'rgba(59,130,246,0.1)',
                border: `1px solid ${status.includes('Error') ? 'rgba(239,68,68,0.2)' : 'rgba(59,130,246,0.2)'}`,
                borderRadius: '8px',
                color: status.includes('Error') ? '#ef4444' : '#3b82f6',
                fontSize: '14px'
              }}>
                {status}
              </p>
            )}
          </form>
        )}
      </div>
    </div>
  );
}
