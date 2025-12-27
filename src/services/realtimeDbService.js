/**
 * Firebase Realtime Database Service
 * Handles real-time data synchronization
 */

import { rtdb } from '../firebase/config';
import { 
  ref, 
  set, 
  get, 
  push, 
  update, 
  remove, 
  onValue, 
  query, 
  orderByChild, 
  equalTo,
  serverTimestamp 
} from 'firebase/database';
import { subjectsData } from '../data/subjects';
import { RegulationMapping, getRegulationByBatch } from '../data/regulations';

// Database paths
const PATHS = {
  SUBJECTS: 'subjects',
  STUDENTS: 'students',
  ADMINS: 'admins',
  REGULATIONS: 'regulations',
  BATCHES: 'batches',
  GRADES: 'grades',
  ACTIVITY_LOGS: 'activity_logs',
  CONFIG: 'config'
};

/**
 * Initialize all static data in Realtime Database
 */
export async function initializeRealtimeData() {
  const results = { subjects: 0, regulations: 0, batches: 0 };

  try {
    // 1. Sync Subjects Data
    for (const [batchName, semesters] of Object.entries(subjectsData)) {
      const subjectRef = ref(rtdb, `${PATHS.SUBJECTS}/${batchName}`);
      const snapshot = await get(subjectRef);
      
      if (!snapshot.exists()) {
        await set(subjectRef, {
          ...semesters,
          regulation: getRegulationByBatch(batchName),
          createdAt: Date.now(),
          updatedAt: Date.now()
        });
        results.subjects++;
      }
    }

    // 2. Sync Regulations Data
    for (const [regulation, batches] of Object.entries(RegulationMapping)) {
      const regRef = ref(rtdb, `${PATHS.REGULATIONS}/${regulation}`);
      const snapshot = await get(regRef);
      
      if (!snapshot.exists()) {
        await set(regRef, {
          name: `Regulation ${regulation}`,
          batches: batches,
          isActive: true,
          createdAt: Date.now(),
          updatedAt: Date.now()
        });
        results.regulations++;
      }
    }

    // 3. Create Batches
    const allBatches = Object.keys(subjectsData);
    for (const batchName of allBatches) {
      const batchRef = ref(rtdb, `${PATHS.BATCHES}/${batchName}`);
      const snapshot = await get(batchRef);
      
      if (!snapshot.exists()) {
        const [startYear, endYear] = batchName.split('-');
        await set(batchRef, {
          name: batchName,
          startYear: parseInt(startYear),
          endYear: parseInt(endYear),
          regulation: getRegulationByBatch(batchName),
          isActive: true,
          studentCount: 0,
          createdAt: Date.now(),
          updatedAt: Date.now()
        });
        results.batches++;
      }
    }

    // 4. Create Config
    const configRef = ref(rtdb, `${PATHS.CONFIG}/settings`);
    const configSnap = await get(configRef);
    
    if (!configSnap.exists()) {
      await set(configRef, {
        appName: 'CGPA Calculator',
        allowStudentSignup: true,
        defaultRegulation: '2023',
        gradeScale: {
          'O': 10,
          'A+': 9,
          'A': 8,
          'B+': 7,
          'B': 6,
          'C': 5,
          'U': 0
        },
        createdAt: Date.now(),
        updatedAt: Date.now()
      });
    }

    console.log('Realtime Database initialized:', results);
    return { success: true, results };
  } catch (error) {
    console.error('Error initializing Realtime Database:', error);
    throw error;
  }
}

// ==================== STUDENTS ====================

/**
 * Create or update a student in Realtime Database
 */
export async function saveStudentToRTDB(studentId, studentData) {
  try {
    const studentRef = ref(rtdb, `${PATHS.STUDENTS}/${studentId}`);
    await set(studentRef, {
      ...studentData,
      updatedAt: Date.now()
    });
    return { success: true };
  } catch (error) {
    console.error('Error saving student:', error);
    throw error;
  }
}

/**
 * Get a student by ID from Realtime Database
 */
export async function getStudentFromRTDB(studentId) {
  try {
    const studentRef = ref(rtdb, `${PATHS.STUDENTS}/${studentId}`);
    const snapshot = await get(studentRef);
    return snapshot.exists() ? { id: studentId, ...snapshot.val() } : null;
  } catch (error) {
    console.error('Error getting student:', error);
    throw error;
  }
}

/**
 * Get all students by batch
 */
