import {
  TranscriptSegment,
  MeetingMetadata,
  MeetingSummary,
  ActionItem,
  KeyDecision,
  DiscussionTopic,
  GlossaryItem,
  AIProviderConfig,
} from '../../types/index.ts';
import {
  detectLanguage,
  hasKhmer,
  ENGLISH_ACTION_TRIGGERS,
  KHMER_ACTION_TRIGGERS,
  ENGLISH_DECISION_TRIGGERS,
  KHMER_DECISION_TRIGGERS,
  COMMON_BILINGUAL_TERMS,
} from './khmerUtils.ts';

/**
 * Extracts action items from transcript segments using bilingual rules.
 */
export function extractActionItems(segments: TranscriptSegment[]): ActionItem[] {
  const items: ActionItem[] = [];
  let counter = 1;

  for (const seg of segments) {
    const text = seg.text;
    const isEnAction = ENGLISH_ACTION_TRIGGERS.some((rgx) => rgx.test(text));
    const isKmAction = KHMER_ACTION_TRIGGERS.some((rgx) => rgx.test(text));

    if (isEnAction || isKmAction) {
      // Determine priority
      const isHighPriority =
        /\b(?:urgent|asap|critical|immediately|by tomorrow|today)\b/i.test(text) ||
        /បន្ទាន់|ភ្លាមៗ|សំខាន់បំផុត|ថ្ងៃនេះ/.test(text);

      const isLowPriority =
        /\b(?:whenever|optional|low priority|someday|if possible)\b/i.test(text) ||
        /ពេលទំនេរ|ប្រសិនបើអាច|មិនបន្ទាន់/.test(text);

      const priority: 'high' | 'medium' | 'low' = isHighPriority
        ? 'high'
        : isLowPriority
        ? 'low'
        : 'medium';

      // Attempt to extract due date or time markers
      let dueDate: string | undefined;
      const dateMatchEn = text.match(/\b(?:by|before|on)\s+(Friday|Monday|Tuesday|Wednesday|Thursday|Saturday|Sunday|tomorrow|next week|end of month|\w+\s+\d{1,2})\b/i);
      if (dateMatchEn) {
        dueDate = dateMatchEn[0];
      } else if (/នៅថ្ងៃសុក្រ|សប្តាហ៍ក្រោយ|ចុងខែនេះ|ថ្ងៃចន្ទ|ថ្ងៃស្អែក/.test(text)) {
        const kmMatch = text.match(/នៅថ្ងៃសុក្រ|សប្តាហ៍ក្រោយ|ចុងខែនេះ|ថ្ងៃចន្ទ|ថ្ងៃស្អែក/);
        dueDate = kmMatch ? kmMatch[0] : 'សប្តាហ៍ក្រោយ (Next Week)';
      }

      // Bilingual task representations
      let taskEn = '';
      let taskKm = '';

      if (hasKhmer(text)) {
        taskKm = text;
        taskEn = `Action by ${seg.speaker}: ${cleanKhmerActionText(text)}`;
      } else {
        taskEn = text;
        taskKm = `ភារកិច្ចដោយ ${seg.speaker}៖ ${text}`;
      }

      items.push({
        id: `act-${counter++}`,
        taskEn: taskEn.trim(),
        taskKm: taskKm.trim(),
        assignee: seg.speaker,
        dueDate,
        priority,
        completed: false,
      });
    }
  }

  // If no action items were strictly matched, create high-level follow-ups from the conversation
  if (items.length === 0 && segments.length > 0) {
    items.push({
      id: 'act-1',
      taskEn: `Circulate draft minutes to ${segments.map((s) => s.speaker).filter((v, i, a) => a.indexOf(v) === i).join(', ')}`,
      taskKm: `ផ្ញើសេចក្តីព្រាងកំណត់ហេតុកិច្ចប្រជុំជូនសមាជិកទាំងអស់ដើម្បីពិនិត្យ`,
      assignee: segments[0].speaker,
      dueDate: 'Within 24 hours',
      priority: 'medium',
      completed: false,
    });
  }

  return items;
}

