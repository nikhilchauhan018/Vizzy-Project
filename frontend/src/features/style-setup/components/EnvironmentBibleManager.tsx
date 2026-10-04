import React, { useState } from 'react';
import { Environment } from '../../../types/story';
import { MapPin, Plus, Edit2, Trash2, CloudRain, Sun, X, Check, Globe } from 'lucide-react';

interface EnvironmentBibleManagerProps {
  environments: Environment[];
  onAddEnvironment: (data: Omit<Environment, 'id' | 'projectId' | 'created_at' | 'updated_at'>) => void;
  onUpdateEnvironment: (id: string, updates: Partial<Environment>) => void;
  onDeleteEnvironment: (id: string) => void;
}

export const EnvironmentBibleManager: React.FC<EnvironmentBibleManagerProps> = ({
  environments,
  onAddEnvironment,
  onUpdateEnvironment,
  onDeleteEnvironment,
}) => {
  const [editingEnv, setEditingEnv] = useState<Environment | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    weather: '',
    time_of_day: '',
  });

  const handleStartCreate = () => {
    setFormData({
      name: '',
      description: 'Expansive dramatic landscape featuring key architectural landmarks and terrain features...',
      weather: 'Overcast with mist',
      time_of_day: 'Golden hour late afternoon light',
    });
    setIsCreating(true);
    setEditingEnv(null);
  };

  const handleStartEdit = (env: Environment) => {
    setFormData({
      name: env.name,
      description: env.description,
      weather: env.weather,
      time_of_day: env.time_of_day,
    });
    setEditingEnv(env);
    setIsCreating(false);
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    if (isCreating) {
      onAddEnvironment({
        name: formData.name.trim(),
        description: formData.description.trim(),
        weather: formData.weather.trim(),
        time_of_day: formData.time_of_day.trim(),
      });
      setIsCreating(false);
    } else if (editingEnv) {
      onUpdateEnvironment(editingEnv.id, {
        name: formData.name.trim(),
        description: formData.description.trim(),
        weather: formData.weather.trim(),
        time_of_day: formData.time_of_day.trim(),
      });
      setEditingEnv(null);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <MapPin className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              Environment Bible (Spatial Continuity)
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300">
                Story Engine
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Settings, architectural details, weather conditions, and time-of-day locked for location fidelity
            </p>
          </div>
        </div>

        <button
          onClick={handleStartCreate}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold shadow transition"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Location</span>
        </button>
      </div>

      {environments.length === 0 ? (
        <div className="text-center py-8 bg-slate-950/40 rounded-xl border border-dashed border-slate-800 p-6">
          <Globe className="w-8 h-8 text-slate-600 mx-auto mb-2" />
          <p className="text-xs text-slate-400 font-medium">No environments defined yet in this Story Bible</p>
          <p className="text-[11px] text-slate-500 max-w-sm mx-auto mt-1">
            Add locations or click "AI Auto-Extract" to parse key settings from your script.
          </p>
          <button
            onClick={handleStartCreate}
            className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create First Location</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {environments.map((env) => (
            <div
              key={env.id}
              className="bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-xl p-4 transition flex flex-col justify-between group"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-lg bg-amber-950 text-amber-300 flex items-center justify-center font-bold text-xs border border-amber-800/60">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-100 group-hover:text-amber-300 transition">
                        {env.name}
                      </h4>
                      <p className="text-[11px] text-slate-400 flex items-center gap-2">
                        {env.time_of_day && <span>{env.time_of_day}</span>}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100">
                    <button
                      onClick={() => handleStartEdit(env)}
                      className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition"
                      title="Edit location"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDeleteEnvironment(env.id)}
                      className="p-1 rounded hover:bg-red-950/40 text-slate-500 hover:text-red-400 transition"
                      title="Delete location"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="space-y-2 text-xs">
                  {env.description && (
                    <div className="bg-slate-900/60 rounded-lg p-2.5 border border-slate-800/80">
                      <span className="text-[10px] uppercase font-bold text-slate-500 block mb-0.5">
                        Spatial & Architectural Layout
                      </span>
                      <p className="text-slate-300 leading-snug">{env.description}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2">
                    {env.weather && (
                      <div className="bg-slate-900/60 rounded-lg p-2 border border-slate-800/80">
                        <span className="text-[10px] uppercase font-bold text-slate-500 flex items-center gap-1 mb-0.5">
                          <CloudRain className="w-3 h-3 text-sky-400" />
                          Weather
                        </span>
                        <p className="text-slate-300 text-[11px] truncate">{env.weather}</p>
                      </div>
                    )}

                    {env.time_of_day && (
                      <div className="bg-slate-900/60 rounded-lg p-2 border border-slate-800/80">
                        <span className="text-[10px] uppercase font-bold text-slate-500 flex items-center gap-1 mb-0.5">
                          <Sun className="w-3 h-3 text-amber-400" />
                          Time & Sun
                        </span>
                        <p className="text-slate-300 text-[11px] truncate">{env.time_of_day}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-3 pt-2.5 border-t border-slate-900 flex items-center justify-between text-[10px] text-slate-500">
                <span>ID: {env.id.slice(0, 12)}</span>
                <span className="text-amber-400/80 font-medium">Ready for Visual Engine</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {(isCreating || editingEnv) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl p-6 relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <MapPin className="w-4 h-4 text-amber-400" />
                {isCreating ? 'Add Location to Environment Bible' : `Edit ${editingEnv?.name}`}
              </h3>
              <button
                onClick={() => {
                  setIsCreating(false);
                  setEditingEnv(null);
                }}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveForm} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Location Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Omaha Beach — Dog Green Shingle"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-lg px-3 py-2 text-xs text-white outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Spatial & Terrain Description
                </label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="e.g. Vast bloodstained tidal flats strewn with twisted steel Czech hedgehogs, Belgian gates, and smoking landing craft carcasses leading up to steep chalk bluffs..."
                  className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-lg p-2.5 text-xs text-white outline-none resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Weather / Atmosphere
                  </label>
                  <input
                    type="text"
                    value={formData.weather}
                    onChange={(e) => setFormData({ ...formData, weather: e.target.value })}
                    placeholder="e.g. Cold overcast, misty drizzle, cordite smoke"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-lg px-3 py-2 text-xs text-white outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Time of Day / Lighting
                  </label>
                  <input
                    type="text"
                    value={formData.time_of_day}
                    onChange={(e) => setFormData({ ...formData, time_of_day: e.target.value })}
                    placeholder="e.g. Dawn, 06:30 AM pale desaturated morning light"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-lg px-3 py-2 text-xs text-white outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreating(false);
                    setEditingEnv(null);
                  }}
                  className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold transition"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{isCreating ? 'Save Location' : 'Update Location'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
