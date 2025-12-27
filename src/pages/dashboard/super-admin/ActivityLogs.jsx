/**
 * Activity Logs Page for Super Admin
 * Shows all admin activity logs with filtering
 */
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { getActivityLogs, ACTIVITY_TYPES } from '../../../services/activityService';
import { Activity, RefreshCw, Filter, Search, User, Calendar, Clock } from 'lucide-react';

const ACTIVITY_ICONS = {
  ADMIN_LOGIN: { icon: '🔐', color: '#3b82f6', label: 'Login' },
  ADMIN_LOGOUT: { icon: '🚪', color: '#6b7280', label: 'Logout' },
  ADMIN_CREATED: { icon: '👤', color: '#10b981', label: 'Admin Created' },
  ADMIN_UPDATED: { icon: '✏️', color: '#f59e0b', label: 'Admin Updated' },
  ADMIN_DELETED: { icon: '🗑️', color: '#ef4444', label: 'Admin Deleted' },
  STUDENT_CREATED: { icon: '🎓', color: '#10b981', label: 'Student Added' },
  STUDENT_UPDATED: { icon: '📝', color: '#f59e0b', label: 'Student Updated' },
  STUDENT_DELETED: { icon: '❌', color: '#ef4444', label: 'Student Deleted' },
  SUBJECT_CREATED: { icon: '📚', color: '#10b981', label: 'Subject Added' },
  SUBJECT_UPDATED: { icon: '📖', color: '#f59e0b', label: 'Subject Updated' },
  SUBJECT_DELETED: { icon: '📕', color: '#ef4444', label: 'Subject Deleted' },
  GRADE_SAVED: { icon: '✅', color: '#8b5cf6', label: 'Grade Saved' },
  DATA_INITIALIZED: { icon: '🗄️', color: '#3b82f6', label: 'Data Initialized' }
};

