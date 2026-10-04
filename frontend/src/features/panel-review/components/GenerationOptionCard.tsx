import React from 'react';
import { GenerationCandidate } from '../../../types/story';
import { Check, Sparkles, Camera, Sun } from 'lucide-react';

interface GenerationOptionCardProps {
  candidate: GenerationCandidate;
  index: number;
  isSelected: boolean;
  onSelect: () => void;
}

export const GenerationOptionCard: React.FC<GenerationOptionCardProps> = ({
  candidate,
  index,
  isSelected,
  onSelect,
}) => {
  return (
    <div
      className={`group relative rounded-2xl overflow-hidden border transition-all duration-200 flex flex-col bg-slate-900/90 shadow-xl ${
        isSelected
          ? 'border-indigo-500 ring-2 ring-indigo-500/50 shadow-indigo-500/20'
          : 'border-slate-800 hover:border-slate-700'
      }`}
    >
      {/* Option Banner */}
      <div className="px-3.5 py-2 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
            Option 0{index + 1}
          </span>
          <span className="text-xs font-bold text-slate-200 truncate">{candidate.camera}</span>
        </div>

        {isSelected && (
          <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-500/30">
            <Check className="w-3 h-3" />
            Selected
          </span>
        )}
      </div>

      {/* Large Image Preview (Preserves 16:9 Aspect Ratio) */}
      <div className="relative aspect-[16/9] w-full bg-slate-950 overflow-hidden cursor-pointer" onClick={onSelect}>
        <img
          src={candidate.imageUrl}
          alt={candidate.title}
          className="w-full h-full object-cover transition transform duration-300 group-hover:scale-105"
        />

        {/* Hover overlay hint */}
        <div className="absolute inset-0 bg-slate-950/30 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
          <span className="px-3 py-1.5 rounded-xl bg-slate-900/90 text-white text-xs font-semibold shadow-lg backdrop-blur-sm border border-slate-700">
            {isSelected ? 'Currently Selected' : 'Click to Select Direction'}
          </span>
        </div>
      </div>

      {/* Details & Select CTA */}
      <div className="p-3.5 flex flex-col justify-between flex-1 bg-slate-900/70 gap-3">
        <div className="space-y-1">
          <p className="text-xs text-slate-300 leading-snug">{candidate.description}</p>
          <div className="flex items-center gap-2 pt-1 text-[11px] text-slate-400">
            <span className="flex items-center gap-1">
              <Sun className="w-3 h-3 text-amber-400" />
              {candidate.lighting}
            </span>
          </div>
        </div>

        <button
          onClick={onSelect}
          className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 min-h-[44px] ${
            isSelected
              ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20'
              : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/20'
          }`}
        >
          {isSelected ? (
            <>
              <Check className="w-3.5 h-3.5" />
              <span>Direction Selected</span>
            </>
          ) : (
            <>
              <Sparkles className="w-3.5 h-3.5" />
              <span>Select Option 0{index + 1}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
