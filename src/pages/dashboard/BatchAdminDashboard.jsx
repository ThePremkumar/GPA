/**
 * Batch Admin Dashboard
 * Limited permissions - can only manage students in assigned batch
 */

import React, { useState } from 'react';
import { Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { LayoutDashboard, GraduationCap, BookOpen, LogOut, UserCheck, Menu, X } from 'lucide-react';

// Components
import BatchAdminOverview from './batch-admin/Overview';
import BatchStudentManagement from './batch-admin/StudentManagement';
import BatchSubjectManagement from './batch-admin/SubjectManagement';

export default function BatchAdminDashboard() {
  const { logout, userData } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const assignedBatch = userData?.assignedBatch || userData?.assignedYear;

  async function handleLogout() {
    try {
      await logout();
      addToast('Logged out successfully', 'success');
      navigate('/login');
    } catch (error) {
      addToast('Logout failed', 'error');
    }
  }

  const isActive = (path) => {
    if (path === '/dashboard' && location.pathname === '/dashboard') return true;
    if (path !== '/dashboard' && location.pathname.includes(path)) return true;
    return false;
  };

  const navItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Overview' },
    { path: '/dashboard/students', icon: GraduationCap, label: 'Manage Students' },
    { path: '/dashboard/subjects', icon: BookOpen, label: 'Manage Subjects' },
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-primary)' }}>
      {/* Sidebar */}
      <aside style={{
        width: sidebarOpen ? '260px' : '72px',
        background: 'linear-gradient(180deg, #1e293b 0%, #0f172a 100%)',
        borderRight: '1px solid rgba(255,255,255,0.05)',
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 0.3s',
        position: 'fixed',
        top: 0,
        left: 0,
        height: '100vh',
        zIndex: 100
      }}>
        {/* Header */}
        <div style={{ padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '40px', height: '40px', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
              <UserCheck size={20} />
            </div>
            {sidebarOpen && (
              <div>
                <h2 style={{ fontSize: '16px', fontWeight: '600', margin: 0, color: 'var(--text-primary)' }}>Batch Admin</h2>
                <span style={{ fontSize: '11px', color: 'var(--accent-primary)' }}>{assignedBatch}</span>
              </div>
            )}
          </div>
          <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', padding: '8px', borderRadius: '8px', color: 'var(--text-secondary)', cursor: 'pointer' }}>
            {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {navItems.map(item => (
            <Link
              key={item.path}
              to={item.path}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 16px',
                color: isActive(item.path) ? 'var(--accent-primary)' : 'var(--text-secondary)',
                textDecoration: 'none',
                borderRadius: '10px',
                background: isActive(item.path) ? 'rgba(59,130,246,0.15)' : 'transparent',
                transition: 'all 0.2s'
              }}
            >
              <item.icon size={20} />
              {sidebarOpen && <span>{item.label}</span>}
            </Link>
          ))}
        </nav>

        {/* User & Logout */}
        <div style={{ padding: '16px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          {sidebarOpen && (
            <div style={{ marginBottom: '12px', padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px' }}>
              <div style={{ fontWeight: '500', fontSize: '14px' }}>{userData?.fullName || 'Admin'}</div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{userData?.email}</div>
            </div>
          )}
          <button onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%', padding: '12px 16px', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', borderRadius: '10px', transition: 'all 0.2s' }}>
            <LogOut size={20} />
            {sidebarOpen && 'Logout'}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, marginLeft: sidebarOpen ? '260px' : '72px', transition: 'margin-left 0.3s' }}>
        {/* Header bar */}
        <header style={{ height: '64px', background: 'rgba(30,41,59,0.8)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', position: 'sticky', top: 0, zIndex: 50 }}>
          <h1 style={{ fontSize: '20px', fontWeight: '600', margin: 0 }}>
            {navItems.find(item => isActive(item.path))?.label || 'Dashboard'}
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ padding: '6px 12px', background: 'rgba(59,130,246,0.1)', color: 'var(--accent-primary)', borderRadius: '6px', fontSize: '13px' }}>
              Batch: {assignedBatch}
            </span>
          </div>
        </header>

        {/* Content */}
        <div style={{ padding: '24px' }}>
          <Routes>
            <Route path="/" element={<BatchAdminOverview />} />
            <Route path="/students" element={<BatchStudentManagement />} />
            <Route path="/subjects" element={<BatchSubjectManagement />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}
