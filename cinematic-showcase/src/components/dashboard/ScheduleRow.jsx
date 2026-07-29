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
        "w-full flex flex-col sm:flex-row sm:items-center justify-between p-3.5 sm:p-4 rounded-xl border transition-all duration-200 cursor-pointer select-none gap-3 sm:gap-4",
        status === 'in-progress' || status === 'In Progress'
          ? "bg-[#0F1928] border-accentCyan/30 shadow-neonCyan hover:border-accentCyan/50"
          : "bg-[#0F1928]/60 border-white/10 hover:bg-[#0E1521] hover:border-cyan/30"
      )}
    >
      {/* Left: Time and Exercise info */}
      <div className="flex items-start sm:items-center space-x-3 sm:space-x-4 min-w-0 flex-1">
        {/* Status Checkbox Button */}
        <div 
          onClick={(e) => {
            e.stopPropagation();
            onToggle();
          }}
          className="flex-shrink-0 mt-0.5 sm:mt-0 hover:scale-110 transition-transform cursor-pointer"
        >
          {getStatusIcon()}
        </div>

        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] font-mono font-bold text-white bg-white/10 px-2 py-0.5 rounded border border-white/10">
              {time}
            </span>
            {isAI && (
              <span className="text-[9px] font-bold text-accentCyan bg-accentCyan/20 border border-accentCyan/30 px-1.5 py-0.5 rounded flex items-center gap-0.5 uppercase tracking-wider">
                <Sparkles className="w-2.5 h-2.5" /> AI Plan
              </span>
            )}
            {goal && (
              <span className="text-[8px] font-bold text-orange-300 bg-orange-500/20 border border-orange-500/30 px-1.5 py-0.5 rounded uppercase tracking-wider">
                {formatGoal(goal)}
              </span>
            )}
            {fitnessLevel && (
              <span className="text-[8px] font-bold text-purple-300 bg-purple-500/20 border border-purple-500/30 px-1.5 py-0.5 rounded uppercase tracking-wider">
                {fitnessLevel}
              </span>
            )}
          </div>
          <p className={clsx(
            "text-xs sm:text-sm font-bold leading-tight break-words",
            status === 'completed' || status === 'Done' ? "text-white/50 line-through" : "text-white"
          )}>
            {name}
          </p>
        </div>
      </div>

      {/* Right: Duration & Status tag */}
      <div className="flex items-center justify-between sm:justify-end space-x-3 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-white/5 flex-shrink-0">
        <span className="text-xs font-mono font-bold text-cyan">
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
