'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { BarChart2, Filter, Trophy, Medal } from 'lucide-react';

export default function PeerAnalytics() {
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('all');
  const [leaderboard, setLeaderboard] = useState([]);

  useEffect(() => {
    async function fetchData() {
      try {
        const [cData, lData] = await Promise.all([
          api.getCourses().catch(() => []),
          api.getAdminLeaderboard().catch(() => [])
        ]);
        setCourses(cData || []);
        setLeaderboard(lData || []);
      } catch (error) {
        console.error('Failed to fetch analytics:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) return <div className="flex items-center justify-center h-screen text-indigo-400">Loading Analytics...</div>;

  const chartData = leaderboard.map(l => ({ 
    name: l.name || l.username, 
    score: l.avgScore 
  }));

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="p-8 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white flex items-center gap-3"><BarChart2 className="text-indigo-400"/> Peer Analytics</h1>
        <div className="flex items-center gap-2 bg-gray-800 rounded-lg px-4 py-2 border border-gray-700">
          <Filter className="w-4 h-4 text-gray-400"/>
          <select 
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
            className="bg-transparent text-white outline-none text-sm font-medium cursor-pointer"
          >
            <option value="all" className="bg-gray-800">All Courses</option>
            {courses.map(c => (
              <option key={c.course_id} value={c.course_id} className="bg-gray-800">{c.title}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Leaderboard */}
        <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6 overflow-hidden">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2"><Trophy className="w-5 h-5 text-amber-400"/> Leaderboard</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="py-3 px-4 text-sm font-semibold text-gray-400 w-16">Rank</th>
                  <th className="py-3 px-4 text-sm font-semibold text-gray-400">Student Name</th>
                  <th className="py-3 px-4 text-sm font-semibold text-gray-400 text-center">Avg Score</th>
                  <th className="py-3 px-4 text-sm font-semibold text-gray-400 text-center">Modules</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((student, idx) => (
                  <tr key={student.username} className={`border-b border-gray-800/50 transition-colors ${idx < 3 ? 'bg-gray-800/20' : 'hover:bg-gray-800/30'}`}>
                    <td className="py-4 px-4 font-bold">
                      {idx === 0 ? <Medal className="text-yellow-400 w-6 h-6"/> : 
                       idx === 1 ? <Medal className="text-gray-400 w-6 h-6"/> : 
                       idx === 2 ? <Medal className="text-amber-600 w-6 h-6"/> : 
                       <span className="text-gray-500 pl-2">#{student.rank}</span>}
                    </td>
                    <td className="py-4 px-4 text-white font-medium">
                      {student.name} <span className="text-xs text-gray-500">(@{student.username})</span>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${student.avgScore >= 90 ? 'bg-emerald-500/20 text-emerald-400' : student.avgScore >= 70 ? 'bg-blue-500/20 text-blue-400' : 'bg-amber-500/20 text-amber-400'}`}>
                        {student.avgScore}%
                      </span>
                    </td>
                    <td className="py-4 px-4 text-center text-gray-300">{student.modulesCompleted}</td>
                  </tr>
                ))}
                {leaderboard.length === 0 && (
                  <tr>
                    <td colSpan="4" className="py-8 text-center text-gray-500">No student activity recorded yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Chart */}
        <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6">
          <h2 className="text-xl font-bold text-white mb-6">Score Distribution</h2>
          {chartData.length > 0 ? (
            <div className="h-[400px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                  <XAxis dataKey="name" stroke="#9CA3AF" tick={{fill: '#9CA3AF'}} />
                  <YAxis stroke="#9CA3AF" tick={{fill: '#9CA3AF'}} domain={[0, 100]} />
                  <Tooltip 
                    cursor={{fill: '#374151', opacity: 0.4}}
                    contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '0.5rem', color: '#fff' }}
                    formatter={(val) => [`${val}%`, 'Avg Score']}
                  />
                  <Bar dataKey="score" fill="#6366F1" radius={[4, 4, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[400px] flex items-center justify-center text-gray-500">
              No evaluation data to graph yet.
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
