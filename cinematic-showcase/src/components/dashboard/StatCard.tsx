import React from 'react';
import Card from '../ui/Card';

interface StatCardProps {
  title: string;
  value: string;
  subtext?: string;
  icon?: any;
  colorClass?: string;
  progress?: number;
  progressColor?: string;
  onClick?: () => void;
}

export default function StatCard({ 
  title, 
  value, 
  subtext, 
  icon: Icon, 
  colorClass = 'text-accentCyan', 
  progress, 
  progressColor = '#00F5FF',
  onClick
}: StatCardProps) {
  return (
    <div onClick={onClick} className={onClick ? "cursor-pointer" : ""}>
      <Card className="flex items-center justify-between p-5 relative overflow-hidden transition-all hover:border-white/10 h-full">
        <div className="space-y-1.5 z-10">
        <span className="text-[10px] uppercase font-bold text-mutedText tracking-widest">{title}</span>
        <h3 className="text-2xl font-mono font-extrabold text-white tracking-tight">{value}</h3>
        {subtext && <p className="text-xs text-mutedText">{subtext}</p>}
      </div>

      <div className="flex flex-col items-center justify-center z-10">
        {progress !== undefined ? (
          /* Circular Progress Ring */
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
                stroke={progressColor}
                strokeWidth="4"
                fill="transparent"
                strokeDasharray={138}
                strokeDashoffset={138 - (138 * Math.min(100, progress)) / 100}
                strokeLinecap="round"
              />
            </svg>
            <span className="absolute text-[10px] font-mono font-bold text-white">
              {Math.round(progress)}%
            </span>
          </div>
        ) : (
          /* Simple Icon Container */
          Icon && (
            <div className={`w-11 h-11 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-center ${colorClass}`}>
              <Icon className="w-5 h-5" />
            </div>
          )
        )}
      </div>
    </Card>
    </div>
  );
}
