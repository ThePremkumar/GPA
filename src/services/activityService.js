/**
 * Activity Logging Service
 * Using Firebase Realtime Database
 */

import { rtdb } from '../firebase/config';
import { ref, get, push, set } from 'firebase/database';

// Activity type constants
export const ACTIVITY_TYPES = {
  ADMIN_LOGIN: 'ADMIN_LOGIN',
  ADMIN_LOGOUT: 'ADMIN_LOGOUT',
  ADMIN_CREATED: 'ADMIN_CREATED',
  ADMIN_UPDATED: 'ADMIN_UPDATED',
  ADMIN_DELETED: 'ADMIN_DELETED',
  ADMIN_PASSWORD_CHANGED: 'ADMIN_PASSWORD_CHANGED',
  ADMIN_ROLE_CHANGED: 'ADMIN_ROLE_CHANGED',
  STUDENT_CREATED: 'STUDENT_CREATED',
  STUDENT_UPDATED: 'STUDENT_UPDATED',
  STUDENT_DELETED: 'STUDENT_DELETED',
  SUBJECT_CREATED: 'SUBJECT_CREATED',
  SUBJECT_UPDATED: 'SUBJECT_UPDATED',
  SUBJECT_DELETED: 'SUBJECT_DELETED',
  GRADE_SAVED: 'GRADE_SAVED',
  DATA_INITIALIZED: 'DATA_INITIALIZED'
};

const ACTIVITY_DESCRIPTIONS = {
  ADMIN_LOGIN: 'Admin logged in',
  ADMIN_LOGOUT: 'Admin logged out',
  ADMIN_CREATED: 'New admin created',
  ADMIN_UPDATED: 'Admin updated',
  ADMIN_DELETED: 'Admin deleted',
  ADMIN_PASSWORD_CHANGED: 'Admin password changed',
  ADMIN_ROLE_CHANGED: 'Admin role changed',
  STUDENT_CREATED: 'New student created',
  STUDENT_UPDATED: 'Student updated',
  STUDENT_DELETED: 'Student deleted',
  SUBJECT_CREATED: 'New subject created',
  SUBJECT_UPDATED: 'Subject updated',
  SUBJECT_DELETED: 'Subject deleted',
  GRADE_SAVED: 'Grade saved',
  DATA_INITIALIZED: 'Data initialized'
};

/**
 * Log an admin activity
 */
export async function logActivity({
  type,
  adminId,
  adminName,
  adminEmail,
  targetId = null,
  targetType = null,
  details = {},
  batch = null
}) {
  try {
    const logsRef = ref(rtdb, 'activity_logs');
    const newLogRef = push(logsRef);
    
    await set(newLogRef, {
      type,
      description: ACTIVITY_DESCRIPTIONS[type] || 'Unknown action',
      adminId,
      adminName,
      adminEmail,
      targetId,
      targetType,
      details,
      batch,
      timestamp: Date.now()
    });
    
    return true;
  } catch (error) {
    console.error('Error logging activity:', error);
    return false;
  }
}

/**
 * Get activity logs with optional filters
 */
export async function getActivityLogs({
  limitCount = 50,
  adminId = null,
  type = null,
  batch = null,
  startDate = null,
  endDate = null
} = {}) {
  try {
    const snapshot = await get(ref(rtdb, 'activity_logs'));
    
    if (!snapshot.exists()) {
      return { activities: [], hasMore: false };
    }
    
    let activities = [];
    const data = snapshot.val();
    
    Object.entries(data).forEach(([id, activity]) => {
      // Apply filters
      if (adminId && activity.adminId !== adminId) return;
      if (type && activity.type !== type) return;
      if (batch && activity.batch !== batch) return;
      
      if (startDate && activity.timestamp < startDate.getTime()) return;
      if (endDate && activity.timestamp > endDate.getTime()) return;
      
      activities.push({
        id,
        ...activity,
        timestamp: activity.timestamp ? new Date(activity.timestamp) : new Date()
      });
    });
    
    // Sort by timestamp descending
    activities.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
    
    // Limit results
    const hasMore = activities.length > limitCount;
    activities = activities.slice(0, limitCount);
    
    return { activities, hasMore };
  } catch (error) {
    console.error('Error fetching activity logs:', error);
    return { activities: [], hasMore: false };
  }
}

/**
 * Get activity summary statistics
 */
export async function getActivityStats(days = 7) {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const startTime = startDate.getTime();
    
    const snapshot = await get(ref(rtdb, 'activity_logs'));
    
    const stats = {
      total: 0,
      byType: {},
      byAdmin: {},
      byDay: {},
      recentActions: []
    };
    
    if (!snapshot.exists()) return stats;
    
    const data = snapshot.val();
    const activities = [];
    
    Object.entries(data).forEach(([id, activity]) => {
      // Only include activities within the time range
      if (activity.timestamp && activity.timestamp >= startTime) {
        activities.push({ id, ...activity });
      }
    });
    
    // Sort by timestamp descending
    activities.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
    
    activities.forEach((activity) => {
      stats.total++;
      
      // Count by type
      if (activity.type) {
        stats.byType[activity.type] = (stats.byType[activity.type] || 0) + 1;
      }
      
      // Count by admin
      if (activity.adminName) {
        stats.byAdmin[activity.adminName] = (stats.byAdmin[activity.adminName] || 0) + 1;
      }
      
      // Count by day
      const day = new Date(activity.timestamp).toISOString().split('T')[0];
      stats.byDay[day] = (stats.byDay[day] || 0) + 1;
      
      // Keep recent actions
      if (stats.recentActions.length < 10) {
        stats.recentActions.push({
          id: activity.id,
          type: activity.type,
          description: activity.description,
          adminName: activity.adminName,
          timestamp: new Date(activity.timestamp)
        });
      }
    });
    
    return stats;
  } catch (error) {
    console.error('Error fetching activity stats:', error);
    return {
      total: 0,
      byType: {},
      byAdmin: {},
      byDay: {},
      recentActions: []
    };
  }
}

/**
 * Get admin-specific activity summary
 */
export async function getAdminActivitySummary(adminId) {
  try {
    const snapshot = await get(ref(rtdb, 'activity_logs'));
    
    const summary = {
      totalActions: 0,
      lastActivity: null,
      actionBreakdown: {},
      recentActions: []
    };
    
    if (!snapshot.exists()) return summary;
    
    const data = snapshot.val();
    const activities = [];
    
    Object.entries(data).forEach(([id, activity]) => {
      if (activity.adminId === adminId) {
        activities.push({ id, ...activity });
      }
    });
    
    // Sort by timestamp descending
    activities.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
    
    activities.forEach((activity) => {
      summary.totalActions++;
      
      if (!summary.lastActivity) {
        summary.lastActivity = new Date(activity.timestamp);
      }
      
      if (activity.type) {
        summary.actionBreakdown[activity.type] = (summary.actionBreakdown[activity.type] || 0) + 1;
      }
      
      if (summary.recentActions.length < 5) {
        summary.recentActions.push({
          id: activity.id,
          type: activity.type,
          description: activity.description,
          timestamp: new Date(activity.timestamp)
        });
      }
    });
    
    return summary;
  } catch (error) {
    console.error('Error fetching admin activity summary:', error);
    return {
      totalActions: 0,
      lastActivity: null,
      actionBreakdown: {},
      recentActions: []
    };
  }
}

export default {
  logActivity,
  getActivityLogs,
  getActivityStats,
  getAdminActivitySummary,
  ACTIVITY_TYPES
};
