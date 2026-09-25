import React, { useState } from 'react';
import { Project } from '../../../types/story';
import { X, FileText, Video, Archive, Check, Loader2, Download, Sparkles } from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
}

export const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose, project }) => {
  const [exportFormat, setExportFormat] = useState<'pdf' | 'video' | 'zip'>('pdf');
  const [isExporting, setIsExporting] = useState(false);
  const [downloadReady, setDownloadReady] = useState(false);

  if (!isOpen) return null;

  const handleStartExport = () => {
    setIsExporting(true);
    setDownloadReady(false);
    setTimeout(() => {
      setIsExporting(false);
      setDownloadReady(true);
    }, 2000);
  };

  const handleDownload = () => {
    // Generate text/JSON summary download as proof
    const dataStr =
      'data:text/json;charset=utf-8,' +
      encodeURIComponent(
        JSON.stringify(
          {
            title: project.title,
            format: exportFormat,
            pagesCount: project.pages.length,
            exportedAt: new Date().toISOString(),
            styleBible: project.styleBible,
            pages: project.pages.map((p) => ({
              pageNumber: p.pageNumber,
              title: p.title,
              status: p.status,
            })),
          },
          null,
          2
        )
      );
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute(
      'download',
      `${project.title.toLowerCase().replace(/\s+/g, '-')}-vizzy.${exportFormat === 'pdf' ? 'json' : exportFormat}`
    );
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl p-6 relative">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Export Graphic Novel</h3>
              <p className="text-xs text-slate-400">{project.title} · Sequence Assembly</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 min-h-[40px] min-w-[40px] flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Format Selector */}
        <div className="space-y-3 mb-6">
          <label className="text-xs font-semibold text-slate-300 block">Select Output Format:</label>

          <div className="grid grid-cols-3 gap-2.5">
            {/* PDF Book */}
            <button
              type="button"
              onClick={() => {
                setExportFormat('pdf');
                setDownloadReady(false);
              }}
              className={`p-3.5 rounded-2xl border text-left transition flex flex-col items-start justify-between min-h-[90px] ${
                exportFormat === 'pdf'
                  ? 'bg-indigo-600/20 border-indigo-500 text-white'
                  : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileText className="w-5 h-5 text-indigo-400 mb-2" />
              <div>
                <span className="text-xs font-bold block text-white">PDF Book</span>
                <span className="text-[10px] text-slate-400">High-res print</span>
              </div>
            </button>

            {/* Video Slideshow */}
            <button
              type="button"
              onClick={() => {
                setExportFormat('video');
                setDownloadReady(false);
              }}
              className={`p-3.5 rounded-2xl border text-left transition flex flex-col items-start justify-between min-h-[90px] ${
                exportFormat === 'video'
                  ? 'bg-indigo-600/20 border-indigo-500 text-white'
                  : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200'
              }`}
            >
              <Video className="w-5 h-5 text-amber-400 mb-2" />
              <div>
                <span className="text-xs font-bold block text-white">MP4 Video</span>
                <span className="text-[10px] text-slate-400">Ken Burns pan</span>
              </div>
            </button>

            {/* Image ZIP */}
            <button
              type="button"
              onClick={() => {
                setExportFormat('zip');
                setDownloadReady(false);
              }}
              className={`p-3.5 rounded-2xl border text-left transition flex flex-col items-start justify-between min-h-[90px] ${
                exportFormat === 'zip'
                  ? 'bg-indigo-600/20 border-indigo-500 text-white'
                  : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200'
              }`}
            >
              <Archive className="w-5 h-5 text-emerald-400 mb-2" />
              <div>
                <span className="text-xs font-bold block text-white">Images ZIP</span>
                <span className="text-[10px] text-slate-400">Raw panels</span>
              </div>
            </button>
          </div>
        </div>

        {/* Project Summary Box */}
        <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-2 mb-6 text-xs">
          <div className="flex justify-between text-slate-400">
            <span>Pages Included:</span>
            <span className="text-white font-mono">{project.pages.length} Pages</span>
          </div>
          <div className="flex justify-between text-slate-400">
            <span>Color Profile:</span>
            <span className="text-white">RGB {project.styleBible.art_style.slice(0, 24)}...</span>
          </div>
          <div className="flex justify-between text-slate-400">
            <span>Aspect Ratio:</span>
            <span className="text-white font-mono">{project.styleBible.aspect_ratio}</span>
          </div>
        </div>

        {/* Action Button */}
        {downloadReady ? (
          <button
            onClick={handleDownload}
            className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm shadow-xl shadow-emerald-600/20 flex items-center justify-center gap-2 transition min-h-[48px]"
          >
            <Check className="w-4 h-4" />
            <span>Download {exportFormat.toUpperCase()} File</span>
          </button>
        ) : (
          <button
            onClick={handleStartExport}
            disabled={isExporting}
            className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs sm:text-sm shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-2 transition min-h-[48px]"
          >
            {isExporting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-amber-300" />
                <span>Assembling {exportFormat.toUpperCase()} Sequence...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>Render & Compile {exportFormat.toUpperCase()}</span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
};
