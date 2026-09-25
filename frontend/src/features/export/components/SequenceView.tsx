import React from 'react';
import { Project, StoryPage } from '../../../types/story';
import { Play, Download, CheckCircle2, Plus, Sparkles, Layers, Image as ImageIcon } from 'lucide-react';

interface SequenceViewProps {
  project: Project;
  onSelectPage: (pageId: string) => void;
  onOpenPlayer: () => void;
  onOpenExport: () => void;
  onAddNewPage: () => void;
}

export const SequenceView: React.FC<SequenceViewProps> = ({
  project,
  onSelectPage,
  onOpenPlayer,
  onOpenExport,
  onAddNewPage,
}) => {
  const pages = Array.isArray(project?.pages) ? project.pages : [];
  const approvedCount = pages.filter((p) => p.status === 'APPROVED').length;

  return (
    <div className="flex-1 bg-slate-950 p-4 sm:p-6 lg:p-8 overflow-y-auto">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Storyboard Header Bar */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-bold border border-indigo-500/30">
                Full Story Sequence
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {approvedCount} of {pages.length} Pages Approved
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white">{project.title}</h2>
            <p className="text-xs text-slate-400 mt-0.5">{project.genre} · Storyboard Flow</p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <button
              onClick={onOpenPlayer}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-bold shadow-lg shadow-emerald-600/20 transition min-h-[44px]"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>Preview Sequence</span>
            </button>

            <button
              onClick={onOpenExport}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs sm:text-sm font-bold shadow-lg shadow-indigo-600/20 transition min-h-[44px]"
            >
              <Download className="w-4 h-4" />
              <span>Export Graphic Novel</span>
            </button>

            <button
              onClick={onAddNewPage}
              className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition min-h-[44px]"
            >
              <Plus className="w-4 h-4" />
              <span>Add Page</span>
            </button>
          </div>
        </div>

        {/* Responsive Grid of Storyboard Pages */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
          {pages.map((page) => {
            const isApproved = page.status === 'APPROVED';
            return (
              <div
                key={page.id}
                onClick={() => onSelectPage(page.id)}
                className="group bg-slate-900/80 hover:bg-slate-900 border border-slate-800/90 hover:border-indigo-500/80 rounded-2xl overflow-hidden shadow-lg transition-all duration-200 cursor-pointer flex flex-col"
              >
                {/* Header inside card */}
                <div className="p-3 bg-slate-950/80 border-b border-slate-800/80 flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-slate-300">
                    Page {page.pageNumber}
                  </span>
                  {isApproved ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/15 px-2 py-0.5 rounded-full border border-emerald-500/30">
                      <CheckCircle2 className="w-3 h-3" />
                      Approved
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-500 font-medium px-2 py-0.5 rounded bg-slate-800/80">
                      {page.status === 'OPTIONS_READY' ? 'Options Ready' : 'In Progress'}
                    </span>
                  )}
                </div>

                {/* Aspect 16:9 Artwork Container */}
                <div className="aspect-[16/9] w-full bg-slate-950 overflow-hidden relative">
                  {page.currentImage ? (
                    <img
                      src={page.currentImage}
                      alt={page.title}
                      className="w-full h-full object-cover transition transform duration-300 group-hover:scale-105"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-600 bg-slate-950/60 p-4 text-center">
                      <ImageIcon className="w-6 h-6 mb-1 text-slate-700" />
                      <span className="text-xs font-mono">Draft page</span>
                    </div>
                  )}

                  {/* Click to edit overlay */}
                  <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                    <span className="px-3 py-1.5 rounded-xl bg-slate-900/90 text-white text-xs font-bold shadow-lg border border-slate-700">
                      Open in Workspace
                    </span>
                  </div>
                </div>

                {/* Title & Scene Summary */}
                <div className="p-3.5 flex-1 flex flex-col justify-between gap-1 bg-slate-900/40">
                  <h4 className="text-xs font-bold text-slate-100 group-hover:text-indigo-400 transition truncate">
                    {page.title}
                  </h4>
                  <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                    {page.sceneSummary}
                  </p>
                </div>
              </div>
            );
          })}

          {/* Add New Page Card */}
          <div
            onClick={onAddNewPage}
            className="border-2 border-dashed border-slate-800 hover:border-indigo-500/60 bg-slate-950/40 hover:bg-slate-900/40 rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition min-h-[220px] group"
          >
            <div className="w-12 h-12 rounded-2xl bg-slate-900 group-hover:bg-indigo-600 group-hover:text-white text-slate-500 flex items-center justify-center transition mb-2">
              <Plus className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold text-slate-300 group-hover:text-white">
              Create Page 0{project.pages.length + 1}
            </span>
            <p className="text-[10px] text-slate-500 mt-1">Continue the story narrative</p>
          </div>
        </div>
      </div>
    </div>
  );
};