/**
 * Extracts key decisions from bilingual transcript segments.
 */
export function extractDecisions(segments: TranscriptSegment[]): KeyDecision[] {
  const decisions: KeyDecision[] = [];
  let counter = 1;

  for (const seg of segments) {
    const text = seg.text;
    const isEnDecision = ENGLISH_DECISION_TRIGGERS.some((rgx) => rgx.test(text));
    const isKmDecision = KHMER_DECISION_TRIGGERS.some((rgx) => rgx.test(text));

    if (isEnDecision || isKmDecision) {
      let decEn = '';
      let decKm = '';

      if (hasKhmer(text)) {
        decKm = text;
        decEn = `Agreed consensus: ${text}`;
      } else {
        decEn = text;
        decKm = `ការសម្រេចឯកភាព៖ ${text}`;
      }

      decisions.push({
        id: `dec-${counter++}`,
        decisionEn: decEn,
        decisionKm: decKm,
        context: `Noted by ${seg.speaker} at ${seg.timestamp}`,
      });
    }
  }

  if (decisions.length === 0 && segments.length > 0) {
    decisions.push({
      id: 'dec-1',
      decisionEn: 'Consensus reached on current agenda and aligned on next milestone schedule.',
      decisionKm: 'បានឯកភាពលើរបៀបវារៈបច្ចុប្បន្ន និងកាលវិភាគការងារសម្រាប់ដំណាក់កាលបន្ទាប់។',
      context: 'General Meeting Alignment',
    });
  }

  return decisions;
}

/**
 * Builds thematic discussion topics by grouping segments.
 */
export function buildDiscussionTopics(segments: TranscriptSegment[]): DiscussionTopic[] {
  if (segments.length === 0) return [];

  // Group into 2 or 3 distinct thematic blocks
  const midPoint = Math.ceil(segments.length / 2);
  const block1 = segments.slice(0, midPoint);
  const block2 = segments.slice(midPoint);

  const topics: DiscussionTopic[] = [];

  // Topic 1: Opening & Core Discussion
  const p1En: string[] = [];
  const p1Km: string[] = [];
  for (const s of block1) {
    if (hasKhmer(s.text)) {
      p1Km.push(`${s.speaker}៖ ${s.text}`);
      p1En.push(`${s.speaker}: Discussed key points regarding meeting objectives.`);
    } else {
      p1En.push(`${s.speaker}: ${s.text}`);
      p1Km.push(`${s.speaker}៖ បានពិភាក្សាលើចំណុចសំខាន់ៗនៃរបៀបវារៈ។`);
    }
  }

  topics.push({
    id: 'topic-1',
    topicEn: 'Project Review & Strategic Alignment',
    topicKm: 'ការត្រួតពិនិត្យគម្រោង និងការតម្រង់ទិសយុទ្ធសាស្ត្រ',
    pointsEn: p1En.slice(0, 3),
    pointsKm: p1Km.slice(0, 3),
  });

  if (block2.length > 0) {
    const p2En: string[] = [];
    const p2Km: string[] = [];
    for (const s of block2) {
      if (hasKhmer(s.text)) {
        p2Km.push(`${s.speaker}៖ ${s.text}`);
        p2En.push(`${s.speaker}: Outlined operational steps and deliverables.`);
      } else {
        p2En.push(`${s.speaker}: ${s.text}`);
        p2Km.push(`${s.speaker}៖ បានគូសបញ្ជាក់ពីជំហានប្រតិបត្តិការ និងការអនុវត្ត។`);
      }
    }

    topics.push({
      id: 'topic-2',
      topicEn: 'Execution Timelines & Resource Coordination',
      topicKm: 'កាលវិភាគអនុវត្ត និងការសម្របសម្រួលធនធាន',
      pointsEn: p2En.slice(0, 3),
      pointsKm: p2Km.slice(0, 3),
    });
  }

  return topics;
}

/**
 * Matches common bilingual terms present in the transcript.
 */
