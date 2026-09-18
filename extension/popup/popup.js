document.addEventListener('DOMContentLoaded', async () => {
  const resumeInput = document.getElementById('resumeInput');
  const saveBtn = document.getElementById('saveBtn');
  const clearBtn = document.getElementById('clearBtn');
  const charCount = document.getElementById('charCount');
  const saveToast = document.getElementById('saveToast');

  function updateWordCount() {
    const text = resumeInput.value.trim();
    const words = text ? text.split(/\s+/).length : 0;
    charCount.textContent = `${words} words`;
  }

  // Load saved resume
  const stored = await chrome.storage.local.get(['resumeText']);
  if (stored.resumeText) {
    resumeInput.value = stored.resumeText;
    updateWordCount();
  }

  resumeInput.addEventListener('input', updateWordCount);

  saveBtn.addEventListener('click', async () => {
    const text = resumeInput.value.trim();
    await chrome.storage.local.set({ resumeText: text });
    saveToast.classList.remove('hidden');
    setTimeout(() => {
      saveToast.classList.add('hidden');
    }, 3000);
  });

  clearBtn.addEventListener('click', async () => {
    resumeInput.value = '';
    await chrome.storage.local.remove('resumeText');
    updateWordCount();
  });
});
