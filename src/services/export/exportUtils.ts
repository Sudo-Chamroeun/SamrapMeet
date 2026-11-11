import { MeetingSummary } from '../../types/index.ts';

export interface ExportOptions {
  languageMode: 'dual' | 'en' | 'km';
  includeExecutiveSummary?: boolean;
  includeActionItems?: boolean;
  includeDecisions?: boolean;
  includeTopics?: boolean;
  includeGlossary?: boolean;
  includeMetadata?: boolean;
}

export const DEFAULT_EXPORT_OPTIONS: ExportOptions = {
  languageMode: 'dual',
  includeExecutiveSummary: true,
  includeActionItems: true,
  includeDecisions: true,
  includeTopics: true,
  includeGlossary: true,
  includeMetadata: true,
};

/**
 * Generates formatted Markdown meeting notes.
 */
export function generateMarkdown(
  summary: MeetingSummary,
  options: ExportOptions = DEFAULT_EXPORT_OPTIONS
): string {
  const { languageMode } = options;
  const lines: string[] = [];

  // Title
  lines.push(`# ${summary.title}`);
  lines.push('');

  // Metadata block
  if (options.includeMetadata !== false) {
    lines.push(`- **Date:** ${summary.date}`);
    lines.push(`- **Generated With:** ${summary.generatedWith}`);
    lines.push(`- **Meeting ID:** ${summary.meetingId}`);
    lines.push(
      `- **Overview:** ${summary.actionItems.length} Action Items | ${summary.keyDecisions.length} Decisions | ${summary.stats.khmerRatio}% Khmer Content`
    );
    lines.push('');
    lines.push('---');
    lines.push('');
  }

  // Executive Summary
  if (options.includeExecutiveSummary !== false) {
    lines.push('## Executive Summary / សេចក្តីសង្ខេបប្រតិបត្តិ');
    lines.push('');
    if (languageMode === 'dual' || languageMode === 'en') {
      lines.push('### English');
      lines.push(summary.executiveSummaryEn);
      lines.push('');
    }
    if (languageMode === 'dual' || languageMode === 'km') {
      lines.push('### ភាសាខ្មែរ (Khmer)');
      lines.push(summary.executiveSummaryKm);
      lines.push('');
    }
    lines.push('---');
    lines.push('');
  }

  // Action Items
  if (options.includeActionItems !== false && summary.actionItems.length > 0) {
    lines.push('## Action Items & Deliverables / ផែនការសកម្មភាព');
    lines.push('');
    summary.actionItems.forEach((act) => {
      const check = act.completed ? '[x]' : '[ ]';
      const assigneeStr = act.assignee ? ` | **Assignee:** ${act.assignee}` : '';
      const dueStr = act.dueDate ? ` | **Due:** ${act.dueDate}` : '';
      const prioStr = ` | **Priority:** ${act.priority.toUpperCase()}`;

      if (languageMode === 'dual') {
        lines.push(`- ${check} **${act.taskEn}**`);
        lines.push(`  *${act.taskKm}*${assigneeStr}${dueStr}${prioStr}`);
      } else if (languageMode === 'km') {
        lines.push(`- ${check} **${act.taskKm}**${assigneeStr}${dueStr}${prioStr}`);
      } else {
        lines.push(`- ${check} **${act.taskEn}**${assigneeStr}${dueStr}${prioStr}`);
      }
    });
    lines.push('');
    lines.push('---');
    lines.push('');
  }

  // Key Decisions
  if (options.includeDecisions !== false && summary.keyDecisions.length > 0) {
    lines.push('## Key Decisions & Resolutions / ការសម្រេចចិត្ត');
    lines.push('');
    summary.keyDecisions.forEach((dec) => {
      if (languageMode === 'dual') {
        lines.push(`- **[RATIFIED]** ${dec.decisionEn}`);
        lines.push(`  *${dec.decisionKm}*`);
      } else if (languageMode === 'km') {
        lines.push(`- **[បានអនុម័ត]** ${dec.decisionKm}`);
      } else {
        lines.push(`- **[RATIFIED]** ${dec.decisionEn}`);
      }
      if (dec.context) {
        lines.push(`  *Context: ${dec.context}*`);
      }
    });
    lines.push('');
    lines.push('---');
    lines.push('');
  }

  // Discussion Topics
  if (options.includeTopics !== false && summary.discussionTopics.length > 0) {
    lines.push('## Discussion Topics / ចំណុចពិភាក្សា');
    lines.push('');
    summary.discussionTopics.forEach((topic) => {
      if (languageMode === 'dual') {
        lines.push(`### ${topic.topicEn} (${topic.topicKm})`);
      } else if (languageMode === 'km') {
        lines.push(`### ${topic.topicKm}`);
      } else {
        lines.push(`### ${topic.topicEn}`);
      }
      lines.push('');

      topic.pointsEn.forEach((pt, idx) => {
        if (languageMode === 'dual') {
          lines.push(`- ${pt}`);
          if (topic.pointsKm[idx]) {
            lines.push(`  *${topic.pointsKm[idx]}*`);
          }
        } else if (languageMode === 'km') {
          lines.push(`- ${topic.pointsKm[idx] || pt}`);
        } else {
          lines.push(`- ${pt}`);
        }
      });
      lines.push('');
    });
    lines.push('---');
    lines.push('');
  }

  // Glossary
  if (options.includeGlossary !== false && summary.glossary && summary.glossary.length > 0) {
    lines.push('## Bilingual Glossary / សទ្ទានុក្រមទ្វេភាសា');
    lines.push('');
    lines.push('| English Term | ពាក្យខ្មែរ (Khmer) | Definition |');
    lines.push('|---|---|---|');
    summary.glossary.forEach((item) => {
      lines.push(`| **${item.termEn}** | ${item.termKm} | ${item.definition} |`);
    });
    lines.push('');
    lines.push('---');
    lines.push('');
  }

  lines.push('*Document generated by SamrapMeet (សង្ខេប Meet) — Created by Footprints IT-Team (Footprints International School)*');
  return lines.join('\n');
}

