'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { BarChart as BarChartIcon, TrendingUp, Award, CheckCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function MyProgress() {
  const { user } = useAuth();
  const [data, setData] = useState({
    enrolledCourses: [],
    completedModules: [],
    bestScores: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.username) return;
      try {
        const [enrolled, completed, scores] = await Promise.all([
          api.getEnrolledCourses(user.username),
          api.getCompleted(user.username),
          api.getBestScores(user.username)
        ]);
        setData({
          enrolledCourses: enrolled || [],
          completedModules: completed || [],
          bestScores: scores || []
        });
      } catch (error) {
        console.error('Failed to fetch progress:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  if (loading) {
    return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-indigo-500"></div></div>;
  }

  const averageScore = data.bestScores.length > 0
    ? Math.round(data.bestScores.reduce((acc, curr) => acc + (curr.percentage || 0), 0) / data.bestScores.length)
    : 0;

  const maxPhase = data.bestScores.length > 0
    ? Math.max(...data.bestScores.map(s => parseInt(s.phase?.replace('Phase ', '') || 1)))
    : 1;

  // Prepare chart data
  const chartData = data.bestScores.map(score => ({
    name: score.module_id.length > 10 ? score.module_id.substring(0, 10) + '...' : score.module_id,
    fullName: score.module_id,
    score: score.percentage
  })).slice(0, 10); // Show top 10 recent

  const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
  const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-6xl mx-auto space-y-6 sm:space-y-8">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1.5 flex items-center gap-3">
          <BarChartIcon className="text-indigo-400 w-7 h-7 sm:w-8 sm:h-8 shrink-0" /> 📊 My Progress
        </h1>
        <p className="text-sm sm:text-base text-gray-400">Track your performance and learning milestones.</p>
      </motion.div>

      {/* Summary Cards */}
      <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
        <motion.div variants={item} className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-4 sm:p-6 flex items-center gap-4">
          <div className="p-3 sm:p-4 bg-green-500/10 rounded-lg shrink-0"><CheckCircle className="text-green-500 w-6 h-6 sm:w-8 sm:h-8" /></div>
          <div>
            <p className="text-xs sm:text-sm text-gray-400 font-medium">Total Completed</p>
            <h3 className="text-xl sm:text-2xl font-bold text-white">{data.completedModules.length} Modules</h3>
          </div>
        </motion.div>
        <motion.div variants={item} className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-4 sm:p-6 flex items-center gap-4">
          <div className="p-3 sm:p-4 bg-indigo-500/10 rounded-lg shrink-0"><TrendingUp className="text-indigo-500 w-6 h-6 sm:w-8 sm:h-8" /></div>
          <div>
            <p className="text-xs sm:text-sm text-gray-400 font-medium">Overall Average</p>
            <h3 className="text-xl sm:text-2xl font-bold text-white">{averageScore}%</h3>
          </div>
        </motion.div>
        <motion.div variants={item} className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-4 sm:p-6 flex items-center gap-4">
          <div className="p-3 sm:p-4 bg-yellow-500/10 rounded-lg shrink-0"><Award className="text-yellow-500 w-6 h-6 sm:w-8 sm:h-8" /></div>
          <div>
            <p className="text-xs sm:text-sm text-gray-400 font-medium">Best Phase</p>
            <h3 className="text-xl sm:text-2xl font-bold text-white">Phase {maxPhase}</h3>
          </div>
        </motion.div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Module Breakdown */}
        <motion.div variants={item} initial="hidden" animate="show" className="lg:col-span-2 space-y-6">
          <h2 className="text-xl font-bold text-white">Course Breakdown</h2>
          {data.enrolledCourses.length > 0 ? data.enrolledCourses.map(course => (
            <div key={course.course_id} className="bg-gray-900/50 border border-gray-800 rounded-xl overflow-hidden">
              <div className="p-6 border-b border-gray-800">
                <h3 className="text-lg font-bold text-white">{course.title}</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-800/50 text-gray-400 text-sm">
                      <th className="p-4 font-medium">Module</th>
                      <th className="p-4 font-medium">Score</th>
                      <th className="p-4 font-medium">Phase</th>
                      <th className="p-4 font-medium">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.bestScores.filter(s => s.module_id.startsWith(course.course_id)).length > 0 ? (
                      data.bestScores.filter(s => s.module_id.startsWith(course.course_id)).map((score, idx) => (
                        <tr key={idx} className="border-t border-gray-800/50 hover:bg-gray-800/20 transition-colors">
                          <td className="p-4 text-gray-200 font-medium">{score.module_id}</td>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <span className="text-white font-bold">{score.percentage}%</span>
                              <span className="text-xs text-gray-500">({score.score}/{score.total_questions})</span>
                            </div>
                          </td>
                          <td className="p-4">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                              score.phase === 'Phase 4' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
                              score.phase === 'Phase 3' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                              score.phase === 'Phase 2' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                              'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                            }`}>
                              {score.phase}
                            </span>
                          </td>
                          <td className="p-4 text-gray-400 text-sm">
                            {new Date(score.evaluated_at).toLocaleDateString()}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="4" className="p-8 text-center text-gray-500">No evaluations yet for this course.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )) : (
            <div className="p-8 text-center text-gray-500 bg-gray-900/50 border border-gray-800 rounded-xl">
              You are not enrolled in any courses.
            </div>
          )}
        </motion.div>

        {/* Chart */}
        <motion.div variants={item} initial="hidden" animate="show" className="lg:col-span-1">
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 h-full min-h-[400px] flex flex-col">
            <h2 className="text-xl font-bold text-white mb-6">Score Distribution</h2>
            {chartData.length > 0 ? (
              <div className="flex-1 w-full h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" horizontal={false} />
                    <XAxis type="number" domain={[0, 100]} stroke="#9ca3af" />
                    <YAxis dataKey="name" type="category" stroke="#9ca3af" width={80} tick={{fill: '#9ca3af', fontSize: 12}} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', borderRadius: '0.5rem', color: '#f3f4f6' }}
                      itemStyle={{ color: '#818cf8' }}
                      formatter={(value) => [`${value}%`, 'Score']}
                      labelFormatter={(label) => `Module: ${chartData.find(d => d.name === label)?.fullName || label}`}
                    />
                    <Bar dataKey="score" fill="#6366f1" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-500">
                Not enough data to display chart.
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
