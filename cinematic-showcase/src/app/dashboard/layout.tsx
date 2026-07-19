"use client";
import React, { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import useAuthStore from '@/store/authStore';
import Sidebar from '@/components/layout/Sidebar';
import Topbar from '@/components/layout/Topbar';


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
      {/* Sidebar — handles desktop sidebar + mobile bottom nav with all items */}
      <Sidebar />

      {/* Main Container */}
      <div className="flex-1 flex flex-col md:pl-60 pb-20 md:pb-0">
        <Topbar />

        {/* Page Content */}
        <main className="flex-1 mt-16 p-6 md:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
