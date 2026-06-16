"use client";
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import useAuthStore from '@/store/authStore';
import useWorkoutStore from '@/store/workoutStore';
import StatCard from '@/components/dashboard/StatCard';
import ScheduleRow from '@/components/dashboard/ScheduleRow';
import WeeklyChart from '@/components/charts/WeeklyChart';
import MacroRing from '@/components/charts/MacroRing';
import Card from '@/components/ui/Card';
import { 
  Rocket, 
  Flame, 
  Dumbbell, 
  Sparkles, 
  TrendingUp, 
  Apple,
  Send,
  Loader2
} from 'lucide-react';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Clock, Activity, CheckCircle, User } from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuthStore() as any;
  const { 
    workouts, 
    todayNutrition, 
    nutritionHistory,
    progressHistory, 
    fetchWorkouts, 
    fetchTodayNutrition, 
    fetchNutritionHistory,
    fetchProgressHistory,
    logWorkout,
    toggleWorkoutComplete
  } = useWorkoutStore() as any;

  // Dynamic Streak Calculation (Active days >= 20 mins)
  const getDynamicStreak = (workoutList: any[]) => {
    const completedByDate: { [key: string]: number } = {};
    workoutList.forEach((w: any) => {
      if (!w.isCompleted || !w.date) return;
      const dateStr = new Date(w.date).toDateString();
      completedByDate[dateStr] = (completedByDate[dateStr] || 0) + (w.duration || 0);
    });

    const activeDates = new Set<string>();
    Object.entries(completedByDate).forEach(([dateStr, duration]) => {
      if (duration >= 20) {
        activeDates.add(dateStr);
      }
    });

    let streak = 0;
    const checkDate = new Date();
    checkDate.setHours(0, 0, 0, 0);

    const todayStr = checkDate.toDateString();
    
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);
    const yesterdayStr = yesterday.toDateString();

    const startFromToday = activeDates.has(todayStr);
    const startFromYesterday = activeDates.has(yesterdayStr);

    if (!startFromToday && !startFromYesterday) {
      return 0;
    }

    let currentDate = startFromToday ? checkDate : yesterday;
    
    while (true) {
      const currentDateStr = currentDate.toDateString();
      if (activeDates.has(currentDateStr)) {
        streak++;
        // Use a new Date instance to prevent mutations inside calculation
        const nextDate = new Date(currentDate);
        nextDate.setDate(nextDate.getDate() - 1);
        currentDate = nextDate;
      } else {
        break;
      }
    }

    return streak;
  };

  const activeStreak = getDynamicStreak(workouts);

  const [selectedWorkout, setSelectedWorkout] = useState<any | null>(null);
  const [showWeeklyModal, setShowWeeklyModal] = useState(false);
  const [showStreakModal, setShowStreakModal] = useState(false);
  const [showFitnessModal, setShowFitnessModal] = useState(false);
  const [showDeficitModal, setShowDeficitModal] = useState(false);
  const [showSundayRestModal, setShowSundayRestModal] = useState(false);

  useEffect(() => {
    const today = new Date();
    if (today.getDay() === 0) { // Sunday
      setShowSundayRestModal(true);
    }
  }, []);

  const handleDismissSunday = () => {
    setShowSundayRestModal(false);
  };

  // Custom Streak Goal Target states
  const [streakGoal, setStreakGoal] = useState(15);
  const [isCustomGoal, setIsCustomGoal] = useState(false);
  const [customGoalInput, setCustomGoalInput] = useState('');
  const presetGoals = [7, 10, 15, 30, 60, 90, 100];

  const isStreakGoalUnlocked = (g: number, streak: number) => {
    if (g <= 7) return true;
    if (g === 10) return streak >= 7;
    if (g === 15) return streak >= 10;
    if (g === 30) return streak >= 15;
    if (g === 60) return streak >= 30;
    if (g === 90) return streak >= 60;
    if (g === 100) return streak >= 90;
    if (g > 7 && g <= 10) return streak >= 7;
    if (g > 10 && g <= 15) return streak >= 10;
    if (g > 15 && g <= 30) return streak >= 15;
    if (g > 30 && g <= 60) return streak >= 30;
    if (g > 60 && g <= 90) return streak >= 60;
    if (g > 90 && g <= 100) return streak >= 90;
    if (g > 100) return streak >= 100;
    return false;
  };

  const getMaxAllowedStreakGoal = (streak: number) => {
    if (streak < 7) return 7;
    if (streak < 10) return 10;
    if (streak < 15) return 15;
    if (streak < 30) return 30;
    if (streak < 60) return 60;
    if (streak < 90) return 90;
    if (streak < 100) return 100;
    return 365;
  };

  const getNextUnlockRequirement = (streak: number) => {
    if (streak < 7) return { nextGoal: 10, requires: 7 };
    if (streak < 10) return { nextGoal: 15, requires: 10 };
    if (streak < 15) return { nextGoal: 30, requires: 15 };
    if (streak < 30) return { nextGoal: 60, requires: 30 };
    if (streak < 60) return { nextGoal: 90, requires: 60 };
    if (streak < 90) return { nextGoal: 100, requires: 90 };
    return null;
  };

  const getDynamicAchievements = (streak: number) => {
    const achievements = [];

    // 1. Streak Achievements
    const streakMilestones = [7, 10, 15, 30, 60, 90, 100];
    const highestStreakM = streakMilestones.slice().reverse().find(m => streak >= m);
    if (highestStreakM) {
      achievements.push({ text: `🔥 ${highestStreakM}-Day Streak Milestone Unlocked!`, time: 'Recent' });
    }
    
    if (streakGoal && streak >= streakGoal && !presetGoals.includes(streakGoal)) {
      achievements.push({ text: `🔥 Custom ${streakGoal}-Day Streak Goal Unlocked!`, time: 'Recent' });
    }

    // 2. Active Minutes all-time
    const totalMinutesAllTime = workouts.filter((w: any) => w.isCompleted).reduce((sum: number, w: any) => sum + (w.duration || 0), 0);
    const minutesMilestones = [100, 200, 500, 1000, 2000, 5000, 10000];
    const highestMinutes = minutesMilestones.slice().reverse().find(m => totalMinutesAllTime >= m);
    if (highestMinutes) {
      achievements.push({ text: `⏱️ ${highestMinutes.toLocaleString()} Active Minutes Achieved!`, time: 'Recent' });
    }

    // 3. Calories Burned all-time
    const totalBurnedAllTime = workouts.filter((w: any) => w.isCompleted).reduce((sum: number, w: any) => sum + (w.totalCalories || 0), 0);
    const burnedMilestones = [500, 1000, 2000, 5000, 10000, 20000, 50000];
    const highestBurned = burnedMilestones.slice().reverse().find(m => totalBurnedAllTime >= m);
    if (highestBurned) {
      achievements.push({ text: `☄️ ${highestBurned.toLocaleString()} kcal Total Burned Milestone!`, time: 'Recent' });
    }

    // 4. Calories Consumed all-time
    const totalConsumedAllTime = (todayNutrition?.totalCalories || 0) + nutritionHistory.reduce((sum: number, n: any) => sum + (n.totalCalories || 0), 0);
    const consumedMilestones = [3000, 5000, 10000, 20000, 50000, 100000];
    const highestConsumed = consumedMilestones.slice().reverse().find(m => totalConsumedAllTime >= m);
    if (highestConsumed) {
      achievements.push({ text: `🍏 ${highestConsumed.toLocaleString()} kcal Total Consumed!`, time: 'Recent' });
    }

    // 5. Workouts completed all-time
    const totalWorkouts = workouts.filter((w: any) => w.isCompleted).length;
    const workoutsMilestones = [1, 5, 10, 25, 50, 100, 250];
    const highestWorkoutM = workoutsMilestones.slice().reverse().find(m => totalWorkouts >= m);
    if (highestWorkoutM) {
      achievements.push({ text: `💪 ${highestWorkoutM} Workouts Completed!`, time: 'Recent' });
    }

    // Fallbacks if not enough achievements
    if (achievements.length === 0) {
      achievements.push({ text: '🏆 Complete your first workout to earn achievements!', time: 'Pending' });
    }

    // Add a static one for flavor if list is short
    if (achievements.length < 5) {
      achievements.push({ text: '🎯 Weekly goal hit 3 weeks in a row', time: 'Last Sunday' });
    }

    return achievements.slice(0, 5); // Return top 5 achievements
  };

  useEffect(() => {
    const stored = localStorage.getItem('fittrack_streak_goal');
    let val = stored ? Number(stored) : 15;

    // Validate if the stored goal is unlocked. If not, fallback to the highest unlocked preset goal.
    if (!isStreakGoalUnlocked(val, activeStreak)) {
      if (activeStreak >= 90) val = 100;
      else if (activeStreak >= 60) val = 90;
      else if (activeStreak >= 30) val = 60;
      else if (activeStreak >= 15) val = 30;
      else if (activeStreak >= 10) val = 15;
      else if (activeStreak >= 7) val = 10;
      else val = 7;
      localStorage.setItem('fittrack_streak_goal', String(val));
    }

    setStreakGoal(val);
    if (!presetGoals.includes(val)) {
      setCustomGoalInput(String(val));
    }
  }, [activeStreak]);

  const handleStreakGoalChange = (newGoal: number) => {
    setStreakGoal(newGoal);
    localStorage.setItem('fittrack_streak_goal', String(newGoal));
  };

  const formatGoalName = (g: string) => {
    if (!g) return '';
    return g.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase());
  };

  useEffect(() => {
    fetchWorkouts();
    fetchTodayNutrition();
    fetchNutritionHistory();
    fetchProgressHistory();
  }, []);

  // Handle 12 AM calendar rollover reset for daily stats and macros breakdown
  useEffect(() => {
    let lastCheckedDate = new Date().toDateString();
    
    const interval = setInterval(() => {
      const currentDate = new Date().toDateString();
      if (currentDate !== lastCheckedDate) {
        lastCheckedDate = currentDate;
        // Trigger re-fetching all daily metrics to reset them to 0 for the new day
        fetchWorkouts();
        fetchTodayNutrition();
        fetchNutritionHistory();
        fetchProgressHistory();
        toast.success('New day started! Your daily progress and macros have reset. 🌅');
      }
    }, 15000); // Check every 15 seconds

    return () => clearInterval(interval);
  }, []);

  // Compute Stats
  const caloriesLimit = user?.caloriesLimit || 2000;
  const caloriesBurnedGoal = user?.caloriesBurnedGoal || 500;
  const caloriesConsumed = todayNutrition?.totalCalories || 0;
  const caloriesRemaining = Math.max(0, caloriesLimit - caloriesConsumed);
  const consumptionPercent = Math.min(100, Math.round((caloriesConsumed / caloriesLimit) * 100));

  // Today's completed workouts helper
  const todayCompletedWorkouts = workouts.filter((w: any) => {
    if (!w.date || !w.isCompleted) return false;
    return new Date(w.date).toDateString() === new Date().toDateString();
  });

  const workoutsCountToday = todayCompletedWorkouts.length;
  const caloriesBurnedToday = todayCompletedWorkouts.reduce((sum: number, w: any) => sum + w.totalCalories, 0);
  const activeMinutesToday = todayCompletedWorkouts.reduce((sum: number, w: any) => sum + w.duration, 0);

  const burnedPercent = Math.min(100, Math.round((caloriesBurnedToday / Math.max(1, caloriesBurnedGoal)) * 100));
  const burnedRemaining = Math.max(0, caloriesBurnedGoal - caloriesBurnedToday);

  // Fallback streaks & score if no progress logs
  const latestProgress = progressHistory[progressHistory.length - 1];
  


  // Dynamic Weekly Sessions calculation (>= 30 mins per day)
  // This calculates weekly sessions from Monday 12:00 AM to Saturday 11:59 PM (excluding Sunday workouts).
  // It automatically resets to zero on Monday 12:00 AM (immediately after Sunday ends).
  const getWeeklySessionsCount = (workoutList: any[]) => {
    const today = new Date();
    const currentDay = today.getDay();
    const daysToSubtract = currentDay === 0 ? 6 : currentDay - 1;
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - daysToSubtract);
    startOfWeek.setHours(0, 0, 0, 0);

    const durationByDate: { [key: string]: number } = {};
    workoutList.forEach((w: any) => {
      if (!w.isCompleted || !w.date) return;
      const wDate = new Date(w.date);
      
      // Exclude Sunday workouts (Sunday = 0)
      if (wDate.getDay() === 0) return;

      if (wDate >= startOfWeek) {
        const dateStr = wDate.toDateString();
        durationByDate[dateStr] = (durationByDate[dateStr] || 0) + (w.duration || 0);
      }
    });

    let sessions = 0;
    Object.values(durationByDate).forEach((duration) => {
      if (duration >= 30) {
        sessions++;
      }
    });
    return sessions;
  };

  const weeklySessions = getWeeklySessionsCount(workouts);

  // Dynamic Weekly Calories Burned calculation
  const getWeeklyCaloriesBurned = (workoutList: any[]) => {
    const today = new Date();
    const currentDay = today.getDay();
    const daysToSubtract = currentDay === 0 ? 6 : currentDay - 1;
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - daysToSubtract);
    startOfWeek.setHours(0, 0, 0, 0);

    let total = 0;
    workoutList.forEach((w: any) => {
      if (!w.isCompleted || !w.date) return;
      const wDate = new Date(w.date);
      // Exclude Sunday workouts (Sunday = 0)
      if (wDate.getDay() === 0) return;
      
      if (wDate >= startOfWeek) {
        total += (w.totalCalories || 0);
      }
    });
    return total;
  };

  const weeklyCaloriesBurned = getWeeklyCaloriesBurned(workouts);

  // Dynamic AI Fitness Score calculation (combining weekly sessions, calories burned, and streak target consistency)
  const calculateFitnessScore = () => {
    const streakTarget = streakGoal || 15;
    const streakPct = Math.min(100, (activeStreak / streakTarget) * 100);
    const sessionPct = Math.min(100, (weeklySessions / 6) * 100);
    const weeklyCalTarget = (caloriesBurnedGoal || 500) * 6;
    const calPct = Math.min(100, (weeklyCaloriesBurned / (weeklyCalTarget || 3000)) * 100);
    
    // Weightings: 40% streak progress, 40% weekly sessions frequency, 20% weekly volume burned
    const score = (streakPct * 0.40) + (sessionPct * 0.40) + (calPct * 0.20);
    return Math.max(10, Math.min(100, Math.round(score)));
  };

  const fitnessScore = calculateFitnessScore();

  const getFitnessScoreDetails = () => {
    const streakTarget = streakGoal || 15;
    const streakPct = Math.min(100, (activeStreak / streakTarget) * 100);
    const sessionPct = Math.min(100, (weeklySessions / 6) * 100);
    const weeklyCalTarget = (caloriesBurnedGoal || 500) * 6;
    const calPct = Math.min(100, (weeklyCaloriesBurned / (weeklyCalTarget || 3000)) * 100);

    return [
      { label: 'Streak Consistency', score: Math.round(streakPct * 0.40), max: 40, pct: Math.round(streakPct), color: '#39FF14' },
      { label: 'Session Frequency', score: Math.round(sessionPct * 0.40), max: 40, pct: Math.round(sessionPct), color: '#C084FC' },
      { label: 'Caloric Output', score: Math.round(calPct * 0.20), max: 20, pct: Math.round(calPct), color: '#00F5FF' }
    ];
  };

  const getStreakSessionDetails = () => {
    const completedByDate: { [key: string]: number } = {};
    workouts.forEach((w: any) => {
      if (!w.isCompleted || !w.date) return;
      const dateStr = new Date(w.date).toDateString();
      completedByDate[dateStr] = (completedByDate[dateStr] || 0) + (w.duration || 0);
    });

    const activeDates = new Set<string>();
    Object.entries(completedByDate).forEach(([dateStr, duration]) => {
      if (duration >= 20) {
        activeDates.add(dateStr);
      }
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const totalDaysToShow = Math.min(streakGoal, 30); // show up to 30 days maximum to not clutter modal
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - totalDaysToShow + 1);

    const details = [];

    for (let i = 0; i < totalDaysToShow; i++) {
      const d = new Date(startDate);
      d.setDate(startDate.getDate() + i);
      const dateStr = d.toDateString();
      const isCompleted = activeDates.has(dateStr);

      let status = 'missed';
      if (isCompleted) {
        status = 'done';
      } else if (d > today) {
        status = 'upcoming';
      } else if (d.getTime() === today.getTime() && !isCompleted) {
        status = 'pending';
      }

      details.push({
        dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
        dateStr: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        status
      });
    }

    return {
      startDate: startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      endDate: today.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      details
    };
  };

  const getWeeklySessionDetails = () => {
    const today = new Date();
    const currentDay = today.getDay();
    const daysToSubtract = currentDay === 0 ? 6 : currentDay - 1;
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - daysToSubtract);
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 5); // Saturday
    endOfWeek.setHours(23, 59, 59, 999);

    const durationByDate: { [key: string]: number } = {};
    workouts.forEach((w: any) => {
      if (!w.isCompleted || !w.date) return;
      const wDate = new Date(w.date);
      if (wDate >= startOfWeek && wDate <= endOfWeek) {
        const dateStr = wDate.toDateString();
        durationByDate[dateStr] = (durationByDate[dateStr] || 0) + (w.duration || 0);
      }
    });

    const weekdayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const details = [];

    for (let i = 0; i < 6; i++) {
      const targetDate = new Date(startOfWeek);
      targetDate.setDate(startOfWeek.getDate() + i);
      const dateStr = targetDate.toDateString();
      const duration = durationByDate[dateStr] || 0;
      
      let status = 'missed';
      if (duration >= 30) {
        status = 'done';
      } else if (targetDate > today) {
        status = 'upcoming';
      } else if (targetDate.toDateString() === today.toDateString() && duration < 30) {
        status = 'pending';
      }

      details.push({
        dayName: weekdayNames[i],
        dateStr: targetDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        duration,
        status
      });
    }

    return {
      startDate: startOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      endDate: endOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      details
    };
  };

  const getWeeklyDeficitDetails = () => {
    const today = new Date();
    const currentDay = today.getDay();
    const daysToSubtract = currentDay === 0 ? 6 : currentDay - 1;
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - daysToSubtract);
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 5); // Up to Saturday
    endOfWeek.setHours(23, 59, 59, 999);
    
    const burnedByDate: { [key: string]: number } = {};
    workouts.forEach((w: any) => {
      if (!w.isCompleted || !w.date) return;
      const wDate = new Date(w.date);
      if (wDate >= startOfWeek && wDate <= endOfWeek) {
        const dateStr = wDate.toDateString();
        burnedByDate[dateStr] = (burnedByDate[dateStr] || 0) + (w.totalCalories || 0);
      }
    });

    const weekdayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const details = [];

    let totalBudget = 0;
    let totalConsumed = 0;

    for (let i = 0; i < 6; i++) {
      const targetDate = new Date(startOfWeek);
      targetDate.setDate(startOfWeek.getDate() + i);
      const dateStr = targetDate.toDateString();
      
      let consumed = 0;
      if (dateStr === new Date().toDateString()) {
        consumed = todayNutrition?.totalCalories || 0;
      } else {
        const histLog = nutritionHistory.find((n: any) => n.date && new Date(n.date).toDateString() === dateStr);
        consumed = histLog ? (histLog.totalCalories || 0) : 0;
      }
      const burned = burnedByDate[dateStr] || 0;
      
      const budgetForDay = Math.round(caloriesLimit + burned);
      let status = 'good';
      if (consumed > budgetForDay) status = 'over';
      if (targetDate > today) status = 'upcoming';
      else if (targetDate.getTime() === today.getTime() && consumed === 0) status = 'pending';

      if (targetDate <= today) {
        totalBudget += budgetForDay;
        totalConsumed += consumed;
      }

      details.push({
        dayName: weekdayNames[i],
        dateStr: targetDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        consumed,
        budget: budgetForDay,
        status
      });
    }

    return {
      startDate: startOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      endDate: endOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      details,
      weeklyDeficit: totalBudget - totalConsumed
    };
  };

  // Construct Monday-to-Saturday weekly chart data with both consumed and burned calories
  // It automatically starts from Monday of the current week and ends on Saturday, resetting every Monday.
  const getWeeklyChartData = () => {
    const data = [];
    const today = new Date();
    const currentDay = today.getDay();
    const daysToSubtract = currentDay === 0 ? 6 : currentDay - 1;
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - daysToSubtract);
    startOfWeek.setHours(0, 0, 0, 0);

    const weekdayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    for (let i = 0; i < 6; i++) {
      const targetDate = new Date(startOfWeek);
      targetDate.setDate(startOfWeek.getDate() + i);
      const dateStr = targetDate.toDateString();
      
      // Calculate burned calories for this day
      const burnedToday = workouts
        .filter((w: any) => w.isCompleted && w.date && new Date(w.date).toDateString() === dateStr)
        .reduce((sum: number, w: any) => sum + (w.totalCalories || 0), 0);
        
      // Calculate consumed calories for this day
      let consumedToday = 0;
      if (dateStr === new Date().toDateString()) {
        consumedToday = todayNutrition?.totalCalories || 0;
      } else {
        const histLog = nutritionHistory.find((n: any) => n.date && new Date(n.date).toDateString() === dateStr);
        consumedToday = histLog ? histLog.totalCalories : 0;
      }
      
      data.push({
        day: weekdayNames[i],
        burned: burnedToday,
        consumed: consumedToday
      });
    }
    
    return data;
  };

  const weeklyChartData = getWeeklyChartData();

  // Meal macro sums
  const protein = todayNutrition?.meals?.reduce((sum: number, m: any) => sum + (m.protein || 0), 0) || 0;
  const carbs = todayNutrition?.meals?.reduce((sum: number, m: any) => sum + (m.carbs || 0), 0) || 0;
  const fat = todayNutrition?.meals?.reduce((sum: number, m: any) => sum + (m.fat || 0), 0) || 0;

  // Filter workouts scheduled for today
  const todayDateObj = new Date();
  const todayWorkouts = workouts.filter((w: any) => {
    if (!w.date) return false;
    const wDate = new Date(w.date);
    return wDate.toDateString() === todayDateObj.toDateString();
  });

  const formatWorkoutTime = (dateString: string) => {
    const d = new Date(dateString);
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  const handleToggleSchedule = async (id: string, currentCompletedStatus: boolean) => {
    const res = await toggleWorkoutComplete(id, !currentCompletedStatus);
    if (res.success) {
      toast.success(res.workout.isCompleted ? 'Workout completed! 🔥' : 'Workout reset to upcoming! ⚡');
    } else {
      toast.error(res.error || 'Failed to update workout status');
    }
  };

  const handleToggleScheduleFromModal = async (id: string, currentCompletedStatus: boolean) => {
    const res = await toggleWorkoutComplete(id, !currentCompletedStatus);
    if (res.success) {
      toast.success(res.workout.isCompleted ? 'Workout completed! 🔥' : 'Workout reset to upcoming! ⚡');
      setSelectedWorkout(res.workout);
    } else {
      toast.error(res.error || 'Failed to update workout status');
    }
  };

  return (
    <div className="space-y-8 pb-12 select-none">
      
      {/* Welcome green/teal banner matching design reference */}
      <div className="rounded-3xl p-8 bg-gradient-to-r from-[#038356] to-[#0A4B3A] border border-white/5 shadow-2xl relative overflow-hidden">
        {/* Abstract blur */}
        <div className="absolute -right-10 -bottom-10 w-44 h-44 bg-cyan/20 blur-[50px] rounded-full pointer-events-none"></div>

        <div className="relative z-10 space-y-4">
          <div className="space-y-1">
            <span className="text-xs font-bold text-white/70 uppercase tracking-widest">Welcome back</span>
            <h2 className="text-3xl font-display font-extrabold text-white">
              Hi there! 👋 <span className="bg-gradient-to-r from-white to-[#C4CDD8] bg-clip-text text-transparent">{user?.name || 'piyushlilhare'}</span>
            </h2>
          </div>

          {/* Motivational quote block inside banner */}
          <div className="inline-flex items-center space-x-2.5 px-4 py-2.5 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-white text-xs font-semibold">
            <Rocket className="w-4 h-4 text-actionGreen animate-bounce" />
            <span>{user?.bio || "Every step counts. You've got this!"}</span>
          </div>
        </div>
      </div>

      {/* Row 1: Dashboard Primary Calorie Card & Side Stats (based on user image layout) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Main Calories Consumed & Burned card */}
        <div className="lg:col-span-8 glass-card border border-white/5 rounded-3xl p-6 flex flex-col justify-between space-y-6 shadow-2xl hover:border-white/10 transition-all">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3.5">
                <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-500">
                  <Apple className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-mutedText tracking-widest">Today Calorie Consumed</span>
                  <h3 className="text-2xl font-mono font-extrabold text-white tracking-tight">{caloriesConsumed}</h3>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-mutedText tracking-widest">Limit</span>
                <p className="text-lg font-mono font-extrabold text-white">{caloriesLimit}</p>
              </div>
            </div>

            {/* Consumption Progress Bar */}
            <div className="space-y-2">
              <div className="w-full h-2 bg-white/[0.03] border border-white/5 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-actionGreen rounded-full transition-all duration-500 shadow-neonGreen"
                  style={{ width: `${consumptionPercent}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-[10px] font-bold tracking-wider uppercase">
                <span className="text-actionGreen">{caloriesRemaining} kcal remaining</span>
                <span className="text-mutedText">{consumptionPercent}%</span>
              </div>
            </div>
          </div>

          {/* Sub Stat: Calories Burned */}
          <div className="pt-4 border-t border-white/5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500">
                  <Flame className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-mutedText tracking-widest">Today Calorie Burned</p>
                  <p className="text-sm font-mono font-extrabold text-white">{caloriesBurnedToday} kcal</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-mutedText tracking-widest">Goal</span>
                <p className="text-sm font-mono font-bold text-white">{caloriesBurnedGoal} kcal</p>
              </div>
            </div>

            {/* Burn Progress Bar */}
            <div className="space-y-2">
              <div className="w-full h-2 bg-white/[0.03] border border-white/5 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-red-500 rounded-full transition-all duration-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]"
                  style={{ width: `${burnedPercent}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-[10px] font-bold tracking-wider uppercase">
                <span className="text-red-500">{burnedRemaining} kcal to burn</span>
                <span className="text-mutedText">{burnedPercent}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Column of Active Minutes & Workouts Count */}
        <div className="lg:col-span-4 flex flex-col justify-between gap-6">
          {/* Active card */}
          <Card className="flex-1 flex items-center space-x-4 p-5 hover:border-cyan/20">
            <div className="w-10 h-10 rounded-xl bg-cyan/15 border border-cyan/20 flex items-center justify-center text-[#00F5FF]">
              <TrendingUp className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <span className="text-[9px] uppercase font-bold text-mutedText tracking-widest">Active</span>
              <h4 className="text-xl font-mono font-extrabold text-white">{activeMinutesToday}</h4>
              <p className="text-[10px] text-mutedText">minutes today</p>
            </div>
          </Card>

          {/* Workouts card */}
          <Card className="flex-1 flex items-center space-x-4 p-5 hover:border-purple-500/25">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <Dumbbell className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[9px] uppercase font-bold text-mutedText tracking-widest">Workouts</span>
              <h4 className="text-xl font-mono font-extrabold text-white">{workoutsCountToday}</h4>
              <p className="text-[10px] text-mutedText">completed today</p>
            </div>
          </Card>
        </div>
      </div>

      {/* Row 2: Standard Bento Stat cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div 
          className={`relative h-full transition-all ${showStreakModal ? 'z-[100]' : 'z-20'}`}
          onMouseEnter={() => setShowStreakModal(true)} 
          onMouseLeave={() => setShowStreakModal(false)}
        >
          <Card className="flex items-center justify-between p-5 relative overflow-hidden h-full">
            <div className="space-y-1.5 z-10 flex-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold text-mutedText tracking-widest">Streak</span>
              </div>
              <h3 className="text-2xl font-mono font-extrabold text-white tracking-tight">
                {activeStreak} / {streakGoal} Days 🔥
              </h3>
            <p className="text-[10px] font-semibold text-mutedText">
              {activeStreak >= streakGoal ? (
                <span className="text-[#39FF14] drop-shadow-neonGreen">Goal Hit! 🏆</span>
              ) : (
                <span>{streakGoal - activeStreak} days left</span>
              )}
            </p>
          </div>

          <div className="flex flex-col items-center justify-center z-10 ml-4">
            <div className="relative w-14 h-14 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="28"
                  cy="28"
                  r="22"
                  stroke="rgba(255,255,255,0.04)"
                  strokeWidth="4"
                  fill="transparent"
                />
                <circle
                  cx="28"
                  cy="28"
                  r="22"
                  stroke="#39FF14"
                  strokeWidth="4"
                  fill="transparent"
                  strokeDasharray={138}
                  strokeDashoffset={138 - (138 * Math.min(100, Math.round((activeStreak / streakGoal) * 100))) / 100}
                  strokeLinecap="round"
                  className="transition-all duration-500"
                />
              </svg>
              <span className="absolute text-[10px] font-mono font-bold text-white">
                {Math.min(100, Math.round((activeStreak / streakGoal) * 100))}%
              </span>
            </div>
          </div>
        </Card>
        
        {/* Streak Details Modal - full screen layout, aligned to the left */}
        <AnimatePresence>
          {showStreakModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-start p-4 md:p-8 pointer-events-none">
              {/* Full screen backdrop blur */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-[#050510]/90 backdrop-blur-[40px] pointer-events-none"
              ></motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.95, x: -30 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.95, x: -30 }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="relative w-full max-w-md z-10 bg-[#0B121F]/95 border border-white/10 hover:border-[#39FF14]/35 rounded-3xl p-6 shadow-[0_25px_60px_-15px_rgba(57,255,20,0.25)] flex flex-col space-y-5 pointer-events-auto ml-4 sm:ml-12 lg:ml-20"
              >
                <div className="flex flex-col border-b border-white/10 pb-3">
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <span className="text-[#39FF14]">Streak Details</span>
                  </h3>
                  <p className="text-[10px] text-mutedText mt-1 font-mono">
                    {getStreakSessionDetails().startDate} — {getStreakSessionDetails().endDate}
                  </p>
                </div>

                {/* Set Goal section */}
                <div className="bg-white/[0.02] border border-white/5 p-3 rounded-xl flex flex-col space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-mutedText tracking-widest">Set Goal</span>
                    {isCustomGoal ? (
                      <div className="flex items-center space-x-1">
                        <input
                          type="number"
                          min="1"
                          max="365"
                          value={customGoalInput}
                          onChange={(e) => setCustomGoalInput(e.target.value)}
                          onBlur={() => {
                            const maxAllowed = getMaxAllowedStreakGoal(activeStreak);
                            const numVal = Number(customGoalInput) || 7;
                            if (numVal > maxAllowed) {
                              toast.error(`Goal locked! You must first achieve a ${maxAllowed === 7 ? '7' : maxAllowed === 10 ? '10' : maxAllowed === 15 ? '15' : maxAllowed === 30 ? '30' : maxAllowed === 60 ? '60' : maxAllowed === 90 ? '90' : '100'}-day streak goal.`);
                              handleStreakGoalChange(maxAllowed);
                            } else {
                              handleStreakGoalChange(Math.max(1, numVal));
                            }
                            setIsCustomGoal(false);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              const maxAllowed = getMaxAllowedStreakGoal(activeStreak);
                              const numVal = Number(customGoalInput) || 7;
                              if (numVal > maxAllowed) {
                                toast.error(`Goal locked! You must first achieve a ${maxAllowed === 7 ? '7' : maxAllowed === 10 ? '10' : maxAllowed === 15 ? '15' : maxAllowed === 30 ? '30' : maxAllowed === 60 ? '60' : maxAllowed === 90 ? '90' : '100'}-day streak goal.`);
                                handleStreakGoalChange(maxAllowed);
                              } else {
                                handleStreakGoalChange(Math.max(1, numVal));
                              }
                              setIsCustomGoal(false);
                            }
                          }}
                          className="w-12 bg-[#0F1928] border border-white/10 rounded px-1.5 py-0.5 text-[9px] text-white focus:outline-none focus:border-[#39FF14]/30"
                          autoFocus
                        />
                        <span className="text-[8px] text-mutedText">days</span>
                      </div>
                    ) : (
                      <select
                        value={presetGoals.includes(streakGoal) ? streakGoal : 'custom'}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === 'custom') {
                            setIsCustomGoal(true);
                            setCustomGoalInput(String(streakGoal));
                          } else {
                            handleStreakGoalChange(Number(val));
                          }
                        }}
                        className="bg-[#0F1928]/80 border border-white/5 focus:border-[#39FF14]/30 rounded px-1.5 py-0.5 text-[9px] font-bold text-white focus:outline-none cursor-pointer max-w-[150px]"
                      >
                        <option value={7}>7d Goal</option>
                        <option value={10} disabled={!isStreakGoalUnlocked(10, activeStreak)}>
                          10d Goal {!isStreakGoalUnlocked(10, activeStreak) ? '🔒 (Needs 7d streak)' : '🔓'}
                        </option>
                        <option value={15} disabled={!isStreakGoalUnlocked(15, activeStreak)}>
                          15d Goal {!isStreakGoalUnlocked(15, activeStreak) ? '🔒 (Needs 10d streak)' : '🔓'}
                        </option>
                        <option value={30} disabled={!isStreakGoalUnlocked(30, activeStreak)}>
                          30d Goal {!isStreakGoalUnlocked(30, activeStreak) ? '🔒 (Needs 15d streak)' : '🔓'}
                        </option>
                        <option value={60} disabled={!isStreakGoalUnlocked(60, activeStreak)}>
                          60d Goal {!isStreakGoalUnlocked(60, activeStreak) ? '🔒 (Needs 30d streak)' : '🔓'}
                        </option>
                        <option value={90} disabled={!isStreakGoalUnlocked(90, activeStreak)}>
                          90d Goal {!isStreakGoalUnlocked(90, activeStreak) ? '🔒 (Needs 60d streak)' : '🔓'}
                        </option>
                        <option value={100} disabled={!isStreakGoalUnlocked(100, activeStreak)}>
                          100d Goal {!isStreakGoalUnlocked(100, activeStreak) ? '🔒 (Needs 90d streak)' : '🔓'}
                        </option>
                        <option value="custom">Custom...</option>
                      </select>
                    )}
                  </div>
                  {getNextUnlockRequirement(activeStreak) && (
                    <div className="pt-2 border-t border-white/5 flex items-center gap-1.5 text-[9px] text-cyan font-bold">
                      <span>🔒</span>
                      <span>Next: {getNextUnlockRequirement(activeStreak)?.nextGoal}d Goal requires {getNextUnlockRequirement(activeStreak)?.requires}d streak (Current: {activeStreak}d)</span>
                    </div>
                  )}
                </div>

                <div className="max-h-56 overflow-y-auto space-y-2 pr-2 scrollbar-thin">
                  {getStreakSessionDetails().details.map((day: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between p-2 rounded-xl bg-white/[0.02] border border-white/5">
                      <div className="flex items-center gap-2">
                        <div className={`w-1.5 h-1.5 rounded-full ${
                          day.status === 'done' ? 'bg-[#39FF14] shadow-[0_0_10px_#39FF14]' : 
                          day.status === 'missed' ? 'bg-red-500 shadow-[0_0_10px_#EF4444]' : 
                          day.status === 'upcoming' ? 'bg-white/20' : 'bg-yellow-500'
                        }`}></div>
                        <div>
                          <p className="text-xs font-bold text-white uppercase">{day.dayName}</p>
                          <p className="text-[9px] text-mutedText font-mono">{day.dateStr}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        {day.status === 'done' && (
                          <span className="inline-flex items-center gap-1 text-[9px] font-bold text-[#39FF14] bg-[#39FF14]/10 px-2 py-0.5 rounded border border-[#39FF14]/20">
                            COMPLETED
                          </span>
                        )}
                        {day.status === 'missed' && (
                          <span className="inline-flex items-center gap-1 text-[9px] font-bold text-red-500 bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20">
                            BROKEN
                          </span>
                        )}
                        {day.status === 'pending' && (
                          <span className="inline-flex items-center gap-1 text-[9px] font-bold text-yellow-500 bg-yellow-500/10 px-2 py-0.5 rounded border border-yellow-500/20">
                            PENDING
                          </span>
                        )}
                        {day.status === 'upcoming' && (
                          <span className="inline-flex items-center gap-1 text-[9px] font-bold text-mutedText bg-white/[0.04] px-2 py-0.5 rounded border border-white/10">
                            UPCOMING
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-2 text-center border-t border-white/5">
                  <p className="text-[9px] text-mutedText mt-2">Streaks require at least 20 logged minutes daily.</p>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
        </div>
        <div className={`relative h-full transition-all ${showWeeklyModal ? 'z-[100]' : 'z-20'}`} onMouseEnter={() => setShowWeeklyModal(true)} onMouseLeave={() => setShowWeeklyModal(false)}>
          <StatCard title="Weekly Workouts" value={`${weeklySessions} / 6`} subtext="target 6 sessions" progress={Math.round((weeklySessions / 6) * 100)} progressColor="#C084FC" />
          
          {/* Weekly Details Modal - full screen, centered layout */}
          <AnimatePresence>
            {showWeeklyModal && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 pointer-events-none">
                {/* Full screen backdrop blur */}
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-[#050510]/90 backdrop-blur-[40px] pointer-events-none"
                ></motion.div>

                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 20 }}
                  transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                  className="relative w-full max-w-md z-10 bg-[#0B121F]/95 border border-white/10 hover:border-[#C084FC]/35 rounded-3xl p-6 shadow-[0_25px_60px_-15px_rgba(192,132,252,0.25)] flex flex-col space-y-4 pointer-events-auto"
                >
                  <div className="flex flex-col border-b border-white/10 pb-3">
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                      <span className="text-[#C084FC]">Weekly Sessions</span>
                    </h3>
                    <p className="text-[10px] text-mutedText mt-1 font-mono">
                      {getWeeklySessionDetails().startDate} — {getWeeklySessionDetails().endDate}
                    </p>
                    <p className="text-[9px] text-mutedText mt-2 leading-relaxed">
                      * A session is marked as <strong className="text-[#39FF14]">COMPLETED</strong> if you log a minimum of 30 active workout minutes in a single day.
                    </p>
                  </div>

                  <div className="space-y-2">
                    {getWeeklySessionDetails().details.map((day: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between p-2 rounded-xl bg-white/[0.02] border border-white/5">
                        <div className="flex items-center gap-2">
                          <div className={`w-1.5 h-1.5 rounded-full ${
                            day.status === 'done' ? 'bg-[#39FF14] shadow-[0_0_10px_#39FF14]' : 
                            day.status === 'missed' ? 'bg-red-500 shadow-[0_0_10px_#EF4444]' : 
                            day.status === 'upcoming' ? 'bg-white/20' : 'bg-yellow-500'
                          }`}></div>
                          <div>
                            <p className="text-xs font-bold text-white uppercase">{day.dayName}</p>
                            <p className="text-[9px] text-mutedText font-mono">{day.dateStr}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          {day.status === 'done' && (
                            <span className="inline-flex items-center gap-1 text-[9px] font-bold text-[#39FF14] bg-[#39FF14]/10 px-2 py-0.5 rounded border border-[#39FF14]/20">
                              COMPLETED
                            </span>
                          )}
                          {day.status === 'missed' && (
                            <span className="inline-flex items-center gap-1 text-[9px] font-bold text-red-500 bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20">
                              MISSED
                            </span>
                          )}
                          {day.status === 'pending' && (
                            <span className="inline-flex items-center gap-1 text-[9px] font-bold text-yellow-500 bg-yellow-500/10 px-2 py-0.5 rounded border border-yellow-500/20">
                              PENDING
                            </span>
                          )}
                          {day.status === 'upcoming' && (
                            <span className="inline-flex items-center gap-1 text-[9px] font-bold text-mutedText bg-white/[0.04] px-2 py-0.5 rounded border border-white/10">
                              UPCOMING
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </div>

        <div className={`relative h-full transition-all ${showFitnessModal ? 'z-[100]' : 'z-20'}`} onMouseEnter={() => setShowFitnessModal(true)} onMouseLeave={() => setShowFitnessModal(false)}>
          <StatCard title="AI Fitness Score" value={`${fitnessScore} / 100`} subtext="calculated weekly" progress={fitnessScore} progressColor="#00F5FF" />
          
          {/* AI Fitness Score Modal - full screen, centered layout */}
          <AnimatePresence>
            {showFitnessModal && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 pointer-events-none">
                {/* Full screen backdrop blur */}
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-[#050510]/90 backdrop-blur-[40px] pointer-events-none"
                ></motion.div>

                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 20 }}
                  transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                  className="relative w-full max-w-md z-10 bg-[#0B121F]/95 border border-white/10 hover:border-[#00F5FF]/35 rounded-3xl p-6 shadow-[0_25px_60px_-15px_rgba(0,245,255,0.25)] flex flex-col space-y-4 pointer-events-auto"
                >
                  <div className="flex flex-col border-b border-white/10 pb-3">
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                      <span className="text-[#00F5FF]">Score Breakdown</span>
                    </h3>
                    <p className="text-[10px] text-mutedText mt-1 font-mono">
                      Total: {fitnessScore} / 100
                    </p>
                  </div>

                  <div className="max-h-56 overflow-y-auto space-y-3 pr-2 scrollbar-thin">
                    {getFitnessScoreDetails().map((stat: any, idx: number) => (
                      <div key={idx} className="space-y-1">
                        <div className="flex justify-between items-end">
                          <p className="text-xs font-bold text-white">{stat.label}</p>
                          <span className="text-[10px] text-mutedText font-mono">{stat.score} / {stat.max}</span>
                        </div>
                        <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                          <div 
                            className="h-full rounded-full" 
                            style={{ width: `${(stat.score / stat.max) * 100}%`, backgroundColor: stat.color, boxShadow: `0 0 10px ${stat.color}` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="pt-2 text-center border-t border-white/5">
                    <p className="text-[9px] text-mutedText mt-2">Dynamic algorithm weights streak goals and caloric output.</p>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </div>

        <div className={`relative h-full transition-all ${showDeficitModal ? 'z-[100]' : 'z-20'}`} onMouseEnter={() => setShowDeficitModal(true)} onMouseLeave={() => setShowDeficitModal(false)}>
          <StatCard title="Deficit Stats" value={`${caloriesRemaining} kcal`} subtext="remaining budget" progress={consumptionPercent} progressColor="#39FF14" />
          
          {/* Deficit Stats Modal - full screen, aligned to the right */}
          <AnimatePresence>
            {showDeficitModal && (
              <div className="fixed inset-0 z-[100] flex items-center justify-end p-4 md:p-8 pointer-events-none">
                {/* Full screen backdrop blur */}
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-[#050510]/90 backdrop-blur-[40px] pointer-events-none"
                ></motion.div>

                <motion.div
                  initial={{ opacity: 0, scale: 0.95, x: 30 }}
                  animate={{ opacity: 1, scale: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.95, x: 30 }}
                  transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                  className="relative w-full max-w-md z-10 bg-[#0B121F]/95 border border-white/10 hover:border-[#39FF14]/35 rounded-3xl p-6 shadow-[0_25px_60px_-15px_rgba(57,255,20,0.25)] flex flex-col space-y-4 pointer-events-auto mr-4 sm:mr-12 lg:mr-20"
                >
                  <div className="flex flex-col border-b border-white/10 pb-3">
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                      <span className="text-[#39FF14]">Weekly Deficit</span>
                    </h3>
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] text-mutedText mt-1 font-mono">
                        {getWeeklyDeficitDetails().startDate} — {getWeeklyDeficitDetails().endDate}
                      </p>
                      <p className={`text-xs font-bold ${getWeeklyDeficitDetails().weeklyDeficit >= 0 ? 'text-[#39FF14]' : 'text-red-500'}`}>
                        {getWeeklyDeficitDetails().weeklyDeficit >= 0 ? '+' : ''}{getWeeklyDeficitDetails().weeklyDeficit} kcal
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {getWeeklyDeficitDetails().details.map((day: any, idx: number) => (
                      <div key={idx} className="flex flex-col p-2 rounded-xl bg-white/[0.02] border border-white/5 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className={`w-1.5 h-1.5 rounded-full ${
                              day.status === 'good' ? 'bg-[#39FF14]' : 
                              day.status === 'over' ? 'bg-red-500' : 
                              day.status === 'upcoming' ? 'bg-white/20' : 'bg-yellow-500'
                            }`}></div>
                            <span className="text-xs font-bold text-white">{day.dayName}</span>
                          </div>
                          <span className="text-[9px] text-mutedText font-mono">Limit: {day.budget}</span>
                        </div>
                        
                        <div className="flex items-end gap-2">
                          <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                            <div 
                              className="h-full rounded-full transition-all" 
                              style={{ 
                                width: `${Math.min(100, (day.consumed / Math.max(1, day.budget)) * 100)}%`, 
                                backgroundColor: day.status === 'over' ? '#EF4444' : day.status === 'upcoming' || day.status === 'pending' ? 'rgba(255,255,255,0.2)' : '#39FF14' 
                              }}
                            ></div>
                          </div>
                          <span className={`text-[10px] font-bold font-mono ${day.status === 'over' ? 'text-red-500' : 'text-white'}`}>
                            {day.consumed}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Row 3: Today's Planner Schedule */}
      <Card className="space-y-6">
        <div className="flex items-center justify-between border-b border-white/5 pb-3">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Today's Schedule</h3>
            <p className="text-[10px] text-mutedText mt-0.5">Click to toggle workout completion status directly in database</p>
          </div>
          <span className="text-[10px] font-bold text-cyan bg-cyan/10 px-3 py-1 rounded-full border border-cyan/20">
            {todayWorkouts.filter((s: any) => s.isCompleted).length} / {todayWorkouts.length} Active
          </span>
        </div>

        {todayWorkouts.length > 0 ? (
          <div className="space-y-3">
            {todayWorkouts.map((item: any) => (
              <ScheduleRow 
                key={item._id} 
                time={formatWorkoutTime(item.date)} 
                name={item.name} 
                duration={item.duration} 
                status={item.isCompleted ? 'completed' : 'upcoming'} 
                isAI={item.isGenerated}
                goal={item.goal}
                fitnessLevel={item.fitnessLevel}
                onClick={() => setSelectedWorkout(item)}
                onToggle={() => handleToggleSchedule(item._id, item.isCompleted)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-8 px-4 border border-dashed border-white/5 rounded-2xl bg-white/[0.01] flex flex-col items-center justify-center space-y-3">
            <p className="text-xs text-mutedText font-semibold">No workouts scheduled for today.</p>
            <Link 
              href="/dashboard/workouts" 
              className="px-4 py-2 rounded-full text-[10px] font-bold text-bg bg-actionGreen hover:bg-actionGreen/90 transition-all hover:scale-105 glow-green"
            >
              Generate AI Workout Plan
            </Link>
          </div>
        )}
      </Card>

      {/* Row 4: Weekly Progress Chart (Coach Widget removed) */}
      <div className="w-full">
        <Card className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Weekly Calorie Deficit</h3>
              <p className="text-[10px] text-mutedText mt-0.5">Calories burned from completed activities</p>
            </div>
            <span className="text-[10px] font-bold text-actionGreen">
              Goal hit 3 weeks in a row
            </span>
          </div>
          <WeeklyChart data={weeklyChartData} />
        </Card>
      </div>

      {/* Row 5: Split (50/50) - Nutrition Summary ring chart & Recent Achievements */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Left: Nutrition Summary Ring Chart */}
        <Card className="space-y-6">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Macros Breakdown</h3>
            <p className="text-[10px] text-mutedText mt-0.5">Calculated protein, carbs, and fat target percentages</p>
          </div>
          <MacroRing protein={protein} carbs={carbs} fat={fat} />
        </Card>

        {/* Right: Recent Achievements */}
        <Card className="space-y-4">
          <div className="border-b border-white/5 pb-3">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Recent Achievements</h3>
            <p className="text-[10px] text-mutedText mt-0.5">Activity records, milestones, and challenges hit</p>
          </div>

          <div className="space-y-3.5 pt-2">
            {getDynamicAchievements(activeStreak).map((ach, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.01] border border-white/5">
                <span className="text-xs font-semibold text-white">{ach.text}</span>
                <span className="text-[9px] font-mono text-mutedText">{ach.time}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* 3D Hover Pop-up Modal */}
      <AnimatePresence>
        {selectedWorkout && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop blur */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedWorkout(null)}
              className="absolute inset-0 bg-[#050510]/80 backdrop-blur-md"
            ></motion.div>

            {/* Modal container */}
            <div className="relative w-full max-w-lg z-10">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ type: 'spring', damping: 25, stiffness: 250 }}
                className="w-full bg-[#0B121F]/95 border border-white/10 hover:border-[#00F5FF]/35 rounded-3xl p-6 md:p-8 shadow-[0_25px_60px_-15px_rgba(0,245,255,0.25)] flex flex-col space-y-6 transition-all duration-300 font-sans cursor-default"
              >
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-1.5">
                      <span className="text-[9px] uppercase font-bold text-cyan bg-cyan/10 px-2.5 py-1 rounded-full border border-cyan/25 inline-flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-cyan" /> {selectedWorkout.isGenerated ? 'AI Generated Workout' : 'Custom Routine'}
                      </span>
                    </div>
                    
                    <h3 className="text-xl font-bold text-white mt-1.5 leading-tight">
                      {selectedWorkout.name}
                    </h3>
                    
                    <p className="text-[10px] text-mutedText font-semibold flex flex-wrap items-center gap-2 mt-1">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-mutedText" /> {selectedWorkout.duration} mins
                      </span>
                      <span className="w-1 h-1 rounded-full bg-white/20"></span>
                      <span className="flex items-center gap-1">
                        <Flame className="w-3.5 h-3.5 text-orange-500" /> {selectedWorkout.totalCalories} kcal
                      </span>
                      {selectedWorkout.goal && (
                        <>
                          <span className="w-1 h-1 rounded-full bg-white/20"></span>
                          <span className="flex items-center gap-1">
                            <TrendingUp className="w-3.5 h-3.5 text-orange-400" /> {formatGoalName(selectedWorkout.goal)}
                          </span>
                        </>
                      )}
                      {selectedWorkout.fitnessLevel && (
                        <>
                          <span className="w-1 h-1 rounded-full bg-white/20"></span>
                          <span className="flex items-center gap-1">
                            <User className="w-3.5 h-3.5 text-purple-400" /> {selectedWorkout.fitnessLevel}
                          </span>
                        </>
                      )}
                    </p>
                  </div>

                  <button 
                    onClick={() => setSelectedWorkout(null)}
                    className="p-2 rounded-xl bg-white/[0.03] border border-white/5 text-mutedText hover:text-white hover:bg-white/[0.08] transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Exercises List */}
                <div className="space-y-4">
                  <h4 className="text-[10px] uppercase font-bold text-mutedText tracking-wider flex items-center gap-2">
                    <Activity className="w-3.5 h-3.5 text-cyan" /> Workout Checklist
                  </h4>

                  {selectedWorkout.exercises && selectedWorkout.exercises.length > 0 ? (
                    <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                      {selectedWorkout.exercises.map((ex: any, idx: number) => (
                        <motion.div 
                          key={ex._id || idx}
                          whileHover={{ scale: 1.015, translateZ: '15px' }}
                          className="p-3.5 rounded-2xl bg-white/[0.01] border border-white/5 flex items-center justify-between hover:bg-white/[0.03] hover:border-cyan/25 transition-all duration-200"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 rounded-lg bg-cyan/10 border border-cyan/20 flex items-center justify-center text-cyan font-bold text-xs font-mono">
                              {idx + 1}
                            </div>
                            <div>
                              <p className="text-xs font-bold text-white tracking-wide">{ex.name}</p>
                              <p className="text-[10px] text-mutedText mt-0.5">
                                {ex.duration > 0 ? `${ex.duration} mins` : `${ex.sets} sets x ${ex.reps} reps`}
                              </p>
                            </div>
                          </div>
                          {ex.weight > 0 && (
                            <span className="text-[10px] font-mono font-bold text-[#39FF14] bg-[#39FF14]/10 px-2 py-0.5 rounded border border-[#39FF14]/20">
                              {ex.weight} kg
                            </span>
                          )}
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-mutedText text-center py-6">No specific exercises generated for this routine.</p>
                  )}
                </div>

                {/* Footer Controls */}
                <div className="pt-4 border-t border-white/5 flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => handleToggleScheduleFromModal(selectedWorkout._id, selectedWorkout.isCompleted)}
                    className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all duration-200 flex items-center justify-center gap-2 border ${
                      selectedWorkout.isCompleted 
                        ? 'bg-white/[0.02] border-white/10 text-mutedText hover:bg-white/[0.05]'
                        : 'bg-[#39FF14] border-transparent text-[#050510] hover:bg-[#39FF14]/90 hover:scale-[1.01] glow-green'
                    }`}
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>{selectedWorkout.isCompleted ? 'Reset to Upcoming' : 'Mark as Completed'}</span>
                  </button>
                  <button
                    onClick={() => setSelectedWorkout(null)}
                    className="py-3 px-6 rounded-xl text-xs font-bold bg-[#0F1928] border border-white/5 hover:border-white/15 text-white transition-all"
                  >
                    Close Details
                  </button>
                </div>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Sunday Rest Day Full Screen Modal */}
      <AnimatePresence>
        {showSundayRestModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-[#0A0F16]/95 backdrop-blur-xl flex flex-col items-center justify-center p-6"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-[#121A25] border border-white/10 rounded-3xl p-10 max-w-2xl w-full text-center shadow-[0_0_100px_rgba(0,0,0,0.8)] relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#39FF14] via-cyan-500 to-[#C084FC]" />
              
              <div className="w-24 h-24 mx-auto bg-gradient-to-br from-[#39FF14]/20 to-cyan-500/20 rounded-full flex items-center justify-center mb-8 border border-white/5">
                <span className="text-5xl">🧘‍♂️</span>
              </div>
              
              <h1 className="text-4xl md:text-5xl font-display font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-white/60 mb-4 tracking-tight">
                Today is Sunday.
              </h1>
              
              <h2 className="text-2xl md:text-3xl font-bold text-accentCyan mb-6">
                Your Official Rest Day.
              </h2>
              
              <div className="space-y-6 mb-10 max-w-xl mx-auto">
                <p className="text-lg text-mutedText leading-relaxed">
                  Take it easy today, stay hydrated, take some cheat meal and enjoy your time off.
                </p>
                
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-start gap-3 text-left shadow-[0_0_15px_rgba(239,68,68,0.15)]">
                  <Activity className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
                  <p className="text-sm text-red-100/90 leading-relaxed font-medium">
                    <span className="text-red-500 font-black uppercase tracking-wide">Note:</span> Today's calories consumed, calories burned, water intake, and any weekly sessions are strictly excluded from your weekly reports and progress tracking.
                  </p>
                </div>
              </div>
              
              <button 
                onClick={handleDismissSunday}
                className="px-10 py-4 bg-white text-black hover:bg-gray-200 rounded-full font-bold text-lg tracking-wide transition-all hover:scale-105 active:scale-95 glow-white shadow-[0_0_20px_rgba(255,255,255,0.4)]"
              >
                I Understand, Continue to Dashboard
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
