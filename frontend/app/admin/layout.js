'use client';
import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import { BookOpen, Users, GraduationCap, FileEdit, BarChart3, Trophy } from 'lucide-react';

const adminNav = [
  { href: '/admin', icon: BarChart3, label: 'Dashboard' },
  { href: '/admin/courses', icon: BookOpen, label: 'Courses & Lectures' },
  { href: '/admin/users', icon: Users, label: 'User Approvals' },
  { href: '/admin/enrollment', icon: GraduationCap, label: 'Enrollment' },
  { href: '/admin/evaluations', icon: FileEdit, label: 'Evaluation Editor' },
  { href: '/admin/tracker', icon: BarChart3, label: 'Student Tracker' },
  { href: '/admin/analytics', icon: Trophy, label: 'Peer Analytics' },
];

export default function AdminLayout({ children }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!user || user.role !== 'admin')) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading || !user) return <div className='flex items-center justify-center h-screen bg-bg-primary'><div className='animate-spin rounded-full h-12 w-12 border-t-2 border-accent'></div></div>;

  return (
    <div className='flex min-h-screen bg-bg-primary'>
      <Sidebar items={adminNav} role='admin' />
      <main className='flex-1 ml-[250px]'>{children}</main>
    </div>
  );
}
