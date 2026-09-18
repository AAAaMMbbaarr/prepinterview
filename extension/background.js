// PrepInterview Copilot Background Service Worker
chrome.runtime.onInstalled.addListener((details) => {
  console.log('[PrepInterview Copilot] Extension initialized:', details.reason);
});
