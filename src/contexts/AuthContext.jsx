/**
 * Enhanced Authentication Context
 * Uses Firebase Realtime Database for user profile storage
 */

import React, { useContext, useState, useEffect, createContext, useCallback } from "react";
import { auth, rtdb } from "../firebase/config";
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  sendPasswordResetEmail
} from "firebase/auth";
import { ref, get, set, update } from "firebase/database";

// Role constants
export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  BATCH_ADMIN: 'batch_admin',
  STUDENT: 'student'
};

// Permissions by role
export const PERMISSIONS = {
  [ROLES.SUPER_ADMIN]: {
    manageAdmins: true,
    manageStudents: true,
    manageSubjects: true,
    manageRegulations: true,
    viewAnalytics: true,
    viewActivityLogs: true,
    manageSettings: true
  },
  [ROLES.BATCH_ADMIN]: {
    manageAdmins: false,
    manageStudents: true,
    manageSubjects: false,
    manageRegulations: false,
    viewAnalytics: false,
    viewActivityLogs: false,
    manageSettings: false
  },
  [ROLES.STUDENT]: {
    manageAdmins: false,
    manageStudents: false,
    manageSubjects: false,
    manageRegulations: false,
    viewAnalytics: false,
    viewActivityLogs: false,
    manageSettings: false
  }
};

