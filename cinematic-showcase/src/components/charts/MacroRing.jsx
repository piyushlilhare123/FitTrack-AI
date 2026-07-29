import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

export default function MacroRing({ protein = 0, carbs = 0, fat = 0 }) {
  // Safe fallbacks if all macros are 0
  const hasData = protein > 0 || carbs > 0 || fat > 0;
  
  const data = hasData 
    ? [
        { name: 'Protein', value: protein, color: '#00F5FF' }, // Cyan
        { name: 'Carbs', value: carbs, color: '#39FF14' }, // Green
        { name: 'Fat', value: fat, color: '#FFD700' }, // Vibrant Gold / Yellow
      ]
    : [
        { name: 'No log today', value: 100, color: 'rgba(255, 255, 255, 0.05)' }
      ];

  const totalGrams = protein + carbs + fat;

  const calculatePct = (val) => {
    if (totalGrams === 0) return 0;
    return Math.round((val / totalGrams) * 100);
  };

  return (
    <div className="flex flex-col items-center justify-center w-full min-w-0 py-2">
      <div className="relative w-40 h-40 sm:w-44 sm:h-44 min-w-0">
        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={65}
              paddingAngle={4}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
              ))}
            </Pie>
            {hasData && (
              <Tooltip
                contentStyle={{
                  background: 'rgba(15, 25, 40, 0.95)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '12px',
                  fontSize: '11px',
                  color: '#FFFFFF',
                  zIndex: 50
                }}
              />
            )}
          </PieChart>
        </ResponsiveContainer>
        {/* Center Text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-[9px] sm:text-[10px] uppercase font-bold text-mutedText tracking-wider">Total Macros</span>
          <span className="text-lg sm:text-xl font-mono font-bold text-white">{totalGrams}g</span>
        </div>
      </div>

      {/* Custom Legend */}
      {hasData && (
        <div className="grid grid-cols-3 gap-3 sm:gap-4 mt-4 text-center w-full max-w-xs">
          <div className="space-y-0.5">
            <p className="text-[10px] font-bold text-accentCyan uppercase tracking-widest">Protein</p>
            <p className="text-sm font-mono font-extrabold text-white">{protein}g</p>
            <p className="text-[10px] text-mutedText">{calculatePct(protein)}%</p>
          </div>
          <div className="space-y-0.5">
            <p className="text-[10px] font-bold text-actionGreen uppercase tracking-widest">Carbs</p>
            <p className="text-sm font-mono font-extrabold text-white">{carbs}g</p>
            <p className="text-[10px] text-mutedText">{calculatePct(carbs)}%</p>
          </div>
          <div className="space-y-0.5">
            <p className="text-[10px] font-bold text-yellow-400 uppercase tracking-widest">Fat</p>
            <p className="text-sm font-mono font-extrabold text-white">{fat}g</p>
            <p className="text-[10px] text-mutedText">{calculatePct(fat)}%</p>
          </div>
        </div>
      )}
    </div>
  );
}
