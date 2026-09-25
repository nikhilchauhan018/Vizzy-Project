import React, { useState } from 'react';
import { StyleBible, Character, Environment } from '../../../types/story';
import { compilePrompt, SceneParams } from '../services/promptCompiler';
import { Terminal, Copy, Check } from 'lucide-react';

interface PromptCompilerSandboxProps {
  styleBible: StyleBible;
  characters: Character[];
  environments: Environment[];
}

const CAMERA_PRESETS = [
  'Cinematic wide establishing shot, deep field depth',
  'Low-angle heroic tracking shot, looking up with dynamic perspective',
  'Intense cinematic over-the-shoulder shot',
  'Extreme close-up macro framing on eyes and facial tension',
  'Dramatic 35-degree Dutch angle tilt, conveying disorientation',
  'Medium two-shot framing, capturing character interaction and tension',
  'High bird-eye vantage shot looking down onto scene layout',
];

export const PromptCompilerSandbox: React.FC<PromptCompilerSandboxProps> = ({
  styleBible,
  characters,
  environments,
}) => {
  const [selectedCharIds, setSelectedCharIds] = useState<string[]>(
    characters.length > 0 ? [characters[0].id] : []
  );
  const [selectedEnvId, setSelectedEnvId] = useState<string>(
    environments.length > 0 ? environments[0].id : ''
  );
  const [camera, setCamera] = useState<string>(CAMERA_PRESETS[1]);
  const [action, setAction] = useState<string>(
    'Takes cover behind a shattered obstacle, shouting urgent orders to advance while scanning the perimeter'
  );
  const [mood, setMood] = useState<string>('Harrowing, high tension, adrenaline-fueled');
  const [copied, setCopied] = useState(false);

  const handleToggleChar = (id: string) => {
    if (selectedCharIds.includes(id)) {
      setSelectedCharIds(selectedCharIds.filter((c) => c !== id));
    } else {
      setSelectedCharIds([...selectedCharIds, id]);
    }
  };

  const sceneParams: SceneParams = {
    characterIds: selectedCharIds,
    environmentId: selectedEnvId,
    camera,
    action,
    mood,
  };

  const compiledPrompt = compilePrompt(styleBible, characters, environments, sceneParams);

  const handleCopy = () => {
    navigator.clipboard.writeText(compiledPrompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Terminal className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              Deterministic Prompt Compiler Sandbox
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                Non-LLM Compiler
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Inspect how the 3 separate bibles (Style, Character, Environment) synthesize into reproducible image generation prompts
            </p>
          </div>
        </div>

        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copied ? 'Copied!' : 'Copy Compiled Prompt'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Character Pickers */}
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
          <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
            <span>Featured Cast (Character Bible)</span>
            <span className="text-[10px] text-sky-400">{selectedCharIds.length} selected</span>
          </label>
          {characters.length === 0 ? (
            <p className="text-xs text-slate-500 italic">No characters in bible yet</p>
          ) : (
            <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
              {characters.map((char) => {
                const isSelected = selectedCharIds.includes(char.id);
                return (
                  <button
                    key={char.id}
                    type="button"
                    onClick={() => handleToggleChar(char.id)}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center justify-between transition ${
                      isSelected
                        ? 'bg-sky-500/20 text-sky-200 border border-sky-500/40'
                        : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200'
                    }`}
                  >
                    <span className="truncate">{char.name}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-sky-400 shrink-0" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Environment Picker */}
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
          <label className="text-xs font-semibold text-slate-300 block">
            Location Setting (Environment Bible)
          </label>
          {environments.length === 0 ? (
            <p className="text-xs text-slate-500 italic">No environments in bible yet</p>
          ) : (
            <select
              value={selectedEnvId}
              onChange={(e) => setSelectedEnvId(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 focus:border-amber-500 rounded-lg p-2.5 text-xs text-slate-200 outline-none"
            >
              {environments.map((env) => (
                <option key={env.id} value={env.id}>
                  {env.name}
                </option>
              ))}
            </select>
          )}

          <div className="pt-2">
            <label className="text-[11px] font-semibold text-slate-400 block mb-1">
              Camera Angle & Framing
            </label>
            <select
              value={camera}
              onChange={(e) => setCamera(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 focus:border-indigo-500 rounded-lg p-2 text-xs text-slate-200 outline-none"
            >
              {CAMERA_PRESETS.map((preset, i) => (
                <option key={i} value={preset}>
                  {preset}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Action & Mood */}
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Panel Action / Moment
            </label>
            <textarea
              rows={2}
              value={action}
              onChange={(e) => setAction(e.target.value)}
              placeholder="Momentary action..."
              className="w-full bg-slate-900 border border-slate-800 focus:border-emerald-500 rounded-lg p-2 text-xs text-slate-200 outline-none resize-none"
            />
          </div>
          <div>
            <label className="text-[11px] font-semibold text-slate-400 block mb-1">
              Atmosphere / Mood
            </label>
            <input
              type="text"
              value={mood}
              onChange={(e) => setMood(e.target.value)}
              placeholder="Mood..."
              className="w-full bg-slate-900 border border-slate-800 focus:border-emerald-500 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 outline-none"
            />
          </div>
        </div>
      </div>

      <div className="bg-slate-950 rounded-xl border border-slate-800 p-4 font-mono text-xs">
        <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-900 text-slate-400">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500/80"></span>
            <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-300">
              Compiled Prompt Output (Deterministic)
            </span>
          </div>
          <span className="text-[10px] text-slate-500">
            {compiledPrompt.length} chars · Zero LLM hallucination
          </span>
        </div>

        <pre className="text-slate-200 whitespace-pre-wrap leading-relaxed max-h-56 overflow-y-auto">
          {compiledPrompt}
        </pre>
      </div>
    </div>
  );
};
