// PrepInterview Copilot - Popup Script (Beta)
document.addEventListener('DOMContentLoaded', async () => {
  const resumeInput = document.getElementById('resumeInput');
  const saveBtn = document.getElementById('saveBtn');
  const clearBtn = document.getElementById('clearBtn');
  const charCount = document.getElementById('charCount');
  const saveToast = document.getElementById('saveToast');
  const relocationToggle = document.getElementById('relocationToggle');
  const feedbackLink = document.getElementById('feedbackLink');

  // Setup Feedback Link
  const relConfig = (window.PrepInterview && window.PrepInterview.ReleaseConfig) || null;
  if (feedbackLink) {
    if (relConfig && relConfig.FEEDBACK_URL && relConfig.FEEDBACK_URL !== 'REPLACE_ME' && relConfig.FEEDBACK_URL.trim() !== '') {
      feedbackLink.href = relConfig.FEEDBACK_URL;
      feedbackLink.style.display = '';
      feedbackLink.addEventListener('click', (e) => {
        e.preventDefault();
        window.open(relConfig.FEEDBACK_URL, '_blank', 'noopener,noreferrer');
      });
    } else {
      feedbackLink.style.display = 'none';
    }
  }

  function updateWordCount() {
    const text = resumeInput.value.trim();
    const words = text ? text.split(/\s+/).length : 0;
    charCount.textContent = `${words} words`;
  }

  // Load saved preferences
  try {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      const stored = await chrome.storage.local.get(['resumeText', 'openToRelocation']);
      if (stored.resumeText) {
        resumeInput.value = stored.resumeText;
        updateWordCount();
      }
      if (stored.openToRelocation !== undefined && relocationToggle) {
        relocationToggle.checked = Boolean(stored.openToRelocation);
      }
    }
  } catch (e) {
    console.warn('[PrepInterview] Error reading storage:', e);
  }

  resumeInput.addEventListener('input', updateWordCount);

  function broadcastUpdate() {
    try {
      if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
        chrome.runtime.sendMessage({ action: 'SETTINGS_UPDATED' }).catch(() => {});
      }
      if (typeof chrome !== 'undefined' && chrome.tabs && chrome.tabs.query) {
        chrome.tabs.query({ url: '*://*.linkedin.com/*' }, (tabs) => {
          if (tabs && tabs.length) {
            tabs.forEach(tab => {
              if (tab.id) {
                chrome.tabs.sendMessage(tab.id, { action: 'SETTINGS_UPDATED' }).catch(() => {});
              }
            });
          }
        });
      }
    } catch (e) {}
  }

  if (relocationToggle) {
    relocationToggle.addEventListener('change', async () => {
      try {
        if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
          await chrome.storage.local.set({ openToRelocation: relocationToggle.checked });
        }
      } catch (e) {}
      broadcastUpdate();
    });
  }

  saveBtn.addEventListener('click', async () => {
    const text = resumeInput.value.trim();
    const isRelocation = relocationToggle ? relocationToggle.checked : false;
    try {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        await chrome.storage.local.set({ resumeText: text, openToRelocation: isRelocation });
      }
    } catch (e) {}
    updateWordCount();
    broadcastUpdate();
    saveToast.textContent = 'Preferences saved! Active on LinkedIn.';
    saveToast.classList.remove('hidden');
    setTimeout(() => {
      saveToast.classList.add('hidden');
    }, 3000);
  });

  // Clear action deletes ALL stored extension data (resume and settings) and says so
  clearBtn.addEventListener('click', async () => {
    resumeInput.value = '';
    if (relocationToggle) relocationToggle.checked = false;
    try {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        await chrome.storage.local.clear();
      }
    } catch (e) {}
    updateWordCount();
    broadcastUpdate();
    saveToast.textContent = 'All stored extension data (resume and settings) deleted.';
    saveToast.classList.remove('hidden');
    setTimeout(() => {
      saveToast.classList.add('hidden');
    }, 3500);
  });
});
