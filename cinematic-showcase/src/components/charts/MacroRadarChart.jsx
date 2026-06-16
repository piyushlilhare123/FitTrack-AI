import React from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts';

export default function MacroRadarChart({ nutritionHistory = [] }) {
  
  // Calculate dynamic data based on nutrition history
  let avgProtein = 0;
  let avgCarbs = 0;
  let avgFats = 0;
  let avgHydration = 0;
  let avgCalories = 0;

  if (nutritionHistory && nutritionHistory.length > 0) {
    nutritionHistory.forEach(day => {
      avgProtein += day.totalProtein || 0;
      avgCarbs += day.totalCarbs || 0;
      avgFats += day.totalFats || 0;
      avgHydration += day.waterGlasses || 0;
      avgCalories += day.totalCalories || 0;
    });
    const days = nutritionHistory.length;
    avgProtein = Math.round(avgProtein / days);
    avgCarbs = Math.round(avgCarbs / days);
    avgFats = Math.round(avgFats / days);
    avgHydration = Math.round(avgHydration / days);
    avgCalories = Math.round(avgCalories / days);

    // If the user has logged meals but no macros (only calories/water) or everything is 0
    if (avgProtein === 0 && avgCarbs === 0 && avgFats === 0) {
      avgProtein = 120;
      avgCarbs = 200;
      avgFats = 50;
      avgHydration = 8;
      avgCalories = 2100;
    }
  } else {
    // Mock data if no history yet
    avgProtein = 120;
    avgCarbs = 200;
    avgFats = 50;
    avgHydration = 8;
    avgCalories = 2100;
  }

  const data = [
    { subject: 'Protein', A: avgProtein, fullMark: 150 },
    { subject: 'Carbs', A: avgCarbs, fullMark: 250 },
    { subject: 'Fats', A: avgFats, fullMark: 70 },
    { subject: 'Hydration', A: avgHydration, fullMark: 10 },
    { subject: 'Calories', A: avgCalories, fullMark: 2500 },
  ];

  // Calculate percentage compliance for the radar chart scaling (0 to 100)
  const normalizedData = data.map(item => ({
    subject: item.subject,
    compliance: Math.min(100, Math.round((item.A / item.fullMark) * 100)),
    fullMark: 100,
    actual: item.A
  }));

  return (
    <div className="w-full h-full flex flex-col items-center justify-between relative p-4">
      <div className="absolute inset-0 bg-cyan/5 blur-3xl rounded-full pointer-events-none"></div>
      
      {/* Radar Chart (Takes most of the space) */}
      <div className="w-full flex-1 relative z-10 mt-2 min-h-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="80%" data={normalizedData}>
            <PolarGrid stroke="rgba(255,255,255,0.08)" />
            <PolarAngleAxis 
              dataKey="subject" 
              tick={{ fill: '#8892A4', fontSize: 11, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase' }} 
            />
            <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
            <Radar 
              name="Compliance" 
              dataKey="compliance" 
              stroke="#00F5FF" 
              strokeWidth={2}
              fill="#00F5FF" 
              fillOpacity={0.2} 
            />
            <Tooltip 
              contentStyle={{
                background: 'rgba(15, 25, 40, 0.95)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                fontSize: '11px',
                color: '#FFFFFF'
              }}
              formatter={(value, name, props) => [`${props.payload.actual} (${value}%)`, 'Actual (Goal %)']}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* Stats Breakdown Row (Fills the bottom) */}
      <div className="w-full grid grid-cols-3 gap-3 mt-6 z-10 border-t border-white/5 pt-4">
        <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-white/[0.02]">
          <span className="text-[10px] text-mutedText uppercase tracking-widest font-bold">Protein</span>
          <span className="text-lg font-mono font-black text-white">{avgProtein}g</span>
        </div>
        <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-white/[0.02]">
          <span className="text-[10px] text-mutedText uppercase tracking-widest font-bold">Carbs</span>
          <span className="text-lg font-mono font-black text-cyan">{avgCarbs}g</span>
        </div>
        <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-white/[0.02]">
          <span className="text-[10px] text-mutedText uppercase tracking-widest font-bold">Fats</span>
          <span className="text-lg font-mono font-black text-purple-400">{avgFats}g</span>
        </div>
      </div>
    </div>
  );
}
