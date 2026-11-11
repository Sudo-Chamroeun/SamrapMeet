import React, { useState, useEffect } from 'react';
import {
  Mic,
  MicOff,
  Video as VideoIcon,
  VideoOff,
  Captions,
  Hand,
  PhoneOff,
  Sparkles,
  Volume2,
  Radio,
  Play,
  Pause,
  PlusCircle,
  ExternalLink,
} from 'lucide-react';
import { TranscriptSegment, MeetingMetadata } from '../types/index.ts';
import { detectLanguage } from '../services/ai/khmerUtils.ts';

interface MeetLiveSimulatorProps {
  metadata: MeetingMetadata;
  transcript: TranscriptSegment[];
  onAddSegment: (segment: TranscriptSegment) => void;
  onGenerateSummary: () => void;
  isSummarizing: boolean;
}

const SIMULATED_STREAMS = [
  {
    speaker: 'Sreypov Lim',
    text: 'លោកគ្រូអ្នកគ្រូបានត្រៀម Quiz សាកល្បងសម្រាប់សិស្សសប្តាហ៍ក្រោយរួចរាល់ហើយ។',
    lang: 'km',
  },
  {
    speaker: 'David Miller',
    text: 'We should verify that the Cambridge vocabulary list is shared with parents before Wednesday.',
    lang: 'en',
  },
  {
    speaker: 'Chomroaen Soknara',
    text: 'We agree on this approach. Teacher Sreypov will supervise the Khmer exam grading rubric.',
    lang: 'en',
  },
  {
    speaker: 'Bopha Kem',
    text: 'អាណាព្យាបាលសិស្សសប្បាយចិត្តខ្លាំងណាស់ពេលដឹងថាកាតសិស្សនឹងមានទាំងពីរភាសា។',
    lang: 'km',
  },
  {
    speaker: 'Chomroaen Soknara',
    text: 'Action item: please finalize the academic calendar for 2027 by end of next week.',
    lang: 'en',
  },
];

