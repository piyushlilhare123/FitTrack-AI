"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Dumbbell, Mail, Lock, User, Loader2, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import useAuthStore from '@/store/authStore';
import toast from 'react-hot-toast';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [age, setAge] = useState('');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [goal, setGoal] = useState('maintain');
  const [fitnessLevel, setFitnessLevel] = useState('intermediate');
  const [gender, setGender] = useState('male');
  const [bio, setBio] = useState('');
  
  const { register, isLoading, error, isAuthenticated, setLoading } = useAuthStore() as any;
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
    if (!name || !email || !password) {
      return toast.error('Please fill in all fields');
    }
    if (password.length < 6) {
      return toast.error('Password must be at least 6 characters');
    }
    
    const extraData = {
      age: age ? Number(age) : 25,
      weight: weight ? Number(weight) : 70,
      height: height ? Number(height) : 175,
      goal,
      fitnessLevel,
      gender,
      bio: bio || '',
    };
    
    const res = await register(name, email, password, extraData);
    if (res.success) {
      toast.success('Account created successfully! Welcome!');
      router.push('/dashboard');
    } else {
      toast.error(res.error || 'Registration failed');
    }
  };

  return (
    <div className="relative min-h-screen bg-[#050510] flex items-center justify-center px-6 py-12 overflow-hidden gradient-mesh select-none">
      {/* Background glow ball */}
      <div className="absolute w-[350px] h-[350px] bg-actionGreen/5 blur-[100px] rounded-full pointer-events-none"></div>

      <div className="w-full max-w-lg relative z-10">
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

        {/* Register glass card */}
        <div className="glass-card rounded-2xl p-8 border border-white/5 shadow-2xl space-y-6">
          <h2 className="text-lg font-bold text-white text-center">Create Your Free Account</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name Field */}
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-mutedText tracking-widest">Full Name</label>
              <div className="relative">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full bg-[#0F1928]/55 border border-white/5 focus:border-cyan/40 rounded-xl py-3 pl-11 pr-4 text-sm text-white focus:outline-none transition-colors placeholder:text-mutedText/50"
                  required
                />
                <User className="absolute left-4 top-3.5 w-4 h-4 text-mutedText" />
              </div>
            </div>

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
              <label className="text-[10px] uppercase font-bold text-mutedText tracking-widest">Password</label>
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

            {/* Demographics Grid (Age, Weight, Height) */}
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-mutedText tracking-widest">Age</label>
                <input
                  type="number"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder="25"
                  min="0"
                  max="120"
                  className="w-full bg-[#0F1928]/55 border border-white/5 focus:border-cyan/40 rounded-xl py-3 px-4 text-sm text-white focus:outline-none transition-colors placeholder:text-mutedText/50"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-mutedText tracking-widest">Weight (kg)</label>
                <input
                  type="number"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  placeholder="70"
                  min="0"
                  max="300"
                  className="w-full bg-[#0F1928]/55 border border-white/5 focus:border-cyan/40 rounded-xl py-3 px-4 text-sm text-white focus:outline-none transition-colors placeholder:text-mutedText/50"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-mutedText tracking-widest">Height (cm)</label>
                <input
                  type="number"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  placeholder="175"
                  min="0"
                  max="250"
                  className="w-full bg-[#0F1928]/55 border border-white/5 focus:border-cyan/40 rounded-xl py-3 px-4 text-sm text-white focus:outline-none transition-colors placeholder:text-mutedText/50"
                  required
                />
              </div>
            </div>

            {/* Goals, Fitness Level & Gender Grid */}
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-mutedText tracking-widest">Primary Goal</label>
                <select
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  className="w-full bg-[#0F1928] border border-white/5 focus:border-cyan/40 rounded-xl py-3 px-3 text-xs text-white focus:outline-none transition-colors cursor-pointer"
                  style={{ colorScheme: 'dark' }}
                  required
                >
                  <option value="lose_weight">Lose Weight</option>
                  <option value="gain_muscle">Gain Muscle</option>
                  <option value="maintain">Maintain</option>
                  <option value="improve_endurance">Endurance</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-mutedText tracking-widest">Fitness Level</label>
                <select
                  value={fitnessLevel}
                  onChange={(e) => setFitnessLevel(e.target.value)}
                  className="w-full bg-[#0F1928] border border-white/5 focus:border-cyan/40 rounded-xl py-3 px-3 text-xs text-white focus:outline-none transition-colors cursor-pointer"
                  style={{ colorScheme: 'dark' }}
                  required
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-mutedText tracking-widest">Gender</label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full bg-[#0F1928] border border-white/5 focus:border-cyan/40 rounded-xl py-3 px-3 text-xs text-white focus:outline-none transition-colors cursor-pointer"
                  style={{ colorScheme: 'dark' }}
                  required
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            {/* Bio / Tagline field */}
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-mutedText tracking-widest">Bio / Motivational Tagline</label>
              <input
                type="text"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Consistency is key! ⚡"
                className="w-full bg-[#0F1928]/55 border border-white/5 focus:border-cyan/40 rounded-xl py-3 px-4 text-sm text-white focus:outline-none transition-colors placeholder:text-mutedText/50"
              />
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
                <span>Register & Get Started</span>
              )}
            </button>
          </form>

          {/* Prompt */}
          <div className="text-center text-xs text-mutedText">
            Already have an account?{' '}
            <Link href="/login" className="font-bold text-cyan hover:underline">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
