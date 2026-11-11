import React from 'react';
import {
  BarChart3,
  PieChart,
  Users,
  Activity,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  MessageSquare,
  Globe2,
  Clock,
  Award,
  Zap,
} from 'lucide-react';
import {
  TranscriptSegment,
  MeetingSummary,
  MeetingMetadata,
  MeetingAnalytics,
} from '../types/index.ts';
import { analyzeMeeting } from '../services/ai/analyticsEngine.ts';

interface MeetingAnalyticsViewProps {
  transcript: TranscriptSegment[];
  summary: MeetingSummary | null;
  metadata: MeetingMetadata;
}

export const MeetingAnalyticsView: React.FC<MeetingAnalyticsViewProps> = ({
  transcript,
  summary,
  metadata,
}) => {
  const analytics: MeetingAnalytics = analyzeMeeting(transcript, summary, metadata);

  if (transcript.length === 0) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-400">
        <BarChart3 className="w-12 h-12 mx-auto text-blue-400/50 mb-3" />
        <h3 className="text-base font-bold text-slate-200">No Meeting Analytics Available</h3>
        <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
          Capture or paste transcript dialogue in the Simulator or Transcript Studio to unlock deep meeting intelligence and bilingual dynamics.
        </p>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Excellent':
        return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
      case 'Good':
        return 'text-blue-400 bg-blue-500/10 border-blue-500/30';
      case 'Moderate':
        return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
      default:
        return 'text-rose-400 bg-rose-500/10 border-rose-500/30';
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-semibold border border-indigo-500/30">
              Meeting Intelligence & Dynamics
            </span>
            <span className="text-xs text-slate-400 font-khmer">ការវិភាគកិច្ចប្រជុំ</span>
          </div>
          <h2 className="text-xl font-bold text-slate-100">{metadata.title}</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Analyzed {analytics.totalTurns} speaking turns across {analytics.speakerAnalytics.length} active participants
          </p>
        </div>

        {/* Health Score Pill */}
        <div className="flex items-center gap-3 bg-slate-950 p-3 rounded-xl border border-slate-800">
          <div className="text-right">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Health Score</span>
            <span className={`text-xs px-2 py-0.5 rounded-full border font-bold ${getStatusColor(analytics.healthStatus)}`}>
              {analytics.healthStatus}
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white font-extrabold text-lg shadow-md shadow-blue-500/20">
            {analytics.healthScore}
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Participation Equality */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400">Talk Equality</span>
            <Users className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-xl font-extrabold text-slate-100">
            {analytics.participationBalanceScore}%
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Most active: <strong className="text-slate-200">{analytics.mostActiveSpeaker}</strong>
          </p>
        </div>

        {/* Khmer vs English Mix */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400">Khmer Script Ratio</span>
            <Globe2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl font-extrabold text-slate-100">
            {analytics.khmerScriptRatio}%
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            English: <strong className="text-slate-200">{100 - analytics.khmerScriptRatio}%</strong>
          </p>
        </div>

        {/* Code-Switching Dialogue */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400">Code-Switching</span>
            <Zap className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-xl font-extrabold text-slate-100">
            {analytics.codeSwitchingRatio}%
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {analytics.codeSwitchingSegmentsCount} mixed-language turns
          </p>
        </div>

        {/* Meeting Sentiment Tone */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400">Meeting Tone</span>
            <Award className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-base font-bold text-slate-100 truncate">
            {analytics.sentimentTone}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {analytics.decisionsCount} decisions &bull; {analytics.actionsCount} tasks
          </p>
        </div>
      </div>

      {/* Speaker Participation Breakdown (Talk Time) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100">Speaker Participation & Talk Time</h3>
              <p className="text-xs text-slate-400 font-khmer">ការចូលរួមពិភាក្សាតាមវាគ្មិននីមួយៗ</p>
            </div>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            {analytics.totalWords} total words
          </span>
        </div>

        <div className="space-y-4">
          {analytics.speakerAnalytics.map((spk, idx) => (
            <div
              key={spk.speaker}
              className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 hover:border-slate-700 transition-colors"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2.5">
                  <span className="w-7 h-7 rounded-full bg-blue-600/30 text-blue-300 font-bold text-xs flex items-center justify-center border border-blue-500/40">
                    {spk.speaker.slice(0, 2).toUpperCase()}
                  </span>
                  <div>
                    <span className="text-sm font-bold text-slate-200">{spk.speaker}</span>
                    <span className="text-[10px] text-slate-400 ml-2 font-mono">
                      {spk.turnsCount} turns ({spk.wordCount} words)
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                      spk.primaryLanguage === 'km'
                        ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/60'
                        : spk.primaryLanguage === 'mixed'
                        ? 'bg-purple-950/80 text-purple-300 border border-purple-800/60'
                        : 'bg-blue-950/80 text-blue-300 border border-blue-800/60'
                    }`}
                  >
                    {spk.primaryLanguage === 'km'
                      ? '🇰🇭 Khmer Speaker'
                      : spk.primaryLanguage === 'mixed'
                      ? '🌐 Bilingual Speaker'
                      : '🇺🇸 English Speaker'}
                  </span>
                  <span className="text-xs font-bold text-slate-100 font-mono w-12 text-right">
                    {spk.percentageTalkTime}%
                  </span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-slate-900 rounded-full h-2.5 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    idx === 0
                      ? 'bg-blue-500'
                      : idx === 1
                      ? 'bg-emerald-500'
                      : idx === 2
                      ? 'bg-indigo-500'
                      : 'bg-purple-500'
                  }`}
                  style={{ width: `${Math.max(5, spk.percentageTalkTime)}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2">
                <span>Avg. {spk.avgWordsPerTurn} words per turn</span>
                <span>
                  Khmer words: {spk.khmerWords} &bull; English words: {spk.latinWords}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Key Analytical Insights & Dynamics */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center gap-2 border-b border-slate-800/80 pb-3 mb-4">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-100">Meeting Dynamics & Key Insights</h3>
            <p className="text-xs text-slate-400 font-khmer">ការវាយតម្លៃលំហូរ និងប្រសិទ្ធភាពកិច្ចប្រជុំ</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {analytics.keyInsights.map((insight, idx) => (
            <div
              key={idx}
              className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex items-start gap-2.5"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <p className="text-xs text-slate-200 leading-relaxed">{insight}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
