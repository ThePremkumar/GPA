/**
 * Analytics Dashboard
 * Real data insights from Firebase Realtime Database
 */

import React, { useState, useEffect } from 'react';
import { rtdb } from '../../../firebase/config';
import { ref, get } from 'firebase/database';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  GraduationCap,
  Download,
  RefreshCw
} from 'lucide-react';

export default function AnalyticsDashboard() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    students: { total: 0, byBatch: {}, byRegulation: {} },
    admins: { total: 0, superAdmins: 0, batchAdmins: 0 },
    activities: { total: 0, byType: {} },
    grades: { total: 0, byBatch: {} }
  });

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
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
          if (student.batch) {
            studentStats.byBatch[student.batch] = (studentStats.byBatch[student.batch] || 0) + 1;
          }
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
      let activityStats = { total: 0, byType: {} };
      if (activitiesSnap.exists()) {
        const activities = Object.values(activitiesSnap.val());
        activityStats.total = activities.length;
        
        activities.forEach(activity => {
          if (activity.type) {
            activityStats.byType[activity.type] = (activityStats.byType[activity.type] || 0) + 1;
          }
        });
      }

      // Process grades
      let gradeStats = { total: 0, byBatch: {} };
      if (gradesSnap.exists()) {
        const grades = Object.values(gradesSnap.val());
        gradeStats.total = grades.length;
        
        grades.forEach(grade => {
          if (grade.batch) {
            gradeStats.byBatch[grade.batch] = (gradeStats.byBatch[grade.batch] || 0) + 1;
          }
        });
      }

      setData({
        students: studentStats,
        admins: adminStats,
        activities: activityStats,
        grades: gradeStats
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  }

  // Sort batches by count for display
  const batchData = Object.entries(data.students.byBatch)
    .sort((a, b) => b[1] - a[1]);

  const regulationData = Object.entries(data.students.byRegulation);
  const activityData = Object.entries(data.activities.byType).sort((a, b) => b[1] - a[1]);
  const gradeData = Object.entries(data.grades.byBatch).sort((a, b) => b[1] - a[1]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ margin: '0 0 8px', fontSize: '24px', fontWeight: '700' }}>Analytics Dashboard</h1>
          <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Real-time data insights from Firebase</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button 
            onClick={fetchData}
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

      {/* Quick Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '48px', height: '48px', background: 'rgba(59,130,246,0.15)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <GraduationCap size={24} color="#3b82f6" />
          </div>
          <div>
            <span style={{ fontSize: '28px', fontWeight: '700' }}>{loading ? '-' : data.students.total}</span>
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)' }}>Total Students</p>
          </div>
        </div>
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '48px', height: '48px', background: 'rgba(139,92,246,0.15)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Users size={24} color="#8b5cf6" />
          </div>
          <div>
            <span style={{ fontSize: '28px', fontWeight: '700' }}>{loading ? '-' : data.admins.total}</span>
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)' }}>Total Admins</p>
          </div>
        </div>
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '48px', height: '48px', background: 'rgba(16,185,129,0.15)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <BarChart3 size={24} color="#10b981" />
          </div>
          <div>
            <span style={{ fontSize: '28px', fontWeight: '700' }}>{loading ? '-' : Object.keys(data.students.byBatch).length}</span>
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)' }}>Active Batches</p>
          </div>
        </div>
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '48px', height: '48px', background: 'rgba(245,158,11,0.15)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <TrendingUp size={24} color="#f59e0b" />
          </div>
          <div>
            <span style={{ fontSize: '28px', fontWeight: '700' }}>{loading ? '-' : data.grades.total}</span>
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)' }}>Grade Records</p>
          </div>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '200px', gap: '16px' }}>
          <div style={{ width: '40px', height: '40px', border: '3px solid rgba(59,130,246,0.2)', borderTopColor: '#3b82f6', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          <p>Loading analytics...</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      ) : (
        <>
          {/* Content Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            {/* Students by Batch */}
            <div className="glass-panel" style={{ padding: '24px' }}>
              <h3 style={{ margin: '0 0 20px', fontSize: '16px', fontWeight: '600' }}>Students by Batch</h3>
              {batchData.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {batchData.map(([batch, count]) => (
                    <div key={batch} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <span style={{ fontWeight: '500' }}>{batch}</span>
                          <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>{count} ({((count / data.students.total) * 100).toFixed(1)}%)</span>
                        </div>
                        <div style={{ height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                          <div style={{ 
                            height: '100%', 
                            width: `${(count / data.students.total) * 100}%`,
                            background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)',
                            borderRadius: '4px'
                          }} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '20px' }}>No batch data</p>
              )}
            </div>

            {/* Students by Regulation */}
            <div className="glass-panel" style={{ padding: '24px' }}>
              <h3 style={{ margin: '0 0 20px', fontSize: '16px', fontWeight: '600' }}>Students by Regulation</h3>
              {regulationData.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {regulationData.map(([reg, count]) => (
                    <div key={reg} style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      padding: '16px',
                      background: 'rgba(255,255,255,0.03)',
                      borderRadius: '10px'
                    }}>
                      <span style={{ fontWeight: '500' }}>Regulation {reg}</span>
                      <span style={{ 
                        padding: '6px 16px', 
                        background: 'rgba(139,92,246,0.15)', 
                        borderRadius: '8px',
                        fontSize: '14px',
                        fontWeight: '600',
                        color: '#a78bfa'
                      }}>
                        {count} students
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '20px' }}>No regulation data</p>
              )}
            </div>
          </div>

          {/* Activity and Grade Tables */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            {/* Activity Breakdown */}
            <div className="glass-panel" style={{ padding: '0', overflow: 'hidden' }}>
              <div style={{ padding: '20px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>Activity Breakdown</h3>
              </div>
              {activityData.length > 0 ? (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                      <th style={{ padding: '12px 20px', textAlign: 'left', fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '500' }}>TYPE</th>
                      <th style={{ padding: '12px 20px', textAlign: 'left', fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '500' }}>COUNT</th>
                      <th style={{ padding: '12px 20px', textAlign: 'left', fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '500' }}>%</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activityData.map(([type, count]) => (
                      <tr key={type} style={{ borderTop: '1px solid rgba(255,255,255,0.03)' }}>
                        <td style={{ padding: '12px 20px', textTransform: 'capitalize' }}>{type.replace(/_/g, ' ')}</td>
                        <td style={{ padding: '12px 20px' }}>{count}</td>
                        <td style={{ padding: '12px 20px' }}>{((count / data.activities.total) * 100).toFixed(1)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '40px' }}>No activity data</p>
              )}
            </div>

            {/* Grades by Batch */}
            <div className="glass-panel" style={{ padding: '0', overflow: 'hidden' }}>
              <div style={{ padding: '20px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>Grade Records by Batch</h3>
              </div>
              {gradeData.length > 0 ? (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                      <th style={{ padding: '12px 20px', textAlign: 'left', fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '500' }}>BATCH</th>
                      <th style={{ padding: '12px 20px', textAlign: 'left', fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '500' }}>RECORDS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {gradeData.map(([batch, count]) => (
                      <tr key={batch} style={{ borderTop: '1px solid rgba(255,255,255,0.03)' }}>
                        <td style={{ padding: '12px 20px' }}>{batch}</td>
                        <td style={{ padding: '12px 20px' }}>{count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '40px' }}>No grade records yet</p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
