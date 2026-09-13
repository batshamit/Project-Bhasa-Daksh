const API_BASE = process.env.NEXT_PUBLIC_API_URL || 
  (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1'
    ? 'https://bhasa-daksh-api.onrender.com/api'
    : 'http://localhost:8000/api');

export async function apiRequest(endpoint, options = {}) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const res = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });

  if (res.status === 401 && endpoint !== '/auth/login') {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    throw new Error('Unauthorized');
  }

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: 'Request failed' }));
    throw new Error(error.detail || 'Request failed');
  }

  return res.json();
}

export const api = {
  // Auth
  login: (data) => apiRequest('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  register: (data) => apiRequest('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  getMe: () => apiRequest('/auth/me'),
  updateLanguage: (language) => apiRequest('/auth/language', { method: 'PATCH', body: JSON.stringify({ language }) }),

  // Courses
  getCourses: () => apiRequest('/courses'),
  getCourse: (id) => apiRequest(`/courses/${id}`),
  createCourse: (data) => apiRequest('/courses', { method: 'POST', body: JSON.stringify(data) }),
  getCourseModules: (id) => apiRequest(`/courses/${id}/modules`),
  getCourseLanguage: (courseId) => apiRequest(`/courses/${courseId}/language`),
  setCourseLanguage: (courseId, language) => apiRequest(`/courses/${courseId}/language`, { method: 'POST', body: JSON.stringify({ language }) }),

  // Lectures
  getLectures: () => apiRequest('/lectures'),
  getLecture: (id) => apiRequest(`/lectures/${id}`),
  createLecture: (data) => apiRequest('/lectures', { method: 'POST', body: JSON.stringify(data) }),
  uploadPDFLecture: async (formData) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const res = await fetch(`${API_BASE}/lectures/upload-pdf`, {
      method: 'POST',
      headers: {
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: formData
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Upload failed' }));
      throw new Error(err.detail || 'PDF Upload failed');
    }
    return res.json();
  },

  // Evaluations
  getMCQs: (moduleId) => apiRequest(`/evaluations/${moduleId}`),
  submitEval: (moduleId, data) => apiRequest(`/evaluations/${moduleId}/submit`, { method: 'POST', body: JSON.stringify(data) }),
  getFinalEval: (courseId) => apiRequest(`/evaluations/final/${courseId}`),
  submitFinalEval: (courseId, data) => apiRequest(`/evaluations/final/${courseId}/submit`, { method: 'POST', body: JSON.stringify(data) }),
  updateMCQ: (id, data) => apiRequest(`/evaluations/mcq/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteMCQ: (id) => apiRequest(`/evaluations/mcq/${id}`, { method: 'DELETE' }),
  addMCQ: (data) => apiRequest('/evaluations/mcq', { method: 'POST', body: JSON.stringify(data) }),

  // Users
  getPendingUsers: () => apiRequest('/users/pending'),
  getStudents: () => apiRequest('/users/students'),
  approveUser: (username) => apiRequest(`/users/${username}/approve`, { method: 'PATCH' }),
  rejectUser: (username) => apiRequest(`/users/${username}`, { method: 'DELETE' }),

  // Enrollments
  getEnrolledCourses: (username) => apiRequest(`/enrollments/${username}`),
  enrollStudent: (data) => apiRequest('/enrollments', { method: 'POST', body: JSON.stringify(data) }),
  unenrollStudent: (data) => apiRequest('/enrollments', { method: 'DELETE', body: JSON.stringify(data) }),
  getCourseStudents: (courseId) => apiRequest(`/enrollments/course/${courseId}`),

  // Progress
  markComplete: (data) => apiRequest('/progress/complete', { method: 'POST', body: JSON.stringify(data) }),
  getCompleted: (username) => apiRequest(`/progress/${username}`),

  // Analytics
  getStudentScores: (username) => apiRequest(`/analytics/scores/${username}`),
  getAllScores: () => apiRequest('/analytics/scores'),
  getBestScores: (username) => apiRequest(`/analytics/best/${username}`),
  getLeaderboard: () => apiRequest('/analytics/leaderboard'),
  getAdminLeaderboard: () => apiRequest('/analytics/admin-leaderboard'),
};
