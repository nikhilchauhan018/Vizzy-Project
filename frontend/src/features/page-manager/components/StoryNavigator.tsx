import React from 'react';
import { StoryPage } from '../../../types/story';
import { PageThumbnail } from './PageThumbnail';
import { Plus, Film, CheckCircle2 } from 'lucide-react';

interface StoryNavigatorProps {
  pages: StoryPage[];
  activePageId: string;
  onSelectPage: (pageId: string) => void;
  onAddNewPage: () => void;
}

export const StoryNavigator: React.FC<StoryNavigatorProps> = ({
  pages,
  activePageId,
  onSelectPage,
  onAddNewPage,
}) => {
  const safePages = Array.isArray(pages) ? pages : [];
  const approvedCount = safePages.filter((p) => p.status === 'APPROVED').length;

  return (
    <aside className="w-full h-full flex flex-col bg-slate-950/80 border-r border-slate-800/80 select-none">
      {/* Navigator Header */}
      <div className="p-3.5 border-b border-slate-800/80 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <Film className="w-4 h-4 text-indigo-400" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
            Story Filmstrip
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-mono">
          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
          <span>
            {approvedCount}/{safePages.length}
          </span>
        </div>
      </div>

      {/* Independent Scrollable Thumbnail List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5 custom-scrollbar">
        {safePages.map((page) => (
          <PageThumbnail
            key={page.id}
            page={page}
            isActive={page.id === activePageId}
            onSelect={() => onSelectPage(page.id)}
          />
        ))}

        {/* Add New Page Button */}
        <button
          onClick={onAddNewPage}
          className="w-full py-3 px-3 rounded-xl border border-dashed border-slate-800 hover:border-indigo-500/60 bg-slate-900/40 hover:bg-slate-900/90 text-slate-400 hover:text-indigo-300 text-xs font-semibold flex items-center justify-center gap-2 transition group min-h-[44px]"
        >
          <div className="w-5 h-5 rounded-lg bg-slate-800 group-hover:bg-indigo-600 group-hover:text-white flex items-center justify-center transition">
            <Plus className="w-3.5 h-3.5" />
          </div>
          <span>New Page</span>
        </button>
      </div>

      {/* Filmstrip Footer */}
      <div className="p-2.5 border-t border-slate-800/80 text-[10px] text-slate-500 text-center font-mono shrink-0">
        Scroll to navigate pages
      </div>
    </aside>
  );
};
