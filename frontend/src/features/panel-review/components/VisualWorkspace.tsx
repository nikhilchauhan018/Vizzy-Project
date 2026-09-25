import React, { useState } from 'react';
import { StoryPage, GenerationCandidate } from '../../../types/story';
import { GenerationOptionCard } from './GenerationOptionCard';
import {
  CheckCircle2,
  Sparkles,
  Maximize2,
  Minimize2,
  Layers,
  ArrowRight,
  RefreshCw,
  Eye,
  Sliders,
  Check,
  ShieldCheck,
  Clock
} from 'lucide-react';

interface VisualWorkspaceProps {
  page: StoryPage;
  onSelectCandidate: (candidateId: string) => void;
  onApprovePage: () => void;
  onQuickRefine: (refinementText: string) => void;
  onGenerateInitialOptions: () => void;
  onGoToNextPage: () => void;
  hasNextPage: boolean;
}

const QUICK_REFINEMENT_CHIPS = [
  'Make the scene wider',
  'Add heavy smoke & dust',
  'Dramatic rim lighting',
  'Make it darker & moodier',
  'Close-up on facial tension',
  'Shift camera to low-angle',
];

export const VisualWorkspace: React.FC<VisualWorkspaceProps> = ({
  page,
  onSelectCandidate,
  onApprovePage,
  onQuickRefine,
  onGenerateInitialOptions,
  onGoToNextPage,
  hasNextPage,
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showOptionsGrid, setShowOptionsGrid] = useState(page.status === 'OPTIONS_READY');

  const isApproved = page.status === 'APPROVED';
  const isGenerating = page.status === 'GENERATING';
  const hasCandidates = page.candidates && page.candidates.length > 0;
  const currentImg = page.currentImage || (hasCandidates ? page.candidates[0].imageUrl : null);

  return (
    <div className="flex-1 flex flex-col bg-slate-950 p-3 sm:p-4 lg:p-6 overflow-y-auto">
      {/* Workspace Sub-header */}
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800/80 gap-2 flex-wrap shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center font-mono font-bold text-xs text-indigo-400">
            {page.pageNumber}
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-extrabold text-white flex items-center gap-2">
              <span>{page.title}</span>
              {isApproved && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                  <CheckCircle2 className="w-3 h-3" />
                  Approved Page
                </span>
              )}
            </h2>
            <p className="text-[11px] text-slate-400 truncate max-w-sm sm:max-w-md">
              {page.sceneSummary}
            </p>
          </div>
        </div>

        {/* View Toggle: Selected Visual vs 3-Option Comparison */}
        <div className="flex items-center gap-2">
          {hasCandidates && (
            <button
              onClick={() => setShowOptionsGrid(!showOptionsGrid)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition min-h-[38px] ${
                showOptionsGrid
                  ? 'bg-indigo-600 text-white border-indigo-500'
                  : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>{showOptionsGrid ? 'View Primary Artwork' : 'Compare 3 Options'}</span>
            </button>
          )}

          {!isApproved && currentImg && (
            <button
              onClick={onApprovePage}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition min-h-[38px]"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Approve Page</span>
            </button>
          )}

          {isApproved && hasNextPage && (
            <button
              onClick={onGoToNextPage}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md transition min-h-[38px]"
            >
              <span>Next Page</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Main Visual Display Area */}
      <div className="flex-1 flex flex-col justify-center items-center relative">
        {/* State 1: Generating Loading State */}
        {isGenerating ? (
          <div className="w-full aspect-[16/9] max-h-[65vh] bg-slate-900/60 rounded-3xl border border-slate-800 flex flex-col items-center justify-center p-6 text-center shadow-2xl relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-indigo-500/10 to-transparent animate-shimmer" />
            <div className="w-16 h-16 rounded-2xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center mb-4 text-indigo-400 animate-pulse">
              <Sparkles className="w-8 h-8 text-amber-300" />
            </div>
            <h3 className="text-base font-bold text-white mb-1">
              Synthesizing 3 Visual Directions...
            </h3>
            <p className="text-xs text-slate-400 max-w-sm">
              Applying your locked Style Bible, Captain Miller character references, and Omaha Beach lighting.
            </p>
            <div className="mt-4 flex items-center gap-2 text-[11px] text-slate-500 font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>Step 2/3: Image Provider Execution</span>
            </div>
          </div>
        ) : showOptionsGrid && hasCandidates ? (
          /* State 2: 3-Option Comparison Grid */
          <div className="w-full space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-xs text-slate-300 font-bold flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Choose Your Preferred Direction for Page {page.pageNumber}:</span>
              </div>
              <span className="text-[11px] text-slate-400">
                You can refine the chosen option through chat
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
              {page.candidates.map((cand, idx) => (
                <GenerationOptionCard
                  key={cand.id}
                  candidate={cand}
                  index={idx}
                  isSelected={cand.id === page.selectedCandidateId}
                  onSelect={() => {
                    onSelectCandidate(cand.id);
                    setShowOptionsGrid(false);
                  }}
                />
              ))}
            </div>
          </div>
        ) : currentImg ? (
          /* State 3: Prominent Single Selected Artwork (Responsive container, aspect ratio preserved) */
          <div
            className={`w-full relative rounded-2xl sm:rounded-3xl overflow-hidden border border-slate-800 bg-slate-950 shadow-2xl transition-all duration-300 ${
              isFullscreen
                ? 'fixed inset-4 z-50 flex items-center justify-center bg-slate-950/95 p-4'
                : 'aspect-[16/9] max-h-[62vh] max-w-5xl mx-auto flex items-center justify-center'
            }`}
          >
            <img
              src={currentImg}
              alt={page.title}
              className="w-full h-full object-contain select-none"
            />

            {/* Artwork Overlay Controls */}
            <div className="absolute top-3 right-3 flex items-center gap-2">
              <button
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="p-2 rounded-xl bg-slate-950/80 hover:bg-slate-900 text-slate-300 hover:text-white border border-slate-700/80 backdrop-blur-md shadow-lg transition min-h-[38px] min-w-[38px] flex items-center justify-center"
                title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen View'}
              >
                {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
            </div>

            {/* Approved Watermark Banner */}
            {isApproved && (
              <div className="absolute top-3 left-3 flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-950/90 border border-emerald-600/80 text-emerald-300 text-xs font-bold backdrop-blur-md shadow-lg">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Page {page.pageNumber} Approved</span>
              </div>
            )}
          </div>
        ) : (
          /* State 4: Empty Draft State */
          <div className="w-full aspect-[16/9] max-h-[55vh] bg-slate-900/40 rounded-3xl border border-dashed border-slate-800 flex flex-col items-center justify-center p-6 text-center max-w-3xl mx-auto">
            <div className="w-12 h-12 rounded-2xl bg-slate-800 text-slate-400 flex items-center justify-center mb-3">
              <Sparkles className="w-6 h-6 text-indigo-400" />
            </div>
            <h3 className="text-base font-bold text-white mb-1">
              Ready to create Page {page.pageNumber}
            </h3>
            <p className="text-xs text-slate-400 max-w-sm mb-4">
              Describe the scene action in the chat below, or generate 3 visual options instantly based on your story outline.
            </p>
            <button
              onClick={onGenerateInitialOptions}
              className="py-2.5 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition min-h-[44px]"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Generate 3 Visual Options</span>
            </button>
          </div>
        )}
      </div>

      {/* Quick Refinement Action Chips (shown when an image is active and not yet approved) */}
      {currentImg && !isApproved && !showOptionsGrid && (
        <div className="mt-3 pt-3 border-t border-slate-800/80 shrink-0">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
            <span className="text-[11px] uppercase font-bold text-slate-500 shrink-0 mr-1 flex items-center gap-1">
              <Sliders className="w-3 h-3 text-indigo-400" />
              Quick Refine:
            </span>
            {QUICK_REFINEMENT_CHIPS.map((chip, i) => (
              <button
                key={i}
                onClick={() => onQuickRefine(chip)}
                className="shrink-0 px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 hover:border-slate-700 text-xs font-medium transition min-h-[34px]"
              >
                + {chip}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
