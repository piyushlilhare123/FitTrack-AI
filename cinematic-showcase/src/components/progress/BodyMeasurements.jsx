import React, { useState } from 'react';
import { Ruler, Plus, Check } from 'lucide-react';
import toast from 'react-hot-toast';

export default function BodyMeasurements() {
  const [measurements, setMeasurements] = useState({
    chest: '102',
    waist: '84',
    biceps: '38',
    thighs: '60'
  });

  const [isEditing, setIsEditing] = useState(false);
  const [tempMeasurements, setTempMeasurements] = useState({ ...measurements });

  const handleSave = () => {
    setMeasurements({ ...tempMeasurements });
    setIsEditing(false);
    toast.success('Body measurements updated successfully!');
  };

  const bodyParts = [
    { key: 'chest', label: 'Chest', color: 'from-blue-500/20 to-cyan-500/10', text: 'text-cyan' },
    { key: 'waist', label: 'Waist', color: 'from-purple-500/20 to-pink-500/10', text: 'text-purple-400' },
    { key: 'biceps', label: 'Biceps', color: 'from-orange-500/20 to-red-500/10', text: 'text-orange-400' },
    { key: 'thighs', label: 'Thighs', color: 'from-green-500/20 to-emerald-500/10', text: 'text-green-400' },
  ];

  return (
    <div className="w-full flex flex-col h-full space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <Ruler className="w-4 h-4 text-cyan" /> Body Tape (cm)
        </h3>
        {isEditing ? (
          <button 
            onClick={handleSave}
            className="text-[10px] font-bold text-black bg-cyan px-3 py-1 rounded-full flex items-center gap-1 hover:bg-cyan/80 transition-colors"
          >
            <Check className="w-3 h-3" /> Save
          </button>
        ) : (
          <button 
            onClick={() => setIsEditing(true)}
            className="text-[10px] font-bold text-cyan bg-cyan/10 border border-cyan/20 px-3 py-1 rounded-full flex items-center gap-1 hover:bg-cyan/20 transition-colors"
          >
            Edit
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 flex-1">
        {bodyParts.map((part) => (
          <div 
            key={part.key} 
            className={`flex flex-col justify-center items-center p-4 rounded-2xl bg-gradient-to-b ${part.color} border border-white/5 relative overflow-hidden group`}
          >
            {/* Background glow effect */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-white/[0.03]"></div>
            
            <span className="text-[10px] font-bold text-mutedText uppercase tracking-widest mb-2 z-10">{part.label}</span>
            
            {isEditing ? (
              <div className="flex items-end gap-1 z-10">
                <input 
                  type="number"
                  value={tempMeasurements[part.key]}
                  onChange={(e) => setTempMeasurements({...tempMeasurements, [part.key]: e.target.value})}
                  className="w-16 bg-black/40 border border-white/10 rounded-lg py-1 px-2 text-center text-white font-mono font-bold text-lg focus:outline-none focus:border-cyan/50"
                />
                <span className="text-[10px] text-mutedText mb-1.5 font-bold">cm</span>
              </div>
            ) : (
              <div className="flex items-end gap-1 z-10">
                <span className={`text-3xl font-mono font-black ${part.text} drop-shadow-md`}>
                  {measurements[part.key]}
                </span>
                <span className="text-[10px] text-mutedText mb-1.5 font-bold">cm</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
