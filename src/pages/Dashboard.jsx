import React from 'react';
import { Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LayoutDashboard, Users, GraduationCap, Settings, LogOut } from 'lucide-react';
import Overview from './dashboard/Overview';
import AdminManagement from './dashboard/AdminManagement';
import StudentManagement from './dashboard/StudentManagement';
import SubjectManagement from './dashboard/SubjectManagement';
import { BookOpen } from 'lucide-react';

export default function Dashboard() {
  const { logout, userRole } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  async function handleLogout() {
    try {
      await logout();
      navigate('/login');
    } catch (e) {
      console.error("Logout failed", e);
    }
  }

  const isActive = (path) => location.pathname.includes(path);

  return (
    <div className="dashboard-layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div style={{ marginBottom: '32px', paddingLeft: '12px' }}>
          <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>Admin Portal</h2>
          <span style={{ fontSize: '0.8rem', color: 'var(--accent-secondary)' }}>{userRole === 'super_admin' ? 'Super Admin' : 'Year Admin'}</span>
        </div>

        <nav style={{ flex: 1 }}>
          <Link to="/dashboard" className={`nav-item ${location.pathname === '/dashboard' ? 'active' : ''}`}>
            <LayoutDashboard size={20} />
            Overview
          </Link>
          
          {userRole === 'super_admin' && (
            <Link to="/dashboard/admins" className={`nav-item ${isActive('/admins') ? 'active' : ''}`}>
              <Users size={20} />
              Manage Admins
            </Link>
          )}

          <Link to="/dashboard/students" className={`nav-item ${isActive('/students') ? 'active' : ''}`}>
            <GraduationCap size={20} />
            Manage Students
          </Link>

          <Link to="/dashboard/subjects" className={`nav-item ${isActive('/subjects') ? 'active' : ''}`}>
            <BookOpen size={20} />
            Manage Subjects
          </Link>

          <Link to="/dashboard/settings" className={`nav-item ${isActive('/settings') ? 'active' : ''}`}>
            <Settings size={20} />
            Settings
          </Link>
        </nav>

        <button onClick={handleLogout} className="nav-item" style={{ background: 'transparent', border: 'none', width: '100%', cursor: 'pointer', marginTop: 'auto' }}>
          <LogOut size={20} />
          Logout
        </button>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Overview />} />
          <Route path="/admins" element={<AdminManagement />} />
          <Route path="/students" element={<StudentManagement />} />
          <Route path="/subjects" element={<SubjectManagement />} />
          <Route path="/settings" element={<div>Settings Component (Coming Soon)</div>} />
        </Routes>
      </main>
    </div>
  );
}
