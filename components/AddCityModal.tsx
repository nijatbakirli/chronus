import React, { useState } from 'react';
import { POPULAR_CITIES } from '../constants';
import { City } from '../types';
import { Search, X, Plus, Globe } from 'lucide-react';

interface AddCityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (city: City) => void;
  existingIds: string[];
}

export const AddCityModal: React.FC<AddCityModalProps> = ({ isOpen, onClose, onAdd, existingIds }) => {
  const [search, setSearch] = useState('');

  if (!isOpen) return null;

  const filtered = POPULAR_CITIES.filter(c => 
    !existingIds.includes(c.id) && 
    (c.name.toLowerCase().includes(search.toLowerCase()) || c.region.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-slate-900/90 border border-white/10 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden backdrop-blur-md transform transition-all scale-100 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-white/5 flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
              <Globe className="text-indigo-500" size={20} />
              Add Location
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">Search for a city or timezone to track.</p>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-4 sm:p-6 flex flex-col flex-1 overflow-hidden">
          <div className="relative mb-4 sm:mb-6 group shrink-0">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="text-slate-500 group-focus-within:text-indigo-400 transition-colors" size={20} />
            </div>
            <input 
              type="text"
              placeholder="Type a city name (e.g. Tokyo)"
              className="w-full bg-slate-950/50 border border-slate-700/50 text-white rounded-2xl py-3 sm:py-4 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all placeholder:text-slate-600 text-base sm:text-lg"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
            />
          </div>

          <div className="overflow-y-auto pr-1 custom-scrollbar space-y-2 flex-1">
            {filtered.length === 0 ? (
               <div className="text-center py-8 sm:py-12 flex flex-col items-center">
                 <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-slate-800/50 flex items-center justify-center mb-4">
                    <Search className="text-slate-600" size={20} />
                 </div>
                 <p className="text-slate-500 font-medium text-sm">No locations found.</p>
                 <p className="text-slate-600 text-xs mt-1">Try a different search term or check spelling.</p>
               </div>
            ) : (
              filtered.map(city => (
                <button
                  key={city.id}
                  onClick={() => { onAdd(city); onClose(); }}
                  className="w-full flex items-center justify-between p-3 sm:p-4 rounded-2xl hover:bg-indigo-600/10 border border-transparent hover:border-indigo-500/20 group transition-all duration-200"
                >
                  <div className="flex items-center gap-3 sm:gap-4 text-left">
                     <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-slate-800 flex items-center justify-center overflow-hidden border border-white/5 group-hover:border-indigo-500/30 transition-colors shrink-0">
                        <img 
                          src={`https://flagcdn.com/w40/${city.countryCode.toLowerCase()}.png`} 
                          alt=""
                          className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all duration-300"
                        />
                     </div>
                     <div className="min-w-0">
                       <div className="font-bold text-white text-base sm:text-lg group-hover:text-indigo-300 transition-colors truncate">{city.name}</div>
                       <div className="text-xs sm:text-sm text-slate-500 flex items-center gap-2">
                          <span className="truncate max-w-[100px] sm:max-w-[150px]">{city.region}</span>
                          <span className="w-1 h-1 rounded-full bg-slate-600 shrink-0"></span>
                          <span className="font-mono text-[10px] sm:text-xs truncate">{city.timezone}</span>
                       </div>
                     </div>
                  </div>
                  <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-slate-800 group-hover:bg-indigo-500 text-slate-400 group-hover:text-white flex items-center justify-center transition-all shrink-0">
                    <Plus size={16} />
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};