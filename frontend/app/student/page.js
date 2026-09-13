'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { BookOpen, CheckCircle, Award, TrendingUp, ArrowRight, PlayCircle } from 'lucide-react';
import Link from 'next/link';

export default function StudentDashboard() {
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
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-indigo-500"></div>
      </div>
    );
  }

  const averageScore = data.bestScores.length > 0
    ? Math.round(data.bestScores.reduce((acc, curr) => acc + (curr.percentage || 0), 0) / data.bestScores.length)
    : 0;

  const currentPhase = data.bestScores.length > 0
    ? Math.max(...data.bestScores.map(s => parseInt(s.phase?.replace('Phase ', '') || 1)))
    : 1;

  const stats = [
    { title: 'Enrolled Courses', value: data.enrolledCourses.length, icon: BookOpen, color: 'text-blue-400' },
    { title: 'Completed Modules', value: data.completedModules.length, icon: CheckCircle, color: 'text-green-400' },
    { title: 'Average Score', value: `${averageScore}%`, icon: Award, color: 'text-yellow-400' },
    { title: 'Current Phase', value: `Phase ${currentPhase}`, icon: TrendingUp, color: 'text-purple-400' },
  ];

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto space-y-6 sm:space-y-8">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-1.5">Welcome back, {user?.username}! 👋</h1>
          <p className="text-sm sm:text-base text-gray-400">Ready to continue your language journey?</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <Link href="/student/lectures" className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2.5 rounded-xl font-medium transition-all flex items-center justify-center gap-2 text-sm">
            <PlayCircle className="w-4 h-4 text-accent" /> Continue Learning
          </Link>
          <Link href="/student/evaluation" className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white px-4 py-2.5 rounded-xl font-medium transition-all hover:shadow-lg hover:shadow-indigo-500/25 flex items-center justify-center gap-2 text-sm">
            Take Evaluation <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </motion.div>

      <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <motion.div key={index} variants={item} className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <stat.icon className={`w-16 h-16 ${stat.color}`} />
            </div>
            <div className="relative z-10">
              <p className="text-gray-400 text-sm font-medium mb-1">{stat.title}</p>
              <h3 className="text-3xl font-bold text-white">{stat.value}</h3>
            </div>
          </motion.div>
        ))}
      </motion.div>

      <motion.div variants={item} initial="hidden" animate="show" className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6">
        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
          <Award className="text-yellow-400" /> Recent Activity
        </h2>
        {data.bestScores.length > 0 ? (
          <div className="space-y-4">
            {data.bestScores.slice(0, 5).map((score, idx) => (
              <div key={idx} className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg border border-gray-700/50">
                <div>
                  <h4 className="text-white font-medium">{score.module_id}</h4>
                  <p className="text-sm text-gray-400">Score: {score.score}/{score.total_questions}</p>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    score.phase === 'Phase 4' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/50' :
                    score.phase === 'Phase 3' ? 'bg-green-500/20 text-green-400 border border-green-500/50' :
                    score.phase === 'Phase 2' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/50' :
                    'bg-gray-500/20 text-gray-400 border border-gray-500/50'
                  }`}>
                    {score.phase || 'Phase 1'}
                  </span>
                  <span className="text-lg font-bold text-white">{score.percentage}%</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-400">
            No recent activity found. Start learning to see your progress here!
          </div>
        )}
      </motion.div>
    </div>
  );
}
