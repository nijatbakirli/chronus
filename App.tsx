import React, { useState, useEffect, useMemo } from 'react';
import { TimelineSlider } from './components/TimelineSlider';
import { CityCard } from './components/CityCard';
import { AddCityModal } from './components/AddCityModal';
import { CurrencyDashboard } from './components/CurrencyDashboard';
import { City } from './types';
import { INITIAL_CITIES, POPULAR_CITIES, WORK_HOURS_START, WORK_HOURS_END } from './constants';
import { Clock, Plus, RefreshCw, Calendar, RotateCcw, Zap, Share2, CalendarCheck, Check, Timer, ArrowDownAZ, ArrowUpNarrowWide, Coins, LayoutGrid, List } from 'lucide-react';

export default function App() {
  const [selectedCities, setSelectedCities] = useState<City[]>(INITIAL_CITIES);
  const [referenceDate, setReferenceDate] = useState(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLive, setIsLive] = useState(true);
  const [filterMode, setFilterMode] = useState<'all' | 'business' | 'night'>('all');
  const [sortMode, setSortMode] = useState<'time' | 'name' | 'manual'>('manual');
  const [isCopied, setIsCopied] = useState(false);
  const [showFinance, setShowFinance] = useState(false);
  const [meetingDuration, setMeetingDuration] = useState(60);

  useEffect(() => {
    if (window.location.protocol === 'blob:' || window.location.protocol === 'data:') return;
    const params = new URLSearchParams(window.location.search);
    const citiesParam = params.get('cities');
    const timeParam = params.get('time');
    const durationParam = params.get('duration');

    if (citiesParam) {
      const cityIds = citiesParam.split(',');
      const restoredCities = POPULAR_CITIES.filter(c => cityIds.includes(c.id));
      if (restoredCities.length > 0) setSelectedCities(restoredCities);
    }
    if (timeParam) {
      const date = new Date(timeParam);
      if (!isNaN(date.getTime())) {
        setReferenceDate(date);
        setIsLive(false);
      }
    }
    if (durationParam) {
      const d = parseInt(durationParam);
      if (!isNaN(d)) setMeetingDuration(d);
    }
  }, []);

  useEffect(() => {
    if (window.location.protocol === 'blob:' || window.location.protocol === 'data:') return;
    try {
      const params = new URLSearchParams();
      params.set('cities', selectedCities.map(c => c.id).join(','));
      if (!isLive && !isNaN(referenceDate.getTime())) params.set('time', referenceDate.toISOString());
      params.set('duration', meetingDuration.toString());
      const newUrl = `${window.location.pathname}?${params.toString()}`;
      window.history.replaceState(null, '', newUrl);
    } catch (e) {}
  }, [selectedCities, referenceDate, meetingDuration, isLive]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isLive) {
      interval = setInterval(() => {
        setReferenceDate(new Date());
      }, 1000 * 60);
    }
    return () => clearInterval(interval);
  }, [isLive]);

  const handleSliderChange = (newDate: Date) => {
    setIsLive(false);
    setReferenceDate(newDate);
  };

  const handleResetToNow = () => {
    setIsLive(true);
    setReferenceDate(new Date());
  };

  const handleAddCity = (city: City) => {
    setSelectedCities([...selectedCities, city]);
  };

  const handleRemoveCity = (id: string) => {
    setSelectedCities(selectedCities.filter(c => c.id !== id));
  };

  const handleShare = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const toggleSort = () => {
    if (sortMode === 'manual') setSortMode('time');
    else if (sortMode === 'time') setSortMode('name');
    else setSortMode('manual');
  };

  const handleExportCalendar = () => {
    try {
      if (isNaN(referenceDate.getTime())) return;
      const startTime = referenceDate.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
      const endDate = new Date(referenceDate.getTime() + meetingDuration * 60 * 1000);
      const endTime = endDate.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
      const description = selectedCities.map(c => {
        try {
          const time = referenceDate.toLocaleTimeString('en-GB', { timeZone: c.timezone, hour: '2-digit', minute: '2-digit', hour12: false });
          return `${c.name}: ${time}`;
        } catch { return `${c.name}: Error`; }
      }).join('\\n');

      const icsContent = [
        'BEGIN:VCALENDAR', 'VERSION:2.0', 'BEGIN:VEVENT',
        `DTSTART:${startTime}`, `DTEND:${endTime}`,
        'SUMMARY:Chronosync Meeting', `DESCRIPTION:Meeting across timezones (24h format):\\n\\n${description}`,
        'END:VEVENT', 'END:VCALENDAR'
      ].join('\n');

      const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.setAttribute('download', 'chronosync_meeting.ics');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) { console.error("Export failed", e); }
  };

  const findBestMeetingTime = () => {
    setIsLive(false);
    let bestHour = 0;
    let bestMinute = 0;
    let maxOverlap = -1;

    for (let h = 0; h < 24; h++) {
      for (let m of [0, 30]) {
        let overlapCount = 0;
        selectedCities.forEach(city => {
          try {
              const startDate = new Date(referenceDate);
              startDate.setUTCHours(h);
              startDate.setUTCMinutes(m);
              const startLocalStr = startDate.toLocaleTimeString('en-US', { timeZone: city.timezone, hour: 'numeric', minute: 'numeric', hour12: false });
              const [sH, sM] = startLocalStr.split(':').map(Number);
              const startDecimal = sH + sM / 60;
              const endDecimal = startDecimal + meetingDuration / 60;
              if (startDecimal >= WORK_HOURS_START && startDecimal < WORK_HOURS_END && endDecimal <= WORK_HOURS_END) {
                overlapCount++;
              }
          } catch (e) {}
        });
        if (overlapCount > maxOverlap) {
          maxOverlap = overlapCount;
          bestHour = h;
          bestMinute = m;
        }
      }
    }
    const newDate = new Date(referenceDate);
    newDate.setUTCHours(bestHour);
    newDate.setUTCMinutes(bestMinute);
    setReferenceDate(newDate);
  };

  const processedCities = useMemo(() => {
    let result = [...selectedCities];
    if (filterMode !== 'all') {
      result = result.filter(city => {
        try {
          const localHour = parseInt(referenceDate.toLocaleTimeString('en-US', { timeZone: city.timezone, hour: 'numeric', hour12: false }));
          if (isNaN(localHour)) return true;
          const isBusiness = localHour >= WORK_HOURS_START && localHour < WORK_HOURS_END;
          if (filterMode === 'business') return isBusiness;
          if (filterMode === 'night') return !isBusiness;
          return true;
        } catch { return true; }
      });
    }
    if (sortMode === 'time') {
      result.sort((a, b) => {
        try {
          const timeA = new Date(referenceDate.toLocaleString('en-US', { timeZone: a.timezone }));
          const timeB = new Date(referenceDate.toLocaleString('en-US', { timeZone: b.timezone }));
          return timeB.getTime() - timeA.getTime();
        } catch { return 0; }
      });
    } else if (sortMode === 'name') {
      result.sort((a, b) => a.name.localeCompare(b.name));
    }
    return result;
  }, [selectedCities, referenceDate, filterMode, sortMode]);

  // UTC Display in 24H
  const timeDisplay = !isNaN(referenceDate.getTime()) 
    ? referenceDate.toLocaleTimeString('en-GB', { timeZone: 'UTC', hour: '2-digit', minute: '2-digit', hour12: false })
    : "--:--";
    
  const dateDisplay = !isNaN(referenceDate.getTime())
    ? referenceDate.toLocaleDateString(undefined, { weekday: 'short', month: 'long', day: 'numeric' })
    : "Invalid Date";

  return (
    <div className="min-h-screen text-white font-sans overflow-x-hidden selection:bg-indigo-500/30">
      
      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none z-0">
         <div className="absolute top-[-20%] left-[-10%] w-[60vw] h-[60vw] bg-indigo-600/10 rounded-full blur-[130px] mix-blend-screen animate-float"></div>
         <div className="absolute bottom-[-20%] right-[-10%] w-[50vw] h-[50vw] bg-emerald-600/10 rounded-full blur-[130px] mix-blend-screen animate-float" style={{ animationDelay: '-3s' }}></div>
      </div>

      <div className="relative z-10 max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8 flex flex-col min-h-screen">
        
        {/* Header Section */}
        <header className="flex flex-col xl:flex-row xl:items-center justify-between mb-8 sm:mb-10 gap-6 animate-in fade-in slide-in-from-top-4 duration-700">
          <div className="flex-1 text-center sm:text-left">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3 sm:gap-5 mb-2 justify-center sm:justify-start">
               <div className="relative group">
                 <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500 to-purple-500 blur-lg opacity-40 group-hover:opacity-60 transition-opacity rounded-full"></div>
                 <div className="relative p-2.5 sm:p-3.5 bg-slate-900 border border-white/10 rounded-2xl shadow-xl">
                   <Clock className="text-white w-6 h-6 sm:w-8 sm:h-8" />
                 </div>
               </div>
               <div>
                 <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white via-indigo-200 to-slate-400 drop-shadow-sm">
                   Chronosync
                 </h1>
                 <p className="text-indigo-200/60 text-xs sm:text-sm font-medium tracking-widest uppercase mt-1">Global Team Synchronization</p>
               </div>
            </div>
          </div>

          <div className="w-full xl:w-auto overflow-x-auto pb-2 xl:pb-0 scrollbar-hide">
            <div className="flex flex-nowrap sm:flex-wrap items-center gap-2 sm:gap-3 p-2 bg-slate-900/40 border border-white/10 backdrop-blur-2xl rounded-[20px] sm:rounded-[24px] shadow-2xl min-w-max mx-auto xl:mx-0">
               
               {/* Duration Control */}
               <div className="flex items-center gap-2 sm:gap-3 px-3 sm:px-5 py-2 sm:py-3 border-r border-white/5">
                  <Timer size={18} className="text-indigo-400 shrink-0" />
                  <select 
                    value={meetingDuration}
                    onChange={(e) => setMeetingDuration(parseInt(e.target.value))}
                    className="bg-transparent text-xs sm:text-sm font-bold text-white focus:outline-none cursor-pointer hover:text-indigo-300 transition-colors uppercase tracking-wide"
                  >
                    <option value={15} className="bg-slate-900">15 min</option>
                    <option value={30} className="bg-slate-900">30 min</option>
                    <option value={45} className="bg-slate-900">45 min</option>
                    <option value={60} className="bg-slate-900">1 hour</option>
                    <option value={90} className="bg-slate-900">1.5 hours</option>
                    <option value={120} className="bg-slate-900">2 hours</option>
                  </select>
               </div>

               {/* UTC Display */}
               <div className="px-3 sm:px-6 py-2 flex flex-col items-center min-w-[100px] sm:min-w-[120px] border-r border-white/5">
                  <span className="text-[9px] sm:text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-0.5">UTC Master</span>
                  <span className="text-xl sm:text-2xl font-mono text-white tracking-tight leading-none text-glow">
                    {timeDisplay}
                  </span>
               </div>
               
               {/* Main Controls */}
               <div className="flex items-center gap-2 px-1 sm:px-2">
                  <button 
                    onClick={handleResetToNow}
                    className={`p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl transition-all border ${isLive ? 'bg-indigo-600 border-indigo-500 text-white shadow-[0_0_20px_-5px_rgba(79,70,229,0.5)]' : 'bg-white/5 border-transparent text-slate-400 hover:text-white hover:bg-white/10'}`}
                    title="Sync to Live Time"
                  >
                    {isLive ? <RefreshCw className="animate-spin-slow w-4 h-4 sm:w-5 sm:h-5" /> : <RotateCcw className="w-4 h-4 sm:w-5 sm:h-5" />}
                  </button>

                  <button
                      onClick={findBestMeetingTime}
                      className="flex items-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3.5 bg-gradient-to-r from-emerald-900/60 to-emerald-800/40 hover:from-emerald-800/60 hover:to-emerald-700/40 text-emerald-400 border border-emerald-500/20 rounded-xl sm:rounded-2xl transition-all hover:shadow-[0_0_25px_-5px_rgba(16,185,129,0.4)] group"
                  >
                      <Zap className="group-hover:text-emerald-300 transition-colors w-4 h-4 sm:w-[18px] sm:h-[18px]" />
                      <span className="hidden sm:inline font-bold text-xs sm:text-sm tracking-wide">Auto-Sync</span>
                  </button>

                  <button 
                    onClick={() => setShowFinance(!showFinance)}
                    className={`p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl transition-all border ${showFinance ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' : 'bg-white/5 border-transparent text-slate-400 hover:text-white hover:bg-white/10'}`}
                    title="Currency Converter"
                  >
                    <Coins className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>

                  <div className="w-px h-6 sm:h-8 bg-white/10 mx-1 sm:mx-2"></div>

                  <button 
                    onClick={handleShare}
                    className="p-2.5 sm:p-3.5 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white rounded-xl sm:rounded-2xl transition-all border border-transparent hover:border-white/5"
                    title="Copy Link"
                  >
                    {isCopied ? <Check className="text-emerald-400 w-4 h-4 sm:w-5 sm:h-5" /> : <Share2 className="w-4 h-4 sm:w-5 sm:h-5" />}
                  </button>

                  <button 
                    onClick={handleExportCalendar}
                    className="p-2.5 sm:p-3.5 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white rounded-xl sm:rounded-2xl transition-all border border-transparent hover:border-white/5"
                    title="Export .ics"
                  >
                    <CalendarCheck className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>

                  <button 
                    onClick={() => setIsModalOpen(true)}
                    className="ml-1 sm:ml-3 flex items-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3.5 bg-white text-slate-950 hover:bg-indigo-50 rounded-xl sm:rounded-2xl transition-all font-bold shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:shadow-[0_0_25px_rgba(255,255,255,0.3)] hover:scale-105 active:scale-95"
                  >
                    <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span className="hidden sm:inline">Add</span>
                  </button>
               </div>
            </div>
          </div>
        </header>

        {showFinance && <CurrencyDashboard cities={selectedCities} />}

        {/* Timeline Control */}
        <div className="sticky top-2 sm:top-6 z-30 mb-8 sm:mb-10 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">
          <div className="glass-panel p-4 sm:p-6 rounded-2xl sm:rounded-[2rem] shadow-2xl relative overflow-hidden ring-1 ring-white/10">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent"></div>
            
            <div className="flex flex-col md:flex-row justify-between items-center mb-4 sm:mb-6 gap-4">
               <div className="flex items-center gap-3 bg-slate-900/60 px-4 sm:px-5 py-2 sm:py-2.5 rounded-full border border-white/5 shadow-inner w-full md:w-auto justify-center md:justify-start">
                  <Calendar size={16} className="text-indigo-400 sm:w-[18px] sm:h-[18px]" />
                  <span className="text-xs sm:text-sm font-bold text-slate-200 tracking-wide">{dateDisplay}</span>
               </div>
               
               <div className="flex items-center gap-2 sm:gap-3 w-full md:w-auto justify-center md:justify-end overflow-x-auto pb-1 md:pb-0 scrollbar-hide">
                  {/* Filters */}
                  <div className="flex bg-slate-950/60 p-1 sm:p-1.5 rounded-xl sm:rounded-2xl border border-white/5 shrink-0">
                    <button onClick={() => setFilterMode('all')} className={`px-3 sm:px-5 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-bold transition-all uppercase tracking-wider ${filterMode === 'all' ? 'bg-slate-700 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>All</button>
                    <button onClick={() => setFilterMode('business')} className={`px-3 sm:px-5 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-bold transition-all uppercase tracking-wider ${filterMode === 'business' ? 'bg-emerald-900/30 text-emerald-400 shadow-lg ring-1 ring-emerald-500/20' : 'text-slate-500 hover:text-emerald-300'}`}>Open</button>
                    <button onClick={() => setFilterMode('night')} className={`px-3 sm:px-5 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-bold transition-all uppercase tracking-wider ${filterMode === 'night' ? 'bg-indigo-900/30 text-indigo-400 shadow-lg ring-1 ring-indigo-500/20' : 'text-slate-500 hover:text-indigo-300'}`}>Asleep</button>
                  </div>

                  {/* Sort */}
                  <button 
                    onClick={toggleSort}
                    className="flex items-center gap-2 px-3 sm:px-5 py-2 sm:py-3 rounded-xl sm:rounded-2xl bg-slate-950/60 border border-white/5 text-[10px] sm:text-xs font-bold text-slate-400 hover:text-white transition-all uppercase tracking-wider hover:bg-white/5 shrink-0"
                  >
                    {sortMode === 'time' && <><ArrowUpNarrowWide size={12} className="sm:w-[14px] sm:h-[14px]" /> Time</>}
                    {sortMode === 'name' && <><ArrowDownAZ size={12} className="sm:w-[14px] sm:h-[14px]" /> Name</>}
                    {sortMode === 'manual' && <span className="text-slate-500">Manual</span>}
                  </button>
               </div>
            </div>
            
            <TimelineSlider 
              currentDate={referenceDate} 
              onChange={handleSliderChange} 
              cities={selectedCities}
              duration={meetingDuration}
            />
          </div>
        </div>

        {/* City Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-8 pb-24 animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-200">
          {processedCities.map((city, idx) => (
            <div key={city.id} style={{ animationDelay: `${idx * 100}ms` }} className="animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-backwards">
              <CityCard 
                city={city} 
                referenceDate={referenceDate}
                duration={meetingDuration}
                onRemove={handleRemoveCity}
              />
            </div>
          ))}
          
          <button 
            onClick={() => setIsModalOpen(true)}
            className="group min-h-[250px] sm:min-h-[320px] flex flex-col items-center justify-center rounded-[2rem] border-2 border-dashed border-slate-800 bg-slate-900/20 hover:bg-slate-900/40 hover:border-indigo-500/30 transition-all duration-300 gap-6 backdrop-blur-sm"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-indigo-500 rounded-full blur-2xl opacity-0 group-hover:opacity-20 transition-opacity duration-500"></div>
              <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-slate-800/50 border border-white/5 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-2xl">
                <Plus className="text-slate-600 group-hover:text-indigo-400" size={32} />
              </div>
            </div>
            <div className="text-center">
              <span className="block text-xl sm:text-2xl font-bold text-slate-500 group-hover:text-white transition-colors mb-2 tracking-tight">Add Location</span>
              <span className="text-xs sm:text-sm font-medium text-slate-600 group-hover:text-indigo-300/70">Compare another timezone</span>
            </div>
          </button>
        </div>

        {/* Components */}
        <AddCityModal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
          onAdd={handleAddCity}
          existingIds={selectedCities.map(c => c.id)}
        />
      </div>
    </div>
  );
}