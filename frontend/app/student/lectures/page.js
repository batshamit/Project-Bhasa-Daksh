'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { BookOpen, CheckCircle, ChevronDown, ChevronUp, Check, Lock, ArrowRight, Sparkles, Languages } from 'lucide-react';
import Link from 'next/link';

export default function MyLectures() {
  const { user, updateLanguage } = useAuth();
  const [courses, setCourses] = useState([]);
  const [completedModules, setCompletedModules] = useState(new Set());
  const [modulesByCourse, setModulesByCourse] = useState({});
  const [expandedModule, setExpandedModule] = useState(null);
  const [language, setLanguage] = useState('English');
  const [selectedPhase, setSelectedPhase] = useState('auto');
  const [userMaxPhase, setUserMaxPhase] = useState(1);
  const [courseLanguages, setCourseLanguages] = useState({});
  const [selectedModalCourse, setSelectedModalCourse] = useState(null);
  const [modalLang, setModalLang] = useState('Hindi');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.preferred_language) {
      setLanguage(user.preferred_language);
    }
  }, [user?.preferred_language]);

  const changeLanguage = (lang) => {
    setLanguage(lang);
    if (updateLanguage) updateLanguage(lang);
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.username) return;
      try {
        const [enrolled, completed, bestScores] = await Promise.all([
          api.getEnrolledCourses(user.username).catch(() => []),
          api.getCompleted(user.username).catch(() => []),
          api.getBestScores(user.username).catch(() => [])
        ]);
        
        setCourses(enrolled || []);
        setCompletedModules(new Set((completed || []).map(m => (typeof m === 'string' ? m : m.module_id))));

        if (Array.isArray(bestScores) && bestScores.length > 0) {
          const maxP = Math.max(...bestScores.map(s => s.pls_phase || parseInt(String(s.phase || '1').replace('Phase ', '') || 1)));
          setUserMaxPhase(maxP || 1);
        }

        const modulesData = {};
        const langMap = {};
        for (const course of enrolled || []) {
          const mods = await api.getCourseModules(course.course_id).catch(() => []);
          modulesData[course.course_id] = mods || [];
          
          const prefRes = await api.getCourseLanguage(course.course_id).catch(() => ({ language: 'Hindi' }));
          langMap[course.course_id] = prefRes.language || 'Hindi';
        }
        setModulesByCourse(modulesData);
        setCourseLanguages(langMap);
      } catch (error) {
        console.error('Failed to fetch lectures:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  const handleSaveCourseLanguage = async () => {
    if (!selectedModalCourse) return;
    try {
      const courseId = selectedModalCourse.course_id;
      await api.setCourseLanguage(courseId, modalLang);
      setCourseLanguages(prev => ({ ...prev, [courseId]: modalLang }));
      setLanguage(modalLang);
      if (updateLanguage) updateLanguage(modalLang);
      
      const courseMods = modulesByCourse[courseId] || [];
      if (courseMods.length > 0) {
        const firstModId = courseMods[0].module_id || courseMods[0].id;
        setExpandedModule(firstModId);
      }

      setSelectedModalCourse(null);
    } catch (err) {
      console.error('Failed to set course language preference:', err);
      alert('Failed to update course language preference. Please try again.');
    }
  };

  const handleMarkComplete = async (moduleId) => {
    try {
      await api.markComplete({ module_id: moduleId });
      setCompletedModules(prev => new Set([...prev, moduleId]));
    } catch (error) {
      console.error('Failed to mark complete:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-indigo-500"></div>
      </div>
    );
  }

  const getPhaseTitle = (phaseNum) => {
    switch (String(phaseNum)) {
      case '1': return 'Phase 1: 100% Hindi (English Terms in Brackets)';
      case '2': return 'Phase 2: Hinglish Mix (Sentence Transition)';
      case '3': return 'Phase 3: English (with Hindi Glosses)';
      case '4': return 'Phase 4: Full Professional English';
      default: return `Phase ${phaseNum}`;
    }
  };

  const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
  const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
              <BookOpen className="text-indigo-400 w-8 h-8" /> 📥 My Lectures
            </h1>
            <p className="text-gray-400">Progressive Language Skilling: Gradually transition from Hindi to Professional English.</p>
          </div>

          <div className="bg-gray-900/80 border border-indigo-500/30 rounded-xl p-3 flex items-center gap-3 shadow-[0_0_15px_rgba(99,102,241,0.15)]">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <div>
              <p className="text-xs text-gray-400 font-medium">Active PLS Level</p>
              <p className="text-sm font-bold text-indigo-300">
                Phase {userMaxPhase}: {userMaxPhase === 1 ? 'Hindi + Keywords' : userMaxPhase === 2 ? 'Hinglish' : userMaxPhase === 3 ? 'English + Glosses' : 'Full English'}
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div variants={container} initial="hidden" animate="show" className="space-y-8">
        {courses.map((course, cIdx) => {
          const courseModules = modulesByCourse[course.course_id] || [];
          const completedCount = courseModules.filter(m => completedModules.has(m.module_id || m.id)).length;
          const progress = courseModules.length > 0 ? (completedCount / courseModules.length) * 100 : 0;
          const courseLang = courseLanguages[course.course_id] || user?.preferred_language || 'Hindi';
          const isHindiCourse = courseLang.toLowerCase() !== 'english';
          const courseDisplayNo = `Course #${cIdx + 1}`;

          return (
            <motion.div key={course.course_id} variants={item} className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6">
              <div className="mb-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 mb-2">
                  <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                    <span className="px-3 py-1 rounded-lg text-xs font-extrabold bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 uppercase tracking-wide">
                      {courseDisplayNo}
                    </span>
                    {course.title}
                  </h2>
                  
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold border flex items-center gap-1.5 ${isHindiCourse ? 'bg-amber-500/10 text-amber-300 border-amber-500/30' : 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30'}`}>
                      {isHindiCourse ? '🇮🇳 Progressive Hindi → English PLS' : '🇬🇧 Full English Immersion'}
                    </span>
                    <button
                      onClick={() => { setSelectedModalCourse(course); setModalLang(courseLang); }}
                      className="px-3 py-1 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs rounded-full border border-gray-700 transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <Languages className="w-3.5 h-3.5 text-indigo-400" /> Choose Language
                    </button>
                  </div>
                </div>

                <p className="text-gray-400 mb-4">{course.description}</p>
                <div className="w-full bg-gray-800 rounded-full h-2 mb-2">
                  <div className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2 rounded-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
                </div>
                <p className="text-xs text-gray-400 text-right">{completedCount} / {courseModules.length} Modules Unlocked / Completed</p>
              </div>

              <div className="space-y-4">
                {courseModules.map((module, idx) => {
                  const modId = module.module_id || module.id;
                  const isCompleted = completedModules.has(modId);
                  
                  const prevModId = idx > 0 ? (courseModules[idx - 1].module_id || courseModules[idx - 1].id) : null;
                  const isUnlocked = idx === 0 || (prevModId && completedModules.has(prevModId));
                  const isExpanded = expandedModule === modId && isUnlocked;

                  const defaultModulePhase = isHindiCourse ? Math.min(4, idx + 1) : 4;
                  const activeDisplayPhase = selectedPhase === 'auto' ? String(defaultModulePhase) : selectedPhase;
                  const moduleDisplayNo = `Module #${idx + 1}`;
                  const phaseNotesObj = typeof module.phase_notes === 'string' ? JSON.parse(module.phase_notes || '{}') : (module.phase_notes || {});

                  return (
                    <div 
                      key={modId} 
                      className={`rounded-xl border transition-all ${
                        !isUnlocked 
                          ? 'bg-gray-900/20 border-gray-800/40 opacity-60' 
                          : isCompleted 
                            ? 'bg-gray-800/30 border-green-500/20' 
                            : 'bg-gray-800/40 border-gray-700/60 hover:border-indigo-500/50'
                      }`}
                    >
                      <div 
                        className={`p-4 flex items-center justify-between ${isUnlocked ? 'cursor-pointer hover:bg-gray-800/50' : 'cursor-not-allowed'}`}
                        onClick={() => {
                          if (isUnlocked) {
                            setExpandedModule(isExpanded ? null : modId);
                          }
                        }}
                      >
                        <div className="flex items-center gap-3">
                          {!isUnlocked ? (
                            <div className="p-1 bg-gray-800/80 rounded-md">
                              <Lock className="text-gray-500 w-5 h-5" />
                            </div>
                          ) : isCompleted ? (
                            <CheckCircle className="text-green-400 w-5 h-5" />
                          ) : (
                            <div className="w-5 h-5 rounded-full border-2 border-indigo-400/80 bg-indigo-500/10" />
                          )}
                          <div>
                            <h3 className={`text-lg font-medium ${isUnlocked ? 'text-white' : 'text-gray-400'} flex items-center gap-2.5`}>
                              <span className="px-2.5 py-0.5 rounded text-xs font-bold bg-gray-800 text-indigo-300 border border-gray-700 shrink-0">
                                {moduleDisplayNo}
                              </span>
                              {module.title}
                            </h3>
                            {!isUnlocked ? (
                              <p className="text-xs text-gray-500 mt-1">
                                🔒 Locked — Complete & pass evaluation for {courseModules[idx - 1]?.title || 'previous module'} to unlock
                              </p>
                            ) : (
                              <p className="text-xs text-indigo-400 font-medium mt-1">
                                ⚡ {moduleDisplayNo} Step {idx + 1}: Progressive PLS Level {defaultModulePhase} ({defaultModulePhase === 1 ? '100% Hindi' : defaultModulePhase === 2 ? 'Hinglish Mix' : defaultModulePhase === 3 ? 'Bilingual English' : 'Full English'})
                              </p>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4">
                          {!isUnlocked ? (
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-800 text-gray-500 border border-gray-700">
                              Locked
                            </span>
                          ) : isCompleted ? (
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-500/20 text-green-400 border border-green-500/30 flex items-center gap-1">
                              <Check className="w-3 h-3" /> Completed & Passed
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                              Unlocked (Phase {defaultModulePhase})
                            </span>
                          )}

                          {isUnlocked && (
                            isExpanded ? <ChevronUp className="text-gray-400" /> : <ChevronDown className="text-gray-400" />
                          )}
                        </div>
                      </div>

                      <AnimatePresence>
                        {isExpanded && isUnlocked && (
                          <motion.div 
                            initial={{ height: 0, opacity: 0 }} 
                            animate={{ height: 'auto', opacity: 1 }} 
                            exit={{ height: 0, opacity: 0 }}
                            className="border-t border-gray-700/50"
                          >
                            <div className="p-6 space-y-6">
                              {/* PLS & Language Mode Selector */}
                              <div className="bg-gray-800/80 p-3 rounded-xl border border-gray-700 space-y-3">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-semibold text-gray-300 flex items-center gap-1.5 uppercase tracking-wider">
                                    <Languages className="w-4 h-4 text-indigo-400" /> Progressive Language Skilling (PLS) Modes:
                                  </span>
                                  <span className="text-xs text-amber-300 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20 font-medium">
                                    Active View: {getPhaseTitle(activeDisplayPhase)}
                                  </span>
                                </div>

                                <div className="flex flex-wrap gap-2">
                                  <button
                                    onClick={() => setSelectedPhase('auto')}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${selectedPhase === 'auto' ? 'bg-amber-500 text-gray-950 font-bold shadow-md' : 'bg-gray-900 text-gray-300 hover:bg-gray-700'}`}
                                  >
                                    ✨ Default Level for Mod {idx + 1} (Phase {defaultModulePhase})
                                  </button>
                                  <button
                                    onClick={() => setSelectedPhase('1')}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${selectedPhase === '1' ? 'bg-indigo-600 text-white shadow-md' : 'bg-gray-900 text-gray-300 hover:bg-gray-700'}`}
                                  >
                                    Phase 1 (100% Hindi)
                                  </button>
                                  <button
                                    onClick={() => setSelectedPhase('2')}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${selectedPhase === '2' ? 'bg-indigo-600 text-white shadow-md' : 'bg-gray-900 text-gray-300 hover:bg-gray-700'}`}
                                  >
                                    Phase 2 (Hinglish Mix)
                                  </button>
                                  <button
                                    onClick={() => setSelectedPhase('3')}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${selectedPhase === '3' ? 'bg-indigo-600 text-white shadow-md' : 'bg-gray-900 text-gray-300 hover:bg-gray-700'}`}
                                  >
                                    Phase 3 (Bilingual English)
                                  </button>
                                  <button
                                    onClick={() => setSelectedPhase('4')}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${selectedPhase === '4' ? 'bg-indigo-600 text-white shadow-md' : 'bg-gray-900 text-gray-300 hover:bg-gray-700'}`}
                                  >
                                    Phase 4 (Full English)
                                  </button>
                                </div>
                              </div>

                              {/* Content */}
                              <div className="prose prose-invert max-w-none">
                                <div className="text-gray-300 leading-relaxed space-y-4 text-base">
                                  {((activeDisplayPhase === '4' || activeDisplayPhase === '3') ? (module.english || module.hindi) : (module.hindi || module.english))?.split('\n').map((paragraph, pIdx) => (
                                    <p key={pIdx}>{paragraph}</p>
                                  ))}
                                </div>
                              </div>

                              {/* Progressive Language Skilling Notes */}
                              <div className="bg-gray-900/70 rounded-xl p-5 border border-indigo-500/30">
                                <h4 className="text-white font-bold mb-3 flex items-center justify-between">
                                  <span className="flex items-center gap-2">
                                    <BookOpen className="w-4 h-4 text-indigo-400" /> Key Notes ({getPhaseTitle(activeDisplayPhase)})
                                  </span>
                                </h4>
                                
                                <ul className="list-disc list-inside text-gray-300 space-y-2.5 text-sm leading-relaxed">
                                  {(phaseNotesObj[activeDisplayPhase] || (language === 'English' ? module.notes_en : module.notes_hi))?.split('\n').map((note, nIdx) => (
                                    note.trim() && <li key={nIdx} className="hover:text-white transition-colors">{note.replace(/^[-\*]\s*/, '')}</li>
                                  ))}
                                </ul>
                              </div>

                              {/* Action Buttons */}
                              <div className="flex flex-wrap items-center justify-between pt-4 border-t border-gray-800 gap-4">
                                {!isCompleted && (
                                  <button 
                                    onClick={() => handleMarkComplete(modId)}
                                    className="bg-gray-800 hover:bg-gray-700 text-gray-200 px-5 py-2.5 rounded-lg text-sm font-medium transition-all border border-gray-700 flex items-center gap-2"
                                  >
                                    <Check className="w-4 h-4 text-green-400" /> Mark as Read
                                  </button>
                                )}

                                <Link 
                                  href={`/student/evaluation?module=${modId}`}
                                  className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white px-6 py-2.5 rounded-lg font-medium transition-all shadow-lg shadow-indigo-500/25 flex items-center gap-2 text-sm ml-auto"
                                >
                                  Take Evaluation Test ✍️ <ArrowRight className="w-4 h-4" />
                                </Link>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          );
        })}
        {courses.length === 0 && (
           <div className="text-center py-12 bg-gray-900/50 rounded-xl border border-gray-800 text-gray-400">
             You are not enrolled in any courses yet.
           </div>
        )}
      </motion.div>

      {/* Course Starting Language Selection Modal */}
      <AnimatePresence>
        {selectedModalCourse && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-gray-900 border border-indigo-500/30 rounded-2xl p-8 max-w-2xl w-full space-y-6 shadow-[0_0_40px_rgba(99,102,241,0.2)]">
              <div>
                <div className="inline-flex items-center gap-2 text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-full text-xs font-semibold mb-3 border border-indigo-500/20">
                  <Languages className="w-4 h-4" /> Course Starting Language Selection
                </div>
                <h2 className="text-2xl font-bold text-white mb-1">Choose Preferred Language Before Starting</h2>
                <p className="text-gray-400 text-sm">Course: <span className="text-indigo-300 font-semibold">{selectedModalCourse.title}</span></p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div 
                  onClick={() => setModalLang('Hindi')}
                  className={`p-5 rounded-xl border-2 cursor-pointer transition-all ${modalLang === 'Hindi' || modalLang === 'हिंदी' ? 'border-indigo-500 bg-indigo-500/10 shadow-[0_0_20px_rgba(99,102,241,0.2)]' : 'border-gray-800 bg-gray-800/40 hover:border-gray-700'}`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">🇮🇳</span>
                    <h3 className="font-bold text-white text-lg">Hindi Starter (PLS Pathway)</h3>
                  </div>
                  <p className="text-xs text-gray-300 mb-4 leading-relaxed">
                    Start Module 1 in 100% Hindi. As you complete modules & evaluations, English is gradually introduced step-by-step!
                  </p>
                  <ul className="text-[11px] text-indigo-200/80 space-y-1 bg-gray-900/60 p-3 rounded-lg border border-indigo-500/20">
                    <li>• Mod 1: Phase 1 (100% Hindi + Keywords)</li>
                    <li>• Mod 2: Phase 2 (Hinglish Mix 25% Eng)</li>
                    <li>• Mod 3: Phase 3 (Bilingual 75% Eng)</li>
                    <li>• Final: 100% Full English Exam & Certificate</li>
                  </ul>
                </div>

                <div 
                  onClick={() => setModalLang('English')}
                  className={`p-5 rounded-xl border-2 cursor-pointer transition-all ${modalLang === 'English' ? 'border-purple-500 bg-purple-500/10 shadow-[0_0_20px_rgba(168,85,247,0.2)]' : 'border-gray-800 bg-gray-800/40 hover:border-gray-700'}`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">🇬🇧</span>
                    <h3 className="font-bold text-white text-lg">English Direct Immersion</h3>
                  </div>
                  <p className="text-xs text-gray-300 mb-4 leading-relaxed">
                    For students ready for direct English instruction. All lectures, notes, and evaluations will be in 100% English.
                  </p>
                  <ul className="text-[11px] text-purple-200/80 space-y-1 bg-gray-900/60 p-3 rounded-lg border border-purple-500/20">
                    <li>• Mod 1: 100% Full English</li>
                    <li>• Mod 2: 100% Full English</li>
                    <li>• Mod 3: 100% Full English</li>
                    <li>• Final: Full Business English Exam</li>
                  </ul>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-800">
                <button onClick={() => setSelectedModalCourse(null)} className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-sm font-medium border border-gray-700">
                  Cancel
                </button>
                <button onClick={handleSaveCourseLanguage} className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-lg text-sm font-medium shadow-lg shadow-indigo-500/25 flex items-center gap-2 cursor-pointer">
                  Confirm & Begin Course 🚀
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
