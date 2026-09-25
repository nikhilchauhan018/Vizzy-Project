import React, { useState, useRef } from 'react';
import { BookOpen, UploadCloud, Image as ImageIcon, Sparkles, X, ArrowRight, ShieldCheck, Film, Compass } from 'lucide-react';

interface InitialCreateScreenProps {
  onCreateProject: (params: {
    title: string;
    storyPrompt: string;
    uploadedImage?: string | null;
    genre: string;
    historicallyGrounded: boolean;
  }) => void;
  onLoadPreset: (presetId: string) => void;
}

export const InitialCreateScreen: React.FC<InitialCreateScreenProps> = ({
  onCreateProject,
  onLoadPreset,
}) => {
  const [storyPrompt, setStoryPrompt] = useState(
    'I want to create a gritty wartime graphic novel about an elite squad of Rangers navigating the Omaha Beach landing and breaching the obstacle shingle under artillery fire.'
  );
  const [title, setTitle] = useState('Normandy: Zero Hour');
  const [genre, setGenre] = useState('Historical War Graphic Novel');
  const [historicallyGrounded, setHistoricallyGrounded] = useState(true);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageFile = (file: File) => {
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleImageFile(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!storyPrompt.trim() && !imagePreview) return;
    onCreateProject({
      title: title.trim() || 'Untitled Story',
      storyPrompt: storyPrompt.trim(),
      uploadedImage: imagePreview,
      genre: genre.trim() || 'Graphic Novel',
      historicallyGrounded,
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between relative overflow-hidden font-sans">
      {/* Ambient background glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-indigo-600/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[400px] h-[400px] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Top minimal header */}
      <header className="px-6 py-6 max-w-6xl mx-auto w-full flex items-center justify-between relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-amber-400 flex items-center justify-center shadow-xl shadow-indigo-600/25">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-black text-xl tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
              Vizzy
            </h1>
            <p className="text-[11px] text-slate-400 font-medium">Visual Storytelling & Graphic Novel Studio</p>
          </div>
        </div>

        {/* Quick starter presets button */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 hidden sm:inline">Try reference story:</span>
          <button
            onClick={() => onLoadPreset('normandy-1944')}
            className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-xs font-semibold text-slate-200 border border-slate-800 transition min-h-[40px]"
          >
            D-Day 1944
          </button>
        </div>
      </header>

      {/* Center Hero Creation Card */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 relative z-10">
        <div className="max-w-2xl w-full bg-slate-900/90 border border-slate-800/90 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
          {/* Headline */}
          <div className="text-center mb-6 space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/15 text-indigo-300 text-xs font-semibold border border-indigo-500/30 mb-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Create Visual Story in Seconds</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              What story do you want to bring to life?
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 max-w-lg mx-auto">
              Provide an inspirational image, a script premise, or story instructions. Vizzy will establish the style, characters, and build your graphic novel page by page.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Image Upload Area with Drag & Drop */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                Reference Image (Optional visual anchor or character)
              </label>

              {imagePreview ? (
                <div className="relative rounded-2xl overflow-hidden border border-slate-700 bg-slate-950 aspect-[21/9] sm:aspect-[16/6] flex items-center justify-center group">
                  <img
                    src={imagePreview}
                    alt="Uploaded Reference"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 text-white text-xs font-medium hover:bg-slate-700"
                    >
                      Change
                    </button>
                    <button
                      type="button"
                      onClick={() => setImagePreview(null)}
                      className="p-1.5 rounded-lg bg-red-600/80 text-white hover:bg-red-500"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-5 text-center cursor-pointer transition flex flex-col items-center justify-center gap-2 ${
                    isDragging
                      ? 'border-indigo-500 bg-indigo-500/10'
                      : 'border-slate-800 hover:border-slate-700 bg-slate-950/50 hover:bg-slate-950/80'
                  }`}
                >
                  <div className="w-10 h-10 rounded-xl bg-slate-800/80 text-slate-400 flex items-center justify-center">
                    <UploadCloud className="w-5 h-5 text-indigo-400" />
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-slate-200">
                      Drop an image here, or{' '}
                      <span className="text-indigo-400 hover:underline">browse</span>
                    </span>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Character sketch, moodboard photo, or comic panel inspiration (PNG, JPG, WebP)
                    </p>
                  </div>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleImageFile(e.target.files[0]);
                  }
                }}
                className="hidden"
              />
            </div>

            {/* Story / Instruction Input */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                Story Premise & Instructions *
              </label>
              <textarea
                required
                rows={4}
                value={storyPrompt}
                onChange={(e) => setStoryPrompt(e.target.value)}
                placeholder="E.g. I want to create a graphic novel based on this image about a rogue hacker in Neo-Tokyo uncovering secret corporate memories..."
                className="w-full bg-slate-950/80 border border-slate-800 focus:border-indigo-500 rounded-2xl p-3.5 text-xs sm:text-sm text-slate-100 placeholder:text-slate-600 outline-none resize-none leading-relaxed transition"
              />
            </div>

            {/* Optional Story Metadata */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                  Story Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Story title..."
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                  Genre / Aesthetic
                </label>
                <input
                  type="text"
                  value={genre}
                  onChange={(e) => setGenre(e.target.value)}
                  placeholder="e.g. War Graphic Novel, Cyberpunk Noir..."
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none"
                />
              </div>
            </div>

            {/* Historical Grounding Switch */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                <div>
                  <div className="text-xs font-semibold text-slate-200">Strict Period / Historical Grounding</div>
                  <div className="text-[11px] text-slate-500">
                    Enforces authentic uniforms, accurate military gear, and realistic lighting
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setHistoricallyGrounded(!historicallyGrounded)}
                className={`w-11 h-6 rounded-full transition-colors relative focus:outline-none ${
                  historicallyGrounded ? 'bg-amber-600' : 'bg-slate-800'
                }`}
              >
                <span
                  className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${
                    historicallyGrounded ? 'right-1' : 'left-1'
                  }`}
                />
              </button>
            </div>

            {/* Submit Action */}
            <button
              type="submit"
              className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-amber-500 hover:from-indigo-500 hover:to-amber-400 text-white font-bold text-sm sm:text-base shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-2 transition transform active:scale-[0.99] min-h-[48px]"
            >
              <span>Continue to Workspace</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-slate-500 text-xs relative z-10">
        Vizzy Creative Storyboard Studio · Story Engine, Visual Engine, Composition Engine
      </footer>
    </div>
  );
};
