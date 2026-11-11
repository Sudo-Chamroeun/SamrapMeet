/**
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
  hud.innerHTML = `
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
  `;

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

    // Search for active caption speaker bubbles and text nodes in Google Meet
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
  const kmRegex = /[\u1780-\u17FF]/g;
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