/**
 * Generates an email/chat ready participant digest.
 */
export function generateEmailDigest(
  summary: MeetingSummary,
  options: ExportOptions = DEFAULT_EXPORT_OPTIONS
): string {
  const { languageMode } = options;
  const lines: string[] = [];

  lines.push(`Meeting Recap: ${summary.title}`);
  lines.push(`Date: ${summary.date}`);
  lines.push('');
  lines.push('Hi team / ជម្រាបសួរសហការីទាំងអស់,');
  lines.push('Here is the summary and action checklist from our recent meeting:');
  lines.push('');

  lines.push('EXECUTIVE SUMMARY:');
  if (languageMode === 'dual' || languageMode === 'en') {
    lines.push(summary.executiveSummaryEn);
    lines.push('');
  }
  if (languageMode === 'dual' || languageMode === 'km') {
    lines.push(summary.executiveSummaryKm);
    lines.push('');
  }

  if (summary.actionItems.length > 0) {
    lines.push('ACTION ITEMS:');
    summary.actionItems.forEach((act, idx) => {
      const status = act.completed ? '[DONE]' : '[TODO]';
      const who = act.assignee ? ` (@${act.assignee})` : '';
      const when = act.dueDate ? ` [Due: ${act.dueDate}]` : '';
      if (languageMode === 'km') {
        lines.push(`${idx + 1}. ${status} ${act.taskKm}${who}${when}`);
      } else {
        lines.push(`${idx + 1}. ${status} ${act.taskEn}${who}${when}`);
        if (languageMode === 'dual') {
          lines.push(`   ${act.taskKm}`);
        }
      }
    });
    lines.push('');
  }

  if (summary.keyDecisions.length > 0) {
    lines.push('KEY DECISIONS:');
    summary.keyDecisions.forEach((dec, idx) => {
      lines.push(`${idx + 1}. ${dec.decisionEn}`);
      if (languageMode === 'dual' || languageMode === 'km') {
        lines.push(`   ${dec.decisionKm}`);
      }
    });
    lines.push('');
  }

  lines.push('Best regards,');
  lines.push('Footprints IT-Team & Meeting Organizing Team');

  return lines.join('\n');
}

