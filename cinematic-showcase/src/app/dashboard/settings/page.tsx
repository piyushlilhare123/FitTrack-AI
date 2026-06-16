"use client";
import React, { useState, useEffect } from 'react';
import useAuthStore from '@/store/authStore';
import Card from '@/components/ui/Card';
import { 
  Settings as SettingsIcon, 
  User, 
  Dumbbell, 
  Smartphone, 
  Bell, 
  AlertTriangle,
  Scale,
  Flame,
  Award
} from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

export default function Settings() {
  const { user, updateUser } = useAuthStore() as any;

  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [name, setName] = useState(user?.name || '');
  const [age, setAge] = useState(user?.age || 25);
  const [weight, setWeight] = useState(user?.weight || 70);
  const [height, setHeight] = useState(user?.height || 175);
  const [goal, setGoal] = useState(user?.goal || 'maintain');
  const [fitnessLevel, setFitnessLevel] = useState(user?.fitnessLevel || 'intermediate');
  const [gender, setGender] = useState(user?.gender || 'male');
  const [bio, setBio] = useState(user?.bio || '');

  // Editable Sliders
  const [targetWeight, setTargetWeight] = useState(user?.weight || 70);
  const [dailyCalories, setDailyCalories] = useState(user?.caloriesLimit || 2000);
  const [weeklyFrequency, setWeeklyFrequency] = useState(5);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setAge(user.age || 25);
      setWeight(user.weight || 70);
      setHeight(user.height || 175);
      setGoal(user.goal || 'maintain');
      setFitnessLevel(user.fitnessLevel || 'intermediate');
      setGender(user.gender || 'male');
      setBio(user.bio || '');
      setTargetWeight(user.weight || 70);
      setDailyCalories(user.caloriesLimit || 2000);
    }
  }, [user]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await updateUser({
      name,
      age: Number(age),
      weight: Number(weight),
      height: Number(height),
      goal,
      fitnessLevel,
      gender,
      bio,
    });

    if (res.success) {
      toast.success('Profile configurations updated successfully!');
    } else {
      toast.error(res.error || 'Failed to update profile.');
    }
  };

  const handleDeleteAccount = () => {
    setShowDeleteModal(true);
  };

  const confirmDeleteAccount = () => {
    toast.error('Account deletion is locked in demo mode!');
    setShowDeleteModal(false);
  };

  const handleDeviceConnect = (device: string) => {
    toast.success(`Successfully connected to ${device}! Syncing metrics...`);
  };

  return (
    <div className="space-y-8 pb-12 select-none">
      
      {/* Header */}
      <div>
        <h2 className="text-xl font-display font-bold text-white flex items-center gap-2">
          <SettingsIcon className="w-5 h-5 text-accentCyan" />
          <span>Account Settings</span>
        </h2>
        <p className="text-xs text-mutedText mt-0.5 font-sans">Edit biomechanics info, targets frequency, and device sync keys.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start font-sans">
        
        {/* Left: Settings forms (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Profile Section */}
          <Card className="space-y-5">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider border-b border-white/5 pb-3 flex items-center gap-2">
              <User className="w-4 h-4 text-accentCyan" /> Profile Parameters
            </h3>

            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] uppercase font-bold text-mutedText tracking-widest">Full Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-[#0F1928] border border-white/5 focus:border-cyan/30 focus:outline-none rounded-xl py-3 px-4 text-xs text-white"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] uppercase font-bold text-mutedText tracking-widest">Biometric Age</label>
                  <input
                    type="number"
                    value={age}
                    onChange={(e) => setAge(Number(e.target.value))}
                    className="w-full bg-[#0F1928] border border-white/5 focus:border-cyan/30 focus:outline-none rounded-xl py-3 px-4 text-xs text-white"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] uppercase font-bold text-mutedText tracking-widest">Weight (kg)</label>
                  <input
                    type="number"
                    value={weight}
                    onChange={(e) => setWeight(Number(e.target.value))}
                    className="w-full bg-[#0F1928] border border-white/5 focus:border-cyan/30 focus:outline-none rounded-xl py-3 px-4 text-xs text-white"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] uppercase font-bold text-mutedText tracking-widest">Height (cm)</label>
                  <input
                    type="number"
                    value={height}
                    onChange={(e) => setHeight(Number(e.target.value))}
                    className="w-full bg-[#0F1928] border border-white/5 focus:border-cyan/30 focus:outline-none rounded-xl py-3 px-4 text-xs text-white"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] uppercase font-bold text-mutedText tracking-widest">Primary Goal</label>
                  <select
                    value={goal}
                    onChange={(e) => setGoal(e.target.value)}
                    className="w-full bg-[#0F1928] border border-white/5 focus:border-cyan/30 focus:outline-none rounded-xl py-3 px-4 text-xs text-white"
                  >
                    <option value="lose_weight">Lose Weight</option>
                    <option value="gain_muscle">Gain Muscle</option>
                    <option value="improve_endurance">Improve Endurance</option>
                    <option value="maintain">Maintain Fitness</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] uppercase font-bold text-mutedText tracking-widest">Fitness Level</label>
                  <select
                    value={fitnessLevel}
                    onChange={(e) => setFitnessLevel(e.target.value)}
                    className="w-full bg-[#0F1928] border border-white/5 focus:border-cyan/30 focus:outline-none rounded-xl py-3 px-4 text-xs text-white"
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] uppercase font-bold text-mutedText tracking-widest">Gender</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full bg-[#0F1928] border border-white/5 focus:border-cyan/30 focus:outline-none rounded-xl py-3 px-4 text-xs text-white"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] uppercase font-bold text-mutedText tracking-widest">Bio / Motivational Tagline</label>
                <input
                  type="text"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="e.g. Consistency over perfection."
                  className="w-full bg-[#0F1928] border border-white/5 focus:border-cyan/30 focus:outline-none rounded-xl py-3 px-4 text-xs text-white"
                />
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl text-xs font-bold text-bg bg-[#39FF14] hover:bg-[#39FF14]/90 glow-green transition-transform hover:scale-105"
                >
                  Save Profile Info
                </button>
              </div>
            </form>
          </Card>



        </div>

        {/* Right: Device sync & danger zones (4 cols) */}
        <div className="lg:col-span-4 space-y-8">
          


          {/* Danger Zone */}
          <Card className="border border-red-500/10 space-y-4">
            <div className="border-b border-red-500/10 pb-3 flex items-center space-x-2">
              <AlertTriangle className="w-4.5 h-4.5 text-red-500" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">Danger Zone</h3>
            </div>

            <div className="space-y-4 pt-2">
              <p className="text-[10px] text-mutedText leading-relaxed">Deleting your account removes all historical plans, biometrics records, and active credentials immediately.</p>
              <button
                onClick={handleDeleteAccount}
                className="w-full py-2.5 border border-red-500/30 hover:bg-red-500/10 text-red-500 text-xs font-bold rounded-xl transition-all"
              >
                Delete Account
              </button>
            </div>
          </Card>

        </div>

      </div>

      {/* Delete Account Warning Modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#121A25] border border-red-500/20 rounded-2xl p-6 max-w-md w-full shadow-2xl relative"
            >
              <div className="flex items-center space-x-3 mb-4 text-red-500">
                <AlertTriangle className="w-6 h-6" />
                <h3 className="text-lg font-bold">Delete Account?</h3>
              </div>
              <p className="text-sm text-mutedText leading-relaxed mb-6">
                Are you absolutely sure you want to delete your FitTrack AI account? This action is irreversible. All of your historical plans, biometric records, and active credentials will be permanently erased.
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-white/10 hover:bg-white/5 text-white text-xs font-bold transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeleteAccount}
                  className="flex-1 py-2.5 rounded-xl bg-red-500/10 border border-red-500/30 hover:bg-red-500 text-white text-xs font-bold transition-colors"
                >
                  Yes, Delete My Account
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
