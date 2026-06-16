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
    { day: 'Wed', burned: 0, consumed: 1950 },
    { day: 'Thu', burned: 510, consumed: 2200 },
    { day: 'Fri', burned: 730, consumed: 1850 },
    { day: 'Sat', burned: 847, consumed: 2300 },
  ];

  return (
    <div className="w-full h-64 font-sans">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            {/* Volumetric 3D glowing gradients */}
            <linearGradient id="colorConsumed" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#FF5733" stopOpacity={0.35}/>
              <stop offset="95%" stopColor="#FF5733" stopOpacity={0.0}/>
            </linearGradient>
            <linearGradient id="colorBurned" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#39FF14" stopOpacity={0.35}/>
              <stop offset="95%" stopColor="#39FF14" stopOpacity={0.0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
          <XAxis 
            dataKey="day" 
            stroke="#8892A4" 
            fontSize={11} 
            tickLine={false} 
            axisLine={false} 
            dy={8}
          />
          <YAxis 
            stroke="#8892A4" 
            fontSize={11} 
            tickLine={false} 
            axisLine={false} 
            dx={-8}
          />
          <Tooltip
            contentStyle={{
              background: 'rgba(11, 18, 31, 0.95)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '16px',
              fontSize: '12px',
              color: '#FFFFFF',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.6)',
              backdropFilter: 'blur(10px)'
            }}
            cursor={{ stroke: 'rgba(255, 255, 255, 0.08)', strokeWidth: 1 }}
          />
          <Legend 
            verticalAlign="top" 
            align="right"
            height={36}
            iconType="circle"
            iconSize={8}
            wrapperStyle={{
              fontSize: '10px',
              fontWeight: 'bold',
              textTransform: 'uppercase',
              letterSpacing: '1px',
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
            dot={{ r: 2, fill: '#FF5733', strokeWidth: 0 }}
            activeDot={{ r: 5, fill: '#FF5733', stroke: '#050510', strokeWidth: 2 }}
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
            dot={{ r: 2, fill: '#39FF14', strokeWidth: 0 }}
            activeDot={{ r: 5, fill: '#39FF14', stroke: '#050510', strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
