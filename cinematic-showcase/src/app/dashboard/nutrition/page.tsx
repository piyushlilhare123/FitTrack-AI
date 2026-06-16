"use client";
import React, { useState, useEffect } from 'react';
import useWorkoutStore from '@/store/workoutStore';
import useAuthStore from '@/store/authStore';
import Card from '@/components/ui/Card';
import MacroRing from '@/components/charts/MacroRing';
import Modal from '@/components/ui/Modal';
import NutritionScanner from '@/components/nutrition/NutritionScanner';
import { 
  Apple, 
  Search, 
  Plus, 
  Trash2, 
  Sparkles, 
  Loader2, 
  X,
  Droplets,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  CalendarDays
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function Nutrition() {
  const { user } = useAuthStore() as any;
  const { 
    todayNutrition, 
    nutritionHistory,
    fetchTodayNutrition, 
    logMeal, 
    deleteMeal,
    updateWater 
  } = useWorkoutStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [mealTypeToAdd, setMealTypeToAdd] = useState('breakfast');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isFromSearch, setIsFromSearch] = useState(false);
  
  // Custom Food Form fields
  const [foodName, setFoodName] = useState('');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');

  const [isScannerModalOpen, setIsScannerModalOpen] = useState(false);
  const [expandedHistoryId, setExpandedHistoryId] = useState<string | null>(null);
  
  const toggleExpandHistory = (id: string) => {
    setExpandedHistoryId(prev => prev === id ? null : id);
  };

  useEffect(() => {
    fetchTodayNutrition();
  }, []);

  // Handle 12 AM calendar rollover reset for daily nutrition stats and macros
  useEffect(() => {
    let lastCheckedDate = new Date().toDateString();
    
    const interval = setInterval(() => {
      const currentDate = new Date().toDateString();
      if (currentDate !== lastCheckedDate) {
        lastCheckedDate = currentDate;
        fetchTodayNutrition();
        toast.success('New day started! Daily nutrition log and macros have reset. 🌅');
      }
    }, 15000); // Check every 15 seconds

    return () => clearInterval(interval);
  }, []);

  const handleOpenAddModal = (type: string) => {
    setMealTypeToAdd(type);
    setIsFromSearch(false);
    setIsAddModalOpen(true);
  };

  const handleLogCustomFood = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!foodName || !calories) {
      return toast.error('Please enter food name and calories.');
    }

    const res = await logMeal({
      name: foodName,
      calories: Number(calories),
      protein: Number(protein) || 0,
      carbs: Number(carbs) || 0,
      fat: Number(fat) || 0,
      type: mealTypeToAdd
    });

    if (res.success) {
      toast.success(`${foodName} logged successfully!`);
      // Reset form
      setFoodName('');
      setCalories('');
      setProtein('');
      setCarbs('');
      setFat('');
      setIsAddModalOpen(false);
    } else {
      toast.error('Failed to log food.');
    }
  };

  const handleDeleteMealItem = async (mealId: string) => {
    const res = await deleteMeal(mealId);
    if (res.success) {
      toast.success('Food item deleted.');
    } else {
      toast.error('Failed to delete item.');
    }
  };


  const autoDetectNutrition = async () => {
    if (!foodName.trim()) return;
    toast.loading('AI detecting nutrition...', { id: 'detect' });
    
    try {
      const token = localStorage.getItem('fittrack_token');
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const res = await fetch(`${API_URL}/api/ai/search-food`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ text: foodName })
      });

      const data = await res.json();
      if (res.ok && data.success && data.nutritionData) {
        const food = data.nutritionData;
        setCalories(food.calories?.toString() || '0');
        setProtein(food.macros?.protein?.toString() || '0');
        setCarbs(food.macros?.carbs?.toString() || '0');
        setFat(food.macros?.fat?.toString() || '0');
        toast.success('Macros auto-filled by AI!', { id: 'detect' });
      } else {
        throw new Error(data.error || data.message || 'Failed to detect');
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'AI detection failed. Please enter manually.', { id: 'detect' });
    }
  };

  const handleFoodSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    toast.loading('AI analyzing food details...', { id: 'search' });
    
    try {
      const token = localStorage.getItem('fittrack_token');
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const res = await fetch(`${API_URL}/api/ai/search-food`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ text: searchQuery })
      });

      const data = await res.json();
      if (res.ok && data.success && data.nutritionData) {
        const food = data.nutritionData;
        setFoodName(food.foodName || searchQuery);
        setCalories(food.calories?.toString() || '0');
        setProtein(food.macros?.protein?.toString() || '0');
        setCarbs(food.macros?.carbs?.toString() || '0');
        setFat(food.macros?.fat?.toString() || '0');
        
        toast.success(`Found match: ${food.foodName || searchQuery}!`, { id: 'search' });
        setSearchQuery('');
        setIsFromSearch(true);
        setIsAddModalOpen(true);
      } else {
        throw new Error(data.error || data.message || 'Failed to analyze food');
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'AI failed to identify food. Please enter manually.', { id: 'search' });
      
      // Fallback only if it's not a rate limit issue
      if (!err.message?.includes('limit')) {
        setFoodName(searchQuery);
        setIsFromSearch(true);
        setIsAddModalOpen(true);
      }
    }
  };

  // Group meals by type
  const mealSections = ['breakfast', 'lunch', 'dinner', 'snack'];
  const groupedMeals: { [key: string]: any[] } = mealSections.reduce((acc: any, type) => {
    acc[type] = todayNutrition?.meals?.filter((m: any) => m.type === type) || [];
    return acc;
  }, {});

  const totalProtein = todayNutrition?.meals?.reduce((sum: number, m: any) => sum + (m.protein || 0), 0) || 0;
  const totalCarbs = todayNutrition?.meals?.reduce((sum: number, m: any) => sum + (m.carbs || 0), 0) || 0;
  const totalFat = todayNutrition?.meals?.reduce((sum: number, m: any) => sum + (m.fat || 0), 0) || 0;

  // Filter nutrition history to only show the last 7 days dynamically
  const getRecentHistory = () => {
    if (!nutritionHistory || !Array.isArray(nutritionHistory)) return [];
    
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(today.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const validLogs = nutritionHistory.filter((log: any) => {
      const logDate = new Date(log.date);
      return logDate >= sevenDaysAgo && logDate <= today;
    });

    // Deduplicate by date string to handle any accidental race-condition dupes from backend
    const uniqueLogs: { [key: string]: any } = {};
    validLogs.forEach((log: any) => {
      const dStr = new Date(log.date).toDateString();
      if (!uniqueLogs[dStr]) {
        uniqueLogs[dStr] = { ...log };
      } else {
        uniqueLogs[dStr].totalCalories = Math.max(uniqueLogs[dStr].totalCalories || 0, log.totalCalories || 0);
        uniqueLogs[dStr].waterGlasses = Math.max(uniqueLogs[dStr].waterGlasses || 0, log.waterGlasses || 0);
        if (log.meals && log.meals.length > (uniqueLogs[dStr].meals?.length || 0)) {
            uniqueLogs[dStr].meals = log.meals;
        }
      }
    });

    return Object.values(uniqueLogs).sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  const recentHistory = getRecentHistory();

  return (
    <div className="space-y-8 pb-12 select-none">
      
      {/* Header Info */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-display font-bold text-white flex items-center gap-2">
            <Apple className="w-5 h-5 text-actionGreen" />
            <span>Nutrition AI</span>
          </h2>
          <p className="text-xs text-mutedText mt-0.5">Track calories, macro ratios, and generate custom diet plans.</p>
        </div>

        <button
          onClick={() => setIsScannerModalOpen(true)}
          className="px-5 py-2.5 rounded-full text-xs font-bold text-bg bg-[#39FF14] hover:bg-[#39FF14]/90 glow-green transition-all hover:scale-105 flex items-center gap-1.5"
        >
          <Sparkles className="w-4 h-4" />
          <span>AI Nutrition Scanner</span>
        </button>
      </div>

      {/* Row 1: Search Bar & Macro summary */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left: Food search & logging */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Search Box */}
          <Card>
            <form onSubmit={handleFoodSearch} className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search food (e.g. grilled chicken) or scan barcode..."
                className="w-full bg-[#0F1928] border border-white/5 focus:border-cyan/30 focus:outline-none rounded-xl py-3.5 pl-12 pr-4 text-xs text-white"
              />
              <Search className="absolute left-4 top-3.5 w-4.5 h-4.5 text-mutedText" />
              <button type="submit" className="hidden" />
            </form>
          </Card>

          {/* Meals Categories */}
          <div className="space-y-6">
            {mealSections.map(section => {
              const items = groupedMeals[section] || [];
              const secCalories = items.reduce((sum, m) => sum + m.calories, 0);
              const secProtein = items.reduce((sum, m) => sum + (m.protein || 0), 0);
              const secCarbs = items.reduce((sum, m) => sum + (m.carbs || 0), 0);
              const secFat = items.reduce((sum, m) => sum + (m.fat || 0), 0);

              return (
                <Card key={section} className="space-y-4">
                  {/* Category Header */}
                  <div className="flex justify-between items-center border-b border-white/5 pb-3">
                    <div>
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider">{section}</h4>
                      <p className="text-[10px] text-mutedText mt-0.5">{items.length} items logged today</p>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="flex flex-col items-end">
                        <span className="text-xs font-mono font-bold text-cyan">{secCalories} kcal</span>
                        <span className="text-[9px] text-mutedText font-mono mt-0.5">P: {secProtein}g • C: {secCarbs}g • F: {secFat}g</span>
                      </div>
                      <button
                        onClick={() => handleOpenAddModal(section)}
                        className="w-7 h-7 rounded-lg bg-cyan/10 border border-cyan/20 flex items-center justify-center text-[#00F5FF] hover:bg-cyan/20 transition-all hover:scale-105"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Food Items List */}
                  {items.length > 0 ? (
                    <div className="space-y-2.5">
                      {items.map((meal) => (
                        <div 
                          key={meal._id}
                          className="flex items-center justify-between p-3 rounded-xl bg-white/[0.01] border border-white/5 hover:border-white/10 transition-all"
                        >
                          <div>
                            <p className="text-xs font-semibold text-white">{meal.name}</p>
                            <p className="text-[9px] text-mutedText mt-0.5 font-mono">
                              P: {meal.protein}g • C: {meal.carbs}g • F: {meal.fat}g
                            </p>
                          </div>
                          <div className="flex items-center space-x-3.5">
                            <span className="text-xs font-mono font-bold text-white">{meal.calories} kcal</span>
                            <button
                              onClick={() => handleDeleteMealItem(meal._id)}
                              className="text-mutedText hover:text-red-400 transition-colors"
                              title="Delete Item"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[10px] text-mutedText text-center py-2">No items logged yet. Click the + button to add fuel.</p>
                  )}
                </Card>
              );
            })}
          </div>

        </div>

        {/* Right: Macro Summary Ring */}
        <div className="lg:col-span-4">
          <Card className="space-y-6">
            <div className="border-b border-white/5 pb-3">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">Today's Summary</h3>
              <p className="text-[9px] text-mutedText mt-0.5">Macro distributions relative to targets</p>
            </div>
            
            <div className="flex flex-col items-center py-4">
              <MacroRing protein={totalProtein} carbs={totalCarbs} fat={totalFat} />
              <div className="mt-6 text-center space-y-1 w-full">
                <span className="text-[10px] uppercase font-bold text-mutedText tracking-wider">Total Deficit Target</span>
                <p className="text-xl font-mono font-extrabold text-white">
                  {todayNutrition?.totalCalories || 0} / {user?.caloriesLimit || 2000} <span className="text-xs font-sans font-normal text-mutedText">kcal</span>
                </p>
              </div>
              
              <div className="space-y-3 pt-6 w-full">
                {[
                  { label: 'Protein', current: totalProtein, target: Math.round(((user?.caloriesLimit || 2000) * 0.3) / 4), color: 'bg-blue-500', shadow: 'shadow-[0_0_8px_rgba(59,130,246,0.6)]' },
                  { label: 'Carbs', current: totalCarbs, target: Math.round(((user?.caloriesLimit || 2000) * 0.45) / 4), color: 'bg-yellow-500', shadow: 'shadow-[0_0_8px_rgba(234,179,8,0.6)]' },
                  { label: 'Fat', current: totalFat, target: Math.round(((user?.caloriesLimit || 2000) * 0.25) / 9), color: 'bg-red-500', shadow: 'shadow-[0_0_8px_rgba(239,68,68,0.6)]' }
                ].map(macro => {
                  const pct = Math.min(100, (macro.current / macro.target) * 100);
                  const isOver = macro.current > macro.target;
                  return (
                    <div key={macro.label} className="space-y-1">
                      <div className="flex justify-between text-[10px] font-mono">
                        <span className="text-mutedText">{macro.label}</span>
                        <span className={isOver ? 'text-red-400' : 'text-white'}>{macro.current} / {macro.target}g</span>
                      </div>
                      <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all duration-500 ${isOver ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]' : macro.color + ' ' + macro.shadow}`} style={{ width: `${pct}%` }}></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </Card>

          {/* Hydration Station */}
          <Card className="space-y-4">
            <div className="border-b border-white/5 pb-3">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5"><Droplets className="w-4 h-4 text-blue-400" /> Hydration Station</h3>
              <p className="text-[9px] text-mutedText mt-0.5">Track your daily water intake (Goal: 8 glasses)</p>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex gap-1">
                {[...Array(8)].map((_, i) => {
                  const isFilled = i < (todayNutrition?.waterGlasses || 0);
                  return (
                    <div key={i} className={`w-5 h-8 rounded-b-md rounded-t-sm border ${isFilled ? 'bg-blue-500 border-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.5)]' : 'bg-white/5 border-white/10'} transition-all duration-300`}></div>
                  );
                })}
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => updateWater(Math.max(0, (todayNutrition?.waterGlasses || 0) - 1))} className="w-7 h-7 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white transition-all">-</button>
                <span className="text-sm font-mono font-bold w-4 text-center">{todayNutrition?.waterGlasses || 0}</span>
                <button onClick={() => updateWater((todayNutrition?.waterGlasses || 0) + 1)} className="w-7 h-7 rounded-full bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 flex items-center justify-center transition-all">+</button>
              </div>
            </div>
          </Card>

          {/* AI Weekly Forecast */}
          <Card className="space-y-3 bg-gradient-to-br from-[#0F1928] to-[#1A1025] border-purple-500/20">
            <div className="flex items-center gap-2 border-b border-white/5 pb-2">
              <TrendingUp className="w-4 h-4 text-purple-400" />
              <h3 className="text-xs font-bold text-purple-100 uppercase tracking-wider">Weekly Forecast</h3>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-mutedText">At this pace, you are on track to:</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className={`text-2xl font-bold font-mono ${(user?.caloriesLimit || 2000) - (todayNutrition?.totalCalories || 0) > 0 ? 'text-green-400' : 'text-orange-400'}`}>
                  {((user?.caloriesLimit || 2000) - (todayNutrition?.totalCalories || 0) > 0 ? 'Burn ' : 'Gain ')}
                  {Math.abs((((user?.caloriesLimit || 2000) - (todayNutrition?.totalCalories || 0)) * 7) / 7700).toFixed(2)} kg
                </span>
                <span className="text-[10px] text-mutedText">this week</span>
              </div>
            </div>
          </Card>
        </div>

      </div>

      {/* 7-Day History Accordion List */}
      <div className="space-y-6 pt-8 border-t border-white/5">
        <div>
          <h2 className="text-xl font-display font-bold text-white flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-accentCyan" />
            <span>7-Day Nutrition History</span>
          </h2>
          <p className="text-xs text-mutedText mt-0.5">Track your daily calories, hydration, and meal logs over the past week.</p>
        </div>

        {recentHistory && recentHistory.length > 0 ? (
          <div className="grid grid-cols-1 gap-4">
            {recentHistory.map((log: any) => {
              const isExpanded = expandedHistoryId === log._id;
              const formattedDate = new Date(log.date).toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'short',
                day: 'numeric'
              });

              // Group historical meals
              const hMeals = ['breakfast', 'lunch', 'dinner', 'snack'].reduce((acc: any, type) => {
                acc[type] = log.meals?.filter((m: any) => m.type === type) || [];
                return acc;
              }, {});

              return (
                <Card key={log._id} className="p-4 space-y-4 hover:border-white/10 transition-colors">
                  <div className="flex items-start justify-between cursor-pointer" onClick={() => toggleExpandHistory(log._id)}>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white">
                          {formattedDate}
                        </span>
                        {new Date(log.date).toDateString() === new Date().toDateString() && (
                          <span className="text-[8px] font-bold text-[#39FF14] bg-[#39FF14]/10 border border-[#39FF14]/20 px-1.5 py-0.5 rounded uppercase tracking-wider">
                            Today
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-[10px] text-mutedText">
                        <span className="font-mono text-cyan">{log.totalCalories} kcal Total</span>
                        <span className="flex items-center gap-1 font-mono text-blue-400">
                          <Droplets className="w-3 h-3" /> {log.waterGlasses || 0}/8 Glasses
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button className="p-2 text-mutedText hover:text-white hover:bg-white/[0.03] rounded-lg transition-colors">
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="pt-4 border-t border-white/5 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
                      {['breakfast', 'lunch', 'dinner', 'snack'].map(section => {
                        const items = hMeals[section];
                        if (!items || items.length === 0) return null;
                        
                        return (
                          <div key={section} className="space-y-2">
                            <h4 className="text-[10px] font-bold text-accentCyan uppercase tracking-widest">{section}</h4>
                            <div className="space-y-1.5">
                              {items.map((meal: any) => (
                                <div key={meal._id} className="flex items-center justify-between p-2 rounded-lg bg-white/[0.02] border border-white/5">
                                  <div className="truncate pr-4">
                                    <p className="text-xs font-semibold text-white truncate">{meal.name}</p>
                                    <p className="text-[9px] text-mutedText mt-0.5 font-mono">
                                      P: {meal.protein}g • C: {meal.carbs}g • F: {meal.fat}g
                                    </p>
                                  </div>
                                  <span className="text-xs font-mono font-bold text-white whitespace-nowrap">{meal.calories} kcal</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                      {log.meals?.length === 0 && (
                        <p className="text-xs text-mutedText italic">No meals logged on this day.</p>
                      )}
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="glass-card border border-white/5 rounded-2xl p-12 text-center flex flex-col items-center justify-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-center text-mutedText">
              <CalendarDays className="w-6 h-6" />
            </div>
            <div className="space-y-1.5">
              <h4 className="text-sm font-bold text-white">No history found</h4>
              <p className="text-xs text-mutedText max-w-sm">Your recent 7-day nutrition logs will appear here once you start tracking.</p>
            </div>
          </div>
        )}
      </div>

      {/* MODAL 1: Add Custom Food Item */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)}>
        <div className="space-y-6 p-1">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5 animate-pulse text-accentCyan">
              <Plus className="w-4 h-4" /> Log Custom Meal to {mealTypeToAdd}
            </h3>
            <p className="text-[10px] text-mutedText mt-0.5 font-sans">Define name, total calories, and macro details.</p>
          </div>

          {foodName && (
            <div className="w-full h-52 rounded-xl overflow-hidden border border-white/10 relative bg-[#0F1928] shadow-lg">
              {/* Using direct image search thumbnail for reliable real food photos */}
              <img 
                src={`https://tse2.mm.bing.net/th?q=${encodeURIComponent(foodName + ' food meal')}&w=1200&h=800&c=7&rs=1&p=0&dpr=3&pid=1.7&mkt=en-US&adlt=moderate`}
                alt={`${foodName}`}
                className="w-full h-full object-cover opacity-90 hover:opacity-100 transition-opacity"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=1200&h=800&fit=crop';
                }}
              />
              <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-black/60 backdrop-blur-sm px-2 py-0.5 rounded text-[8px] font-bold text-accentCyan uppercase">
                <Sparkles className="w-2.5 h-2.5" /> Direct Web Image
              </div>
            </div>
          )}

          <form onSubmit={handleLogCustomFood} className="space-y-4 font-sans">
            <div className="space-y-2">
              <label className="text-[9px] uppercase font-bold text-mutedText tracking-widest">Food Name</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={foodName}
                  onChange={(e) => setFoodName(e.target.value)}
                  placeholder="e.g. Whey Protein Isolate"
                  className="w-full bg-[#0F1928] border border-white/5 focus:border-cyan/30 rounded-xl py-3 px-4 text-xs text-white focus:outline-none"
                  required
                />
                {!isFromSearch && (
                  <button 
                    type="button" 
                    onClick={autoDetectNutrition} 
                    className="whitespace-nowrap px-4 py-3 rounded-xl bg-[#00F5FF]/10 border border-[#00F5FF]/30 text-[#00F5FF] text-xs font-bold flex items-center gap-1.5 hover:bg-[#00F5FF]/20 hover:text-white transition-all shadow-[0_0_15px_rgba(0,245,255,0.15)]"
                  >
                    <Sparkles className="w-4 h-4" /> 
                    Auto-Fill
                  </button>
                )}
              </div>
            </div>

            {isFromSearch && (
              <div className="space-y-1">
                <label className="text-[9px] uppercase font-bold text-mutedText tracking-widest">Meal Type</label>
                <select
                  value={mealTypeToAdd}
                  onChange={(e) => setMealTypeToAdd(e.target.value)}
                  className="w-full bg-[#0F1928] border border-white/5 focus:border-cyan/30 rounded-xl py-3 px-4 text-xs text-white focus:outline-none appearance-none cursor-pointer"
                  required
                >
                  <option value="breakfast">Breakfast</option>
                  <option value="lunch">Lunch</option>
                  <option value="dinner">Dinner</option>
                  <option value="snack">Snack</option>
                </select>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[9px] uppercase font-bold text-mutedText tracking-widest">Calories (kcal)</label>
                <input
                  type="number"
                  value={calories}
                  onChange={(e) => setCalories(e.target.value)}
                  placeholder="e.g. 120"
                  className="w-full bg-[#0F1928] border border-white/5 focus:border-cyan/30 rounded-xl py-3 px-4 text-xs text-white focus:outline-none"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] uppercase font-bold text-mutedText tracking-widest">Protein (g)</label>
                <input
                  type="number"
                  value={protein}
                  onChange={(e) => setProtein(e.target.value)}
                  placeholder="e.g. 24"
                  className="w-full bg-[#0F1928] border border-white/5 focus:border-cyan/30 rounded-xl py-3 px-4 text-xs text-white focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[9px] uppercase font-bold text-mutedText tracking-widest">Carbs (g)</label>
                <input
                  type="number"
                  value={carbs}
                  onChange={(e) => setCarbs(e.target.value)}
                  placeholder="e.g. 3"
                  className="w-full bg-[#0F1928] border border-white/5 focus:border-cyan/30 rounded-xl py-3 px-4 text-xs text-white focus:outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] uppercase font-bold text-mutedText tracking-widest">Fat (g)</label>
                <input
                  type="number"
                  value={fat}
                  onChange={(e) => setFat(e.target.value)}
                  placeholder="e.g. 1.5"
                  className="w-full bg-[#0F1928] border border-white/5 focus:border-cyan/30 rounded-xl py-3 px-4 text-xs text-white focus:outline-none"
                />
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-white border border-white/10 hover:bg-white/[0.02] transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl text-xs font-bold text-bg bg-[#39FF14] hover:bg-[#39FF14]/90 glow-green transition-all"
              >
                Log Fuel
              </button>
            </div>
          </form>
        </div>
      </Modal>

      {/* MODAL 2: AI Nutrition Scanner */}
      <Modal isOpen={isScannerModalOpen} onClose={() => setIsScannerModalOpen(false)}>
        <div className="relative bg-[#0D0F14] rounded-2xl overflow-hidden w-full max-w-2xl mx-auto border border-[#2A303E]">
          <button 
            onClick={() => setIsScannerModalOpen(false)} 
            className="absolute top-4 right-4 text-mutedText hover:text-white z-10 p-2 bg-[#161A22]/80 backdrop-blur-sm rounded-full border border-white/10"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="max-h-[85vh] overflow-y-auto w-full">
            <NutritionScanner />
          </div>
        </div>
      </Modal>

    </div>
  );
}
