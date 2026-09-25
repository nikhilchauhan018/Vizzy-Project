import React, { useState } from 'react';
import { Project } from '../../../types/story';
import { Edit3, Check, ShieldCheck, Sparkles, BookOpen, Users, MapPin, Palette } from 'lucide-react';

interface ProjectHeaderProps {
  project: Project;
  onUpdateProject: (updates: Partial<Project>) => void;
  onOpenAiModal: () => void;
}

export const ProjectHeader: React.FC<ProjectHeaderProps> = ({
  project,
  onUpdateProject,
  onOpenAiModal,
}) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState(project.title);
  const [genreInput, setGenreInput] = useState(project.genre);

  const handleSaveTitle = () => {
    onUpdateProject({
      title: titleInput.trim() || 'Untitled Story',
      genre: genreInput.trim() || 'Graphic Novel Drama',
    });
    setIsEditingTitle(false);
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
      <div className="absolute -top-24 -right-24 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
        {/* Title & Metadata */}
        <div className="space-y-3 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5" />
              Story Project
            </span>

            <button
              onClick={() => onUpdateProject({ historically_grounded: !project.historically_grounded })}
              className={`px-2.5 py-0.5 rounded-full text-xs font-medium border flex items-center gap-1.5 transition ${
                project.historically_grounded
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'bg-slate-800/80 text-slate-400 border-slate-700 hover:text-slate-200'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              {project.historically_grounded ? 'Historically Grounded (Strict)' : 'Fictional / Free Form'}
            </button>

            <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Status: {project.status}
            </span>
          </div>

          {isEditingTitle ? (
            <div className="space-y-2 pt-1">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={titleInput}
                  onChange={(e) => setTitleInput(e.target.value)}
                  placeholder="Project title..."
                  className="bg-slate-950 border border-indigo-500 rounded-lg px-3 py-1.5 text-lg font-bold text-white w-full max-w-md focus:outline-none"
                  autoFocus
                />
                <button
                  onClick={handleSaveTitle}
                  className="p-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 transition"
                >
                  <Check className="w-4 h-4" />
                </button>
              </div>
              <input
                type="text"
                value={genreInput}
                onChange={(e) => setGenreInput(e.target.value)}
                placeholder="Genre / Tone (e.g. War Drama, Cyberpunk, Gothic Mystery)..."
                className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-1 text-xs text-slate-300 w-full max-w-md focus:outline-none"
              />
            </div>
          ) : (
            <div className="group flex items-start gap-2">
              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2">
                  {project.title}
                  <button
                    onClick={() => {
                      setTitleInput(project.title);
                      setGenreInput(project.genre);
                      setIsEditingTitle(true);
                    }}
                    className="opacity-0 group-hover:opacity-100 transition p-1 hover:text-indigo-400 text-slate-400"
                    title="Edit Title & Genre"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                </h1>
                <p className="text-xs text-slate-400 mt-0.5">
                  <span className="text-slate-300 font-medium">{project.genre}</span> · Three-Engine Architectural Bible
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Quick Bible Pill Matrix */}
        <div className="flex items-center gap-3 sm:gap-4 flex-wrap bg-slate-950/60 p-3 rounded-xl border border-slate-800">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800">
            <Palette className="w-4 h-4 text-purple-400" />
            <div>
              <div className="text-[10px] uppercase text-slate-500 font-bold">Style Bible</div>
              <div className="flex items-center gap-1 mt-0.5">
                {project.styleBible.palette.slice(0, 5).map((color, i) => (
                  <span
                    key={i}
                    className="w-3 h-3 rounded-full border border-slate-700 inline-block"
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800">
            <Users className="w-4 h-4 text-sky-400" />
            <div>
              <div className="text-[10px] uppercase text-slate-500 font-bold">Character Bible</div>
              <div className="text-xs font-semibold text-slate-200">
                {project.characters.length} {project.characters.length === 1 ? 'Character' : 'Characters'}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800">
            <MapPin className="w-4 h-4 text-amber-400" />
            <div>
              <div className="text-[10px] uppercase text-slate-500 font-bold">Environment Bible</div>
              <div className="text-xs font-semibold text-slate-200">
                {project.environments.length} {project.environments.length === 1 ? 'Location' : 'Locations'}
              </div>
            </div>
          </div>

          <button
            onClick={onOpenAiModal}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-semibold shadow-md transition"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>AI Parse Script</span>
          </button>
        </div>
      </div>
    </div>
  );
};
