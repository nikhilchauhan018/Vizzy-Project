import React, { useState } from 'react';
import { StyleBible } from '../../../types/story';
import { Palette, Sun, Sliders, Lock, Sparkles, Ratio } from 'lucide-react';

interface StyleBibleCardProps {
  styleBible: StyleBible;
  onUpdate: (updates: Partial<StyleBible>) => void;
}

const PRESET_PALETTES = [
  { name: 'Normandy War Slate', colors: ['#2B333B', '#5A6365', '#8E9794', '#99583D', '#E2D8C9'] },
  { name: 'Cyberpunk Neon', colors: ['#0B0E14', '#00F0FF', '#FF0055', '#7928CA', '#F3F4F6'] },
  { name: 'Dark Graphic Noir', colors: ['#0A0A0A', '#262626', '#525252', '#A3A3A3', '#FAFAFA'] },
  { name: 'Vintage 4-Color Comic', colors: ['#1C1917', '#DC2626', '#2563EB', '#FBBF24', '#FEF3C7'] },
  { name: 'Folk Horror Earth', colors: ['#1C1917', '#451A03', '#78350F', '#15803D', '#FDE68A'] },
  { name: 'Anime Cel Shading', colors: ['#1E1B4B', '#4338CA', '#06B6D4', '#EC4899', '#FFF1F2'] },
];

const RENDER_MEDIUMS = [
  'Ink line drawing with textured watercolor & gouache digital washes',
  'Heavy graphic novel brush inking with deep black solid shadows',
  'Vintage 1970s comic halftone screenprint with CMYK misregistration',
  'Stylized digital concept art with dynamic speedlines and rim lighting',
  'Classic Franco-Belgian Ligne Claire illustration with flat colors',
  'Atmospheric oil on canvas matte painting with rich impasto textures',
];

const ASPECT_RATIOS: Array<StyleBible['aspect_ratio']> = ['16:9', '4:3', '1:1', '9:16', '21:9'];

