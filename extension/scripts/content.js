// PrepInterview Copilot Content Script for LinkedIn Jobs
(function() {
  let lastCheckedUrl = '';
  let activeWidget = null;

  function getJobElements() {
    // LinkedIn Job Description selectors
    const descEl = document.querySelector('.jobs-description__content, .jobs-box__html-content, #job-details, .jobs-description-content__text');
    // Job Title selectors
    const titleEl = document.querySelector('.job-details-jobs-unified-top-card__job-title, .jobs-unified-top-card__job-title, h1.t-24, h1');
    // Company Name selectors
    const companyEl = document.querySelector('.job-details-jobs-unified-top-card__company-name, .jobs-unified-top-card__company-name, .job-details-jobs-unified-top-card__primary-description a');
    // Injection Target (Top card or right above description)
    const targetEl = document.querySelector('.job-details-jobs-unified-top-card__container--two-pane, .jobs-unified-top-card__content--two-pane, .job-details-jobs-unified-top-card__actions-container') || descEl;

    return {
      desc: descEl ? descEl.innerText : '',
      title: titleEl ? titleEl.innerText.trim() : 'Target Role',
      company: companyEl ? companyEl.innerText.trim() : 'Company',
      target: targetEl
    };
  }

  async function injectOrUpdateWidget() {
    const { desc, title, company, target } = getJobElements();

    if (!desc || desc.length < 50 || !target) {
      return;
    }

    // Check if widget already exists for this exact container
    const existing = document.getElementById('prepinterview-copilot-card');
    if (existing && existing.dataset.jobTitle === title) {
      return; // Already up to date for this job
    }

    if (existing) {
      existing.remove();
    }

    const { resumeText } = await chrome.storage.local.get(['resumeText']);
    const match = window.PrepInterviewMatcher.calculateMatch(resumeText, desc);

    const card = document.createElement('div');
    card.id = 'prepinterview-copilot-card';
    card.className = 'prepinterview-widget-card';
    card.dataset.jobTitle = title;

    if (match.status === 'no_resume') {
      card.innerHTML = `
        <div class="prepinterview-header">
          <div class="prepinterview-badge-row">
            <span class="prepinterview-score-pill" style="background:#161b22; color:#8b949e; border-color:#30363d;">
              ⚙️ PrepInterview Copilot
            </span>
            <span class="prepinterview-brand-title">Save your resume to see your Fit Score</span>
          </div>
        </div>
        <div style="margin-top:8px; font-size:12px; color:#8b949e;">
          Open the PrepInterview extension in your browser toolbar to paste your resume once.
        </div>
      `;
    } else {
      const matchPills = match.matchedSkills.length > 0 
        ? match.matchedSkills.map(s => `<span class="prepinterview-pill prepinterview-pill-match">✓ ${s}</span>`).join('')
        : '<span style="font-size:11px;color:#8b949e;">No core keyword overlaps</span>';

      const gapPills = match.missingSkills.length > 0 
        ? match.missingSkills.map(s => `<span class="prepinterview-pill prepinterview-pill-gap">⚠️ ${s}</span>`).join('')
        : '<span style="font-size:11px;color:#3fb950;">No critical gaps detected</span>';

      const prepUrl = `https://prepinterview.online/?jd=${encodeURIComponent(desc)}&title=${encodeURIComponent(title)}&company=${encodeURIComponent(company)}&utm_source=linkedin_copilot`;

      card.innerHTML = `
        <div class="prepinterview-header" id="prepinterview-toggle-header">
          <div class="prepinterview-badge-row">
            <span class="prepinterview-score-pill" style="background:${match.color}22; color:${match.color}; border-color:${match.color}66;">
              ${match.badge} ${match.score}% Fit Score
            </span>
            <span class="prepinterview-brand-title">${match.tier}</span>
          </div>
          <button class="prepinterview-toggle-btn" id="prepinterview-toggle-btn">View Breakdown ▾</button>
        </div>

        <div class="prepinterview-details" id="prepinterview-details-panel">
          <div style="display:flex; justify-content:space-between; margin-bottom:8px; font-size:11px;">
            <span style="color:#8b949e;">Matched against <strong>${title}</strong> at <strong>${company}</strong></span>
          </div>
          
          <div class="prepinterview-label">🟢 Matched Strengths (${match.matchedSkills.length})</div>
          <div class="prepinterview-pills-row">
            ${matchPills}
          </div>

          <div class="prepinterview-label">🔴 Expected Gaps to Defend (${match.missingSkills.length})</div>
          <div class="prepinterview-pills-row">
            ${gapPills}
          </div>

          <a href="${prepUrl}" target="_blank" class="prepinterview-cta-btn">
            🎙️ Practice Spoken Interview for this Job (1-Click) ↗
          </a>
        </div>
      `;

      // Toggle breakdown event
      const toggleHeader = card.querySelector('#prepinterview-toggle-header');
      const detailsPanel = card.querySelector('#prepinterview-details-panel');
      const toggleBtn = card.querySelector('#prepinterview-toggle-btn');

      toggleHeader.addEventListener('click', (e) => {
        if (e.target.tagName.toLowerCase() === 'a') return;
        const isHidden = detailsPanel.classList.toggle('prepinterview-collapsed');
        toggleBtn.textContent = isHidden ? 'View Breakdown ▾' : 'Hide Breakdown ▴';
      });
    }

    // Insert widget right at top of target or description
    target.prepend(card);
  }

  // Observe DOM for dynamic page changes in LinkedIn single-page app
  const observer = new MutationObserver(() => {
    if (window.location.href.includes('/jobs/')) {
      injectOrUpdateWidget();
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

  // Initial check on load
  setTimeout(injectOrUpdateWidget, 1500);
})();
