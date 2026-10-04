import React, { useState, useRef } from 'react';
import { ArrowUp, Image as ImageIcon, X } from 'lucide-react';

interface ChatComposerProps {
  onSendMessage: (text: string, attachedImage?: string | null) => void;
  isLoading?: boolean;
}

export const ChatComposer: React.FC<ChatComposerProps> = ({
  onSendMessage,
  isLoading = false,
}) => {
  const [input, setInput] = useState('');
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageFile = (file: File) => {
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setAttachedImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if ((!input.trim() && !attachedImage) || isLoading) return;
    onSendMessage(input.trim(), attachedImage);
    setInput('');
    setAttachedImage(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto p-3 sm:p-4">
      <form
        onSubmit={handleSubmit}
        className="bg-white border border-[#E7E7E5] rounded-2xl shadow-sm focus-within:border-[#BFDBFE] transition-colors p-2 sm:p-2.5 flex flex-col gap-2"
      >
        {/* Attached image preview */}
        {attachedImage && (
          <div className="relative inline-block w-20 h-14 rounded-lg overflow-hidden border border-[#E7E7E5] bg-[#FCFCFB] ml-1 mt-1">
            <img src={attachedImage} alt="Attachment" className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => setAttachedImage(null)}
              className="absolute top-1 right-1 p-0.5 bg-black/60 rounded-full text-white hover:bg-black"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )}

        <div className="flex items-end gap-2">
          {/* Reference attachment */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            title="Attach reference image"
            className="p-2 text-[#9CA3AF] hover:text-[#171717] hover:bg-[#F5F5F4] rounded-xl transition min-h-[40px] min-w-[40px] flex items-center justify-center shrink-0"
          >
            <ImageIcon className="w-4 h-4" />
          </button>
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

          {/* Text input */}
          <textarea
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything..."
            className="flex-1 bg-transparent text-sm text-[#171717] placeholder:text-[#9CA3AF] outline-none resize-none py-2 px-1 max-h-32 min-h-[40px] leading-relaxed"
          />

          {/* Send action */}
          <button
            type="submit"
            disabled={(!input.trim() && !attachedImage) || isLoading}
            aria-label="Send message"
            className="p-2 rounded-xl bg-[#3B82F6] hover:bg-blue-600 disabled:opacity-30 disabled:hover:bg-[#3B82F6] text-white transition min-h-[40px] min-w-[40px] flex items-center justify-center shrink-0 shadow-sm"
          >
            <ArrowUp className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>
      </form>
    </div>
  );
};
