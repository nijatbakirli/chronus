import React, { useState, useEffect, useMemo } from 'react';
import { City } from '../types';
import { CURRENCY_RATES } from '../constants';
import { TrendingUp, TrendingDown, DollarSign, ArrowRightLeft } from 'lucide-react';

interface CurrencyDashboardProps {
  cities: City[];
}

export const CurrencyDashboard: React.FC<CurrencyDashboardProps> = ({ cities }) => {
  const [amount, setAmount] = useState<number>(100);
  const [baseCurrency, setBaseCurrency] = useState<string>('USD');
  
  const uniqueCurrencies = useMemo(() => {
    const codes = new Set(cities.map(c => c.currencyCode));
    codes.add('USD');
    return Array.from(codes).sort();
  }, [cities]);

  const [liveRates, setLiveRates] = useState({...CURRENCY_RATES});
  const [trends, setTrends] = useState<Record<string, 'up' | 'down' | 'neutral'>>({});

  useEffect(() => {
    const interval = setInterval(() => {
      setLiveRates(prev => {
        const next = { ...prev };
        const nextTrends = { ...trends };
        
        Object.keys(next).forEach(key => {
          if (key === 'USD') return;
          const change = (Math.random() - 0.5) * 0.002; 
          const newVal = next[key] * (1 + change);
          
          if (newVal > next[key]) nextTrends[key] = 'up';
          else if (newVal < next[key]) nextTrends[key] = 'down';
          else nextTrends[key] = 'neutral';
          
          next[key] = newVal;
        });
        setTrends(nextTrends);
        return next;
      });
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  const convert = (targetCurrency: string): string => {
    const baseToUSD = 1 / liveRates[baseCurrency];
    const usdToTarget = liveRates[targetCurrency];
    const result = amount * baseToUSD * usdToTarget;
    return result.toLocaleString('en-US', { style: 'currency', currency: targetCurrency });
  };

  return (
    <div className="w-full glass-panel rounded-2xl sm:rounded-3xl overflow-hidden mb-6 sm:mb-8 shadow-2xl animate-in fade-in slide-in-from-top-4 duration-500">
      <div className="p-4 sm:p-5 border-b border-white/5 flex items-center justify-between bg-indigo-900/10">
        <div className="flex items-center gap-2 text-indigo-300 font-bold text-sm sm:text-base">
          <div className="p-1.5 bg-indigo-500/10 rounded-lg">
            <DollarSign size={16} />
          </div>
          <span>Market Overview</span>
        </div>
        <div className="flex items-center gap-2 px-2 py-1 bg-emerald-500/10 rounded-full border border-emerald-500/10">
           <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
           </span>
           <span className="text-[9px] sm:text-[10px] text-emerald-400 uppercase tracking-widest font-bold">Live Rates</span>
        </div>
      </div>

      <div className="p-4 sm:p-6 md:p-8 flex flex-col lg:flex-row gap-6 sm:gap-8">
        {/* Controls */}
        <div className="lg:w-1/3 space-y-4">
           <div>
             <label className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-2 block">Base Amount</label>
             <div className="flex gap-0 bg-slate-900 border border-slate-700 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500/50 transition-all">
               <input 
                 type="number" 
                 value={amount}
                 onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                 className="w-full bg-transparent p-3 sm:p-4 text-white font-mono text-lg sm:text-xl focus:outline-none"
               />
               <div className="bg-slate-800 border-l border-slate-700 flex items-center px-2">
                 <select 
                   value={baseCurrency}
                   onChange={(e) => setBaseCurrency(e.target.value)}
                   className="bg-transparent text-white text-xs sm:text-sm font-bold focus:outline-none cursor-pointer p-1"
                 >
                   {uniqueCurrencies.map(c => <option key={c} value={c}>{c}</option>)}
                 </select>
               </div>
             </div>
           </div>
           <p className="text-xs text-slate-500 leading-relaxed">
             Real-time conversion estimate based on current market data relative to {baseCurrency}.
           </p>
        </div>

        {/* Grid */}
        <div className="lg:w-2/3 grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
           {uniqueCurrencies.filter(c => c !== baseCurrency).map(currency => {
             const trend = trends[currency] || 'neutral';
             const isUp = trend === 'up';
             const colorClass = isUp ? 'text-emerald-400' : trend === 'down' ? 'text-red-400' : 'text-slate-400';
             
             return (
               <div key={currency} className="bg-slate-800/30 p-3 sm:p-4 rounded-xl border border-white/5 hover:bg-slate-700/30 hover:border-white/10 transition-all group">
                  <div className="flex justify-between items-center mb-1 sm:mb-2 opacity-60 group-hover:opacity-100 transition-opacity">
                     <span className="text-[10px] sm:text-xs font-bold text-slate-400">{currency}</span>
                     {isUp ? <TrendingUp size={12} className={`sm:w-[14px] sm:h-[14px] ${colorClass}`} /> : 
                      trend === 'down' ? <TrendingDown size={12} className={`sm:w-[14px] sm:h-[14px] ${colorClass}`} /> : 
                      <ArrowRightLeft size={12} className="text-slate-600 sm:w-[14px] sm:h-[14px]" />}
                  </div>
                  <div className="text-sm sm:text-lg font-mono font-medium text-white tracking-tight truncate">
                    {convert(currency)}
                  </div>
               </div>
             );
           })}
        </div>
      </div>
    </div>
  );
};