import React from 'react';
import { StoryPage } from '../../../types/story';
import { CheckCircle2, Clock, Sparkles, Image as ImageIcon } from 'lucide-react';

interface PageThumbnailProps {
  page: StoryPage;
  isActive: boolean;
  onSelect: () => void;
}

export const PageThumbnail: React.FC<PageThumbnailProps> = ({ page, isActive, onSelect }) => {
  const isApproved = page.status === 'APPROVED';
  const isGenerating = page.status === 'GENERATING';
  const hasOptions = page.status === 'OPTIONS_READY';

  return (
    <div
      onClick={onSelect}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          onSelect();
        }
      }}
      className={`group relative rounded-xl p-2 transition cursor-pointer select-none border text-left ${
        isActive
          ? 'bg-slate-800/90 border-indigo-500 shadow-lg shadow-indigo-500/10 ring-1 ring-indigo-500/50'
          : 'bg-slate-900/60 hover:bg-slate-800/60 border-slate-800/90 hover:border-slate-700'
      }`}
    >
      {/* Top Header: Page Number + Status Pill */}
      <div className="flex items-center justify-between gap-1 mb-1.5">
        <span
          className={`text-[11px] font-mono font-bold tracking-wider ${
            isActive ? 'text-indigo-400' : 'text-slate-400'
          }`}
        >
          Page {page.pageNumber}
        </span>

        {isApproved ? (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-1.5 py-0.2 rounded-full">
            <CheckCircle2 className="w-2.5 h-2.5" />
            <span>Approved</span>
          </span>
        ) : hasOptions ? (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-400 bg-amber-500/15 border border-amber-500/30 px-1.5 py-0.2 rounded-full">
            <Sparkles className="w-2.5 h-2.5" />
            <span>Options</span>
          </span>
        ) : isGenerating ? (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-sky-400 bg-sky-500/15 border border-sky-500/30 px-1.5 py-0.2 rounded-full animate-pulse">
            <Clock className="w-2.5 h-2.5" />
            <span>Generating</span>
          </span>
        ) : (
          <span className="text-[10px] font-medium text-slate-500 bg-slate-800/60 px-1.5 py-0.2 rounded">
            Draft
          </span>
        )}
      </div>

      {/* Visual Filmstrip Thumbnail Container */}
      <div className="relative aspect-[16/9] w-full rounded-lg overflow-hidden bg-slate-950 border border-slate-800/80 mb-1.5 group-hover:border-slate-700 transition">
        {page.currentImage ? (
          <img
            src={page.currentImage}
            alt={`Page ${page.pageNumber}`}
            className="w-full h-full object-cover transition transform group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-slate-600 bg-slate-950/80 gap-1 p-2 text-center">
            <ImageIcon className="w-4 h-4 text-slate-600" />
            <span className="text-[10px] text-slate-500 font-mono">No artwork yet</span>
          </div>
        )}

        {/* Filmstrip perforation styling markers */}
        <div className="absolute top-1 left-1 flex gap-1">
          <span className="w-1 h-1 rounded-full bg-slate-950/80 border border-slate-700" />
          <span className="w-1 h-1 rounded-full bg-slate-950/80 border border-slate-700" />
        </div>

        {isActive && (
          <div className="absolute inset-0 border-2 border-indigo-500/80 rounded-lg pointer-events-none" />
        )}
      </div>

      {/* Scene Title */}
      <h4
        className={`text-xs font-semibold truncate ${
          isActive ? 'text-white' : 'text-slate-300 group-hover:text-white'
        }`}
        title={page.title}
      >
        {page.title || `Scene ${page.pageNumber}`}
      </h4>

      <p className="text-[10px] text-slate-500 truncate mt-0.5">
        {page.sceneSummary || 'No scene summary set'}
      </p>
    </div>
  );
};
