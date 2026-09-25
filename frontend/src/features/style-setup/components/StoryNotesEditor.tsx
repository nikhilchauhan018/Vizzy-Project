import React, { useState, useEffect } from 'react';
import { FileText, Save, Sparkles, Wand2, Copy, Check } from 'lucide-react';

interface StoryNotesEditorProps {
  notes: string;
  onSaveNotes: (notes: string) => void;
  onOpenAiModal: () => void;
}

export const StoryNotesEditor: React.FC<StoryNotesEditorProps> = ({
  notes,
  onSaveNotes,
  onOpenAiModal,
}) => {
  const [content, setContent] = useState(notes);
  const [copied, setCopied] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setContent(notes);
    setHasChanges(false);
  }, [notes]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    setHasChanges(true);
  };

  const handleManualSave = () => {
    onSaveNotes(content);
    setHasChanges(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col h-full">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100">Story Script & Source Notes</h3>
            <p className="text-[11px] text-slate-400">
              Raw narrative, sequence beats, and screenplay notes that feed the visual engines
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400 text-[11px]">{wordCount} words</span>
          {hasChanges && (
            <button
              onClick={handleManualSave}
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition"
            >
              <Save className="w-3 h-3" />
              Save
            </button>
          )}
          <button
            onClick={handleCopy}
            className="p-1.5 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
            title="Copy notes"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col relative">
        <textarea
          value={content}
          onChange={handleChange}
          onBlur={() => {
            if (hasChanges) {
              handleManualSave();
            }
          }}
          placeholder="Paste or write your graphic novel script, screenplay, or scene notes here... E.g. 'A shadowy alley in 1940s Chicago, Detective Marcus confronts the syndicate informant under the flicker of a broken neon sign...'"
          className="w-full flex-1 min-h-[180px] bg-slate-950/70 border border-slate-800 focus:border-indigo-500 rounded-xl p-3.5 text-xs text-slate-200 font-mono leading-relaxed outline-none resize-y placeholder:text-slate-600"
        />

        <div className="mt-3 flex items-center justify-between gap-2 text-xs">
          <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
            <Wand2 className="w-3.5 h-3.5 text-purple-400" />
            <span>Story Engine extracts Character, Environment & Style bibles from this text</span>
          </div>

          <button
            onClick={onOpenAiModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-950/80 hover:bg-indigo-900/90 text-indigo-300 border border-indigo-700/50 text-xs font-medium transition"
          >
            <Sparkles className="w-3 h-3 text-amber-300" />
            <span>Auto-Generate Bibles from this Script</span>
          </button>
        </div>
      </div>
    </div>
  );
};
