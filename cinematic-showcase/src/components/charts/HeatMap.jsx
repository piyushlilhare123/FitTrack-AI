import React from 'react';

export default function HeatMap({ workouts = [] }) {
  // Generate 26 weeks (6 months, 26 * 7 = 182 cells)
  const columns = 26;
  const totalCells = columns * 7;
  const today = new Date();

  // Create date objects for each cell (starting from oldest to today)
  const cells = Array.from({ length: totalCells }).map((_, index) => {
    const d = new Date();
    // Offset by index days backwards from today
    d.setDate(today.getDate() - (totalCells - 1 - index));
    d.setHours(0, 0, 0, 0);
    return d;
  });

  // Helper to map date to workout intensity color
  const getCellColor = (cellDate) => {
    // Find workouts on this date
    const dayWorkouts = workouts.filter(w => {
      const wDate = new Date(w.date);
      wDate.setHours(0, 0, 0, 0);
      return wDate.getTime() === cellDate.getTime();
    });

    if (dayWorkouts.length === 0) return 'bg-[#0F1928] hover:bg-white/10'; // empty

    const totalCals = dayWorkouts.reduce((sum, w) => sum + (w.totalCalories || 0), 0);

    if (totalCals < 300) return 'bg-[#0F6E56] glow-cyan-hover'; // low
    if (totalCals < 600) return 'bg-[#39FF14] glow-green-hover'; // mid
    return 'bg-[#00F5FF] glow-cyan-hover'; // high
  };

  const dayNames = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  // Generate month headers
  const monthLabels = [];
  let lastMonth = -1;
  
  for (let c = 0; c < columns; c++) {
    const colStartDate = cells[c * 7];
    const month = colStartDate.getMonth();
    
    if (month !== lastMonth) {
      monthLabels.push({
        colIndex: c,
        label: colStartDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
      });
      lastMonth = month;
    }
  }

  return (
    <div className="flex flex-col space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-white uppercase tracking-wider">6-Month Consistency Tracker</span>
        <div className="flex items-center space-x-1.5 text-[10px] text-mutedText">
          <span>Less</span>
          <div className="w-2.5 h-2.5 rounded-sm bg-[#0F1928] cursor-help" title="0 kcal burned"></div>
          <div className="w-2.5 h-2.5 rounded-sm bg-[#0F6E56] cursor-help" title="1 - 299 kcal burned"></div>
          <div className="w-2.5 h-2.5 rounded-sm bg-[#39FF14] cursor-help" title="300 - 599 kcal burned"></div>
          <div className="w-2.5 h-2.5 rounded-sm bg-[#00F5FF] cursor-help" title="600+ kcal burned"></div>
          <span>More</span>
        </div>
      </div>

      <div className="flex items-start space-x-2 overflow-x-auto pb-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {/* Days label */}
        <div className="grid grid-rows-7 gap-1 text-[9px] text-mutedText pr-1 font-mono mt-5 h-28 select-none">
          {dayNames.map((day, idx) => (
            <div key={idx} className="h-3 flex items-center justify-center font-bold">
              {idx % 2 === 1 ? day : ''}
            </div>
          ))}
        </div>

        <div className="flex flex-col">
          {/* Month labels */}
          <div 
            className="grid gap-1 mb-1"
            style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
          >
            {Array.from({ length: columns }).map((_, c) => {
              const labelObj = monthLabels.find(m => m.colIndex === c);
              return (
                <div key={c} className="text-[10px] font-bold text-mutedText text-left whitespace-nowrap overflow-visible h-4">
                  {labelObj ? labelObj.label : ''}
                </div>
              );
            })}
          </div>

          {/* Heatmap Grid */}
          <div 
            className="grid grid-flow-col grid-rows-7 gap-1"
            style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
          >
            {cells.map((cellDate, idx) => {
              const isToday = cellDate.getTime() === new Date().setHours(0,0,0,0);
              return (
                <div
                  key={idx}
                  className={`w-3.5 h-3.5 rounded-sm transition-all duration-200 cursor-pointer ${getCellColor(cellDate)} ${
                    isToday ? 'ring-1 ring-white/40' : ''
                  }`}
                  title={`${cellDate.toLocaleDateString()}: ${workouts.filter(w => {
                    const wDate = new Date(w.date);
                    wDate.setHours(0, 0, 0, 0);
                    return wDate.getTime() === cellDate.getTime();
                  }).length} workouts logged.`}
                />
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
