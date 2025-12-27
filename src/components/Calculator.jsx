import React, { useState, useEffect } from 'react';
import { subjectsData } from '../data/subjects';
import { useRegulations } from '../hooks/useRegulations';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../contexts/ToastContext';
import { rtdb } from '../firebase/config';
import { ref, get } from 'firebase/database';
import { getSubjectsFromRTDB, saveGradesToRTDB, getGradesFromRTDB } from '../services/realtimeDbService';
import { TrendingUp, Award, BarChart3 } from 'lucide-react';

export default function Calculator({ initialBatch = '', initialRegulation = '' }) {
  const { currentUser, userRole, userData } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  
  const studentBatch = userData?.batch || initialBatch;
  const studentRegulation = userData?.regulation || initialRegulation;
  
  const [batch, setBatch] = useState(studentBatch);
  const [semester, setSemester] = useState('');
  const [subjects, setSubjects] = useState([]);
  const [grades, setGrades] = useState({});
  const [result, setResult] = useState(null);
  const [saving, setSaving] = useState(false);
  const [loadingGrades, setLoadingGrades] = useState(false);
  
  // CGPA and history state
  const [allSemesterGrades, setAllSemesterGrades] = useState([]);
  const [cgpa, setCgpa] = useState(null);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const { getBatches } = useRegulations();
  
  const allBatches = Object.keys(subjectsData);
  const batches = studentRegulation 
    ? (getBatches(studentRegulation) || []).filter(b => allBatches.includes(b))
    : allBatches;
  
  const semesters = batch ? Object.keys(subjectsData[batch] || {}) : [];

  // Fetch all semester grades for CGPA calculation
  useEffect(() => {
    const fetchAllGrades = async () => {
      if (!currentUser || !batch) return;
      
      setLoadingHistory(true);
      try {
        const gradesRef = ref(rtdb, 'grades');
        const snapshot = await get(gradesRef);
        
        if (snapshot.exists()) {
          const allGrades = snapshot.val();
          const userGrades = [];
          
          // Check all grade entries
          Object.entries(allGrades).forEach(([key, data]) => {
            // Match by studentId field OR by key starting with user uid
            const isUserGrade = data.studentId === currentUser.uid || key.startsWith(currentUser.uid);
            const isSameBatch = data.batch === batch;
            
            if (isUserGrade && isSameBatch && data.sgpa) {
              userGrades.push({
                semester: parseInt(data.semester),
                sgpa: parseFloat(data.sgpa),
                key,
                ...data
              });
            }
          });
          
          // Sort by semester
          userGrades.sort((a, b) => a.semester - b.semester);
        //console.log('CGPA Chart - Found grades:', userGrades);
          setAllSemesterGrades(userGrades);
          
          // Calculate CGPA
          if (userGrades.length > 0) {
            const totalSGPA = userGrades.reduce((sum, g) => sum + g.sgpa, 0);
            setCgpa((totalSGPA / userGrades.length).toFixed(2));
          } else {
            setCgpa(null);
          }
        } else {
          setAllSemesterGrades([]);
          setCgpa(null);
        }
      } catch (error) {
        console.error('Error fetching all grades:', error);
        setAllSemesterGrades([]);
        setCgpa(null);
      } finally {
        setLoadingHistory(false);
      }
    };
    
    fetchAllGrades();
  }, [currentUser, batch, result]); // Re-fetch when result changes (new save)

  useEffect(() => {
    if (userData?.batch) {
      setBatch(userData.batch);
    } else if (initialBatch) {
      setBatch(initialBatch);
    }
  }, [userData?.batch, initialBatch]);

  useEffect(() => {
    const fetchSubjects = async () => {
      if (batch && semester) {
        try {
          const subjectsList = await getSubjectsFromRTDB(batch, semester);
          setSubjects(subjectsList);
        } catch (e) {
          console.error("Error fetching subjects:", e);
          setSubjects(subjectsData[batch]?.[semester] || []);
        }
        setGrades({});
        setResult(null);
      }
    };
    fetchSubjects();
  }, [batch, semester]);

  useEffect(() => {
    const loadSavedGrades = async () => {
      if (currentUser && batch && semester && subjects.length > 0) {
        setLoadingGrades(true);
        try {
          const savedGrades = await getGradesFromRTDB(currentUser.uid, batch, semester);
          if (savedGrades && savedGrades.grades) {
            setGrades(savedGrades.grades);
            setResult(savedGrades.sgpa);
          }
        } catch (error) {
          console.error('Error loading saved grades:', error);
        } finally {
          setLoadingGrades(false);
        }
      }
    };
    loadSavedGrades();
  }, [currentUser, batch, semester, subjects.length]);

  const handleGradeChange = (index, grade) => {
    setGrades(prev => ({ ...prev, [index]: parseInt(grade) }));
    setResult(null);
  };

  const calculateSGPA = async () => {
    if (!currentUser) return;
    
    let totalPoints = 0;
    let totalCredits = 0;
    
    subjects.forEach((sub, index) => {
      const grade = grades[index] !== undefined ? grades[index] : 10;
      totalPoints += grade * sub.credits;
      totalCredits += sub.credits;
    });

    if (totalCredits === 0) return;
    
    const sgpa = (totalPoints / totalCredits).toFixed(2);
    setResult(sgpa);

    setSaving(true);
    try {
      await saveGradesToRTDB(currentUser.uid, batch, semester, grades, sgpa);
      addToast('Grades saved successfully!', 'success');
    } catch (error) {
      console.error('Error saving grades:', error);
      addToast('Calculated but failed to save. Try again.', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Anna University 10-point grading system
  const gradeOptions = [
    { value: 10, label: 'O', description: 'Outstanding (91-100%)' },
    { value: 9, label: 'A+', description: 'Excellent (81-90%)' },
    { value: 8, label: 'A', description: 'Very Good (71-80%)' },
    { value: 7, label: 'B+', description: 'Good (61-70%)' },
    { value: 6, label: 'B', description: 'Average (56-60%)' },
    { value: 5, label: 'C', description: 'Satisfactory (50-55%)' },
    { value: 0, label: 'U', description: 'Failed (<50%)' }
  ];

  // Bar color constant
  const barColor = '#8b5cf6';

  // Calculate max height for chart bars
  const maxSGPA = 10;

  // Convert SGPA/CGPA to Percentage (Anna University: CGPA × 10)
  const toPercentage = (gpa) => {
    if (!gpa || gpa <= 0) return '-';
    const percentage = parseFloat(gpa) * 10;
    return percentage.toFixed(1) + '%';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '900px', margin: '0 auto', padding: '0 8px' }}>
      
      {/* CGPA Card - Show for logged-in users */}
      {currentUser && batch && (
        <div className="glass-panel" style={{ 
          padding: '16px', 
          background: 'linear-gradient(135deg, rgba(59,130,246,0.1), rgba(139,92,246,0.1))',
          border: '1px solid rgba(139,92,246,0.3)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
            {/* CGPA Display */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ 
                width: '64px', 
                height: '64px', 
                borderRadius: '16px', 
                background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Award size={32} color="white" />
              </div>
            <div>
                <p style={{ margin: '0 0 4px', fontSize: '14px', color: 'var(--text-secondary)' }}>Overall CGPA</p>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px' }}>
                  <p style={{ 
                    margin: 0, 
                    fontSize: '2.5rem', 
                    fontWeight: '700',
                    background: 'linear-gradient(to right, #60a5fa, #c084fc)',
                    WebkitBackgroundClip: 'text',
                    backgroundClip: 'text',
                    color: 'transparent'
                  }}>
                    {cgpa || '-'}
                  </p>
                  {cgpa && (
                    <span style={{ 
                      fontSize: '1.2rem', 
                      fontWeight: '600',
                      color: '#10b981',
                      padding: '4px 12px',
                      background: 'rgba(16, 185, 129, 0.15)',
                      borderRadius: '8px'
                    }}>
                      {toPercentage(cgpa)}
                    </span>
                  )}
                </div>
                <p style={{ margin: '4px 0 0', fontSize: '12px', color: 'var(--text-secondary)' }}>
                  {allSemesterGrades.length > 0 
                    ? `Based on ${allSemesterGrades.length} semester${allSemesterGrades.length > 1 ? 's' : ''}`
                    : 'Calculate your first semester to see CGPA'
                  }
                </p>
              </div>
            </div>

            {/* Semester Progress Chart */}
            <div style={{ flex: 1, minWidth: '300px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <BarChart3 size={18} color="var(--text-secondary)" />
                <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Semester-wise SGPA</span>
              </div>
              <div style={{ display: 'flex', gap: '8px', height: '100px' }}>
                {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => {
                  const semGrade = allSemesterGrades.find(g => parseInt(g.semester) === sem);
                  const sgpaValue = semGrade?.sgpa || 0;
                  const barHeight = sgpaValue > 0 ? Math.max((sgpaValue / maxSGPA) * 100, 10) : 5;
                  const hasData = semGrade !== undefined && sgpaValue > 0;
                  
                  return (
                    <div key={sem} style={{ 
                      flex: 1, 
                      display: 'flex', 
                      flexDirection: 'column', 
                      alignItems: 'center',
                      justifyContent: 'flex-end'
                    }}>
                      {/* SGPA Value */}
                      {hasData && (
                        <span style={{ 
                          fontSize: '10px', 
                          fontWeight: '600', 
                          marginBottom: '4px',
                          color: barColor
                        }}>
                          {sgpaValue}
                        </span>
                      )}
                      {/* Bar */}
                      <div style={{ 
                        width: '80%',
                        maxWidth: '40px',
                        height: `${barHeight}%`,
                        background: hasData 
                          ? barColor
                          : 'rgba(255,255,255,0.1)',
                        borderRadius: '4px 4px 0 0'
                      }} />
                      {/* Semester Label */}
                      <span style={{ 
                        fontSize: '10px', 
                        marginTop: '6px', 
                        color: hasData ? 'var(--text-primary)' : 'var(--text-secondary)',
                        fontWeight: hasData ? '600' : '400'
                      }}>
                        S{sem}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Calculator Card */}
      <div className="glass-panel" style={{ padding: '32px' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
          <TrendingUp size={28} />
          SGPA Calculator
        </h2>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>Batch</label>
            <select className="input-field" value={batch} onChange={e => setBatch(e.target.value)}>
              <option value="">Select Batch</option>
              {batches.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>Semester</label>
            <select className="input-field" value={semester} onChange={e => setSemester(e.target.value)} disabled={!batch}>
              <option value="">Select Semester</option>
              {semesters.map(s => <option key={s} value={s}>Semester {s}</option>)}
            </select>
          </div>
        </div>

        {loadingGrades && (
          <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-secondary)' }}>
            Loading saved grades...
          </div>
        )}

        {subjects.length > 0 && !loadingGrades && (
          <div style={{ filter: !currentUser ? 'blur(4px)' : 'none', pointerEvents: !currentUser ? 'none' : 'auto', transition: 'all 0.3s ease' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '24px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--glass-border)' }}>
                    <th style={{ padding: '10px', textAlign: 'left' }}>Subject</th>
                    <th style={{ padding: '10px', textAlign: 'center', width: '80px' }}>Credits</th>
                    <th style={{ padding: '10px', textAlign: 'center', width: '100px' }}>Grade</th>
                  </tr>
                </thead>
                <tbody>
                  {subjects.map((sub, index) => (
                    <tr key={sub.code || index} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                      <td style={{ padding: '10px' }}>
                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', display: 'block', marginBottom: '2px' }}>
                          {sub.code}
                        </span>
                        <span style={{ fontWeight: '500' }}>{sub.name}</span>
                      </td>
                      <td style={{ padding: '10px', textAlign: 'center' }}>
                        <span style={{ background: 'var(--accent-primary)', padding: '4px 12px', borderRadius: '12px', fontSize: '0.9rem' }}>
                          {sub.credits}
                        </span>
                      </td>
                      <td style={{ padding: '10px', textAlign: 'center' }}>
                        <select 
                          className="input-field" 
                          style={{ padding: '8px', textAlign: 'center' }}
                          value={grades[index] !== undefined ? grades[index] : 10}
                          onChange={e => handleGradeChange(index, e.target.value)}
                        >
                          {gradeOptions.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div style={{ textAlign: 'center' }}>
              <button className="btn-primary" onClick={calculateSGPA} disabled={saving}>
                {saving ? 'Saving...' : 'Calculate & Save SGPA'}
              </button>
            </div>
          </div>
        )}

        {!currentUser && subjects.length > 0 && (
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center', zIndex: 10 }}>
            <p style={{ marginBottom: '16px', fontWeight: '600' }}>Please log in to calculate and save</p>
            <button className="btn-primary" onClick={() => navigate('/login')}>Login</button>
          </div>
        )}

        {result && (
          <div style={{ 
            textAlign: 'center', 
            marginTop: '24px', 
            padding: '24px', 
            background: 'rgba(59, 130, 246, 0.1)',
            borderRadius: '16px',
            border: '1px solid rgba(59, 130, 246, 0.3)'
          }}>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '8px' }}>Your SGPA for Semester {semester}</p>
            <p style={{ 
              fontSize: '3rem', 
              fontWeight: 'bold',
              background: 'linear-gradient(to right, #60a5fa, #c084fc)',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              color: 'transparent',
              margin: 0
            }}>
              {result}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
