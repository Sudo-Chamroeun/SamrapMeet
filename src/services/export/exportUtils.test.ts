import test from 'node:test';
import assert from 'node:assert/strict';
import { generateMarkdown, generateEmailDigest, generatePrintableHtml } from './exportUtils.ts';
import { MeetingSummary } from '../../types/index.ts';

const mockSummary: MeetingSummary = {
  id: 'sum-test-1',
  meetingId: 'meet-001',
  title: 'Footprints Curriculum Sync',
  date: '2026-11-10',
  executiveSummaryEn: 'The team aligned on Cambridge reading rubrics and bilingual report cards.',
  executiveSummaryKm: 'ក្រុមការងារបានឯកភាពលើ Rubrics ភាសាខ្មែរ និងការចេញកាតសិស្សទ្វេភាសា។',
  discussionTopics: [
    {
      id: 't1',
      topicEn: 'Curriculum Alignment',
      topicKm: 'ការតម្រង់ទិសកម្មវិធីសិក្សា',
      pointsEn: ['Finalize reading lists'],
      pointsKm: ['បញ្ចប់បញ្ជីអំណាន'],
    },
  ],
  actionItems: [
    {
      id: 'a1',
      taskEn: 'Send revised rubrics to David',
      taskKm: 'ផ្ញើតារាង Rubrics កែសម្រួលជូនលោក David',
      assignee: 'Sreypov Lim',
      dueDate: 'Friday',
      priority: 'high',
      completed: true,
    },
    {
      id: 'a2',
      taskEn: 'Schedule parent teacher conference',
      taskKm: 'រៀបចំកាលបរិច្ឆេទជួបអាណាព្យាបាល',
      assignee: 'Bopha Kem',
      dueDate: 'December 5',
      priority: 'medium',
      completed: false,
    },
  ],
  keyDecisions: [
    {
      id: 'd1',
      decisionEn: 'All final report cards will be printed in both English and Khmer.',
      decisionKm: 'កាតសិស្សទាំងអស់នឹងបោះពុម្ពជាពីភាសា។',
      context: 'Ratified by Committee',
    },
  ],
  glossary: [
    {
      termEn: 'Curriculum',
      termKm: 'កម្មវិធីសិក្សា',
      definition: 'Structured course of study',
    },
  ],
  languageMode: 'dual',
  generatedWith: 'Built-in Bilingual NLP Engine',
  timestamp: '10:00 AM',
  stats: {
    totalWords: 150,
    khmerRatio: 50,
    speakerCount: 3,
    segmentCount: 8,
  },
};

test('generateMarkdown produces valid markdown structure with tasks and decisions', () => {
  const md = generateMarkdown(mockSummary);
  assert.ok(md.includes('# Footprints Curriculum Sync'));
  assert.ok(md.includes('## Executive Summary / សេចក្តីសង្ខេបប្រតិបត្តិ'));
  assert.ok(md.includes('- [x] **Send revised rubrics to David**'));
  assert.ok(md.includes('- [ ] **Schedule parent teacher conference**'));
  assert.ok(md.includes('All final report cards will be printed in both English and Khmer.'));
  assert.ok(md.includes('| **Curriculum** | កម្មវិធីសិក្សា |'));
});

test('generateMarkdown supports language filtering for English-only and Khmer-only', () => {
  const enMd = generateMarkdown(mockSummary, { languageMode: 'en' });
  assert.ok(enMd.includes('Send revised rubrics to David'));
  assert.ok(!enMd.includes('### ភាសាខ្មែរ (Khmer)'));

  const kmMd = generateMarkdown(mockSummary, { languageMode: 'km' });
  assert.ok(kmMd.includes('ផ្ញើតារាង Rubrics កែសម្រួលជូនលោក David'));
  assert.ok(!kmMd.includes('### English'));
});

test('generateEmailDigest creates ready-to-share message for participants', () => {
  const digest = generateEmailDigest(mockSummary);
  assert.ok(digest.includes('Meeting Recap: Footprints Curriculum Sync'));
  assert.ok(digest.includes('ACTION ITEMS:'));
  assert.ok(digest.includes('[DONE] Send revised rubrics to David (@Sreypov Lim) [Due: Friday]'));
  assert.ok(digest.includes('[TODO] Schedule parent teacher conference (@Bopha Kem) [Due: December 5]'));
});

test('generatePrintableHtml produces valid HTML with Khmer fonts and print layout', () => {
  const html = generatePrintableHtml(mockSummary);
  assert.ok(html.includes('<!DOCTYPE html>'));
  assert.ok(html.includes('Kantumruy+Pro'));
  assert.ok(html.includes('Footprints Curriculum Sync'));
  assert.ok(html.includes('Executive Summary'));
  assert.ok(html.includes('Send revised rubrics to David'));
});
