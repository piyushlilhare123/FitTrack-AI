"use client";
import React, { useState, useEffect } from 'react';
import useWorkoutStore from '@/store/workoutStore';
import useAuthStore from '@/store/authStore';
import Card from '@/components/ui/Card';
import HeatMap from '@/components/charts/HeatMap';
import MacroRadarChart from '@/components/charts/MacroRadarChart';
import TrophyRoom from '@/components/progress/TrophyRoom';
import BodyMeasurements from '@/components/progress/BodyMeasurements';
import WeeklyDetailsModal from '@/components/progress/WeeklyDetailsModal';
import { 
  TrendingUp, 
  Scale, 
  Camera, 
  Upload, 
  Flame,
  Apple,
  Droplets,
  X
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function Progress() {
  const { user } = useAuthStore() as any;
  const { 
    progressHistory, 
    workouts, 
    nutritionHistory,
    todayNutrition,
    fetchProgressHistory, 
    fetchWorkouts, 
    fetchNutritionHistory,
    fetchTodayNutrition,
    logProgress, 
    uploadProgressPhoto 
  } = useWorkoutStore();

  const [weight, setWeight] = useState('');
  const [bodyFat, setBodyFat] = useState('');
  const [note, setNote] = useState('');
  const [photoUrl, setPhotoUrl] = useState(() => {
    if (typeof window !== 'undefined') return localStorage.getItem('progress_afterPhotoUrl') || '';
    return '';
  });
  const [isUploading, setIsUploading] = useState(false);
  
  const [beforePhotoUrl, setBeforePhotoUrl] = useState(() => {
    if (typeof window !== 'undefined') return localStorage.getItem('progress_beforePhotoUrl') || '';
    return '';
  });
  const [isBeforeUploading, setIsBeforeUploading] = useState(false);

  const [showBurnedModal, setShowBurnedModal] = useState(false);
  const [showConsumedModal, setShowConsumedModal] = useState(false);
  const [showWaterModal, setShowWaterModal] = useState(false);

  useEffect(() => {
    fetchProgressHistory();
    fetchWorkouts();
    fetchNutritionHistory();
    fetchTodayNutrition();
  }, []);

  useEffect(() => {
    if (photoUrl) localStorage.setItem('progress_afterPhotoUrl', photoUrl);
    else localStorage.removeItem('progress_afterPhotoUrl');
  }, [photoUrl]);

  useEffect(() => {
    if (beforePhotoUrl) localStorage.setItem('progress_beforePhotoUrl', beforePhotoUrl);
    else localStorage.removeItem('progress_beforePhotoUrl');
  }, [beforePhotoUrl]);

  const handleLogProgress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!weight) return toast.error('Please enter current weight');

    const res = await logProgress({
      weight: Number(weight),
      bodyFat: Number(bodyFat) || 0,
      note,
    });

    if (res.success) {
      toast.success('Progress parameters logged!');
      setWeight('');
      setBodyFat('');
      setNote('');
    } else {
      toast.error(res.error || 'Failed to log progress.');
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('photo', file);

    setIsUploading(true);
    toast.loading('Uploading progress photo...', { id: 'photo' });

    const res = await uploadProgressPhoto(formData);
    setIsUploading(false);

    if (res.success) {
      setPhotoUrl(res.photoUrl);
      toast.success('Photo uploaded successfully!', { id: 'photo' });
    } else {
      toast.error(res.error || 'Photo upload failed.', { id: 'photo' });
    }
  };

  const handleBeforePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('photo', file);

    setIsBeforeUploading(true);
    toast.loading('Uploading before photo...', { id: 'beforePhoto' });

    const res = await uploadProgressPhoto(formData);
    setIsBeforeUploading(false);

    if (res.success) {
      setBeforePhotoUrl(res.photoUrl);
      toast.success('Before photo uploaded successfully!', { id: 'beforePhoto' });
    } else {
      toast.error(res.error || 'Photo upload failed.', { id: 'beforePhoto' });
    }
  };



  // --- Weekly Aggregation Logic ---
  const now = new Date();
  
  // Calculate start of the week (Last Monday 00:00:00)
  const dayOfWeek = now.getDay(); // 0 is Sunday, 1 is Monday, etc.
  const daysSinceMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - daysSinceMonday);
  startOfWeek.setHours(0, 0, 0, 0);

  const isInCurrentWeek = (dateStr: string) => {
    const d = new Date(dateStr);
    return d >= startOfWeek && d.getDay() !== 0; // Exclude Sunday
  };

  // 1. Weekly Calories Burned (from workouts)
  const weeklyCaloriesBurned = workouts
    ?.filter((w: any) => w.isCompleted && isInCurrentWeek(w.date))
    .reduce((sum: number, w: any) => sum + (w.totalCalories || 0), 0) || 0;

  // 2 & 3. Weekly Calories Consumed & Water Intake
  const allNutritionLogs = [...(nutritionHistory || [])];
  if (todayNutrition && !allNutritionLogs.find(l => new Date(l.date).toDateString() === new Date(todayNutrition.date).toDateString())) {
    allNutritionLogs.push(todayNutrition);
  }

  const currentWeekNutrition = allNutritionLogs.filter((log: any) => isInCurrentWeek(log.date));

  const weeklyCaloriesConsumed = currentWeekNutrition.reduce((sum: number, log: any) => sum + (log.totalCalories || 0), 0);
  const weeklyWaterIntake = currentWeekNutrition.reduce((sum: number, log: any) => sum + (log.waterGlasses || 0), 0);

  // 4. Weekly Forecast
  const totalWeeklyLimit = (user?.caloriesLimit || 2000) * Math.min(6, daysSinceMonday + 1);
  const totalDeficit = totalWeeklyLimit - weeklyCaloriesConsumed + weeklyCaloriesBurned;
  const projectedWeightLoss = (totalDeficit / 7700).toFixed(2);

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 5); // Saturday

  const formatOptions: Intl.DateTimeFormatOptions = { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' };
  const startDateStr = startOfWeek.toLocaleDateString('en-US', formatOptions);
  const endDateStr = endOfWeek.toLocaleDateString('en-US', formatOptions);

  // Helper to generate day-by-day array for a specific metric
  const getWeeklyBreakdownDetails = (metricType: 'burned' | 'consumed' | 'water') => {
    const weekdayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const details = [];

    // Pre-aggregate data by date string
    const dataByDate: { [key: string]: number } = {};
    
    if (metricType === 'burned') {
      workouts?.forEach((w: any) => {
        if (!w.isCompleted || !w.date) return;
        if (isInCurrentWeek(w.date)) {
          const dStr = new Date(w.date).toDateString();
          dataByDate[dStr] = (dataByDate[dStr] || 0) + (w.totalCalories || 0);
        }
      });
    } else if (metricType === 'consumed') {
      currentWeekNutrition.forEach((n: any) => {
        const dStr = new Date(n.date).toDateString();
        dataByDate[dStr] = (dataByDate[dStr] || 0) + (n.totalCalories || 0);
      });
    } else if (metricType === 'water') {
      currentWeekNutrition.forEach((n: any) => {
        const dStr = new Date(n.date).toDateString();
        dataByDate[dStr] = (dataByDate[dStr] || 0) + (n.waterGlasses || 0);
      });
    }

    for (let i = 0; i < 6; i++) {
      const targetDate = new Date(startOfWeek);
      targetDate.setDate(startOfWeek.getDate() + i);
      const dateStr = targetDate.toDateString();
      
      details.push({
        dayName: weekdayNames[i],
        dateStr: targetDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        value: dataByDate[dateStr] || 0
      });
    }
    return details;
  };

  return (
    <div className="space-y-8 pb-12 select-none">
      
      {/* Header */}
      <div>
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-display font-bold text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-accentCyan" />
            <span>Weekly Report</span>
          </h2>
          <span className="text-[10px] font-mono font-bold text-accentCyan bg-accentCyan/10 border border-accentCyan/20 px-3 py-1 rounded-full uppercase tracking-widest">
            {startDateStr} - {endDateStr}
          </span>
        </div>
        <p className="text-xs text-mutedText mt-1">Your aggregated weekly progress, dynamically resetting every Monday at 12:00 AM.</p>
      </div>

      {/* Top Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        
        <Card 
          className="p-5 flex flex-col justify-between space-y-2 border-orange-500/20 bg-gradient-to-br from-[#0F1928] to-[#1a110d] cursor-pointer hover:border-orange-500/50 hover:shadow-[0_0_20px_rgba(249,115,22,0.2)] transition-all"
          onClick={() => setShowBurnedModal(true)}
        >
          <div className="flex items-center gap-1.5">
            <Flame className="w-4 h-4 text-orange-500" />
            <span className="text-[9px] uppercase font-bold text-mutedText tracking-widest">Calorie Burned</span>
          </div>
          <h3 className="text-2xl font-mono font-extrabold text-orange-400">{weeklyCaloriesBurned} <span className="text-[10px] text-mutedText font-sans font-bold uppercase tracking-widest">kcal</span></h3>
          <p className="text-[10px] font-bold text-mutedText font-sans">
            From {workouts?.filter((w: any) => w.isCompleted && isInCurrentWeek(w.date)).length || 0} workouts this week
          </p>
        </Card>

        <Card 
          className="p-5 flex flex-col justify-between space-y-2 border-green-500/20 bg-gradient-to-br from-[#0F1928] to-[#0d1a11] cursor-pointer hover:border-green-500/50 hover:shadow-[0_0_20px_rgba(34,197,94,0.2)] transition-all"
          onClick={() => setShowConsumedModal(true)}
        >
          <div className="flex items-center gap-1.5">
            <Apple className="w-4 h-4 text-green-500" />
            <span className="text-[9px] uppercase font-bold text-mutedText tracking-widest">Calorie Consumed</span>
          </div>
          <h3 className="text-2xl font-mono font-extrabold text-white">{weeklyCaloriesConsumed} <span className="text-[10px] text-mutedText font-sans font-bold uppercase tracking-widest">kcal</span></h3>
          <p className="text-[10px] font-bold text-mutedText font-sans">
            Limit so far: {totalWeeklyLimit} kcal
          </p>
        </Card>

        <Card 
          className="p-5 flex flex-col justify-between space-y-2 border-blue-500/20 bg-gradient-to-br from-[#0F1928] to-[#0d141a] cursor-pointer hover:border-blue-500/50 hover:shadow-[0_0_20px_rgba(59,130,246,0.2)] transition-all"
          onClick={() => setShowWaterModal(true)}
        >
          <div className="flex items-center gap-1.5">
            <Droplets className="w-4 h-4 text-blue-500" />
            <span className="text-[9px] uppercase font-bold text-mutedText tracking-widest">Total Water Intake</span>
          </div>
          <h3 className="text-2xl font-mono font-extrabold text-blue-400">{weeklyWaterIntake} <span className="text-[10px] text-mutedText font-sans font-bold uppercase tracking-widest">glasses</span></h3>
          <p className="text-[10px] font-bold text-mutedText font-sans">
            Goal: {(daysSinceMonday + 1) * 8} glasses so far
          </p>
        </Card>

        <Card className="p-5 flex flex-col justify-between space-y-2 border-purple-500/20 bg-gradient-to-br from-[#0F1928] to-[#160d1a]">
          <div className="flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-purple-500" />
            <span className="text-[9px] uppercase font-bold text-mutedText tracking-widest">Weekly Forecast</span>
          </div>
          <h3 className="text-2xl font-mono font-extrabold text-white">
            {totalDeficit > 0 ? '-' : '+'}{Math.abs(Number(projectedWeightLoss))} <span className="text-[10px] text-mutedText font-sans font-bold uppercase tracking-widest">kg</span>
          </h3>
          <p className={`text-[10px] font-bold font-sans ${totalDeficit > 0 ? 'text-green-400' : 'text-orange-400'}`}>
            Projected fat {totalDeficit > 0 ? 'loss' : 'gain'} by Sunday
          </p>
        </Card>
      </div>

      {/* Premium Features Grid: Radar, Trophy Room, Body Measurements */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Macro Compliance Radar */}
        <Card className="flex flex-col space-y-4">
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Macro Compliance</h3>
            <p className="text-[10px] text-mutedText mt-0.5">Average target hit across all macros</p>
          </div>
          <div className="flex-1 border border-white/5 rounded-2xl bg-white/[0.01]">
            <MacroRadarChart nutritionHistory={nutritionHistory} />
          </div>
        </Card>

        {/* Middle: Trophy Room (Takes 1 col, but stacked items) */}
        <Card className="flex flex-col space-y-4">
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Trophy Room</h3>
            <p className="text-[10px] text-mutedText mt-0.5">Unlock achievements & personal records</p>
          </div>
          <div className="flex-1 overflow-y-auto pr-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] h-[280px]">
            <TrophyRoom workouts={workouts} nutritionHistory={nutritionHistory} />
          </div>
        </Card>

        {/* Right: Body Measurements */}
        <Card className="flex flex-col space-y-4">
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Measurements</h3>
            <p className="text-[10px] text-mutedText mt-0.5">Track your aesthetic progress</p>
          </div>
          <div className="flex-1">
            <BodyMeasurements />
          </div>
        </Card>
      </div>

      {/* GitHub Calendar HeatMap */}
      <Card>
        <HeatMap workouts={workouts} />
      </Card>

      {/* Bottom: Before / After Photo Gallery */}
      <Card className="space-y-6">
        <div>
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">Before / After Gallery</h3>
          <p className="text-[10px] text-mutedText mt-0.5">Visually track body transformation progress metrics.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-2">
          {/* Before Photo Box */}
          <div className="border-2 border-dashed border-white/10 hover:border-cyan/40 bg-white/[0.01] hover:bg-white/[0.02] rounded-2xl p-6 text-center space-y-4 flex flex-col items-center justify-center min-h-60 relative overflow-hidden cursor-pointer transition-colors group">
            {beforePhotoUrl ? (
              <>
                <img 
                  src={beforePhotoUrl} 
                  alt="Before Progress" 
                  className="absolute inset-0 w-full h-full object-cover rounded-2xl group-hover:opacity-30 transition-opacity"
                />
                <div className="absolute inset-0 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20 pointer-events-none">
                  <Camera className="w-8 h-8 text-white mb-2 drop-shadow-md" />
                  <p className="text-xs font-bold text-white uppercase tracking-widest drop-shadow-md">Change Photo</p>
                </div>
                <button 
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); setBeforePhotoUrl(''); }}
                  className="absolute top-3 right-3 bg-red-500/80 hover:bg-red-500 text-white p-1.5 rounded-full z-30 transition-colors"
                  title="Remove Photo"
                >
                  <X className="w-4 h-4" />
                </button>
              </>
            ) : (
              <>
                <Camera className="w-8 h-8 text-mutedText group-hover:text-cyan group-hover:scale-110 transition-transform" />
                <div className="space-y-1">
                  <p className="text-xs font-bold text-white">Upload Before Photo</p>
                  <p className="text-[10px] text-mutedText">Day 1 starting point</p>
                </div>
              </>
            )}
            <input 
              type="file" 
              accept="image/*" 
              onChange={handleBeforePhotoUpload}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              disabled={isBeforeUploading}
            />
          </div>

          {/* After Photo Upload Zone */}
          <div className="border-2 border-dashed border-white/10 hover:border-cyan/40 bg-white/[0.01] hover:bg-white/[0.02] rounded-2xl p-6 text-center space-y-4 flex flex-col items-center justify-center min-h-60 relative overflow-hidden cursor-pointer transition-colors group">
            {photoUrl ? (
              <>
                <img 
                  src={photoUrl} 
                  alt="After Progress" 
                  className="absolute inset-0 w-full h-full object-cover rounded-2xl group-hover:opacity-30 transition-opacity"
                />
                <div className="absolute inset-0 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20 pointer-events-none">
                  <Upload className="w-8 h-8 text-white mb-2 drop-shadow-md" />
                  <p className="text-xs font-bold text-white uppercase tracking-widest drop-shadow-md">Change Photo</p>
                </div>
                <button 
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); setPhotoUrl(''); }}
                  className="absolute top-3 right-3 bg-red-500/80 hover:bg-red-500 text-white p-1.5 rounded-full z-30 transition-colors"
                  title="Remove Photo"
                >
                  <X className="w-4 h-4" />
                </button>
              </>
            ) : (
              <>
                <Upload className="w-8 h-8 text-mutedText group-hover:text-cyan group-hover:scale-110 transition-transform" />
                <div className="space-y-1">
                  <p className="text-xs font-bold text-white">Upload New Photo</p>
                  <p className="text-[10px] text-mutedText">Drag & drop or click to browse</p>
                </div>
              </>
            )}
            <input 
              type="file" 
              accept="image/*" 
              onChange={handlePhotoUpload}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              disabled={isUploading}
            />
          </div>
        </div>
      </Card>

      <WeeklyDetailsModal
        isOpen={showBurnedModal}
        onClose={() => setShowBurnedModal(false)}
        title="Calories Burned Breakdown"
        colorStr="#F97316"
        shadowStr="rgba(249,115,22,0.25)"
        dateRange={`${startDateStr} — ${endDateStr}`}
        details={getWeeklyBreakdownDetails('burned')}
        formatValue={(val: number | string) => `${val} kcal`}
      />

      <WeeklyDetailsModal
        isOpen={showConsumedModal}
        onClose={() => setShowConsumedModal(false)}
        title="Calories Consumed Breakdown"
        colorStr="#22C55E"
        shadowStr="rgba(34,197,94,0.25)"
        dateRange={`${startDateStr} — ${endDateStr}`}
        details={getWeeklyBreakdownDetails('consumed')}
        formatValue={(val: number | string) => `${val} kcal`}
      />

      <WeeklyDetailsModal
        isOpen={showWaterModal}
        onClose={() => setShowWaterModal(false)}
        title="Water Intake Breakdown"
        colorStr="#3B82F6"
        shadowStr="rgba(59,130,246,0.25)"
        dateRange={`${startDateStr} — ${endDateStr}`}
        formatValue={(val: number | string) => `${val} glasses`}
        details={getWeeklyBreakdownDetails('water')}
      />

    </div>
  );
}
