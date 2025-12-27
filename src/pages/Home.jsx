import React from 'react';
import Calculator from '../components/Calculator';
import { useAuth } from '../contexts/AuthContext';
import { GraduationCap, BookOpen, Calendar } from 'lucide-react';

export default function Home() {
  const { currentUser, userData, userRole } = useAuth();

  return (
    <div style={{ minHeight: '100vh', padding: '12px' }}>
      <main style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header Section */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          {currentUser && userData && (
            <div className="glass-panel" style={{ 
              display: 'inline-block', 
              padding: '8px 20px', 
              borderRadius: '30px', 
              marginBottom: '20px',
              border: '1px solid var(--accent-primary)',
              background: 'rgba(59, 130, 246, 0.1)'
            }}>
              <span style={{ color: 'var(--text-primary)', fontWeight: '500' }}>
                Welcome back, {userData.name || 'User'} 👋
              </span>
            </div>
          )}
          
          <h1 style={{ 
            fontSize: 'clamp(1.8rem, 5vw, 3rem)', 
            marginBottom: '16px', 
            background: 'linear-gradient(to right, #60a5fa, #c084fc)', 
            WebkitBackgroundClip: 'text', 
            backgroundClip: 'text', 
            color: 'transparent' 
          }}>
            Calculate Your Success
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 'clamp(0.95rem, 2.5vw, 1.2rem)', maxWidth: '600px', margin: '0 auto', padding: '0 12px' }}>
            {currentUser && userRole === 'student' 
              ? `Regulation ${userData?.regulation || ''} - Batch ${userData?.batch || ''}`
              : 'Accurate SGPA & CGPA calculation for Anna University Regulation 2021 & 2023.'
            }
          </p>
        </div>

        {/* Student Profile Card */}
        {currentUser && userData && userRole === 'student' && (
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            marginBottom: '32px' 
          }}>
            <div className="glass-panel" style={{ 
              padding: '24px',
              display: 'flex',
              gap: '32px',
              alignItems: 'center',
              flexWrap: 'wrap',
              justifyContent: 'center'
            }}>
              {/* Profile Avatar */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ 
                  width: '60px', 
                  height: '60px', 
                  borderRadius: '50%', 
                  background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.5rem',
                  fontWeight: 'bold'
                }}>
                  {userData.name?.charAt(0).toUpperCase() || 'S'}
                </div>
                <div>
                  <h3 style={{ margin: '0 0 4px 0', fontSize: '1.1rem', fontWeight: '600' }}>
                    {userData.name}
                  </h3>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    {userData.regNum}
                  </p>
                </div>
              </div>

              {/* Divider */}
              <div style={{ 
                width: '1px', 
                height: '40px', 
                background: 'rgba(255,255,255,0.1)' 
              }} />

              {/* Info Badges */}
              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px',
                  padding: '8px 16px',
                  background: 'rgba(59, 130, 246, 0.15)',
                  borderRadius: '10px'
                }}>
                  <BookOpen size={18} color="#60a5fa" />
                  <div>
                    <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-secondary)' }}>Regulation</p>
                    <p style={{ margin: 0, fontWeight: '600', color: '#60a5fa' }}>{userData.regulation}</p>
                  </div>
                </div>

                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px',
                  padding: '8px 16px',
                  background: 'rgba(139, 92, 246, 0.15)',
                  borderRadius: '10px'
                }}>
                  <Calendar size={18} color="#a78bfa" />
                  <div>
                    <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-secondary)' }}>Batch</p>
                    <p style={{ margin: 0, fontWeight: '600', color: '#a78bfa' }}>{userData.batch}</p>
                  </div>
                </div>

                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px',
                  padding: '8px 16px',
                  background: 'rgba(16, 185, 129, 0.15)',
                  borderRadius: '10px'
                }}>
                  <GraduationCap size={18} color="#10b981" />
                  <div>
                    <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-secondary)' }}>Status</p>
                    <p style={{ margin: 0, fontWeight: '600', color: '#10b981' }}>Active</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Calculator */}
        <Calculator 
          initialBatch={userData?.batch || ''} 
          initialRegulation={userData?.regulation || ''}
        />
      </main>
      
      <footer style={{ textAlign: 'center', marginTop: '60px', color: 'var(--text-secondary)' }}>
        <p>&copy; 2025 Prem Kumar. All rights reserved.</p>
      </footer>
    </div>
  );
}
