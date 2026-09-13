'use client';
import { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from './api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const stored = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (stored && token) {
      setUser(JSON.parse(stored));
    }
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    const data = await api.login({ username, password });
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    setUser(data.user);
    if (data.user.role === 'admin') router.push('/admin');
    else router.push('/student');
    return data;
  };

  const register = async (username, password, name) => {
    return await api.register({ username, password, name });
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    router.push('/login');
  };

  const updateLanguage = async (language) => {
    try {
      await api.updateLanguage(language);
      setUser(prev => {
        const updated = { ...prev, preferred_language: language };
        localStorage.setItem('user', JSON.stringify(updated));
        return updated;
      });
    } catch (e) {
      console.error('Failed to update language preference', e);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateLanguage }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
