/**
 * Admin Management Service
 * Using Firebase Realtime Database
 */

import { rtdb, auth } from '../firebase/config';
import { ref, get, set, update, remove, push } from 'firebase/database';
import { createUserWithEmailAndPassword } from 'firebase/auth';

/**
 * Create a new admin account
 */
export async function createAdmin({
  email,
  password,
  fullName,
  registerNumber,
  dateOfBirth,
  role = 'batch_admin',
  assignedBatch = null,
  assignedRegulation = null,
  currentAdmin
}) {
  try {
    // Create Firebase Auth user
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const uid = userCredential.user.uid;

    // Format DOB for display
    const dobDisplay = dateOfBirth ? formatDateForDisplay(dateOfBirth) : '';

    // Create admin profile in Realtime Database
    const adminData = {
      uid,
      email,
      fullName,
      registerNumber,
      dateOfBirth: dobDisplay,
      role,
      assignedBatch,
      assignedRegulation,
      assignedYear: assignedBatch, // Backwards compatibility
      status: 'active',
      isActive: true,
      createdAt: Date.now(),
      createdBy: currentAdmin?.uid || 'system',
      createdByName: currentAdmin?.fullName || currentAdmin?.email || 'System',
      lastLogin: null
    };

    await set(ref(rtdb, `admins/${uid}`), adminData);

    // Log activity
    await logActivityRTDB({
      type: 'ADMIN_CREATED',
      adminId: currentAdmin?.uid,
      adminName: currentAdmin?.fullName || currentAdmin?.email,
      targetId: uid,
      details: { newAdminEmail: email, newAdminName: fullName, role }
    });

    return { success: true, uid, data: adminData };
  } catch (error) {
    console.error('Error creating admin:', error);
    throw error;
  }
}

/**
 * Update admin password
 */
export async function updateAdminPassword(adminId, newPassword, currentAdmin) {
  try {
    await update(ref(rtdb, `admins/${adminId}`), {
      lastPasswordChange: Date.now(),
      updatedAt: Date.now(),
      updatedBy: currentAdmin?.uid
    });

    return { success: true };
  } catch (error) {
    console.error('Error updating admin password:', error);
    throw error;
  }
}

/**
 * Get all admins
 */
export async function getAllAdmins() {
  try {
    const snapshot = await get(ref(rtdb, 'admins'));
    
    if (!snapshot.exists()) return [];
    
    const admins = [];
    const data = snapshot.val();
    
    Object.entries(data).forEach(([id, admin]) => {
      admins.push({
        id,
        ...admin,
        createdAt: admin.createdAt ? new Date(admin.createdAt) : null,
        lastLogin: admin.lastLogin ? new Date(admin.lastLogin) : null
      });
    });
    
    // Sort by createdAt descending
    admins.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    
    return admins;
  } catch (error) {
    console.error('Error fetching admins:', error);
    throw error;
  }
}

/**
 * Get admin by ID
 */
export async function getAdminById(adminId) {
  try {
    const snapshot = await get(ref(rtdb, `admins/${adminId}`));
    
    if (snapshot.exists()) {
      const data = snapshot.val();
      return {
        id: adminId,
        ...data,
        createdAt: data.createdAt ? new Date(data.createdAt) : null,
        lastLogin: data.lastLogin ? new Date(data.lastLogin) : null
      };
    }
    return null;
  } catch (error) {
    console.error('Error fetching admin:', error);
    throw error;
  }
}

/**
 * Get admins by batch
 */
export async function getAdminsByBatch(batch) {
  try {
    const snapshot = await get(ref(rtdb, 'admins'));
    
    if (!snapshot.exists()) return [];
    
    const admins = [];
    const data = snapshot.val();
    
    Object.entries(data).forEach(([id, admin]) => {
      if (admin.assignedBatch === batch) {
        admins.push({ id, ...admin });
      }
    });
    
    return admins;
  } catch (error) {
    console.error('Error fetching admins by batch:', error);
    throw error;
  }
}

/**
 * Update admin role
 */
