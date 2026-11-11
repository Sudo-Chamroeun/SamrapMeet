chrome.storage.local.get(['samrap_transcript'], (result) => {
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
  feed.innerHTML = list.map(s => `
    <div style="padding: 8px; margin-bottom: 6px; background: rgba(30,41,59,0.7); border-radius: 6px; font-size: 11px;">
      <strong style="color: #38bdf8;">${s.speaker}</strong>: <span>${s.text}</span>
    </div>
  `).join('');
}

function appendSegment(seg) {
  const feed = document.getElementById('sm-feed');
  if (!feed) return;
  const div = document.createElement('div');
  div.style.cssText = 'padding: 8px; margin-bottom: 6px; background: rgba(30,41,59,0.7); border-radius: 6px; font-size: 11px;';
  div.innerHTML = `<strong style="color: #38bdf8;">${seg.speaker}</strong>: <span>${seg.text}</span>`;
  feed.appendChild(div);
  feed.scrollTop = feed.scrollHeight;
}
