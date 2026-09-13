'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';
import { BookOpen, Plus, Upload, Check, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';

export default function CourseManagement() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedCourse, setExpandedCourse] = useState(null);
  const [courseModulesMap, setCourseModulesMap] = useState({});
  const [newCourse, setNewCourse] = useState({ course_id: '', title: '', description: '' });
  const [newLecture, setNewLecture] = useState({ course_id: '', module_id: '', title: '', english_content: '' });
  const [pdfUpload, setPdfUpload] = useState({ course_id: '', module_id: '', title: '', file: null });
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    fetchCourses();
  }, []);

  async function fetchCourses() {
    try {
      setLoading(true);
      const data = await api.getCourses().catch(() => []);
      setCourses(data || []);
    } catch (error) {
      console.error('Error fetching courses', error);
    } finally {
      setLoading(false);
    }
  }

  const toggleExpand = async (courseId) => {
    if (expandedCourse === courseId) {
      setExpandedCourse(null);
    } else {
      setExpandedCourse(courseId);
      if (!courseModulesMap[courseId]) {
        const mods = await api.getCourseModules(courseId).catch(() => []);
        setCourseModulesMap(prev => ({ ...prev, [courseId]: mods }));
      }
    }
  };

  const handleCreateCourse = async (e) => {
    e.preventDefault();
    try {
      await api.createCourse(newCourse);
      setMessage({ type: 'success', text: 'Course created successfully!' });
      setNewCourse({ course_id: '', title: '', description: '' });
      fetchCourses();
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to create course.' });
    }
    setTimeout(() => setMessage(null), 3000);
  };

  const handlePdfUpload = async (e) => {
    e.preventDefault();
    if (!pdfUpload.file) {
      setMessage({ type: 'error', text: 'Please select a PDF file.' });
      return;
    }
    setUploadingPdf(true);
    try {
      const formData = new FormData();
      formData.append('course_id', pdfUpload.course_id);
      formData.append('module_id', pdfUpload.module_id);
      formData.append('title', pdfUpload.title);
      formData.append('file', pdfUpload.file);

      const res = await api.uploadPDFLecture(formData);
      setMessage({ type: 'success', text: res.message || 'PDF converted & bilingual PLS lecture generated!' });
      setPdfUpload({ course_id: '', module_id: '', title: '', file: null });
      fetchCourses();
    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'Failed to upload PDF lecture.' });
    } finally {
      setUploadingPdf(false);
      setTimeout(() => setMessage(null), 4000);
    }
  };

  const handleCreateLecture = async (e) => {
    e.preventDefault();
    try {
      await api.createLecture({
        course_id: newLecture.course_id,
        module_id: newLecture.module_id,
        title: newLecture.title,
        english: newLecture.english_content
      });
      setMessage({ type: 'success', text: 'Lecture and bilingual PLS content created!' });
      setNewLecture({ course_id: '', module_id: '', title: '', english_content: '' });
      fetchCourses();
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to create lecture.' });
    }
    setTimeout(() => setMessage(null), 3000);
  };

  if (loading) {
    return <div className="flex items-center justify-center h-screen text-indigo-400 font-medium">Loading Courses...</div>;
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="p-8 space-y-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-white flex items-center gap-3"><BookOpen className="text-indigo-400"/> Course & Lecture Management</h1>
      </div>

      {message && (
        <div className={`p-4 rounded-lg flex items-center gap-3 ${message.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
          {message.type === 'success' ? <Check className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Create Forms */}
        <div className="space-y-8">
          {/* PDF Upload Card */}
          <div className="bg-gray-900/50 backdrop-blur-sm border border-purple-500/30 rounded-xl p-6 shadow-[0_0_20px_rgba(168,85,247,0.1)]">
            <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
              <Upload className="w-5 h-5 text-purple-400"/> Upload PDF Lecture (Auto-Convert to Hindi & PLS)
            </h2>
            <p className="text-xs text-gray-400 mb-6">
              Upload an English PDF document. The system will automatically extract text, translate to Hindi, generate 4 PLS Phases, and create bilingual MCQs!
            </p>

            <form onSubmit={handlePdfUpload} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-300 mb-1.5 block">Select Course</label>
                <select required value={pdfUpload.course_id} onChange={e => setPdfUpload({...pdfUpload, course_id: e.target.value})} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white outline-none">
                  <option value="">-- Select Course --</option>
                  {courses.map(c => <option key={c.course_id} value={c.course_id}>{c.title} ({c.course_id})</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-300 mb-1.5 block">Module ID</label>
                  <input required value={pdfUpload.module_id} onChange={e => setPdfUpload({...pdfUpload, module_id: e.target.value})} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white outline-none" placeholder="e.g., module_9" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-300 mb-1.5 block">Module Title</label>
                  <input required value={pdfUpload.title} onChange={e => setPdfUpload({...pdfUpload, title: e.target.value})} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white outline-none" placeholder="Title" />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-300 mb-1.5 block">Select PDF Document (.pdf)</label>
                <input 
                  type="file" 
                  accept=".pdf"
                  required
                  onChange={e => setPdfUpload({...pdfUpload, file: e.target.files[0]})}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-gray-300 cursor-pointer outline-none" 
                />
              </div>
              <button 
                type="submit" 
                disabled={uploadingPdf}
                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white px-4 py-3 rounded-lg font-medium transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Upload className="w-5 h-5" /> {uploadingPdf ? 'Converting PDF & Generating PLS...' : 'Upload PDF & Auto-Generate Bilingual Content'}
              </button>
            </form>
          </div>

          {/* Create Course */}
          <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2"><Plus className="w-5 h-5 text-indigo-400"/> Create New Course</h2>
            <form onSubmit={handleCreateCourse} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-300 mb-1.5 block">Course ID</label>
                <input required value={newCourse.course_id} onChange={e => setNewCourse({...newCourse, course_id: e.target.value})} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white outline-none" placeholder="e.g., course_3" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-300 mb-1.5 block">Title</label>
                <input required value={newCourse.title} onChange={e => setNewCourse({...newCourse, title: e.target.value})} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white outline-none" placeholder="Course Title" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-300 mb-1.5 block">Description</label>
                <textarea required value={newCourse.description} onChange={e => setNewCourse({...newCourse, description: e.target.value})} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white outline-none min-h-[100px]" placeholder="Course Description" />
              </div>
              <button type="submit" className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white px-4 py-2.5 rounded-lg font-medium transition-all flex items-center justify-center gap-2">
                <Plus className="w-5 h-5" /> Create Course
              </button>
            </form>
          </div>

          {/* Upload Lecture */}
          <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2"><Upload className="w-5 h-5 text-purple-400"/> Upload Lecture</h2>
            <form onSubmit={handleCreateLecture} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-300 mb-1.5 block">Select Course</label>
                <select required value={newLecture.course_id} onChange={e => setNewLecture({...newLecture, course_id: e.target.value})} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white outline-none">
                  <option value="">-- Select Course --</option>
                  {courses.map(c => <option key={c.course_id} value={c.course_id}>{c.title} ({c.course_id})</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-300 mb-1.5 block">Module ID</label>
                <input required value={newLecture.module_id} onChange={e => setNewLecture({...newLecture, module_id: e.target.value})} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white outline-none" placeholder="e.g., MOD1" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-300 mb-1.5 block">Title</label>
                <input required value={newLecture.title} onChange={e => setNewLecture({...newLecture, title: e.target.value})} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white outline-none" placeholder="Lecture Title" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-300 mb-1.5 block">Content (English)</label>
                <textarea required value={newLecture.english_content} onChange={e => setNewLecture({...newLecture, english_content: e.target.value})} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white outline-none min-h-[150px]" placeholder="Lecture Content..." />
              </div>
              <button type="submit" className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white px-4 py-2.5 rounded-lg font-medium transition-all flex items-center justify-center gap-2">
                <Upload className="w-5 h-5" /> Upload Lecture
              </button>
            </form>
          </div>
        </div>

        {/* Existing Courses */}
        <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6">
          <h2 className="text-xl font-bold text-white mb-6">Existing Courses ({courses.length})</h2>
          {courses.length === 0 ? (
            <div className="text-gray-400 text-center py-8">No courses found. Create one first!</div>
          ) : (
            <div className="space-y-4">
              {courses.map((course, cIdx) => (
                <div key={course.course_id} className="bg-gray-800/30 rounded-lg border border-gray-700 overflow-hidden">
                  <div 
                    className="p-4 flex justify-between items-center cursor-pointer hover:bg-gray-800/50 transition-colors"
                    onClick={() => toggleExpand(course.course_id)}
                  >
                    <div>
                      <h3 className="text-lg font-medium text-white flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded text-xs font-extrabold bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 uppercase">
                          Course #{cIdx + 1}
                        </span>
                        {course.title}
                        <span className="px-2 py-0.5 rounded-full text-xs font-mono bg-gray-800 text-gray-400 border border-gray-700">
                          {course.course_id}
                        </span>
                      </h3>
                      <p className="text-sm text-gray-400 mt-1 line-clamp-1">{course.description}</p>
                    </div>
                    {expandedCourse === course.course_id ? <ChevronUp className="text-gray-400" /> : <ChevronDown className="text-gray-400" />}
                  </div>
                  {expandedCourse === course.course_id && (
                    <div className="p-4 bg-gray-900/50 border-t border-gray-700 space-y-2">
                      <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-3">Course #{cIdx + 1} Modules & Lectures</h4>
                      {(!courseModulesMap[course.course_id] || courseModulesMap[course.course_id].length === 0) ? (
                        <div className="text-xs text-gray-500 italic">No modules added yet for this course.</div>
                      ) : (
                        courseModulesMap[course.course_id].map((m, mIdx) => (
                          <div key={m.module_id || m.id} className="p-2.5 bg-gray-800/60 rounded-lg border border-gray-700/60 flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                              <span className="px-2.5 py-0.5 rounded text-xs font-extrabold bg-purple-600/30 text-purple-300 border border-purple-500/30">
                                Module #{mIdx + 1}
                              </span>
                              <span className="text-sm font-medium text-white">{m.title}</span>
                            </div>
                            <span className="text-xs font-mono text-gray-400">ID: {m.module_id || m.id}</span>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
