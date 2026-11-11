import React, { useState } from 'react';
import {
  X,
  Download,
  Copy,
  Check,
  FileCode,
  FolderArchive,
  ExternalLink,
  ChevronRight,
  Globe,
  UploadCloud,
  CheckCircle2,
} from 'lucide-react';
import JSZip from 'jszip';
import { getChromeExtensionFiles, ExtensionFile } from '../services/extension/extensionFiles.ts';

interface ExtensionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ExtensionModal: React.FC<ExtensionModalProps> = ({ isOpen, onClose }) => {
  const files = getChromeExtensionFiles();
  const [selectedFileName, setSelectedFileName] = useState<string>('manifest.json');
  const [copied, setCopied] = useState(false);
  const [activeGuideTab, setActiveGuideTab] = useState<'local' | 'webstore'>('local');
  const [isZipping, setIsZipping] = useState(false);

  if (!isOpen) return null;

  const currentFile = files.find((f) => f.name === selectedFileName) || files[0];

  const handleCopyCode = () => {
    navigator.clipboard.writeText(currentFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadSingleFile = () => {
    const blob = new Blob([currentFile.content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = currentFile.name;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadZip = async () => {
    setIsZipping(true);
    try {
      const zip = new JSZip();
      files.forEach((file) => {
        zip.file(file.path, file.content);
      });
      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'samrapmeet-chrome-extension.zip';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to generate ZIP, downloading files individually:', err);
      // Fallback: download individual files
      files.forEach((file, index) => {
        setTimeout(() => {
          const blob = new Blob([file.content], { type: 'text/plain;charset=utf-8' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = file.name;
          a.click();
          URL.revokeObjectURL(url);
        }, index * 180);
      });
    } finally {
      setIsZipping(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-500 text-white flex items-center justify-center shadow-md shadow-indigo-500/20">
              <FolderArchive className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-100">
                  Google Meet Chrome Extension (Manifest V3)
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 font-medium">
                  Created by Footprints IT-Team
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Installable browser extension with real-time English & Khmer live captions capture
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Guide Switcher Tabs */}
        <div className="bg-slate-950/90 border-b border-slate-800 px-6 py-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-lg border border-slate-800">
              <button
                onClick={() => setActiveGuideTab('local')}
                className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors ${
                  activeGuideTab === 'local'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                1. Use Immediately (Developer Mode - Free & Instant)
              </button>
              <button
                onClick={() => setActiveGuideTab('webstore')}
                className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                  activeGuideTab === 'webstore'
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <UploadCloud className="w-3.5 h-3.5" />
                <span>2. Publish to Chrome Web Store</span>
              </button>
            </div>

            <span className="text-[11px] text-slate-400 hidden sm:inline">
              Author: <strong className="text-slate-200">Footprints IT-Team</strong>
            </span>
          </div>

          {activeGuideTab === 'local' ? (
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-[11px]">
              <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                <span className="font-bold text-sky-400 block mb-0.5">Step 1: Download</span>
                <span className="text-slate-400">Click "Download All Files" into a new folder on your computer.</span>
              </div>
              <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                <span className="font-bold text-sky-400 block mb-0.5">Step 2: Extensions</span>
                <span className="text-slate-400">In Chrome, visit <code className="text-slate-200 font-mono">chrome://extensions</code></span>
              </div>
              <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                <span className="font-bold text-sky-400 block mb-0.5">Step 3: Dev Mode</span>
                <span className="text-slate-400">Turn on <strong>Developer mode</strong> in the top-right corner.</span>
              </div>
              <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                <span className="font-bold text-emerald-400 block mb-0.5">Step 4: Load Unpacked</span>
                <span className="text-slate-400">Click <strong>Load unpacked</strong> and select the downloaded folder!</span>
              </div>
            </div>
          ) : (
            <div className="bg-indigo-950/40 border border-indigo-800/60 rounded-xl p-3 text-xs text-indigo-200 space-y-2">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h4 className="font-bold text-white text-xs mb-1">
                    How to Publish to the Google Chrome Web Store:
                  </h4>
                  <ol className="list-decimal list-inside space-y-1 text-slate-300 text-[11px]">
                    <li>
                      <strong>Package:</strong> Zip the downloaded folder containing <code className="text-white">manifest.json</code>, <code className="text-white">content.js</code>, <code className="text-white">background.js</code>, and <code className="text-white">sidepanel.html</code>.
                    </li>
                    <li>
                      <strong>Developer Account:</strong> Visit the{' '}
                      <a
                        href="https://chrome.google.com/webstore/devconsole"
                        target="_blank"
                        rel="noreferrer"
                        className="text-sky-400 underline hover:text-sky-300 inline-flex items-center gap-0.5"
                      >
                        Chrome Web Store Developer Dashboard <ExternalLink className="w-2.5 h-2.5" />
                      </a>{' '}
                      using your Footprints School Google Workspace account.
                    </li>
                    <li>
                      <strong>Upload Item:</strong> Click <strong>"New Item"</strong> and drop your <code className="text-white">.zip</code> bundle.
                    </li>
                    <li>
                      <strong>Audience Restriction (Recommended for School):</strong> Under "Visibility", you can choose <strong>"Private"</strong> (restricted only to teachers & staff under your <code className="text-white">footprintsschool.edu.kh</code> domain) or <strong>"Public"</strong> for anyone worldwide.
                    </li>
                  </ol>
                </div>

                <a
                  href="https://chrome.google.com/webstore/devconsole"
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shrink-0 flex items-center gap-1.5 shadow-sm"
                >
                  <span>Open Dev Dashboard</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Code & File Explorer Body */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* File sidebar */}
          <div className="w-full md:w-56 border-r border-slate-800 bg-slate-950/60 p-3 space-y-1 overflow-y-auto">
            <span className="text-[10px] uppercase font-bold text-slate-500 px-2 block mb-1">
              Extension Bundle Files
            </span>
            {files.map((file) => (
              <button
                key={file.name}
                onClick={() => setSelectedFileName(file.name)}
                className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-mono flex items-center justify-between transition-colors ${
                  selectedFileName === file.name
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <FileCode className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{file.name}</span>
                </div>
                <ChevronRight className="w-3 h-3 shrink-0 opacity-40" />
              </button>
            ))}
          </div>

          {/* Code Viewer Panel */}
          <div className="flex-1 flex flex-col bg-slate-950 overflow-hidden">
            {/* File toolbar */}
            <div className="px-4 py-2 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-xs font-mono font-bold text-slate-200">
                  {currentFile.path}
                </span>
                <span className="text-[11px] text-slate-400 ml-2 hidden sm:inline">
                  — {currentFile.description}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyCode}
                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium flex items-center gap-1 transition-colors"
                >
                  {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copied ? 'Copied' : 'Copy Code'}</span>
                </button>
                <button
                  onClick={handleDownloadSingleFile}
                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium flex items-center gap-1 transition-colors"
                >
                  <Download className="w-3 h-3" />
                  <span>Download</span>
                </button>
              </div>
            </div>

            {/* Code Content */}
            <div className="flex-1 p-4 overflow-auto">
              <pre className="text-xs font-mono text-slate-300 whitespace-pre leading-relaxed">
                {currentFile.content}
              </pre>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-900/60 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="text-xs text-slate-400 text-center sm:text-left">
            Manifest V3 &bull; Powered by Google Meet Caption Observers &bull;{' '}
            <strong className="text-slate-300">Footprints IT-Team</strong>
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
            >
              Close
            </button>
            <button
              onClick={handleDownloadZip}
              disabled={isZipping}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-500/20 flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isZipping ? 'Packaging ZIP...' : 'Download Extension ZIP (.zip)'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