export default function ActivityLogs() {
  const { userRole } = useAuth();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterBatch, setFilterBatch] = useState('all');
  
  const uniqueBatches = [...new Set(logs.map(log => log.batch).filter(Boolean))];
  const uniqueTypes = [...new Set(logs.map(log => log.type))];

  useEffect(() => {
    fetchLogs();
  }, []);

  async function fetchLogs() {
    setLoading(true);
    try {
      const { activities } = await getActivityLogs({ limitCount: 100 });
      setLogs(activities);
    } catch (error) {
      console.error('Error fetching logs:', error);
    } finally {
      setLoading(false);
    }
  }

  function formatTime(timestamp) {
    if (!timestamp) return 'Unknown';
    const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString('en-IN', { 
      day: 'numeric', 
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  function getActivityDetails(activity) {
    const details = activity.details || {};
    
    switch (activity.type) {
      case 'STUDENT_CREATED':
      case 'STUDENT_UPDATED':
      case 'STUDENT_DELETED':
        return details.studentName ? `${details.studentName} (${details.regNum || ''})` : '';
      case 'SUBJECT_CREATED':
      case 'SUBJECT_UPDATED':
      case 'SUBJECT_DELETED':
        return details.subjectCode ? `${details.subjectCode} - ${details.subjectName} (Sem ${details.semester})` : '';
      default:
        return '';
    }
  }

  const filteredLogs = logs.filter(log => {
    const matchesSearch = !searchTerm || 
      log.adminName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.adminEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      JSON.stringify(log.details).toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = filterType === 'all' || log.type === filterType;
    const matchesBatch = filterBatch === 'all' || log.batch === filterBatch;
    
    return matchesSearch && matchesType && matchesBatch;
  });

  if (userRole !== 'super_admin') {
    return (
      <div style={{ textAlign: 'center', padding: '60px' }}>
        <p style={{ color: 'var(--text-secondary)' }}>Access denied. Super admin only.</p>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ margin: '0 0 8px', fontSize: '24px' }}>Activity Logs</h1>
          <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
            View all admin activities and login history
          </p>
        </div>
        <button 
          className="btn-primary" 
          onClick={fetchLogs}
          disabled={loading}
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="glass-panel" style={{ padding: '16px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Search */}
          <div style={{ flex: '1 1 250px', display: 'flex', alignItems: 'center', gap: '12px', padding: '0 16px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px' }}>
            <Search size={18} color="var(--text-secondary)" />
            <input 
              style={{ flex: 1, background: 'none', border: 'none', padding: '12px 0', color: 'var(--text-primary)', fontSize: '14px', outline: 'none' }} 
              placeholder="Search by admin name or details..." 
              value={searchTerm} 
              onChange={e => setSearchTerm(e.target.value)} 
            />
          </div>
          
          {/* Type Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Filter size={18} color="var(--text-secondary)" />
            <select 
              className="input-field" 
              value={filterType} 
              onChange={e => setFilterType(e.target.value)}
              style={{ width: 'auto', padding: '10px 16px' }}
            >
              <option value="all">All Types</option>
              {uniqueTypes.map(type => (
                <option key={type} value={type}>
                  {ACTIVITY_ICONS[type]?.label || type}
                </option>
              ))}
            </select>
          </div>
          
          {/* Batch Filter */}
          {uniqueBatches.length > 0 && (
            <select 
              className="input-field" 
              value={filterBatch} 
              onChange={e => setFilterBatch(e.target.value)}
              style={{ width: 'auto', padding: '10px 16px' }}
            >
              <option value="all">All Batches</option>
              {uniqueBatches.map(batch => (
                <option key={batch} value={batch}>{batch}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Logs List */}
      <div className="glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            Loading activity logs...
          </div>
        ) : filteredLogs.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <Activity size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
            <h3>No activity logs found</h3>
            <p>Activities will appear here as admins perform actions.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.03)' }}>
                  <th style={{ padding: '14px 20px', textAlign: 'left', fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Activity</th>
                  <th style={{ padding: '14px 20px', textAlign: 'left', fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Admin</th>
                  <th style={{ padding: '14px 20px', textAlign: 'left', fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Batch</th>
                  <th style={{ padding: '14px 20px', textAlign: 'left', fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Details</th>
                  <th style={{ padding: '14px 20px', textAlign: 'left', fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Time</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log, index) => {
                  const activityInfo = ACTIVITY_ICONS[log.type] || { icon: '📋', color: '#6b7280', label: log.type };
                  
                  return (
                    <tr key={log.id || index} style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                      {/* Activity Type */}
                      <td style={{ padding: '14px 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <span style={{ fontSize: '20px' }}>{activityInfo.icon}</span>
                          <span style={{ 
                            padding: '4px 10px', 
                            borderRadius: '6px',
                            fontSize: '13px',
                            fontWeight: '500',
                            background: `${activityInfo.color}20`,
                            color: activityInfo.color
                          }}>
                            {activityInfo.label}
                          </span>
                        </div>
                      </td>
                      
                      {/* Admin */}
                      <td style={{ padding: '14px 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ 
                            width: '32px', 
                            height: '32px', 
                            borderRadius: '8px', 
                            background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontWeight: '600',
                            fontSize: '13px'
                          }}>
                            {(log.adminName || 'A').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight: '500', fontSize: '14px' }}>{log.adminName || 'Unknown'}</div>
                            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{log.adminEmail}</div>
                          </div>
                        </div>
                      </td>
                      
                      {/* Batch */}
                      <td style={{ padding: '14px 20px' }}>
                        {log.batch ? (
                          <span style={{ 
                            padding: '4px 10px', 
                            background: 'rgba(59,130,246,0.15)', 
                            borderRadius: '6px',
                            fontSize: '13px',
                            color: '#60a5fa'
                          }}>
                            {log.batch}
                          </span>
                        ) : (
                          <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>-</span>
                        )}
                      </td>
                      
                      {/* Details */}
                      <td style={{ padding: '14px 20px', color: 'var(--text-secondary)', fontSize: '13px', maxWidth: '250px' }}>
                        {getActivityDetails(log) || log.description || '-'}
                      </td>
                      
                      {/* Time */}
                      <td style={{ padding: '14px 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', fontSize: '13px' }}>
                          <Clock size={14} />
                          {formatTime(log.timestamp)}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        
        {/* Summary */}
        {filteredLogs.length > 0 && (
          <div style={{ 
            padding: '16px 20px', 
            borderTop: '1px solid rgba(255,255,255,0.05)', 
            background: 'rgba(255,255,255,0.02)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            <span style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
              Showing <strong style={{ color: 'var(--text-primary)' }}>{filteredLogs.length}</strong> of {logs.length} activities
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
