/**
 * SamrapMeet - English & Khmer Google Meet Note Summarizer
 * Built with modular AI architecture & Google Workspace Meet integration.
 */

import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar.tsx';
import { MeetLiveSimulator } from './components/MeetLiveSimulator.tsx';
import { TranscriptStudio } from './components/TranscriptStudio.tsx';
import { SummaryViewer } from './components/SummaryViewer.tsx';
import { MeetingAnalyticsView } from './components/MeetingAnalyticsView.tsx';
import { AIProviderModal } from './components/AIProviderModal.tsx';
import { ExtensionModal } from './components/ExtensionModal.tsx';
import { GoogleMeetModal } from './components/GoogleMeetModal.tsx';
import { SAMPLE_MEETINGS } from './data/sampleMeetings.ts';
import {
  TranscriptSegment,
  MeetingMetadata,
  MeetingSummary,
  AIProviderConfig,
} from './types/index.ts';
import {
  loadSavedAIConfig,
  summarizeMeeting,
  DEFAULT_AI_CONFIG,
} from './services/ai/providerRegistry.ts';
import { summarizeWithRuleEngine } from './services/ai/ruleEngine.ts';

export default function App() {
  const initialMeeting = SAMPLE_MEETINGS[0];

  const [activeTab, setActiveTab] = useState<'simulator' | 'transcript' | 'summary' | 'analytics'>('simulator');
  const [metadata, setMetadata] = useState<MeetingMetadata>(initialMeeting.metadata);
  const [transcript, setTranscript] = useState<TranscriptSegment[]>(initialMeeting.segments);
  const [summary, setSummary] = useState<MeetingSummary | null>(() => {
    // Generate initial summary using zero-key engine so user immediately sees full experience
    return summarizeWithRuleEngine(initialMeeting.segments, initialMeeting.metadata);
  });
  const [aiConfig, setAiConfig] = useState<AIProviderConfig>(loadSavedAIConfig);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [statusNotification, setStatusNotification] = useState<string | null>(null);

  // Modals
  const [isAISettingsOpen, setIsAISettingsOpen] = useState(false);
  const [isExtensionModalOpen, setIsExtensionModalOpen] = useState(false);
  const [isMeetSpacesOpen, setIsMeetSpacesOpen] = useState(false);

  // Support ?autostart=1 query param (Ultra Mode testability requirement)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('autostart') === '1') {
      setActiveTab('simulator');
    }
  }, []);

  const showNotification = (msg: string) => {
    setStatusNotification(msg);
    setTimeout(() => setStatusNotification(null), 3000);
  };

  const handleSelectSampleMeeting = (sampleId: string) => {
    const found = SAMPLE_MEETINGS.find((s) => s.id === sampleId);
    if (found) {
      setMetadata(found.metadata);
      setTranscript(found.segments);
      // Auto-summarize with zero-key engine
      const newSum = summarizeWithRuleEngine(found.segments, found.metadata, aiConfig);
      setSummary(newSum);
      showNotification(`Loaded preset: ${found.metadata.title}`);
    }
  };

  const handleAddSegment = (segment: TranscriptSegment) => {
    setTranscript((prev) => [...prev, segment]);
  };

  const handleClearTranscript = () => {
    setTranscript([]);
    setSummary(null);
    showNotification('Transcript cleared');
  };

  const handleUpdateMetadata = (updated: Partial<MeetingMetadata>) => {
    setMetadata((prev) => ({ ...prev, ...updated }));
  };

  const handleGenerateSummary = async () => {
    if (transcript.length === 0) {
      showNotification('Please add or stream transcript captions first');
      return;
    }

    setIsSummarizing(true);
    try {
      const res = await summarizeMeeting(transcript, metadata, aiConfig);
      setSummary(res);
      setActiveTab('summary');
      showNotification(`Bilingual notes generated using ${res.generatedWith}`);
    } catch (err: any) {
      console.error(err);
      showNotification(err.message || 'Summarization failed');
    } finally {
      setIsSummarizing(false);
    }
  };

  const handleUpdateActionItem = (actionId: string, completed: boolean) => {
    if (!summary) return;
    setSummary({
      ...summary,
      actionItems: summary.actionItems.map((act) =>
        act.id === actionId ? { ...act, completed } : act
      ),
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-blue-600 selection:text-white">
      {/* Navigation Header */}
      <Navbar
        aiConfig={aiConfig}
        onOpenAISettings={() => setIsAISettingsOpen(true)}
        onOpenExtensionModal={() => setIsExtensionModalOpen(true)}
        onOpenMeetSpaces={() => setIsMeetSpacesOpen(true)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        hasSummary={!!summary}
      />

      {/* Notification Toast */}
      {statusNotification && (
        <div className="fixed bottom-6 right-6 z-50 bg-blue-600 text-white px-4 py-2.5 rounded-xl shadow-2xl text-xs font-semibold flex items-center gap-2 animate-bounce">
          <span>🇰🇭</span>
          <span>{statusNotification}</span>
        </div>
      )}

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Mobile Navigation Pills */}
        <div className="flex md:hidden items-center justify-center gap-2 mb-4 bg-slate-900 p-1.5 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveTab('simulator')}
            className={`flex-1 py-1.5 text-xs font-medium rounded-lg text-center ${
              activeTab === 'simulator' ? 'bg-blue-600 text-white' : 'text-slate-400'
            }`}
          >
            Meet Simulator
          </button>
          <button
            onClick={() => setActiveTab('transcript')}
            className={`flex-1 py-1.5 text-xs font-medium rounded-lg text-center ${
              activeTab === 'transcript' ? 'bg-blue-600 text-white' : 'text-slate-400'
            }`}
          >
            Transcript
          </button>
          <button
            onClick={() => setActiveTab('summary')}
            className={`flex-1 py-1.5 text-xs font-medium rounded-lg text-center ${
              activeTab === 'summary' ? 'bg-blue-600 text-white' : 'text-slate-400'
            }`}
          >
            Notes
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex-1 py-1.5 text-xs font-medium rounded-lg text-center ${
              activeTab === 'analytics' ? 'bg-blue-600 text-white' : 'text-slate-400'
            }`}
          >
            Analytics
          </button>
        </div>

        {/* View Routing */}
        {activeTab === 'simulator' && (
          <MeetLiveSimulator
            metadata={metadata}
            transcript={transcript}
            onAddSegment={handleAddSegment}
            onGenerateSummary={handleGenerateSummary}
            isSummarizing={isSummarizing}
          />
        )}

        {activeTab === 'transcript' && (
          <TranscriptStudio
            metadata={metadata}
            transcript={transcript}
            onSelectSampleMeeting={handleSelectSampleMeeting}
            onAddSegment={handleAddSegment}
            onClearTranscript={handleClearTranscript}
            onUpdateMetadata={handleUpdateMetadata}
            onGenerateSummary={handleGenerateSummary}
            isSummarizing={isSummarizing}
          />
        )}

        {activeTab === 'summary' && (
          <SummaryViewer
            summary={summary}
            onUpdateActionItem={handleUpdateActionItem}
            onReSummarize={handleGenerateSummary}
            isSummarizing={isSummarizing}
          />
        )}

        {activeTab === 'analytics' && (
          <MeetingAnalyticsView
            transcript={transcript}
            summary={summary}
            metadata={metadata}
          />
        )}
      </main>

      {/* Footer Credit */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-6 px-4 no-print">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center font-bold text-xs">
              🇰🇭
            </span>
            <span>
              <strong>SamrapMeet</strong> &bull; Created by{' '}
              <span className="text-slate-200 font-semibold">Footprints IT-Team</span>{' '}
              (Footprints International School)
            </span>
          </div>

          <div className="flex items-center gap-4 text-slate-400">
            <button
              onClick={() => setIsExtensionModalOpen(true)}
              className="hover:text-slate-200 transition-colors"
            >
              Chrome Extension (.zip)
            </button>
            <span>&bull;</span>
            <button
              onClick={() => setIsAISettingsOpen(true)}
              className="hover:text-slate-200 transition-colors"
            >
              AI Provider Hub
            </button>
            <span>&bull;</span>
            <span className="text-slate-500 font-khmer">ភាសាខ្មែរ & English</span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <AIProviderModal
        isOpen={isAISettingsOpen}
        onClose={() => setIsAISettingsOpen(false)}
        config={aiConfig}
        onSaveConfig={(cfg) => {
          setAiConfig(cfg);
          showNotification(`Active engine set to: ${cfg.modelName}`);
        }}
      />

      <ExtensionModal
        isOpen={isExtensionModalOpen}
        onClose={() => setIsExtensionModalOpen(false)}
      />

      <GoogleMeetModal
        isOpen={isMeetSpacesOpen}
        onClose={() => setIsMeetSpacesOpen(false)}
        metadata={metadata}
        onUpdateMetadata={handleUpdateMetadata}
      />
    </div>
  );
}
