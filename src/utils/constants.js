/**
 * Application Constants
 */

// User Roles
export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  BATCH_ADMIN: 'batch_admin',
  YEAR_ADMIN: 'year_admin', // Kept for backwards compatibility
  STUDENT: 'student'
};

// Permission levels for each role
export const PERMISSIONS = {
  [ROLES.SUPER_ADMIN]: {
    canManageAdmins: true,
    canModifyPasswords: true,
    canManageSemesters: true,
    canManageSubjects: true,
    canManageRegulations: true,
    canManageBatches: true,
    canViewAllActivities: true,
    canCreateUsers: true,
    canAccessAllBatches: true
  },
  [ROLES.BATCH_ADMIN]: {
    canManageAdmins: false,
    canModifyPasswords: false,
    canManageSemesters: false,
    canManageSubjects: false,
    canManageRegulations: false,
    canManageBatches: false,
    canViewAllActivities: false,
    canCreateUsers: true,
    canAccessAllBatches: false
  },
  [ROLES.STUDENT]: {
    canManageAdmins: false,
    canModifyPasswords: false,
    canManageSemesters: false,
    canManageSubjects: false,
    canManageRegulations: false,
    canManageBatches: false,
    canViewAllActivities: false,
    canCreateUsers: false,
    canAccessAllBatches: false
  }
};

// Activity Log Types
export const ACTIVITY_TYPES = {
  // Admin activities
  ADMIN_CREATED: 'admin_created',
  ADMIN_DELETED: 'admin_deleted',
  ADMIN_PASSWORD_CHANGED: 'admin_password_changed',
  ADMIN_ROLE_CHANGED: 'admin_role_changed',
  
  // Student activities
  STUDENT_CREATED: 'student_created',
  STUDENT_UPDATED: 'student_updated',
  STUDENT_DELETED: 'student_deleted',
  
  // Subject activities
  SUBJECT_ADDED: 'subject_added',
  SUBJECT_UPDATED: 'subject_updated',
  SUBJECT_DELETED: 'subject_deleted',
  
  // Batch activities
  BATCH_CREATED: 'batch_created',
  BATCH_UPDATED: 'batch_updated',
  BATCH_DELETED: 'batch_deleted',
  
  // Regulation activities
  REGULATION_CREATED: 'regulation_created',
  REGULATION_UPDATED: 'regulation_updated',
  
  // Semester activities
  SEMESTER_CREATED: 'semester_created',
  SEMESTER_UPDATED: 'semester_updated',
  
  // Auth activities
  LOGIN: 'login',
  LOGOUT: 'logout',
  LOGIN_FAILED: 'login_failed'
};

// Activity type descriptions
export const ACTIVITY_DESCRIPTIONS = {
  [ACTIVITY_TYPES.ADMIN_CREATED]: 'Created new admin account',
  [ACTIVITY_TYPES.ADMIN_DELETED]: 'Deleted admin account',
  [ACTIVITY_TYPES.ADMIN_PASSWORD_CHANGED]: 'Changed admin password',
  [ACTIVITY_TYPES.ADMIN_ROLE_CHANGED]: 'Changed admin role',
  [ACTIVITY_TYPES.STUDENT_CREATED]: 'Created new student account',
  [ACTIVITY_TYPES.STUDENT_UPDATED]: 'Updated student information',
  [ACTIVITY_TYPES.STUDENT_DELETED]: 'Deleted student account',
  [ACTIVITY_TYPES.SUBJECT_ADDED]: 'Added new subject',
  [ACTIVITY_TYPES.SUBJECT_UPDATED]: 'Updated subject details',
  [ACTIVITY_TYPES.SUBJECT_DELETED]: 'Deleted subject',
  [ACTIVITY_TYPES.BATCH_CREATED]: 'Created new batch',
  [ACTIVITY_TYPES.BATCH_UPDATED]: 'Updated batch details',
  [ACTIVITY_TYPES.BATCH_DELETED]: 'Deleted batch',
  [ACTIVITY_TYPES.REGULATION_CREATED]: 'Created new regulation',
  [ACTIVITY_TYPES.REGULATION_UPDATED]: 'Updated regulation',
  [ACTIVITY_TYPES.SEMESTER_CREATED]: 'Created new semester',
  [ACTIVITY_TYPES.SEMESTER_UPDATED]: 'Updated semester details',
  [ACTIVITY_TYPES.LOGIN]: 'Logged in',
  [ACTIVITY_TYPES.LOGOUT]: 'Logged out',
  [ACTIVITY_TYPES.LOGIN_FAILED]: 'Failed login attempt'
};

// Firestore Collections
export const COLLECTIONS = {
  ADMINS: 'admins',
  STUDENTS: 'students',
  SUBJECTS: 'subjects',
  BATCHES: 'batches',
  REGULATIONS: 'regulations',
  ACTIVITY_LOGS: 'activity_logs',
  SEMESTERS: 'semesters'
};

// Grade Points (for CGPA calculation)
export const GRADE_POINTS = {
  'O': 10,
  'A+': 9,
  'A': 8,
  'B+': 7,
  'B': 6,
  'C': 5,
  'RA': 0,
  'U': 0,
  'W': 0,
  'AB': 0
};

// Standard semesters
export const SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8];

// Chart colors for visualizations
export const CHART_COLORS = {
  primary: '#3b82f6',
  secondary: '#8b5cf6',
  accent: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#06b6d4',
  gradient: ['#3b82f6', '#8b5cf6', '#ec4899'],
  pastel: ['#a5b4fc', '#c4b5fd', '#fbcfe8', '#fcd6bb', '#d9f99d'],
  dark: ['#1e3a8a', '#5b21b6', '#831843', '#78350f', '#365314']
};

// Animation durations
export const ANIMATION = {
  fast: 150,
  normal: 300,
  slow: 500,
  chart: 750
};

export default {
  ROLES,
  PERMISSIONS,
  ACTIVITY_TYPES,
  ACTIVITY_DESCRIPTIONS,
  COLLECTIONS,
  GRADE_POINTS,
  SEMESTERS,
  CHART_COLORS,
  ANIMATION
};
