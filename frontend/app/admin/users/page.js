'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { ShieldCheck, Check, X, Users, UserX } from 'lucide-react';

export default function UserApprovals() {
  const [pending, setPending] = useState([]);
  const [approved, setApproved] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    try {
      setLoading(true);
      const [pendingUsers, approvedUsers] = await Promise.all([
        api.getPendingUsers().catch(() => []),
        api.getStudents().catch(() => [])
      ]);
      setPending(pendingUsers || []);
      setApproved(approvedUsers || []);
    } catch (error) {
      console.error('Error fetching users', error);
    } finally {
      setLoading(false);
    }
  }

  const handleApprove = async (username) => {
    try {
      await api.approveUser(username);
      setPending(pending.filter(u => u.username !== username));
      fetchUsers(); // refresh lists
    } catch (error) {
      console.error('Error approving user', error);
    }
  };

  const handleReject = async (username) => {
    try {
      // Assuming a reject API exists, if not, just remove from UI for now
      // await api.rejectUser(username);
      setPending(pending.filter(u => u.username !== username));
    } catch (error) {
      console.error('Error rejecting user', error);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-screen text-indigo-400">Loading Users...</div>;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="p-4 sm:p-6 md:p-8 space-y-6 sm:space-y-8">
      <div className="flex items-center gap-3">
        <ShieldCheck className="w-7 h-7 sm:w-8 sm:h-8 text-indigo-400 shrink-0" />
        <h1 className="text-2xl sm:text-3xl font-bold text-white">User Approvals</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Pending Approvals */}
        <div className="lg:col-span-1 space-y-6">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">Pending Requests <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/20 text-amber-400">{pending.length}</span></h2>
          
          <AnimatePresence>
            {pending.length === 0 ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-8 text-center flex flex-col items-center">
                <ShieldCheck className="w-12 h-12 text-gray-600 mb-3" />
                <p className="text-gray-400 font-medium">No pending approvals</p>
                <p className="text-sm text-gray-500 mt-1">You're all caught up!</p>
              </motion.div>
            ) : (
              pending.map(user => (
                <motion.div 
                  key={user.username}
                  initial={{ opacity: 0, scale: 0.95 }} 
                  animate={{ opacity: 1, scale: 1 }} 
                  exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                  className="bg-gray-900/50 backdrop-blur-sm border border-amber-500/20 rounded-xl p-5 hover:border-amber-500/40 transition-colors"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-white">{user.name || user.username}</h3>
                      <p className="text-sm text-gray-400">@{user.username}</p>
                      <div className="mt-2">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                          user.preferred_language === 'Hindi' || !user.preferred_language
                            ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                            : 'bg-blue-500/10 text-blue-300 border-blue-500/30'
                        }`}>
                          {user.preferred_language === 'Hindi' || !user.preferred_language ? '🇮🇳 Hindi (PLS Pathway)' : '🇬🇧 English (Direct)'}
                        </span>
                      </div>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/20 text-amber-400">Student</span>
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => handleApprove(user.username)} className="flex-1 bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30 px-3 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2">
                      <Check className="w-4 h-4" /> Approve
                    </button>
                    <button onClick={() => handleReject(user.username)} className="flex-1 bg-red-600/20 text-red-400 hover:bg-red-600/30 px-3 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2">
                      <X className="w-4 h-4" /> Reject
                    </button>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>

        {/* Approved Users */}
        <div className="lg:col-span-2">
          <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2"><Users className="w-6 h-6 text-indigo-400"/> Approved Students</h2>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-800">
                    <th className="py-3 px-4 text-sm font-semibold text-gray-400">Name</th>
                    <th className="py-3 px-4 text-sm font-semibold text-gray-400">Username</th>
                    <th className="py-3 px-4 text-sm font-semibold text-gray-400">Preferred Language</th>
                    <th className="py-3 px-4 text-sm font-semibold text-gray-400">Status</th>
                    <th className="py-3 px-4 text-sm font-semibold text-gray-400 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {approved.length === 0 ? (
                    <tr><td colSpan="5" className="py-8 text-center text-gray-500">No approved students yet.</td></tr>
                  ) : (
                    approved.map(student => (
                      <tr key={student.username} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                        <td className="py-3 px-4 text-gray-200 font-medium">{student.name || student.username}</td>
                        <td className="py-3 px-4 text-gray-400">@{student.username}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                            student.preferred_language === 'Hindi'
                              ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                              : 'bg-blue-500/10 text-blue-300 border-blue-500/30'
                          }`}>
                            {student.preferred_language === 'Hindi' ? '🇮🇳 Hindi (PLS Pathway)' : '🇬🇧 English (Direct)'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-400">Active</span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button className="bg-red-600/20 text-red-400 hover:bg-red-600/30 px-3 py-1.5 rounded-lg text-sm transition-colors">Revoke</button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
