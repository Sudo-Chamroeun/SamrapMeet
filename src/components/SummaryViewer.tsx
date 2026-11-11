import React, { useState } from 'react';
import {
  Copy,
  Check,
  Download,
  Share2,
  Printer,
  Sparkles,
  CheckCircle2,
  Calendar,
  User as UserIcon,
  BookOpen,
  Award,
  Globe2,
  Volume2,
  Filter,
  FileText,
  FileCode,
  Mail,
  Send,
  X,
  Settings2,
} from 'lucide-react';
import { MeetingSummary, ActionItem } from '../types/index.ts';
import {
  generateMarkdown,
  generateEmailDigest,
  downloadFile,
  printNotesAsPDF,
  ExportOptions,
  DEFAULT_EXPORT_OPTIONS,
} from '../services/export/exportUtils.ts';

interface SummaryViewerProps {
  summary: MeetingSummary | null;
  onUpdateActionItem: (actionId: string, completed: boolean) => void;
  onReSummarize: () => void;
  isSummarizing: boolean;
}

export const SummaryViewer: React.FC<SummaryViewerProps> = ({
  summary,
  onUpdateActionItem,
  onReSummarize,
  isSummarizing,
}) => {
  const [langTab, setLangTab] = useState<'dual' | 'en' | 'km'>('dual');
  const [actionFilter, setActionFilter] = useState<'all' | 'pending' | 'completed' | 'high'>('all');
  const [copiedType, setCopiedType] = useState<'none' | 'md' | 'email'>('none');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    ...DEFAULT_EXPORT_OPTIONS,
    languageMode: 'dual',
  });
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  if (!summary) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-400">
        <Sparkles className="w-12 h-12 mx-auto text-blue-400/50 mb-3 animate-pulse" />
        <h3 className="text-base font-bold text-slate-200">No Meeting Summary Generated Yet</h3>
        <p className="text-xs text-slate-400 max-w-md mx-auto mt-1 mb-6">
          Capture or paste a transcript in the Simulator or Transcript Studio, then click "Generate Meeting Notes" to synthesize bilingual minutes.
        </p>
        <button
          onClick={onReSummarize}
          disabled={isSummarizing}
          className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-lg shadow-blue-500/20 transition-all inline-flex items-center gap-2"
        >
          <Sparkles className="w-4 h-4 text-amber-300" />
          <span>{isSummarizing ? 'Synthesizing...' : 'Generate Notes Now'}</span>
        </button>
      </div>
    );
  }

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Filter action items
  const filteredActions = summary.actionItems.filter((act) => {
    if (actionFilter === 'pending') return !act.completed;
    if (actionFilter === 'completed') return act.completed;
    if (actionFilter === 'high') return act.priority === 'high';
    return true;
  });

  // Direct Markdown File Download
  const handleDownloadMarkdown = (optionsToUse: ExportOptions = { ...exportOptions, languageMode: langTab }) => {
    const md = generateMarkdown(summary, optionsToUse);
    const filename = `${summary.title.toLowerCase().replace(/[^a-z0-9]+/g, '_')}_notes.md`;
    downloadFile(md, filename, 'text/markdown;charset=utf-8');
    triggerToast(`Downloaded ${filename}`);
  };

  // Direct PDF Export via Print-to-PDF Dialog
  const handleExportPDF = (optionsToUse: ExportOptions = { ...exportOptions, languageMode: langTab }) => {
    printNotesAsPDF(summary, optionsToUse);
    triggerToast('PDF print preview opened');
  };

  const handleCopyMarkdown = (optionsToUse: ExportOptions = { ...exportOptions, languageMode: langTab }) => {
    const md = generateMarkdown(summary, optionsToUse);
    navigator.clipboard.writeText(md);
    setCopiedType('md');
    triggerToast('Markdown copied to clipboard');
    setTimeout(() => setCopiedType('none'), 2000);
  };

  const handleCopyEmailDigest = (optionsToUse: ExportOptions = { ...exportOptions, languageMode: langTab }) => {
    const digest = generateEmailDigest(summary, optionsToUse);
    navigator.clipboard.writeText(digest);
    setCopiedType('email');
    triggerToast('Email digest copied to clipboard');
    setTimeout(() => setCopiedType('none'), 2000);
  };

  const handleDownloadJSON = () => {
    const blob = new Blob([JSON.stringify(summary, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${summary.title.replace(/\s+/g, '_')}_summary.json`;
    a.click();
    URL.revokeObjectURL(url);
    triggerToast('JSON summary downloaded');
  };

  const handleSpeak = (text: string, lang: 'en-US' | 'km-KH') => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    if (isSpeaking) {
      setIsSpeaking(false);
      return;
    }
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="flex flex-col gap-6 print:m-0 print-page">
      {/* Toast alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-600 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-2xl flex items-center gap-2 animate-bounce no-print">
          <Check className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Summary Header & Export Toolbar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 no-print">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-400 font-semibold border border-blue-500/30">
              {summary.generatedWith}
            </span>
            <span className="text-xs text-slate-400">Generated at {summary.timestamp}</span>
          </div>
          <h2 className="text-xl font-bold text-slate-100">{summary.title}</h2>
          <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
            <span>Date: {summary.date}</span>
            <span>•</span>
            <span>{summary.actionItems.length} Actions</span>
            <span>•</span>
            <span>{summary.keyDecisions.length} Decisions</span>
            <span>•</span>
            <span>{summary.stats.khmerRatio}% Khmer Content</span>
          </div>
        </div>

        {/* Toolbar & Export Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Language Mode Tabs */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setLangTab('dual')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                langTab === 'dual' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              🌐 Dual (ទ្វេភាសា)
            </button>
            <button
              onClick={() => setLangTab('en')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                langTab === 'en' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              🇺🇸 English
            </button>
            <button
              onClick={() => setLangTab('km')}
              className={`px-3 py-1 rounded-lg text-xs font-medium font-khmer transition-colors ${
                langTab === 'km' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              🇰🇭 ភាសាខ្មែរ
            </button>
          </div>

          {/* Quick Direct PDF Export Button */}
          <button
            onClick={() => handleExportPDF()}
            className="px-3.5 py-1.5 rounded-lg bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/40 text-xs font-medium flex items-center gap-1.5 transition-colors shadow-sm"
            title="Export meeting notes as formatted PDF"
          >
            <Printer className="w-3.5 h-3.5 text-rose-400" />
            <span>Export PDF</span>
          </button>

          {/* Quick Direct Markdown Export Button */}
          <button
            onClick={() => handleDownloadMarkdown()}
            className="px-3.5 py-1.5 rounded-lg bg-sky-600/20 hover:bg-sky-600/30 text-sky-300 border border-sky-500/40 text-xs font-medium flex items-center gap-1.5 transition-colors shadow-sm"
            title="Download meeting notes as Markdown (.md) file"
          >
            <Download className="w-3.5 h-3.5 text-sky-400" />
            <span>Download .MD</span>
          </button>

          {/* Comprehensive Export & Share Modal Button */}
          <button
            onClick={() => setShowExportModal(true)}
            className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium flex items-center gap-1.5 transition-colors shadow-sm shadow-blue-500/20"
            title="Open Export & Share Options"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Share & Export</span>
          </button>
        </div>
      </div>

      {/* 1. Executive Briefing Card */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-blue-950/40 border border-slate-800 rounded-2xl p-6 shadow-xl print-card">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100">Executive Summary</h3>
              <p className="text-xs text-slate-400 font-khmer">សេចក្តីសង្ខេបប្រតិបត្តិនៃកិច្ចប្រជុំ</p>
            </div>
          </div>

          <button
            onClick={() =>
              handleSpeak(
                langTab === 'km' ? summary.executiveSummaryKm : summary.executiveSummaryEn,
                langTab === 'km' ? 'km-KH' : 'en-US'
              )
            }
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors no-print"
            title="Listen Read-Aloud"
          >
            <Volume2 className={`w-4 h-4 ${isSpeaking ? 'text-blue-400 animate-pulse' : ''}`} />
          </button>
        </div>

        <div className="space-y-4">
          {(langTab === 'dual' || langTab === 'en') && (
            <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/60">
              <span className="text-[10px] uppercase font-bold text-blue-400 tracking-wider block mb-1">
                English Brief
              </span>
              <p className="text-sm text-slate-200 leading-relaxed">
                {summary.executiveSummaryEn}
              </p>
            </div>
          )}

          {(langTab === 'dual' || langTab === 'km') && (
            <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/60 font-khmer">
              <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider block mb-1">
                សេចក្តីសង្ខេបជាភាសាខ្មែរ
              </span>
              <p className="text-sm text-slate-200 leading-relaxed font-khmer">
                {summary.executiveSummaryKm}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 2. Key Action Items Checklist */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl print-card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-600/20 text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100">Action Items & Deliverables</h3>
              <p className="text-xs text-slate-400 font-khmer">ផែនការសកម្មភាព និងកិច្ចការត្រូវអនុវត្ត</p>
            </div>
          </div>

          {/* Action Filter */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs no-print">
            <Filter className="w-3 h-3 text-slate-500 ml-1" />
            {(['all', 'pending', 'completed', 'high'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setActionFilter(filter)}
                className={`px-2 py-0.5 rounded text-[11px] font-medium capitalize transition-colors ${
                  actionFilter === filter
                    ? 'bg-emerald-600 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          {filteredActions.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-4">No action items match the selected filter.</p>
          ) : (
            filteredActions.map((act) => (
              <div
                key={act.id}
                className={`p-3.5 rounded-xl border transition-all ${
                  act.completed
                    ? 'bg-slate-950/40 border-slate-800/50 opacity-60'
                    : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={act.completed}
                    onChange={(e) => onUpdateActionItem(act.id, e.target.checked)}
                    className="mt-1 w-4 h-4 rounded border-slate-700 text-emerald-600 focus:ring-emerald-500 bg-slate-900 cursor-pointer"
                  />
                  <div className="flex-1">
                    {/* Bilingual tasks */}
                    {(langTab === 'dual' || langTab === 'en') && (
                      <p
                        className={`text-sm font-medium ${
                          act.completed ? 'line-through text-slate-500' : 'text-slate-200'
                        }`}
                      >
                        {act.taskEn}
                      </p>
                    )}
                    {(langTab === 'dual' || langTab === 'km') && (
                      <p
                        className={`text-sm font-khmer mt-0.5 ${
                          act.completed ? 'line-through text-slate-500' : 'text-slate-300'
                        }`}
                      >
                        {act.taskKm}
                      </p>
                    )}

                    {/* Metadata tags */}
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      {act.assignee && (
                        <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700/60">
                          <UserIcon className="w-3 h-3 text-sky-400" />
                          <span>{act.assignee}</span>
                        </span>
                      )}

                      {act.dueDate && (
                        <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700/60">
                          <Calendar className="w-3 h-3 text-amber-400" />
                          <span>{act.dueDate}</span>
                        </span>
                      )}

                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider ${
                          act.priority === 'high'
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            : act.priority === 'medium'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {act.priority} priority
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 3. Key Decisions Log */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl print-card">
        <div className="flex items-center gap-2 border-b border-slate-800/80 pb-3 mb-4">
          <div className="w-8 h-8 rounded-lg bg-indigo-600/20 text-indigo-400 flex items-center justify-center">
            <Award className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-100">Key Resolutions & Decisions</h3>
            <p className="text-xs text-slate-400 font-khmer">ការសម្រេចចិត្ត និងការឯកភាពសំខាន់ៗ</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {summary.keyDecisions.map((dec) => (
            <div
              key={dec.id}
              className="bg-slate-950 p-4 rounded-xl border border-slate-800 hover:border-indigo-500/40 transition-colors"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-bold border border-indigo-500/30">
                  RATIFIED
                </span>
                {dec.context && (
                  <span className="text-[10px] text-slate-500 font-mono">{dec.context}</span>
                )}
              </div>

              {(langTab === 'dual' || langTab === 'en') && (
                <p className="text-sm font-semibold text-slate-200 mb-1">{dec.decisionEn}</p>
              )}
              {(langTab === 'dual' || langTab === 'km') && (
                <p className="text-sm text-slate-300 font-khmer leading-relaxed">
                  {dec.decisionKm}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 4. Thematic Discussion Topics */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl print-card">
        <div className="flex items-center gap-2 border-b border-slate-800/80 pb-3 mb-4">
          <div className="w-8 h-8 rounded-lg bg-purple-600/20 text-purple-400 flex items-center justify-center">
            <BookOpen className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-100">Discussion Breakdown</h3>
            <p className="text-xs text-slate-400 font-khmer">ចំណុចលម្អិតនៃកិច្ចពិភាក្សា</p>
          </div>
        </div>

        <div className="space-y-4">
          {summary.discussionTopics.map((topic) => (
            <div key={topic.id} className="bg-slate-950 p-4 rounded-xl border border-slate-800">
              <h4 className="text-sm font-bold text-slate-100 flex items-center justify-between">
                <span>{langTab === 'km' ? topic.topicKm : topic.topicEn}</span>
                {langTab === 'dual' && (
                  <span className="text-xs font-normal text-slate-400 font-khmer">
                    ({topic.topicKm})
                  </span>
                )}
              </h4>

              <ul className="mt-3 space-y-2">
                {topic.pointsEn.map((pt, i) => (
                  <li key={i} className="text-xs text-slate-300 flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                    <div>
                      {(langTab === 'dual' || langTab === 'en') && <div>{pt}</div>}
                      {(langTab === 'dual' || langTab === 'km') && topic.pointsKm[i] && (
                        <div className="font-khmer text-slate-400 mt-0.5">
                          {topic.pointsKm[i]}
                        </div>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* 5. Bilingual Glossary */}
      {summary.glossary && summary.glossary.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl print-card">
          <div className="flex items-center gap-2 border-b border-slate-800/80 pb-3 mb-4">
            <div className="w-8 h-8 rounded-lg bg-sky-600/20 text-sky-400 flex items-center justify-center">
              <Globe2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100">Bilingual Glossary & Terminology</h3>
              <p className="text-xs text-slate-400 font-khmer">សទ្ទានុក្រមពាក្យបច្ចេកទេស និងអប់រំ</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {summary.glossary.map((item, idx) => (
              <div key={idx} className="bg-slate-950 p-3.5 rounded-xl border border-slate-800/80">
                <span className="text-xs font-bold text-sky-400 block">{item.termEn}</span>
                <span className="text-xs font-semibold text-emerald-400 font-khmer block mt-0.5">
                  {item.termKm}
                </span>
                <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">
                  {item.definition}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Export & Sharing Options Modal */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 no-print">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center">
                  <Share2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-100">Export & Share Meeting Notes</h3>
                  <p className="text-xs text-slate-400">
                    Download PDF, Markdown file, or copy ready-to-send digests
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowExportModal(false)}
                className="p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Language Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Export Language Mode
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['dual', 'en', 'km'] as const).map((mode) => (
                    <button
                      key={mode}
                      onClick={() => setExportOptions((prev) => ({ ...prev, languageMode: mode }))}
                      className={`p-2.5 rounded-xl text-xs font-medium border text-center transition-all ${
                        exportOptions.languageMode === mode
                          ? 'bg-blue-600 text-white border-blue-500 shadow-sm'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {mode === 'dual' ? '🌐 Dual (Bilingual)' : mode === 'en' ? '🇺🇸 English' : '🇰🇭 ភាសាខ្មែរ'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sections to Include */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Sections to Include
                </label>
                <div className="grid grid-cols-2 gap-2 text-xs text-slate-300">
                  <label className="flex items-center gap-2 bg-slate-950 p-2.5 rounded-lg border border-slate-800/80 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={exportOptions.includeExecutiveSummary}
                      onChange={(e) =>
                        setExportOptions((prev) => ({ ...prev, includeExecutiveSummary: e.target.checked }))
                      }
                      className="rounded border-slate-700 text-blue-600 focus:ring-blue-500 bg-slate-900"
                    />
                    <span>Executive Summary</span>
                  </label>
                  <label className="flex items-center gap-2 bg-slate-950 p-2.5 rounded-lg border border-slate-800/80 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={exportOptions.includeActionItems}
                      onChange={(e) =>
                        setExportOptions((prev) => ({ ...prev, includeActionItems: e.target.checked }))
                      }
                      className="rounded border-slate-700 text-blue-600 focus:ring-blue-500 bg-slate-900"
                    />
                    <span>Action Items ({summary.actionItems.length})</span>
                  </label>
                  <label className="flex items-center gap-2 bg-slate-950 p-2.5 rounded-lg border border-slate-800/80 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={exportOptions.includeDecisions}
                      onChange={(e) =>
                        setExportOptions((prev) => ({ ...prev, includeDecisions: e.target.checked }))
                      }
                      className="rounded border-slate-700 text-blue-600 focus:ring-blue-500 bg-slate-900"
                    />
                    <span>Key Decisions ({summary.keyDecisions.length})</span>
                  </label>
                  <label className="flex items-center gap-2 bg-slate-950 p-2.5 rounded-lg border border-slate-800/80 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={exportOptions.includeGlossary}
                      onChange={(e) =>
                        setExportOptions((prev) => ({ ...prev, includeGlossary: e.target.checked }))
                      }
                      className="rounded border-slate-700 text-blue-600 focus:ring-blue-500 bg-slate-900"
                    />
                    <span>Bilingual Glossary</span>
                  </label>
                </div>
              </div>

              {/* Primary Export Actions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {/* PDF */}
                <button
                  onClick={() => {
                    handleExportPDF(exportOptions);
                    setShowExportModal(false);
                  }}
                  className="p-3 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/40 text-left transition-colors flex items-start gap-3"
                >
                  <div className="w-8 h-8 rounded-lg bg-rose-600/30 text-rose-300 flex items-center justify-center shrink-0">
                    <Printer className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-100 block">Export as PDF (.pdf)</span>
                    <span className="text-[11px] text-slate-400 block mt-0.5">
                      Print-optimized document with clean styling and Khmer fonts.
                    </span>
                  </div>
                </button>

                {/* Markdown File */}
                <button
                  onClick={() => {
                    handleDownloadMarkdown(exportOptions);
                    setShowExportModal(false);
                  }}
                  className="p-3 rounded-xl bg-sky-600/20 hover:bg-sky-600/30 border border-sky-500/40 text-left transition-colors flex items-start gap-3"
                >
                  <div className="w-8 h-8 rounded-lg bg-sky-600/30 text-sky-300 flex items-center justify-center shrink-0">
                    <Download className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-100 block">Download Markdown (.md)</span>
                    <span className="text-[11px] text-slate-400 block mt-0.5">
                      Structured Markdown file ready for GitHub, Notion, or Docs.
                    </span>
                  </div>
                </button>
              </div>

              {/* Secondary Quick Share Actions */}
              <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-slate-800">
                <button
                  onClick={() => handleCopyMarkdown(exportOptions)}
                  className="flex-1 py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
                >
                  {copiedType === 'md' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedType === 'md' ? 'Copied Markdown' : 'Copy Markdown'}</span>
                </button>

                <button
                  onClick={() => handleCopyEmailDigest(exportOptions)}
                  className="flex-1 py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
                >
                  {copiedType === 'email' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Mail className="w-3.5 h-3.5 text-blue-400" />}
                  <span>{copiedType === 'email' ? 'Copied Email Digest' : 'Copy Email Digest'}</span>
                </button>

                <button
                  onClick={handleDownloadJSON}
                  className="py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
                  title="Download JSON data"
                >
                  <FileCode className="w-3.5 h-3.5 text-amber-400" />
                  <span>JSON</span>
                </button>
              </div>
            </div>

            <div className="px-6 py-3 border-t border-slate-800 bg-slate-900/60 flex justify-end">
              <button
                onClick={() => setShowExportModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
