/**
 * Super Admin Dashboard Panel
 * Complete administrative control with all permissions
 */

import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { 
  LayoutDashboard, 
  Users, 
  GraduationCap, 
  BookOpen, 
  Settings, 
  LogOut,
  Activity,
  Shield,
  BarChart3,
  FileText,
  Bell,
  ChevronDown,
  Menu,
  X,
  Database,
  MessageCircle
} from 'lucide-react';

// Import dashboard components
import SuperAdminOverview from './super-admin/Overview';
import AdminManagement from './super-admin/AdminManagement';
import StudentManagement from './super-admin/StudentManagement';
import SubjectManagement from './super-admin/SubjectManagement';
import RegulationManagement from './super-admin/RegulationManagement';
import ActivityLogs from './super-admin/ActivityLogs';
import AnalyticsDashboard from './super-admin/AnalyticsDashboard';
import SettingsPanel from './super-admin/Settings';
import DataInitialization from './super-admin/DataInitialization';
import ChatInbox from './super-admin/ChatInbox';

export default function SuperAdminDashboard() {
  const { logout, userData, currentUser } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [profileDropdown, setProfileDropdown] = useState(false);

  async function handleLogout() {
    try {
      await logout();
      addToast('Logged out successfully', 'success');
      navigate('/login');
    } catch (error) {
      console.error("Logout failed", error);
      addToast('Logout failed', 'error');
    }
  }

  const isActive = (path) => {
    if (path === '/dashboard' && location.pathname === '/dashboard') return true;
    if (path !== '/dashboard' && location.pathname.includes(path)) return true;
    return false;
  };

  const navItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Overview', exact: true },
    { path: '/dashboard/admins', icon: Shield, label: 'Admin Management' },
    { path: '/dashboard/students', icon: GraduationCap, label: 'Student Management' },
    { path: '/dashboard/subjects', icon: BookOpen, label: 'Subject Management' },
    { path: '/dashboard/regulations', icon: FileText, label: 'Regulations & Batches' },
    { path: '/dashboard/messages', icon: MessageCircle, label: 'Messages' },
    { path: '/dashboard/analytics', icon: BarChart3, label: 'Analytics' },
    { path: '/dashboard/activity', icon: Activity, label: 'Activity Logs' },
    { path: '/dashboard/data', icon: Database, label: 'Data Management' },
    { path: '/dashboard/settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <div className="super-admin-layout">
      {/* Sidebar */}
      <aside className={`super-admin-sidebar ${sidebarOpen ? 'open' : 'collapsed'}`}>
        {/* Header */}
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <div className="logo-icon">
              <Shield size={24} />
            </div>
            {sidebarOpen && (
              <div className="logo-text">
                <h2>Admin Portal</h2>
                <span className="badge-super">Super Admin</span>
              </div>
            )}
          </div>
          <button 
            className="sidebar-toggle"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-link ${isActive(item.path) ? 'active' : ''}`}
              title={!sidebarOpen ? item.label : ''}
            >
              <item.icon size={20} />
              {sidebarOpen && <span>{item.label}</span>}
              {isActive(item.path) && <div className="nav-indicator" />}
            </Link>
          ))}
        </nav>

        {/* Footer */}
        <div className="sidebar-footer">
          {/* User Profile */}
          <div 
            className="user-profile"
            onClick={() => setProfileDropdown(!profileDropdown)}
          >
            <div className="user-avatar">
              {(userData?.fullName || userData?.email || 'A').charAt(0).toUpperCase()}
            </div>
            {sidebarOpen && (
              <>
                <div className="user-info">
                  <span className="user-name">{userData?.fullName || 'Admin'}</span>
                  <span className="user-email">{userData?.email}</span>
                </div>
                <ChevronDown size={16} className={profileDropdown ? 'rotated' : ''} />
              </>
            )}
          </div>

          {profileDropdown && sidebarOpen && (
            <div className="profile-dropdown">
              <Link to="/dashboard/settings" className="dropdown-item">
                <Settings size={16} />
                Settings
              </Link>
              <button onClick={handleLogout} className="dropdown-item logout">
                <LogOut size={16} />
                Logout
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="super-admin-main">
        {/* Top Bar */}
        <header className="top-bar">
          <div className="top-bar-left">
            <h1 className="page-title">
              {navItems.find(item => isActive(item.path))?.label || 'Dashboard'}
            </h1>
          </div>
          <div className="top-bar-right">
            <button className="icon-btn notification-btn">
              <Bell size={20} />
              <span className="notification-badge">3</span>
            </button>
            <div className="current-user">
              <span>{userData?.fullName || 'Super Admin'}</span>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="content-area">
          <Routes>
            <Route path="/" element={<SuperAdminOverview />} />
            <Route path="/admins" element={<AdminManagement />} />
            <Route path="/students" element={<StudentManagement />} />
            <Route path="/subjects" element={<SubjectManagement />} />
            <Route path="/regulations" element={<RegulationManagement />} />
            <Route path="/messages" element={<ChatInbox />} />
            <Route path="/analytics" element={<AnalyticsDashboard />} />
            <Route path="/activity" element={<ActivityLogs />} />
            <Route path="/data" element={<DataInitialization />} />
            <Route path="/settings" element={<SettingsPanel />} />
          </Routes>
        </div>
      </main>

      <style>{`
        .super-admin-layout {
          display: flex;
          min-height: 100vh;
          background: var(--bg-primary);
        }

        .super-admin-sidebar {
          width: 280px;
          background: linear-gradient(180deg, #1e293b 0%, #0f172a 100%);
          border-right: 1px solid rgba(255,255,255,0.05);
          display: flex;
          flex-direction: column;
          transition: width 0.3s ease;
          position: fixed;
          top: 0;
          left: 0;
          height: 100vh;
          z-index: 100;
        }

        .super-admin-sidebar.collapsed {
          width: 72px;
        }

        .sidebar-header {
          padding: 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid rgba(255,255,255,0.05);
        }

        .sidebar-logo {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .logo-icon {
          width: 40px;
          height: 40px;
          background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary));
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
        }

        .logo-text h2 {
          font-size: 16px;
          font-weight: 600;
          margin: 0;
          color: var(--text-primary);
        }

        .badge-super {
          font-size: 10px;
          background: linear-gradient(135deg, #fbbf24, #f59e0b);
          color: #000;
          padding: 2px 8px;
          border-radius: 4px;
          font-weight: 600;
        }

        .sidebar-toggle {
          background: rgba(255,255,255,0.05);
          border: none;
          padding: 8px;
          border-radius: 8px;
          color: var(--text-secondary);
          cursor: pointer;
          transition: all 0.2s;
        }

        .sidebar-toggle:hover {
          background: rgba(255,255,255,0.1);
          color: var(--text-primary);
        }

        .sidebar-nav {
          flex: 1;
          padding: 16px 12px;
          display: flex;
          flex-direction: column;
          gap: 4px;
          overflow-y: auto;
        }

        .nav-link {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          color: var(--text-secondary);
          text-decoration: none;
          border-radius: 10px;
          transition: all 0.2s;
          position: relative;
        }

        .nav-link:hover {
          background: rgba(59, 130, 246, 0.1);
          color: var(--text-primary);
        }

        .nav-link.active {
          background: rgba(59, 130, 246, 0.15);
          color: var(--accent-primary);
        }

        .nav-indicator {
          position: absolute;
          right: 0;
          top: 50%;
          transform: translateY(-50%);
          width: 3px;
          height: 24px;
          background: var(--accent-primary);
          border-radius: 3px 0 0 3px;
        }

        .sidebar-footer {
          padding: 16px;
          border-top: 1px solid rgba(255,255,255,0.05);
        }

        .user-profile {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          background: rgba(255,255,255,0.03);
          border-radius: 10px;
          cursor: pointer;
          transition: background 0.2s;
        }

        .user-profile:hover {
          background: rgba(255,255,255,0.06);
        }

        .user-avatar {
          width: 36px;
          height: 36px;
          background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary));
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          color: white;
        }

        .user-info {
          flex: 1;
          overflow: hidden;
        }

        .user-name {
          display: block;
          font-size: 14px;
          font-weight: 500;
          color: var(--text-primary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .user-email {
          display: block;
          font-size: 11px;
          color: var(--text-secondary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .user-profile svg.rotated {
          transform: rotate(180deg);
        }

        .profile-dropdown {
          margin-top: 8px;
          background: rgba(15,23,42,0.9);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 8px;
          overflow: hidden;
        }

        .dropdown-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 16px;
          font-size: 14px;
          color: var(--text-secondary);
          text-decoration: none;
          background: none;
          border: none;
          width: 100%;
          cursor: pointer;
          transition: all 0.2s;
        }

        .dropdown-item:hover {
          background: rgba(255,255,255,0.05);
          color: var(--text-primary);
        }

        .dropdown-item.logout:hover {
          background: rgba(239, 68, 68, 0.1);
          color: #ef4444;
        }

        .super-admin-main {
          flex: 1;
          margin-left: 280px;
          transition: margin-left 0.3s ease;
          display: flex;
          flex-direction: column;
        }

        .super-admin-sidebar.collapsed + .super-admin-main {
          margin-left: 72px;
        }

        .top-bar {
          height: 64px;
          background: rgba(30, 41, 59, 0.8);
          backdrop-filter: blur(12px);
          border-bottom: 1px solid rgba(255,255,255,0.05);
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 24px;
          position: sticky;
          top: 0;
          z-index: 50;
        }

        .page-title {
          font-size: 20px;
          font-weight: 600;
          color: var(--text-primary);
          margin: 0;
        }

        .top-bar-right {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .icon-btn {
          background: rgba(255,255,255,0.05);
          border: none;
          padding: 10px;
          border-radius: 10px;
          color: var(--text-secondary);
          cursor: pointer;
          position: relative;
          transition: all 0.2s;
        }

        .icon-btn:hover {
          background: rgba(255,255,255,0.1);
          color: var(--text-primary);
        }

        .notification-badge {
          position: absolute;
          top: 6px;
          right: 6px;
          width: 16px;
          height: 16px;
          background: #ef4444;
          border-radius: 50%;
          font-size: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: 600;
        }

        .current-user {
          font-size: 14px;
          color: var(--text-secondary);
        }

        .content-area {
          flex: 1;
          padding: 24px;
          overflow-y: auto;
        }

        @media (max-width: 1024px) {
          .super-admin-sidebar {
            transform: translateX(-100%);
          }

          .super-admin-sidebar.open {
            transform: translateX(0);
          }

          .super-admin-main {
            margin-left: 0;
          }
        }
      `}</style>
    </div>
  );
}
