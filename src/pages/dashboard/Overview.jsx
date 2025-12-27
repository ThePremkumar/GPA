import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { rtdb } from '../../firebase/config';
import { ref, get } from 'firebase/database';
import { Users, TrendingUp, GraduationCap, Activity, RefreshCw } from 'lucide-react';

export default function Overview() {
  const { userData, userRole } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    students: 0,
    admins: 0,
    batches: 0,
    activities: 0
  });

  useEffect(() => {
    fetchStats();
  }, []);

  async function fetchStats() {
    setLoading(true);
    try {
      const [studentsSnap, adminsSnap, batchesSnap, activitiesSnap] = await Promise.all([
        get(ref(rtdb, 'students')),
        get(ref(rtdb, 'admins')),
        get(ref(rtdb, 'batches')),
        get(ref(rtdb, 'activity_logs'))
      ]);

      // Count students (filter by batch for batch admin)
      let studentCount = 0;
      if (studentsSnap.exists()) {
        const students = studentsSnap.val();
        if (userRole === 'year_admin' && userData?.assignedYear) {
          studentCount = Object.values(students).filter(s => s.batch === userData.assignedYear).length;
        } else {
          studentCount = Object.keys(students).length;
        }
      }

      setStats({
        students: studentCount,
        admins: adminsSnap.exists() ? Object.keys(adminsSnap.val()).length : 0,
        batches: batchesSnap.exists() ? Object.keys(batchesSnap.val()).length : 0,
        activities: activitiesSnap.exists() ? Object.keys(activitiesSnap.val()).length : 0
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  }

  const statCards = [
    { label: 'Total Students', value: stats.students, icon: Users, color: '#3b82f6' },
    { label: 'Total Admins', value: stats.admins, icon: TrendingUp, color: '#10b981' },
    { label: 'Batches', value: stats.batches, icon: GraduationCap, color: '#8b5cf6' },
    { label: 'Activities', value: stats.activities, icon: Activity, color: '#f59e0b' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ margin: '0 0 8px', fontSize: '24px', fontWeight: '700' }}>Dashboard Overview</h1>
          <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
            Welcome, {userRole === 'super_admin' ? 'Super Admin' : `Batch Admin (${userData?.assignedYear || userData?.assignedBatch || 'N/A'})`}
          </p>
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
      
      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        {statCards.map((stat, i) => (
          <div key={i} className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
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
              <div style={{ fontSize: '28px', fontWeight: '700' }}>
                {loading ? '-' : stat.value}
              </div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{stat.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* System Status */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>System Status</h3>
          <span style={{ 
            padding: '6px 12px', 
            background: 'rgba(34,197,94,0.15)', 
            color: '#22c55e',
            borderRadius: '6px',
            fontSize: '13px',
            fontWeight: '500'
          }}>
            Active
          </span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px' }}>
          <div style={{ padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px' }}>
            <p style={{ margin: '0 0 4px', fontSize: '13px', color: 'var(--text-secondary)' }}>Database</p>
            <p style={{ margin: 0, fontWeight: '600', color: '#22c55e' }}>Realtime DB</p>
          </div>
          <div style={{ padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px' }}>
            <p style={{ margin: '0 0 4px', fontSize: '13px', color: 'var(--text-secondary)' }}>Auth Service</p>
            <p style={{ margin: 0, fontWeight: '600', color: '#22c55e' }}>Connected</p>
          </div>
          <div style={{ padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px' }}>
            <p style={{ margin: '0 0 4px', fontSize: '13px', color: 'var(--text-secondary)' }}>Last Refresh</p>
            <p style={{ margin: 0, fontWeight: '600' }}>{new Date().toLocaleTimeString()}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
