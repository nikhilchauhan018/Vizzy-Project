import React from 'react';
import { Project } from '../../types/story';
import { BookOpen, Layers, Sparkles, Plus, RefreshCw, Compass, Film } from 'lucide-react';

interface NavigationProps {
  projects: Project[];
  activeProject: Project;
  onSelectProject: (id: string) => void;
  onCreateNew: () => void;
  onResetPresets: () => void;
  onOpenAiModal: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  projects,
  activeProject,
  onSelectProject,
  onCreateNew,
  onResetPresets,
  onOpenAiModal,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800 text-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo & Engine Badge */}
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-600 to-amber-500 shadow-lg shadow-purple-500/20">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                  Vizzy
                </span>
                <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Graphic Novel Studio
                </span>
              </div>
              <div className="text-xs text-slate-400 flex items-center gap-2">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                <span>Story Engine v2.0</span>
              </div>
            </div>
          </div>

          {/* Engine Architecture Status */}
          <div className="hidden md:flex items-center gap-1 bg-slate-900/80 p-1 rounded-xl border border-slate-800 text-xs font-medium">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 text-white shadow-sm font-semibold">
              <Compass className="w-3.5 h-3.5" />
              <span>1. Story Engine</span>
              <span className="ml-1 px-1.5 py-0.2 text-[10px] bg-indigo-800 rounded text-indigo-100">Active</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-slate-400 opacity-60 cursor-not-allowed">
              <Layers className="w-3.5 h-3.5" />
              <span>2. Visual Engine</span>
              <span className="text-[10px] text-slate-400 bg-slate-800/80 px-1.5 rounded">Phase 2</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-slate-400 opacity-60 cursor-not-allowed">
              <Film className="w-3.5 h-3.5" />
              <span>3. Composition</span>
              <span className="text-[10px] text-slate-400 bg-slate-800/80 px-1.5 rounded">Phase 3</span>
            </div>
          </div>

          {/* Actions & Project Picker */}
          <div className="flex items-center gap-2">
            <select
              value={activeProject.id}
              onChange={(e) => onSelectProject(e.target.value)}
              className="bg-slate-900 border border-slate-700 hover:border-slate-600 text-slate-200 text-xs rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </select>

            <button
              onClick={onCreateNew}
              title="Create new empty story"
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">New Story</span>
            </button>

            <button
              onClick={onOpenAiModal}
              title="Auto-extract Bibles with Gemini AI"
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>AI Auto-Extract</span>
            </button>

            <button
              onClick={onResetPresets}
              title="Reset to default reference templates"
              className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 transition"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
