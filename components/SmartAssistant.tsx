import React, { useState } from 'react';
import { City } from '../types';
import { generateSchedulingAdvice } from '../services/geminiService';
import { Sparkles, Loader2, MessageSquareText, ChevronRight, Bot } from 'lucide-react';

interface SmartAssistantProps {
  cities: City[];
  currentDate: Date;
  duration: number;
}

export const SmartAssistant: React.FC<SmartAssistantProps> = ({ cities, currentDate, duration }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [advice, setAdvice] = useState<string | null>(null);

  const handleGetAdvice = async () => {
    setIsLoading(true);
    setAdvice(null);
    const result = await generateSchedulingAdvice(cities, currentDate, duration);
    setAdvice(result);
    setIsLoading(false);
  };

  return (
    <div className={`fixed right-0 top-0 h-full z-50 transition-transform duration-500 cubic-bezier(0.16, 1, 0.3, 1) ${isOpen ? 'translate-x-0' : 'translate-x-full sm:translate-x-[calc(100%-4rem)]'}`}>
      <div className="flex h-full shadow-[-20px_0_50px_rgba(0,0,0,0.5)]">
        {/* Toggle Tab */}
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className={`absolute sm:static left-0 -translate-x-full sm:translate-x-0 w-12 sm:w-16 h-16 mt-32 bg-slate-900/90 backdrop-blur-md border-y border-l border-indigo-500/30 rounded-l-2xl flex items-center justify-center text-white hover:bg-indigo-900/40 transition-colors z-50 group ${isOpen ? 'opacity-100' : 'opacity-100'}`}
          aria-label="Toggle AI Assistant"
        >
          {isOpen ? <ChevronRight className="text-slate-400 group-hover:text-white" /> : <Sparkles className="text-indigo-400 animate-pulse-slow" />}
        </button>

        {/* Panel Content */}
        <div className="w-[85vw] sm:w-[450px] max-w-[450px] bg-[#0f172a]/95 backdrop-blur-xl border-l border-white/10 h-full flex flex-col">
          <div className="p-6 sm:p-8 border-b border-white/5 bg-gradient-to-r from-indigo-900/20 to-transparent">
            <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-3 text-white tracking-tight">
              <Bot className="text-indigo-400" size={24} />
              AI Assistant
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-2 leading-relaxed">
              Analyze your current timeline selection for scheduling conflicts and cultural insights.
            </p>
          </div>

          <div className="flex-1 overflow-y-auto p-6 sm:p-8 custom-scrollbar">
            {!advice && !isLoading && (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-6">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-slate-800/50 border border-white/5 flex items-center justify-center shadow-inner">
                  <MessageSquareText size={28} className="text-slate-600 sm:w-8 sm:h-8" />
                </div>
                <div className="max-w-xs space-y-2">
                  <p className="text-slate-300 font-medium text-sm sm:text-base">Ready to Optimize</p>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    I'll check the {duration}-minute window across {cities.length} locations for business hour overlaps and provide etiquette tips.
                  </p>
                </div>
                <button 
                  onClick={handleGetAdvice}
                  className="px-6 sm:px-8 py-3 bg-indigo-600 text-white font-semibold rounded-xl shadow-lg shadow-indigo-500/25 hover:bg-indigo-500 hover:scale-105 transition-all active:scale-95 flex items-center gap-2 text-sm sm:text-base"
                >
                  <Sparkles size={16} />
                  Analyze Schedule
                </button>
              </div>
            )}

            {isLoading && (
              <div className="flex flex-col items-center justify-center h-full space-y-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-indigo-500 blur-xl opacity-20 animate-pulse"></div>
                  <Loader2 className="animate-spin text-indigo-400 relative z-10" size={40} />
                </div>
                <p className="text-indigo-200 text-xs sm:text-sm font-medium animate-pulse">Consulting Gemini...</p>
              </div>
            )}

            {advice && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-white/10 rounded-2xl p-4 sm:p-6 mb-6 shadow-xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -mr-10 -mt-10"></div>
                  
                  <h3 className="text-indigo-400 font-bold mb-4 text-[10px] sm:text-xs uppercase tracking-widest flex items-center gap-2">
                    <Sparkles size={12} />
                    Analysis Result
                  </h3>
                  <div className="prose prose-invert prose-sm max-w-none text-slate-300 leading-7 font-light text-xs sm:text-sm">
                    <div className="whitespace-pre-wrap">{advice}</div>
                  </div>
                </div>
                
                <button 
                  onClick={handleGetAdvice}
                  className="w-full py-4 border border-slate-700/50 bg-slate-800/30 hover:bg-slate-700/50 text-slate-400 hover:text-white rounded-xl text-xs sm:text-sm font-medium transition-all flex items-center justify-center gap-2"
                >
                  <Loader2 size={16} className={isLoading ? "animate-spin" : "hidden"} />
                  Regenerate Analysis
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};