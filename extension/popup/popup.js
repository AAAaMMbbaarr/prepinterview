document.addEventListener('DOMContentLoaded', async () => {
  const resumeInput = document.getElementById('resumeInput');
  const saveBtn = document.getElementById('saveBtn');
  const clearBtn = document.getElementById('clearBtn');
  const charCount = document.getElementById('charCount');
  const saveToast = document.getElementById('saveToast');
  const profileCard = document.getElementById('profileCard');
  const profExp = document.getElementById('profExp');
  const profLoc = document.getElementById('profLoc');
  const profEdu = document.getElementById('profEdu');

  function updateWordCount() {
    const text = resumeInput.value.trim();
    const words = text ? text.split(/\s+/).length : 0;
    charCount.textContent = `${words} words`;
  }

  function updateProfilePreview() {
    const text = resumeInput.value.trim();
    if (!text || text.length < 20 || !window.PrepInterviewMatcher) {
      if (profileCard) profileCard.classList.add('hidden');
      return;
    }

    const exp = window.PrepInterviewMatcher.extractExperience(text);
    const loc = window.PrepInterviewMatcher.extractCandidateLocation(text);
    const edu = window.PrepInterviewMatcher.extractCandidateEducation(text);

    if (profExp) profExp.textContent = exp.label;
    if (profLoc) profLoc.textContent = loc.label;
    if (profEdu) profEdu.textContent = edu.label;

    if (profileCard) profileCard.classList.remove('hidden');
  }

  function refreshAll() {
    updateWordCount();
    updateProfilePreview();
  }

  // Load saved resume
  const stored = await chrome.storage.local.get(['resumeText']);
  if (stored.resumeText) {
    resumeInput.value = stored.resumeText;
    refreshAll();
  }

  resumeInput.addEventListener('input', refreshAll);

  saveBtn.addEventListener('click', async () => {
    const text = resumeInput.value.trim();
    await chrome.storage.local.set({ resumeText: text });
    refreshAll();
    saveToast.classList.remove('hidden');
    setTimeout(() => {
      saveToast.classList.add('hidden');
    }, 3000);
  });

  clearBtn.addEventListener('click', async () => {
    resumeInput.value = '';
    await chrome.storage.local.remove('resumeText');
    refreshAll();
  });
});
