"use client";
import React, { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import useAuthStore from '@/store/authStore';
import Sidebar from '@/components/layout/Sidebar';
import Topbar from '@/components/layout/Topbar';
import { 
  LayoutDashboard, 
  Dumbbell, 
  MessageSquareCode, 
  Apple, 
  Settings as SettingsIcon 
} from 'lucide-react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, isLoading, checkAuth } = useAuthStore();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#050510] flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-10 h-10 border-4 border-cyan border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs text-mutedText animate-pulse font-sans">Establishing secure session...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="min-h-screen bg-[#050510] text-[#C4CDD8] flex font-sans">
      {/* Desktop Sidebar (hidden on mobile) */}
      <div className="hidden md:block">
        <Sidebar />
      </div>

      {/* Main Container */}
      <div className="flex-1 flex flex-col md:pl-60 pb-20 md:pb-0">
        <Topbar />
        
        {/* Page Content */}
        <main className="flex-1 mt-16 p-6 md:p-8 overflow-y-auto">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation (visible only on mobile screens) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-[#070b13]/90 backdrop-blur-md border-t border-white/5 flex items-center justify-around z-30 px-2">
        <Link 
          href="/dashboard" 
          className={`flex flex-col items-center space-y-1 text-center ${
            pathname === '/dashboard' ? 'text-cyan' : 'text-mutedText'
          }`}
        >
          <LayoutDashboard className="w-5 h-5" />
          <span className="text-[9px] font-bold">Home</span>
        </Link>

        <Link 
          href="/dashboard/workouts" 
          className={`flex flex-col items-center space-y-1 text-center ${
            pathname === '/dashboard/workouts' ? 'text-cyan' : 'text-mutedText'
          }`}
        >
          <Dumbbell className="w-5 h-5" />
          <span className="text-[9px] font-bold">Workouts</span>
        </Link>

        <Link 
          href="/dashboard/coach" 
          className={`flex flex-col items-center space-y-1 text-center ${
            pathname === '/dashboard/coach' ? 'text-cyan' : 'text-mutedText'
          }`}
        >
          <MessageSquareCode className="w-5 h-5" />
          <span className="text-[9px] font-bold">AI Coach</span>
        </Link>

        <Link 
          href="/dashboard/nutrition" 
          className={`flex flex-col items-center space-y-1 text-center ${
            pathname === '/dashboard/nutrition' ? 'text-cyan' : 'text-mutedText'
          }`}
        >
          <Apple className="w-5 h-5" />
          <span className="text-[9px] font-bold">Food</span>
        </Link>

        <Link 
          href="/dashboard/settings" 
          className={`flex flex-col items-center space-y-1 text-center ${
            pathname === '/dashboard/settings' ? 'text-cyan' : 'text-mutedText'
          }`}
        >
          <SettingsIcon className="w-5 h-5" />
          <span className="text-[9px] font-bold">Profile</span>
        </Link>
      </div>
    </div>
  );
}
