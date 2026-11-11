import React, { useState } from 'react';
import {
  Upload,
  Download,
  Trash2,
  Plus,
  RefreshCw,
  FileText,
  Users,
  Percent,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { TranscriptSegment, MeetingMetadata } from '../types/index.ts';
import { SAMPLE_MEETINGS } from '../data/sampleMeetings.ts';
import { detectLanguage } from '../services/ai/khmerUtils.ts';

interface TranscriptStudioProps {
  metadata: MeetingMetadata;
  transcript: TranscriptSegment[];
  onSelectSampleMeeting: (sampleId: string) => void;
  onAddSegment: (segment: TranscriptSegment) => void;
  onClearTranscript: () => void;
  onUpdateMetadata: (meta: Partial<MeetingMetadata>) => void;
  onGenerateSummary: () => void;
  isSummarizing: boolean;
}

export const TranscriptStudio: React.FC<TranscriptStudioProps> = ({
  metadata,
  transcript,
  onSelectSampleMeeting,
  onAddSegment,
  onClearTranscript,
  onUpdateMetadata,
  onGenerateSummary,
  isSummarizing,
}) => {
  const [newSpeaker, setNewSpeaker] = useState('Chomroaen Soknara');
  const [newText, setNewText] = useState('');
  const [showPasteModal, setShowPasteModal] = useState(false);
  const [rawPastedText, setRawPastedText] = useState('');

  // Statistics calculation
  const totalWords = transcript
    .map((s) => s.text)
    .join(' ')
    .split(/\s+/)
    .filter(Boolean).length;

  const fullText = transcript.map((s) => s.text).join(' ');
  const langMetrics = detectLanguage(fullText);
  const khmerRatio = Math.round(langMetrics.khmerRatio * 100);
  const uniqueSpeakers = Array.from(new Set(transcript.map((s) => s.speaker)));

  const handleManualAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newText.trim()) return;

    const detected = detectLanguage(newText);
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    onAddSegment({
      id: `seg-${Date.now()}`,
      speaker: newSpeaker.trim() || 'Speaker',
      text: newText.trim(),
      timestamp: now,
      language: detected.language,
    });

    setNewText('');
  };

  const handleParsePasted = () => {
    if (!rawPastedText.trim()) return;

    const lines = rawPastedText.split('\n').filter((l) => l.trim().length > 0);
    const parsedSegments: TranscriptSegment[] = [];

    lines.forEach((line, index) => {
      // Check for Speaker: Text or [Time] Speaker: Text
      let speaker = 'Speaker';
      let text = line;
      let timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      const match = line.match(/^(?:\[(.*?)\]\s*)?([^:]+):\s*(.*)$/);
      if (match) {
        if (match[1]) timestamp = match[1];
        speaker = match[2].trim();
        text = match[3].trim();
      }

      const detected = detectLanguage(text);
      onAddSegment({
        id: `pasted-${Date.now()}-${index}`,
        speaker,
        text,
        timestamp,
        language: detected.language,
      });
    });

    setRawPastedText('');
    setShowPasteModal(false);
  };

  const handleDownloadTranscript = () => {
    const formatted = transcript
      .map((s) => `[${s.timestamp}] ${s.speaker}: ${s.text}`)
      .join('\n\n');
    const blob = new Blob([formatted], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${metadata.title.replace(/\s+/g, '_')}_transcript.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Top Controls & Sample Picker */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold text-blue-400 uppercase tracking-wider">
            Meeting Setup & Transcript
          </span>
          <h2 className="text-lg font-bold text-slate-100">{metadata.title}</h2>
          <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
            <span>Date: {metadata.date}</span>
            <span>•</span>
            <span>Organizer: {metadata.organizer || 'Senchomroaen Soknara'}</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Sample preset buttons */}
          <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-400 px-2 font-medium">Presets:</span>
            {SAMPLE_MEETINGS.map((sample) => (
              <button
                key={sample.id}
                onClick={() => onSelectSampleMeeting(sample.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                  metadata.id === sample.id
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                {sample.id === 'footprints-curriculum'
                  ? '🏫 Footprints School'
                  : sample.id === 'phnompenh-tech'
                  ? '💻 Tech KHQR'
                  : '🏥 Health NGO'}
              </button>
            ))}
          </div>

          <button
            onClick={() => setShowPasteModal(true)}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium flex items-center gap-1.5 transition-colors"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Paste / Import</span>
          </button>

          <button
            onClick={handleDownloadTranscript}
            disabled={transcript.length === 0}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium flex items-center gap-1.5 transition-colors disabled:opacity-40"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Text</span>
          </button>

          <button
            onClick={onClearTranscript}
            className="px-3 py-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/40 text-rose-300 border border-rose-800/40 text-xs font-medium flex items-center gap-1.5 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear</span>
          </button>

          <button
            onClick={onGenerateSummary}
            disabled={isSummarizing || transcript.length === 0}
            className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-semibold shadow-md shadow-blue-500/20 hover:from-blue-500 hover:to-indigo-500 transition-all flex items-center gap-1.5 disabled:opacity-50"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>{isSummarizing ? 'Generating...' : 'Generate Notes'}</span>
          </button>
        </div>
      </div>

      {/* Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center font-bold">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs text-slate-400">Total Words</span>
            <p className="text-base font-bold text-slate-100">{totalWords}</p>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold">
            <Percent className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs text-slate-400">Khmer Script Ratio</span>
            <p className="text-base font-bold text-slate-100">{khmerRatio}%</p>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center font-bold">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs text-slate-400">Speakers</span>
            <p className="text-base font-bold text-slate-100">{uniqueSpeakers.length}</p>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs text-slate-400">Logged Captions</span>
            <p className="text-base font-bold text-slate-100">{transcript.length}</p>
          </div>
        </div>
      </div>

      {/* Transcript Segments List */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-slate-200 text-sm">Meeting Captions Stream</h3>
            <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
              {transcript.length} entries
            </span>
          </div>
          <span className="text-xs text-slate-400">
            Detected: Bilingual English + ភាសាខ្មែរ
          </span>
        </div>

        {transcript.length === 0 ? (
          <div className="py-12 text-center text-slate-400">
            <FileText className="w-10 h-10 mx-auto text-slate-600 mb-2" />
            <p className="text-sm font-medium">No transcript segments recorded yet.</p>
            <p className="text-xs text-slate-500 mt-1">
              Pick a preset above, stream dialogue in the simulator, or type a speech entry below.
            </p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
            {transcript.map((seg, idx) => (
              <div
                key={seg.id || idx}
                className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-3.5 hover:border-slate-700 transition-colors"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-blue-600/30 border border-blue-500/40 text-blue-300 flex items-center justify-center text-[10px] font-bold">
                      {seg.speaker.slice(0, 2).toUpperCase()}
                    </span>
                    <span className="text-xs font-bold text-slate-200">{seg.speaker}</span>
                    <span className="text-[10px] text-slate-500 font-mono">{seg.timestamp}</span>
                  </div>

                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                      seg.language === 'km'
                        ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/60'
                        : seg.language === 'mixed'
                        ? 'bg-purple-950/60 text-purple-300 border border-purple-800/60'
                        : 'bg-blue-950/60 text-blue-300 border border-blue-800/60'
                    }`}
                  >
                    {seg.language === 'km'
                      ? '🇰🇭 ភាសាខ្មែរ'
                      : seg.language === 'mixed'
                      ? '🌐 Bilingual'
                      : '🇺🇸 English'}
                  </span>
                </div>

                <p className="text-sm text-slate-200 leading-relaxed font-khmer pl-8">
                  {seg.text}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Add Entry Bar */}
        <form onSubmit={handleManualAdd} className="mt-4 pt-4 border-t border-slate-800 flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={newSpeaker}
            onChange={(e) => setNewSpeaker(e.target.value)}
            placeholder="Speaker Name"
            className="sm:w-48 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="text"
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            placeholder="Enter transcription sentence in English or Khmer..."
            className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 font-khmer"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add</span>
          </button>
        </form>
      </div>

      {/* Paste / Import Modal */}
      {showPasteModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl p-6 shadow-2xl">
            <h3 className="text-base font-bold text-slate-100 mb-1">
              Import or Paste Google Meet Transcript
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Paste raw text with or without timestamps. Lines formatted as `Speaker: Text` will be automatically parsed.
            </p>

            <textarea
              value={rawPastedText}
              onChange={(e) => setRawPastedText(e.target.value)}
              placeholder="Chomroaen Soknara: Good morning team.&#10;Sreypov Lim: ជម្រាបសួរលោកនាយក ខ្ញុំបានរៀបចំឯកសាររួចរាល់ហើយ។&#10;David Miller: We agreed on the timeline."
              rows={8}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
            />

            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setShowPasteModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleParsePasted}
                disabled={!rawPastedText.trim()}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold disabled:opacity-50"
              >
                Import Segments
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
