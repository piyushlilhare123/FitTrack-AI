import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function WeeklyDetailsModal({ 
  isOpen, 
  onClose, 
  title, 
  colorStr, // e.g. '#39FF14'
  shadowStr, // e.g. 'rgba(57,255,20,0.25)'
  dateRange, 
  details, // Array of { dayName, dateStr, value, label }
  formatValue // Optional function to format the value string
}) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 pointer-events-none">
        {/* Full screen backdrop blur */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-[#050510]/80 backdrop-blur-[10px] pointer-events-auto"
        ></motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className={`relative w-full max-w-md z-10 bg-[#0B121F]/95 border border-white/10 rounded-3xl p-6 flex flex-col space-y-4 pointer-events-auto shadow-2xl`}
          style={{ boxShadow: `0 25px 60px -15px ${shadowStr}` }}
        >
          {/* Close button */}
          <button 
            onClick={onClose}
            className="absolute top-5 right-5 w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition-colors"
          >
            <span className="text-white text-xs font-bold">X</span>
          </button>

          <div className="flex flex-col border-b border-white/10 pb-3 pr-8">
            <h3 className="text-xl font-bold flex items-center gap-2" style={{ color: colorStr }}>
              {title}
            </h3>
            <p className="text-[10px] text-mutedText mt-1 font-mono">
              {dateRange}
            </p>
          </div>

          <div className="space-y-2">
            {details.map((day, idx) => (
              <div key={idx} className="flex items-center justify-between p-2 rounded-xl bg-white/[0.02] border border-white/5">
                <div className="flex items-center gap-3">
                  <div className={`w-1.5 h-1.5 rounded-full`} style={{ 
                    backgroundColor: day.value > 0 ? colorStr : 'rgba(255,255,255,0.2)',
                    boxShadow: day.value > 0 ? `0 0 10px ${colorStr}` : 'none'
                  }}></div>
                  <div>
                    <p className="text-xs font-bold text-white uppercase">{day.dayName}</p>
                    <p className="text-[9px] text-mutedText font-mono">{day.dateStr}</p>
                  </div>
                </div>
                <div className="text-right">
                  {day.value > 0 ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded border" style={{ 
                      color: colorStr, 
                      backgroundColor: `${colorStr}1a`, 
                      borderColor: `${colorStr}33` 
                    }}>
                      {formatValue ? formatValue(day.value) : day.value}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[9px] font-bold text-mutedText bg-white/[0.04] px-2 py-0.5 rounded border border-white/10">
                      NO DATA
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