/**
 * Generates a clean, standalone, printable HTML document with embedded CSS and Google Fonts
 * that can be directly printed to PDF via a clean popup window.
 */
export function generatePrintableHtml(
  summary: MeetingSummary,
  options: ExportOptions = DEFAULT_EXPORT_OPTIONS
): string {
  const md = generateMarkdown(summary, options);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${summary.title} - Meeting Notes</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Kantumruy+Pro:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    @page {
      size: A4;
      margin: 20mm;
    }
    body {
      font-family: 'Inter', 'Kantumruy Pro', system-ui, sans-serif;
      color: #111827;
      background: #ffffff;
      line-height: 1.6;
      margin: 0;
      padding: 0;
      font-size: 13px;
    }
    .header {
      border-bottom: 2px solid #2563eb;
      padding-bottom: 12px;
      margin-bottom: 20px;
    }
    .title {
      font-size: 22px;
      font-weight: 700;
      color: #1e3a8a;
      margin: 0 0 4px 0;
    }
    .meta-bar {
      font-size: 11px;
      color: #4b5563;
      margin-top: 4px;
    }
    .section {
      margin-bottom: 22px;
      page-break-inside: avoid;
    }
    .section-title {
      font-size: 15px;
      font-weight: 700;
      color: #1f2937;
      border-bottom: 1px solid #e5e7eb;
      padding-bottom: 4px;
      margin-bottom: 10px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .brief-box {
      background: #f8fafc;
      border-left: 3px solid #2563eb;
      padding: 10px 14px;
      border-radius: 4px;
      margin-bottom: 8px;
    }
    .action-item {
      display: flex;
      align-items: flex-start;
      gap: 8px;
      padding: 8px 0;
      border-bottom: 1px dotted #e5e7eb;
    }
    .action-check {
      font-family: monospace;
      font-weight: bold;
      color: #059669;
    }
    .tag {
      display: inline-block;
      font-size: 10px;
      padding: 2px 6px;
      border-radius: 4px;
      background: #e2e8f0;
      color: #334155;
      margin-right: 4px;
    }
    .tag.high {
      background: #fee2e2;
      color: #991b1b;
    }
    .decision-card {
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      border-radius: 6px;
      padding: 10px 12px;
      margin-bottom: 8px;
    }
    .glossary-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 11px;
      margin-top: 8px;
    }
    .glossary-table th, .glossary-table td {
      border: 1px solid #e2e8f0;
      padding: 6px 8px;
      text-align: left;
    }
    .glossary-table th {
      background: #f1f5f9;
      font-weight: 600;
    }
    .footer {
      border-top: 1px solid #e5e7eb;
      padding-top: 10px;
      margin-top: 30px;
      font-size: 10px;
      color: #64748b;
      text-align: center;
    }
    .font-khmer {
      font-family: 'Kantumruy Pro', sans-serif;
    }
    @media print {
      body {
        margin: 0;
      }
    }
  </style>
</head>
<body>
  <div class="header">
    <div style="display: flex; justify-content: space-between; align-items: center;">
      <div>
        <h1 class="title">${summary.title}</h1>
        <div class="meta-bar">
          <strong>Date:</strong> ${summary.date} &bull; 
          <strong>Engine:</strong> ${summary.generatedWith} &bull; 
          <strong>Khmer Content:</strong> ${summary.stats.khmerRatio}%
        </div>
      </div>
      <div style="font-size: 24px;">🇰🇭</div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Executive Summary / សេចក្តីសង្ខេបប្រតិបត្តិ</div>
    ${
      options.languageMode !== 'km'
        ? `<div class="brief-box">
             <div style="font-size: 10px; font-weight: bold; color: #2563eb; margin-bottom: 2px;">ENGLISH BRIEF</div>
             <div>${summary.executiveSummaryEn}</div>
           </div>`
        : ''
    }
    ${
      options.languageMode !== 'en'
        ? `<div class="brief-box font-khmer">
             <div style="font-size: 10px; font-weight: bold; color: #059669; margin-bottom: 2px;">សេចក្តីសង្ខេបជាភាសាខ្មែរ</div>
             <div>${summary.executiveSummaryKm}</div>
           </div>`
        : ''
    }
  </div>

  <div class="section">
    <div class="section-title">Action Items / ផែនការសកម្មភាព (${summary.actionItems.length})</div>
    ${summary.actionItems
      .map(
        (act) => `
      <div class="action-item">
        <span class="action-check">${act.completed ? '[✓]' : '[ ]'}</span>
        <div style="flex: 1;">
          ${options.languageMode !== 'km' ? `<div style="font-weight: 600;">${act.taskEn}</div>` : ''}
          ${options.languageMode !== 'en' ? `<div class="font-khmer" style="color: #4b5563;">${act.taskKm}</div>` : ''}
          <div style="margin-top: 4px;">
            ${act.assignee ? `<span class="tag">👤 ${act.assignee}</span>` : ''}
            ${act.dueDate ? `<span class="tag">📅 ${act.dueDate}</span>` : ''}
            <span class="tag ${act.priority === 'high' ? 'high' : ''}">${act.priority.toUpperCase()}</span>
          </div>
        </div>
      </div>
    `
      )
      .join('')}
  </div>

  <div class="section">
    <div class="section-title">Key Resolutions / ការសម្រេចចិត្ត (${summary.keyDecisions.length})</div>
    ${summary.keyDecisions
      .map(
        (dec) => `
      <div class="decision-card">
        ${options.languageMode !== 'km' ? `<div style="font-weight: 600; color: #166534;">&bull; ${dec.decisionEn}</div>` : ''}
        ${options.languageMode !== 'en' ? `<div class="font-khmer" style="color: #15803d; margin-top: 2px;">&bull; ${dec.decisionKm}</div>` : ''}
        ${dec.context ? `<div style="font-size: 10px; color: #6b7280; margin-top: 2px;">${dec.context}</div>` : ''}
      </div>
    `
      )
      .join('')}
  </div>

  ${
    summary.glossary && summary.glossary.length > 0
      ? `
  <div class="section">
    <div class="section-title">Bilingual Glossary / សទ្ទានុក្រមទ្វេភាសា</div>
    <table class="glossary-table">
      <thead>
        <tr>
          <th>English Term</th>
          <th>ពាក្យខ្មែរ</th>
          <th>Definition</th>
        </tr>
      </thead>
      <tbody>
        ${summary.glossary
          .map(
            (g) => `
          <tr>
            <td><strong>${g.termEn}</strong></td>
            <td class="font-khmer">${g.termKm}</td>
            <td>${g.definition}</td>
          </tr>
        `
          )
          .join('')}
      </tbody>
    </table>
  </div>
  `
      : ''
  }

  <div class="footer">
    Generated with SamrapMeet (សង្ខេប Meet) &bull; Created by Footprints IT-Team (Footprints International School) &bull; Bilingual Google Meet Note Summarizer
  </div>
</body>
</html>`;
}

/**
 * Triggers a download of a text blob in browser.
 */
export function downloadFile(content: string, filename: string, mimeType: string = 'text/plain;charset=utf-8'): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Opens a print-optimized window and triggers window.print() for PDF saving.
 */
export function printNotesAsPDF(summary: MeetingSummary, options: ExportOptions = DEFAULT_EXPORT_OPTIONS): void {
  const html = generatePrintableHtml(summary, options);
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 500);
  } else {
    // Fallback to inline window.print()
    window.print();
  }
}
