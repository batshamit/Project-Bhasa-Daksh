'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, BookOpen, Award, CheckCircle, Languages } from 'lucide-react';

export default function StudentTracker() {
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState('');
  const [loading, setLoading] = useState(true);
  const [studentData, setStudentData] = useState({
    enrolledCourses: [],
    courseLangs: {},
    completedModules: [],
    bestScores: []
  });

  useEffect(() => {
    async function init() {
      try {
        const data = await api.getStudents().catch(() => []);
        setStudents(data || []);
        if (data && data.length > 0) setSelectedStudent(data[0].username);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  useEffect(() => {
    if (selectedStudent) {
      const fetchMetrics = async () => {
        try {
          const [enrolled, completed, scores] = await Promise.all([
            api.getEnrolledCourses(selectedStudent).catch(() => []),
            api.getCompleted(selectedStudent).catch(() => []),
            api.getBestScores(selectedStudent).catch(() => [])
          ]);

          const langMap = {};
          for (const course of enrolled || []) {
            const res = await api.getCourseLanguage(course.course_id).catch(() => ({ language: 'Hindi' }));
            langMap[course.course_id] = res.language || 'Hindi';
          }

          setStudentData({
            enrolledCourses: enrolled || [],
            courseLangs: langMap,
            completedModules: completed || [],
            bestScores: Array.isArray(scores) ? scores : []
          });
        } catch (e) {
          console.error('Error fetching student metrics', e);
        }
      };
      fetchMetrics();
    }
  }, [selectedStudent]);

  if (loading) return <div className="flex items-center justify-center h-screen text-indigo-400">Loading Tracker...</div>;

  const currentStudentObj = students.find(s => s.username === selectedStudent);
  const globalLang = currentStudentObj?.preferred_language || 'Hindi';

  const avgScore = studentData.bestScores.length > 0
    ? Math.round(studentData.bestScores.reduce((acc, s) => acc + (s.percentage || 0), 0) / studentData.bestScores.length)
    : 0;

  const chartData = studentData.bestScores.map(s => {
    const modLabel = String(s.module_id).startsWith('final_')
      ? 'Final Exam'
      : String(s.module_id).replace('module_', 'Mod #').replace('MOD', 'Mod #');
    return {
      module: modLabel,
      score: s.percentage,
      phase: s.pls_phase ? `Phase ${s.pls_phase}` : 'Phase 1'
    };
  });

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="p-8 space-y-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white flex items-center gap-3"><TrendingUp className="text-indigo-400"/> Student Tracker</h1>
      </div>

      <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6">
        <label className="text-sm font-medium text-gray-300 mb-2 block">Select Student to Inspect</label>
        <select 
          value={selectedStudent} 
          onChange={e => setSelectedStudent(e.target.value)}
          className="max-w-md w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none font-medium"
        >
          {students.length === 0 && <option>No students available</option>}
          {students.map(s => <option key={s.username} value={s.username}>{s.name || s.username} (@{s.username}) — Prefers {s.preferred_language || 'Hindi'}</option>)}
        </select>
      </div>

      {selectedStudent && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6 flex items-center gap-4">
              <div className="p-4 bg-blue-500/10 rounded-lg"><BookOpen className="w-8 h-8 text-blue-400"/></div>
              <div>
                <p className="text-gray-400 text-sm font-medium">Enrolled Courses</p>
                <h3 className="text-2xl font-bold text-white">{studentData.enrolledCourses.length}</h3>
              </div>
            </div>
            <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6 flex items-center gap-4">
              <div className="p-4 bg-emerald-500/10 rounded-lg"><CheckCircle className="w-8 h-8 text-emerald-400"/></div>
              <div>
                <p className="text-gray-400 text-sm font-medium">Modules Completed</p>
                <h3 className="text-2xl font-bold text-white">{studentData.completedModules.length}</h3>
              </div>
            </div>
            <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6 flex items-center gap-4">
              <div className="p-4 bg-purple-500/10 rounded-lg"><Award className="w-8 h-8 text-purple-400"/></div>
              <div>
                <p className="text-gray-400 text-sm font-medium">Average Score</p>
                <h3 className="text-2xl font-bold text-white">{avgScore}%</h3>
              </div>
            </div>
            <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6 flex items-center gap-4">
              <div className="p-4 bg-amber-500/10 rounded-lg"><Languages className="w-8 h-8 text-amber-400"/></div>
              <div>
                <p className="text-gray-400 text-sm font-medium">Global Preference</p>
                <h3 className="text-xl font-bold text-white flex items-center gap-1.5 mt-0.5">
                  {globalLang.toLowerCase() !== 'english' ? '🇮🇳 Hindi Starter' : '🇬🇧 English Direct'}
                </h3>
              </div>
            </div>
          </div>

          {/* Enrolled Courses & Language Breakdown */}
          <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <BookOpen className="text-indigo-400 w-5 h-5" /> Enrolled Courses & Synced Learning Pathways
            </h2>
            {studentData.enrolledCourses.length === 0 ? (
              <p className="text-gray-500 text-center py-6">Student is not enrolled in any course.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {studentData.enrolledCourses.map((course, cIdx) => {
                  const courseLang = studentData.courseLangs[course.course_id] || globalLang;
                  const isHindi = courseLang.toLowerCase() !== 'english';

                  return (
                    <div key={course.course_id} className="bg-gray-800/40 p-4 rounded-xl border border-gray-700/60 flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="px-2.5 py-0.5 rounded text-xs font-extrabold bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 uppercase">
                            Course #{cIdx + 1}
                          </span>
                          <h3 className="text-base font-bold text-white">{course.title}</h3>
                        </div>
                        <p className="text-xs text-gray-400">ID: {course.course_id}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${isHindi ? 'bg-amber-500/10 text-amber-300 border-amber-500/30' : 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30'}`}>
                        {isHindi ? '🇮🇳 Hindi (PLS Pathway)' : '🇬🇧 English (Direct)'}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6">
            <h2 className="text-xl font-bold text-white mb-6">Performance by Module</h2>
            {chartData.length > 0 ? (
              <div className="h-[350px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                    <XAxis dataKey="module" stroke="#9CA3AF" tick={{fill: '#9CA3AF'}} />
                    <YAxis stroke="#9CA3AF" tick={{fill: '#9CA3AF'}} domain={[0, 100]} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '0.5rem', color: '#fff' }}
                      itemStyle={{ color: '#818CF8' }}
                      formatter={(val, name, item) => [`${val}% (${item.payload.phase})`, 'Score']}
                    />
                    <Bar dataKey="score" fill="#6366F1" radius={[4, 4, 0, 0]} barSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                No evaluation data recorded yet for this student.
              </div>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
}
