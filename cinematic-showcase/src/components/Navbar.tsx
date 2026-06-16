'use client';

import React from 'react';
import Link from 'next/link';
import useAuthStore from '@/store/authStore';
import { Dumbbell } from 'lucide-react';

export default function Navbar() {
  const { isAuthenticated } = useAuthStore() as any;

  const scrollTo = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <>
      <header className="fixed top-6 left-0 right-0 z-50 flex justify-center px-4 md:px-0">
        <nav className="glass-panel w-full max-w-5xl rounded-full px-6 py-3 flex items-center justify-between">
          {/* Brand Logo with Dumbbell Icon */}
          <div 
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="flex items-center space-x-2.5 text-white font-headline text-2xl font-bold tracking-tight cursor-pointer hover:opacity-80 transition-opacity select-none"
          >
            <div className="w-8 h-8 rounded-lg bg-actionGreen flex items-center justify-center text-bg glow-green">
              <Dumbbell className="w-4.5 h-4.5 stroke-[2.5]" />
            </div>
            <span>FitTrack</span>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-[#C4CDD8] font-body">
            <button 
              onClick={() => scrollTo('features')} 
              className="hover:text-white transition-colors cursor-pointer"
            >
              Features
            </button>
            <button 
              onClick={() => scrollTo('metrics')} 
              className="hover:text-white transition-colors cursor-pointer"
            >
              Metrics
            </button>
            <button 
              onClick={() => scrollTo('testimonials')} 
              className="hover:text-white transition-colors cursor-pointer"
            >
              Testimonials
            </button>
            {isAuthenticated ? (
              <Link 
                href="/dashboard" 
                className="hover:text-white transition-colors"
              >
                Dashboard
              </Link>
            ) : (
              <Link 
                href="/login" 
                className="hover:text-white transition-colors"
              >
                Login
              </Link>
            )}
          </div>

          {/* Action Button */}
          {isAuthenticated ? (
            <Link 
              href="/dashboard"
              className="bg-green text-[#050510] font-body text-xs md:text-sm font-bold px-5 py-2.5 rounded-full hover:shadow-[0_0_15px_rgba(57,255,20,0.5)] transition-all duration-300 text-center"
            >
              Dashboard
            </Link>
          ) : (
            <Link 
              href="/register"
              className="bg-green text-[#050510] font-body text-xs md:text-sm font-bold px-5 py-2.5 rounded-full hover:shadow-[0_0_15px_rgba(57,255,20,0.5)] transition-all duration-300 text-center"
            >
              Get Started
            </Link>
          )}
        </nav>
      </header>

      {/* Sticky Bottom Right Badge (styled to cover floating overlays) */}
      <div className="fixed bottom-6 right-6 z-[999999]">
        <div 
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="bg-[#070b13] flex items-center space-x-2.5 px-4 py-2.5 rounded-full border border-[#39FF14]/25 shadow-[0_12px_40px_rgba(0,0,0,0.95),0_0_20px_rgba(57,255,20,0.15)] cursor-pointer hover:border-actionGreen hover:shadow-[0_12px_50px_rgba(0,0,0,0.95),0_0_25px_rgba(57,255,20,0.25)] transition-all duration-300 group select-none"
        >
          <div className="w-8 h-8 rounded-lg bg-actionGreen flex items-center justify-center text-bg glow-green group-hover:scale-105 transition-transform">
            <Dumbbell className="w-4.5 h-4.5 stroke-[2.5]" />
          </div>
          <span className="text-white font-headline text-sm font-bold tracking-tight">
            FitTrack
          </span>
        </div>
      </div>
    </>
  );
}
