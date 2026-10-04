import React from 'react';
import { ChatMessageItem, GenerationCandidate } from '../../../types/story';
import { Check, Eye, Trash2 } from 'lucide-react';

interface ChatMessageProps {
  message: ChatMessageItem;
  onSelectCandidate?: (candidateId: string) => void;
  onRemoveCandidate?: (candidateId: string) => void;
  onOpenPreview?: () => void;
  selectedCandidateId?: string;
  isApproved?: boolean;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({
  message,
  onSelectCandidate,
  onRemoveCandidate,
  onOpenPreview,
  selectedCandidateId,
  isApproved,
}) => {
  const isVizzy = message.sender === 'vizzy';

  return (
    <div className={`flex w-full ${isVizzy ? 'justify-start' : 'justify-end'} my-3`}>
      <div
        className={`max-w-[92%] sm:max-w-[85%] md:max-w-[78%] rounded-2xl p-3.5 sm:p-4 space-y-3 ${
          isVizzy
            ? 'bg-transparent text-[#171717] border border-[#E7E7E5] shadow-xs'
            : 'bg-[#F5F5F4] text-[#171717] border border-transparent'
        }`}
      >
        {/* Message Header for Vizzy */}
        {isVizzy && (
          <div className="flex items-center gap-2 pb-1 border-b border-[#E7E7E5]">
            <span className="font-semibold text-xs text-[#171717]">Vizzy</span>
            <span className="text-[11px] text-[#9CA3AF] font-mono">{message.timestamp}</span>
          </div>
        )}

        {/* Message Text */}
        <p className="text-sm leading-relaxed whitespace-pre-wrap text-[#171717] font-normal">
          {message.text}
        </p>

        {/* Generated 3 Options Grid */}
        {message.candidates && message.candidates.length > 0 && (
          <div className="pt-2 space-y-2">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {message.candidates.map((cand, idx) => {
                const isSelected = cand.id === selectedCandidateId;
                return (
                  <div
                    key={cand.id}
                    className={`rounded-xl overflow-hidden border transition-all flex flex-col bg-white ${
                      isSelected
                        ? 'border-[#BFDBFE] ring-2 ring-[#BFDBFE] bg-[#EEF5FF]/30'
                        : 'border-[#E7E7E5] hover:border-[#D1D5DB]'
                    }`}
                  >
                    {/* Image Preview (Preserves 16:9 Aspect Ratio) */}
                    <div
                      className="relative aspect-[16/9] w-full bg-[#F5F5F4] cursor-pointer overflow-hidden"
                      onClick={() => onSelectCandidate?.(cand.id)}
                    >
                      <img
                        src={cand.imageUrl}
                        alt={cand.title || `Option ${idx + 1}`}
                        className="w-full h-full object-cover transition-transform duration-200 hover:scale-[1.02]"
                      />
                    </div>

                    {/* Compact Actions: Select & Remove */}
                    <div className="p-2 sm:p-2.5 flex items-center justify-between gap-1 border-t border-[#E7E7E5] bg-white">
                      <button
                        type="button"
                        onClick={() => onSelectCandidate?.(cand.id)}
                        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition min-h-[36px] ${
                          isSelected
                            ? 'bg-[#EEF5FF] text-[#3B82F6] font-semibold'
                            : 'text-[#6B7280] hover:text-[#171717] hover:bg-[#F5F5F4]'
                        }`}
                      >
                        <span
                          className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 ${
                            isSelected
                              ? 'border-[#3B82F6] bg-[#3B82F6] text-white'
                              : 'border-[#9CA3AF]'
                          }`}
                        >
                          {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                        </span>
                        <span>{isSelected ? 'Selected' : 'Select'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => onRemoveCandidate?.(cand.id)}
                        title="Remove candidate option"
                        className="p-1.5 text-[#9CA3AF] hover:text-red-500 hover:bg-red-50 rounded-lg transition min-h-[36px] min-w-[36px] flex items-center justify-center"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Refined Image Single Preview */}
        {message.refinedImageUrl && (
          <div className="pt-2">
            <div className="rounded-xl overflow-hidden border border-[#E7E7E5] bg-white aspect-[16/9] w-full max-w-lg">
              <img
                src={message.refinedImageUrl}
                alt="Refined Artwork"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        )}

        {/* Page Completion / In-Conversation Preview Trigger */}
        {(message.type === 'approval' || isApproved) && onOpenPreview && (
          <div className="pt-2 flex items-center gap-2">
            <button
              type="button"
              onClick={onOpenPreview}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#E7E7E5] bg-white hover:bg-[#F5F5F4] text-xs font-semibold text-[#171717] shadow-xs transition min-h-[38px]"
            >
              <Eye className="w-3.5 h-3.5 text-[#3B82F6]" />
              <span>Preview</span>
            </button>
          </div>
        )}

        {/* User timestamp */}
        {!isVizzy && (
          <div className="text-[10px] text-[#9CA3AF] font-mono text-right pt-0.5">
            {message.timestamp}
          </div>
        )}
      </div>
    </div>
  );
};