export async function getStudentsByBatchRTDB(batch) {
  try {
    const studentsRef = ref(rtdb, PATHS.STUDENTS);
    const snapshot = await get(studentsRef);
    
    if (!snapshot.exists()) return [];
    
    const students = [];
    snapshot.forEach((child) => {
      const data = child.val();
      if (data.batch === batch) {
        students.push({ id: child.key, ...data });
      }
    });
    
    return students;
  } catch (error) {
    console.error('Error getting students by batch:', error);
    throw error;
  }
}

/**
 * Subscribe to real-time student updates for a batch
 */
export function subscribeToStudentsRTDB(batch, callback) {
  const studentsRef = ref(rtdb, PATHS.STUDENTS);
  
  const unsubscribe = onValue(studentsRef, (snapshot) => {
    const students = [];
    if (snapshot.exists()) {
      snapshot.forEach((child) => {
        const data = child.val();
        if (data.batch === batch) {
          students.push({ id: child.key, ...data });
        }
      });
    }
    callback(students);
  });

  return unsubscribe;
}

/**
 * Delete a student from Realtime Database
 */
export async function deleteStudentFromRTDB(studentId) {
  try {
    const studentRef = ref(rtdb, `${PATHS.STUDENTS}/${studentId}`);
    await remove(studentRef);
    return { success: true };
  } catch (error) {
    console.error('Error deleting student:', error);
    throw error;
  }
}

// ==================== ADMINS ====================

/**
 * Save admin to Realtime Database
 */
export async function saveAdminToRTDB(adminId, adminData) {
  try {
    const adminRef = ref(rtdb, `${PATHS.ADMINS}/${adminId}`);
    await set(adminRef, {
      ...adminData,
      updatedAt: Date.now()
    });
    return { success: true };
  } catch (error) {
    console.error('Error saving admin:', error);
    throw error;
  }
}

/**
 * Get admin from Realtime Database
 */
export async function getAdminFromRTDB(adminId) {
  try {
    const adminRef = ref(rtdb, `${PATHS.ADMINS}/${adminId}`);
    const snapshot = await get(adminRef);
    return snapshot.exists() ? { id: adminId, ...snapshot.val() } : null;
  } catch (error) {
    console.error('Error getting admin:', error);
    throw error;
  }
}

/**
 * Get all admins
 */
export async function getAllAdminsRTDB() {
  try {
    const adminsRef = ref(rtdb, PATHS.ADMINS);
    const snapshot = await get(adminsRef);
    
    if (!snapshot.exists()) return [];
    
    const admins = [];
    snapshot.forEach((child) => {
      admins.push({ id: child.key, ...child.val() });
    });
    
    return admins;
  } catch (error) {
    console.error('Error getting admins:', error);
    throw error;
  }
}

// ==================== GRADES ====================

/**
 * Save student grades to Realtime Database
 */
