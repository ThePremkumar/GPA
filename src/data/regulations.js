/**
 * Regulations Data and Utilities
 * Fetches from Firebase RTDB with fallback to static data
 */

import { rtdb } from '../firebase/config';
import { ref, get } from 'firebase/database';

// Static fallback data
export const RegulationMapping = {
  "2017": ["2017-2021", "2018-2022", "2019-2023", "2020-2024"],
  "2021": ["2021-2025", "2022-2026"],
  "2023": ["2023-2027", "2024-2028", "2025-2029"],
  "2026": ["2026-2030", "2027-2031", "2028-2032"]
};

// Cache for regulations data
let cachedRegulations = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Fetch regulations from Firebase RTDB
 * Returns cached data if available and fresh
 */
export async function fetchRegulationsFromDB() {
  const now = Date.now();
  
  // Return cached data if fresh
  if (cachedRegulations && (now - cacheTimestamp) < CACHE_DURATION) {
    return cachedRegulations;
  }
  
  try {
    const snapshot = await get(ref(rtdb, 'regulations'));
    
    if (snapshot.exists()) {
      const data = snapshot.val();
      // Filter out placeholder keys
      const filtered = {};
      Object.keys(data).forEach(key => {
        if (!key.includes('placeholder')) {
          filtered[key] = data[key];
        }
      });
      
      if (Object.keys(filtered).length > 0) {
        cachedRegulations = filtered;
        cacheTimestamp = now;
        return filtered;
      }
    }
    
    // Fall back to static data
    return RegulationMapping;
  } catch (error) {
    console.error('Error fetching regulations:', error);
    return RegulationMapping;
  }
}

/**
 * Get regulation year for a given batch
 * Synchronous version using cached/static data
 */
export function getRegulationByBatch(batch) {
  const regulations = cachedRegulations || RegulationMapping;
  
  for (const [reg, batches] of Object.entries(regulations)) {
    if (batches && batches.includes(batch)) {
      return reg;
    }
  }
  return "2021"; // Default
}

/**
 * Get regulation year for a given batch (async version)
 * Fetches fresh data from Firebase
 */
export async function getRegulationByBatchAsync(batch) {
  const regulations = await fetchRegulationsFromDB();
  
  for (const [reg, batches] of Object.entries(regulations)) {
    if (batches && batches.includes(batch)) {
      return reg;
    }
  }
  return "2021"; // Default
}

/**
 * Get all batches for a specific regulation
 */
export async function getBatchesByRegulation(regulationYear) {
  const regulations = await fetchRegulationsFromDB();
  return regulations[regulationYear] || [];
}

/**
 * Get all available regulations
 */
export async function getAllRegulations() {
  return await fetchRegulationsFromDB();
}

/**
 * Get all batches across all regulations
 */
export async function getAllBatches() {
  const regulations = await fetchRegulationsFromDB();
  const allBatches = [];
  
  Object.values(regulations).forEach(batches => {
    if (Array.isArray(batches)) {
      allBatches.push(...batches);
    }
  });
  
  return allBatches;
}

/**
 * Clear the cache (call after updates)
 */
export function clearRegulationsCache() {
  cachedRegulations = null;
  cacheTimestamp = 0;
}
