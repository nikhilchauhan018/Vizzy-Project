import React, { useState } from 'react';
import { Project } from '../../types/story';
import {
  BookOpen,
  Film,
  Share2,
  Download,
  Menu,
  Info,
  Play,
  Layers,
  Sparkles,
  Plus,
  Check,
  Edit2
} from 'lucide-react';

interface TopBarProps {
  project: Project;
  activeView: 'workspace' | 'sequence';
  onViewChange: (view: 'workspace' | 'sequence') => void;
  onOpenExport: () => void;
  onOpenPlayer: () => void;
  onOpenNewProject: () => void;
  onToggleMobileStoryNav: () => void;
  onToggleMobileContext: () => void;
  onUpdateTitle: (title: string) => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  project,
  activeView,
  onViewChange,
  onOpenExport,
  onOpenPlayer,
  onOpenNewProject,
  onToggleMobileStoryNav,
  onToggleMobileContext,
  onUpdateTitle,
}) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState(project.title);
  const [shareCopied, setShareCopied] = useState(false);

  const handleTitleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (titleValue.trim()) {
      onUpdateTitle(titleValue.trim());
    }
    setIsEditingTitle(false);
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setShareCopied(true);
    setTimeout(() => setShareCopied(false), 2000);
  };

  const pages = Array.isArray(project?.pages) ? project.pages : [];
  const approvedCount = pages.filter((p) => p.status === 'APPROVED').length;

  return (
    <header className="sticky top-0 z-30 bg-slate-950/95 backdrop-blur-md border-b border-slate-800 text-slate-100 select-none">
      <div className="max-w-[1920px] mx-auto px-3 sm:px-5 lg:px-6 h-14 sm:h-16 flex items-center justify-between gap-2 sm:gap-4">
        {/* Left: Mobile Nav Button + Brand */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Mobile Story Nav Toggle (visible on <lg screens) */}
          <button
            onClick={onToggleMobileStoryNav}
            aria-label="Open story pages navigation"
            className="lg:hidden p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 min-h-[44px] min-w-[44px] flex items-center justify-center transition"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Vizzy Logo Icon */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-amber-400 flex items-center justify-center shadow-lg shadow-indigo-500/20 shrink-0">
              <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <div className="hidden xs:block">
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-base sm:text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
                  Vizzy
                </span>
                <span className="hidden sm:inline-block text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Studio
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Center: Story Title & Mode Switcher */}
        <div className="flex items-center gap-2 sm:gap-4 flex-1 justify-center max-w-2xl px-2">
          {isEditingTitle ? (
            <form onSubmit={handleTitleSubmit} className="flex items-center gap-1.5 max-w-xs sm:max-w-md w-full">
              <input
                type="text"
                value={titleValue}
                onChange={(e) => setTitleValue(e.target.value)}
                autoFocus
                className="w-full bg-slate-900 border border-indigo-500 rounded-lg px-2.5 py-1 text-xs sm:text-sm font-semibold text-white outline-none"
              />
              <button
                type="submit"
                className="p-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white min-h-[36px] min-w-[36px] flex items-center justify-center"
              >
                <Check className="w-4 h-4" />
              </button>
            </form>
          ) : (
            <div
              onClick={() => {
                setTitleValue(project.title);
                setIsEditingTitle(true);
              }}
              title="Click to rename story"
              className="group flex items-center gap-1.5 cursor-pointer max-w-[140px] xs:max-w-[200px] sm:max-w-xs truncate py-1 px-2 rounded-lg hover:bg-slate-900/80 transition"
            >
              <span className="font-bold text-xs sm:text-sm text-slate-100 truncate">
                {project.title}
              </span>
              <Edit2 className="w-3 h-3 text-slate-500 opacity-0 group-hover:opacity-100 transition shrink-0 hidden sm:inline" />
            </div>
          )}

          {/* View Mode Toggle Pill (Workspace vs Storyboard Sequence) */}
          <div className="hidden md:flex items-center p-1 bg-slate-900 rounded-xl border border-slate-800 text-xs font-semibold">
            <button
              onClick={() => onViewChange('workspace')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition min-h-[32px] ${
                activeView === 'workspace'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Workspace</span>
            </button>
            <button
              onClick={() => onViewChange('sequence')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition min-h-[32px] ${
                activeView === 'sequence'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Film className="w-3.5 h-3.5" />
              <span>Sequence</span>
              <span className="text-[10px] px-1.5 py-0.2 bg-slate-800 rounded text-slate-300 font-mono">
                {approvedCount}/{pages.length}
              </span>
            </button>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Quick Play Sequence CTA */}
          <button
            onClick={onOpenPlayer}
            title="Preview Story Slideshow"
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-semibold border border-slate-800 min-h-[40px] transition"
          >
            <Play className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400" />
            <span className="hidden sm:inline">Preview</span>
          </button>

          {/* Export Action */}
          <button
            onClick={onOpenExport}
            title="Export Graphic Novel / Video"
            className="flex items-center gap-1.5 px-3 py-1.5 sm:py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 min-h-[40px] transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export</span>
          </button>

          {/* Share Action */}
          <button
            onClick={handleShare}
            title="Share story link"
            className="p-2 sm:px-2.5 sm:py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 min-h-[40px] min-w-[40px] flex items-center justify-center transition"
          >
            {shareCopied ? (
              <Check className="w-4 h-4 text-emerald-400" />
            ) : (
              <Share2 className="w-4 h-4" />
            )}
          </button>

          {/* New Story Action */}
          <button
            onClick={onOpenNewProject}
            title="Create New Story"
            className="hidden xl:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-medium border border-slate-800 min-h-[40px] transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Story</span>
          </button>

          {/* Mobile Story Context Toggle (visible on <xl screens) */}
          <button
            onClick={onToggleMobileContext}
            aria-label="Open story context panel"
            className="xl:hidden p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 min-h-[44px] min-w-[44px] flex items-center justify-center transition"
          >
            <Info className="w-5 h-5 text-indigo-400" />
          </button>
        </div>
      </div>
    </header>
  );
};
