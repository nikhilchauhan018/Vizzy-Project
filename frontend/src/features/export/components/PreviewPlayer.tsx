import React, { useState, useEffect } from 'react';
import { Project, StoryPage } from '../../../types/story';
import { Play, Pause, ChevronLeft, ChevronRight, X, Maximize2, Minimize2 } from 'lucide-react';

interface PreviewPlayerProps {
  project: Project;
  onClose: () => void;
}

export const PreviewPlayer: React.FC<PreviewPlayerProps> = ({ project, onClose }) => {
  const allPages = Array.isArray(project?.pages) ? project.pages : [];
  const pagesWithImages = allPages.filter((p) => p.currentImage);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const currentPage = pagesWithImages[currentIndex] || allPages[0];

  // Slideshow auto-advance timer
  useEffect(() => {
    let timer: any;
    if (isPlaying && pagesWithImages.length > 1) {
      timer = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % pagesWithImages.length);
      }, 3500);
    }
    return () => clearInterval(timer);
  }, [isPlaying, pagesWithImages.length]);

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % pagesWithImages.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + pagesWithImages.length) % pagesWithImages.length);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') {
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pagesWithImages.length]);

  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex flex-col justify-between p-4 sm:p-8 backdrop-blur-xl animate-fade-in select-none">
      {/* Top minimal player controls */}
      <div className="flex items-center justify-between max-w-6xl mx-auto w-full text-slate-300">
        <div>
          <h3 className="font-bold text-sm sm:text-base text-white">{project.title}</h3>
          <p className="text-xs text-slate-400">
            Page {currentPage?.pageNumber}: {currentPage?.title}
          </p>
        </div>

        <button
          onClick={onClose}
          aria-label="Close preview player"
          className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition min-h-[44px] min-w-[44px] flex items-center justify-center"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Main Artwork Focus Container */}
      <div className="flex-1 flex items-center justify-center my-4 max-h-[75vh]">
        {currentPage?.currentImage ? (
          <div className="relative aspect-[16/9] w-full max-w-5xl max-h-full rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl border border-slate-800 bg-black flex items-center justify-center">
            <img
              src={currentPage.currentImage}
              alt={currentPage.title}
              className="w-full h-full object-contain"
            />
          </div>
        ) : (
          <div className="text-slate-500 text-sm">No artwork available to preview</div>
        )}
      </div>

      {/* Bottom Distraction-Free Playback Controls */}
      <div className="flex flex-col items-center gap-3 max-w-md mx-auto w-full">
        {/* Page Counter (e.g. 03 / 08) */}
        <div className="font-mono text-xs sm:text-sm font-bold text-slate-400 tracking-wider">
          <span className="text-white">
            {String(currentIndex + 1).padStart(2, '0')}
          </span>{' '}
          / {String(pagesWithImages.length).padStart(2, '0')}
        </div>

        {/* Previous, Play/Pause, Next Controls */}
        <div className="flex items-center gap-4">
          <button
            onClick={handlePrev}
            aria-label="Previous Page"
            className="p-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white border border-slate-800 hover:border-slate-700 transition shadow-lg min-h-[48px] min-w-[48px] flex items-center justify-center active:scale-95"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <button
            onClick={() => setIsPlaying(!isPlaying)}
            aria-label={isPlaying ? 'Pause Slideshow' : 'Play Slideshow'}
            className="p-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-amber-500 hover:from-indigo-500 hover:to-amber-400 text-white shadow-xl shadow-indigo-600/30 transition min-h-[52px] min-w-[52px] flex items-center justify-center active:scale-95"
          >
            {isPlaying ? (
              <Pause className="w-6 h-6 fill-white" />
            ) : (
              <Play className="w-6 h-6 fill-white ml-0.5" />
            )}
          </button>

          <button
            onClick={handleNext}
            aria-label="Next Page"
            className="p-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white border border-slate-800 hover:border-slate-700 transition shadow-lg min-h-[48px] min-w-[48px] flex items-center justify-center active:scale-95"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        <div className="text-[11px] text-slate-500 font-mono">
          Use ← and → arrow keys to navigate
        </div>
      </div>
    </div>
  );
};
