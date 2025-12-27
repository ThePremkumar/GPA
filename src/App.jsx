import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth, ROLES } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import Login from './pages/Login';
import Signup from './pages/Signup';
import AdminSetup from './pages/AdminSetup';
import Home from './pages/Home';
import About from './pages/About';
import Contact from './pages/Contact';
import Navbar from './components/Navbar';
import ChatWidget from './components/ChatWidget';

// Import role-specific dashboards
import SuperAdminDashboard from './pages/dashboard/SuperAdminDashboard';
import BatchAdminDashboard from './pages/dashboard/BatchAdminDashboard';
import Dashboard from './pages/Dashboard'; // Legacy/Student dashboard

// Loading component
const LoadingScreen = () => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--bg-primary)' }}>
    <div style={{ textAlign: 'center' }}>
      <div style={{ width: '40px', height: '40px', border: '3px solid rgba(59,130,246,0.2)', borderTopColor: '#3b82f6', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
      <p style={{ color: 'var(--text-secondary)' }}>Loading...</p>
    </div>
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </div>
);

// Protected Route Component with role-based access
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { currentUser, userRole, loading } = useAuth();
  
  if (loading) return <LoadingScreen />;
  
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(userRole)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

// Smart Dashboard Router - routes to appropriate dashboard based on role
const DashboardRouter = () => {
  const { userRole, loading } = useAuth();
  
  if (loading) return <LoadingScreen />;

  // Route to appropriate dashboard based on role
  switch (userRole) {
    case ROLES.SUPER_ADMIN:
      return <SuperAdminDashboard />;
    case ROLES.BATCH_ADMIN:
    case 'year_admin': // Backwards compatibility
      return <BatchAdminDashboard />;
    case ROLES.STUDENT:
    case 'student':
      // Students don't have a dashboard - redirect to home
      return <Navigate to="/" replace />;
    default:
      return <Navigate to="/" replace />;
  }
};

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <Router>
          <Routes>
            {/* Public Views with Navbar */}
            <Route path="/" element={<><Navbar /><Home /></>} />
            <Route path="/about" element={<><Navbar /><About /></>} />
            <Route path="/contact" element={<><Navbar /><Contact /></>} />
            
            {/* Auth - No Navbar */}
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<><Navbar /><Signup /></>} />
            <Route path="/admin-setup-secret" element={<AdminSetup />} />

            {/* Protected Dashboard - Routes internally based on role */}
            <Route 
              path="/dashboard/*" 
              element={
                <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.BATCH_ADMIN, 'year_admin', ROLES.STUDENT, 'student']}>
                  <DashboardRouter />
                </ProtectedRoute>
              } 
            />

            {/* Catch-all redirect */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
        <ChatWidget />
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
