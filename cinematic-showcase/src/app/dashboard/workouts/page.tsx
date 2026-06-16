"use client";
import React, { useState, useEffect } from 'react';
import useWorkoutStore from '@/store/workoutStore';
import Card from '@/components/ui/Card';
import { 
  Sparkles, 
  Dumbbell, 
  Clock, 
  User, 
  TrendingUp, 
  Save, 
  Flame,
  Loader2,
  Trash2,
  ChevronDown,
  ChevronUp,
  Play
} from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

export default function Workouts() {
  const { workouts, generateWorkout, logWorkout, deleteWorkout, isGeneratingWorkout, fetchWorkouts } = useWorkoutStore() as any;
  
  const formatGoalName = (g: string) => {
    if (!g) return '';
    return g.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase());
  };

  // Form parameters
  const [goal, setGoal] = useState('lose_weight');
  const [time, setTime] = useState(30);
  const [fitnessLevel, setFitnessLevel] = useState('intermediate');
  const [equipment, setEquipment] = useState(['Bodyweight']);
  const [customEquip, setCustomEquip] = useState('');
  const [equipmentOptions, setEquipmentOptions] = useState([
    'Bodyweight', 'Dumbbells', 'Barbell', 'Kettlebell', 'Resistance Bands', 'Full Gym'
  ]);

  const [isScheduled, setIsScheduled] = useState(false);
  const [expandedWorkoutId, setExpandedWorkoutId] = useState<string | null>(null);
  const [expandedGenExerciseIdx, setExpandedGenExerciseIdx] = useState<number | null>(null);
  const [expandedHistoryExId, setExpandedHistoryExId] = useState<string | null>(null);

  // Fetch history and restore daily plan on mount with dynamic 12 AM check
  useEffect(() => {
    fetchWorkouts();

    const checkAndRestorePlan = () => {
      const stored = localStorage.getItem('fittrack_today_plan');
      if (stored) {
        try {
          const { date, plan, scheduled } = JSON.parse(stored);
          const todayStr = new Date().toDateString();
          if (date === todayStr) {
            setGeneratedPlan(plan);
            setIsScheduled(!!scheduled);
          } else {
            localStorage.removeItem('fittrack_today_plan');
            setGeneratedPlan(null);
            setIsScheduled(false);
          }
        } catch (e) {
          localStorage.removeItem('fittrack_today_plan');
          setGeneratedPlan(null);
          setIsScheduled(false);
        }
      } else {
        setGeneratedPlan(null);
        setIsScheduled(false);
      }
    };

    checkAndRestorePlan();

    // Check every 15 seconds to dynamically reset at 12 AM
    const interval = setInterval(checkAndRestorePlan, 15000);
    return () => clearInterval(interval);
  }, []);

  // Generated Plan State
  interface Exercise {
    name: string;
    duration: number;
    sets: number;
    reps: number;
    weight: number;
  }
  interface Plan {
    name: string;
    exercises: Exercise[];
    duration: number;
    totalCalories: number;
    goal?: string;
    fitnessLevel?: string;
  }
  const [generatedPlan, setGeneratedPlan] = useState<Plan | null>(null);

  const toggleEquipment = (equip: string) => {
    setEquipment(prev => {
      if (prev.includes(equip)) {
        const next = prev.filter(e => e !== equip);
        return next.length === 0 ? ['Bodyweight'] : next;
      } else {
        return [...prev, equip];
      }
    });
  };

  const handleAddCustomEquipment = () => {
    const clean = customEquip.trim();
    if (!clean) return;
    if (equipmentOptions.includes(clean)) {
      toast.error('Equipment already exists!');
      return;
    }
    setEquipmentOptions(prev => [...prev, clean]);
    setEquipment(prev => {
      if (prev.length === 1 && prev[0] === 'Bodyweight') {
        return [clean];
      }
      return [...prev, clean];
    });
    setCustomEquip('');
    toast.success(`"${clean}" added to equipment options!`);
  };

  const toggleExpandWorkout = (id: string) => {
    setExpandedWorkoutId(prevId => prevId === id ? null : id);
  };

  const groupWorkoutsByWeek = (workoutList: any[]) => {
    const sorted = [...workoutList].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const groups: { [key: string]: any[] } = {};
    
    sorted.forEach(w => {
      const date = new Date(w.date || Date.now());
      const day = date.getDay();
      const diff = date.getDate() - day + (day === 0 ? -6 : 1);
      const monday = new Date(date.setDate(diff));
      monday.setHours(0, 0, 0, 0);
      const weekLabel = `Week of ${monday.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
      
      if (!groups[weekLabel]) {
        groups[weekLabel] = [];
      }
      groups[weekLabel].push(w);
    });
    
    return groups;
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await generateWorkout({
      goal,
      time,
      fitnessLevel,
      equipment,
    });

    if (res.success) {
      setGeneratedPlan(res.plan);
      setIsScheduled(false);
      
      // Cache the plan in localStorage for 24h persistence as unscheduled
      const todayStr = new Date().toDateString();
      localStorage.setItem('fittrack_today_plan', JSON.stringify({
        date: todayStr,
        plan: res.plan,
        scheduled: false
      }));

      toast.success('AI Plan generated successfully! Click "Schedule for Today" below to add it.');
    } else {
      toast.error(res.error || 'Failed to generate plan.');
    }
  };

  const handleSavePlan = async () => {
    if (!generatedPlan) return;
    const todayStr = new Date().toDateString();

    // Locate and remove any existing generated workout for today with the same name to prevent duplicates
    const existingTodayGenerated = workouts.find((w: any) => {
      if (!w.isGenerated || !w.date) return false;
      return new Date(w.date).toDateString() === todayStr && w.name === generatedPlan.name;
    });

    if (existingTodayGenerated) {
      await deleteWorkout(existingTodayGenerated._id);
    }

    // Automatically save the plan to the database so it displays on the dashboard schedule
    const res = await logWorkout({
      name: generatedPlan.name,
      exercises: generatedPlan.exercises,
      duration: generatedPlan.duration,
      totalCalories: generatedPlan.totalCalories,
      isCompleted: false, // Saved as upcoming
      isGenerated: true,
      goal: generatedPlan.goal || goal,
      fitnessLevel: generatedPlan.fitnessLevel || fitnessLevel,
    });

    if (res.success) {
      setIsScheduled(true);
      // Update localStorage cache to mark as scheduled
      localStorage.setItem('fittrack_today_plan', JSON.stringify({
        date: todayStr,
        plan: generatedPlan,
        scheduled: true
      }));
      toast.success('Workout scheduled for today! It now shows on your home page schedule as an upcoming activity.');
    } else {
      toast.error(res.error || 'Failed to schedule workout.');
    }
  };



  return (
    <div className="space-y-8 pb-12 select-none">
      <div>
        <h2 className="text-xl font-display font-bold text-white flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-accentCyan animate-pulse" />
          <span>Today's Workout Parameter Generator</span>
        </h2>
        <p className="text-xs text-mutedText mt-0.5">Generate dynamically adjusted workouts backed by exercise physiology.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Panel: Inputs Form */}
        <div className="lg:col-span-5">
          <Card className="space-y-6">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-white/5 pb-3">Today's Workout Parameters</h3>

            <form onSubmit={handleGenerate} className="space-y-5">
              {/* Target Goal */}
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-mutedText tracking-widest flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-accentCyan" /> Target Goal
                </label>
                <select
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  className="w-full bg-[#0F1928] border border-white/5 focus:border-cyan/30 rounded-xl py-3 px-4 text-xs text-white focus:outline-none"
                >
                  <option value="lose_weight">Lose Weight / Burn Fat</option>
                  <option value="gain_muscle">Gain Muscle / Hypertrophy</option>
                  <option value="improve_endurance">Improve Endurance / HIIT</option>
                  <option value="maintain">Maintain Fitness & Tone</option>
                </select>
              </div>

              {/* Time Available slider */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] uppercase font-bold text-mutedText tracking-widest flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-accentCyan" /> Available Time
                  </label>
                  <span className="text-xs font-mono font-bold text-accentCyan">{time} minutes</span>
                </div>
                <input
                  type="range"
                  min="15"
                  max="90"
                  step="5"
                  value={time}
                  onChange={(e) => setTime(Number(e.target.value))}
                  className="w-full h-1 bg-[#0F1928] rounded-lg appearance-none cursor-pointer accent-accentCyan"
                />
              </div>

              {/* Fitness Level Toggle */}
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-mutedText tracking-widest flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-accentCyan" /> Fitness Level
                </label>
                <div className="grid grid-cols-3 gap-2 bg-[#0F1928] p-1 rounded-xl border border-white/5">
                  {['beginner', 'intermediate', 'advanced'].map(level => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => setFitnessLevel(level)}
                      className={`py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors ${
                        fitnessLevel === level 
                          ? 'bg-accentCyan text-bg' 
                          : 'text-mutedText hover:text-white'
                      }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>

              {/* Available Equipment */}
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-mutedText tracking-widest flex items-center gap-1.5">
                  <Dumbbell className="w-3.5 h-3.5 text-accentCyan" /> Available Equipment
                </label>
                <div className="flex flex-wrap gap-2 pt-1">
                  {equipmentOptions.map(opt => {
                    const isSelected = equipment.includes(opt);
                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => toggleEquipment(opt)}
                        className={`px-3 py-1.5 rounded-full text-[10px] font-bold border transition-colors ${
                          isSelected 
                            ? 'bg-actionGreen/15 border-actionGreen text-actionGreen' 
                            : 'bg-white/[0.02] border-white/5 text-mutedText hover:text-white'
                        }`}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>

                {/* Manual Equipment input */}
                <div className="flex gap-2 pt-2">
                  <input
                    type="text"
                    placeholder="Add custom equipment (e.g. Kettlebell)"
                    value={customEquip}
                    onChange={(e) => setCustomEquip(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddCustomEquipment();
                      }
                    }}
                    className="flex-1 bg-[#0F1928] border border-white/5 focus:border-cyan/30 rounded-xl py-2.5 px-3.5 text-[11px] text-white focus:outline-none placeholder-white/20"
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomEquipment}
                    className="px-4 py-2.5 rounded-xl text-[11px] font-bold text-bg bg-accentCyan hover:bg-accentCyan/90 transition-all"
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* Generate button */}
              <button
                type="submit"
                disabled={isGeneratingWorkout}
                className="w-full py-3.5 rounded-xl text-sm font-bold text-bg bg-actionGreen hover:bg-actionGreen/90 glow-green transition-all duration-200 flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                {isGeneratingWorkout ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-bg" />
                    <span>AI is crafting plan...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Generate My Plan</span>
                  </>
                )}
              </button>
            </form>
          </Card>
        </div>

        {/* Right Panel: Generated workout result */}
        <div className="lg:col-span-7">
          {isGeneratingWorkout ? (
            /* Loading skeletons */
            <Card className="space-y-6">
              <div className="space-y-2.5 animate-pulse">
                <div className="w-1/3 h-5 bg-[#0F1928] rounded"></div>
                <div className="w-1/4 h-3 bg-[#0F1928] rounded"></div>
              </div>
              <hr className="border-white/5" />
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="p-4 rounded-xl bg-[#0F1928]/40 border border-white/5 flex items-center justify-between animate-pulse">
                    <div className="space-y-2 w-1/2">
                      <div className="w-3/4 h-4 bg-[#0F1928] rounded"></div>
                      <div className="w-1/2 h-2.5 bg-[#0F1928] rounded"></div>
                    </div>
                    <div className="w-16 h-5 bg-[#0F1928] rounded-full"></div>
                  </div>
                ))}
              </div>
            </Card>
          ) : generatedPlan ? (
            /* Generated workout display */
            <Card className="space-y-6">
              {/* Header Info */}
              <div className="flex items-center justify-between border-b border-white/5 pb-4">
                <div>
                  <h3 className="text-base font-bold text-white">{generatedPlan.name}</h3>
                  <div className="flex flex-wrap items-center gap-3 text-[10px] text-mutedText mt-1 font-semibold">
                    <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-accentCyan" /> {generatedPlan.duration} minutes</span>
                    <span className="flex items-center gap-1"><Flame className="w-3.5 h-3.5 text-red-500" /> {generatedPlan.totalCalories} calories estimated</span>
                    {(generatedPlan.goal || goal) && (
                      <span className="flex items-center gap-1">
                        <TrendingUp className="w-3.5 h-3.5 text-orange-400" /> {formatGoalName(generatedPlan.goal || goal)}
                      </span>
                    )}
                    {(generatedPlan.fitnessLevel || fitnessLevel) && (
                      <span className="flex items-center gap-1">
                        <User className="w-3.5 h-3.5 text-purple-400" /> {generatedPlan.fitnessLevel || fitnessLevel}
                      </span>
                    )}
                  </div>
                </div>
                <span className="text-[9px] font-bold text-accentCyan bg-accentCyan/15 px-3 py-1 rounded-full uppercase tracking-wider">
                  AI Plan Ready
                </span>
              </div>

              {/* Day workouts list */}
              <div className="space-y-3.5">
                {generatedPlan.exercises.map((ex, idx) => {
                  const isExExpanded = expandedGenExerciseIdx === idx;
                  return (
                  <div 
                    key={idx} 
                    onClick={() => setExpandedGenExerciseIdx(isExExpanded ? null : idx)}
                    className="cursor-pointer p-4 rounded-xl bg-[#0F1928]/50 border border-white/5 flex flex-col hover:border-white/10 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3.5">
                        <div className="w-9 h-9 rounded-lg bg-white/[0.02] border border-white/5 flex items-center justify-center font-display font-bold text-xs text-white">
                          {idx + 1}
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-white group-hover:text-accentCyan transition-colors">{ex.name}</h4>
                          <p className="text-[10px] text-mutedText mt-0.5">
                            {ex.duration > 0 ? `${ex.duration}m time` : `${ex.sets} sets • ${ex.reps} reps`} {ex.weight > 0 ? `• ${ex.weight}kg` : ''}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <span className="text-[8px] font-bold tracking-widest text-[#00F5FF] bg-[#00F5FF]/10 border border-[#00F5FF]/20 px-2 py-0.5 rounded-full uppercase">
                          Target Fit
                        </span>
                        {isExExpanded ? <ChevronUp className="w-4 h-4 text-mutedText" /> : <ChevronDown className="w-4 h-4 text-mutedText" />}
                      </div>
                    </div>

                    <AnimatePresence>
                      {isExExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden w-full pt-4"
                        >
                          <a 
                            href={`https://www.youtube.com/results?search_query=${encodeURIComponent(ex.name + ' exercise tutorial proper form')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-3 p-3 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 rounded-xl transition-all group"
                          >
                            <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center text-red-500 group-hover:scale-110 transition-transform">
                              <Play className="w-4 h-4 fill-current ml-0.5" />
                            </div>
                            <div>
                              <h5 className="text-xs font-bold text-white group-hover:text-red-400 transition-colors">Watch Video Tutorial</h5>
                              <p className="text-[10px] text-mutedText mt-0.5">Learn proper form on YouTube</p>
                            </div>
                          </a>
                          <p className="text-[10px] text-mutedText mt-2 italic flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-accentCyan" /> AI found the best visual guide for proper form.
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  );
                })}
              </div>

                <div className="pt-4 border-t border-white/5 flex items-center gap-3">
                  {isScheduled ? (
                    <button
                      disabled
                      className="w-full py-3 rounded-xl text-xs font-bold text-bg/75 bg-[#39FF14]/50 cursor-default flex items-center justify-center gap-2"
                    >
                      <Save className="w-4 h-4" />
                      <span>Scheduled for Today</span>
                    </button>
                  ) : (
                    <button
                      onClick={handleSavePlan}
                      className="w-full py-3 rounded-xl text-xs font-bold text-bg bg-[#39FF14] hover:bg-[#39FF14]/90 glow-green transition-all hover:scale-105 flex items-center justify-center gap-2"
                    >
                      <Save className="w-4 h-4" />
                      <span>Schedule for Today</span>
                    </button>
                  )}
                </div>
            </Card>
          ) : (
            /* Blank state */
            <div className="glass-card border border-white/5 rounded-2xl p-12 text-center flex flex-col items-center justify-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-center text-mutedText">
                <Dumbbell className="w-6 h-6" />
              </div>
              <div className="space-y-1.5">
                <h4 className="text-sm font-bold text-white">No plan generated yet</h4>
                <p className="text-xs text-mutedText max-w-sm">Configure parameters on the left and click Generate to view your tailored routines.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Weekly History Accordion List */}
      <div className="space-y-6 pt-8 border-t border-white/5">
        <div>
          <h2 className="text-xl font-display font-bold text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-accentCyan" />
            <span>Weekly Scheduled & Logged Plans</span>
          </h2>
          <p className="text-xs text-mutedText mt-0.5">Manage and track your generated routines grouped week-by-week. Click a routine to expand its exercises.</p>
        </div>

        {Object.keys(groupWorkoutsByWeek(workouts)).length > 0 ? (
          Object.entries(groupWorkoutsByWeek(workouts)).map(([weekLabel, weekWorkouts]) => (
            <div key={weekLabel} className="space-y-4">
              <h3 className="text-xs font-bold text-accentCyan uppercase tracking-widest border-b border-white/5 pb-2">
                {weekLabel}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                {weekWorkouts.map((w: any) => {
                  const isExpanded = expandedWorkoutId === w._id;
                  const formattedDate = new Date(w.date).toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  });
                  const formattedTime = new Date(w.date).toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit'
                  });

                  return (
                    <Card key={w._id} className="p-4 space-y-4 hover:scale-[1.005]">
                      <div className="flex items-start justify-between">
                        <div 
                          className="cursor-pointer flex-1"
                          onClick={() => toggleExpandWorkout(w._id)}
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono font-bold text-mutedText bg-white/[0.03] px-2 py-0.5 rounded border border-white/5">
                              {formattedDate} • {formattedTime}
                            </span>
                            {w.isGenerated && (
                              <span className="text-[8px] font-bold text-accentCyan bg-accentCyan/15 px-1.5 py-0.5 rounded uppercase tracking-wider">
                                AI Plan
                              </span>
                            )}
                          </div>
                          <h4 className="text-sm font-bold text-white mt-2 hover:text-accentCyan transition-colors">
                            {w.name}
                          </h4>
                          <p className="text-[10px] text-mutedText mt-1">
                            {w.duration} min • {w.totalCalories} kcal estimated
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => toggleExpandWorkout(w._id)}
                            className="p-2 text-mutedText hover:text-white hover:bg-white/[0.03] rounded-lg transition-colors"
                            title={isExpanded ? "Collapse Exercises" : "Expand Exercises"}
                          >
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                          
                          <button
                            onClick={async () => {
                              if (confirm(`Are you sure you want to delete "${w.name}"?`)) {
                                const res = await deleteWorkout(w._id);
                                if (res.success) {
                                  toast.success('Workout deleted successfully.');
                                } else {
                                  toast.error('Failed to delete workout.');
                                }
                              }
                            }}
                            className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                            title="Delete Workout"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Exercises Dropdown list */}
                      <AnimatePresence initial={false}>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.25, ease: "easeInOut" }}
                            className="overflow-hidden pt-3 border-t border-white/5 space-y-2"
                          >
                            <p className="text-[9px] uppercase font-bold text-accentCyan tracking-wider">Exercises ({w.exercises?.length || 0})</p>
                            <div className="space-y-1.5">
                              {w.exercises && w.exercises.length > 0 ? (
                                w.exercises.map((ex: any, idx: number) => {
                                  const historyExId = `${w._id}-${idx}`;
                                  const isExExpanded = expandedHistoryExId === historyExId;
                                  return (
                                  <div 
                                    key={idx} 
                                    onClick={(e) => { e.stopPropagation(); setExpandedHistoryExId(isExExpanded ? null : historyExId); }}
                                    className="flex flex-col text-[11px] py-2 px-3 rounded bg-white/[0.01] border border-white/[0.03] cursor-pointer hover:bg-white/[0.03] transition-colors"
                                  >
                                    <div className="flex justify-between items-center w-full">
                                      <span className="font-semibold text-white/90">{ex.name}</span>
                                      <div className="flex items-center gap-2">
                                        <span className="text-mutedText font-mono text-[10px]">
                                          {ex.duration > 0 ? `${ex.duration}m` : `${ex.sets}s • ${ex.reps}r`} {ex.weight > 0 ? `• ${ex.weight}kg` : ''}
                                        </span>
                                        {isExExpanded ? <ChevronUp className="w-3 h-3 text-mutedText" /> : <ChevronDown className="w-3 h-3 text-mutedText" />}
                                      </div>
                                    </div>

                                    <AnimatePresence>
                                      {isExExpanded && (
                                        <motion.div
                                          initial={{ height: 0, opacity: 0 }}
                                          animate={{ height: "auto", opacity: 1 }}
                                          exit={{ height: 0, opacity: 0 }}
                                          className="overflow-hidden w-full pt-3"
                                        >
                                          <a 
                                            href={`https://www.youtube.com/results?search_query=${encodeURIComponent(ex.name + ' exercise tutorial proper form')}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-3 p-2.5 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 rounded-lg transition-all group"
                                          >
                                            <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center text-red-500 group-hover:scale-110 transition-transform">
                                              <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                                            </div>
                                            <div>
                                              <h5 className="text-[11px] font-bold text-white group-hover:text-red-400 transition-colors">Watch Video Tutorial</h5>
                                              <p className="text-[9px] text-mutedText mt-0.5">Learn proper form on YouTube</p>
                                            </div>
                                          </a>
                                        </motion.div>
                                      )}
                                    </AnimatePresence>
                                  </div>
                                  );
                                })
                              ) : (
                                <p className="text-[10px] text-mutedText italic">No exercises logged.</p>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </Card>
                  );
                })}
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12 border border-dashed border-white/5 rounded-2xl bg-white/[0.01]">
            <p className="text-xs text-mutedText">No weekly routines or historical workouts logged yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
