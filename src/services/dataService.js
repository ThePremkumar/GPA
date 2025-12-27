/**
 * Data Sync Service
 * Re-exports from realtimeDbService for backwards compatibility
 */

export {
  initializeRealtimeData as initializeFirebaseData,
  getSubjectsFromRTDB as getSubjects,
  saveSubjectsToRTDB as saveSubjects,
  saveGradesToRTDB as saveStudentGrades,
  getGradesFromRTDB as getStudentGrades,
  getConfigFromRTDB as getAppConfig,
  updateConfigInRTDB as updateAppConfig,
  getDatabaseStats
} from './realtimeDbService';

import { rtdb } from '../firebase/config';
import { ref, get } from 'firebase/database';
import { subjectsData } from '../data/subjects';
import { RegulationMapping, getRegulationByBatch } from '../data/regulations';

/**
 * Get all regulations from Realtime Database
 */
export async function getRegulations() {
  try {
    const snapshot = await get(ref(rtdb, 'regulations'));
    if (snapshot.exists()) {
      const data = snapshot.val();
      return Object.entries(data).map(([id, batches]) => ({
        id,
        name: `Regulation ${id}`,
        batches: Array.isArray(batches) ? batches : [],
        isActive: true
      }));
    }
    // Fallback to static data
    return Object.entries(RegulationMapping).map(([name, batches]) => ({
      id: name,
      name: `Regulation ${name}`,
      batches,
      isActive: true
    }));
  } catch (error) {
    console.error('Error fetching regulations:', error);
    return Object.entries(RegulationMapping).map(([name, batches]) => ({
      id: name,
      name: `Regulation ${name}`,
      batches,
      isActive: true
    }));
  }
}

/**
 * Get all batches from Realtime Database
 */
export async function getBatches(regulation = null) {
  try {
    const snapshot = await get(ref(rtdb, 'batches'));
    let batches = [];
    
    if (snapshot.exists()) {
      const data = snapshot.val();
      batches = Object.entries(data).map(([id, batchData]) => ({
        id,
        ...batchData
      }));
    } else {
      // Fallback to static data
      batches = Object.keys(subjectsData).map(name => {
        const [startYear, endYear] = name.split('-');
        return {
          id: name,
          name,
          startYear: parseInt(startYear),
          endYear: parseInt(endYear),
          regulation: getRegulationByBatch(name),
          isActive: true
        };
      });
    }
    
    if (regulation) {
      batches = batches.filter(b => b.regulation === regulation);
    }
    
    return batches.sort((a, b) => (b.startYear || 0) - (a.startYear || 0));
  } catch (error) {
    console.error('Error fetching batches:', error);
    const staticBatches = Object.keys(subjectsData).map(name => {
      const [startYear, endYear] = name.split('-');
      return {
        id: name,
        name,
        startYear: parseInt(startYear),
        endYear: parseInt(endYear),
        regulation: getRegulationByBatch(name),
        isActive: true
      };
    });
    
    if (regulation) {
      return staticBatches.filter(b => b.regulation === regulation);
    }
    return staticBatches;
  }
}

/**
 * Calculate CGPA from all semester grades
 */
export async function calculateCGPA(studentId) {
  try {
    const snapshot = await get(ref(rtdb, 'grades'));
    if (!snapshot.exists()) return null;
    
    const allGrades = snapshot.val();
    const studentGrades = [];
    
    Object.entries(allGrades).forEach(([id, grade]) => {
      if (grade.studentId === studentId || id.startsWith(studentId)) {
        studentGrades.push({ id, ...grade });
      }
    });
    
    if (studentGrades.length === 0) return null;

    const totalSGPA = studentGrades.reduce((sum, g) => sum + (parseFloat(g.sgpa) || 0), 0);
    const cgpa = (totalSGPA / studentGrades.length).toFixed(2);
    
    return {
      cgpa: parseFloat(cgpa),
      semesterCount: studentGrades.length,
      grades: studentGrades
    };
  } catch (error) {
    console.error('Error calculating CGPA:', error);
    return null;
  }
}

// Collection names (for backwards compatibility)
export const COLLECTIONS = {
  SUBJECTS: 'subjects',
  REGULATIONS: 'regulations',
  BATCHES: 'batches',
  CONFIG: 'config',
  GRADES: 'grades',
  STUDENTS: 'students',
  ADMINS: 'admins',
  ACTIVITY_LOGS: 'activity_logs'
};
