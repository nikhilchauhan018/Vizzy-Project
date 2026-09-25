import React, { useState } from 'react';
import { Send, Sparkles, Check, ArrowRight } from 'lucide-react';

interface ChatComposerProps {
  onSendMessage: (text: string) => void;
  onApproveCurrent?: () => void;
  isPageApproved?: boolean;
  canApprove?: boolean;
}

export const ChatComposer: React.FC<ChatComposerProps> = ({
  onSendMessage,
  onApproveCurrent,
  isPageApproved,
  canApprove,
}) => {
  const [input, setInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    onSendMessage(input.trim());
    setInput('');
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="p-2.5 sm:p-3 bg-slate-900/90 border-t border-slate-800/80 shrink-0"
    >
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Describe your scene instruction or refinement (e.g. 'Make it darker, add smoke')..."
          className="flex-1 bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-100 placeholder:text-slate-500 outline-none transition min-h-[44px]"
        />

        {/* Quick Approve button if ready */}
        {canApprove && !isPageApproved && (
          <button
            type="button"
            onClick={onApproveCurrent}
            title="Approve this page"
            className="hidden sm:flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-emerald-600/90 hover:bg-emerald-500 text-white text-xs font-semibold shadow transition min-h-[44px]"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Approve</span>
          </button>
        )}

        {/* Send Button */}
        <button
          type="submit"
          disabled={!input.trim()}
          aria-label="Send message"
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:hover:bg-indigo-600 text-white text-xs font-bold shadow-md shadow-indigo-600/20 flex items-center justify-center gap-1.5 transition min-h-[44px] min-w-[44px]"
        >
          <span className="hidden sm:inline">Send</span>
          <Send className="w-3.5 h-3.5" />
        </button>
      </div>
    </form>
  );
};
