import React, { useMemo } from 'react';
import { City } from '../types';
import { WORK_HOURS_START, WORK_HOURS_END } from '../constants';

interface TimelineSliderProps {
  currentDate: Date;
  onChange: (newDate: Date) => void;
  cities: City[];
  duration: number; // in minutes
}

export const TimelineSlider: React.FC<TimelineSliderProps> = ({ currentDate, onChange, cities, duration }) => {
  const safeDate = isNaN(currentDate.getTime()) ? new Date() : currentDate;
  const totalMinutes = safeDate.getUTCHours() * 60 + safeDate.getUTCMinutes();
  const durationPercent = (duration / 1440) * 100;

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const minutes = parseInt(e.target.value);
    const newDate = new Date(safeDate);
    newDate.setUTCHours(Math.floor(minutes / 60));
    newDate.setUTCMinutes(minutes % 60);
    onChange(newDate);
  };

  const overlapMap = useMemo(() => {
    // 96 segments (every 15 mins) for smoother resolution
    return Array.from({ length: 96 }).map((_, i) => {
      const minutesOfDay = i * 15;
      const hour = Math.floor(minutesOfDay / 60);
      const minute = minutesOfDay % 60;
      
      if (cities.length === 0) return 0;
      
      let citiesInBusinessHours = 0;
      cities.forEach(city => {
        try {
          const checkDate = new Date();
          checkDate.setUTCHours(hour);
          checkDate.setUTCMinutes(minute);
          
          const localHourStr = checkDate.toLocaleTimeString('en-US', { timeZone: city.timezone, hour: 'numeric', minute: 'numeric', hour12: false });
          const [lH, lM] = localHourStr.split(':').map(Number);
          const dec = lH + lM / 60;
          
          if (dec >= WORK_HOURS_START && dec < WORK_HOURS_END) {
            citiesInBusinessHours++;
          }
        } catch (e) {}
      });

      return citiesInBusinessHours / cities.length;
    });
  }, [cities]);

  return (
    <div className="w-full relative py-8 select-none group/slider touch-none">
      {/* Markers */}
      <div className="absolute top-0 left-0 right-0 flex justify-between text-[8px] sm:text-[10px] font-bold text-slate-600 px-[1px]">
        <span>00:00</span>
        <span>04:00</span>
        <span>08:00</span>
        <span>12:00</span>
        <span>16:00</span>
        <span>20:00</span>
        <span>24:00</span>
      </div>

      <div className="relative h-14 flex items-center mt-2">
        {/* Track Container */}
        <div className="absolute inset-x-0 h-3 bg-slate-800/80 rounded-full overflow-hidden flex items-center ring-1 ring-white/5 backdrop-blur-sm">
           {overlapMap.map((score, i) => {
             // Calculate opacity/intensity based on score
             // Use emerald for high overlap, indigo for low
             let colorClass = 'bg-slate-800';
             let opacity = 0;
             
             if (score > 0) {
               opacity = 0.3 + (score * 0.7); // Min 0.3 opacity if any overlap
               colorClass = score === 1 ? 'bg-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.6)] z-10' 
                           : score > 0.5 ? 'bg-emerald-600' 
                           : 'bg-indigo-600';
             }

             return (
               <div 
                 key={i} 
                 className={`flex-1 h-full transition-all duration-300 ${colorClass}`}
                 style={{ opacity }}
               />
             );
           })}
        </div>
        
        {/* Invisible Range Input */}
        <input
          type="range"
          min="0"
          max="1439"
          value={totalMinutes}
          onChange={handleSliderChange}
          className="absolute inset-x-0 w-full h-full opacity-0 cursor-pointer z-40"
          aria-label="Time Slider"
        />

        {/* Meeting Block (Duration) */}
        <div 
          className="absolute h-8 top-1/2 -translate-y-1/2 bg-white/5 border-x border-white/30 rounded-sm pointer-events-none z-20 backdrop-blur-[1px] transition-all duration-75"
          style={{ 
            left: `${(totalMinutes / 1440) * 100}%`, 
            width: `${durationPercent}%`,
            minWidth: '2px'
          }}
        >
          <div className="absolute -bottom-6 left-0 text-[8px] sm:text-[9px] text-slate-500 font-mono whitespace-nowrap">
             Duration
          </div>
        </div>

        {/* Current Time Handle */}
        <div 
          className="absolute h-10 w-0.5 top-1/2 -translate-y-1/2 bg-white pointer-events-none z-30 shadow-[0_0_20px_rgba(255,255,255,1)] transition-all duration-75"
          style={{ left: `${(totalMinutes / 1440) * 100}%` }}
        >
          {/* Knob */}
          <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-6 h-6 sm:w-5 sm:h-5 bg-white rounded-full shadow-lg flex items-center justify-center">
             <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full"></div>
          </div>
          
          {/* Tooltip */}
          <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-slate-900 border border-indigo-500/50 text-white text-[10px] sm:text-xs font-bold px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg shadow-2xl whitespace-nowrap z-50 pointer-events-none">
             {safeDate.toISOString().substring(11, 16)} <span className="text-indigo-400">UTC</span>
             <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-slate-900 border-r border-b border-indigo-500/50 rotate-45"></div>
          </div>
        </div>
      </div>
    </div>
  );
};