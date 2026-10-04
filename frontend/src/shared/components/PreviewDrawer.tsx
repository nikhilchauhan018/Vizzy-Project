import React, { useState } from 'react';
import { Project, StoryPage } from '../../types/story';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

interface PreviewDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
  activePageId: string;
  onSelectPage: (pageId: string) => void;
  isMobile?: boolean;
}

export const PreviewDrawer: React.FC<PreviewDrawerProps> = ({
  isOpen,
  onClose,
  project,
  activePageId,
  onSelectPage,
  isMobile = false,
}) => {
  if (!isOpen) return null;

  const pages = Array.isArray(project?.pages) ? project.pages : [];
  const currentPage = pages.find((p) => p.id === activePageId) || pages[0];
  const currentIndex = pages.findIndex((p) => p.id === currentPage?.id);

  const handlePrev = () => {
    if (pages.length <= 1) return;
    const prevIndex = (currentIndex - 1 + pages.length) % pages.length;
    onSelectPage(pages[prevIndex].id);
  };

  const handleNext = () => {
    if (pages.length <= 1) return;
    const nextIndex = (currentIndex + 1) % pages.length;
    onSelectPage(pages[nextIndex].id);
  };

  const currentArtwork = currentPage?.currentImage || currentPage?.candidates?.[0]?.imageUrl;

  const content = (
    <div className="h-full flex flex-col bg-white text-[#171717] select-none">
      {/* Header */}
      <div className="h-14 px-4 sm:px-5 border-b border-[#E7E7E5] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm text-[#171717]">Preview</span>
          {currentPage && (
            <span className="text-xs text-[#6B7280]">
              Page {currentPage.pageNumber}
            </span>
          )}
        </div>
        <button
          onClick={onClose}
          aria-label="Close preview"
          className="p-1.5 rounded-lg text-[#6B7280] hover:text-[#171717] hover:bg-[#F5F5F4] transition min-h-[36px] min-w-[36px] flex items-center justify-center"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Main Artwork Area (Preserves Aspect Ratio, No Stretch) */}
      <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 overflow-hidden bg-[#FCFCFB]">
        {currentArtwork ? (
          <div className="w-full h-full max-h-[68vh] flex items-center justify-center">
            <div className="relative aspect-[16/9] w-full max-w-4xl max-h-full rounded-xl overflow-hidden border border-[#E7E7E5] bg-white shadow-xs flex items-center justify-center">
              <img
                src={currentArtwork}
                alt={currentPage?.title || 'Preview Artwork'}
                className="w-full h-full object-contain"
              />
            </div>
          </div>
        ) : (
          <div className="text-center text-xs text-[#9CA3AF]">
            No artwork available for Page {currentPage?.pageNumber || '1'}
          </div>
        )}

        {/* Page title and scene summary */}
        {currentPage && (
          <div className="mt-3 text-center max-w-md px-2">
            <h4 className="text-xs font-semibold text-[#171717] truncate">{currentPage.title}</h4>
            {currentPage.sceneSummary && (
              <p className="text-[11px] text-[#6B7280] line-clamp-2 mt-0.5">
                {currentPage.sceneSummary}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Multi-page Thumbnail Strip & Navigation */}
      {pages.length > 1 && (
        <div className="p-3 sm:p-4 border-t border-[#E7E7E5] bg-white shrink-0 space-y-2">
          <div className="flex items-center justify-between text-xs text-[#6B7280] px-1">
            <span className="font-mono text-[11px]">
              {String(currentIndex + 1).padStart(2, '0')} / {String(pages.length).padStart(2, '0')}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={handlePrev}
                aria-label="Previous page"
                className="p-1 rounded-md hover:bg-[#F5F5F4] text-[#6B7280] hover:text-[#171717] transition min-h-[32px] min-w-[32px] flex items-center justify-center"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={handleNext}
                aria-label="Next page"
                className="p-1 rounded-md hover:bg-[#F5F5F4] text-[#6B7280] hover:text-[#171717] transition min-h-[32px] min-w-[32px] flex items-center justify-center"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Horizontal thumbnail scroll */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
            {pages.map((p) => {
              const isSelected = p.id === currentPage?.id;
              const img = p.currentImage || p.candidates?.[0]?.imageUrl;
              return (
                <button
                  key={p.id}
                  onClick={() => onSelectPage(p.id)}
                  className={`shrink-0 w-20 rounded-lg overflow-hidden border transition-all text-left flex flex-col ${
                    isSelected
                      ? 'border-[#3B82F6] ring-1 ring-[#3B82F6]'
                      : 'border-[#E7E7E5] opacity-75 hover:opacity-100 hover:border-[#D1D5DB]'
                  }`}
                >
                  <div className="aspect-[16/9] w-full bg-[#F5F5F4] overflow-hidden">
                    {img ? (
                      <img src={img} alt={`Page ${p.pageNumber}`} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[10px] text-[#9CA3AF]">
                        {p.pageNumber}
                      </div>
                    )}
                  </div>
                  <div className="px-1.5 py-1 text-[10px] font-mono text-[#6B7280] truncate bg-white">
                    P{p.pageNumber}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );

  // Mobile: full-screen overlay
  if (isMobile) {
    return (
      <div className="fixed inset-0 z-50 bg-white flex flex-col animate-fade-in">
        {content}
      </div>
    );
  }

  // Desktop: right-side panel (slide-in)
  return (
    <aside className="w-[36%] min-w-[320px] max-w-[500px] h-full border-l border-[#E7E7E5] bg-white shrink-0 z-20 flex flex-col transition-all duration-200">
      {content}
    </aside>
  );
};
