import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  Calculator, 
  Shield, 
  BarChart3, 
  Users, 
  Zap, 
  CheckCircle2, 
  ChevronDown, 
  ChevronUp,
  Star,
  ArrowRight,
  BookOpen,
  TrendingUp,
  Award,
  Clock,
  Download,
  Lock
} from 'lucide-react';

// FAQ Data
const faqData = [
  {
    question: "What is CGPA and how is it calculated?",
    answer: "CGPA (Cumulative Grade Point Average) is the average of grade points obtained in all semesters. It's calculated by multiplying each subject's grade points by its credits, summing them up, and dividing by total credits across all semesters."
  },
  {
    question: "How is SGPA different from CGPA?",
    answer: "SGPA (Semester Grade Point Average) is calculated for a single semester, while CGPA is the cumulative average across all completed semesters. SGPA helps track performance per semester, while CGPA shows overall academic standing."
  },
  {
    question: "Which university regulations are supported?",
    answer: "We currently support Anna University Regulation 2021 and 2023. Each regulation has different subject structures and credit distributions, and our calculator automatically adapts to the selected regulation."
  },
  {
    question: "Can I save my calculation history?",
    answer: "Yes! Once you sign up and log in, all your SGPA calculations are automatically saved. You can view your semester-wise history, track trends, and even download PDF reports of your academic progress."
  },
  {
    question: "Is my data secure?",
    answer: "Absolutely. We use Firebase for secure authentication and data storage. Your academic data is encrypted and only accessible by you. Admins can only see aggregated analytics, not individual grades."
  },
  {
    question: "How do I convert CGPA to percentage?",
    answer: "For Anna University: Percentage = CGPA × 10. For example, a CGPA of 8.5 equals 85%. Our calculator automatically shows the percentage conversion alongside your GPA."
  }
];

// Feature Card Component
const FeatureCard = ({ icon: Icon, title, description, delay = 0 }) => (
  <div 
    className="glass-panel animate-fadeInUp"
    style={{ 
      padding: 'var(--space-6)',
      textAlign: 'center',
      animationDelay: `${delay}ms`,
      transition: 'transform var(--transition-base), box-shadow var(--transition-base)',
      cursor: 'default'
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.transform = 'translateY(-8px)';
      e.currentTarget.style.boxShadow = 'var(--shadow-lg), var(--shadow-glow)';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = 'translateY(0)';
      e.currentTarget.style.boxShadow = 'var(--shadow-md)';
    }}
  >
    <div style={{
      width: '64px',
      height: '64px',
      borderRadius: 'var(--radius-lg)',
      background: 'linear-gradient(135deg, var(--primary), var(--accent-cyan))',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      margin: '0 auto var(--space-4)'
    }}>
      <Icon size={28} color="white" />
    </div>
    <h3 style={{ 
      fontSize: 'var(--font-size-lg)', 
      fontWeight: 'var(--font-semibold)',
      marginBottom: 'var(--space-2)'
    }}>
      {title}
    </h3>
    <p style={{ 
      color: 'var(--text-secondary)', 
      fontSize: 'var(--font-size-sm)',
      lineHeight: '1.6'
    }}>
      {description}
    </p>
  </div>
);

// FAQ Item Component
const FAQItem = ({ question, answer, isOpen, onClick }) => (
  <div 
    className="glass-panel"
    style={{ 
      marginBottom: 'var(--space-3)',
      overflow: 'hidden',
      transition: 'all var(--transition-base)'
    }}
  >
    <button
      onClick={onClick}
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 'var(--space-4) var(--space-5)',
        background: 'transparent',
        border: 'none',
        color: 'var(--text-primary)',
        cursor: 'pointer',
        textAlign: 'left',
        fontSize: 'var(--font-size-base)',
        fontWeight: 'var(--font-medium)'
      }}
    >
      {question}
      {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
    </button>
    <div style={{
      maxHeight: isOpen ? '200px' : '0',
      overflow: 'hidden',
      transition: 'max-height var(--transition-slow)',
      padding: isOpen ? '0 var(--space-5) var(--space-4)' : '0 var(--space-5)',
    }}>
      <p style={{ 
        color: 'var(--text-secondary)', 
        fontSize: 'var(--font-size-sm)',
        lineHeight: '1.7'
      }}>
        {answer}
      </p>
    </div>
  </div>
);

