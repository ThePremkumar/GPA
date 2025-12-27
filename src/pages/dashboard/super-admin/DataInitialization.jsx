/**
 * Data Initialization Page
 * Super Admin can initialize and sync all data to Firebase Realtime Database
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useToast } from '../../../contexts/ToastContext';
import { 
  Database, 
  RefreshCw, 
  CheckCircle, 
  AlertCircle, 
  Upload,
  BookOpen,
  Calendar,
  Settings,
  Loader,
  Users,
  Activity
} from 'lucide-react';
import { rtdb } from '../../../firebase/config';
import { ref, get } from 'firebase/database';
import { initializeRealtimeData, getDatabaseStats } from '../../../services/realtimeDbService';

export default function DataInitialization() {
  const { userData } = useAuth();
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [stats, setStats] = useState({
    subjects: 0,
    regulations: 0,
    batches: 0,
    students: 0,
    admins: 0,
    activities: 0,
    grades: 0
  });
  const [lastSync, setLastSync] = useState(null);

  useEffect(() => {
    fetchStats();
  }, []);

  async function fetchStats() {
    setLoading(true);
    try {
      // Fetch counts from Realtime Database
      const [
        subjectsSnap,
        regulationsSnap,
        batchesSnap,
        studentsSnap,
        adminsSnap,
        activitiesSnap,
        gradesSnap,
        configSnap
      ] = await Promise.all([
        get(ref(rtdb, 'subjects')),
        get(ref(rtdb, 'regulations')),
        get(ref(rtdb, 'batches')),
        get(ref(rtdb, 'students')),
        get(ref(rtdb, 'admins')),
        get(ref(rtdb, 'activity_logs')),
        get(ref(rtdb, 'grades')),
        get(ref(rtdb, 'config/settings'))
      ]);

      setStats({
        subjects: subjectsSnap.exists() ? Object.keys(subjectsSnap.val()).length : 0,
        regulations: regulationsSnap.exists() ? Object.keys(regulationsSnap.val()).length : 0,
        batches: batchesSnap.exists() ? Object.keys(batchesSnap.val()).length : 0,
        students: studentsSnap.exists() ? Object.keys(studentsSnap.val()).length : 0,
        admins: adminsSnap.exists() ? Object.keys(adminsSnap.val()).length : 0,
        activities: activitiesSnap.exists() ? Object.keys(activitiesSnap.val()).length : 0,
        grades: gradesSnap.exists() ? Object.keys(gradesSnap.val()).length : 0
      });

      // Get config for last sync time
      if (configSnap.exists() && configSnap.val().updatedAt) {
        setLastSync(new Date(configSnap.val().updatedAt));
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
      addToast('Failed to fetch database stats', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function handleInitializeData() {
    if (!window.confirm('This will initialize all static data in Firebase Realtime Database. Continue?')) return;
    
    setSyncing(true);
    try {
      const result = await initializeRealtimeData();
      addToast(
        `Data initialized! Subjects: ${result.results.subjects}, Regulations: ${result.results.regulations}, Batches: ${result.results.batches}`, 
        'success'
      );
      fetchStats();
    } catch (error) {
      addToast('Failed to initialize data: ' + error.message, 'error');
    } finally {
      setSyncing(false);
    }
  }

  const statCards = [
    { label: 'Subject Collections', value: stats.subjects, icon: BookOpen, color: '#3b82f6' },
    { label: 'Regulations', value: stats.regulations, icon: Settings, color: '#8b5cf6' },
    { label: 'Batches', value: stats.batches, icon: Calendar, color: '#10b981' },
    { label: 'Students', value: stats.students, icon: Users, color: '#f59e0b' },
    { label: 'Admins', value: stats.admins, icon: Database, color: '#ef4444' },
    { label: 'Activity Logs', value: stats.activities, icon: Activity, color: '#06b6d4' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ margin: '0 0 8px', fontSize: '24px', fontWeight: '700' }}>Data Management</h1>
          <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Initialize and sync data to Firebase Realtime Database</p>
        </div>
        <button 
          className="btn-primary" 
          onClick={handleInitializeData}
          disabled={syncing}
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          {syncing ? <Loader size={18} className="animate-spin" /> : <Upload size={18} />}
          {syncing ? 'Syncing...' : 'Initialize Data'}
        </button>
      </div>

      {/* Database Info */}
      <div className="glass-panel" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)' }}>
        <Database size={20} color="#3b82f6" />
        <span style={{ color: '#3b82f6' }}>
          Using Firebase Realtime Database: <code style={{ background: 'rgba(0,0,0,0.2)', padding: '2px 6px', borderRadius: '4px' }}>csbs-c7487-default-rtdb</code>
        </span>
      </div>

      {/* Last Sync Info */}
      {lastSync && (
        <div className="glass-panel" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)' }}>
          <CheckCircle size={20} color="#10b981" />
          <span style={{ color: '#10b981' }}>
            Last synced: {lastSync.toLocaleString()}
          </span>
        </div>
      )}

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

      {/* Data Collections Info */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <h3 style={{ margin: '0 0 20px' }}>Realtime Database Structure</h3>
        
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'rgba(255,255,255,0.03)' }}>
              <th style={{ padding: '14px 20px', textAlign: 'left', fontSize: '13px', color: 'var(--text-secondary)' }}>Path</th>
              <th style={{ padding: '14px 20px', textAlign: 'left', fontSize: '13px', color: 'var(--text-secondary)' }}>Description</th>
              <th style={{ padding: '14px 20px', textAlign: 'left', fontSize: '13px', color: 'var(--text-secondary)' }}>Records</th>
              <th style={{ padding: '14px 20px', textAlign: 'left', fontSize: '13px', color: 'var(--text-secondary)' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {[
              { name: '/subjects', desc: 'Subject data per batch/semester', count: stats.subjects },
              { name: '/regulations', desc: 'Academic regulations (2021, 2023, etc.)', count: stats.regulations },
              { name: '/batches', desc: 'Batch information and metadata', count: stats.batches },
              { name: '/students', desc: 'Student profiles and data', count: stats.students },
              { name: '/admins', desc: 'Admin accounts and roles', count: stats.admins },
              { name: '/grades', desc: 'Student grade records', count: stats.grades },
              { name: '/activity_logs', desc: 'Audit trail of all actions', count: stats.activities },
              { name: '/config', desc: 'Application settings', count: 1 },
            ].map((col, i) => (
              <tr key={i} style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <td style={{ padding: '14px 20px', fontFamily: 'monospace', color: 'var(--accent-primary)' }}>{col.name}</td>
                <td style={{ padding: '14px 20px', color: 'var(--text-secondary)' }}>{col.desc}</td>
                <td style={{ padding: '14px 20px' }}>{loading ? '-' : col.count}</td>
                <td style={{ padding: '14px 20px' }}>
                  {col.count > 0 ? (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#10b981' }}>
                      <CheckCircle size={14} /> Active
                    </span>
                  ) : (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#f59e0b' }}>
                      <AlertCircle size={14} /> Empty
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Instructions */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <h3 style={{ margin: '0 0 16px' }}>How Data Sync Works</h3>
        <ol style={{ margin: 0, padding: '0 0 0 20px', lineHeight: 2, color: 'var(--text-secondary)' }}>
          <li>Click <strong>"Initialize Data"</strong> to sync all static subject data to Realtime Database</li>
          <li>This creates nodes at <code>/subjects</code>, <code>/regulations</code>, and <code>/batches</code></li>
          <li>Existing data is <strong>not overwritten</strong> - only missing data is added</li>
          <li>Student data, admin data, and grades are managed separately through their respective pages</li>
          <li>All data syncs in <strong>real-time</strong> across all connected clients</li>
        </ol>
      </div>

      {/* Refresh Button */}
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <button 
          onClick={fetchStats}
          disabled={loading}
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px',
            padding: '12px 24px',
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '10px',
            color: 'var(--text-primary)',
            cursor: 'pointer'
          }}
        >
          <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          Refresh Stats
        </button>
      </div>
    </div>
  );
}
