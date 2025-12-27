/**
 * Batch Admin Overview
 * Dashboard overview with stats and quick actions
 */
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { GraduationCap, BookOpen, TrendingUp, Calendar, Users, RefreshCw, ArrowRight, CheckCircle, Activity } from 'lucide-react';
import { rtdb } from '../../../firebase/config';
import { ref, get } from 'firebase/database';
import { getRegulationByBatch } from '../../../data/regulations';
import { subjectsData } from '../../../data/subjects';

export default function BatchAdminOverview() {
  const { userData } = useAuth();
  const [stats, setStats] = useState({ 
    totalStudents: 0, 
    activeStudents: 0,
    totalSubjects: 0,
    totalCredits: 0
  });
  const [loading, setLoading] = useState(true);
  const [recentStudents, setRecentStudents] = useState([]);
  
  const assignedBatch = userData?.assignedBatch || userData?.assignedYear;
  const regulation = getRegulationByBatch(assignedBatch);

  useEffect(() => {
    if (assignedBatch) {
      fetchStats();
    }
  }, [assignedBatch]);

  async function fetchStats() {
    setLoading(true);
    try {
      // Fetch students
      const studentsRef = ref(rtdb, 'students');
      const studentsSnapshot = await get(studentsRef);
      
      let students = [];
      let activeCount = 0;
      
      if (studentsSnapshot.exists()) {
        const allStudents = studentsSnapshot.val();
        students = Object.entries(allStudents)
          .map(([id, data]) => ({ id, ...data }))
          .filter(s => s.batch === assignedBatch);
        
        activeCount = students.filter(s => s.status === 'active').length;
        
        // Get recent students (last 5)
        const sorted = [...students].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        setRecentStudents(sorted.slice(0, 5));
      }
      
      // Fetch subjects or use local data
      let totalSubjectsCount = 0;
      let totalCreditsCount = 0;
      
      // Try RTDB first
      const subjectsRef = ref(rtdb, `subjects/${assignedBatch}`);
      const subjectsSnapshot = await get(subjectsRef);
      
      if (subjectsSnapshot.exists()) {
        const subjectsData = subjectsSnapshot.val();
        for (let sem = 1; sem <= 8; sem++) {
          const semSubjects = subjectsData[sem.toString()] || [];
          if (Array.isArray(semSubjects)) {
            totalSubjectsCount += semSubjects.length;
            totalCreditsCount += semSubjects.reduce((sum, s) => sum + (parseFloat(s.credits) || 0), 0);
          }
        }
      } else {
        // Fallback to local data
        const localData = subjectsData[assignedBatch] || {};
        for (const sem in localData) {
          const semSubjects = localData[sem] || [];
          totalSubjectsCount += semSubjects.length;
          totalCreditsCount += semSubjects.reduce((sum, s) => sum + (parseFloat(s.credits) || 0), 0);
        }
      }
      
      setStats({
        totalStudents: students.length,
        activeStudents: activeCount,
        totalSubjects: totalSubjectsCount,
        totalCredits: totalCreditsCount
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  }

  const statCards = [
    { 
      label: 'Total Students', 
      value: stats.totalStudents, 
      icon: GraduationCap, 
      color: '#3b82f6', 
      bgColor: 'rgba(59,130,246,0.15)',
      link: '/dashboard/students'
    },
    { 
      label: 'Active Students', 
      value: stats.activeStudents, 
      icon: Users, 
      color: '#10b981', 
      bgColor: 'rgba(16,185,129,0.15)' 
    },
    { 
      label: 'Total Subjects', 
      value: stats.totalSubjects, 
      icon: BookOpen, 
      color: '#8b5cf6', 
      bgColor: 'rgba(139,92,246,0.15)',
      link: '/dashboard/subjects'
    },
    { 
      label: 'Total Credits', 
      value: stats.totalCredits, 
      icon: Activity, 
      color: '#f59e0b', 
      bgColor: 'rgba(245,158,11,0.15)' 
    }
  ];

  return (
    <div>
      {/* Welcome Header */}
      <div style={{ 
        marginBottom: '32px', 
        padding: '24px',
        background: 'linear-gradient(135deg, rgba(59,130,246,0.1), rgba(139,92,246,0.1))',
        borderRadius: '16px',
        border: '1px solid rgba(139,92,246,0.2)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ margin: '0 0 8px', fontSize: '28px', fontWeight: '700' }}>
              Welcome back, {userData?.fullName?.split(' ')[0] || 'Admin'}! 👋
            </h1>
            <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '15px' }}>
              Here's what's happening with your batch today.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div style={{ 
              padding: '8px 16px', 
              background: 'rgba(59,130,246,0.2)', 
              borderRadius: '8px',
              fontSize: '14px',
              color: '#60a5fa'
            }}>
              <Calendar size={16} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
              {assignedBatch}
            </div>
            <div style={{ 
              padding: '8px 16px', 
              background: 'rgba(139,92,246,0.2)', 
              borderRadius: '8px',
              fontSize: '14px',
              color: '#a78bfa'
            }}>
              Regulation {regulation}
            </div>
            <button 
              onClick={fetchStats}
              disabled={loading}
              style={{ 
                padding: '10px', 
                background: 'rgba(255,255,255,0.1)', 
                border: 'none', 
                borderRadius: '8px', 
                cursor: 'pointer',
                color: 'var(--text-secondary)',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: '16px', 
        marginBottom: '32px' 
      }}>
        {statCards.map((stat, index) => (
          <div 
            key={index}
            className="glass-panel" 
            style={{ 
              padding: '20px',
              cursor: stat.link ? 'pointer' : 'default',
              transition: 'all 0.2s',
              position: 'relative'
            }}
            onClick={() => stat.link && window.location.assign(stat.link)}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <div style={{ 
                width: '48px', 
                height: '48px', 
                background: stat.bgColor, 
                borderRadius: '12px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center' 
              }}>
                <stat.icon size={24} color={stat.color} />
              </div>
              {stat.link && <ArrowRight size={18} color="var(--text-secondary)" />}
            </div>
            <div style={{ marginTop: '16px' }}>
              <div style={{ fontSize: '32px', fontWeight: '700', lineHeight: 1 }}>
                {loading ? '...' : stat.value}
              </div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                {stat.label}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '24px' }}>
        {/* Recent Students */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>Recent Students</h3>
            <Link to="/dashboard/students" style={{ color: 'var(--accent-primary)', textDecoration: 'none', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              View all <ArrowRight size={14} />
            </Link>
          </div>
          
          {recentStudents.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-secondary)' }}>
              <GraduationCap size={40} style={{ marginBottom: '12px', opacity: 0.5 }} />
              <p style={{ margin: 0 }}>No students yet</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {recentStudents.map((student, i) => (
                <div key={i} style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '12px',
                  padding: '12px',
                  background: 'rgba(255,255,255,0.03)',
                  borderRadius: '10px'
                }}>
                  <div style={{ 
                    width: '40px', 
                    height: '40px', 
                    background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', 
                    borderRadius: '10px', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    color: 'white',
                    fontWeight: '600'
                  }}>
                    {(student.name || student.fullName || 'S').charAt(0).toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: '500', fontSize: '14px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {student.name || student.fullName}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
                      {student.regNum || student.registerNumber}
                    </div>
                  </div>
                  <span style={{ 
                    padding: '4px 8px', 
                    fontSize: '11px', 
                    borderRadius: '6px',
                    background: student.status === 'active' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                    color: student.status === 'active' ? '#10b981' : '#ef4444'
                  }}>
                    {student.status || 'active'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions & Permissions */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ margin: '0 0 20px', fontSize: '16px', fontWeight: '600' }}>Quick Actions</h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
            <Link to="/dashboard/students" style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '12px',
              padding: '14px',
              background: 'rgba(59,130,246,0.1)',
              border: '1px solid rgba(59,130,246,0.2)',
              borderRadius: '10px',
              textDecoration: 'none',
              color: 'var(--text-primary)',
              transition: 'all 0.2s'
            }}>
              <GraduationCap size={20} color="#3b82f6" />
              <span>Manage Students</span>
              <ArrowRight size={16} style={{ marginLeft: 'auto' }} color="var(--text-secondary)" />
            </Link>
            
            <Link to="/dashboard/subjects" style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '12px',
              padding: '14px',
              background: 'rgba(139,92,246,0.1)',
              border: '1px solid rgba(139,92,246,0.2)',
              borderRadius: '10px',
              textDecoration: 'none',
              color: 'var(--text-primary)',
              transition: 'all 0.2s'
            }}>
              <BookOpen size={20} color="#8b5cf6" />
              <span>Manage Subjects</span>
              <ArrowRight size={16} style={{ marginLeft: 'auto' }} color="var(--text-secondary)" />
            </Link>
          </div>

          <h4 style={{ margin: '0 0 12px', fontSize: '14px', fontWeight: '500', color: 'var(--text-secondary)' }}>Your Permissions</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px' }}>
              <CheckCircle size={16} color="#10b981" />
              <span>Manage students in your batch</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px' }}>
              <CheckCircle size={16} color="#10b981" />
              <span>Add, edit, delete subjects</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px' }}>
              <CheckCircle size={16} color="#10b981" />
              <span>View student grades & progress</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
