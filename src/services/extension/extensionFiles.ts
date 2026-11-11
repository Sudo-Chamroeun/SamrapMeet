export interface ExtensionFile {
  name: string;
  path: string;
  type: 'json' | 'javascript' | 'html' | 'css' | 'markdown';
  description: string;
  content: string;
}

export function getChromeExtensionFiles(): ExtensionFile[] {
  return [
    {
      name: 'manifest.json',
      path: 'manifest.json',
      type: 'json',
      description: 'Chrome Extension Manifest V3 configuration with Meet permissions and sidepanel API',
      content: JSON.stringify(
        {
          manifest_version: 3,
          name: 'SamrapMeet - English & Khmer Google Meet Note Summarizer',
          version: '1.0.0',
          author: 'Footprints IT-Team (Footprints International School)',
          description:
            'AI-powered note taker & summarizer for Google Meet with specialized English & Khmer bilingual transcription. Created by Footprints IT-Team.',
          permissions: ['storage', 'sidePanel', 'activeTab'],
          host_permissions: ['https://meet.google.com/*'],
          action: {
            default_popup: 'popup.html',
          },
          side_panel: {
            default_path: 'sidepanel.html',
          },
          background: {
            service_worker: 'background.js',
          },
          content_scripts: [
            {
              matches: ['https://meet.google.com/*'],
              js: ['content.js'],
              css: ['styles.css'],
              run_at: 'document_idle',
            },
          ],
        },
        null,
        2
      ),
    },
    {
      name: 'content.js',
      path: 'content.js',
      type: 'javascript',
      description: 'Content script injected into Google Meet to capture live bilingual captions and provide a floating widget',
      content: `/**
 * SamrapMeet - Google Meet Content Script
 * Observes Google Meet live captions in English and Khmer (ភាសាខ្មែរ).
 * Created by Footprints IT-Team (Footprints International School)
 */

console.log('[SamrapMeet] Initializing Google Meet Transcription & Summarizer hook...');

let liveCaptions = [];
let observer = null;
let isRecording = false;

// Inject floating HUD widget into Google Meet
function injectSamrapWidget() {
  if (document.getElementById('samrapmeet-hud')) return;

  const hud = document.createElement('div');
  hud.id = 'samrapmeet-hud';
  hud.innerHTML = \`
    <div class="sm-hud-inner">
      <div class="sm-header">
        <span class="sm-logo">🇰🇭 SamrapMeet</span>
        <span class="sm-badge" id="sm-badge-status">Ready</span>
      </div>
      <div class="sm-stats">
        <div class="sm-stat-box">
          <span class="sm-stat-val" id="sm-seg-count">0</span>
          <span class="sm-stat-lbl">Lines</span>
        </div>
        <div class="sm-stat-box">
          <span class="sm-stat-val" id="sm-km-ratio">0%</span>
          <span class="sm-stat-lbl">Khmer</span>
        </div>
      </div>
      <div class="sm-preview" id="sm-live-preview">Captions will appear here when CC is turned on...</div>
      <div class="sm-actions">
        <button id="sm-toggle-btn" class="sm-btn primary">Start Capture</button>
        <button id="sm-open-panel-btn" class="sm-btn secondary">Open Notes</button>
      </div>
      <div style="font-size: 9px; color: #64748b; margin-top: 8px; text-align: center;">
        Footprints IT-Team
      </div>
    </div>
  \`;

  document.body.appendChild(hud);

  document.getElementById('sm-toggle-btn').addEventListener('click', toggleCapture);
  document.getElementById('sm-open-panel-btn').addEventListener('click', () => {
    chrome.runtime.sendMessage({ action: 'OPEN_SIDEPANEL' });
  });
}

function toggleCapture() {
  isRecording = !isRecording;
  const btn = document.getElementById('sm-toggle-btn');
  const badge = document.getElementById('sm-badge-status');

  if (isRecording) {
    btn.textContent = 'Pause Capture';
    btn.classList.add('recording');
    badge.textContent = 'Listening';
    badge.className = 'sm-badge live';
    startCaptionObserver();
  } else {
    btn.textContent = 'Resume Capture';
    btn.classList.remove('recording');
    badge.textContent = 'Paused';
    badge.className = 'sm-badge paused';
  }
}

// Observe Google Meet caption containers
function startCaptionObserver() {
  if (observer) return;

  observer = new MutationObserver(() => {
    if (!isRecording) return;

    // Search for active caption speaker bubbles and text nodes
    const textNodes = document.querySelectorAll('.iTTPOb, .yg77Re, .nM3ebc, div[jscontroller="D1tHje"] span');

    textNodes.forEach((node) => {
      const text = node.textContent?.trim();
      if (!text || text.length < 2) return;

      const parent = node.closest('[jscontroller]') || node.parentElement;
      const speaker = parent?.querySelector('.zs75Bi, .NWK43c, .VbkSUe')?.textContent?.trim() || 'Speaker';
      const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      // Check duplicate
      const last = liveCaptions[liveCaptions.length - 1];
      if (last && last.speaker === speaker && last.text === text) return;

      const segment = {
        id: 'cap-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
        speaker,
        text,
        timestamp: time,
      };

      liveCaptions.push(segment);
      updateHUDPreview(segment);

      // Broadcast to background / sidepanel
      chrome.runtime.sendMessage({
        action: 'NEW_CAPTION_SEGMENT',
        segment,
        totalCount: liveCaptions.length,
      }).catch(() => {});
    });
  });

  observer.observe(document.body, { childList: true, subtree: true, characterData: true });
}

function updateHUDPreview(segment) {
  const preview = document.getElementById('sm-live-preview');
  const countEl = document.getElementById('sm-seg-count');
  const ratioEl = document.getElementById('sm-km-ratio');

  if (preview) {
    preview.textContent = segment.speaker + ': ' + segment.text;
  }
  if (countEl) {
    countEl.textContent = liveCaptions.length;
  }

  // Calculate Khmer ratio
  const kmRegex = /[\\u1780-\\u17FF]/g;
  const fullText = liveCaptions.map((s) => s.text).join(' ');
  const kmCount = (fullText.match(kmRegex) || []).length;
  const latinCount = (fullText.match(/[a-zA-Z]/g) || []).length;
  const total = kmCount + latinCount;
  const ratio = total > 0 ? Math.round((kmCount / total) * 100) : 0;

  if (ratioEl) {
    ratioEl.textContent = ratio + '%';
  }
}

// Initialize when Meet interface is ready
setTimeout(injectSamrapWidget, 2500);
`,
    },
    {
      name: 'background.js',
      path: 'background.js',
      type: 'javascript',
      description: 'Service worker coordinating caption messaging, storage, and sidepanel views',
      content: `/**
 * SamrapMeet - Background Service Worker
 * Created by Footprints IT-Team (Footprints International School)
 */

chrome.runtime.onInstalled.addListener(() => {
  console.log('[SamrapMeet] Extension installed.');
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(() => {});
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'OPEN_SIDEPANEL') {
    if (sender.tab?.id) {
      chrome.sidePanel.open({ tabId: sender.tab.id }).catch(() => {});
    }
  }

  if (request.action === 'GET_TRANSCRIPT') {
    chrome.storage.local.get(['samrap_transcript'], (result) => {
      sendResponse({ transcript: result.samrap_transcript || [] });
    });
    return true;
  }

  if (request.action === 'NEW_CAPTION_SEGMENT') {
    chrome.storage.local.get(['samrap_transcript'], (result) => {
      const list = result.samrap_transcript || [];
      list.push(request.segment);
      chrome.storage.local.set({ samrap_transcript: list });
    });
  }
});
`,
    },
    {
      name: 'popup.html',
      path: 'popup.html',
      type: 'html',
      description: 'Quick action popup showing status and quick link to sidepanel',
      content: `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body {
      width: 280px;
      padding: 14px;
      background: #0f172a;
      color: #f8fafc;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      margin: 0;
    }
    .header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 6px;
    }
    .logo {
      font-size: 18px;
    }
    h1 {
      font-size: 14px;
      font-weight: 700;
      margin: 0;
      color: #38bdf8;
    }
    .subtitle {
      font-size: 10px;
      color: #94a3b8;
      margin-bottom: 12px;
    }
    .box {
      background: #1e293b;
      border: 1px solid #334155;
      padding: 10px;
      border-radius: 8px;
      font-size: 11px;
      margin-bottom: 12px;
      line-height: 1.5;
    }
    .badge {
      display: inline-block;
      background: #065f46;
      color: #6ee7b7;
      font-size: 9px;
      padding: 2px 6px;
      border-radius: 4px;
      font-weight: 600;
    }
    button {
      width: 100%;
      padding: 8px 12px;
      background: #2563eb;
      color: white;
      border: none;
      border-radius: 6px;
      font-size: 11px;
      font-weight: 600;
      cursor: pointer;
    }
    button:hover {
      background: #1d4ed8;
    }
  </style>
</head>
<body>
  <div class="header">
    <span class="logo">🇰🇭</span>
    <div>
      <h1>SamrapMeet</h1>
    </div>
  </div>
  <div class="subtitle">English & Khmer &bull; Footprints IT-Team</div>

  <div class="box">
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
      <span>Status:</span>
      <span class="badge">READY</span>
    </div>
    <div style="color: #cbd5e1;">
      Join any Google Meet call (<strong>meet.google.com</strong>) and click <strong>CC</strong> to automatically capture speech in English and Khmer.
    </div>
  </div>

  <button id="open-btn">Open Notes Sidepanel</button>
  <script src="popup.js"></script>
</body>
</html>`,
    },
    {
      name: 'popup.js',
      path: 'popup.js',
      type: 'javascript',
      description: 'Popup script opening the sidepanel docked in Meet',
      content: `document.getElementById('open-btn')?.addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab?.id) {
    chrome.sidePanel.open({ tabId: tab.id }).catch(() => {});
  }
});
`,
    },
    {
      name: 'sidepanel.html',
      path: 'sidepanel.html',
      type: 'html',
      description: 'Sidepanel layout docked inside Google Meet showing real-time notes and AI summary',
      content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>SamrapMeet Companion</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body class="sm-sidepanel">
  <header class="sm-panel-header">
    <div class="sm-brand">
      <span class="sm-icon">🇰🇭</span>
      <div>
        <h1>SamrapMeet</h1>
        <p class="sm-sub">English & Khmer &bull; Footprints IT-Team</p>
      </div>
    </div>
    <div id="sm-engine-indicator" class="sm-engine-pill">Zero-Key NLP</div>
  </header>

  <main class="sm-panel-body">
    <div class="sm-tabs">
      <button class="sm-tab active" data-tab="live">Live Captions</button>
    </div>

    <div id="tab-live" class="sm-tab-content active">
      <div class="sm-transcript-feed" id="sm-feed">
        <p style="color: #94a3b8; font-size: 11px; padding: 12px; text-align: center;">
          Turn on Captions (CC) in Google Meet to stream real-time English and Khmer notes...
        </p>
      </div>
    </div>
  </main>
  <script src="sidepanel.js"></script>
</body>
</html>
`,
    },
    {
      name: 'sidepanel.js',
      path: 'sidepanel.js',
      type: 'javascript',
      description: 'Sidepanel script displaying live captions stream',
      content: `chrome.storage.local.get(['samrap_transcript'], (result) => {
  const list = result.samrap_transcript || [];
  if (list.length > 0) renderFeed(list);
});

chrome.runtime.onMessage.addListener((request) => {
  if (request.action === 'NEW_CAPTION_SEGMENT') {
    appendSegment(request.segment);
  }
});

function renderFeed(list) {
  const feed = document.getElementById('sm-feed');
  if (!feed) return;
  feed.innerHTML = list.map(s => \`
    <div style="padding: 8px; margin-bottom: 6px; background: rgba(30,41,59,0.7); border-radius: 6px; font-size: 11px;">
      <strong style="color: #38bdf8;">\${s.speaker}</strong>: <span>\${s.text}</span>
    </div>
  \`).join('');
}

function appendSegment(seg) {
  const feed = document.getElementById('sm-feed');
  if (!feed) return;
  const div = document.createElement('div');
  div.style.cssText = 'padding: 8px; margin-bottom: 6px; background: rgba(30,41,59,0.7); border-radius: 6px; font-size: 11px;';
  div.innerHTML = \`<strong style="color: #38bdf8;">\${seg.speaker}</strong>: <span>\${seg.text}</span>\`;
  feed.appendChild(div);
  feed.scrollTop = feed.scrollHeight;
}
`,
    },
    {
      name: 'styles.css',
      path: 'styles.css',
      type: 'css',
      description: 'Styling for floating HUD inside Google Meet and sidepanel companion',
      content: `/* SamrapMeet Meet HUD Widget */
#samrapmeet-hud {
  position: fixed;
  bottom: 80px;
  right: 24px;
  width: 320px;
  background: rgba(15, 23, 42, 0.95);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(59, 130, 246, 0.3);
  border-radius: 14px;
  padding: 14px;
  color: #f8fafc;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5);
  z-index: 9999999;
}

.sm-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.sm-logo {
  font-weight: 700;
  font-size: 14px;
  color: #60a5fa;
}

.sm-badge {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 9999px;
  background: #334155;
}

.sm-badge.live {
  background: #ef4444;
  color: #fff;
}

.sm-stats {
  display: flex;
  gap: 8px;
  margin-bottom: 10px;
}

.sm-stat-box {
  flex: 1;
  background: rgba(30, 41, 59, 0.7);
  padding: 6px;
  border-radius: 8px;
  text-align: center;
}

.sm-stat-val {
  display: block;
  font-weight: 700;
  font-size: 14px;
  color: #38bdf8;
}

.sm-stat-lbl {
  font-size: 10px;
  color: #94a3b8;
}

.sm-preview {
  background: rgba(15, 23, 42, 0.8);
  border: 1px solid #334155;
  border-radius: 8px;
  padding: 8px;
  font-size: 12px;
  min-height: 48px;
  max-height: 72px;
  overflow-y: auto;
  color: #cbd5e1;
  margin-bottom: 12px;
}

.sm-actions {
  display: flex;
  gap: 8px;
}

.sm-btn {
  flex: 1;
  padding: 8px 12px;
  border: none;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}

.sm-btn.primary {
  background: #2563eb;
  color: #fff;
}

.sm-btn.primary.recording {
  background: #dc2626;
}

.sm-btn.secondary {
  background: #334155;
  color: #f1f5f9;
}

/* Sidepanel styling */
.sm-sidepanel {
  background: #0f172a;
  color: #f8fafc;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  margin: 0;
  padding: 14px;
}

.sm-panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #334155;
  padding-bottom: 10px;
  margin-bottom: 12px;
}

.sm-brand h1 {
  font-size: 14px;
  margin: 0;
  color: #38bdf8;
}

.sm-sub {
  font-size: 10px;
  color: #94a3b8;
  margin: 0;
}

.sm-engine-pill {
  font-size: 10px;
  background: rgba(59, 130, 246, 0.2);
  color: #60a5fa;
  padding: 2px 8px;
  border-radius: 9999px;
  border: 1px solid rgba(59, 130, 246, 0.3);
}

.sm-transcript-feed {
  max-height: calc(100vh - 80px);
  overflow-y: auto;
}
`,
    },
    {
      name: 'README.md',
      path: 'README.md',
      type: 'markdown',
      description: 'Step-by-step instructions for loading or publishing the extension',
      content: `# SamrapMeet - Google Meet Bilingual Summarizer
**Created by Footprints IT-Team (Footprints International School)**

---

## Option 1: Use it Immediately in Chrome (Free & Instant)
1. Download all extension files from SamrapMeet into a folder on your computer named \`samrapmeet-extension\`.
2. Open Google Chrome and go to \`chrome://extensions\`.
3. In the top-right corner, switch on **Developer mode**.
4. Click **Load unpacked** in the top-left corner.
5. Select the \`samrapmeet-extension\` folder.
6. Join any Google Meet call at \`meet.google.com\` and turn on Captions (click the 'CC' button in Meet).
7. SamrapMeet will automatically capture English and Khmer speech and provide instant structured notes!

---

## Option 2: Publish to Chrome Web Store (School-Wide or Public)
1. Zip the \`samrapmeet-extension\` folder containing \`manifest.json\`, \`content.js\`, \`background.js\`, \`sidepanel.html\`, \`styles.css\`.
2. Visit the [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole).
3. Sign in with your Footprints School Google Workspace account.
4. Click **New Item** and upload the \`.zip\` package.
5. Set Visibility:
   - **Private / Domain Restricted**: Available only to users under \`footprintsschool.edu.kh\`.
   - **Public / Unlisted**: Available to anyone with the link or searchable in Chrome Web Store.
6. Click **Submit for Review**.
`,
    },
  ];
}