// Database paths
const PATHS = {
  ADMINS: 'admins',
  STUDENTS: 'students',
  ACTIVITY_LOGS: 'activity_logs'
};

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [userData, setUserData] = useState(null);
  const [permissions, setPermissions] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  /**
   * Log activity to Realtime Database
   */
  async function logActivity(activityData) {
    try {
      const { push } = await import("firebase/database");
      const logsRef = ref(rtdb, PATHS.ACTIVITY_LOGS);
      const newLogRef = push(logsRef);
      await set(newLogRef, {
        ...activityData,
        timestamp: Date.now()
      });
    } catch (error) {
      console.warn('Failed to log activity:', error);
    }
  }

  /**
   * Admin Login (Email + Password)
   */
  async function adminLogin(email, password) {
    setAuthError(null);
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      
      // Fetch admin profile from Realtime Database
      const adminRef = ref(rtdb, `${PATHS.ADMINS}/${result.user.uid}`);
      const snapshot = await get(adminRef);
      
      if (!snapshot.exists()) {
        await signOut(auth);
        throw new Error("Admin profile not found. Please contact super admin.");
      }
      
      const adminData = snapshot.val();
      
      // Check if account is active
      if (adminData.status === 'inactive' || adminData.isActive === false) {
        await signOut(auth);
        throw new Error("Your account has been deactivated. Please contact super admin.");
      }
      
      // Update last login
      await update(adminRef, { lastLogin: Date.now() });
      
      // Log login activity
      await logActivity({
        type: 'LOGIN',
        adminId: result.user.uid,
        adminName: adminData.fullName || adminData.email,
        adminEmail: adminData.email,
        details: { userAgent: navigator.userAgent }
      });
      
      return result;
    } catch (error) {
      setAuthError(error.message);
      throw error;
    }
  }

  /**
   * Student Login (Register Number + DOB)
   */
  async function studentLogin(regNum, dob) {
    setAuthError(null);
    try {
      // Email format: regNum@csbs.com
      const email = `${regNum}@csbs.com`;
      // Password is DOB in YYYY-MM-DD format
      const password = dob;
      
      return await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      setAuthError(error.message);
      throw error;
    }
  }

  /**
   * Signup (Creates account and saves to Realtime Database)
   */
  async function signup(email, password, role = 'student', extraData = {}) {
    setAuthError(null);
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      const user = result.user;
      
      const isAdmin = role === 'admin' || role === ROLES.SUPER_ADMIN || role === ROLES.BATCH_ADMIN;
      const path = isAdmin ? PATHS.ADMINS : PATHS.STUDENTS;
      
      const userData = {
        uid: user.uid,
        email: user.email,
        role: role,
        ...extraData,
        createdAt: Date.now(),
        status: 'active',
        isActive: true
      };
      
      // Save to Realtime Database
      const userRef = ref(rtdb, `${path}/${user.uid}`);
      await set(userRef, userData);
      
      return result;
    } catch (error) {
      setAuthError(error.message);
      throw error;
    }
  }

  /**
   * Logout
   */
  async function logout() {
    try {
      // Log logout activity for admins
      if (currentUser && (userRole === ROLES.SUPER_ADMIN || userRole === ROLES.BATCH_ADMIN || userRole === 'year_admin')) {
        await logActivity({
          type: 'LOGOUT',
          adminId: currentUser.uid,
          adminName: userData?.fullName || userData?.email,
          adminEmail: userData?.email
        });
      }
      
      return await signOut(auth);
    } catch (error) {
      setAuthError(error.message);
      throw error;
    }
  }

  /**
   * Send password reset email
   */
  async function resetPassword(email) {
    setAuthError(null);
    try {
      await sendPasswordResetEmail(auth, email);
      return true;
    } catch (error) {
      setAuthError(error.message);
      throw error;
    }
  }

  /**
   * Check if user has specific permission
   */
  const hasPermission = useCallback((permission) => {
    if (!permissions) return false;
    return permissions[permission] === true;
  }, [permissions]);

  /**
   * Check if user can access a specific batch
   */
  const canAccessBatch = useCallback((batch) => {
    if (!userData || !userRole) return false;
    
    // Super admin can access all batches
    if (userRole === ROLES.SUPER_ADMIN) return true;
    
    // Batch admin can only access their assigned batch
    if (userRole === ROLES.BATCH_ADMIN || userRole === 'year_admin') {
      return userData.assignedBatch === batch || userData.assignedYear === batch;
    }
    
    // Students can access their own batch
    if (userRole === ROLES.STUDENT || userRole === 'student') {
      return userData.batch === batch;
    }
    
    return false;
  }, [userData, userRole]);

  /**
   * Check if user is any type of admin
   */
  const isAdmin = useCallback(() => {
    return userRole === ROLES.SUPER_ADMIN || 
           userRole === ROLES.BATCH_ADMIN || 
           userRole === 'year_admin';
  }, [userRole]);

  /**
   * Check if user is super admin
   */
  const isSuperAdmin = useCallback(() => {
    return userRole === ROLES.SUPER_ADMIN;
  }, [userRole]);

  // Auth state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      
      if (user) {
        try {
          // Check if email matches student pattern (regNum@csbs.com)
          const isStudentEmail = user.email?.endsWith('@csbs.com');
          //console.log('Auth Debug - Email:', user.email, 'isStudentEmail:', isStudentEmail);
          
          if (isStudentEmail) {
            // For student emails, check students collection FIRST
            const studentRef = ref(rtdb, `${PATHS.STUDENTS}/${user.uid}`);
            const snapshot = await get(studentRef);
            //console.log('Auth Debug - Student data exists:', snapshot.exists(), 'Data:', snapshot.val());
            
            if (snapshot.exists()) {
              const data = snapshot.val();
              //console.log('Auth Debug - Setting role to STUDENT');
              setUserRole(ROLES.STUDENT);
              setUserData(data);
              setPermissions(PERMISSIONS[ROLES.STUDENT]);
            } else {
              // No student profile found
              //console.log('Auth Debug - No student profile found');
              setUserRole(null);
              setUserData(null);
              setPermissions(null);
            }
          } else {
            // For non-student emails, check admins collection
            const adminRef = ref(rtdb, `${PATHS.ADMINS}/${user.uid}`);
            let snapshot = await get(adminRef);
            
            if (snapshot.exists()) {
              const data = snapshot.val();
              const role = data.role || 'admin';
              
              setUserRole(role);
              setUserData(data);
              
              // Set permissions based on role
              const permissionRole = role === 'year_admin' ? ROLES.BATCH_ADMIN : role;
              setPermissions(PERMISSIONS[permissionRole] || PERMISSIONS[ROLES.STUDENT]);
            } else {
              // Check students as fallback for admins who might not have admin profile
              const studentRef = ref(rtdb, `${PATHS.STUDENTS}/${user.uid}`);
              snapshot = await get(studentRef);
              
              if (snapshot.exists()) {
                const data = snapshot.val();
                setUserRole(ROLES.STUDENT);
                setUserData(data);
                setPermissions(PERMISSIONS[ROLES.STUDENT]);
              } else {
                // No profile found
                setUserRole(null);
                setUserData(null);
                setPermissions(null);
              }
            }
          }
        } catch (error) {
          console.error("Error fetching profile:", error);
          setAuthError(error.message);
        }
      } else {
        setUserRole(null);
        setUserData(null);
        setPermissions(null);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    // State
    currentUser,
    userRole,
    userData,
    permissions,
    loading,
    authError,
    
    // Auth methods
    adminLogin,
    studentLogin,
    signup,
    logout,
    resetPassword,
    
    // Helper methods
    hasPermission,
    canAccessBatch,
    isAdmin,
    isSuperAdmin,
    
    // Clear error
    clearError: () => setAuthError(null)
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export { ROLES as COLLECTIONS };

