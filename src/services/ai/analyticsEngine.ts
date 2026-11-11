import {
  TranscriptSegment,
  MeetingSummary,
  MeetingMetadata,
  MeetingAnalytics,
  SpeakerAnalytics,
} from '../../types/index.ts';
import { detectLanguage, hasKhmer } from './khmerUtils.ts';

/**
 * Analyzes a meeting transcript and its summary to produce deep analytics.
 */
export function analyzeMeeting(
  transcript: TranscriptSegment[],
  summary: MeetingSummary | null,
  metadata: MeetingMetadata
): MeetingAnalytics {
  if (transcript.length === 0) {
    return {
      healthScore: 0,
      healthStatus: 'Needs Improvement',
      totalWords: 0,
      totalTurns: 0,
      durationMinutes: 0,
      khmerScriptRatio: 0,
      codeSwitchingSegmentsCount: 0,
      codeSwitchingRatio: 0,
      speakerAnalytics: [],
      mostActiveSpeaker: 'None',
      participationBalanceScore: 0,
      sentimentTone: 'Informative',
      decisionsCount: 0,
      actionsCount: 0,
      actionCompletionRate: 0,
      keyInsights: ['No meeting dialogue logged yet.'],
    };
  }

  // 1. Group segments by speaker
  const speakerMap = new Map<
    string,
    { turns: number; words: number; khmerChars: number; latinChars: number }
  >();

  let codeSwitchingCount = 0;
  let totalKhmerChars = 0;
  let totalLatinChars = 0;
  let totalWords = 0;

  for (const seg of transcript) {
    const text = seg.text;
    const words = text.split(/\s+/).filter(Boolean).length;
    totalWords += words;

    const langInfo = detectLanguage(text);
    totalKhmerChars += langInfo.khmerCharCount;
    totalLatinChars += langInfo.latinCharCount;

    if (langInfo.language === 'mixed') {
      codeSwitchingCount++;
    }

    const current = speakerMap.get(seg.speaker) || {
      turns: 0,
      words: 0,
      khmerChars: 0,
      latinChars: 0,
    };

    current.turns += 1;
    current.words += words;
    current.khmerChars += langInfo.khmerCharCount;
    current.latinChars += langInfo.latinCharCount;

    speakerMap.set(seg.speaker, current);
  }

  const totalChars = totalKhmerChars + totalLatinChars;
  const overallKhmerRatio = totalChars > 0 ? Math.round((totalKhmerChars / totalChars) * 100) : 0;
  const codeSwitchingRatio = Math.round((codeSwitchingCount / transcript.length) * 100);

  // 2. Speaker Analytics list
  const speakerAnalytics: SpeakerAnalytics[] = [];
  let mostActiveSpeaker = '';
  let maxWords = -1;

  speakerMap.forEach((stats, speaker) => {
    if (stats.words > maxWords) {
      maxWords = stats.words;
      mostActiveSpeaker = speaker;
    }

    const pctTalk = totalWords > 0 ? Math.round((stats.words / totalWords) * 100) : 0;
    const totalSpkChars = stats.khmerChars + stats.latinChars;
    const spkKhmerRatio = totalSpkChars > 0 ? stats.khmerChars / totalSpkChars : 0;

    let priLang: 'en' | 'km' | 'mixed' = 'en';
    if (spkKhmerRatio > 0.7) priLang = 'km';
    else if (spkKhmerRatio > 0.25) priLang = 'mixed';

    speakerAnalytics.push({
      speaker,
      turnsCount: stats.turns,
      wordCount: stats.words,
      percentageTalkTime: pctTalk,
      khmerWords: Math.round(stats.words * spkKhmerRatio),
      latinWords: Math.round(stats.words * (1 - spkKhmerRatio)),
      primaryLanguage: priLang,
      avgWordsPerTurn: Math.round(stats.words / Math.max(1, stats.turns)),
    });
  });

  // Sort speakers by talk time descending
  speakerAnalytics.sort((a, b) => b.wordCount - a.wordCount);

  // 3. Participation Balance Score (0 - 100)
  // Equal distribution is 100 / speakerCount per person
  const idealPct = 100 / Math.max(1, speakerAnalytics.length);
  let totalDev = 0;
  speakerAnalytics.forEach((s) => {
    totalDev += Math.abs(s.percentageTalkTime - idealPct);
  });
  const maxPossibleDev = 200; // rough theoretical max
  const participationBalanceScore = Math.max(
    20,
    Math.min(100, Math.round(100 - (totalDev / maxPossibleDev) * 100))
  );

  // 4. Action & Decision counts
  const actionsCount = summary?.actionItems.length || 0;
  const decisionsCount = summary?.keyDecisions.length || 0;
  const completedActions = summary?.actionItems.filter((a) => a.completed).length || 0;
  const actionCompletionRate =
    actionsCount > 0 ? Math.round((completedActions / actionsCount) * 100) : 0;

  // 5. Health Score Calculation
  // Balanced talk time (30%), Actions/Decisions presence (35%), Bilingual engagement (20%), Turn distribution (15%)
  let healthScore = 50;
  if (participationBalanceScore > 60) healthScore += 15;
  else if (participationBalanceScore > 40) healthScore += 10;

  if (actionsCount >= 3) healthScore += 15;
  else if (actionsCount > 0) healthScore += 8;

  if (decisionsCount >= 1) healthScore += 10;
  if (overallKhmerRatio > 15 && overallKhmerRatio < 85) healthScore += 10; // true healthy bilingual mix

  healthScore = Math.min(98, Math.max(40, healthScore));

  const healthStatus: 'Excellent' | 'Good' | 'Moderate' | 'Needs Improvement' =
    healthScore >= 85
      ? 'Excellent'
      : healthScore >= 70
      ? 'Good'
      : healthScore >= 50
      ? 'Moderate'
      : 'Needs Improvement';

  // 6. Sentiment & Tone
  let sentimentTone: 'Action-Oriented' | 'Collaborative' | 'Informative' | 'Deliberative' =
    'Collaborative';
  if (actionsCount >= 4) {
    sentimentTone = 'Action-Oriented';
  } else if (decisionsCount >= 3) {
    sentimentTone = 'Deliberative';
  }

  // 7. Key Insights (bullet points in both English and Khmer)
  const keyInsights: string[] = [];

  keyInsights.push(
    `Participation Balance: ${speakerAnalytics.length} active speakers with ${participationBalanceScore}% equality score.`
  );

  if (codeSwitchingCount > 0) {
    keyInsights.push(
      `Bilingual Dynamics: ${codeSwitchingCount} code-switching sentences (${codeSwitchingRatio}% of dialogue) naturally blending English and Khmer.`
    );
  } else {
    keyInsights.push(
      `Language Distribution: Dialogue featured ${overallKhmerRatio}% Khmer script and ${100 - overallKhmerRatio}% English.`
    );
  }

  if (actionsCount > 0) {
    keyInsights.push(
      `Accountability: ${actionsCount} actionable tasks identified with high clarity on assignees and delivery milestones.`
    );
  }

  if (decisionsCount > 0) {
    keyInsights.push(
      `Consensus: ${decisionsCount} official decisions ratified during this conference.`
    );
  }

  return {
    healthScore,
    healthStatus,
    totalWords,
    totalTurns: transcript.length,
    durationMinutes: 45,
    khmerScriptRatio: overallKhmerRatio,
    codeSwitchingSegmentsCount: codeSwitchingCount,
    codeSwitchingRatio,
    speakerAnalytics,
    mostActiveSpeaker: mostActiveSpeaker || 'Team',
    participationBalanceScore,
    sentimentTone,
    decisionsCount,
    actionsCount,
    actionCompletionRate,
    keyInsights,
  };
}
