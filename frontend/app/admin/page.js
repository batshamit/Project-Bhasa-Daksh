'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { BookOpen, Users, Clock, Layers, ShieldCheck, Activity, BarChart2 } from 'lucide-react';
import Link from 'next/link';

export default function AdminDashboard() {
  const [stats, setStats] = useState({ courses: 0, students: 0, pending: 0, modules: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [courses, students, pending, modules] = await Promise.all([
          api.getCourses().catch(() => []),
          api.getStudents().catch(() => []),
          api.getPendingUsers().catch(() => []),
          api.getLectures().catch(() => [])
        ]);
        setStats({
          courses: courses?.length || 0,
          students: students?.length || 0,
          pending: pending?.length || 0,
          modules: modules?.length || 0
        });
      } catch (error) {
        console.error('Error fetching stats', error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) return <div className="flex items-center justify-center h-screen text-indigo-400">Loading Dashboard...</div>;

  const statCards = [
    { title: 'Total Courses', value: stats.courses, icon: BookOpen, color: 'text-blue-400', border: 'border-blue-500/50', bg: 'bg-blue-500/10' },
    { title: 'Total Students', value: stats.students, icon: Users, color: 'text-emerald-400', border: 'border-emerald-500/50', bg: 'bg-emerald-500/10' },
    { title: 'Pending Approvals', value: stats.pending, icon: Clock, color: 'text-amber-400', border: 'border-amber-500/50', bg: 'bg-amber-500/10' },
    { title: 'Total Modules', value: stats.modules, icon: Layers, color: 'text-purple-400', border: 'border-purple-500/50', bg: 'bg-purple-500/10' }
  ];

  const quickActions = [
    { title: 'Manage Courses', href: '/admin/courses', icon: BookOpen },
    { title: 'User Approvals', href: '/admin/users', icon: ShieldCheck },
    { title: 'Enrollments', href: '/admin/enrollment', icon: Users },
    { title: 'Evaluations', href: '/admin/evaluations', icon: Activity },
    { title: 'Student Tracker', href: '/admin/tracker', icon: Layers },
    { title: 'Analytics', href: '/admin/analytics', icon: BarChart2 }
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="p-8">
      <div className="flex items-center gap-3 mb-8">
        <h1 className="text-3xl font-bold text-white">Admin Dashboard 👋</h1>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {statCards.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div 
              key={stat.title}
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className={`bg-gray-900/50 backdrop-blur-sm border-l-4 ${stat.border} border-t border-r border-b border-gray-800 rounded-xl p-6 relative overflow-hidden`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-gray-400 mb-1">{stat.title}</p>
                  <h3 className="text-3xl font-bold text-white">{stat.value}</h3>
                </div>
                <div className={`p-3 rounded-lg ${stat.bg}`}>
                  <Icon className={`w-6 h-6 ${stat.color}`} />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      <div>
        <h2 className="text-2xl font-bold text-white mb-6">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {quickActions.map((action, i) => {
            const Icon = action.icon;
            return (
              <Link href={action.href} key={action.title}>
                <motion.div 
                  whileHover={{ scale: 1.02 }}
                  className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6 flex items-center gap-4 hover:bg-gray-800/50 transition-all cursor-pointer hover:shadow-lg hover:shadow-indigo-500/10"
                >
                  <div className="p-3 bg-indigo-500/10 rounded-lg text-indigo-400">
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className="text-lg font-medium text-gray-200">{action.title}</span>
                </motion.div>
              </Link>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
