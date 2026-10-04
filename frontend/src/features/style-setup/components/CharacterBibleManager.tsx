import React, { useState } from 'react';
import { Character } from '../../../types/story';
import { Users, Plus, Edit2, Trash2, User, X, Check } from 'lucide-react';

interface CharacterBibleManagerProps {
  characters: Character[];
  onAddCharacter: (data: Omit<Character, 'id' | 'projectId' | 'created_at' | 'updated_at'>) => void;
  onUpdateCharacter: (id: string, updates: Partial<Character>) => void;
  onDeleteCharacter: (id: string) => void;
}

export const CharacterBibleManager: React.FC<CharacterBibleManagerProps> = ({
  characters,
  onAddCharacter,
  onUpdateCharacter,
  onDeleteCharacter,
}) => {
  const [editingChar, setEditingChar] = useState<Character | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    role: '',
    age: '',
    appearance: '',
    uniform: '',
    hair: '',
  });

  const handleStartCreate = () => {
    setFormData({
      name: '',
      role: 'Protagonist',
      age: 'Late 20s',
      appearance: 'Determined gaze, athletic build, distinctive features',
      uniform: 'Utilitarian field gear with personal insignia',
      hair: 'Short dark hair',
    });
    setIsCreating(true);
    setEditingChar(null);
  };

  const handleStartEdit = (char: Character) => {
    setFormData({
      name: char.name,
      role: char.role || '',
      age: char.age || '',
      appearance: char.appearance || '',
      uniform: char.uniform || '',
      hair: char.hair || '',
    });
    setEditingChar(char);
    setIsCreating(false);
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    if (isCreating) {
      onAddCharacter({
        name: formData.name.trim(),
        role: formData.role.trim(),
        age: formData.age.trim(),
        appearance: formData.appearance.trim(),
        uniform: formData.uniform.trim(),
        hair: formData.hair.trim(),
      });
      setIsCreating(false);
    } else if (editingChar) {
      onUpdateCharacter(editingChar.id, {
        name: formData.name.trim(),
        role: formData.role.trim(),
        age: formData.age.trim(),
        appearance: formData.appearance.trim(),
        uniform: formData.uniform.trim(),
        hair: formData.hair.trim(),
      });
      setEditingChar(null);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              Character Bible (Visual Identity)
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-sky-500/20 text-sky-300">
                Story Engine
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Face, silhouette, uniform, and hair specifications referenced independently for cast consistency
            </p>
          </div>
        </div>

        <button
          onClick={handleStartCreate}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold shadow transition"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Character</span>
        </button>
      </div>

      {characters.length === 0 ? (
        <div className="text-center py-8 bg-slate-950/40 rounded-xl border border-dashed border-slate-800 p-6">
          <User className="w-8 h-8 text-slate-600 mx-auto mb-2" />
          <p className="text-xs text-slate-400 font-medium">No characters defined yet in this Story Bible</p>
          <p className="text-[11px] text-slate-500 max-w-sm mx-auto mt-1">
            Add characters manually or click "AI Auto-Extract" to extract characters from your script.
          </p>
          <button
            onClick={handleStartCreate}
            className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create First Character</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {characters.map((char) => (
            <div
              key={char.id}
              className="bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-xl p-4 transition flex flex-col justify-between group"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-lg bg-sky-950 text-sky-300 flex items-center justify-center font-bold text-xs border border-sky-800/60">
                      {char.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-100 group-hover:text-sky-300 transition">
                        {char.name}
                      </h4>
                      <p className="text-[11px] text-slate-400">
                        {char.role || 'Character'} {char.age ? `· ${char.age}` : ''}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100">
                    <button
                      onClick={() => handleStartEdit(char)}
                      className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition"
                      title="Edit character"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDeleteCharacter(char.id)}
                      className="p-1 rounded hover:bg-red-950/40 text-slate-500 hover:text-red-400 transition"
                      title="Delete character"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="space-y-2 text-xs">
                  {char.appearance && (
                    <div className="bg-slate-900/60 rounded-lg p-2.5 border border-slate-800/80">
                      <span className="text-[10px] uppercase font-bold text-slate-500 block mb-0.5">
                        Face & Physique
                      </span>
                      <p className="text-slate-300 leading-snug">{char.appearance}</p>
                    </div>
                  )}

                  {char.uniform && (
                    <div className="bg-slate-900/60 rounded-lg p-2.5 border border-slate-800/80">
                      <span className="text-[10px] uppercase font-bold text-slate-500 block mb-0.5">
                        Uniform & Attire
                      </span>
                      <p className="text-slate-300 leading-snug">{char.uniform}</p>
                    </div>
                  )}

                  {char.hair && (
                    <div className="bg-slate-900/60 rounded-lg p-2.5 border border-slate-800/80">
                      <span className="text-[10px] uppercase font-bold text-slate-500 block mb-0.5">
                        Hair & Hallmarks
                      </span>
                      <p className="text-slate-300 leading-snug">{char.hair}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-3 pt-2.5 border-t border-slate-900 flex items-center justify-between text-[10px] text-slate-500">
                <span>ID: {char.id.slice(0, 12)}</span>
                <span className="text-sky-400/80 font-medium">Ready for Visual Engine</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {(isCreating || editingChar) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl p-6 relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <User className="w-4 h-4 text-sky-400" />
                {isCreating ? 'Add New Character to Bible' : `Edit ${editingChar?.name}`}
              </h3>
              <button
                onClick={() => {
                  setIsCreating(false);
                  setEditingChar(null);
                }}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveForm} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Character Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Captain John Miller"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-sky-500 rounded-lg px-3 py-2 text-xs text-white outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Role / Archetype</label>
                  <input
                    type="text"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    placeholder="e.g. Company Commander"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-sky-500 rounded-lg px-3 py-2 text-xs text-white outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Age / Demographics</label>
                <input
                  type="text"
                  value={formData.age}
                  onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                  placeholder="e.g. 34 years old, veteran"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-sky-500 rounded-lg px-3 py-2 text-xs text-white outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Appearance (Face, Eyes, Build, Silhouette)
                </label>
                <textarea
                  rows={2}
                  value={formData.appearance}
                  onChange={(e) => setFormData({ ...formData, appearance: e.target.value })}
                  placeholder="e.g. Chiseled weathered features, dark stubble, intense grey eyes, athletic build..."
                  className="w-full bg-slate-950 border border-slate-800 focus:border-sky-500 rounded-lg p-2.5 text-xs text-white outline-none resize-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Uniform / Clothing / Tactical Gear
                </label>
                <textarea
                  rows={2}
                  value={formData.uniform}
                  onChange={(e) => setFormData({ ...formData, uniform: e.target.value })}
                  placeholder="e.g. M1941 olive drab jacket, canvas webbing, M1 steel helmet with captain bars..."
                  className="w-full bg-slate-950 border border-slate-800 focus:border-sky-500 rounded-lg p-2.5 text-xs text-white outline-none resize-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Hair, Facial Hair, & Distinctive Marks
                </label>
                <input
                  type="text"
                  value={formData.hair}
                  onChange={(e) => setFormData({ ...formData, hair: e.target.value })}
                  placeholder="e.g. Short crop dark brown hair, damp with ocean spray, scar on cheek..."
                  className="w-full bg-slate-950 border border-slate-800 focus:border-sky-500 rounded-lg px-3 py-2 text-xs text-white outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreating(false);
                    setEditingChar(null);
                  }}
                  className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold transition"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{isCreating ? 'Save Character' : 'Update Character'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
