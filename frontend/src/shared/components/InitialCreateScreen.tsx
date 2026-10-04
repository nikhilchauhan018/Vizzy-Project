import React, { useState, useRef } from 'react';
import { UploadCloud, X, ArrowUp } from 'lucide-react';

interface InitialCreateScreenProps {
  onCreateProject: (params: {
    title: string;
    storyPrompt: string;
    uploadedImage?: string | null;
    genre: string;
    historicallyGrounded: boolean;
  }) => void;
  onLoadPreset?: (presetId: string) => void;
}

export const InitialCreateScreen: React.FC<InitialCreateScreenProps> = ({
  onCreateProject,
  onLoadPreset,
}) => {
  const [storyPrompt, setStoryPrompt] = useState('');
  const [title, setTitle] = useState('');
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
      genre: 'Graphic Novel',
      historicallyGrounded: false,
    });
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8 bg-[#FCFCFB] select-none">
      <div className="max-w-xl w-full space-y-6">
        {/* Minimal Headline */}
        <div className="space-y-1">
          <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-[#171717]">
            What story do you want to create?
          </h2>
          <p className="text-xs text-[#6B7280]">
            Provide a script, premise, or reference image to begin.
          </p>
        </div>

        {/* Focused Input Card */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Reference Image Attachment */}
          {imagePreview ? (
            <div className="relative rounded-xl overflow-hidden border border-[#E7E7E5] bg-white aspect-[16/7] flex items-center justify-center group">
              <img
                src={imagePreview}
                alt="Uploaded Reference"
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => setImagePreview(null)}
                className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/60 text-white hover:bg-black transition"
              >
                <X className="w-3.5 h-3.5" />
              </button>
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
              className={`border border-dashed rounded-xl p-4 text-center cursor-pointer transition flex items-center justify-center gap-3 bg-white ${
                isDragging
                  ? 'border-[#3B82F6] bg-[#EEF5FF]/40'
                  : 'border-[#E7E7E5] hover:border-[#D1D5DB]'
              }`}
            >
              <UploadCloud className="w-4 h-4 text-[#9CA3AF]" />
              <span className="text-xs text-[#6B7280]">
                Drop reference image or <span className="text-[#3B82F6]">browse</span>
              </span>
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

          {/* Main Story Premise Input */}
          <div className="bg-white border border-[#E7E7E5] rounded-2xl p-3 focus-within:border-[#BFDBFE] shadow-2xs transition">
            <textarea
              required
              rows={4}
              value={storyPrompt}
              onChange={(e) => setStoryPrompt(e.target.value)}
              placeholder="Describe your story premise or first scene instructions..."
              className="w-full bg-transparent text-sm text-[#171717] placeholder:text-[#9CA3AF] outline-none resize-none leading-relaxed"
            />

            <div className="pt-2 border-t border-[#E7E7E5] flex items-center justify-between gap-3">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Story title (optional)"
                className="bg-transparent text-xs text-[#171717] placeholder:text-[#9CA3AF] outline-none max-w-[200px]"
              />

              <button
                type="submit"
                disabled={!storyPrompt.trim() && !imagePreview}
                className="p-2 rounded-xl bg-[#3B82F6] hover:bg-blue-600 disabled:opacity-30 disabled:hover:bg-[#3B82F6] text-white transition min-h-[38px] min-w-[38px] flex items-center justify-center shadow-xs"
              >
                <ArrowUp className="w-4 h-4 stroke-[2.5]" />
              </button>
            </div>
          </div>

          {/* Optional Starter preset shortcut */}
          {onLoadPreset && (
            <div className="pt-1 flex items-center gap-2 text-xs text-[#6B7280]">
              <span>Or start with:</span>
              <button
                type="button"
                onClick={() => onLoadPreset('normandy-1944')}
                className="px-2.5 py-1 rounded-lg bg-white border border-[#E7E7E5] text-[#171717] hover:bg-[#F5F5F4] transition text-xs font-medium"
              >
                D-Day 1944 Graphic Novel
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};
