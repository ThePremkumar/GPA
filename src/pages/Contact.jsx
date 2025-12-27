import React, { useState } from 'react';
import { Mail, Phone, MapPin, Send } from 'lucide-react';

export default function Contact() {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="page-container" style={{ padding: '40px', maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '32px' }}>
        
        {/* Info Side */}
        <div className="glass-panel" style={{ padding: '32px' }}>
          <h2 style={{ marginBottom: '24px' }}>Get in Touch</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>
            Have questions about your credits or found a bug? We're here to help.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ padding: '12px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '12px', color: '#3b82f6' }}>
                <Mail size={20} />
              </div>
              <div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Email Us</div>
                <div style={{ fontWeight: '500' }}>premkumar242004@gmail.com</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ padding: '12px', background: 'rgba(139, 92, 246, 0.1)', borderRadius: '12px', color: '#8b5cf6' }}>
                <Phone size={20} />
              </div>
              <div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Call Support</div>
                <div style={{ fontWeight: '500' }}>+91 12345 67890</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ padding: '12px', background: 'rgba(236, 72, 153, 0.1)', borderRadius: '12px', color: '#ec4899' }}>
                <MapPin size={20} />
              </div>
              <div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Location</div>
                <div style={{ fontWeight: '500' }}>Tamil Nadu, India</div>
              </div>
            </div>
          </div>
        </div>

        {/* Form Side */}
        <div className="glass-panel" style={{ padding: '32px' }}>
          {submitted ? (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🎉</div>
              <h3>Message Received!</h3>
              <p style={{ color: 'var(--text-secondary)', marginTop: '8px' }}>We'll get back to you shortly.</p>
              <button className="btn-primary" onClick={() => setSubmitted(false)} style={{ marginTop: '24px', width: 'auto' }}>Send Another</button>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="input-group">
                <input type="text" placeholder="Your Name" required className="input-field" />
              </div>
              <div className="input-group">
                <input type="email" placeholder="Email Address" required className="input-field" />
              </div>
              <div className="input-group">
                <textarea 
                  placeholder="How can we help?" 
                  required 
                  className="input-field" 
                  style={{ minHeight: '150px', padding: '12px' }}
                ></textarea>
              </div>
              <button type="submit" className="btn-primary glow-effect" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <Send size={18} />
                Send Message
              </button>
            </form>
          )}
        </div>

      </div>
    </div>
  );
}
