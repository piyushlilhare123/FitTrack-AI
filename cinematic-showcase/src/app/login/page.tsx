"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Dumbbell, Mail, Lock, Loader2, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import useAuthStore from '@/store/authStore';
import toast from 'react-hot-toast';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isResetMode, setIsResetMode] = useState(false);
  const { login, resetPassword, isLoading, error, isAuthenticated, setLoading } = useAuthStore() as any;
  const router = useRouter();

  useEffect(() => {
    setLoading(false);
  }, [setLoading]);

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      return toast.error(isResetMode ? 'Please enter email and new password' : 'Please enter email and password');
    }

    if (isResetMode) {
      const res = await resetPassword(email, password);
      if (res.success) {
        toast.success(res.message || 'Password reset successfully! You can now log in.');
        setIsResetMode(false);
        setPassword('');
      } else {
        toast.error(res.error || 'Failed to reset password');
      }
      return;
    }

    const res = await login(email, password);
    if (res.success) {
      toast.success('Welcome back to FitTrack!');
      router.push('/dashboard');
    } else {
      toast.error(res.error || 'Invalid credentials');
    }
  };

  return (
    <div className="relative min-h-screen bg-[#050510] flex items-center justify-center px-6 py-12 overflow-hidden gradient-mesh select-none">
      {/* Background glow ball */}
      <div className="absolute w-[350px] h-[350px] bg-cyan/10 blur-[100px] rounded-full pointer-events-none"></div>

      <div className="w-full max-w-md relative z-10">
        {/* Back to Home Link */}
        <div className="flex justify-start mb-4">
          <Link 
            href="/" 
            className="inline-flex items-center space-x-2 text-xs font-bold text-mutedText hover:text-[#00F5FF] transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            <span>Back to Landing Page</span>
          </Link>
        </div>

        {/* Brand logo */}
        <div className="flex flex-col items-center mb-8">
          <Link href="/" className="flex items-center space-x-2.5 font-headline text-2xl font-bold text-white tracking-tight mb-2 hover:opacity-80 transition-opacity">
            <div className="w-9 h-9 rounded-lg bg-actionGreen flex items-center justify-center text-[#050510] glow-green">
              <Dumbbell className="w-5 h-5 stroke-[2.5] text-[#050510]" />
            </div>
            <span>FitTrack</span>
          </Link>
          <p className="text-xs text-mutedText font-semibold">Scientific training starts here.</p>
        </div>

        {/* Login glass card */}
        <div className="glass-card rounded-2xl p-8 border border-white/5 shadow-2xl space-y-6">
          <h2 className="text-lg font-bold text-white text-center">{isResetMode ? "Reset Your Password" : "Sign In to Your Account"}</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-mutedText tracking-widest">Email Address</label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@domain.com"
                  className="w-full bg-[#0F1928]/55 border border-white/5 focus:border-cyan/40 rounded-xl py-3 pl-11 pr-4 text-sm text-white focus:outline-none transition-colors placeholder:text-mutedText/50"
                  required
                />
                <Mail className="absolute left-4 top-3.5 w-4 h-4 text-mutedText" />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-[10px] uppercase font-bold text-mutedText tracking-widest">{isResetMode ? "New Password" : "Password"}</label>
                {!isResetMode && (
                  <a href="#" onClick={(e) => { e.preventDefault(); setIsResetMode(true); }} className="text-[10px] font-semibold text-cyan hover:underline">Forgot password?</a>
                )}
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#0F1928]/55 border border-white/5 focus:border-cyan/40 rounded-xl py-3 pl-11 pr-12 text-sm text-white focus:outline-none transition-colors placeholder:text-mutedText/50"
                  required
                />
                <Lock className="absolute left-4 top-3.5 w-4 h-4 text-mutedText" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-3.5 text-mutedText hover:text-white transition-colors focus:outline-none"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 rounded-xl text-sm font-bold text-bg bg-actionGreen hover:bg-actionGreen/90 glow-green transition-all duration-200 hover:scale-[1.01] flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin text-bg" />
              ) : (
                <span>{isResetMode ? "Reset Password" : "Access Dashboard"}</span>
              )}
            </button>
          </form>

          {/* Prompt */}
          <div className="text-center text-xs text-mutedText">
            {isResetMode ? (
              <a href="#" onClick={(e) => { e.preventDefault(); setIsResetMode(false); }} className="font-bold text-cyan hover:underline">
                Wait, I remember my password
              </a>
            ) : (
              <>
                Don't have an account?{' '}
                <Link href="/register" className="font-bold text-cyan hover:underline">
                  Create an account
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
