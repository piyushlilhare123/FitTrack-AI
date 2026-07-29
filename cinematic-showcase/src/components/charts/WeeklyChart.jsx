import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';

export default function WeeklyChart({ data }) {
  // Check if data actually has our new keys (burned and consumed)
  const hasValidData = data && data.length > 0 && ('burned' in data[0] || 'consumed' in data[0]);

  const chartData = hasValidData ? data : [
    { day: 'Mon', burned: 420, consumed: 1800 },
    { day: 'Tue', burned: 680, consumed: 2100 },
    { day: 'Wed', burned: 350, consumed: 1950 },
    { day: 'Thu', burned: 510, consumed: 2200 },
    { day: 'Fri', burned: 730, consumed: 1850 },
    { day: 'Sat', burned: 847, consumed: 2300 },
  ];

  return (
    <div className="w-full min-w-0 h-64 sm:h-72 font-sans">
      <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
        <AreaChart data={chartData} margin={{ top: 10, right: 15, left: -5, bottom: 5 }}>
          <defs>
            {/* Volumetric 3D glowing gradients */}
            <linearGradient id="colorConsumed" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#FF5733" stopOpacity={0.4}/>
              <stop offset="95%" stopColor="#FF5733" stopOpacity={0.05}/>
            </linearGradient>
            <linearGradient id="colorBurned" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#39FF14" stopOpacity={0.4}/>
              <stop offset="95%" stopColor="#39FF14" stopOpacity={0.05}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
          <XAxis 
            dataKey="day" 
            stroke="#94A3B8" 
            fontSize={10} 
            tickLine={false} 
            axisLine={false} 
            dy={8}
          />
          <YAxis 
            domain={[100, 5000]}
            ticks={[100, 300, 500, 700, 900, 1000, 1500, 2000, 3000, 4000, 5000]}
            stroke="#94A3B8" 
            fontSize={9} 
            tickLine={false} 
            axisLine={false} 
            width={38}
          />
          <Tooltip
            contentStyle={{
              background: 'rgba(15, 25, 40, 0.95)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '16px',
              fontSize: '12px',
              color: '#FFFFFF',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.8)',
              backdropFilter: 'blur(12px)'
            }}
            formatter={(value, name) => [`${value} kcal`, name]}
            cursor={{ stroke: 'rgba(255, 255, 255, 0.15)', strokeWidth: 1 }}
          />
          <Legend 
            verticalAlign="top" 
            align="right"
            height={36}
            iconType="circle"
            iconSize={8}
            wrapperStyle={{
              fontSize: '11px',
              fontWeight: 'bold',
              letterSpacing: '0.5px',
              paddingBottom: '10px'
            }}
          />
          {/* Calorie Consumed Area */}
          <Area
            name="Calorie Consumed"
            type="monotone"
            dataKey="consumed"
            stroke="#FF5733"
            strokeWidth={3}
            fillOpacity={1}
            fill="url(#colorConsumed)"
            dot={{ r: 3, fill: '#FF5733', strokeWidth: 0 }}
            activeDot={{ r: 6, fill: '#FF5733', stroke: '#0F1928', strokeWidth: 2 }}
          />
          {/* Calorie Burned Area */}
          <Area
            name="Calorie Burned"
            type="monotone"
            dataKey="burned"
            stroke="#39FF14"
            strokeWidth={3}
            fillOpacity={1}
            fill="url(#colorBurned)"
            dot={{ r: 3, fill: '#39FF14', strokeWidth: 0 }}
            activeDot={{ r: 6, fill: '#39FF14', stroke: '#0F1928', strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
