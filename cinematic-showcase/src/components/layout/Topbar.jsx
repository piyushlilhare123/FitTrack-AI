"use client";
import React, { useState, useEffect } from 'react';
import { Bell, Plus, Dumbbell, Apple, Globe, Sun, Moon } from 'lucide-react';
import useAuthStore from '../../store/authStore';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Topbar() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [isLightMode, setIsLightMode] = useState(false);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      setIsLightMode(document.documentElement.classList.contains('light-theme'));
    }
  }, []);

  const toggleTheme = () => {
    if (typeof document !== 'undefined') {
      const isLight = document.documentElement.classList.toggle('light-theme');
      setIsLightMode(isLight);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  const getFormattedDate = () => {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return new Date().toLocaleDateString('en-US', options);
  };

  return (
    <header className="fixed top-0 left-0 md:left-60 right-0 h-16 bg-[#050510]/80 backdrop-blur-md border-b border-white/5 flex items-center justify-between px-4 md:px-8 z-20">
      {/* Brand / Greeting */}
      <div className="flex items-center space-x-3">
        {/* Mobile Logo (visible only on mobile) */}
        <Link 
          href="/" 
          className="flex md:hidden items-center space-x-2.5 cursor-pointer hover:opacity-80 transition-opacity"
        >
          <div className="w-8 h-8 rounded-lg bg-actionGreen flex items-center justify-center text-[#050510] glow-green">
            <Dumbbell className="w-4.5 h-4.5 stroke-[2.5] text-[#050510]" />
          </div>
          <span className="font-headline font-bold text-xl text-white tracking-tight">
            FitTrack
          </span>
        </Link>

        {/* Greeting (hidden on extra small screens, visible on tablet/desktop) */}
        <div className="hidden sm:block">
          <h1 className="text-base font-bold text-white flex items-center gap-1.5">
            {getGreeting()}, {user?.name || 'Piyush'} 👋
          </h1>
          <p className="text-[10px] text-mutedText font-medium mt-0.5">{getFormattedDate()}</p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center space-x-3 md:space-x-4">
        {/* Theme Toggle Button */}
        <button 
          className="relative w-9 h-9 rounded-full bg-[#0F1928] border border-white/5 flex items-center justify-center text-mutedText hover:text-white transition-colors"
          onClick={toggleTheme}
          title={isLightMode ? "Switch to Dark Mode" : "Switch to Light Mode"}
        >
          {isLightMode ? <Moon className="w-4 h-4 text-white" /> : <Sun className="w-4 h-4 text-white" />}
        </button>

        {/* Landing Page Button (in place of Quick Action) */}
        <Link 
          href="/" 
          className="flex items-center space-x-1.5 px-4 py-2 rounded-full text-xs font-bold text-bg bg-actionGreen hover:bg-actionGreen/90 transition-all hover:scale-105 glow-green"
        >
          <Globe className="w-3.5 h-3.5" />
          <span>Landing Page</span>
        </Link>
      </div>
    </header>
  );
}
