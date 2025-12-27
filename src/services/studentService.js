/**
 * Student Management Service
 * Using Firebase Realtime Database
 */

import { rtdb, auth } from '../firebase/config';
import { ref, get, set, update, remove, push, onValue } from 'firebase/database';
import { createUserWithEmailAndPassword } from 'firebase/auth';

/**
 * Create a new student account
 */
export async function createStudent({
  registerNumber,
  fullName,
  email,
  dateOfBirth,
  regulation,
  batch,
  currentAdmin
}) {
  try {
    // Create email format for auth: regNum@csbs.com
    const authEmail = `${registerNumber}@csbs.com`;
    // Password is DOB in YYYY-MM-DD format
    const password = dateOfBirth;

    // Create Firebase Auth user
    const userCredential = await createUserWithEmailAndPassword(auth, authEmail, password);
    const uid = userCredential.user.uid;

    // Format DOB for display (DD/MM/YYYY)
    const [year, month, day] = dateOfBirth.split('-');
    const dobDisplay = `${day}/${month}/${year}`;

    // Create student profile in Realtime Database
    const studentData = {
      uid,
      registerNumber,
      regNum: registerNumber,
      fullName,
      name: fullName,
      email,
      authEmail,
      dateOfBirth: dobDisplay,
      dob: dobDisplay,
      regulation,
      batch,
      role: 'student',
      status: 'active',
      createdAt: Date.now(),
      createdBy: currentAdmin?.uid,
      createdByName: currentAdmin?.fullName || currentAdmin?.email,
      grades: {},
      cgpa: null
    };

    // Save to Realtime Database using uid as key
    await set(ref(rtdb, `students/${uid}`), studentData);

    // Log activity
    await logActivityRTDB({
      type: 'STUDENT_CREATED',
      adminId: currentAdmin?.uid,
      adminName: currentAdmin?.fullName || currentAdmin?.email,
      targetId: registerNumber,
      batch,
      details: { studentName: fullName, registerNumber, regulation }
    });

    return { success: true, uid, registerNumber, data: studentData };
  } catch (error) {
    console.error('Error creating student:', error);
    throw error;
  }
}

/**
 * Get all students
 */
export async function getAllStudents() {
  try {
    const snapshot = await get(ref(rtdb, 'students'));
    
    if (!snapshot.exists()) return [];
    
    const students = [];
    const data = snapshot.val();
    
    Object.entries(data).forEach(([id, student]) => {
      students.push({
        id,
        ...student,
        createdAt: student.createdAt ? new Date(student.createdAt) : null
      });
    });
    
    // Sort by createdAt descending
    students.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    
    return students;
  } catch (error) {
    console.error('Error fetching all students:', error);
    throw error;
  }
}

/**
 * Get students by batch
 */
export async function getStudentsByBatch(batch) {
  try {
    const snapshot = await get(ref(rtdb, 'students'));
    
    if (!snapshot.exists()) return [];
    
    const students = [];
    const data = snapshot.val();
    
    Object.entries(data).forEach(([id, student]) => {
      if (student.batch === batch) {
        students.push({ id, ...student });
      }
    });
    
    return students;
  } catch (error) {
    console.error('Error fetching students by batch:', error);
    throw error;
  }
}

/**
 * Get students by regulation
 */
export async function getStudentsByRegulation(regulation) {
  try {
    const snapshot = await get(ref(rtdb, 'students'));
    
    if (!snapshot.exists()) return [];
    
    const students = [];
    const data = snapshot.val();
    
    Object.entries(data).forEach(([id, student]) => {
      if (student.regulation === regulation) {
        students.push({ id, ...student });
      }
    });
    
    return students;
  } catch (error) {
    console.error('Error fetching students by regulation:', error);
    throw error;
  }
}

/**
 * Get student by register number
 */
