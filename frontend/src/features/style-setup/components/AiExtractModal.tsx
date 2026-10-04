import React, { useState } from 'react';
import { Project, ExtractBiblesResponse } from '../../../types/story';
import { extractBiblesWithGemini } from '../api';
import { Sparkles, X, Loader2, Check, AlertCircle, Users, MapPin, Palette } from 'lucide-react';

interface AiExtractModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeProject: Project;
  onApplyExtracted: (extracted: ExtractBiblesResponse) => void;
}

export const AiExtractModal: React.FC<AiExtractModalProps> = ({
  isOpen,
  onClose,
  activeProject,
  onApplyExtracted,
}) => {
  const [storyNotes, setStoryNotes] = useState(activeProject.story_notes || '');
  const [title, setTitle] = useState(activeProject.title || '');
  const [genre, setGenre] = useState(activeProject.genre || 'Graphic Novel');
  const [historicallyGrounded, setHistoricallyGrounded] = useState(activeProject.historically_grounded);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [extractedResult, setExtractedResult] = useState<ExtractBiblesResponse | null>(null);

  if (!isOpen) return null;

  const handleExtract = async () => {
    if (!storyNotes.trim()) {
      setError('Please provide story notes or script text to extract bibles from.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await extractBiblesWithGemini({
        storyNotes,
        title,
        genre,
        historicallyGrounded,
      });
      setExtractedResult(data);
    } catch (err: any) {
      console.error('Extraction error:', err);
      setError(err?.message || 'Failed to extract story bibles from script.');
    } finally {
      setLoading(false);
    }
  };

  const handleApply = () => {
    if (!extractedResult) return;
    onApplyExtracted(extractedResult);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl p-6 relative max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg">
              <Sparkles className="w-4 h-4 text-amber-300" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">AI Story Bible Extractor (Gemini)</h3>
              <p className="text-xs text-slate-400">
                Transforms raw story concepts into synchronized Style, Character, and Environment bibles
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content body */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4">
          {!extractedResult ? (
            <>
              {error && (
                <div className="p-3 bg-red-950/40 border border-red-800/80 rounded-xl text-xs text-red-300 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                  <span>{error}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Story Title</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Story title..."
                    className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-lg px-3 py-2 text-xs text-white outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Genre / Tone</label>
                  <input
                    type="text"
                    value={genre}
                    onChange={(e) => setGenre(e.target.value)}
                    placeholder="e.g. War Drama, Cyberpunk, Gothic Mystery..."
                    className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-lg px-3 py-2 text-xs text-white outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Source Script or Story Synopsis *
                </label>
                <textarea
                  rows={6}
                  value={storyNotes}
                  onChange={(e) => setStoryNotes(e.target.value)}
                  placeholder="Paste your story outline, sequence breakdown, or screenplay excerpt..."
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl p-3 text-xs text-slate-200 font-mono leading-relaxed outline-none"
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
                <div className="text-xs">
                  <div className="font-semibold text-slate-200">Historical Grounding Strictness</div>
                  <div className="text-[11px] text-slate-400">
                    Enforces authentic period uniforms, gear, and realistic palette
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setHistoricallyGrounded(!historicallyGrounded)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold border transition ${
                    historicallyGrounded
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      : 'bg-slate-900 text-slate-400 border-slate-800'
                  }`}
                >
                  {historicallyGrounded ? 'Strict Historical' : 'Fictional Freedom'}
                </button>
              </div>
            </>
          ) : (
            <div className="space-y-4">
              <div className="p-3 bg-emerald-950/30 border border-emerald-800/60 rounded-xl text-xs text-emerald-300 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Successfully extracted Story Engine Bibles! Review before applying.</span>
                </div>
                <button
                  onClick={() => setExtractedResult(null)}
                  className="text-xs text-slate-400 hover:text-white underline"
                >
                  Edit Input & Re-run
                </button>
              </div>

              {/* Style Bible preview */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-purple-400">
                  <Palette className="w-4 h-4" />
                  <span>Extracted Style Bible</span>
                </div>
                <div className="text-xs text-slate-300 font-medium">{extractedResult.art_style}</div>
                <div className="flex items-center gap-1.5 pt-1">
                  {extractedResult.palette?.map((c, i) => (
                    <div key={i} className="flex items-center gap-1 bg-slate-900 px-2 py-0.5 rounded text-[11px] font-mono text-slate-300 border border-slate-800">
                      <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: c }} />
                      <span>{c}</span>
                    </div>
                  ))}
                </div>
                <div className="text-[11px] text-slate-400 pt-1">
                  <span className="font-semibold text-slate-300">Prompt Prefix: </span>
                  {extractedResult.locked_style_prompt_prefix}
                </div>
              </div>

              {/* Characters preview */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-sky-400">
                  <Users className="w-4 h-4" />
                  <span>Extracted Characters ({extractedResult.characters?.length || 0})</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {extractedResult.characters?.map((c, i) => (
                    <div key={i} className="bg-slate-900 p-2.5 rounded-lg border border-slate-800 text-xs">
                      <div className="font-bold text-white">{c.name}</div>
                      <div className="text-[11px] text-sky-300">{c.role} {c.age ? `· ${c.age}` : ''}</div>
                      <div className="text-[11px] text-slate-400 mt-1 line-clamp-2">{c.appearance}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Environments preview */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
                  <MapPin className="w-4 h-4" />
                  <span>Extracted Locations ({extractedResult.environments?.length || 0})</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {extractedResult.environments?.map((env, i) => (
                    <div key={i} className="bg-slate-900 p-2.5 rounded-lg border border-slate-800 text-xs">
                      <div className="font-bold text-white">{env.name}</div>
                      <div className="text-[11px] text-amber-300">{env.time_of_day}</div>
                      <div className="text-[11px] text-slate-400 mt-1 line-clamp-2">{env.description}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-2 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition"
          >
            Cancel
          </button>

          {!extractedResult ? (
            <button
              type="button"
              disabled={loading}
              onClick={handleExtract}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 text-white text-xs font-semibold shadow-md transition"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-amber-300" />
                  <span>Analyzing with Gemini...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>Generate Bibles with AI</span>
                </>
              )}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleApply}
              className="flex items-center gap-1.5 px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md transition"
            >
              <Check className="w-4 h-4" />
              <span>Apply Bibles to Project</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
