'use client';
import { useAuth } from '@/lib/auth';

export default function Header({ title }) {
  const { user } = useAuth();

  return (
    <header className="h-16 flex items-center justify-between px-8 bg-gray-900/50 backdrop-blur-md border-b border-gray-800 sticky top-0 z-30">
      <h2 className="text-xl font-bold text-white">{title}</h2>
      
      <div className="flex items-center gap-4">
        {user && (
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 rounded-full bg-accent/10 text-accent text-xs font-semibold uppercase tracking-wider border border-accent/20">
              {user.role}
            </span>
          </div>
        )}
      </div>
    </header>
  );
}
