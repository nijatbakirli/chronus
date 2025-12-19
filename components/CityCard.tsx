import React, { useMemo } from 'react';
import { City } from '../types';
import { WORK_HOURS_START, WORK_HOURS_END } from '../constants';
import { X, Moon, Sun, Cloud, CloudRain, Snowflake, Wind, Clock, Briefcase, MapPin } from 'lucide-react';

interface CityCardProps {
  city: City;
  referenceDate: Date;
  duration: number; // minutes
  onRemove: (id: string) => void;
}

export const CityCard: React.FC<CityCardProps> = ({ city, referenceDate, duration, onRemove }) => {
  const safeDate = isNaN(referenceDate.getTime()) ? new Date() : referenceDate;

  // Local Time Formatter (24H)
  const createFormatter = (timeZone: string) => {
    try {
      return new Intl.DateTimeFormat('en-GB', { // en-GB uses 24h by default
        timeZone,
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
        weekday: 'short',
        day: 'numeric',
        month: 'short'
      });
    } catch (e) {
      return new Intl.DateTimeFormat('en-GB', {
        timeZone: 'UTC',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
        weekday: 'short',
        day: 'numeric',
        month: 'short'
      });
    }
  };

  const formatter = createFormatter(city.timezone);
  const parts = formatter.formatToParts(safeDate);
  const getPart = (type: string) => parts.find(p => p.type === type)?.value;
  
  const hourStr = getPart('hour') || '00';
  const minuteStr = getPart('minute') || '00';
  const hour = parseInt(hourStr);
  const minute = parseInt(minuteStr);
  const weekday = getPart('weekday');
  const day = getPart('day');
  const month = getPart('month');

  // Baku Time Calculation for Comparison
  let bakuTimeStr = "--:--";
  try {
    bakuTimeStr = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Baku',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).format(safeDate);
  } catch (e) {
    bakuTimeStr = "Err";
  }

  // Relative Day Calculation
  let dayOffsetLabel = null;
  let dayOffsetColor = "";
  try {
     const localDateString = new Date(safeDate).toLocaleString('en-US', { timeZone: city.timezone });
     const localDate = new Date(localDateString);
     const utcDateString = new Date(safeDate).toLocaleString('en-US', { timeZone: 'UTC' });
     const utcDate = new Date(utcDateString);

     const diffTime = localDate.getDate() - utcDate.getDate();
     if (diffTime === 1 || diffTime < -25) {
       dayOffsetLabel = "+1 Day";
       dayOffsetColor = "text-indigo-400 border-indigo-500/30 bg-indigo-500/10";
     }
     else if (diffTime === -1 || diffTime > 25) {
       dayOffsetLabel = "-1 Day";
       dayOffsetColor = "text-amber-400 border-amber-500/30 bg-amber-500/10";
     }
  } catch (e) {}

  // Business Hours & Logic
  const startDecimal = hour + minute / 60;
  const endDecimal = startDecimal + duration / 60;
  
  const isStartBusiness = startDecimal >= WORK_HOURS_START && startDecimal < WORK_HOURS_END;
  const isEndBusiness = endDecimal <= WORK_HOURS_END + 0.5; 
  const isBusinessHours = isStartBusiness && isEndBusiness;
  const isOvertime = isStartBusiness && !isEndBusiness;
  const isNight = hour >= 22 || hour < 6;

  // Weather Logic
  const weather = useMemo(() => {
    const daySeed = safeDate.getDate() + safeDate.getMonth() * 30;
    const seed = city.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) + daySeed;
    
    const monthIndex = safeDate.getMonth(); 
    const isNorthern = city.timezone.includes('Europe') || city.timezone.includes('America') || city.timezone.includes('Asia');
    const seasonOffset = isNorthern 
      ? Math.cos((monthIndex - 6) * Math.PI / 6) * 10 
      : Math.cos((monthIndex) * Math.PI / 6) * 10;
    
    const diurnalOffset = Math.sin((hour - 10) * Math.PI / 12) * 5;
    
    let temp = Math.round(city.baseTemp + seasonOffset + diurnalOffset);
    if (isNaN(temp)) temp = city.baseTemp;
    
    const conditions = ['Sunny', 'Cloudy', 'Rainy', 'Windy'];
    let condition = conditions[seed % conditions.length] || 'Sunny';
    
    if (isNight) {
      if (condition === 'Sunny') condition = 'Clear';
      if (condition === 'Cloudy') condition = 'Partly Cloudy';
    }
    
    return { temp, condition };
  }, [city, safeDate, hour, isNight]);

  const WeatherIcon = () => {
    if (weather.condition.includes('Rain')) return <CloudRain size={16} className="text-blue-400" />;
    if (weather.condition.includes('Snow')) return <Snowflake size={16} className="text-white" />;
    if (weather.condition.includes('Cloud')) return <Cloud size={16} className="text-slate-400" />;
    if (weather.condition.includes('Wind')) return <Wind size={16} className="text-slate-400" />;
    if (isNight) return <Moon size={16} className="text-indigo-300" />;
    return <Sun size={16} className="text-amber-400" />;
  };

  const statusColor = isBusinessHours 
    ? 'border-emerald-500/30 shadow-[0_0_40px_-10px_rgba(16,185,129,0.15)] ring-1 ring-emerald-500/20' 
    : isOvertime 
      ? 'border-amber-500/30 ring-1 ring-amber-500/20' 
      : isNight 
        ? 'border-indigo-900/50 opacity-90' 
        : 'border-white/5';
        
  const statusBg = isBusinessHours 
    ? 'bg-gradient-to-br from-emerald-950/30 via-slate-900/50 to-transparent'
    : isNight
      ? 'bg-gradient-to-br from-indigo-950/40 via-slate-900/50 to-transparent'
      : 'bg-slate-900/40';

  return (
    <div className={`relative group h-full flex flex-col justify-between p-5 sm:p-6 rounded-[2rem] border ${statusColor} ${statusBg} backdrop-blur-2xl transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl overflow-hidden`}>
      
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl pointer-events-none -mr-16 -mt-16 group-hover:bg-white/10 transition-colors"></div>
      
      {/* Header */}
      <div className="relative z-10 flex justify-between items-start mb-4">
        <div className="flex items-center gap-4">
          <div className="relative w-10 h-10 sm:w-12 sm:h-12 rounded-full overflow-hidden border border-white/10 shadow-lg group-hover:shadow-indigo-500/20 transition-shadow shrink-0 bg-slate-800">
            <img 
              src={`https://flagcdn.com/w80/${city.countryCode.toLowerCase()}.png`} 
              alt={city.countryCode}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="min-w-0">
            <h3 className="text-lg sm:text-xl font-bold text-white leading-none mb-1 group-hover:text-indigo-200 transition-colors truncate">{city.name}</h3>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest max-w-[140px] truncate">{city.region}</p>
          </div>
        </div>
        <button 
          onClick={() => onRemove(city.id)}
          className="p-2 -mr-2 -mt-2 rounded-full text-slate-600 hover:text-red-400 hover:bg-white/5 transition-all sm:opacity-0 group-hover:opacity-100"
        >
          <X size={18} />
        </button>
      </div>

      {/* Time Display */}
      <div className="relative z-10 flex-1 flex flex-col justify-center py-2 sm:py-4">
        <div className="flex items-center gap-4 sm:gap-6">
          <span className="text-5xl sm:text-7xl font-light tracking-tighter text-white tabular-nums drop-shadow-2xl text-glow leading-none">
            {hourStr}:{minuteStr}
          </span>
          
          {/* Vertical Divider */}
          <div className="w-px h-10 sm:h-12 bg-white/10"></div>
          
          {/* Baku Time Comparison */}
          <div className="flex flex-col justify-center">
             <span className="text-2xl sm:text-3xl font-medium text-amber-400 font-mono leading-none tracking-tight tabular-nums">{bakuTimeStr}</span>
             <span className="text-[10px] sm:text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Baku</span>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-3 sm:mt-4">
          <span className="text-xs sm:text-sm font-medium text-indigo-200/80 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
            {weekday}, {month} {day}
          </span>
          {dayOffsetLabel && (
            <span className={`text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded border ${dayOffsetColor}`}>
              {dayOffsetLabel}
            </span>
          )}
        </div>
      </div>

      {/* Footer Info */}
      <div className="relative z-10 pt-4 sm:pt-5 mt-auto border-t border-white/5 grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1">
          <span className="text-[8px] sm:text-[9px] uppercase tracking-widest text-slate-500 font-bold">Weather</span>
          <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-200 font-medium bg-black/20 self-start px-2 py-1 rounded-lg">
            <WeatherIcon />
            <span>{weather.temp}°C</span>
          </div>
        </div>

        <div className="flex flex-col gap-1 items-end">
          <span className="text-[8px] sm:text-[9px] uppercase tracking-widest text-slate-500 font-bold">Business Status</span>
          <div className="flex items-center gap-1.5">
            {isBusinessHours && (
              <span className="flex items-center gap-1.5 text-[10px] sm:text-xs font-bold text-emerald-400 px-2 py-1 rounded-lg bg-emerald-950/40 border border-emerald-500/20">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                Active
              </span>
            )}
            {isOvertime && (
              <span className="text-[10px] sm:text-xs font-bold text-amber-400 flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-950/40 border border-amber-500/20">
                <Briefcase size={12} /> Closing
              </span>
            )}
            {isNight && (
              <span className="text-[10px] sm:text-xs font-bold text-indigo-300 flex items-center gap-1 px-2 py-1 rounded-lg bg-indigo-950/40 border border-indigo-500/20">
                <Moon size={12} /> Asleep
              </span>
            )}
            {!isBusinessHours && !isOvertime && !isNight && (
              <span className="text-[10px] sm:text-xs font-bold text-slate-400 flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-800/50 border border-slate-700">
                <Clock size={12} /> Closed
              </span>
            )}
          </div>
        </div>
      </div>
      
      {/* Day Cycle Progress Bar */}
      <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-slate-900/80">
         <div 
           className={`h-full transition-all duration-1000 ease-out relative ${isBusinessHours ? 'bg-gradient-to-r from-emerald-600 to-emerald-400' : 'bg-gradient-to-r from-indigo-700 to-indigo-500'}`}
           style={{ width: `${(startDecimal / 24) * 100}%` }}
         >
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 bg-white rounded-full shadow-[0_0_10px_white]"></div>
         </div>
      </div>
    </div>
  );
};