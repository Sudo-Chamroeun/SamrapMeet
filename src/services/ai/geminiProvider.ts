import { GoogleGenAI, Type, Schema } from '@google/genai';
import {
  TranscriptSegment,
  MeetingMetadata,
  MeetingSummary,
  AIProviderConfig,
} from '../../types/index.ts';
import { summarizeWithRuleEngine } from './ruleEngine.ts';

const summarySchema: Schema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING },
    executiveSummaryEn: { type: Type.STRING },
    executiveSummaryKm: { type: Type.STRING },
    discussionTopics: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          topicEn: { type: Type.STRING },
          topicKm: { type: Type.STRING },
          pointsEn: { type: Type.ARRAY, items: { type: Type.STRING } },
          pointsKm: { type: Type.ARRAY, items: { type: Type.STRING } },
        },
        required: ['id', 'topicEn', 'topicKm', 'pointsEn', 'pointsKm'],
      },
    },
    actionItems: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          taskEn: { type: Type.STRING },
          taskKm: { type: Type.STRING },
          assignee: { type: Type.STRING },
          dueDate: { type: Type.STRING },
          priority: { type: Type.STRING, enum: ['high', 'medium', 'low'] },
        },
        required: ['id', 'taskEn', 'taskKm', 'priority'],
      },
    },
    keyDecisions: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          decisionEn: { type: Type.STRING },
          decisionKm: { type: Type.STRING },
          context: { type: Type.STRING },
        },
        required: ['id', 'decisionEn', 'decisionKm'],
      },
    },
    glossary: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          termEn: { type: Type.STRING },
          termKm: { type: Type.STRING },
          definition: { type: Type.STRING },
        },
        required: ['termEn', 'termKm', 'definition'],
      },
    },
  },
  required: [
    'title',
    'executiveSummaryEn',
    'executiveSummaryKm',
    'discussionTopics',
    'actionItems',
    'keyDecisions',
    'glossary',
  ],
};

export async function summarizeWithGemini(
  segments: TranscriptSegment[],
  metadata: MeetingMetadata,
  config: AIProviderConfig
): Promise<MeetingSummary> {
  const apiKey = config.apiKey || (typeof process !== 'undefined' && process.env?.GEMINI_API_KEY) || '';

  if (!apiKey) {
    console.warn('No Gemini API key available. Gracefully falling back to Rule-based NLP Engine.');
    const fallback = summarizeWithRuleEngine(segments, metadata, config);
    fallback.generatedWith = 'Built-in Bilingual Engine (Fallback: No Gemini Key)';
    return fallback;
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const transcriptText = segments
      .map((s) => `[${s.timestamp}] ${s.speaker}: ${s.text}`)
      .join('\n');

    const prompt = `You are SamrapMeet (សង្ខេប Meet), an elite bilingual executive secretary specializing in English and Khmer (ភាសាខ្មែរ) Google Meet transcriptions.
Analyze the following meeting transcript and produce a structured, high-accuracy bilingual meeting summary.

Guidelines:
1. Executive Summary: Provide an executive brief in both English and natural, polite Cambodian Khmer (ភាសាខ្មែរផ្លូវការ).
2. Key Discussion Topics: Group into 2-4 core agenda topics. Each topic must contain points in both English and Khmer.
3. Action Items: Extract every commitment, deliverable, or task with assignee and due date (if mentioned), priority (high/medium/low), with descriptions in both English and Khmer.
4. Key Decisions: Extract every agreed policy, vote, or resolution in both English and Khmer.
5. Glossary: Provide 3-5 technical or business terms used in the transcript with their Khmer and English equivalents and definitions.

Meeting Title: ${metadata.title}
Date: ${metadata.date}
Participants: ${metadata.participants.join(', ')}

TRANSCRIPT:
${transcriptText}`;

    const modelName = config.modelName || 'gemini-2.5-flash';

    const response = await ai.models.generateContent({
      model: modelName,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: summarySchema,
      },
    });

    const parsed = JSON.parse(response.text || '{}');

    const actionItems = (parsed.actionItems || []).map((item: any, idx: number) => ({
      id: item.id || `act-${idx + 1}`,
      taskEn: item.taskEn,
      taskKm: item.taskKm,
      assignee: item.assignee || 'Unassigned',
      dueDate: item.dueDate,
      priority: item.priority || 'medium',
      completed: false,
    }));

    const keyDecisions = (parsed.keyDecisions || []).map((dec: any, idx: number) => ({
      id: dec.id || `dec-${idx + 1}`,
      decisionEn: dec.decisionEn,
      decisionKm: dec.decisionKm,
      context: dec.context || '',
    }));

    const discussionTopics = (parsed.discussionTopics || []).map((t: any, idx: number) => ({
      id: t.id || `topic-${idx + 1}`,
      topicEn: t.topicEn,
      topicKm: t.topicKm,
      pointsEn: t.pointsEn || [],
      pointsKm: t.pointsKm || [],
    }));

    const glossary = (parsed.glossary || []).map((g: any) => ({
      termEn: g.termEn,
      termKm: g.termKm,
      definition: g.definition,
    }));

    const wordCount = transcriptText.split(/\s+/).filter(Boolean).length;

    return {
      id: `sum-${Date.now()}`,
      meetingId: metadata.id,
      title: parsed.title || metadata.title,
      date: metadata.date,
      executiveSummaryEn: parsed.executiveSummaryEn,
      executiveSummaryKm: parsed.executiveSummaryKm,
      discussionTopics,
      actionItems,
      keyDecisions,
      glossary,
      languageMode: config.languageOutput,
      generatedWith: `Gemini (${modelName})`,
      timestamp: new Date().toLocaleTimeString(),
      stats: {
        totalWords: wordCount,
        khmerRatio: 50,
        speakerCount: metadata.participants.length,
        segmentCount: segments.length,
      },
    };
  } catch (err) {
    console.error('Gemini API call failed, falling back to rule engine:', err);
    const fallback = summarizeWithRuleEngine(segments, metadata, config);
    fallback.generatedWith = 'Built-in Bilingual Engine (Fallback after API error)';
    return fallback;
  }
}
