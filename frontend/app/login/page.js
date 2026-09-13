'use client';
import { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const { login, register } = useAuth();
  
  const [formData, setFormData] = useState({ username: '', password: '', name: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (isLogin) {
        await login(formData.username, formData.password);
      } else {
        if (formData.password !== formData.confirmPassword) {
          throw new Error('Passwords do not match');
        }
        await register(formData.username, formData.password, formData.name);
        setSuccess('Registration successful! Please login.');
        setIsLogin(true);
      }
    } catch (err) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const inputVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center relative overflow-hidden p-4">
      {/* Background gradients */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-accent/20 blur-[100px]" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-accent-hover/20 blur-[100px]" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="bg-bg-card/50 backdrop-blur-xl border border-gray-800 rounded-3xl p-8 shadow-2xl relative z-10">
          <div className="text-center mb-8">
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.1 }}
              className="w-16 h-16 bg-gradient-to-br from-accent to-accent-hover rounded-2xl mx-auto flex items-center justify-center text-3xl shadow-lg shadow-accent/25 mb-4"
            >
              🎓
            </motion.div>
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400 mb-2">
              Bhasha-Daksh
            </h1>
            <p className="text-gray-400 text-sm">AI-Driven Skilling Ecosystem</p>
          </div>

          <div className="flex p-1 bg-gray-900/50 rounded-xl mb-8 relative">
            <div 
              className={`absolute inset-y-1 w-[calc(50%-4px)] bg-bg-card border border-gray-700 rounded-lg shadow-sm transition-all duration-300 ease-out ${isLogin ? 'left-1' : 'left-[calc(50%+3px)]'}`}
            />
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-2.5 text-sm font-medium z-10 transition-colors ${isLogin ? 'text-white' : 'text-gray-400 hover:text-white'}`}
            >
              Login
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-2.5 text-sm font-medium z-10 transition-colors ${!isLogin ? 'text-white' : 'text-gray-400 hover:text-white'}`}
            >
              Register
            </button>
          </div>

          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-6"
              >
                <div className="bg-error/10 border border-error/20 text-error px-4 py-3 rounded-xl flex items-center gap-3 text-sm">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <p>{error}</p>
                </div>
              </motion.div>
            )}
            
            {success && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-6"
              >
                <div className="bg-success/10 border border-success/20 text-success px-4 py-3 rounded-xl flex items-center gap-3 text-sm">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <p>{success}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="space-y-4">
            <AnimatePresence mode="popLayout">
              {!isLogin && (
                <motion.div
                  variants={inputVariants}
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                  className="space-y-1.5"
                >
                  <label className="text-sm font-medium text-gray-300 px-1">Full Name</label>
                  <input
                    type="text"
                    required={!isLogin}
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full bg-gray-900/50 border border-gray-800 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all"
                    placeholder="John Doe"
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <motion.div variants={inputVariants} initial="hidden" animate="visible" className="space-y-1.5">
              <label className="text-sm font-medium text-gray-300 px-1">Username</label>
              <input
                type="text"
                required
                value={formData.username}
                onChange={(e) => setFormData({...formData, username: e.target.value})}
                className="w-full bg-gray-900/50 border border-gray-800 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all"
                placeholder="Enter your username"
              />
            </motion.div>

            <motion.div variants={inputVariants} initial="hidden" animate="visible" className="space-y-1.5">
              <label className="text-sm font-medium text-gray-300 px-1">Password</label>
              <input
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                className="w-full bg-gray-900/50 border border-gray-800 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all"
                placeholder="••••••••"
              />
            </motion.div>

            <AnimatePresence mode="popLayout">
              {!isLogin && (
                <motion.div
                  variants={inputVariants}
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                  className="space-y-1.5"
                >
                  <label className="text-sm font-medium text-gray-300 px-1">Confirm Password</label>
                  <input
                    type="password"
                    required={!isLogin}
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                    className="w-full bg-gray-900/50 border border-gray-800 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all"
                    placeholder="••••••••"
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-accent to-accent-hover text-white font-medium py-3.5 rounded-xl shadow-lg shadow-accent/25 hover:shadow-accent/40 transition-all flex items-center justify-center gap-2 mt-6 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                isLogin ? 'Sign In' : 'Create Account'
              )}
            </motion.button>
          </form>

          {isLogin && (
            <div className="mt-6 pt-6 border-t border-gray-800">
              <p className="text-xs text-center text-gray-400 mb-3">Quick Demo Logins:</p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={async () => {
                    setLoading(true);
                    setError(null);
                    try {
                      await login('admin', 'admin123');
                    } catch (err) {
                      setError(err.message || 'Login failed');
                    } finally {
                      setLoading(false);
                    }
                  }}
                  className="flex-1 py-2 px-3 bg-gray-800/80 hover:bg-gray-700 text-xs font-medium text-purple-300 rounded-lg border border-purple-500/20 transition-all text-center"
                >
                  ⚡ Admin Demo
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    setLoading(true);
                    setError(null);
                    try {
                      await login('student1', 'pass123');
                    } catch (err) {
                      setError(err.message || 'Login failed');
                    } finally {
                      setLoading(false);
                    }
                  }}
                  className="flex-1 py-2 px-3 bg-gray-800/80 hover:bg-gray-700 text-xs font-medium text-blue-300 rounded-lg border border-blue-500/20 transition-all text-center"
                >
                  ⚡ Student Demo
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
