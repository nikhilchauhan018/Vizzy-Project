import React, { useRef, useEffect } from 'react';
import { Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';
import { ChatMessageItem } from '../../../types/story';
import { ChatMessage } from './ChatMessage';
import { ChatComposer } from './ChatComposer';

interface ChatPanelProps {
  messages: ChatMessageItem[];
  pageId: string;
  pageNumber: string;
  onSendMessage: (text: string, attachedImage?: string | null) => void;
  onSelectCandidate?: (candidateId: string) => void;
  onRemoveCandidate?: (candidateId: string) => void;
  onOpenPreview?: () => void;
  selectedCandidateId?: string;
  isPageApproved?: boolean;
  isLoading?: boolean;
  apiError?: string | null;
  isPuterConnected?: boolean;
  onConnectPuter?: () => void;
  isConnectingPuter?: boolean;
  puterNotice?: string | null;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({
  messages,
  pageId,
  pageNumber,
  onSendMessage,
  onSelectCandidate,
  onRemoveCandidate,
  onOpenPreview,
  selectedCandidateId,
  isPageApproved,
  isLoading,
  apiError,
  isPuterConnected = false,
  onConnectPuter,
  isConnectingPuter = false,
  puterNotice,
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  return (
    <div className="flex-1 flex flex-col h-full bg-[#FCFCFB] overflow-hidden">
      {/* Scrollable conversation thread */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 md:px-8 py-4 sm:py-6 space-y-4 custom-scrollbar">
        <div className="max-w-3xl mx-auto w-full space-y-4">
          {/* Puter AI Connection Status Banner */}
          <div className="flex items-center justify-between px-3.5 py-2 rounded-xl border bg-white text-xs text-[#525252] shadow-2xs">
            <div className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-[#2563EB]" />
              <span className="font-medium text-[#171717]">AI Image Engine (Puter)</span>
              {isPuterConnected ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  <CheckCircle2 className="w-3 h-3" /> Connected
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                  <AlertCircle className="w-3 h-3" /> Not Connected
                </span>
              )}
            </div>

            {!isPuterConnected && onConnectPuter && (
              <button
                type="button"
                onClick={onConnectPuter}
                disabled={isConnectingPuter}
                className="px-2.5 py-1 text-[11px] font-medium bg-[#171717] text-white rounded-lg hover:bg-[#262626] transition disabled:opacity-50 cursor-pointer"
              >
                {isConnectingPuter ? 'Connecting...' : 'Connect Puter (Free)'}
              </button>
            )}
          </div>

          {/* Puter Notice / Error */}
          {puterNotice && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 text-xs text-amber-800 flex items-center justify-between">
              <span>{puterNotice}</span>
            </div>
          )}

          {/* API Error Notification */}
          {apiError && (
            <div className="bg-rose-50 border border-rose-200 rounded-xl px-4 py-2.5 text-xs text-rose-700 flex items-center justify-between">
              <span>{apiError}</span>
            </div>
          )}

          {messages.map((msg) => (
            <ChatMessage
              key={msg.id}
              message={msg}
              onSelectCandidate={onSelectCandidate}
              onRemoveCandidate={onRemoveCandidate}
              onOpenPreview={onOpenPreview}
              selectedCandidateId={selectedCandidateId}
              isApproved={isPageApproved}
            />
          ))}

          {/* Clean loading state */}
          {isLoading && (
            <div className="flex justify-start my-2">
              <div className="bg-white border border-[#E7E7E5] rounded-2xl px-4 py-2.5 text-xs text-[#6B7280] shadow-xs flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#3B82F6] animate-pulse" />
                <span>Generating...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Composer at bottom */}
      <div className="border-t border-[#E7E7E5] bg-[#FCFCFB] shrink-0">
        <ChatComposer onSendMessage={onSendMessage} isLoading={isLoading} />
      </div>
    </div>
  );
};
