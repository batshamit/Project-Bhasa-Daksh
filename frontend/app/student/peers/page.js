'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { Trophy, Users, Star, Crown } from 'lucide-react';

export default function PeerComparison() {
  const { user } = useAuth();
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const data = await api.getLeaderboard();
        setLeaderboard(data || []);
      } catch (error) {
        console.error('Failed to fetch leaderboard:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, []);

  if (loading) {
    return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-indigo-500"></div></div>;
  }

  const currentUserData = leaderboard.find(l => l.username === user?.username);
  const userRank = currentUserData ? currentUserData.rank : '-';
  const percentile = currentUserData && leaderboard.length > 0 
    ? Math.round(((leaderboard.length - currentUserData.rank) / leaderboard.length) * 100)
    : 0;

  const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
  const item = { hidden: { opacity: 0, x: -20 }, show: { opacity: 1, x: 0 } };

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
        <div className="inline-flex items-center justify-center p-3 bg-yellow-500/10 rounded-full mb-4">
          <Trophy className="text-yellow-500 w-10 h-10" />
        </div>
        <h1 className="text-4xl font-bold text-white mb-3">🏆 Peer Comparison</h1>
        <p className="text-gray-400 max-w-xl mx-auto text-lg">
          Anonymous comparison across ALL learners (regardless of language). See where you stand!
        </p>
      </motion.div>

      {currentUserData && (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-gradient-to-br from-indigo-900/50 to-purple-900/50 border border-indigo-500/30 rounded-2xl p-8 flex flex-col md:flex-row items-center justify-between shadow-[0_0_30px_rgba(99,102,241,0.1)]">
          <div className="flex items-center gap-6 mb-6 md:mb-0">
            <div className="w-20 h-20 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 p-1">
              <div className="w-full h-full bg-gray-900 rounded-full flex items-center justify-center">
                <span className="text-3xl font-bold text-white">#{userRank}</span>
              </div>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">Your Ranking <Star className="text-yellow-400 w-5 h-5 fill-current" /></h2>
              <p className="text-indigo-200">You are in the top {100 - percentile}% of all learners!</p>
            </div>
          </div>
          
          <div className="flex gap-8">
            <div className="text-center">
              <p className="text-sm text-indigo-300 font-medium mb-1">Avg Score</p>
              <p className="text-3xl font-bold text-white">{currentUserData.avgScore}%</p>
            </div>
            <div className="w-px bg-indigo-500/30"></div>
            <div className="text-center">
              <p className="text-sm text-indigo-300 font-medium mb-1">Modules</p>
              <p className="text-3xl font-bold text-white">{currentUserData.modulesCompleted}</p>
            </div>
          </div>
        </motion.div>
      )}

      <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl overflow-hidden">
        <div className="p-6 border-b border-gray-800 flex items-center justify-between">
          <h3 className="text-xl font-bold text-white flex items-center gap-2"><Users className="text-indigo-400" /> Global Leaderboard</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-800/50 text-gray-400 text-sm">
                <th className="p-4 font-medium w-24 text-center">Rank</th>
                <th className="p-4 font-medium">Learner</th>
                <th className="p-4 font-medium text-center">Average Score</th>
                <th className="p-4 font-medium text-center">Modules Completed</th>
                <th className="p-4 font-medium text-center">Best Phase</th>
              </tr>
            </thead>
            <motion.tbody variants={container} initial="hidden" animate="show">
              {leaderboard.map((entry, idx) => {
                const isCurrentUser = entry.username === user?.username;
                
                return (
                  <motion.tr 
                    variants={item}
                    key={idx} 
                    className={`border-t border-gray-800/50 transition-colors ${isCurrentUser ? 'bg-indigo-500/10 border-indigo-500/30' : 'hover:bg-gray-800/30'}`}
                  >
                    <td className="p-4 text-center">
                      {entry.rank === 1 ? <span className="text-2xl" title="1st Place">🥇</span> :
                       entry.rank === 2 ? <span className="text-2xl" title="2nd Place">🥈</span> :
                       entry.rank === 3 ? <span className="text-2xl" title="3rd Place">🥉</span> :
                       <span className={`font-bold ${isCurrentUser ? 'text-indigo-400' : 'text-gray-400'}`}>#{entry.rank}</span>}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <span className={`font-medium ${isCurrentUser ? 'text-white' : 'text-gray-300'}`}>
                          {isCurrentUser ? `${entry.username} (You)` : `Learner ${String.fromCharCode(65 + (idx % 26))}${idx > 25 ? Math.floor(idx/26) : ''}`}
                        </span>
                        {isCurrentUser && <Star className="text-yellow-400 w-4 h-4 fill-current" />}
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <span className={`font-bold ${isCurrentUser ? 'text-indigo-400' : 'text-gray-200'}`}>{entry.avgScore}%</span>
                    </td>
                    <td className="p-4 text-center text-gray-300">
                      {entry.modulesCompleted}
                    </td>
                    <td className="p-4 text-center">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium inline-flex items-center gap-1 ${
                        entry.bestPhase === 'Phase 4' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
                        entry.bestPhase === 'Phase 3' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                        entry.bestPhase === 'Phase 2' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                        'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                      }`}>
                        {entry.bestPhase === 'Phase 4' && <Crown className="w-3 h-3" />}
                        {entry.bestPhase}
                      </span>
                    </td>
                  </motion.tr>
                );
              })}
              {leaderboard.length === 0 && (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-gray-500">Leaderboard is empty. Be the first to take an evaluation!</td>
                </tr>
              )}
            </motion.tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
