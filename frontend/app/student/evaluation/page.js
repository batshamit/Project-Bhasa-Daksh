'use client';
import { useState, useEffect, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { CheckCircle, XCircle, Award, ArrowRight, BrainCircuit, Sparkles, BookOpen } from 'lucide-react';
import Confetti from 'react-confetti';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

function EvaluationContent() {
  const { user, updateLanguage } = useAuth();
  const searchParams = useSearchParams();
  const queryModule = searchParams.get('module');

  const [availableModules, setAvailableModules] = useState([]);
  const [selectedModule, setSelectedModule] = useState('');
  const [language, setLanguage] = useState(user?.preferred_language || 'English');
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });

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
    setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    
    const fetchAvailable = async () => {
      if (!user?.username) return;
      try {
        const [enrolled, completed] = await Promise.all([
          api.getEnrolledCourses(user.username).catch(() => []),
          api.getCompleted(user.username).catch(() => [])
        ]);

        const completedSet = new Set((completed || []).map(m => (typeof m === 'string' ? m : m.module_id)));
        const unlockedList = [];

        const isHindiUser = user?.preferred_language && user.preferred_language.toLowerCase() !== 'english';
        
        for (let cIdx = 0; cIdx < (enrolled || []).length; cIdx++) {
          const course = enrolled[cIdx];
          const courseNo = `Course #${cIdx + 1}`;
          const mods = await api.getCourseModules(course.course_id).catch(() => []);
          let allModsCompleted = mods.length > 0;

          mods.forEach((mod, idx) => {
            const modId = mod.module_id || mod.id;
            const moduleNo = `Module #${idx + 1}`;
            const prevModId = idx > 0 ? (mods[idx - 1].module_id || mods[idx - 1].id) : null;
            const isUnlocked = (idx === 0) || (prevModId && completedSet.has(prevModId));
            const isCompleted = completedSet.has(modId);
            if (!isCompleted) allModsCompleted = false;

            const plsLevel = isHindiUser ? Math.min(4, idx + 1) : 4;
            const levelTag = plsLevel === 1 ? 'Phase 1: Hindi' : plsLevel === 2 ? 'Phase 2: Hinglish Mix' : plsLevel === 3 ? 'Phase 3: Bilingual English' : 'Phase 4: Full English';

            if (isUnlocked || isCompleted) {
              unlockedList.push({
                module_id: modId,
                title: `${courseNo} | ${moduleNo}: ${mod.title} [${levelTag}]`,
                course_title: course.title,
                isCompleted: isCompleted,
                plsLevel: plsLevel
              });
            }
          });

          // If all course modules are completed, unlock Final Full-English Course Exam
          if (allModsCompleted && mods.length > 0) {
            unlockedList.push({
              module_id: `final_${course.course_id}`,
              course_id: course.course_id,
              title: `🏆 ${courseNo} FINAL EXAM: 100% Full Business English (${course.title})`,
              course_title: course.title,
              isCompleted: completedSet.has(`final_${course.course_id}`),
              isFinal: true,
              plsLevel: 4
            });
          }
        }

        setAvailableModules(unlockedList);

        if (queryModule && unlockedList.some(m => m.module_id === queryModule)) {
          setSelectedModule(queryModule);
        } else if (unlockedList.length > 0) {
          setSelectedModule(unlockedList[0].module_id);
        }
      } catch (error) {
        console.error('Failed to fetch available modules for evaluation:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchAvailable();
  }, [user, queryModule]);

  useEffect(() => {
    if (selectedModule) {
      const fetchQuestions = async () => {
        setLoading(true);
        try {
          if (selectedModule.startsWith('final_')) {
            const courseId = selectedModule.replace('final_', '');
            const data = await api.getFinalEval(courseId);
            setQuestions(data.questions || []);
          } else {
            const data = await api.getMCQs(selectedModule);
            setQuestions(data || []);
          }
          setAnswers({});
          setResult(null);
        } catch (error) {
          console.error('Failed to fetch questions:', error);
        } finally {
          setLoading(false);
        }
      };
      fetchQuestions();
    } else {
      setQuestions([]);
    }
  }, [selectedModule]);

  const handleSubmit = async () => {
    if (Object.keys(answers).length < questions.length) {
      alert("Please answer all questions before submitting.");
      return;
    }
    setSubmitting(true);
    try {
      let res;
      if (selectedModule.startsWith('final_')) {
        const courseId = selectedModule.replace('final_', '');
        res = await api.submitFinalEval(courseId, { answers, language });
      } else {
        res = await api.submitEval(selectedModule, { answers, language });
      }
      setResult(res);
    } catch (error) {
      console.error('Failed to submit evaluation:', error);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading && !selectedModule) {
    return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-indigo-500"></div></div>;
  }

  const getPhaseColor = (phase) => {
    switch(phase) {
      case 'Phase 4': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50 shadow-[0_0_15px_rgba(234,179,8,0.2)]';
      case 'Phase 3': return 'bg-green-500/20 text-green-400 border-green-500/50 shadow-[0_0_15px_rgba(34,197,94,0.2)]';
      case 'Phase 2': return 'bg-blue-500/20 text-blue-400 border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.2)]';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/50 shadow-[0_0_15px_rgba(156,163,175,0.2)]';
    }
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-4xl mx-auto space-y-6 sm:space-y-8">
      {result && result.percentage >= 50 && <Confetti width={windowSize.width} height={windowSize.height} recycle={false} numberOfPieces={500} />}
      
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2 flex items-center gap-3">
          <BrainCircuit className="text-indigo-400 w-7 h-7 sm:w-8 sm:h-8 shrink-0" /> ✍️ Module Evaluation
        </h1>
        <p className="text-sm sm:text-base text-gray-400">Pass evaluations to unlock the next module in your course.</p>
      </motion.div>

      {!result && (
        <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-4 sm:p-6">
          <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-end">
            <div className="flex-1 w-full">
              <label className="block text-xs sm:text-sm font-medium text-gray-400 mb-2">Select Unlocked Module</label>
              <select 
                value={selectedModule} 
                onChange={(e) => setSelectedModule(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 sm:px-4 sm:py-3 text-white text-xs sm:text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              >
                {availableModules.length === 0 && <option value="">No unlocked modules available</option>}
                {availableModules.map(m => (
                  <option key={m.module_id} value={m.module_id}>
                    {m.title || m.module_id} ({m.course_title}) {m.isCompleted ? '✓ Completed' : '⚡ Unlocked'}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="w-full md:w-auto">
              <label className="block text-xs sm:text-sm font-medium text-gray-400 mb-2">Question Language</label>
              <div className="bg-gray-800 p-1 rounded-lg flex border border-gray-700">
                <button onClick={() => changeLanguage('English')} className={`flex-1 md:flex-initial px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition-all ${language === 'English' ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}>🇬🇧 English</button>
                <button onClick={() => changeLanguage('Hindi')} className={`flex-1 md:flex-initial px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition-all ${language === 'Hindi' || language === 'हिंदी' ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}>🇮🇳 हिंदी</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {loading && selectedModule && (
        <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-indigo-500"></div></div>
      )}

      {!loading && questions.length > 0 && !result && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          {questions.map((q, idx) => {
            const isEng = language === 'English';
            return (
              <motion.div key={q.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }} className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
                <h3 className="text-xl font-medium text-white mb-6 flex gap-3">
                  <span className="text-indigo-500 font-bold">{idx + 1}.</span> 
                  {isEng ? q.question : (q.question_hi || q.question)}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {['a', 'b', 'c', 'd'].map(opt => {
                    const optText = isEng ? q[`option_${opt}`] : (q[`option_${opt}_hi`] || q[`option_${opt}`]);
                    return (
                      <button
                        key={opt}
                        onClick={() => setAnswers(prev => ({ ...prev, [q.id]: opt }))}
                        className={`text-left p-4 rounded-xl border-2 transition-all ${
                          answers[q.id] === opt 
                            ? 'border-indigo-500 bg-indigo-500/10 shadow-[0_0_15px_rgba(99,102,241,0.15)]' 
                            : 'border-gray-700 bg-gray-800/50 hover:border-gray-500 hover:bg-gray-800'
                        }`}
                      >
                        <span className="font-bold text-gray-500 mr-2 uppercase">{opt}.</span>
                        <span className="text-gray-200">{optText}</span>
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            );
          })}
          
          <div className="flex justify-end pt-4">
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white px-8 py-3 rounded-lg font-medium transition-all shadow-lg shadow-indigo-500/25 flex items-center gap-2 text-lg disabled:opacity-50 cursor-pointer"
            >
              {submitting ? 'Evaluating...' : 'Submit Evaluation'} <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </motion.div>
      )}

      <AnimatePresence>
        {result && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-8">
            <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-2xl p-10 text-center relative overflow-hidden">
              <div className={`absolute top-0 left-0 w-full h-2 ${result.percentage >= 50 ? 'bg-gradient-to-r from-emerald-500 to-teal-500' : 'bg-gradient-to-r from-amber-500 to-red-500'}`}></div>
              
              <h2 className="text-3xl font-bold text-white mb-2">
                {result.is_final_exam ? '🏆 Final Course Comprehensive Exam Complete!' : 'Evaluation Complete!'}
              </h2>
              {result.is_final_exam && result.passed ? (
                <div className="bg-gradient-to-r from-purple-900/60 to-indigo-900/60 border border-purple-500/40 rounded-xl p-6 my-6 text-center shadow-[0_0_30px_rgba(168,85,247,0.2)]">
                  <Award className="w-12 h-12 text-yellow-400 mx-auto mb-2" />
                  <h3 className="text-2xl font-extrabold text-white mb-1">🎓 Official Course Mastery & Business English Certificate Earned!</h3>
                  <p className="text-purple-200 text-sm">
                    Congratulations! You have successfully transitioned through all Progressive Language Skilling (PLS) phases and passed the 100% Full English Final Exam!
                  </p>
                </div>
              ) : result.percentage >= 50 ? (
                <div className="inline-flex items-center gap-2 text-emerald-400 bg-emerald-500/10 px-4 py-1.5 rounded-full text-sm font-semibold mb-6 border border-emerald-500/20">
                  <Sparkles className="w-4 h-4" /> Passed! Next Module Unlocked in Course!
                </div>
              ) : (
                <div className="inline-flex items-center gap-2 text-amber-400 bg-amber-500/10 px-4 py-1.5 rounded-full text-sm font-semibold mb-6 border border-amber-500/20">
                  Keep trying to reach 50%+ and unlock the next module!
                </div>
              )}
              
              <div className="flex flex-col md:flex-row items-center justify-center gap-12 my-6">
                <div className="text-center">
                  <div className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400 mb-2">
                    {result.percentage}%
                  </div>
                  <p className="text-gray-400 font-medium">Score: {result.score} / {result.total}</p>
                </div>
                
                <div className="h-24 w-px bg-gray-800 hidden md:block"></div>
                
                <div className="text-center">
                  <p className="text-gray-400 font-medium mb-3">Achieved Level</p>
                  <span className={`px-6 py-2 rounded-full text-xl font-bold border flex items-center gap-2 ${getPhaseColor(result.phase)}`}>
                    <Award className="w-6 h-6" /> {result.phase}
                  </span>
                </div>
              </div>
              
              <div className="mt-8 flex justify-center gap-4">
                <button onClick={() => { setSelectedModule(''); setResult(null); }} className="px-5 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg font-medium transition-colors border border-gray-700">
                  Take another evaluation
                </button>
                <Link href="/student/lectures" className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-lg font-medium transition-all shadow-lg shadow-indigo-500/25 flex items-center gap-2">
                  <BookOpen className="w-4 h-4" /> Go to My Lectures
                </Link>
              </div>
            </div>

            <div className="space-y-6">
              <h3 className="text-xl font-bold text-white mb-4">Detailed Answer Breakdown</h3>
              {result.breakdown && result.breakdown.map((item, idx) => {
                const isCorrect = item.correct;
                const isEng = language === 'English';
                const qData = questions.find(q => q.id === item.questionId);
                
                return (
                  <div key={idx} className={`bg-gray-900/50 border rounded-xl p-6 ${isCorrect ? 'border-green-500/30' : 'border-red-500/30'}`}>
                    <div className="flex gap-4 items-start">
                      {isCorrect ? <CheckCircle className="text-green-500 w-6 h-6 shrink-0 mt-1" /> : <XCircle className="text-red-500 w-6 h-6 shrink-0 mt-1" />}
                      <div className="flex-1">
                        <p className="text-lg text-white mb-4">{item.question}</p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700">
                            <span className="text-xs text-gray-400 uppercase font-bold block mb-1">Your Answer</span>
                            <p className={`font-medium ${isCorrect ? 'text-green-400' : 'text-red-400'}`}>
                              Option {String(item.yourAnswer || '').toUpperCase()}: {item.yourAnswerText}
                            </p>
                          </div>
                          {!isCorrect && (
                            <div className="bg-gray-800/50 rounded-lg p-3 border border-green-500/30">
                              <span className="text-xs text-gray-400 uppercase font-bold block mb-1">Correct Answer</span>
                              <p className="font-medium text-green-400">
                                Option {String(item.correctAnswer || '').toUpperCase()}: {item.correctAnswerText}
                              </p>
                            </div>
                          )}
                        </div>
                        
                        <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-lg p-4 text-indigo-200/90 text-sm">
                          <span className="font-bold text-indigo-400 mb-1 block flex items-center gap-1">💡 Key Explanation:</span>
                          {item.explanation}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function EvaluationPage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-indigo-500"></div></div>}>
      <EvaluationContent />
    </Suspense>
  );
}
