import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { User, Mail, Lock, BookOpen } from 'lucide-react';
import { useRegulations } from '../hooks/useRegulations';
import { useToast } from '../contexts/ToastContext';

export default function Signup() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    regNum: '',
    regulation: '2021',
    batch: '',
    dob: '', 
  });

  const { regulations, regulationYears, getBatches } = useRegulations();
  const availableBatches = getBatches(formData.regulation);

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signup } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      setError('');
      setLoading(true);
      
      // DOB from <input type="date"> is YYYY-MM-DD
      // Use it directly as password (no normalization)
      const password = formData.dob; // yyyy-mm-dd format
      
      // Store in DD/MM/YYYY format in Firestore for display
      const [year, month, day] = formData.dob.split('-');
      const formattedDobForStore = `${day}/${month}/${year}`;

      // Email format: regNum@csbs.com
      const studentAuthEmail = `${formData.regNum}@csbs.com`;
      
      await signup(studentAuthEmail, password, 'student', {
        name: formData.name,
        email: formData.email, // Real email stored in profile
        regNum: formData.regNum,
        regulation: formData.regulation,
        batch: formData.batch,
        dob: formattedDobForStore
      });
      
      addToast('Account created successfully!', 'success');
      navigate('/');
    } catch (err) {
      console.error(err);
      setError('Failed to create an account.');
      addToast(err.message || 'Failed to create account', 'error');
    }
    setLoading(false);
  }

  return (
    <div className="login-container">
      <div className="login-card glass-panel" style={{ maxWidth: '450px' }}>
        <h2 className="login-title">Student Signup</h2>
        <p className="login-subtitle">Join the CSBS Community</p>
        
        {error && <div className="alert-error">{error}</div>}
        
        <form onSubmit={handleSubmit} className="login-form">
          <div className="input-group">
            <User className="input-icon" size={20} />
            <input 
              type="text" 
              placeholder="Full Name" 
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              required 
              className="input-field"
            />
          </div>

          <div className="input-group">
            <Mail className="input-icon" size={20} />
            <input 
              type="email" 
              placeholder="Email Address" 
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              required 
              className="input-field"
            />
          </div>

          <div className="input-group">
            <BookOpen className="input-icon" size={20} />
            <input 
              type="text" 
              placeholder="Register Number" 
              value={formData.regNum}
              onChange={(e) => setFormData({...formData, regNum: e.target.value})}
              required 
              className="input-field"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
            <div className="input-group" style={{ marginBottom: 0 }}>
                <BookOpen className="input-icon" size={20} />
                <select 
                    className="input-field" 
                    value={formData.regulation} 
                    onChange={e => setFormData({
                        ...formData, 
                        regulation: e.target.value,
                        batch: '' // Reset batch when regulation changes
                    })}
                    style={{ paddingLeft: '40px' }}
                >
                    {regulationYears.map(reg => (
                        <option key={reg} value={reg}>Regulation {reg}</option>
                    ))}
                </select>
            </div>

            <div className="input-group" style={{ marginBottom: 0 }}>
                <BookOpen className="input-icon" size={20} />
                <select 
                    className="input-field" 
                    value={formData.batch} 
                    onChange={e => setFormData({...formData, batch: e.target.value})}
                    required
                    style={{ paddingLeft: '40px' }}
                >
                    <option value="">Select Batch</option>
                    {availableBatches.map(batch => (
                        <option key={batch} value={batch}>{batch}</option>
                    ))}
                </select>
            </div>
          </div>

          <div className="input-group">
            <Lock className="input-icon" size={20} />
            <input 
              type="date" 
              placeholder="Date of Birth" 
              value={formData.dob}
              onChange={(e) => setFormData({...formData, dob: e.target.value})}
              required 
              className="input-field"
            />
          </div>
          
          <button disabled={loading} type="submit" className="btn-primary glow-effect">
            {loading ? 'Creating Account...' : 'Sign Up'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <p style={{ color: 'var(--text-secondary)' }}>
            Already have an account? <Link to="/login" style={{ color: 'var(--accent-primary)', textDecoration: 'none' }}>Login</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
