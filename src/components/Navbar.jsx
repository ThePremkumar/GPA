import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Menu, X, LogOut, User, Home, Book, Mail, LayoutDashboard } from 'lucide-react';

export default function Navbar() {
  const { currentUser, logout, userRole } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error("Failed to logout", error);
    }
  };

  const isActive = (path) => location.pathname === path;

  const closeMenu = () => setIsOpen(false);

  return (
    <>
      <nav className="glass-panel" style={{ 
        margin: '12px', 
        borderRadius: '16px', 
        padding: '10px 16px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        position: 'sticky',
        top: '12px',
        zIndex: 1000,
        border: '1px solid var(--glass-border)'
      }}>
        {/* Logo */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none', color: 'inherit' }}>
          <div style={{ 
            width: '32px', 
            height: '32px', 
            background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', 
            borderRadius: '8px' 
          }}></div>
          <span style={{ fontWeight: '600', fontSize: '1.1rem', letterSpacing: '-0.5px' }}>CSBS Calc</span>
        </Link>

        {/* Desktop Links */}
        <div className="desktop-nav" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <NavLink to="/" icon={<Home size={18} />} active={isActive('/')}>Home</NavLink>
          <NavLink to="/about" icon={<Book size={18} />} active={isActive('/about')}>About</NavLink>
          <NavLink to="/contact" icon={<Mail size={18} />} active={isActive('/contact')}>Contact</NavLink>
          
          <div style={{ width: '1px', height: '24px', background: 'var(--glass-border)', margin: '0 8px' }}></div>

          {(userRole === 'super_admin' || userRole === 'year_admin') && (
            <NavLink to="/dashboard" icon={<LayoutDashboard size={18} />} active={location.pathname.startsWith('/dashboard')}>Dashboard</NavLink>
          )}
          
          {currentUser && (
            <button 
              onClick={handleLogout}
              className="btn-primary"
              style={{ 
                width: 'auto', 
                padding: '8px 16px', 
                fontSize: '0.9rem', 
                background: 'rgba(239, 68, 68, 0.15)',
                color: '#ef4444',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <LogOut size={18} style={{ marginRight: '6px' }} />
              Logout
            </button>
          )}
          
          {!currentUser && (
            <Link to="/login" className="btn-primary" style={{ width: 'auto', padding: '8px 20px', fontSize: '0.9rem' }}>
              Sign In
            </Link>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button 
          className="mobile-menu-btn"
          onClick={() => setIsOpen(!isOpen)}
          style={{
            display: 'none',
            background: 'transparent',
            border: 'none',
            color: 'var(--text-primary)',
            cursor: 'pointer',
            padding: '8px'
          }}
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </nav>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <div 
          className="mobile-menu-overlay"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 998
          }}
          onClick={closeMenu}
        />
      )}

      {/* Mobile Menu */}
      <div className="mobile-menu" style={{
        position: 'fixed',
        top: 0,
        right: isOpen ? 0 : '-280px',
        width: '280px',
        height: '100vh',
        background: 'var(--bg-secondary)',
        borderLeft: '1px solid var(--glass-border)',
        padding: '24px',
        zIndex: 999,
        transition: 'right 0.3s ease',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <span style={{ fontWeight: '600', fontSize: '1.1rem' }}>Menu</span>
          <button onClick={closeMenu} style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', cursor: 'pointer' }}>
            <X size={24} />
          </button>
        </div>
        
        <MobileNavLink to="/" onClick={closeMenu} active={isActive('/')}>
          <Home size={20} /> Home
        </MobileNavLink>
        <MobileNavLink to="/about" onClick={closeMenu} active={isActive('/about')}>
          <Book size={20} /> About
        </MobileNavLink>
        <MobileNavLink to="/contact" onClick={closeMenu} active={isActive('/contact')}>
          <Mail size={20} /> Contact
        </MobileNavLink>
        
        {(userRole === 'super_admin' || userRole === 'year_admin') && (
          <MobileNavLink to="/dashboard" onClick={closeMenu} active={location.pathname.startsWith('/dashboard')}>
            <LayoutDashboard size={20} /> Dashboard
          </MobileNavLink>
        )}
        
        <div style={{ flex: 1 }} />
        
        {currentUser ? (
          <button 
            onClick={() => { handleLogout(); closeMenu(); }}
            style={{ 
              padding: '12px 16px', 
              background: 'rgba(239, 68, 68, 0.15)',
              color: '#ef4444',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              cursor: 'pointer',
              fontSize: '1rem'
            }}
          >
            <LogOut size={20} /> Logout
          </button>
        ) : (
          <Link 
            to="/login" 
            onClick={closeMenu}
            className="btn-primary" 
            style={{ textAlign: 'center', textDecoration: 'none' }}
          >
            Sign In
          </Link>
        )}
      </div>

      {/* Responsive Styles */}
      <style>{`
        @media (max-width: 768px) {
          .desktop-nav { display: none !important; }
          .mobile-menu-btn { display: block !important; }
        }
        @media (min-width: 769px) {
          .mobile-menu { display: none !important; }
          .mobile-menu-overlay { display: none !important; }
        }
      `}</style>
    </>
  );
}

function NavLink({ to, children, icon, active }) {
  return (
    <Link to={to} style={{ 
      textDecoration: 'none', 
      color: active ? 'var(--accent-primary)' : 'var(--text-secondary)',
      padding: '8px 14px',
      borderRadius: '10px',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      fontSize: '0.9rem',
      transition: 'all 0.2s ease',
      background: active ? 'rgba(59, 130, 246, 0.1)' : 'transparent'
    }}>
      {icon}
      {children}
    </Link>
  );
}

function MobileNavLink({ to, children, onClick, active }) {
  return (
    <Link 
      to={to} 
      onClick={onClick}
      style={{ 
        textDecoration: 'none', 
        color: active ? 'var(--accent-primary)' : 'var(--text-primary)',
        padding: '14px 16px',
        borderRadius: '10px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        fontSize: '1rem',
        background: active ? 'rgba(59, 130, 246, 0.1)' : 'transparent'
      }}
    >
      {children}
    </Link>
  );
}
