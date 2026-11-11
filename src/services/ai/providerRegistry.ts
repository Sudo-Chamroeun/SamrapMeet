import {
  TranscriptSegment,
  MeetingMetadata,
  MeetingSummary,
  AIProviderConfig,
  AIProviderType,
} from '../../types/index.ts';
import { summarizeWithRuleEngine } from './ruleEngine.ts';
import { summarizeWithGemini } from './geminiProvider.ts';
import { summarizeWithCustomEndpoint } from './customProvider.ts';

export const DEFAULT_AI_CONFIG: AIProviderConfig = {
  providerId: 'rule-engine',
  modelName: 'Bilingual-NLP-v2',
  apiKey: '',
  baseUrl: '',
  languageOutput: 'dual',
  summaryFormat: 'detailed',
};

const STORAGE_KEY = 'samrapmeet_ai_config';

export function loadSavedAIConfig(): AIProviderConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return { ...DEFAULT_AI_CONFIG, ...JSON.parse(raw) };
    }
  } catch {
    // ignore
  }
  return DEFAULT_AI_CONFIG;
}

export function saveAIConfig(config: AIProviderConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch {
    // ignore
  }
}

/**
 * Universal summarization dispatcher supporting any AI provider or zero-key mode.
 */
export async function summarizeMeeting(
  segments: TranscriptSegment[],
  metadata: MeetingMetadata,
  config: AIProviderConfig
): Promise<MeetingSummary> {
  if (segments.length === 0) {
    throw new Error('Transcript is empty. Please capture or paste a transcript before summarizing.');
  }

  switch (config.providerId) {
    case 'gemini':
      return await summarizeWithGemini(segments, metadata, config);

    case 'openai':
    case 'claude':
    case 'custom':
      return await summarizeWithCustomEndpoint(segments, metadata, config);

    case 'rule-engine':
    default:
      return summarizeWithRuleEngine(segments, metadata, config);
  }
}

export const PROVIDER_OPTIONS: Array<{
  id: AIProviderType;
  name: string;
  badge: string;
  description: string;
  requiresKey: boolean;
  defaultModel: string;
  defaultBaseUrl?: string;
}> = [
  {
    id: 'rule-engine',
    name: 'Built-in Bilingual NLP Engine',
    badge: 'Zero API Key Required',
    description:
      'Fast, offline, and 100% free. Uses bilingual Cambodian & English grammatical trigger extraction, speaker diarization, and structured synthesis.',
    requiresKey: false,
    defaultModel: 'Khmer-English-Heuristic-v2',
  },
  {
    id: 'gemini',
    name: 'Google Gemini AI',
    badge: 'Recommended for Deep Synthesis',
    description:
      'High-fidelity bilingual reasoning with Gemini 2.5 Flash / 3.8 Flash. Rich nuance in formal Khmer and technical English.',
    requiresKey: true,
    defaultModel: 'gemini-2.5-flash',
  },
  {
    id: 'openai',
    name: 'OpenAI (GPT-4o / GPT-4o-mini)',
    badge: 'Cloud LLM',
    description: 'Connect your OpenAI API key for standard GPT chat completion models.',
    requiresKey: true,
    defaultModel: 'gpt-4o-mini',
    defaultBaseUrl: 'https://api.openai.com/v1/chat/completions',
  },
  {
    id: 'claude',
    name: 'Anthropic Claude (via proxy/compatible endpoint)',
    badge: 'Cloud LLM',
    description: 'Use Anthropic Claude via OpenAI-compatible gateway or router.',
    requiresKey: true,
    defaultModel: 'claude-3-5-sonnet-20241022',
  },
  {
    id: 'custom',
    name: 'Custom / Local Ollama / Groq / DeepSeek',
    badge: 'Self-Hosted / Open',
    description:
      'Point to your local Ollama server (e.g. http://localhost:11434/v1) or any custom REST AI API endpoint.',
    requiresKey: false,
    defaultModel: 'llama3:latest',
    defaultBaseUrl: 'http://localhost:11434/v1/chat/completions',
  },
];
