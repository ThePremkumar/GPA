import React from 'react';

export default function About() {
  return (
    <div className="page-container" style={{ padding: '40px', maxWidth: '800px', margin: '0 auto' }}>
      <div className="glass-panel" style={{ padding: '40px' }}>
        <h1 style={{ marginBottom: '24px', background: 'linear-gradient(to right, #60a5fa, #c084fc)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>
          About CSBS Calculator
        </h1>
        
        <p style={{ fontSize: '1.1rem', lineHeight: '1.6', color: 'var(--text-secondary)', marginBottom: '20px' }}>
          Welcome to the specialized CGPA & SGPA Calculator designed specifically for Computer Science and Business Systems (CSBS) students.
        </p>

        <h3 style={{ marginTop: '30px', marginBottom: '16px' }}>Our Mission</h3>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>
          To provide a seamless, accurate, and visually stunning tool for students to track their academic progress according to the latest university regulations.
        </p>

        <h3 style={{ marginTop: '30px', marginBottom: '16px' }}>Key Features</h3>
        <ul style={{ color: 'var(--text-secondary)', paddingLeft: '20px', lineHeight: '1.8' }}>
          <li>Regulation 2017 & 2021 Support</li>
          <li>Detailed subject mapping for all CSBS batches</li>
          <li>Secure student profiles to save performance history</li>
          <li>Real-time SGPA calculation</li>
          <li>Modern, anti-gravity glassmorphism design</li>
        </ul>
      </div>
    </div>
  );
}
