export interface TranscriptSegment {
  id: string;
  speaker: string;
  text: string;
  timestamp: string;
  language?: 'en' | 'km' | 'mixed';
  avatar?: string;
  confidence?: number;
}

export interface ActionItem {
  id: string;
  taskEn: string;
  taskKm: string;
  assignee?: string;
  dueDate?: string;
  priority: 'high' | 'medium' | 'low';
  completed: boolean;
}

export interface KeyDecision {
  id: string;
  decisionEn: string;
  decisionKm: string;
  context?: string;
}

export interface DiscussionTopic {
  id: string;
  topicEn: string;
  topicKm: string;
  pointsEn: string[];
  pointsKm: string[];
}

export interface GlossaryItem {
  termEn: string;
  termKm: string;
  definition: string;
}

export interface MeetingMetadata {
  id: string;
  title: string;
  meetCode?: string;
  meetUrl?: string;
  date: string;
  time?: string;
  duration?: string;
  participants: string[];
  department?: string;
  organizer?: string;
}

export interface MeetingSummary {
  id: string;
  meetingId: string;
  title: string;
  date: string;
  executiveSummaryEn: string;
  executiveSummaryKm: string;
  discussionTopics: DiscussionTopic[];
  actionItems: ActionItem[];
  keyDecisions: KeyDecision[];
  glossary: GlossaryItem[];
  languageMode: 'dual' | 'en' | 'km';
  generatedWith: string;
  timestamp: string;
  stats: {
    totalWords: number;
    khmerRatio: number;
    speakerCount: number;
    segmentCount: number;
  };
}

export type AIProviderType = 'rule-engine' | 'gemini' | 'openai' | 'claude' | 'custom';

export interface AIProviderConfig {
  providerId: AIProviderType;
  modelName: string;
  apiKey?: string;
  baseUrl?: string;
  customHeaders?: Record<string, string>;
  languageOutput: 'dual' | 'en' | 'km';
  summaryFormat: 'detailed' | 'bullet' | 'executive';
}

export interface MeetSpace {
  name: string;
  meetingUri: string;
  meetingCode: string;
  config?: {
    accessType?: string;
    entryPointAccess?: string;
  };
}

export interface SpeakerAnalytics {
  speaker: string;
  turnsCount: number;
  wordCount: number;
  percentageTalkTime: number;
  khmerWords: number;
  latinWords: number;
  primaryLanguage: 'en' | 'km' | 'mixed';
  avgWordsPerTurn: number;
}

export interface MeetingAnalytics {
  healthScore: number; // 0 - 100
  healthStatus: 'Excellent' | 'Good' | 'Moderate' | 'Needs Improvement';
  totalWords: number;
  totalTurns: number;
  durationMinutes: number;
  khmerScriptRatio: number;
  codeSwitchingSegmentsCount: number;
  codeSwitchingRatio: number;
  speakerAnalytics: SpeakerAnalytics[];
  mostActiveSpeaker: string;
  participationBalanceScore: number; // 0 - 100
  sentimentTone: 'Action-Oriented' | 'Collaborative' | 'Informative' | 'Deliberative';
  decisionsCount: number;
  actionsCount: number;
  actionCompletionRate: number;
  keyInsights: string[];
}

