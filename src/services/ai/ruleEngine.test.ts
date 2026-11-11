import test from 'node:test';
import assert from 'node:assert/strict';
import { detectLanguage, hasKhmer } from './khmerUtils.ts';
import { extractActionItems, extractDecisions, summarizeWithRuleEngine } from './ruleEngine.ts';
import { TranscriptSegment, MeetingMetadata } from '../../types/index.ts';

test('Khmer script detection accurately recognizes Khmer characters', () => {
  assert.equal(hasKhmer('Hello world, how are you?'), false);
  assert.equal(hasKhmer('ជម្រាបសួរលោកគ្រូ'), true);
  assert.equal(hasKhmer('Let us discuss the curriculum សម្រាប់ឆ្នាំនេះ'), true);
});

test('Language detection accurately classifies English, Khmer, and Mixed scripts', () => {
  const enResult = detectLanguage('Good morning everyone, welcome to our weekly sync.');
  assert.equal(enResult.language, 'en');
  assert.equal(enResult.khmerRatio, 0);

  const kmResult = detectLanguage('សូមអរគុណលោកគ្រូអ្នកគ្រូដែលបានចូលរួមក្នុងកិច្ចប្រជុំថ្ងៃនេះ។');
  assert.equal(kmResult.language, 'km');
  assert.ok(kmResult.khmerRatio > 0.8);

  const mixedResult = detectLanguage('We need to submit the curriculum មុនថ្ងៃសុក្រនេះដើម្បីឱ្យ Management review.');
  assert.equal(mixedResult.language, 'mixed');
  assert.ok(mixedResult.khmerRatio > 0.2 && mixedResult.khmerRatio < 0.8);
});

test('Action items extraction identifies English and Khmer triggers', () => {
  const segments: TranscriptSegment[] = [
    {
      id: '1',
      speaker: 'Sokha Chea',
      text: 'Good morning everyone.',
      timestamp: '10:00 AM',
    },
    {
      id: '2',
      speaker: 'Sokha Chea',
      text: 'We need to submit the Q4 financial report by next Friday.',
      timestamp: '10:02 AM',
    },
    {
      id: '3',
      speaker: 'Dara Chan',
      text: 'ខ្ញុំទទួលខុសត្រូវរៀបចំឯកសារ curriculum ឱ្យបានមុនថ្ងៃសុក្រ។',
      timestamp: '10:05 AM',
    },
  ];

  const actionItems = extractActionItems(segments);
  assert.ok(actionItems.length >= 2, 'Should identify at least 2 action items');
  assert.equal(actionItems[0].assignee, 'Sokha Chea');
  assert.equal(actionItems[1].assignee, 'Dara Chan');
  assert.ok(actionItems[0].taskEn.includes('Q4 financial report'));
  assert.ok(actionItems[1].taskKm.includes('curriculum'));
});

test('Decisions extraction identifies consensus and approvals in both languages', () => {
  const segments: TranscriptSegment[] = [
    {
      id: '1',
      speaker: 'Director Vanna',
      text: 'We agreed that the academic schedule starts on November 15th.',
      timestamp: '10:15 AM',
    },
    {
      id: '2',
      speaker: 'Sokha Chea',
      text: 'គណៈកម្មការបានឯកភាព និងអនុម័តកញ្ចប់ថវិកាបន្ថែមសម្រាប់បណ្ណាល័យ។',
      timestamp: '10:18 AM',
    },
  ];

  const decisions = extractDecisions(segments);
  assert.ok(decisions.length >= 2);
  assert.ok(decisions[0].decisionEn.includes('November 15th'));
  assert.ok(decisions[1].decisionKm.includes('អនុម័ត'));
});

test('summarizeWithRuleEngine produces complete structured bilingual summary without API key', () => {
  const segments: TranscriptSegment[] = [
    {
      id: '1',
      speaker: 'Chomroaen Soknara',
      text: 'Welcome to our Footprints International School curriculum planning.',
      timestamp: '09:00 AM',
    },
    {
      id: '2',
      speaker: 'Sreypov Lim',
      text: 'សួស្តីលោកនាយក។ យើងត្រូវតែបញ្ចប់ការវាយតម្លៃសិស្សមុនថ្ងៃសុក្រនេះ។',
      timestamp: '09:02 AM',
    },
    {
      id: '3',
      speaker: 'Chomroaen Soknara',
      text: 'We decided that the bilingual report cards will be printed in both English and Khmer.',
      timestamp: '09:05 AM',
    },
  ];

  const meta: MeetingMetadata = {
    id: 'meet-001',
    title: 'Academic Curriculum & Bilingual Reporting Sync',
    date: '2026-11-10',
    participants: ['Chomroaen Soknara', 'Sreypov Lim'],
  };

  const summary = summarizeWithRuleEngine(segments, meta);

  assert.equal(summary.title, 'Academic Curriculum & Bilingual Reporting Sync');
  assert.ok(summary.executiveSummaryEn.length > 50, 'English executive summary should be detailed');
  assert.ok(summary.executiveSummaryKm.length > 50, 'Khmer executive summary should be detailed');
  assert.ok(summary.actionItems.length > 0, 'Should have action items');
  assert.ok(summary.keyDecisions.length > 0, 'Should have key decisions');
  assert.ok(summary.discussionTopics.length > 0, 'Should have discussion topics');
  assert.ok(summary.stats.khmerRatio > 0, 'Khmer ratio should be detected');
  assert.equal(summary.generatedWith, 'Built-in Bilingual NLP Engine (Zero-Key)');
});