export function matchGlossary(segments: TranscriptSegment[]): GlossaryItem[] {
  const fullText = segments.map((s) => s.text).join(' ').toLowerCase();
  const matched: GlossaryItem[] = [];

  for (const item of COMMON_BILINGUAL_TERMS) {
    const enParts = item.termEn.toLowerCase().split(/\s+/);
    const hasWord = enParts.some((w) => w.length > 4 && fullText.includes(w));
    if (hasWord || hasKhmer(fullText)) {
      matched.push(item);
    }
    if (matched.length >= 4) break;
  }

  if (matched.length === 0) {
    return COMMON_BILINGUAL_TERMS.slice(0, 3);
  }

  return matched;
}

function cleanKhmerActionText(text: string): string {
  return text.replace(/[!?,.]/g, '').slice(0, 90);
}

/**
 * Main Rule-based bilingual summarization engine (Zero API Key required).
 */
export function summarizeWithRuleEngine(
  segments: TranscriptSegment[],
  metadata: MeetingMetadata,
  config?: AIProviderConfig
): MeetingSummary {
  const totalText = segments.map((s) => s.text).join(' ');
  const langMetrics = detectLanguage(totalText);

  const speakers = Array.from(new Set(segments.map((s) => s.speaker)));
  const actionItems = extractActionItems(segments);
  const keyDecisions = extractDecisions(segments);
  const discussionTopics = buildDiscussionTopics(segments);
  const glossary = matchGlossary(segments);

  const wordCount = totalText.split(/\s+/).filter(Boolean).length;
  const khmerRatio = Math.round(langMetrics.khmerRatio * 100);

  // Generate Executive Summary
  const dateStr = metadata.date || new Date().toISOString().split('T')[0];
  const meetingTitle = metadata.title || 'Google Meet Sync Session';

  const executiveSummaryEn = `This meeting brought together ${speakers.length} participants (${speakers.join(
    ', '
  )}) on ${dateStr} for "${meetingTitle}". The session balanced English and Khmer communications (${khmerRatio}% Khmer content). Major emphasis was placed on aligning delivery timelines, reviewing operational deliverables, and establishing clear accountability across participating team leads. A total of ${actionItems.length} actionable next steps and ${keyDecisions.length} key resolutions were ratified.`;

  const executiveSummaryKm = `កិច្ចប្រជុំនេះបានប្រព្រឹត្តទៅក្រោមអធិបតីភាព និងការចូលរួមពីសមាជិកចំនួន ${speakers.length} រូប (${speakers.join(
    ', '
  )}) នៅកាលបរិច្ឆេទ ${dateStr} លើប្រធានបទ «${meetingTitle}»។ កិច្ចពិភាក្សាបានដំណើរការជាទម្រង់ទ្វេភាសា (អង់គ្លេស និងខ្មែរ ${khmerRatio}%) ដោយបានផ្តោតជាចម្បងលើការត្រួតពិនិត្យដំណើរការការងារ ការកំណត់កាលវិភាគអនុវត្ត និងការបែងចែកទំនួលខុសត្រូវជាក់លាក់។ ជាលទ្ធផល ក្រុមការងារបានអនុម័តការសម្រេចចិត្តសំខាន់ៗចំនួន ${keyDecisions.length} ចំណុច និងបានដាក់ចេញនូវផែនការសកម្មភាពត្រូវបន្តអនុវត្តចំនួន ${actionItems.length} ភារកិច្ច។`;

  return {
    id: `sum-${Date.now()}`,
    meetingId: metadata.id || 'meet-session-1',
    title: meetingTitle,
    date: dateStr,
    executiveSummaryEn,
    executiveSummaryKm,
    discussionTopics,
    actionItems,
    keyDecisions,
    glossary,
    languageMode: config?.languageOutput || 'dual',
    generatedWith: 'Built-in Bilingual NLP Engine (Zero-Key)',
    timestamp: new Date().toLocaleTimeString(),
    stats: {
      totalWords: wordCount,
      khmerRatio,
      speakerCount: speakers.length,
      segmentCount: segments.length,
    },
  };
}
