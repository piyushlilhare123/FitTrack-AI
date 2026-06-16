import React from 'react';
import Card from '@/components/ui/Card';
import { Flame, Trophy, Target, Zap, Medal, Star } from 'lucide-react';

export default function TrophyRoom({ workouts = [], nutritionHistory = [] }) {
  // 1. Calculate Unique Workout Days
  const uniqueWorkoutDates = [...new Set(workouts.map(w => new Date(w.date).toDateString()))];
  const totalWorkoutDays = uniqueWorkoutDates.length;
  const streak7Progress = Math.min(100, Math.round((totalWorkoutDays / 7) * 100));

  // 2. Calculate Total Calories Burned
  const totalCaloriesBurned = workouts.reduce((sum, w) => sum + (w.caloriesBurned || 0), 0);
  const cardioProgress = Math.min(100, Math.round((totalCaloriesBurned / 5000) * 100));

  // 3. Macro Perfection (Hit 120g Protein & 150g Carbs in one day)
  let maxProtein = 0;
  let hitMacros = false;
  let hitHydration = false;
  let maxHydration = 0;
  let hitCalorieGoal = false;

  nutritionHistory.forEach(day => {
    if (day.totalProtein > maxProtein) maxProtein = day.totalProtein;
    if (day.totalProtein >= 120 && day.totalCarbs >= 150) hitMacros = true;
    
    if (day.waterGlasses > maxHydration) maxHydration = day.waterGlasses;
    if (day.waterGlasses >= 8) hitHydration = true;

    if (day.totalCalories > 0 && day.totalCalories <= 2200) hitCalorieGoal = true;
  });

  const macroProgress = hitMacros ? 100 : Math.min(100, Math.round((maxProtein / 120) * 100));
  const hydrationProgress = hitHydration ? 100 : Math.min(100, Math.round((maxHydration / 8) * 100));
  const consistencyProgress = Math.min(100, Math.round((workouts.length / 15) * 100));
  const calorieProgress = hitCalorieGoal ? 100 : 0;

  const todayStr = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  const achievements = [
    {
      id: 1,
      title: "7-Day Streak",
      description: "Logged workouts on 7 different days",
      icon: <Flame className="w-6 h-6 text-orange-400" />,
      color: "from-orange-500/20 to-orange-500/5",
      borderColor: "border-orange-500/30",
      isUnlocked: streak7Progress >= 100,
      progress: streak7Progress,
      date: streak7Progress >= 100 ? todayStr : null
    },
    {
      id: 2,
      title: "Cardio King",
      description: "Burned 5,000 total calories from workouts",
      icon: <Target className="w-6 h-6 text-cyan" />,
      color: "from-cyan/20 to-cyan/5",
      borderColor: "border-cyan/30",
      isUnlocked: cardioProgress >= 100,
      progress: cardioProgress,
      date: cardioProgress >= 100 ? todayStr : null
    },
    {
      id: 3,
      title: "Macro Perfection",
      description: "Hit 120g protein & 150g carbs in a single day",
      icon: <Star className="w-6 h-6 text-yellow-400" />,
      color: "from-yellow-400/20 to-yellow-400/5",
      borderColor: "border-yellow-400/30",
      isUnlocked: macroProgress >= 100,
      progress: macroProgress,
      date: macroProgress >= 100 ? todayStr : null
    },
    {
      id: 4,
      title: "Hydration Hero",
      description: "Drank 8+ glasses of water in a day",
      icon: <Zap className="w-6 h-6 text-blue-400" />,
      color: "from-blue-500/20 to-blue-500/5",
      borderColor: "border-blue-500/30",
      isUnlocked: hydrationProgress >= 100,
      progress: hydrationProgress,
      date: hydrationProgress >= 100 ? todayStr : null
    },
    {
      id: 5,
      title: "Consistency Master",
      description: "Completed 15 total workouts",
      icon: <Trophy className="w-6 h-6 text-purple-400" />,
      color: "from-purple-500/20 to-purple-500/5",
      borderColor: "border-purple-500/30",
      isUnlocked: consistencyProgress >= 100,
      progress: consistencyProgress,
      date: consistencyProgress >= 100 ? todayStr : null
    },
    {
      id: 6,
      title: "Calorie Crusher",
      description: "Stayed under 2,200 calories for a day",
      icon: <Medal className="w-6 h-6 text-green-400" />,
      color: "from-green-500/20 to-green-500/5",
      borderColor: "border-green-500/30",
      isUnlocked: calorieProgress >= 100,
      progress: calorieProgress,
      date: calorieProgress >= 100 ? todayStr : null
    }
  ];

  return (
    <div className="w-full">
      <div className="flex flex-col gap-3">
        {achievements.map((achievement) => (
          <div 
            key={achievement.id}
            className={`relative overflow-hidden p-4 rounded-2xl border ${achievement.isUnlocked ? achievement.borderColor : 'border-white/5'} ${achievement.isUnlocked ? `bg-gradient-to-br ${achievement.color}` : 'bg-white/[0.02]'} transition-colors duration-300 hover:bg-white/[0.04]`}
          >
            {/* Glowing orb behind icon if unlocked */}
            {achievement.isUnlocked && (
              <div className={`absolute -top-4 -right-4 w-16 h-16 bg-gradient-to-br ${achievement.color} blur-2xl rounded-full`}></div>
            )}
            
            <div className="flex items-start gap-4 relative z-10">
              <div className={`p-3 rounded-xl ${achievement.isUnlocked ? 'bg-white/10 backdrop-blur-md shadow-lg shadow-black/20' : 'bg-white/5 grayscale opacity-50'}`}>
                {achievement.icon}
              </div>
              <div className="flex-1 space-y-1">
                <h4 className={`text-xs font-bold uppercase tracking-wider ${achievement.isUnlocked ? 'text-white drop-shadow-sm' : 'text-mutedText/70'}`}>
                  {achievement.title}
                </h4>
                <p className={`text-[10px] leading-relaxed ${achievement.isUnlocked ? 'text-mutedText' : 'text-mutedText/50'}`}>
                  {achievement.description}
                </p>
                {achievement.isUnlocked && achievement.date && (
                  <p className="text-[9px] font-mono text-white/50 pt-1">
                    Unlocked: {achievement.date}
                  </p>
                )}
                {!achievement.isUnlocked && (
                  <div className="pt-1 flex items-center gap-1.5">
                    <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-white/20 rounded-full" style={{ width: `${achievement.progress}%` }}></div>
                    </div>
                    <span className="text-[8px] font-mono text-mutedText/40">{achievement.progress}%</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
