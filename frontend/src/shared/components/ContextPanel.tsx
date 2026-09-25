import React from 'react';
import { Project, StoryPage } from '../../types/story';
import {
  BookOpen,
  Palette,
  Users,
  Image as ImageIcon,
  MapPin,
  CheckCircle2,
  Clock,
  Sparkles,
  Info
} from 'lucide-react';

interface ContextPanelProps {
  project: Project;
  currentPage: StoryPage;
}

export const ContextPanel: React.FC<ContextPanelProps> = ({ project, currentPage }) => {
  const currentEnv = project.environments.find((e) => e.id === currentPage.environmentId) || project.environments[0];
  const featuredCharacters = project.characters.filter((c) =>
    currentPage.characterIds?.includes(c.id)
  );

  return (
    <aside className="w-full h-full flex flex-col bg-slate-950/80 border-l border-slate-800/80 select-none overflow-y-auto custom-scrollbar">
      {/* Header */}
      <div className="p-3.5 border-b border-slate-800/80 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-indigo-400" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
            Story Context
          </span>
        </div>
        <span className="text-[10px] text-slate-400 font-mono">
          Page {currentPage.pageNumber}
        </span>
      </div>

      <div className="p-3.5 space-y-4 text-xs">
        {/* SECTION 1: STORY */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
            <span>Story</span>
          </div>
          <div className="bg-slate-900/70 p-2.5 rounded-xl border border-slate-800/80 space-y-1">
            <h4 className="font-bold text-white text-xs">{project.title}</h4>
            <p className="text-[11px] text-slate-400 leading-snug line-clamp-3">
              {project.story_notes}
            </p>
          </div>
        </div>

        {/* SECTION 2: STYLE */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            <Palette className="w-3.5 h-3.5 text-purple-400" />
            <span>Style & Aesthetic</span>
          </div>
          <div className="bg-slate-900/70 p-2.5 rounded-xl border border-slate-800/80 space-y-2">
            <div className="text-[11px] text-slate-300 font-medium">
              {project.styleBible.art_style}
            </div>
            {/* Color Swatches */}
            <div className="flex items-center gap-1">
              {project.styleBible.palette.slice(0, 5).map((color, i) => (
                <span
                  key={i}
                  className="w-4 h-4 rounded-md border border-slate-700/80 inline-block shadow-inner"
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
              <span className="text-[10px] text-slate-500 font-mono ml-1">
                {project.styleBible.aspect_ratio}
              </span>
            </div>
          </div>
        </div>

        {/* SECTION 3: CHARACTERS */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400">
            <div className="flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-sky-400" />
              <span>Characters</span>
            </div>
            <span className="font-mono text-slate-500">{project.characters.length} in bible</span>
          </div>
          <div className="space-y-1.5">
            {project.characters.map((char) => {
              const isFeatured = currentPage.characterIds?.includes(char.id);
              return (
                <div
                  key={char.id}
                  className={`p-2 rounded-xl border flex items-center justify-between gap-2 transition ${
                    isFeatured
                      ? 'bg-sky-950/40 border-sky-600/50 text-white'
                      : 'bg-slate-900/50 border-slate-800/80 text-slate-400'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: char.avatar_color || '#38BDF8' }}
                    />
                    <div className="truncate">
                      <span className="font-bold text-xs block truncate">{char.name}</span>
                      <span className="text-[10px] text-slate-400 block truncate">{char.role}</span>
                    </div>
                  </div>
                  {isFeatured && (
                    <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-300 shrink-0">
                      In Scene
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* SECTION 4: REFERENCES */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            <ImageIcon className="w-3.5 h-3.5 text-amber-400" />
            <span>References</span>
          </div>
          <div className="bg-slate-900/70 p-2.5 rounded-xl border border-slate-800/80">
            {project.uploadedReferenceImage ? (
              <div className="aspect-[16/9] w-full rounded-lg overflow-hidden border border-slate-700/80">
                <img
                  src={project.uploadedReferenceImage}
                  alt="Story Reference"
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <p className="text-[11px] text-slate-500 italic">No reference image attached</p>
            )}
          </div>
        </div>

        {/* SECTION 5: CURRENT SCENE & STATUS */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            <MapPin className="w-3.5 h-3.5 text-emerald-400" />
            <span>Current Scene</span>
          </div>
          <div className="bg-slate-900/70 p-2.5 rounded-xl border border-slate-800/80 space-y-1.5">
            {currentEnv && (
              <>
                <div className="font-bold text-white text-xs">{currentEnv.name}</div>
                <div className="text-[11px] text-slate-400">{currentEnv.time_of_day}</div>
                <div className="text-[10px] text-slate-500 truncate">{currentEnv.weather}</div>
              </>
            )}

            <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Page State:</span>
              {currentPage.status === 'APPROVED' ? (
                <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  Approved
                </span>
              ) : currentPage.status === 'OPTIONS_READY' ? (
                <span className="text-[10px] font-bold text-amber-400 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  Options Ready
                </span>
              ) : currentPage.status === 'GENERATING' ? (
                <span className="text-[10px] font-bold text-sky-400 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Generating
                </span>
              ) : (
                <span className="text-[10px] text-slate-400">Draft</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};