export const StyleBibleCard: React.FC<StyleBibleCardProps> = ({ styleBible, onUpdate }) => {
  const [editingPaletteIndex, setEditingPaletteIndex] = useState<number | null>(null);

  const handleColorChange = (index: number, newColor: string) => {
    const updated = [...styleBible.palette];
    updated[index] = newColor;
    onUpdate({ palette: updated });
  };

  const handleSelectPresetPalette = (colors: string[]) => {
    onUpdate({ palette: colors });
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <Palette className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              Style Bible (Aesthetic Continuity)
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-purple-500/20 text-purple-300">
                Story Engine 1:1
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              General visual aesthetic, color palette, rendering medium, and prompt prefix
            </p>
          </div>
        </div>

        {/* Aspect Ratio Badge */}
        <div className="flex items-center gap-1.5 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">
          <Ratio className="w-4 h-4 text-indigo-400" />
          <span className="text-xs text-slate-400">Ratio:</span>
          <select
            value={styleBible.aspect_ratio}
            onChange={(e) => onUpdate({ aspect_ratio: e.target.value as StyleBible['aspect_ratio'] })}
            className="bg-transparent text-xs font-bold text-indigo-300 outline-none cursor-pointer"
          >
            {ASPECT_RATIOS.map((ratio) => (
              <option key={ratio} value={ratio} className="bg-slate-900 text-white">
                {ratio}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Grid of Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Art Style */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-indigo-400" />
            Art Style & Artistic Technique
          </label>
          <textarea
            rows={2}
            value={styleBible.art_style}
            onChange={(e) => onUpdate({ art_style: e.target.value })}
            placeholder="e.g. Gritty cinematic graphic novel, heavy brushed ink contours, realistic proportions..."
            className="w-full bg-slate-950 border border-slate-800 focus:border-purple-500 rounded-xl p-3 text-xs text-slate-200 outline-none resize-none"
          />
        </div>

        {/* Render Medium */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Render Medium / Inking Style
            </span>
          </label>
          <select
            value={RENDER_MEDIUMS.includes(styleBible.render_medium) ? styleBible.render_medium : 'custom'}
            onChange={(e) => {
              if (e.target.value !== 'custom') {
                onUpdate({ render_medium: e.target.value });
              }
            }}
            className="w-full bg-slate-950 border border-slate-800 focus:border-purple-500 rounded-xl p-3 text-xs text-slate-200 outline-none mb-1.5"
          >
            {RENDER_MEDIUMS.map((m, idx) => (
              <option key={idx} value={m}>
                {m}
              </option>
            ))}
            <option value="custom">-- Custom render medium --</option>
          </select>
          <input
            type="text"
            value={styleBible.render_medium}
            onChange={(e) => onUpdate({ render_medium: e.target.value })}
            placeholder="Custom render medium..."
            className="w-full bg-slate-950/60 border border-slate-800 focus:border-purple-500 rounded-lg px-3 py-1.5 text-xs text-slate-300 outline-none"
          />
        </div>

        {/* Lighting Default */}
        <div className="space-y-2 md:col-span-2">
          <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <Sun className="w-3.5 h-3.5 text-amber-400" />
            Lighting Default Baseline
          </label>
          <input
            type="text"
            value={styleBible.lighting_default}
            onChange={(e) => onUpdate({ lighting_default: e.target.value })}
            placeholder="e.g. High-contrast chiaroscuro, cinematic rim light, atmospheric haze..."
            className="w-full bg-slate-950 border border-slate-800 focus:border-purple-500 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 outline-none"
          />
        </div>

        {/* Color Palette Swatches */}
        <div className="space-y-3 md:col-span-2 bg-slate-950/50 p-4 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5 text-purple-400" />
              Unified Color Palette (5-Color Swatch Set)
            </label>
            <div className="text-[11px] text-slate-400">Click any swatch to tweak HEX color</div>
          </div>

          <div className="grid grid-cols-5 gap-3">
            {styleBible.palette.map((color, idx) => (
              <div key={idx} className="flex flex-col items-center gap-1.5 group">
                <div className="relative w-full h-12 rounded-xl shadow-inner border border-slate-700/80 overflow-hidden cursor-pointer transition transform group-hover:scale-105">
                  <div
                    className="w-full h-full"
                    style={{ backgroundColor: color }}
                    onClick={() => setEditingPaletteIndex(editingPaletteIndex === idx ? null : idx)}
                  />
                  <input
                    type="color"
                    value={color.startsWith('#') ? color : '#111827'}
                    onChange={(e) => handleColorChange(idx, e.target.value)}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    title={`Change color ${idx + 1}`}
                  />
                </div>
                <input
                  type="text"
                  value={color}
                  onChange={(e) => handleColorChange(idx, e.target.value)}
                  className="w-full text-center bg-slate-900 border border-slate-800 rounded px-1 py-0.5 text-[11px] font-mono text-slate-300 group-hover:border-purple-500"
                />
              </div>
            ))}
          </div>

          {/* Quick Preset Buttons */}
          <div className="pt-2 flex items-center gap-2 flex-wrap">
            <span className="text-[10px] uppercase font-bold text-slate-500">Presets:</span>
            {PRESET_PALETTES.map((preset, idx) => (
              <button
                key={idx}
                onClick={() => handleSelectPresetPalette(preset.colors)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-900 hover:bg-slate-800 text-[11px] text-slate-300 border border-slate-800 transition"
              >
                <div className="flex items-center gap-0.5">
                  {preset.colors.map((c, ci) => (
                    <span
                      key={ci}
                      className="w-2 h-2 rounded-full inline-block"
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
                <span>{preset.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Locked Style Prompt Prefix */}
        <div className="space-y-2 md:col-span-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-emerald-400" />
              Locked Style Prompt Prefix (Injected into Every Visual Engine Prompt)
            </label>
            <span className="text-[10px] text-slate-400 font-mono">Ensures cross-panel style locking</span>
          </div>
          <textarea
            rows={2}
            value={styleBible.locked_style_prompt_prefix}
            onChange={(e) => onUpdate({ locked_style_prompt_prefix: e.target.value })}
            placeholder="e.g. 1940s wartime graphic novel style, authentic historical military detailing, dramatic tonal contrast..."
            className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl p-3 text-xs text-slate-200 font-mono outline-none resize-none"
          />
        </div>
      </div>
    </div>
  );
};
