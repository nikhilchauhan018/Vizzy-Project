import React from 'react';
import { ChatMessageItem, GenerationCandidate } from '../../../types/story';
import { Sparkles, Check, CheckCircle2, User, ArrowRight } from 'lucide-react';

interface ChatMessageProps {
  message: ChatMessageItem;
  onSelectCandidate?: (candidateId: string) => void;
  onApproveCurrent?: () => void;
  onGoToNextPage?: () => void;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({
  message,
  onSelectCandidate,
  onApproveCurrent,
  onGoToNextPage,
}) => {
  const isVizzy = message.sender === 'vizzy';

  return (
    <div className={`flex gap-2.5 sm:gap-3 text-xs sm:text-sm ${isVizzy ? 'justify-start' : 'justify-end'}`}>
      {/* Vizzy Avatar */}
      {isVizzy && (
        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-amber-400 flex items-center justify-center shrink-0 shadow-md shadow-indigo-600/20 text-white font-bold text-xs mt-0.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-200" />
        </div>
      )}

      {/* Message Content Bubble */}
      <div
        className={`max-w-[85%] sm:max-w-[78%] rounded-2xl p-3 sm:p-3.5 shadow-sm space-y-2.5 ${
          isVizzy
            ? 'bg-slate-900 border border-slate-800 text-slate-200'
            : 'bg-indigo-600 text-white rounded-br-sm'
        }`}
      >
        {/* Text */}
        <p className="leading-relaxed whitespace-pre-wrap">{message.text}</p>

        {/* Inline Option Previews (when message includes candidates) */}
        {message.candidates && message.candidates.length > 0 && (
          <div className="grid grid-cols-3 gap-2 pt-1">
            {message.candidates.map((cand, idx) => (
              <div
                key={cand.id}
                onClick={() => onSelectCandidate?.(cand.id)}
                className="group relative rounded-lg overflow-hidden border border-slate-800 hover:border-indigo-500 bg-slate-950 cursor-pointer transition"
              >
                <div className="aspect-[16/9] w-full overflow-hidden">
                  <img
                    src={cand.imageUrl}
                    alt={cand.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition"
                  />
                </div>
                <div className="p-1.5 bg-slate-950/90 text-center">
                  <span className="text-[10px] font-bold text-slate-300 block truncate">
                    Option 0{idx + 1}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Refined Image Inline Preview */}
        {message.refinedImageUrl && (
          <div className="rounded-xl overflow-hidden border border-slate-800 bg-slate-950 aspect-[16/9] w-full max-w-sm mt-1">
            <img
              src={message.refinedImageUrl}
              alt="Refined Artwork"
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Timestamp */}
        <div
          className={`text-[10px] font-mono text-right ${
            isVizzy ? 'text-slate-500' : 'text-indigo-200'
          }`}
        >
          {message.timestamp}
        </div>
      </div>

      {/* User Avatar */}
      {!isVizzy && (
        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0 text-slate-300 text-xs mt-0.5">
          <User className="w-3.5 h-3.5" />
        </div>
      )}
    </div>
  );
};
