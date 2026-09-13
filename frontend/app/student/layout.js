'use client';
import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import { BarChart3, BookOpen, FileText, Trophy } from 'lucide-react';

const studentNav = [
  { href: '/student', icon: BarChart3, label: 'Dashboard' },
  { href: '/student/lectures', icon: BookOpen, label: 'My Lectures' },
  { href: '/student/evaluation', icon: FileText, label: 'Evaluation' },
  { href: '/student/progress', icon: BarChart3, label: 'My Progress' },
  { href: '/student/comparison', icon: Trophy, label: 'Peer Comparison' },
];

export default function StudentLayout({ children }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!user || user.role !== 'student')) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading || !user) return (
    <div className='flex items-center justify-center h-screen bg-bg-primary'>
      <div className='animate-spin rounded-full h-12 w-12 border-t-2 border-accent'></div>
    </div>
  );

  return (
    <div className='flex min-h-screen bg-bg-primary relative overflow-x-hidden'>
      <Sidebar items={studentNav} role='student' />
      <main className='flex-1 md:ml-[260px] pt-16 md:pt-0 w-full min-w-0 transition-all duration-300'>
        {children}
      </main>
    </div>
  );
}
