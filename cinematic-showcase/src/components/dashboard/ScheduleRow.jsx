import React from 'react';
import { CheckCircle2, Play, Circle, Sparkles } from 'lucide-react';
import clsx from 'clsx';

export default function ScheduleRow({ time, name, duration, status, onClick, onToggle, isAI, goal, fitnessLevel }) {
  const getStatusIcon = () => {
    switch (status) {
      case 'completed':
      case 'Done':
        return <CheckCircle2 className="w-5 h-5 text-actionGreen fill-actionGreen/10" />;
      case 'in-progress':
      case 'In Progress':
        return <Play className="w-5 h-5 text-accentCyan fill-accentCyan/10 animate-pulse" />;
      default:
        return <Circle className="w-5 h-5 text-mutedText" />;
    }
  };

  const getStatusStyle = () => {
    switch (status) {
      case 'completed':
      case 'Done':
        return 'bg-actionGreen/10 border-actionGreen/20 text-actionGreen';
      case 'in-progress':
      case 'In Progress':
        return 'bg-accentCyan/10 border-accentCyan/20 text-accentCyan';
      default:
        return 'bg-white/[0.02] border-white/5 text-mutedText';
    }
  };

  const formatGoal = (g) => {
    if (!g) return '';
    return g.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase());
  };

  return (
    <div 
      onClick={onClick}
      className={clsx(
        "w-full flex items-center justify-between p-4 rounded-xl border transition-all duration-200 cursor-pointer select-none",
        status === 'in-progress' || status === 'In Progress'
          ? "bg-[#0F1928] border-accentCyan/20 shadow-neonCyan hover:border-accentCyan/45 hover:scale-[1.01]"
          : "bg-white/[0.01] border-white/5 hover:bg-[#0E1521] hover:border-cyan/20 hover:scale-[1.01]"
      )}
    >
      {/* Left: Time and Exercise info */}
      <div className="flex items-center space-x-4">
        {/* Status Checkbox Button */}
        <div 
          onClick={(e) => {
            e.stopPropagation();
            onToggle();
          }}
          className="flex-shrink-0 hover:scale-110 transition-transform cursor-pointer"
        >
          {getStatusIcon()}
        </div>

        <div>
          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-mono font-bold text-mutedText bg-white/[0.03] px-2 py-0.5 rounded border border-white/5">
              {time}
            </span>
            {isAI && (
              <span className="text-[9px] font-bold text-accentCyan bg-accentCyan/15 px-1.5 py-0.5 rounded flex items-center gap-0.5 uppercase tracking-wider">
                <Sparkles className="w-2.5 h-2.5" /> AI Plan
              </span>
            )}
            {goal && (
              <span className="text-[8px] font-bold text-orange-400 bg-orange-500/10 px-1.5 py-0.5 rounded uppercase tracking-wider">
                {formatGoal(goal)}
              </span>
            )}
            {fitnessLevel && (
              <span className="text-[8px] font-bold text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded uppercase tracking-wider">
                {fitnessLevel}
              </span>
            )}
          </div>
          <p className={clsx(
            "text-sm font-semibold mt-1",
            status === 'completed' || status === 'Done' ? "text-mutedText line-through" : "text-white"
          )}>
            {name}
          </p>
        </div>
      </div>

      {/* Right: Duration & Status tag */}
      <div className="flex items-center space-x-4">
        <span className="text-xs font-mono font-medium text-mutedText">
          {duration} min
        </span>
        <span className={clsx(
          "text-[10px] uppercase font-bold tracking-widest px-2.5 py-1 rounded-full border",
          getStatusStyle()
        )}>
          {status}
        </span>
      </div>
    </div>
  );
}
