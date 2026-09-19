document.addEventListener('DOMContentLoaded', async () => {
  const resumeInput = document.getElementById('resumeInput');
  const saveBtn = document.getElementById('saveBtn');
  const clearBtn = document.getElementById('clearBtn');
  const charCount = document.getElementById('charCount');
  const saveToast = document.getElementById('saveToast');
  const relocationToggle = document.getElementById('relocationToggle');

  function updateWordCount() {
    const text = resumeInput.value.trim();
    const words = text ? text.split(/\s+/).length : 0;
    charCount.textContent = `${words} words`;
  }

  // Load saved preferences
  const stored = await chrome.storage.local.get(['resumeText', 'openToRelocation']);
  if (stored.resumeText) {
    resumeInput.value = stored.resumeText;
    updateWordCount();
  }
  if (stored.openToRelocation !== undefined && relocationToggle) {
    relocationToggle.checked = Boolean(stored.openToRelocation);
  }

  resumeInput.addEventListener('input', updateWordCount);

  async function broadcastUpdate() {
    try {
      if (typeof chrome !== 'undefined' && chrome.tabs) {
        const tabs = await chrome.tabs.query({ url: '*://*.linkedin.com/*' });
        tabs.forEach(tab => {
          chrome.tabs.sendMessage(tab.id, { action: 'RESUME_UPDATED' }).catch(() => {});
        });
      }
    } catch (e) {}
  }

  if (relocationToggle) {
    relocationToggle.addEventListener('change', async () => {
      await chrome.storage.local.set({ openToRelocation: relocationToggle.checked });
      broadcastUpdate();
    });
  }

  saveBtn.addEventListener('click', async () => {
    const text = resumeInput.value.trim();
    const isRelocation = relocationToggle ? relocationToggle.checked : false;
    await chrome.storage.local.set({ resumeText: text, openToRelocation: isRelocation });
    updateWordCount();
    broadcastUpdate();
    saveToast.classList.remove('hidden');
    setTimeout(() => {
      saveToast.classList.add('hidden');
    }, 3000);
  });

  clearBtn.addEventListener('click', async () => {
    resumeInput.value = '';
    await chrome.storage.local.remove('resumeText');
    updateWordCount();
    broadcastUpdate();
  });
});