// Stat Card Component
const StatCard = ({ value, label, icon: Icon }) => (
  <div style={{
    textAlign: 'center',
    padding: 'var(--space-4)'
  }}>
    <Icon size={24} color="var(--accent-cyan)" style={{ marginBottom: 'var(--space-2)' }} />
    <div style={{ 
      fontSize: 'var(--font-size-3xl)', 
      fontWeight: 'var(--font-bold)',
      background: 'linear-gradient(135deg, var(--primary), var(--accent-cyan))',
      WebkitBackgroundClip: 'text',
      backgroundClip: 'text',
      color: 'transparent'
    }}>
      {value}
    </div>
    <div style={{ color: 'var(--text-muted)', fontSize: 'var(--font-size-sm)' }}>
      {label}
    </div>
  </div>
);

export default function LandingPage() {
  const { currentUser, userRole } = useAuth();
  const [openFAQ, setOpenFAQ] = useState(null);

  return (
    <div style={{ minHeight: '100vh' }}>
      {/* Hero Section */}
      <section style={{
        minHeight: '90vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--space-8) var(--space-4)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Background Gradient Orbs */}
        <div style={{
          position: 'absolute',
          top: '-20%',
          right: '-10%',
          width: '600px',
          height: '600px',
          background: 'radial-gradient(circle, rgba(26, 115, 232, 0.15), transparent 70%)',
          pointerEvents: 'none'
        }} />
        <div style={{
          position: 'absolute',
          bottom: '-30%',
          left: '-15%',
          width: '500px',
          height: '500px',
          background: 'radial-gradient(circle, rgba(6, 182, 212, 0.12), transparent 70%)',
          pointerEvents: 'none'
        }} />

        <div style={{ maxWidth: '1200px', width: '100%', textAlign: 'center', position: 'relative', zIndex: 10 }}>
          {/* Badge */}
          <div className="animate-fadeInUp" style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
            padding: 'var(--space-2) var(--space-4)',
            background: 'rgba(26, 115, 232, 0.15)',
            border: '1px solid rgba(26, 115, 232, 0.3)',
            borderRadius: 'var(--radius-full)',
            marginBottom: 'var(--space-6)',
            color: 'var(--primary-light)'
          }}>
            <Star size={16} fill="currentColor" />
            <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-medium)' }}>
              Trusted by 10,000+ Students
            </span>
          </div>

          {/* Main Heading */}
          <h1 className="animate-fadeInUp" style={{
            fontSize: 'clamp(2.5rem, 6vw, 4rem)',
            fontWeight: 'var(--font-extrabold)',
            lineHeight: '1.1',
            marginBottom: 'var(--space-6)',
            animationDelay: '100ms'
          }}>
            <span style={{
              background: 'linear-gradient(135deg, #FFFFFF, #CBD5E1)',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              color: 'transparent'
            }}>
              Smart CGPA & SGPA
            </span>
            <br />
            <span style={{
              background: 'linear-gradient(135deg, var(--primary), var(--accent-cyan))',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              color: 'transparent'
            }}>
              Calculator for Students
            </span>
          </h1>

          {/* Subheading */}
          <p className="animate-fadeInUp" style={{
            fontSize: 'clamp(1rem, 2.5vw, 1.25rem)',
            color: 'var(--text-secondary)',
            maxWidth: '650px',
            margin: '0 auto var(--space-8)',
            lineHeight: '1.7',
            animationDelay: '200ms'
          }}>
            Accurate, fast, and regulation-ready GPA calculations. 
            Track your academic progress with real-time analytics and insights.
          </p>

          {/* CTA Buttons */}
          <div className="animate-fadeInUp" style={{
            display: 'flex',
            gap: 'var(--space-4)',
            justifyContent: 'center',
            flexWrap: 'wrap',
            animationDelay: '300ms'
          }}>
            <Link to="/" className="btn-primary" style={{ 
              padding: 'var(--space-4) var(--space-8)',
              fontSize: 'var(--font-size-base)',
              gap: 'var(--space-3)'
            }}>
              <Calculator size={20} />
              Calculate Now
            </Link>
            {!currentUser ? (
              <Link to="/login" className="btn-secondary" style={{ 
                padding: 'var(--space-4) var(--space-8)',
                fontSize: 'var(--font-size-base)'
              }}>
                Admin Login
              </Link>
            ) : (userRole === 'super_admin' || userRole === 'year_admin') && (
              <Link to="/dashboard" className="btn-secondary" style={{ 
                padding: 'var(--space-4) var(--space-8)',
                fontSize: 'var(--font-size-base)'
              }}>
                Go to Dashboard
              </Link>
            )}
          </div>

          {/* Stats */}
          <div className="glass-panel animate-fadeInUp" style={{
            marginTop: 'var(--space-12)',
            padding: 'var(--space-6)',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
            gap: 'var(--space-4)',
            maxWidth: '700px',
            marginLeft: 'auto',
            marginRight: 'auto',
            animationDelay: '400ms'
          }}>
            <StatCard value="10K+" label="Students" icon={Users} />
            <StatCard value="50K+" label="Calculations" icon={Calculator} />
            <StatCard value="99.9%" label="Accuracy" icon={CheckCircle2} />
            <StatCard value="4.8★" label="Rating" icon={Star} />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section style={{
        padding: 'var(--space-16) var(--space-4)',
        background: 'linear-gradient(180deg, transparent, rgba(26, 115, 232, 0.03))'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 'var(--space-12)' }}>
            <h2 style={{ 
              fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', 
              fontWeight: 'var(--font-bold)',
              marginBottom: 'var(--space-4)'
            }}>
              Why Choose Our Calculator?
            </h2>
            <p style={{ 
              color: 'var(--text-secondary)', 
              maxWidth: '600px', 
              margin: '0 auto',
              fontSize: 'var(--font-size-lg)'
            }}>
              Built with precision and designed for students who want the best.
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 'var(--space-6)'
          }}>
            <FeatureCard 
              icon={Shield} 
              title="Multi-Regulation Support" 
              description="Seamlessly switch between Anna University Regulation 2021 and 2023 with automatic subject detection."
              delay={0}
            />
            <FeatureCard 
              icon={Lock} 
              title="Secure Admin System" 
              description="Role-based access control with Super Admin, Batch Admin, and Student roles for complete data security."
              delay={100}
            />
            <FeatureCard 
              icon={BarChart3} 
              title="Real-time Analytics" 
              description="Visualize your progress with interactive charts, trend analysis, and performance predictions."
              delay={200}
            />
            <FeatureCard 
              icon={Zap} 
              title="Lightning Fast" 
              description="Instant calculations with auto-save functionality. Never lose your data again."
              delay={300}
            />
            <FeatureCard 
              icon={Download} 
              title="Export Reports" 
              description="Download beautifully formatted PDF reports of your academic progress anytime."
              delay={400}
            />
            <FeatureCard 
              icon={TrendingUp} 
              title="Performance Insights" 
              description="Get personalized insights on improvement areas and track your academic journey."
              delay={500}
            />
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section style={{
        padding: 'var(--space-16) var(--space-4)',
      }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 'var(--space-12)' }}>
            <h2 style={{ 
              fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', 
              fontWeight: 'var(--font-bold)',
              marginBottom: 'var(--space-4)'
            }}>
              Calculate Your GPA in 3 Simple Steps
            </h2>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: 'var(--space-8)'
          }}>
            {[
              { step: 1, icon: BookOpen, title: "Select Your Regulation", desc: "Choose your university regulation and batch to load the correct subjects." },
              { step: 2, icon: Award, title: "Enter Your Grades", desc: "Select grades for each subject from the dropdown. Credits are auto-filled." },
              { step: 3, icon: TrendingUp, title: "Get Your Results", desc: "View your SGPA instantly with percentage conversion and save to history." }
            ].map(({ step, icon: Icon, title, desc }) => (
              <div key={step} style={{ textAlign: 'center' }}>
                <div style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, var(--primary), var(--accent-purple))',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto var(--space-4)',
                  fontSize: 'var(--font-size-2xl)',
                  fontWeight: 'var(--font-bold)',
                  color: 'white',
                  position: 'relative'
                }}>
                  {step}
                </div>
                <h3 style={{ 
                  fontSize: 'var(--font-size-xl)', 
                  fontWeight: 'var(--font-semibold)',
                  marginBottom: 'var(--space-2)'
                }}>
                  {title}
                </h3>
                <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                  {desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section style={{
        padding: 'var(--space-16) var(--space-4)',
        background: 'linear-gradient(180deg, rgba(6, 182, 212, 0.03), transparent)'
      }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 'var(--space-10)' }}>
            <h2 style={{ 
              fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', 
              fontWeight: 'var(--font-bold)',
              marginBottom: 'var(--space-4)'
            }}>
              Frequently Asked Questions
            </h2>
            <p style={{ color: 'var(--text-secondary)' }}>
              Everything you need to know about CGPA & SGPA calculations
            </p>
          </div>

          {faqData.map((faq, index) => (
            <FAQItem
              key={index}
              question={faq.question}
              answer={faq.answer}
              isOpen={openFAQ === index}
              onClick={() => setOpenFAQ(openFAQ === index ? null : index)}
            />
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section style={{
        padding: 'var(--space-16) var(--space-4)',
        textAlign: 'center'
      }}>
        <div className="glass-panel-elevated" style={{
          maxWidth: '800px',
          margin: '0 auto',
          padding: 'var(--space-12) var(--space-8)',
          background: 'linear-gradient(135deg, rgba(26, 115, 232, 0.1), rgba(6, 182, 212, 0.1))'
        }}>
          <h2 style={{ 
            fontSize: 'clamp(1.5rem, 4vw, 2rem)', 
            fontWeight: 'var(--font-bold)',
            marginBottom: 'var(--space-4)'
          }}>
            Ready to Calculate Your GPA?
          </h2>
          <p style={{ 
            color: 'var(--text-secondary)', 
            marginBottom: 'var(--space-6)',
            fontSize: 'var(--font-size-lg)'
          }}>
            Join thousands of students who trust our calculator for accurate results.
          </p>
          <Link to="/" className="btn-primary" style={{ 
            padding: 'var(--space-4) var(--space-10)',
            fontSize: 'var(--font-size-base)',
            gap: 'var(--space-3)'
          }}>
            Start Calculating
            <ArrowRight size={20} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        padding: 'var(--space-10) var(--space-4)',
        borderTop: '1px solid var(--glass-border)',
        marginTop: 'var(--space-8)'
      }}>
        <div style={{ 
          maxWidth: '1200px', 
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 'var(--space-8)'
        }}>
          {/* Brand */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
              <div style={{
                width: '40px',
                height: '40px',
                background: 'linear-gradient(135deg, var(--primary), var(--accent-cyan))',
                borderRadius: 'var(--radius-md)'
              }} />
              <span style={{ fontWeight: 'var(--font-bold)', fontSize: 'var(--font-size-lg)' }}>GPA Calculator</span>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)', lineHeight: '1.6' }}>
              Smart CGPA & SGPA calculator built for modern students. Accurate, fast, and reliable.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 style={{ fontWeight: 'var(--font-semibold)', marginBottom: 'var(--space-4)' }}>Quick Links</h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              <li><Link to="/" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: 'var(--font-size-sm)' }}>Calculator</Link></li>
              <li><Link to="/about" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: 'var(--font-size-sm)' }}>About</Link></li>
              <li><Link to="/contact" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: 'var(--font-size-sm)' }}>Contact</Link></li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 style={{ fontWeight: 'var(--font-semibold)', marginBottom: 'var(--space-4)' }}>Resources</h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              <li><a href="#faq" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: 'var(--font-size-sm)' }}>FAQ</a></li>
              <li><a href="#" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: 'var(--font-size-sm)' }}>CGPA Guide</a></li>
              <li><a href="#" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: 'var(--font-size-sm)' }}>Regulations</a></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 style={{ fontWeight: 'var(--font-semibold)', marginBottom: 'var(--space-4)' }}>Legal</h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              <li><a href="#" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: 'var(--font-size-sm)' }}>Privacy Policy</a></li>
              <li><a href="#" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: 'var(--font-size-sm)' }}>Terms of Service</a></li>
            </ul>
          </div>
        </div>

        <div style={{ 
          textAlign: 'center', 
          marginTop: 'var(--space-10)',
          paddingTop: 'var(--space-6)',
          borderTop: '1px solid var(--glass-border)',
          color: 'var(--text-muted)',
          fontSize: 'var(--font-size-sm)'
        }}>
          © 2025 Prem Kumar. All rights reserved.
        </div>
      </footer>

      {/* FAQ Schema for SEO */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          "mainEntity": faqData.map(faq => ({
            "@type": "Question",
            "name": faq.question,
            "acceptedAnswer": {
              "@type": "Answer",
              "text": faq.answer
            }
          }))
        })
      }} />
    </div>
  );
}
