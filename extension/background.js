// Text Armor — Background Service Worker (Manifest V3)
// Maintains persistent state across browser sessions and broadcasts live to all tabs.

const DEFAULT_SETTINGS = {
  active_shield_enabled: true,
  reader_shield_enabled: true,
  strict_parental_mode: false
};

// Initialize settings on install or browser startup without overwriting existing state
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get(['active_shield_enabled', 'reader_shield_enabled', 'strict_parental_mode'], (stored) => {
    const toSet = {};
    if (typeof stored.active_shield_enabled !== 'boolean') toSet.active_shield_enabled = true;
    if (typeof stored.reader_shield_enabled !== 'boolean') toSet.reader_shield_enabled = true;
    if (typeof stored.strict_parental_mode !== 'boolean') toSet.strict_parental_mode = false;
    if (Object.keys(toSet).length > 0) {
      chrome.storage.local.set(toSet);
    }
  });
});

// Broadcast settings to all open web tabs
function broadcastToTabs(settings) {
  if (typeof chrome !== 'undefined' && chrome.tabs && chrome.tabs.query) {
    chrome.tabs.query({}, (tabs) => {
      if (!tabs) return;
      for (const tab of tabs) {
        if (tab && tab.id) {
          chrome.tabs.sendMessage(tab.id, {
            type: 'TEXT_ARMOR_SETTINGS_CHANGED',
            settings: settings
          }).catch(() => {
            // Tab may not have content script injected yet
          });
        }
      }
    });
  }
}

// Handle runtime messages from popup and content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'GET_SETTINGS') {
    chrome.storage.local.get(Object.keys(DEFAULT_SETTINGS), (res) => {
      sendResponse({
        active_shield_enabled: res.active_shield_enabled !== false,
        reader_shield_enabled: res.reader_shield_enabled !== false,
        strict_parental_mode: res.strict_parental_mode === true
      });
    });
    return true; // Keep sendResponse port open for async handling
  }

  if (message.type === 'SET_SETTINGS') {
    chrome.storage.local.set(message.settings, () => {
      broadcastToTabs(message.settings);
      sendResponse({ success: true, settings: message.settings });
    });
    return true;
  }
});