export async function saveGradesToRTDB(studentId, batch, semester, grades, sgpa) {
  try {
    const gradeKey = `${studentId}_${batch}_${semester}`;
    const gradeRef = ref(rtdb, `${PATHS.GRADES}/${gradeKey}`);
    
    await set(gradeRef, {
      studentId,
      batch,
      semester,
      grades,
      sgpa: parseFloat(sgpa),
      updatedAt: Date.now()
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error saving grades:', error);
    throw error;
  }
}

/**
 * Get student grades from Realtime Database
 */
export async function getGradesFromRTDB(studentId, batch = null, semester = null) {
  try {
    if (batch && semester) {
      const gradeKey = `${studentId}_${batch}_${semester}`;
      const gradeRef = ref(rtdb, `${PATHS.GRADES}/${gradeKey}`);
      const snapshot = await get(gradeRef);
      return snapshot.exists() ? snapshot.val() : null;
    }
    
    // Get all grades for a student
    const gradesRef = ref(rtdb, PATHS.GRADES);
    const snapshot = await get(gradesRef);
    
    if (!snapshot.exists()) return [];
    
    const grades = [];
    snapshot.forEach((child) => {
      const data = child.val();
      if (data.studentId === studentId) {
        grades.push({ id: child.key, ...data });
      }
    });
    
    return grades;
  } catch (error) {
    console.error('Error getting grades:', error);
    throw error;
  }
}

/**
 * Subscribe to real-time grade updates for a student
 */
export function subscribeToGradesRTDB(studentId, callback) {
  const gradesRef = ref(rtdb, PATHS.GRADES);
  
  const unsubscribe = onValue(gradesRef, (snapshot) => {
    const grades = [];
    if (snapshot.exists()) {
      snapshot.forEach((child) => {
        const data = child.val();
        if (data.studentId === studentId) {
          grades.push({ id: child.key, ...data });
        }
      });
    }
    callback(grades);
  });

  return unsubscribe;
}

// ==================== SUBJECTS ====================

/**
 * Get subjects for a batch and semester from Realtime Database
 */
export async function getSubjectsFromRTDB(batch, semester) {
  try {
    const subjectRef = ref(rtdb, `${PATHS.SUBJECTS}/${batch}/${semester}`);
    const snapshot = await get(subjectRef);
    
    if (snapshot.exists()) {
      return snapshot.val();
    }
    
    // Fallback to static data
    return subjectsData[batch]?.[semester] || [];
  } catch (error) {
    console.error('Error getting subjects:', error);
    return subjectsData[batch]?.[semester] || [];
  }
}

/**
 * Save subjects to Realtime Database
 */
export async function saveSubjectsToRTDB(batch, semester, subjects) {
  try {
    const subjectRef = ref(rtdb, `${PATHS.SUBJECTS}/${batch}/${semester}`);
    await set(subjectRef, subjects);
    
    // Update timestamp
    const metaRef = ref(rtdb, `${PATHS.SUBJECTS}/${batch}/updatedAt`);
    await set(metaRef, Date.now());
    
    return { success: true };
  } catch (error) {
    console.error('Error saving subjects:', error);
    throw error;
  }
}

// ==================== ACTIVITY LOGS ====================

/**
 * Log activity to Realtime Database
 */
export async function logActivityToRTDB(activityData) {
  try {
    const logsRef = ref(rtdb, PATHS.ACTIVITY_LOGS);
    const newLogRef = push(logsRef);
    
    await set(newLogRef, {
      ...activityData,
      timestamp: Date.now()
    });
    
    return { success: true, id: newLogRef.key };
  } catch (error) {
    console.error('Error logging activity:', error);
    throw error;
  }
}

/**
 * Get recent activity logs
 */
export async function getActivityLogsRTDB(limit = 50) {
  try {
    const logsRef = ref(rtdb, PATHS.ACTIVITY_LOGS);
    const snapshot = await get(logsRef);
    
    if (!snapshot.exists()) return [];
    
    const logs = [];
    snapshot.forEach((child) => {
      logs.push({ id: child.key, ...child.val() });
    });
    
    // Sort by timestamp descending and limit
    return logs
      .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
      .slice(0, limit);
  } catch (error) {
    console.error('Error getting activity logs:', error);
    throw error;
  }
}

// ==================== CONFIG ====================

/**
 * Get app config from Realtime Database
 */
export async function getConfigFromRTDB() {
  try {
    const configRef = ref(rtdb, `${PATHS.CONFIG}/settings`);
    const snapshot = await get(configRef);
    return snapshot.exists() ? snapshot.val() : null;
  } catch (error) {
    console.error('Error getting config:', error);
    throw error;
  }
}

/**
 * Update app config in Realtime Database
 */
export async function updateConfigInRTDB(config) {
  try {
    const configRef = ref(rtdb, `${PATHS.CONFIG}/settings`);
    await update(configRef, {
      ...config,
      updatedAt: Date.now()
    });
    return { success: true };
  } catch (error) {
    console.error('Error updating config:', error);
    throw error;
  }
}

// ==================== STATISTICS ====================

/**
 * Get database statistics
 */
export async function getDatabaseStats() {
  try {
    const [studentsSnap, adminsSnap, gradesSnap, logsSnap] = await Promise.all([
      get(ref(rtdb, PATHS.STUDENTS)),
      get(ref(rtdb, PATHS.ADMINS)),
      get(ref(rtdb, PATHS.GRADES)),
      get(ref(rtdb, PATHS.ACTIVITY_LOGS))
    ]);

    return {
      students: studentsSnap.exists() ? Object.keys(studentsSnap.val()).length : 0,
      admins: adminsSnap.exists() ? Object.keys(adminsSnap.val()).length : 0,
      grades: gradesSnap.exists() ? Object.keys(gradesSnap.val()).length : 0,
      activities: logsSnap.exists() ? Object.keys(logsSnap.val()).length : 0
    };
  } catch (error) {
    console.error('Error getting stats:', error);
    return { students: 0, admins: 0, grades: 0, activities: 0 };
  }
}

export { PATHS };
