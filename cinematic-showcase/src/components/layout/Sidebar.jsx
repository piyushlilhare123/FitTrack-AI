"use client";
import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  LayoutDashboard, 
  Dumbbell, 
  MessageSquareCode, 
  Apple, 
  TrendingUp, 
  Users, 
  Settings, 
  LogOut,
  SunMoon,
  Globe
} from 'lucide-react';
import useAuthStore from '../../store/authStore';
import toast from 'react-hot-toast';

export default function Sidebar() {
  const { user, logout } = useAuthStore();
  const pathname = usePathname();
  const router = useRouter();

  const menuItems = [
    { name: 'Home', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Workouts', path: '/dashboard/workouts', icon: Dumbbell },
    { name: 'AI Coach', path: '/dashboard/coach', icon: MessageSquareCode },
    { name: 'Food', path: '/dashboard/nutrition', icon: Apple },
    { name: 'Progress', path: '/dashboard/progress', icon: TrendingUp },
    { name: 'Community', path: '/dashboard/community', icon: Users },
    { name: 'Profile', path: '/dashboard/settings', icon: Settings },
  ];

  const handleLightMode = () => {
    toast('FitTrack operates in high-performance Dark Mode only! 🌌', {
      icon: '⚡',
      style: {
        background: '#0F1928',
        color: '#00F5FF',
        border: '1px solid rgba(0, 245, 255, 0.2)',
      }
    });
  };

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-60 bg-[#070b13] border-r border-white/5 flex flex-col justify-between py-6 z-30">
      {/* Brand logo */}
      <div className="px-6 flex items-center space-x-2.5 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => router.push('/')}>
        <div className="w-8 h-8 rounded-lg bg-actionGreen flex items-center justify-center text-[#050510] glow-green">
          <Dumbbell className="w-4.5 h-4.5 stroke-[2.5] text-[#050510]" />
        </div>
        <span className="font-headline font-bold text-2xl text-white tracking-tight">
          FitTrack
        </span>
      </div>

      {/* Nav links */}
      <nav className="mt-8 flex-1 px-3 space-y-1">
        {menuItems.map((item) => {
          const isActive = item.path === '/dashboard' 
            ? pathname === '/dashboard' 
            : item.path === '/'
              ? pathname === '/'
              : pathname.startsWith(item.path);
          return (
            <Link
              key={item.name}
              href={item.path}
              className={`
                flex items-center space-x-3.5 px-4 py-3 rounded-lg text-sm font-semibold transition-all duration-200 group border-l-2
                ${isActive 
                  ? 'text-[#00F5FF] bg-gradient-to-r from-accentCyan/10 to-transparent border-[#00F5FF]' 
                  : 'text-mutedText hover:text-white hover:bg-white/5 border-transparent'
                }
              `}
            >
              <item.icon className="w-5 h-5 group-hover:scale-110 transition-transform" />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Sidebar Footer */}
      <div className="px-3 border-t border-white/5 pt-4 space-y-3">
        {/* User profile card */}
        <div className="flex items-center justify-between p-2 rounded-xl bg-white/[0.02] border border-white/5">
          <div className="flex items-center space-x-3">
            <img
              src={user?.avatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${user?.name || 'Piyush'}`}
              alt="User Avatar"
              className="w-9 h-9 rounded-full border border-white/10"
            />
            <div className="w-24">
              <p className="text-xs font-bold text-white truncate">{user?.name || 'Piyush 👋'}</p>
              <p className="text-[10px] text-mutedText truncate">{user?.email || 'user@fittrack.com'}</p>
            </div>
          </div>
          <button 
            onClick={logout}
            className="p-1.5 rounded-lg text-mutedText hover:text-red-400 hover:bg-white/5 transition-colors"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
