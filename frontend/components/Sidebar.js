'use client';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, Menu, X, Globe } from 'lucide-react';
import { useAuth } from '@/lib/auth';

export default function Sidebar({ items, role }) {
  const pathname = usePathname();
  const { user, logout, updateLanguage } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <>
      {/* Mobile Top Header Bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-gray-900/90 backdrop-blur-xl border-b border-gray-800 flex items-center justify-between px-4 z-40">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-2 rounded-lg bg-gray-800 text-gray-300 hover:text-white border border-gray-700 focus:outline-none"
            aria-label="Toggle Navigation"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-accent to-accent-hover rounded-lg flex items-center justify-center text-sm font-bold shadow-md">
              🎓
            </div>
            <div>
              <span className="font-bold text-white text-base tracking-tight block leading-tight">Bhasha-Daksh</span>
              <span className="text-[10px] text-accent font-semibold uppercase tracking-wider block">{role} Panel</span>
            </div>
          </div>
        </div>

        {/* Mobile Language Pill & User Initial */}
        <div className="flex items-center gap-2">
          {role === 'student' && (
            <button
              onClick={() => updateLanguage && updateLanguage(user?.preferred_language === 'Hindi' ? 'English' : 'Hindi')}
              className="px-2.5 py-1 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-amber-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Globe className="w-3.5 h-3.5 text-accent" />
              {user?.preferred_language === 'Hindi' ? '🇮🇳 HI' : '🇬🇧 EN'}
            </button>
          )}
          <div className="w-8 h-8 rounded-full bg-accent/20 text-accent border border-accent/30 flex items-center justify-center font-bold text-xs">
            {user?.name?.charAt(0) || user?.username?.charAt(0) || '?'}
          </div>
        </div>
      </div>

      {/* Mobile Backdrop Overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMobileOpen(false)}
            className="md:hidden fixed inset-0 bg-black/70 backdrop-blur-sm z-40"
          />
        )}
      </AnimatePresence>

      {/* Main Sidebar Container (Desktop static + Mobile Slide Drawer) */}
      <div
        className={`w-[260px] h-screen fixed left-0 top-0 bg-gray-900/95 md:bg-gray-900/80 backdrop-blur-xl border-r border-gray-800 flex flex-col z-50 transition-transform duration-300 ease-in-out ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Header */}
        <div className="p-6 flex items-center justify-between border-b border-gray-800/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-accent to-accent-hover rounded-xl flex items-center justify-center text-xl shadow-lg shadow-accent/25">
              🎓
            </div>
            <div>
              <h1 className="font-bold text-white text-lg tracking-tight">Bhasha-Daksh</h1>
              <p className="text-xs text-accent font-medium uppercase tracking-wider">{role} Panel</p>
            </div>
          </div>
          <button
            onClick={() => setMobileOpen(false)}
            className="md:hidden p-1.5 rounded-lg text-gray-400 hover:text-white bg-gray-800/60"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          {items.map((item, index) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <motion.div
                key={item.href}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all relative group ${
                    isActive 
                      ? 'bg-accent/10 text-white font-semibold' 
                      : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
                  }`}
                >
                  {isActive && (
                    <motion.div 
                      layoutId="activeTab"
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-accent rounded-r-full" 
                    />
                  )}
                  <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-accent' : 'group-hover:text-gray-300'}`} />
                  <span className="font-medium text-sm truncate">{item.label}</span>
                </Link>
              </motion.div>
            );
          })}
        </nav>

        {/* Bottom User & Language Bar */}
        <div className="p-4 border-t border-gray-800 bg-gray-900/50 space-y-3">
          {role === 'student' && (
            <div className="px-3 py-2 bg-gray-800/80 rounded-xl border border-gray-700/60 flex items-center justify-between">
              <span className="text-xs text-gray-300 font-medium flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-accent" /> Preferred Lang
              </span>
              <div className="flex bg-gray-900 p-0.5 rounded-lg border border-gray-700 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => updateLanguage && updateLanguage('English')}
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
                  onClick={() => updateLanguage && updateLanguage('Hindi')}
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

          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-gray-800/50">
            <div className="w-8 h-8 rounded-full bg-accent/20 text-accent flex items-center justify-center font-bold shrink-0">
              {user?.name?.charAt(0) || user?.username?.charAt(0) || '?'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user?.name || user?.username}</p>
              <p className="text-xs text-gray-400 truncate">@{user?.username}</p>
            </div>
          </div>

          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-colors"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            Sign Out
          </button>
        </div>
      </div>
    </>
  );
}
