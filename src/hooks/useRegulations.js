/**
 * useRegulations Hook
 * Fetches regulations from Firebase RTDB with caching
 */

import { useState, useEffect } from 'react';
import { rtdb } from '../firebase/config';
import { ref, get, onValue } from 'firebase/database';
import { RegulationMapping } from '../data/regulations';

export function useRegulations() {
  const [regulations, setRegulations] = useState(RegulationMapping);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchRegulations();
  }, []);

  async function fetchRegulations() {
    setLoading(true);
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
          setRegulations(filtered);
        }
      }
    } catch (err) {
      console.error('Error fetching regulations:', err);
      setError(err);
      // Keep using static data as fallback
    } finally {
      setLoading(false);
    }
  }

  // Get all regulation years
  const regulationYears = Object.keys(regulations).sort((a, b) => b - a);
  
  // Get batches for a specific regulation
  const getBatches = (regYear) => regulations[regYear] || [];
  
  // Get all batches
  const allBatches = Object.values(regulations).flat();
  
  // Get regulation year for a batch
  const getRegulationByBatch = (batch) => {
    for (const [reg, batches] of Object.entries(regulations)) {
      if (batches && batches.includes(batch)) {
        return reg;
      }
    }
    return "2021"; // Default
  };

  return {
    regulations,
    regulationYears,
    allBatches,
    getBatches,
    getRegulationByBatch,
    loading,
    error,
    refresh: fetchRegulations
  };
}

export default useRegulations;