export async function getStudentByRegNum(registerNumber) {
  try {
    const snapshot = await get(ref(rtdb, 'students'));
    
    if (!snapshot.exists()) return null;
    
    const data = snapshot.val();
    for (const [id, student] of Object.entries(data)) {
      if (student.registerNumber === registerNumber || student.regNum === registerNumber) {
        return { id, ...student };
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching student:', error);
    throw error;
  }
}

/**
 * Update student information
 */
export async function updateStudent(studentId, updates, currentAdmin) {
  try {
    await update(ref(rtdb, `students/${studentId}`), {
      ...updates,
      updatedAt: Date.now(),
      updatedBy: currentAdmin?.uid
    });

    return { success: true };
  } catch (error) {
    console.error('Error updating student:', error);
    throw error;
  }
}

/**
 * Delete student
 */
export async function deleteStudent(studentId, currentAdmin) {
  try {
    // Get student info before deletion
    const studentSnap = await get(ref(rtdb, `students/${studentId}`));
    const studentData = studentSnap.exists() ? studentSnap.val() : {};

    await remove(ref(rtdb, `students/${studentId}`));

    // Log activity
    await logActivityRTDB({
      type: 'STUDENT_DELETED',
      adminId: currentAdmin?.uid,
      adminName: currentAdmin?.fullName || currentAdmin?.email,
      targetId: studentData.registerNumber || studentId,
      batch: studentData.batch,
      details: { studentName: studentData.fullName || studentData.name }
    });

    return { success: true };
  } catch (error) {
    console.error('Error deleting student:', error);
    throw error;
  }
}

/**
 * Subscribe to real-time student updates
 */
export function subscribeToStudents(batch, callback) {
  const studentsRef = ref(rtdb, 'students');
  
  return onValue(studentsRef, (snapshot) => {
    const students = [];
    if (snapshot.exists()) {
      const data = snapshot.val();
      Object.entries(data).forEach(([id, student]) => {
        if (!batch || student.batch === batch) {
          students.push({ id, ...student });
        }
      });
    }
    callback(students);
  }, (error) => {
    console.error('Error in students subscription:', error);
    callback([]);
  });
}

/**
 * Get student statistics
 */
export async function getStudentStats(batch = null) {
  try {
    const snapshot = await get(ref(rtdb, 'students'));
    
    const stats = {
      total: 0,
      byBatch: {},
      byRegulation: {},
      withGrades: 0,
      averageCGPA: 0
    };
    
    if (!snapshot.exists()) return stats;
    
    let totalCGPA = 0;
    let cgpaCount = 0;
    
    const data = snapshot.val();
    Object.values(data).forEach((student) => {
      // Filter by batch if specified
      if (batch && student.batch !== batch) return;
      
      stats.total++;
      
      if (student.batch) {
        stats.byBatch[student.batch] = (stats.byBatch[student.batch] || 0) + 1;
      }
      
      if (student.regulation) {
        stats.byRegulation[student.regulation] = (stats.byRegulation[student.regulation] || 0) + 1;
      }
      
      if (student.cgpa) {
        stats.withGrades++;
        totalCGPA += parseFloat(student.cgpa);
        cgpaCount++;
      }
    });
    
    stats.averageCGPA = cgpaCount > 0 ? (totalCGPA / cgpaCount).toFixed(2) : 0;
    
    return stats;
  } catch (error) {
    console.error('Error fetching student stats:', error);
    return { total: 0, byBatch: {}, byRegulation: {}, withGrades: 0, averageCGPA: 0 };
  }
}

/**
 * Bulk import students
 */
export async function bulkImportStudents(studentsData, currentAdmin) {
  const results = {
    success: 0,
    failed: 0,
    errors: []
  };

  for (const student of studentsData) {
    try {
      await createStudent({
        ...student,
        currentAdmin
      });
      results.success++;
    } catch (error) {
      results.failed++;
      results.errors.push({
        registerNumber: student.registerNumber,
        error: error.message
      });
    }
  }

  return results;
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

export default {
  createStudent,
  getAllStudents,
  getStudentsByBatch,
  getStudentsByRegulation,
  getStudentByRegNum,
  updateStudent,
  deleteStudent,
  subscribeToStudents,
  getStudentStats,
  bulkImportStudents
};
