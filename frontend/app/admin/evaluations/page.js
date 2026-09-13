'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/lib/api';
import { Edit, Trash2, Plus, Save, Activity, X, Check, BookOpen } from 'lucide-react';

export default function EvaluationEditor() {
  const [coursesWithModules, setCoursesWithModules] = useState([]);
  const [selectedModule, setSelectedModule] = useState('');
  const [mcqs, setMcqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingMcq, setEditingMcq] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [message, setMessage] = useState(null);

  const [newMcq, setNewMcq] = useState({
    question: '',
    question_hi: '',
    option_a: '',
    option_a_hi: '',
    option_b: '',
    option_b_hi: '',
    option_c: '',
    option_c_hi: '',
    option_d: '',
    option_d_hi: '',
    correct: 'a',
    explanation: '',
    explanation_hi: ''
  });

  useEffect(() => {
    async function init() {
      try {
        const courses = await api.getCourses().catch(() => []);
        const optionsList = [];

        for (let cIdx = 0; cIdx < courses.length; cIdx++) {
          const course = courses[cIdx];
          const courseNo = `Course #${cIdx + 1}`;
          const mods = await api.getCourseModules(course.course_id).catch(() => []);

          mods.forEach((mod, mIdx) => {
            const modId = mod.module_id || mod.id;
            const moduleNo = `Module #${mIdx + 1}`;
            optionsList.push({
              module_id: modId,
              label: `${courseNo} | ${moduleNo}: ${mod.title} (${modId})`
            });
          });
        }

        setCoursesWithModules(optionsList);
        if (optionsList.length > 0) setSelectedModule(optionsList[0].module_id);
      } catch (error) {
        console.error('Error initializing evaluation editor:', error);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  const fetchMcqs = async (modId) => {
    if (!modId) return;
    try {
      const data = await api.getMCQs(modId);
      setMcqs(data || []);
    } catch (err) {
      console.error('Failed to fetch MCQs:', err);
    }
  };

  useEffect(() => {
    if (selectedModule) {
      fetchMcqs(selectedModule);
    }
  }, [selectedModule]);

  const handleUpdateMcq = async (e) => {
    e.preventDefault();
    if (!editingMcq) return;
    try {
      await api.updateMCQ(editingMcq.id, editingMcq);
      setMessage({ type: 'success', text: 'MCQ question updated & synced with database!' });
      setEditingMcq(null);
      fetchMcqs(selectedModule);
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to update MCQ question.' });
    }
    setTimeout(() => setMessage(null), 3500);
  };

  const handleDeleteMcq = async (id) => {
    if (!confirm('Are you sure you want to delete this MCQ?')) return;
    try {
      await api.deleteMCQ(id);
      setMessage({ type: 'success', text: 'MCQ question deleted successfully.' });
      fetchMcqs(selectedModule);
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to delete MCQ question.' });
    }
    setTimeout(() => setMessage(null), 3500);
  };

  const handleAddMcq = async (e) => {
    e.preventDefault();
    try {
      await api.addMCQ({
        module_id: selectedModule,
        ...newMcq
      });
      setMessage({ type: 'success', text: 'New MCQ question created & synced!' });
      setShowAdd(false);
      setNewMcq({
        question: '', question_hi: '', option_a: '', option_a_hi: '',
        option_b: '', option_b_hi: '', option_c: '', option_c_hi: '',
        option_d: '', option_d_hi: '', correct: 'a', explanation: '', explanation_hi: ''
      });
      fetchMcqs(selectedModule);
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to add MCQ question.' });
    }
    setTimeout(() => setMessage(null), 3500);
  };

  if (loading) return <div className="flex items-center justify-center h-screen text-indigo-400">Loading Evaluations...</div>;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="p-8 space-y-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white flex items-center gap-3"><Activity className="text-indigo-400"/> Evaluation Editor</h1>
      </div>

      {message && (
        <div className={`p-4 rounded-lg flex items-center gap-3 ${message.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
          <Check className="w-5 h-5" /> {message.text}
        </div>
      )}

      <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6">
        <label className="text-sm font-medium text-gray-300 mb-2 block">Select Course & Module</label>
        <select 
          value={selectedModule} 
          onChange={e => setSelectedModule(e.target.value)}
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none font-medium"
        >
          {coursesWithModules.map(m => (
            <option key={m.module_id} value={m.module_id}>{m.label}</option>
          ))}
        </select>
      </div>

      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-white">Evaluation Questions ({mcqs.length})</h2>
          <button 
            onClick={() => setShowAdd(true)} 
            className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white px-5 py-2.5 rounded-lg font-medium transition-all shadow-lg flex items-center gap-2 text-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Add Question to {selectedModule}
          </button>
        </div>
        
        {mcqs.map((mcq, idx) => (
          <div key={mcq.id} className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6 transition-all hover:border-gray-700 space-y-4">
            {editingMcq && editingMcq.id === mcq.id ? (
              <form onSubmit={handleUpdateMcq} className="space-y-6">
                <div className="flex justify-between items-center border-b border-gray-800 pb-3">
                  <h3 className="text-lg font-bold text-indigo-400">Edit Question #{idx + 1} (Synced with DB)</h3>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setEditingMcq(null)} className="bg-gray-800 text-gray-300 hover:text-white px-3 py-1.5 rounded-lg text-sm">Cancel</button>
                    <button type="submit" className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1.5"><Save className="w-4 h-4" /> Save Changes</button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-2 block">English Question</label>
                    <textarea 
                      required 
                      value={editingMcq.question} 
                      onChange={e => setEditingMcq({ ...editingMcq, question: e.target.value })}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-2 block">Hindi Question (हिंदी)</label>
                    <textarea 
                      value={editingMcq.question_hi || ''} 
                      onChange={e => setEditingMcq({ ...editingMcq, question_hi: e.target.value })}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white text-sm outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-800/30 p-4 rounded-xl border border-gray-700/50">
                  {['a', 'b', 'c', 'd'].map(opt => (
                    <div key={opt} className="space-y-2">
                      <label className="text-xs font-bold text-gray-300 uppercase">Option {opt.toUpperCase()}</label>
                      <input 
                        required 
                        value={editingMcq[`option_${opt}`] || ''} 
                        onChange={e => setEditingMcq({ ...editingMcq, [`option_${opt}`]: e.target.value })}
                        placeholder={`English Option ${opt.toUpperCase()}`}
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm outline-none"
                      />
                      <input 
                        value={editingMcq[`option_${opt}_hi`] || ''} 
                        onChange={e => setEditingMcq({ ...editingMcq, [`option_${opt}_hi`]: e.target.value })}
                        placeholder={`Hindi Option ${opt.toUpperCase()}`}
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-amber-200 text-sm outline-none"
                      />
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-2 block">Correct Option</label>
                    <select 
                      value={editingMcq.correct} 
                      onChange={e => setEditingMcq({ ...editingMcq, correct: e.target.value })}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm outline-none font-bold"
                    >
                      <option value="a">Option A</option>
                      <option value="b">Option B</option>
                      <option value="c">Option C</option>
                      <option value="d">Option D</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">English Explanation</label>
                    <input 
                      value={editingMcq.explanation || ''} 
                      onChange={e => setEditingMcq({ ...editingMcq, explanation: e.target.value })}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-2 block">Hindi Explanation</label>
                    <input 
                      value={editingMcq.explanation_hi || ''} 
                      onChange={e => setEditingMcq({ ...editingMcq, explanation_hi: e.target.value })}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-amber-200 text-sm outline-none"
                    />
                  </div>
                </div>
              </form>
            ) : (
              <div>
                <div className="flex justify-between items-start mb-4">
                  <span className="px-3 py-1 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-bold rounded-lg">
                    Question #{idx + 1} (ID: {mcq.id})
                  </span>
                  <div className="flex gap-2">
                    <button onClick={() => setEditingMcq(mcq)} className="bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 p-2 rounded-lg transition-colors" title="Edit Question">
                      <Edit className="w-4 h-4"/>
                    </button>
                    <button onClick={() => handleDeleteMcq(mcq.id)} className="bg-red-600/20 text-red-400 hover:bg-red-600/30 p-2 rounded-lg transition-colors" title="Delete Question">
                      <Trash2 className="w-4 h-4"/>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-t border-gray-800 pt-4">
                  <div>
                    <h4 className="text-xs font-bold text-indigo-400 mb-2 uppercase tracking-wider">🇬🇧 English Version</h4>
                    <p className="text-base text-white font-medium mb-3">{mcq.question}</p>
                    <div className="space-y-2">
                      {['a', 'b', 'c', 'd'].map(opt => (
                        <div key={opt} className={`p-2.5 rounded-lg text-xs border ${String(mcq.correct).toLowerCase() === opt || String(mcq.correct).toLowerCase() === String(mcq[`option_${opt}`]).toLowerCase() ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300 font-bold' : 'bg-gray-800/30 border-gray-700/50 text-gray-300'}`}>
                          <span className="uppercase font-bold mr-2">{opt}.</span> {mcq[`option_${opt}`]}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-amber-400 mb-2 uppercase tracking-wider">🇮🇳 Hindi Version (हिंदी)</h4>
                    <p className="text-base text-amber-100 font-medium mb-3">{mcq.question_hi || mcq.question}</p>
                    <div className="space-y-2">
                      {['a', 'b', 'c', 'd'].map(opt => (
                        <div key={opt} className={`p-2.5 rounded-lg text-xs border ${String(mcq.correct).toLowerCase() === opt || String(mcq.correct).toLowerCase() === String(mcq[`option_${opt}`]).toLowerCase() ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300 font-bold' : 'bg-gray-800/30 border-gray-700/50 text-amber-200'}`}>
                          <span className="uppercase font-bold mr-2">{opt}.</span> {mcq[`option_${opt}_hi`] || mcq[`option_${opt}`]}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}

        {showAdd && (
          <form onSubmit={handleAddMcq} className="bg-gray-900/50 backdrop-blur-sm border border-indigo-500/30 rounded-xl p-6 space-y-6">
            <div className="flex justify-between items-center border-b border-gray-800 pb-3">
              <h3 className="text-xl font-bold text-white">Create New MCQ Question for {selectedModule}</h3>
              <button type="button" onClick={() => setShowAdd(false)} className="text-gray-400 hover:text-white"><X className="w-5 h-5"/></button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-2 block">English Question</label>
                <textarea required value={newMcq.question} onChange={e => setNewMcq({ ...newMcq, question: e.target.value })} className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white text-sm outline-none" placeholder="Enter English question text..." />
              </div>
              <div>
                <label className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-2 block">Hindi Question (हिंदी)</label>
                <textarea value={newMcq.question_hi} onChange={e => setNewMcq({ ...newMcq, question_hi: e.target.value })} className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white text-sm outline-none" placeholder="हिंदी प्रश्न लिखें..." />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-800/30 p-4 rounded-xl border border-gray-700/50">
              {['a', 'b', 'c', 'd'].map(opt => (
                <div key={opt} className="space-y-2">
                  <label className="text-xs font-bold text-gray-300 uppercase">Option {opt.toUpperCase()}</label>
                  <input required value={newMcq[`option_${opt}`]} onChange={e => setNewMcq({ ...newMcq, [`option_${opt}`]: e.target.value })} placeholder={`English Option ${opt.toUpperCase()}`} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm outline-none" />
                  <input value={newMcq[`option_${opt}_hi`]} onChange={e => setNewMcq({ ...newMcq, [`option_${opt}_hi`]: e.target.value })} placeholder={`Hindi Option ${opt.toUpperCase()}`} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-amber-200 text-sm outline-none" />
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-2 block">Correct Option</label>
                <select value={newMcq.correct} onChange={e => setNewMcq({ ...newMcq, correct: e.target.value })} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm outline-none font-bold">
                  <option value="a">Option A</option>
                  <option value="b">Option B</option>
                  <option value="c">Option C</option>
                  <option value="d">Option D</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">English Explanation</label>
                <input value={newMcq.explanation} onChange={e => setNewMcq({ ...newMcq, explanation: e.target.value })} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm outline-none" placeholder="Explanation..." />
              </div>
              <div>
                <label className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-2 block">Hindi Explanation</label>
                <input value={newMcq.explanation_hi} onChange={e => setNewMcq({ ...newMcq, explanation_hi: e.target.value })} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-amber-200 text-sm outline-none" placeholder="व्याख्या..." />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-800">
              <button type="button" onClick={() => setShowAdd(false)} className="px-4 py-2 bg-gray-800 text-gray-300 rounded-lg text-sm">Cancel</button>
              <button type="submit" className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-2 rounded-lg font-medium text-sm">Save New Question</button>
            </div>
          </form>
        )}
      </div>
    </motion.div>
  );
}
