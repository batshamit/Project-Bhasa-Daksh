'use client';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { LogOut } from 'lucide-react';
import { useAuth } from '@/lib/auth';

export default function Sidebar({ items, role }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <div className="w-[250px] h-screen fixed left-0 top-0 bg-gray-900/80 backdrop-blur-xl border-r border-gray-800 flex flex-col z-40">
      <div className="p-6 flex items-center gap-3">
        <div className="w-10 h-10 bg-gradient-to-br from-accent to-accent-hover rounded-xl flex items-center justify-center text-xl shadow-lg shadow-accent/25">
          🎓
        </div>
        <div>
          <h1 className="font-bold text-white text-lg tracking-tight">Bhasha-Daksh</h1>
          <p className="text-xs text-accent font-medium uppercase tracking-wider">{role} Panel</p>
        </div>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
        {items.map((item, index) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <motion.div
              key={item.href}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Link
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all relative group ${
                  isActive 
                    ? 'bg-accent/10 text-white' 
                    : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
                }`}
              >
                {isActive && (
                  <motion.div 
                    layoutId="activeTab"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-accent rounded-r-full" 
                  />
                )}
                <Icon className={`w-5 h-5 ${isActive ? 'text-accent' : 'group-hover:text-gray-300'}`} />
                <span className="font-medium text-sm">{item.label}</span>
              </Link>
            </motion.div>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-800 bg-gray-900/50 space-y-2">
        {role === 'student' && (
          <div className="px-2 py-1.5 bg-gray-800/80 rounded-xl border border-gray-700/60 flex items-center justify-between">
            <span className="text-xs text-gray-400 font-medium px-2">Language</span>
            <div className="flex bg-gray-900 p-0.5 rounded-lg border border-gray-700 text-xs font-semibold">
              <button
                type="button"
                onClick={() => useAuth().updateLanguage && useAuth().updateLanguage('English')}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  (user?.preferred_language || 'English') === 'English'
                    ? 'bg-accent text-white shadow-sm'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                🇬🇧 EN
              </button>
              <button
                type="button"
                onClick={() => useAuth().updateLanguage && useAuth().updateLanguage('Hindi')}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  user?.preferred_language === 'Hindi'
                    ? 'bg-accent text-white shadow-sm'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                🇮🇳 HI
              </button>
            </div>
          </div>
        )}

        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gray-800/50">
          <div className="w-8 h-8 rounded-full bg-accent/20 text-accent flex items-center justify-center font-bold">
            {user?.name?.charAt(0) || user?.username?.charAt(0) || '?'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{user?.name || user?.username}</p>
            <p className="text-xs text-gray-400 truncate">@{user?.username}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-gray-400 hover:text-error hover:bg-error/10 rounded-xl transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </div>
  );
}
