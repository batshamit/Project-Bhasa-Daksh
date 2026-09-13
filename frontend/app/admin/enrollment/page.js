'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { Users, BookOpen, CheckSquare, Square, UserMinus, Plus } from 'lucide-react';

export default function EnrollmentManagement() {
  const [courses, setCourses] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [enrolledStudents, setEnrolledStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedToEnroll, setSelectedToEnroll] = useState(new Set());

  useEffect(() => {
    async function init() {
      try {
        const [cData, sData] = await Promise.all([
          api.getCourses().catch(() => []),
          api.getStudents().catch(() => [])
        ]);
        setCourses(cData || []);
        setStudents(sData || []);
        if (cData?.length > 0) setSelectedCourse(cData[0].course_id);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  useEffect(() => {
    if (selectedCourse) {
      const fetchEnrolled = async () => {
        try {
          const res = await api.getCourseStudents(selectedCourse);
          setEnrolledStudents(res || []);
        } catch (err) {
          console.error(err);
          setEnrolledStudents([]);
        }
      };
      fetchEnrolled();
      setSelectedToEnroll(new Set());
    }
  }, [selectedCourse]);

  const handleEnrollSelected = async () => {
    try {
      for (const username of selectedToEnroll) {
        await api.enrollStudent({ username, course_id: selectedCourse });
      }
      const res = await api.getCourseStudents(selectedCourse);
      setEnrolledStudents(res || []);
      setSelectedToEnroll(new Set());
    } catch (e) {
      console.error(e);
    }
  };

  const handleRemove = async (username) => {
    try {
      await api.unenrollStudent({ username, course_id: selectedCourse });
      const res = await api.getCourseStudents(selectedCourse);
      setEnrolledStudents(res || []);
    } catch (e) {
      console.error(e);
    }
  };

  const unenrolledStudents = students.filter(s => !enrolledStudents.some(es => es.username === s.username));

  if (loading) return <div className="flex items-center justify-center h-screen text-indigo-400">Loading Enrollments...</div>;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="p-8 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white flex items-center gap-3"><Users className="text-indigo-400"/> Enrollment Management</h1>
      </div>

      <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6 mb-8">
        <label className="text-sm font-medium text-gray-300 mb-2 block">Select Course to Manage</label>
        <div className="relative max-w-md">
          <select 
            value={selectedCourse} 
            onChange={e => setSelectedCourse(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none appearance-none"
          >
            {courses.map(c => <option key={c.course_id} value={c.course_id}>{c.title} ({c.course_id})</option>)}
          </select>
          <BookOpen className="absolute right-4 top-3 text-gray-400 pointer-events-none" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Enrolled Students */}
        <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">Enrolled Students <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-500/20 text-indigo-400">{enrolledStudents.length}</span></h2>
          <div className="space-y-3">
            {enrolledStudents.length === 0 ? <p className="text-gray-500 text-center py-4">No students enrolled in this course.</p> : enrolledStudents.map(student => {
              const studentLang = student.course_language || student.preferred_language || (students.find(s => s.username === student.username)?.preferred_language) || 'Hindi';
              const isHindi = String(studentLang).toLowerCase() !== 'english';
              const langBadge = isHindi ? '🇮🇳 Hindi (PLS Pathway)' : '🇬🇧 English (Direct)';
              
              return (
                <div key={student.username} className="flex items-center justify-between bg-gray-800/30 p-4 rounded-lg border border-gray-700/50 hover:bg-gray-800/50 transition-colors">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-white font-medium">{student.name || student.username}</p>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${isHindi ? 'bg-amber-500/10 text-amber-300 border-amber-500/30' : 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30'}`}>{langBadge}</span>
                    </div>
                    <p className="text-sm text-gray-400">@{student.username}</p>
                  </div>
                  <button onClick={() => handleRemove(student.username)} className="bg-red-600/20 text-red-400 hover:bg-red-600/30 p-2 rounded-lg transition-colors" title="Remove Enrollment">
                    <UserMinus className="w-5 h-5" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Enroll New Students */}
        <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-white">Enroll New Students</h2>
            {selectedToEnroll.size > 0 && (
              <button onClick={handleEnrollSelected} className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white px-4 py-2 rounded-lg font-medium transition-all text-sm flex items-center gap-2">
                <Plus className="w-4 h-4" /> Enroll Selected ({selectedToEnroll.size})
              </button>
            )}
          </div>
          
          <div className="space-y-3">
            {unenrolledStudents.length === 0 ? <p className="text-gray-500 text-center py-4">All students are already enrolled.</p> : unenrolledStudents.map(student => {
              const isSelected = selectedToEnroll.has(student.username);
              const lang = student.preferred_language === 'Hindi' ? '🇮🇳 Hindi' : '🇬🇧 English';
              
              return (
                <div 
                  key={student.username} 
                  onClick={() => {
                    const newSet = new Set(selectedToEnroll);
                    isSelected ? newSet.delete(student.username) : newSet.add(student.username);
                    setSelectedToEnroll(newSet);
                  }}
                  className={`flex items-center gap-4 p-4 rounded-lg border cursor-pointer transition-colors ${isSelected ? 'bg-indigo-500/10 border-indigo-500/50' : 'bg-gray-800/30 border-gray-700/50 hover:bg-gray-800/50'}`}
                >
                  <div className="text-indigo-400">
                    {isSelected ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5 text-gray-500" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-white font-medium">{student.name || student.username}</p>
                      <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-800 text-amber-300 border border-amber-500/20">{lang}</span>
                    </div>
                    <p className="text-sm text-gray-400">@{student.username}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
