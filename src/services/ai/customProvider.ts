import {
  TranscriptSegment,
  MeetingMetadata,
  MeetingSummary,
  AIProviderConfig,
} from '../../types/index.ts';
import { summarizeWithRuleEngine } from './ruleEngine.ts';

/**
 * Handles custom OpenAI-compatible or REST endpoints (e.g. OpenAI, DeepSeek, Groq, Ollama)
 */
export async function summarizeWithCustomEndpoint(
  segments: TranscriptSegment[],
  metadata: MeetingMetadata,
  config: AIProviderConfig
): Promise<MeetingSummary> {
  if (!config.apiKey && !config.baseUrl?.includes('localhost')) {
    console.warn('No API key provided for custom provider. Falling back to Rule Engine.');
    const fallback = summarizeWithRuleEngine(segments, metadata, config);
    fallback.generatedWith = `Built-in Bilingual Engine (Fallback: ${config.providerId} has no API Key)`;
    return fallback;
  }

  const endpoint = config.baseUrl || 'https://api.openai.com/v1/chat/completions';
  const transcriptText = segments
    .map((s) => `[${s.timestamp}] ${s.speaker}: ${s.text}`)
    .join('\n');

  const systemPrompt = `You are a specialized bilingual executive meeting minutes assistant for English and Khmer (ភាសាខ្មែរ). Return ONLY valid JSON matching this structure:
{
  "title": "Meeting Title",
  "executiveSummaryEn": "English executive overview...",
  "executiveSummaryKm": "សេចក្តីសង្ខេបប្រតិបត្តិជាភាសាខ្មែរ...",
  "discussionTopics": [
    {
      "id": "t1",
      "topicEn": "Topic Name in English",
      "topicKm": "ប្រធានបទជាភាសាខ្មែរ",
      "pointsEn": ["point 1", "point 2"],
      "pointsKm": ["ចំណុចទី១", "ចំណុចទី២"]
    }
  ],
  "actionItems": [
    {
      "id": "a1",
      "taskEn": "Task description in English",
      "taskKm": "ភារកិច្ចជាភាសាខ្មែរ",
      "assignee": "Person Name",
      "dueDate": "Due date if mentioned",
      "priority": "high" | "medium" | "low"
    }
  ],
  "keyDecisions": [
    {
      "id": "d1",
      "decisionEn": "Decision in English",
      "decisionKm": "ការសម្រេចជាភាសាខ្មែរ",
      "context": "Context"
    }
  ],
  "glossary": [
    {
      "termEn": "English Term",
      "termKm": "ពាក្យខ្មែរ",
      "definition": "Definition"
    }
  ]
}`;

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.apiKey || ''}`,
        ...(config.customHeaders || {}),
      },
      body: JSON.stringify({
        model: config.modelName || 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content: `Meeting: ${metadata.title}\nDate: ${metadata.date}\nTranscript:\n${transcriptText}`,
          },
        ],
        temperature: 0.2,
        response_format: { type: 'json_object' },
      }),
    });

    if (!res.ok) {
      throw new Error(`Custom provider returned HTTP ${res.status}: ${res.statusText}`);
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content;
    const parsed = JSON.parse(content);

    return {
      id: `sum-${Date.now()}`,
      meetingId: metadata.id,
      title: parsed.title || metadata.title,
      date: metadata.date,
      executiveSummaryEn: parsed.executiveSummaryEn || '',
      executiveSummaryKm: parsed.executiveSummaryKm || '',
      discussionTopics: parsed.discussionTopics || [],
      actionItems: (parsed.actionItems || []).map((a: any, i: number) => ({
        ...a,
        id: a.id || `act-${i + 1}`,
        completed: false,
      })),
      keyDecisions: parsed.keyDecisions || [],
      glossary: parsed.glossary || [],
      languageMode: config.languageOutput,
      generatedWith: `${config.providerId.toUpperCase()} (${config.modelName})`,
      timestamp: new Date().toLocaleTimeString(),
      stats: {
        totalWords: transcriptText.split(/\s+/).filter(Boolean).length,
        khmerRatio: 50,
        speakerCount: metadata.participants.length,
        segmentCount: segments.length,
      },
    };
  } catch (err) {
    console.error('Custom provider failed, falling back to rule engine:', err);
    const fallback = summarizeWithRuleEngine(segments, metadata, config);
    fallback.generatedWith = `Built-in Bilingual Engine (Fallback from ${config.providerId})`;
    return fallback;
  }
}
