import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Lock, User } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';

export default function Login() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [regNum, setRegNum] = useState('');
  const [dob, setDob] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { adminLogin, studentLogin } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      setError('');
      setLoading(true);
      if (isAdmin) {
        await adminLogin(email, password);
      } else {
        await studentLogin(regNum, dob);
      }
      addToast('Welcome back!', 'success');
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
      setError('Failed to log in. Check your credentials.');
      addToast('Login failed. Check your digits.', 'error');
    }
    setLoading(false);
  }

  return (
    <div className="login-container">
      <div className="login-card glass-panel">
        <h2 className="login-title">{isAdmin ? 'Admin Portal' : 'Student Login'}</h2>
        <p className="login-subtitle">Secure Access</p>
        
        {error && <div className="alert-error">{error}</div>}
        
        <form onSubmit={handleSubmit} className="login-form">
          {isAdmin ? (
            <>
              <div className="input-group">
                <User className="input-icon" size={20} />
                <input 
                  type="email" 
                  placeholder="Admin Email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required 
                  className="input-field"
                />
              </div>
              <div className="input-group">
                <Lock className="input-icon" size={20} />
                <input 
                  type="password" 
                  placeholder="Password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required 
                  className="input-field"
                />
              </div>
            </>
          ) : (
            <>
              <div className="input-group">
                <User className="input-icon" size={20} />
                <input 
                  type="text" 
                  placeholder="Register Number" 
                  value={regNum}
                  onChange={(e) => setRegNum(e.target.value)}
                  required 
                  className="input-field"
                />
              </div>
              <div className="input-group">
                <Lock className="input-icon" size={20} />
                <input 
                  type="date" 
                  placeholder="Date of Birth" 
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  required 
                  className="input-field"
                />
              </div>
            </>
          )}

          <button disabled={loading} type="submit" className="btn-primary glow-effect">
            {loading ? 'Authenticating...' : 'Access Dashboard'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          {!isAdmin && (
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              Don't have an account? <Link to="/signup" style={{ color: 'var(--accent-primary)', textDecoration: 'none' }}>Sign Up</Link>
            </p>
          )}
          
          <button 
            onClick={() => setIsAdmin(!isAdmin)} 
            style={{ 
              background: 'none', 
              border: 'none', 
              color: 'var(--text-secondary)', 
              fontSize: '0.8rem', 
              cursor: 'pointer',
              marginTop: '10px',
              opacity: 0.5
            }}
          >
            {isAdmin ? 'Back to Student Login' : 'Admin Access'}
          </button>
        </div>
      </div>
      
      <div className="background-orb"></div>
    </div>
  );
}