export const MeetLiveSimulator: React.FC<MeetLiveSimulatorProps> = ({
  metadata,
  transcript,
  onAddSegment,
  onGenerateSummary,
  isSummarizing,
}) => {
  const [captionsActive, setCaptionsActive] = useState(true);
  const [isMicOn, setIsMicOn] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isStreamingSimulation, setIsStreamingSimulation] = useState(false);
  const [streamIndex, setStreamIndex] = useState(0);
  const [customInput, setCustomInput] = useState('');
  const [activeSpeaker, setActiveSpeaker] = useState<string>('Chomroaen Soknara');

  // Automatic speech streaming simulation
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isStreamingSimulation) {
      timer = setInterval(() => {
        const item = SIMULATED_STREAMS[streamIndex % SIMULATED_STREAMS.length];
        const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        setActiveSpeaker(item.speaker);
        onAddSegment({
          id: `sim-${Date.now()}`,
          speaker: item.speaker,
          text: item.text,
          timestamp: now,
          language: item.lang as any,
        });

        setStreamIndex((prev) => prev + 1);
      }, 3500);
    }
    return () => clearInterval(timer);
  }, [isStreamingSimulation, streamIndex, onAddSegment]);

  const handleSendCustomText = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customInput.trim()) return;

    const langInfo = detectLanguage(customInput);
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    onAddSegment({
      id: `manual-${Date.now()}`,
      speaker: 'You (Host)',
      text: customInput.trim(),
      timestamp: now,
      language: langInfo.language,
    });
    setCustomInput('');
  };

  const latestSegment = transcript[transcript.length - 1];

  // Participants in the simulated grid
  const participants = [
    {
      name: 'Chomroaen Soknara',
      role: 'Host / Academic Chair',
      bg: 'from-blue-900/60 to-slate-900',
      initials: 'CS',
      speaking: activeSpeaker === 'Chomroaen Soknara',
    },
    {
      name: 'Sreypov Lim',
      role: 'Khmer Curriculum Lead',
      bg: 'from-emerald-900/60 to-slate-900',
      initials: 'SL',
      speaking: activeSpeaker === 'Sreypov Lim',
    },
    {
      name: 'David Miller',
      role: 'Cambridge ESL Lead',
      bg: 'from-amber-900/60 to-slate-900',
      initials: 'DM',
      speaking: activeSpeaker === 'David Miller',
    },
    {
      name: 'Bopha Kem',
      role: 'Parent Coordinator',
      bg: 'from-purple-900/60 to-slate-900',
      initials: 'BK',
      speaking: activeSpeaker === 'Bopha Kem',
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Top Meet Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 p-4 rounded-2xl border border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
            <h2 className="text-base font-semibold text-slate-100">{metadata.title}</h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Google Meet Code: <span className="font-mono text-sky-400">{metadata.meetCode || 'fps-cur-2026'}</span> • {metadata.duration || 'Live Session'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsStreamingSimulation(!isStreamingSimulation)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
              isStreamingSimulation
                ? 'bg-amber-600/30 text-amber-300 border border-amber-500/40 hover:bg-amber-600/40'
                : 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-600/40'
            }`}
          >
            {isStreamingSimulation ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{isStreamingSimulation ? 'Pause Bilingual Dialogue' : 'Stream Live Dialogue'}</span>
          </button>

          <button
            onClick={onGenerateSummary}
            disabled={isSummarizing || transcript.length === 0}
            className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20 hover:from-blue-500 hover:to-indigo-500 transition-all flex items-center gap-2 disabled:opacity-50"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>{isSummarizing ? 'Synthesizing Notes...' : 'Summarize Notes Now'}</span>
          </button>
        </div>
      </div>

      {/* Google Meet Screen Layout */}
      <div className="relative bg-slate-950 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden min-h-[500px] flex flex-col justify-between">
        {/* Video Tiles Grid */}
        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1">
          {participants.map((p) => (
            <div
              key={p.name}
              className={`relative rounded-xl border bg-gradient-to-br ${p.bg} flex flex-col items-center justify-center min-h-[170px] transition-all ${
                p.speaking
                  ? 'border-blue-400 ring-2 ring-blue-500/40 shadow-lg shadow-blue-500/20'
                  : 'border-slate-800'
              }`}
            >
              {/* Speaker Avatar Icon */}
              <div
                className={`w-16 h-16 rounded-full flex items-center justify-center font-bold text-xl shadow-inner ${
                  p.speaking
                    ? 'bg-blue-600 text-white scale-105 transition-transform'
                    : 'bg-slate-800 text-slate-300'
                }`}
              >
                {p.initials}
              </div>

              {/* Speaker Name Tag */}
              <div className="absolute bottom-3 left-3 bg-slate-900/80 backdrop-blur-md px-2.5 py-1 rounded-md border border-slate-700/80 flex items-center gap-2">
                {p.speaking && <Volume2 className="w-3.5 h-3.5 text-blue-400 animate-pulse" />}
                <span className="text-xs font-medium text-slate-200">{p.name}</span>
                <span className="text-[10px] text-slate-400 hidden lg:inline">({p.role})</span>
              </div>
            </div>
          ))}
        </div>

        {/* Live Captions Overlay Banner (Inside Google Meet) */}
        {captionsActive && latestSegment && (
          <div className="mx-4 mb-3 p-3 bg-slate-900/95 backdrop-blur-md border border-blue-500/40 rounded-xl shadow-xl flex items-start gap-3">
            <div className="w-2 h-2 rounded-full bg-blue-400 mt-1.5 animate-pulse shrink-0" />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-sky-400">{latestSegment.speaker}</span>
                <span className="text-[10px] text-slate-400 font-mono">{latestSegment.timestamp}</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 font-medium">
                  {latestSegment.language === 'km' ? '🇰🇭 Khmer' : latestSegment.language === 'mixed' ? '🌐 Bilingual' : '🇺🇸 English'}
                </span>
              </div>
              <p className="text-sm text-slate-100 font-medium mt-0.5 font-khmer">
                {latestSegment.text}
              </p>
            </div>
          </div>
        )}

        {/* Floating Extension Companion HUD Widget */}
        <div className="absolute top-4 right-4 z-20 w-72 bg-slate-900/95 backdrop-blur-lg border border-indigo-500/40 rounded-xl p-3 shadow-2xl text-slate-100">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
            <div className="flex items-center gap-1.5">
              <span className="text-sm">🇰🇭</span>
              <span className="text-xs font-bold text-indigo-400">SamrapMeet Extension</span>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              Capturing
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-center text-xs mb-2">
            <div className="bg-slate-800/80 p-1.5 rounded-lg border border-slate-700/50">
              <span className="block font-bold text-sky-400 text-sm">{transcript.length}</span>
              <span className="text-[10px] text-slate-400">Captions</span>
            </div>
            <div className="bg-slate-800/80 p-1.5 rounded-lg border border-slate-700/50">
              <span className="block font-bold text-indigo-400 text-sm">
                {Math.round(
                  (transcript.filter((s) => s.language === 'km' || s.language === 'mixed').length /
                    Math.max(1, transcript.length)) *
                    100
                )}%
              </span>
              <span className="text-[10px] text-slate-400">Khmer Text</span>
            </div>
          </div>

          <button
            onClick={onGenerateSummary}
            className="w-full py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white transition-colors flex items-center justify-center gap-1.5"
          >
            <Sparkles className="w-3 h-3 text-amber-300" />
            <span>Generate Bilingual Notes</span>
          </button>
        </div>

        {/* Google Meet Bottom Controls Bar */}
        <div className="bg-slate-900/95 border-t border-slate-800 px-6 py-3 flex items-center justify-between">
          <div className="text-xs text-slate-400 font-mono hidden sm:block">
            {metadata.time || '10:00 AM'} | {metadata.meetCode || 'fps-cur-2026'}
          </div>

          {/* Core Meet Control Icons */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMicOn(!isMicOn)}
              className={`p-2.5 rounded-full text-white transition-colors ${
                isMicOn ? 'bg-slate-700 hover:bg-slate-600' : 'bg-rose-600 hover:bg-rose-500'
              }`}
              title={isMicOn ? 'Mute Mic' : 'Unmute Mic'}
            >
              {isMicOn ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
            </button>

            <button
              onClick={() => setIsCameraOn(!isCameraOn)}
              className={`p-2.5 rounded-full text-white transition-colors ${
                isCameraOn ? 'bg-slate-700 hover:bg-slate-600' : 'bg-rose-600 hover:bg-rose-500'
              }`}
              title={isCameraOn ? 'Turn camera off' : 'Turn camera on'}
            >
              {isCameraOn ? <VideoIcon className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
            </button>

            <button
              onClick={() => setCaptionsActive(!captionsActive)}
              className={`p-2.5 rounded-full transition-colors ${
                captionsActive
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
              title="Toggle Live Captions (CC)"
            >
              <Captions className="w-4 h-4" />
            </button>

            <button
              className="p-2.5 rounded-full bg-slate-700 text-slate-300 hover:bg-slate-600 transition-colors hidden sm:block"
              title="Raise hand"
            >
              <Hand className="w-4 h-4" />
            </button>

            <button
              className="px-4 py-2 rounded-full bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
              title="Leave Call"
            >
              <PhoneOff className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Leave</span>
            </button>
          </div>

          <div className="text-xs text-slate-400 font-mono">
            {transcript.length} lines logged
          </div>
        </div>
      </div>

      {/* Manual Bilingual Dialogue Input */}
      <form onSubmit={handleSendCustomText} className="flex gap-2">
        <input
          type="text"
          value={customInput}
          onChange={(e) => setCustomInput(e.target.value)}
          placeholder="Type live meeting speech in English or Khmer (e.g. ខ្ញុំយល់ស្រប ឬ We need to follow up)..."
          className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 font-khmer"
        />
        <button
          type="submit"
          className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-colors flex items-center gap-1.5"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Add Speech</span>
        </button>
      </form>
    </div>
  );
};
