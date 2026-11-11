/**
 * Utilities for English and Khmer text processing, detection, and normalization.
 */

// Khmer Unicode ranges: \u1780-\u17FF (Khmer script), \u19E0-\u19FF (Khmer symbols)
export const KHMER_REGEX = /[\u1780-\u17FF\u19E0-\u19FF]/;
export const KHMER_GLOBAL_REGEX = /[\u1780-\u17FF\u19E0-\u19FF]/g;
export const LATIN_GLOBAL_REGEX = /[a-zA-Z]/g;

/**
 * Checks if a string contains Khmer characters.
 */
export function hasKhmer(text: string): boolean {
  return KHMER_REGEX.test(text);
}

/**
 * Calculates language distribution and detects whether text is 'en', 'km', or 'mixed'.
 */
export function detectLanguage(text: string): {
  language: 'en' | 'km' | 'mixed';
  khmerCharCount: number;
  latinCharCount: number;
  khmerRatio: number;
} {
  const khmerMatches = text.match(KHMER_GLOBAL_REGEX) || [];
  const latinMatches = text.match(LATIN_GLOBAL_REGEX) || [];

  const khmerCount = khmerMatches.length;
  const latinCount = latinMatches.length;
  const total = khmerCount + latinCount;

  if (total === 0) {
    return { language: 'en', khmerCharCount: 0, latinCharCount: 0, khmerRatio: 0 };
  }

  const khmerRatio = khmerCount / total;

  let language: 'en' | 'km' | 'mixed' = 'en';
  if (khmerRatio > 0.75) {
    language = 'km';
  } else if (khmerRatio < 0.25) {
    language = 'en';
  } else {
    language = 'mixed';
  }

  return {
    language,
    khmerCharCount: khmerCount,
    latinCharCount: latinCount,
    khmerRatio,
  };
}

/**
 * English action indicators
 */
export const ENGLISH_ACTION_TRIGGERS = [
  /\b(?:need to|needs to|must|should|have to)\b/i,
  /\b(?:will handle|will take care of|will prepare|will send|will update|will follow up)\b/i,
  /\b(?:action item|to-do|todo|task)\b/i,
  /\b(?:assigned to|please make sure|please review|please submit)\b/i,
  /\b(?:deadline is|due by|by end of|by tomorrow|by next week)\b/i,
];

/**
 * Khmer action indicators
 * ត្រូវតែ (must/have to), ត្រូវ (need to/should), ការងារត្រូវធ្វើ (task to do),
 * សកម្មភាព (action), សូមចាត់ចែង (please arrange), សូមរៀបចំ (please prepare),
 * ទទួលខុសត្រូវ (responsible/in charge), ផ្ញើជូន (send to), កែសម្រួល (revise/edit)
 */
export const KHMER_ACTION_TRIGGERS = [
  /ត្រូវតែ/,
  /ការងារត្រូវធ្វើ/,
  /សកម្មភាព/,
  /សូមចាត់ចែង/,
  /សូមរៀបចំ/,
  /សូមពិនិត្យ/,
  /ទទួលខុសត្រូវ/,
  /ផ្ញើជូន/,
  /កែសម្រួល/,
  /កំណត់ឱ្យ/,
  /ឱ្យបានមុន/,
  /ត្រៀមឯកសារ/,
];

/**
 * English decision indicators
 */
export const ENGLISH_DECISION_TRIGGERS = [
  /\b(?:agreed|agree that|agreed on|decided|decision is|approved|finalized|confirmed|resolved)\b/i,
  /\b(?:we reached consensus|we will proceed with|motion passed|signed off)\b/i,
];

/**
 * Khmer decision indicators
 * សម្រេច (decided), យល់ព្រម (agreed), អនុម័ត (approved), ឯកភាព (consensus), កំណត់យក (chose/settled on)
 */
export const KHMER_DECISION_TRIGGERS = [
  /សម្រេច/,
  /យល់ព្រម/,
  /អនុម័ត/,
  /ឯកភាព/,
  /កំណត់យក/,
  /ព្រមព្រៀង/,
  /សម្រេចចិត្ត/,
];

/**
 * Khmer honorifics and titles for speaker and assignee recognition
 */
export const KHMER_HONORIFICS = [
  'លោក',
  'លោកស្រី',
  'អ្នកគ្រូ',
  'លោកគ្រូ',
  'កញ្ញា',
  'ឯកឧត្តម',
  'លោកជំទាវ',
  'បង',
  'អ៊ំ',
];

/**
 * Common bilingual terminology dictionary for Cambodian business, education, and tech
 */
export const COMMON_BILINGUAL_TERMS: Array<{ termEn: string; termKm: string; definition: string }> = [
  {
    termEn: 'Curriculum & Assessment',
    termKm: 'កម្មវិធីសិក្សា និងការវាយតម្លៃ',
    definition: 'Educational course structure and student performance evaluation metrics.',
  },
  {
    termEn: 'Action Item / To-do',
    termKm: 'សកម្មភាពត្រូវអនុវត្ត / ការងារត្រូវធ្វើ',
    definition: 'Specific task assigned to a team member with a target deadline.',
  },
  {
    termEn: 'Deadline',
    termKm: 'កាលបរិច្ឆេទកំណត់ / ថ្ងៃផុតកំណត់',
    definition: 'The agreed timestamp or day when deliverables must be submitted.',
  },
  {
    termEn: 'Budget & Resource Allocation',
    termKm: 'ថវិកា និងការបែងចែកធនធាន',
    definition: 'Financial parameters and logistical resources approved for the initiative.',
  },
  {
    termEn: 'Meeting Minutes',
    termKm: 'កំណត់ហេតុកិច្ចប្រជុំ',
    definition: 'Official written record of the meeting discussions and resolutions.',
  },
  {
    termEn: 'Milestone / Deliverable',
    termKm: 'សមិទ្ធផលគោលដៅ',
    definition: 'Key deliverables or major project achievements scheduled for review.',
  },
  {
    termEn: 'Stakeholder Feedback',
    termKm: 'មតិកែលម្អពីភាគីពាក់ព័ន្ធ',
    definition: 'Input gathered from teachers, parents, clients, or community partners.',
  },
];
