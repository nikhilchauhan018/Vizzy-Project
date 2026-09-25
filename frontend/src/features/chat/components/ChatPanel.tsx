import React, { useRef, useEffect } from 'react';
import { ChatMessageItem } from '../../../types/story';
import { ChatMessage } from './ChatMessage';
import { ChatComposer } from './ChatComposer';
import { MessageSquare, Sparkles } from 'lucide-react';

interface ChatPanelProps {
  messages: ChatMessageItem[];
  pageId: string;
  pageNumber: string;
  onSendMessage: (text: string) => void;
  onSelectCandidate?: (candidateId: string) => void;
  onApproveCurrent?: () => void;
  onGoToNextPage?: () => void;
  isPageApproved?: boolean;
  canApprove?: boolean;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({
  messages,
  pageId,
  pageNumber,
  onSendMessage,
  onSelectCandidate,
  onApproveCurrent,
  onGoToNextPage,
  isPageApproved,
  canApprove,
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex flex-col h-64 sm:h-72 md:h-80 bg-slate-950 border-t border-slate-800/80 shrink-0">
      {/* Chat Sub-header */}
      <div className="px-4 py-2 bg-slate-900/60 border-b border-slate-800/60 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
          <span className="text-xs font-bold text-slate-300">
            Creative Director Chat · Page {pageNumber}
          </span>
        </div>
        <div className="text-[11px] text-slate-500 font-mono">
          Refine artwork conversationally
        </div>
      </div>

      {/* Messages Stream */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 custom-scrollbar">
        {messages.map((msg) => (
          <ChatMessage
            key={msg.id}
            message={msg}
            onSelectCandidate={onSelectCandidate}
            onApproveCurrent={onApproveCurrent}
            onGoToNextPage={onGoToNextPage}
          />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Chat Composer */}
      <ChatComposer
        onSendMessage={onSendMessage}
        onApproveCurrent={onApproveCurrent}
        isPageApproved={isPageApproved}
        canApprove={canApprove}
      />
    </div>
  );
};
