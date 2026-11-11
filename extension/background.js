/**
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