export async function updateAdminRole(adminId, newRole, currentAdmin) {
  try {
    await update(ref(rtdb, `admins/${adminId}`), {
      role: newRole,
      updatedAt: Date.now(),
      updatedBy: currentAdmin?.uid
    });

    return { success: true };
  } catch (error) {
    console.error('Error updating admin role:', error);
    throw error;
  }
}

/**
 * Update admin assigned batch
 */
export async function updateAdminBatch(adminId, newBatch, newRegulation, currentAdmin) {
  try {
    await update(ref(rtdb, `admins/${adminId}`), {
      assignedBatch: newBatch,
      assignedYear: newBatch,
      assignedRegulation: newRegulation,
      updatedAt: Date.now(),
      updatedBy: currentAdmin?.uid
    });

    return { success: true };
  } catch (error) {
    console.error('Error updating admin batch:', error);
    throw error;
  }
}

/**
 * Update admin profile
 */
export async function updateAdmin(adminId, updates, currentAdmin) {
  try {
    await update(ref(rtdb, `admins/${adminId}`), {
      ...updates,
      updatedAt: Date.now(),
      updatedBy: currentAdmin?.uid
    });

    return { success: true };
  } catch (error) {
    console.error('Error updating admin:', error);
    throw error;
  }
}

/**
 * Delete admin account
 */
export async function deleteAdmin(adminId, currentAdmin) {
  try {
    // Get admin info before deletion
    const adminSnap = await get(ref(rtdb, `admins/${adminId}`));
    const adminData = adminSnap.exists() ? adminSnap.val() : {};

    // Delete from Realtime Database
    await remove(ref(rtdb, `admins/${adminId}`));

    // Log activity
    await logActivityRTDB({
      type: 'ADMIN_DELETED',
      adminId: currentAdmin?.uid,
      adminName: currentAdmin?.fullName || currentAdmin?.email,
      targetId: adminId,
      details: { deletedAdminEmail: adminData.email, deletedAdminName: adminData.fullName }
    });

    return { success: true };
  } catch (error) {
    console.error('Error deleting admin:', error);
    throw error;
  }
}

/**
 * Update admin last login
 */
export async function updateLastLogin(adminId) {
  try {
    await update(ref(rtdb, `admins/${adminId}`), {
      lastLogin: Date.now()
    });
    return { success: true };
  } catch (error) {
    console.error('Error updating last login:', error);
    return { success: false };
  }
}

/**
 * Get admin statistics
 */
export async function getAdminStats() {
  try {
    const snapshot = await get(ref(rtdb, 'admins'));
    
    const stats = {
      total: 0,
      superAdmins: 0,
      batchAdmins: 0,
      activeToday: 0,
      byBatch: {}
    };
    
    if (!snapshot.exists()) return stats;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayTime = today.getTime();
    
    const data = snapshot.val();
    Object.values(data).forEach((admin) => {
      stats.total++;
      
      if (admin.role === 'super_admin') {
        stats.superAdmins++;
      } else {
        stats.batchAdmins++;
      }
      
      if (admin.lastLogin && admin.lastLogin >= todayTime) {
        stats.activeToday++;
      }
      
      if (admin.assignedBatch) {
        stats.byBatch[admin.assignedBatch] = (stats.byBatch[admin.assignedBatch] || 0) + 1;
      }
    });
    
    return stats;
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    return { total: 0, superAdmins: 0, batchAdmins: 0, activeToday: 0, byBatch: {} };
  }
}

/**
 * Log activity to Realtime Database
 */
async function logActivityRTDB(activityData) {
  try {
    const logsRef = ref(rtdb, 'activity_logs');
    const newLogRef = push(logsRef);
    await set(newLogRef, {
      ...activityData,
      timestamp: Date.now()
    });
  } catch (error) {
    console.warn('Failed to log activity:', error);
  }
}

// Helper function
function formatDateForDisplay(dateString) {
  if (!dateString) return '';
  const [year, month, day] = dateString.split('-');
  return `${day}/${month}/${year}`;
}

export default {
  createAdmin,
  updateAdminPassword,
  getAllAdmins,
  getAdminById,
  getAdminsByBatch,
  updateAdminRole,
  updateAdminBatch,
  updateAdmin,
  deleteAdmin,
  updateLastLogin,
  getAdminStats
};
