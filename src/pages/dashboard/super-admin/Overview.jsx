/**
 * Super Admin Overview Dashboard
 * Real-time statistics from Firebase Realtime Database
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { rtdb } from '../../../firebase/config';
import { ref, get } from 'firebase/database';
import { 
  Users, 
  GraduationCap, 
  Activity, 
  TrendingUp,
  Calendar,
  Clock,
  RefreshCw,
  Database
} from 'lucide-react';

export default function SuperAdminOverview() {
  const { userData } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    students: { total: 0, byBatch: {}, byRegulation: {} },
    admins: { total: 0, superAdmins: 0, batchAdmins: 0 },
    activities: { total: 0, recent: [] },
    grades: { total: 0 }
  });

  useEffect(() => {
    fetchStats();
  }, []);

  async function fetchStats() {
    setLoading(true);
    try {
      const [studentsSnap, adminsSnap, activitiesSnap, gradesSnap] = await Promise.all([
        get(ref(rtdb, 'students')),
        get(ref(rtdb, 'admins')),
        get(ref(rtdb, 'activity_logs')),
        get(ref(rtdb, 'grades'))
      ]);

      // Process students
      let studentStats = { total: 0, byBatch: {}, byRegulation: {} };
      if (studentsSnap.exists()) {
        const students = Object.values(studentsSnap.val());
        studentStats.total = students.length;
        
        students.forEach(student => {
          // By batch
          if (student.batch) {
            studentStats.byBatch[student.batch] = (studentStats.byBatch[student.batch] || 0) + 1;
          }
          // By regulation
          if (student.regulation) {
            studentStats.byRegulation[student.regulation] = (studentStats.byRegulation[student.regulation] || 0) + 1;
          }
        });
      }

      // Process admins
      let adminStats = { total: 0, superAdmins: 0, batchAdmins: 0 };
      if (adminsSnap.exists()) {
        const admins = Object.values(adminsSnap.val());
        adminStats.total = admins.length;
        adminStats.superAdmins = admins.filter(a => a.role === 'super_admin').length;
        adminStats.batchAdmins = admins.filter(a => a.role === 'batch_admin' || a.role === 'year_admin').length;
      }

      // Process activities
      let activityStats = { total: 0, recent: [] };
      if (activitiesSnap.exists()) {
        const activities = Object.entries(activitiesSnap.val()).map(([id, data]) => ({ id, ...data }));
        activityStats.total = activities.length;
        activityStats.recent = activities
          .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
          .slice(0, 5);
      }

      // Process grades
      let gradeStats = { total: 0 };
      if (gradesSnap.exists()) {
        gradeStats.total = Object.keys(gradesSnap.val()).length;
      }

      setStats({
        students: studentStats,
        admins: adminStats,
        activities: activityStats,
        grades: gradeStats
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  }

  const statCards = [
    {
      title: 'Total Students',
      value: stats.students.total,
      subtitle: `${Object.keys(stats.students.byBatch).length} batches`,
      icon: GraduationCap,
      color: '#3b82f6'
    },
    {
      title: 'Total Admins',
      value: stats.admins.total,
      subtitle: `${stats.admins.superAdmins} super, ${stats.admins.batchAdmins} batch`,
      icon: Users,
      color: '#8b5cf6'
    },
    {
      title: 'Activity Logs',
      value: stats.activities.total,
      subtitle: 'total actions',
      icon: Activity,
      color: '#10b981'
    },
    {
      title: 'Grade Records',
      value: stats.grades.total,
      subtitle: 'saved SGPAs',
      icon: TrendingUp,
      color: '#f59e0b'
    }
  ];

  // Sort batches by count
  const topBatches = Object.entries(stats.students.byBatch)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ margin: '0 0 8px', fontSize: '28px', fontWeight: '700' }}>
            Welcome back, {userData?.fullName || 'Admin'}!
          </h1>
          <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
            Here's what's happening with your platform.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px', 
            padding: '8px 16px',
            background: 'rgba(255,255,255,0.03)',
            borderRadius: '8px',
            fontSize: '14px',
            color: 'var(--text-secondary)'
          }}>
            <Calendar size={16} />
            {new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </div>
          <button 
            onClick={fetchStats}
            disabled={loading}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px',
              padding: '10px 16px',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
              color: 'var(--text-primary)',
              cursor: 'pointer'
            }}
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
        {statCards.map((stat, index) => (
          <div key={index} className="glass-panel" style={{ padding: '24px', display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
            <div style={{ 
              width: '48px', 
              height: '48px', 
              background: `${stat.color}20`, 
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <stat.icon size={24} color={stat.color} />
            </div>
            <div>
              <p style={{ margin: '0 0 8px', fontSize: '13px', color: 'var(--text-secondary)' }}>{stat.title}</p>
              <p style={{ margin: '0 0 4px', fontSize: '28px', fontWeight: '700' }}>
                {loading ? '-' : stat.value}
              </p>
              <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)' }}>{stat.subtitle}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Content Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        {/* Students by Batch */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ margin: '0 0 20px', fontSize: '16px', fontWeight: '600' }}>Students by Batch</h3>
          {topBatches.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {topBatches.map(([batch, count], i) => (
                <div key={batch} style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  padding: '12px 16px',
                  background: 'rgba(255,255,255,0.03)',
                  borderRadius: '10px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ 
                      width: '24px', 
                      height: '24px', 
                      background: 'rgba(139,92,246,0.15)', 
                      borderRadius: '6px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '12px',
                      fontWeight: '600',
                      color: '#a78bfa'
                    }}>
                      {i + 1}
                    </span>
                    <span style={{ fontWeight: '500' }}>{batch}</span>
                  </div>
                  <span style={{ 
                    padding: '4px 12px', 
                    background: 'rgba(59,130,246,0.15)', 
                    borderRadius: '6px',
                    fontSize: '13px',
                    color: '#60a5fa'
                  }}>
                    {count} students
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '20px' }}>
              No student data yet
            </p>
          )}
        </div>

        {/* Recent Activity */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>Recent Activity</h3>
            <a href="/dashboard/activity" style={{ fontSize: '13px', color: 'var(--accent-primary)', textDecoration: 'none' }}>
              View All
            </a>
          </div>
          {stats.activities.recent.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {stats.activities.recent.map((activity, i) => (
                <div key={activity.id || i} style={{ 
                  display: 'flex', 
                  gap: '12px',
                  padding: '12px',
                  background: 'rgba(255,255,255,0.02)',
                  borderRadius: '10px'
                }}>
                  <div style={{ 
                    width: '32px', 
                    height: '32px', 
                    background: 'rgba(59,130,246,0.1)', 
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Activity size={16} color="#3b82f6" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: '0 0 4px', fontSize: '14px' }}>
                      {activity.type?.replace(/_/g, ' ') || 'Activity'}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                      <Clock size={12} />
                      {activity.timestamp ? new Date(activity.timestamp).toLocaleString() : 'Just now'}
                      {activity.adminName && ` • ${activity.adminName}`}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '20px' }}>
              No recent activity
            </p>
          )}
        </div>
      </div>

      {/* Regulation Distribution */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <h3 style={{ margin: '0 0 20px', fontSize: '16px', fontWeight: '600' }}>Students by Regulation</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px' }}>
          {Object.entries(stats.students.byRegulation).length > 0 ? (
            Object.entries(stats.students.byRegulation).map(([reg, count]) => (
              <div key={reg} style={{ 
                padding: '20px', 
                background: 'rgba(255,255,255,0.03)', 
                borderRadius: '12px',
                textAlign: 'center'
              }}>
                <p style={{ margin: '0 0 8px', fontSize: '13px', color: 'var(--text-secondary)' }}>Regulation {reg}</p>
                <p style={{ margin: 0, fontSize: '32px', fontWeight: '700', color: '#8b5cf6' }}>{count}</p>
                <p style={{ margin: '4px 0 0', fontSize: '12px', color: 'var(--text-secondary)' }}>students</p>
              </div>
            ))
          ) : (
            <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '20px', gridColumn: '1 / -1' }}>
              No regulation data yet
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
