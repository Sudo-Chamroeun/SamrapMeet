import test from 'node:test';
import assert from 'node:assert/strict';
import { analyzeMeeting } from './analyticsEngine.ts';
import { TranscriptSegment, MeetingMetadata, MeetingSummary } from '../../types/index.ts';

const mockTranscript: TranscriptSegment[] = [
  {
    id: '1',
    speaker: 'Chomroaen Soknara',
    timestamp: '09:01 AM',
    text: 'Good morning everyone. Welcome to our curriculum review.',
    language: 'en',
  },
  {
    id: '2',
    speaker: 'Sreypov Lim',
    timestamp: '09:03 AM',
    text: 'ជម្រាបសួរលោកនាយក។ កម្មវិធីសិក្សាភាសាខ្មែរបានរៀបចំរួចរាល់ហើយ។',
    language: 'km',
  },
  {
    id: '3',
    speaker: 'David Miller',
    timestamp: '09:06 AM',
    text: 'We need to submit the curriculum មុនថ្ងៃសុក្រនេះដើម្បីឱ្យ review.',
    language: 'mixed',
  },
];

const mockMeta: MeetingMetadata = {
  id: 'meet-01',
  title: 'Curriculum Review',
  date: '2026-11-10',
  participants: ['Chomroaen Soknara', 'Sreypov Lim', 'David Miller'],
};

test('analyzeMeeting calculates speaker metrics and talk time correctly', () => {
  const result = analyzeMeeting(mockTranscript, null, mockMeta);

  assert.equal(result.totalTurns, 3);
  assert.ok(result.totalWords > 15);
  assert.equal(result.speakerAnalytics.length, 3);
  assert.ok(result.healthScore >= 50);
  assert.ok(result.codeSwitchingSegmentsCount >= 1, 'Should detect mixed code-switching segment');
  assert.ok(result.khmerScriptRatio > 0, 'Should detect Khmer characters');
});

test('analyzeMeeting handles empty transcript gracefully', () => {
  const result = analyzeMeeting([], null, mockMeta);
  assert.equal(result.healthScore, 0);
  assert.equal(result.totalWords, 0);
  assert.equal(result.speakerAnalytics.length, 0);
});
