// PrepInterview Copilot Content Script for LinkedIn Jobs
(function() {
  console.log('[PrepInterview Copilot] Content script initialized on', window.location.href);

  function findJobDetails() {
    // 1. Locate Job Description
    let desc = '';
    const descSelectors = [
      '#job-details',
      '.jobs-description__content',
      '.jobs-description-content__text',
      '.jobs-box__html-content',
      '.jobs-description',
      '[class*="jobs-description"]',
      'article'
    ];
    for (const sel of descSelectors) {
      const el = document.querySelector(sel);
      if (el && el.innerText && el.innerText.trim().length > 60) {
        desc = el.innerText.trim();
        break;
      }
    }

    // Fallback: search for "About the job" heading
    if (!desc) {
      const headings = Array.from(document.querySelectorAll('h2, h3, h4, h5, div, span'));
      for (const h of headings) {
        const txt = (h.textContent || '').trim().toLowerCase();
        if (txt === 'about the job' || txt === 'job description') {
          const parent = h.closest('section, article, div.jobs-description, div');
          if (parent && parent.innerText.length > 60) {
            desc = parent.innerText.trim();
            break;
          }
        }
      }
    }

    // 2. Locate Job Title
    let title = 'Target Role';
    const titleSelectors = [
      '.job-details-jobs-unified-top-card__job-title',
      '.jobs-unified-top-card__job-title',
      'h1.t-24',
      'h1'
    ];
    for (const sel of titleSelectors) {
      const el = document.querySelector(sel);
      if (el && el.innerText && el.innerText.trim().length > 1) {
        title = el.innerText.trim();
        break;
      }
    }

    // 3. Locate Company Name
    let company = '';
    const compSelectors = [
      '.job-details-jobs-unified-top-card__company-name',
      '.jobs-unified-top-card__company-name',
      '.job-details-jobs-unified-top-card__primary-description a',
      '[class*="company-name"]'
    ];
    for (const sel of compSelectors) {
      const el = document.querySelector(sel);
      if (el && el.innerText && el.innerText.trim().length > 1) {
        company = el.innerText.trim();
        break;
      }
    }

    // 4. Locate Injection Anchor Target
    let target = null;
    let position = 'after';

    // Strategy A: Find the Apply / Save button container
    const allButtons = Array.from(document.querySelectorAll('button, a'));
    const applyBtn = allButtons.find(b => {
      const t = (b.innerText || '').trim().toLowerCase();
      return t === 'apply' || t === 'easy apply';
    });

    if (applyBtn) {
      // Step up to the action bar container
      const actionsContainer = applyBtn.closest('.jobs-apply-button--top-card') 
        || applyBtn.closest('.jobs-unified-top-card__content--two-pane')
        || applyBtn.closest('.job-details-jobs-unified-top-card__container--two-pane')
        || applyBtn.parentElement.parentElement;
      if (actionsContainer) {
        target = actionsContainer;
        position = 'after';
      }
    }

    // Strategy B: Fallback right before "About the job" container or description
    if (!target) {
      const descEl = document.querySelector('#job-details, .jobs-description__content, .jobs-description');
      if (descEl) {
        target = descEl;
        position = 'before';
      }
    }

    return { desc, title, company, target, position };
  }

  async function injectOrUpdateWidget() {
    // Only proceed on LinkedIn job-related views
    if (!window.location.href.includes('linkedin.com/jobs')) {
      return;
    }

    const { desc, title, company, target, position } = findJobDetails();

    if (!desc || !target) {
      return;
    }

    // Check if card is already injected for this exact title
    const existing = document.getElementById('prepinterview-copilot-card');
    if (existing && existing.dataset.jobTitle === title) {
      return; // Already up to date
    }

    if (existing) {
      existing.remove();
    }

    console.log('[PrepInterview Copilot] Injecting widget for:', title, 'at', company);

    const { resumeText } = await chrome.storage.local.get(['resumeText']);
    const match = window.PrepInterviewMatcher.calculateMatch(resumeText, desc);

    const card = document.createElement('div');
    card.id = 'prepinterview-copilot-card';
    card.className = 'prepinterview-widget-card';
    card.dataset.jobTitle = title;

    const prepUrl = `https://prepinterview.online/?jd=${encodeURIComponent(desc)}&title=${encodeURIComponent(title)}&company=${encodeURIComponent(company)}&utm_source=linkedin_copilot`;

    if (match.status === 'no_resume') {
      card.innerHTML = `
        <div class="prepinterview-header" style="flex-direction:column; align-items:flex-start; gap:8px;">
          <div class="prepinterview-badge-row" style="width:100%; justify-content:space-between;">
            <span class="prepinterview-score-pill" style="background:#1f6feb22; color:#58a6ff; border-color:#1f6feb66;">
              🎯 PrepInterview Copilot
            </span>
            <span style="font-size:11px; color:#8b949e;">Click extension icon to save resume</span>
          </div>
          <div style="font-size:12px; color:#c9d1d9; line-height:1.4;">
            Save your resume once in the toolbar to see your <strong>Fit Score (80%+ High, 50% Moderate)</strong> and skill gaps here!
          </div>
          <a href="${prepUrl}" target="_blank" class="prepinterview-cta-btn" style="margin-top:6px;">
            🎙️ Practice Spoken Interview for this Job (1-Click) ↗
          </a>
        </div>
      `;
    } else {
      const matchPills = match.matchedSkills.length > 0 
        ? match.matchedSkills.map(s => `<span class="prepinterview-pill prepinterview-pill-match">✓ ${s}</span>`).join('')
        : '<span style="font-size:11px;color:#8b949e;">No core keyword overlaps</span>';

      const gapPills = match.missingSkills.length > 0 
        ? match.missingSkills.map(s => `<span class="prepinterview-pill prepinterview-pill-gap">⚠️ ${s}</span>`).join('')
        : '<span style="font-size:11px;color:#3fb950;">No critical gaps detected</span>';

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
            <span style="color:#8b949e;">Matched against <strong>${title}</strong> at <strong>${company || 'Hiring Company'}</strong></span>
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

      if (toggleHeader && detailsPanel && toggleBtn) {
        toggleHeader.addEventListener('click', (e) => {
          if (e.target.tagName.toLowerCase() === 'a') return;
          const isHidden = detailsPanel.classList.toggle('prepinterview-collapsed');
          toggleBtn.textContent = isHidden ? 'View Breakdown ▾' : 'Hide Breakdown ▴';
        });
      }
    }

    if (position === 'after') {
      target.insertAdjacentElement('afterend', card);
    } else {
      target.insertAdjacentElement('beforebegin', card);
    }
  }

  // Throttle mutation observer calls
  let debounceTimer = null;
  const observer = new MutationObserver(() => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(injectOrUpdateWidget, 400);
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

  // Run on page load and on popstate/navigation
  window.addEventListener('popstate', () => setTimeout(injectOrUpdateWidget, 800));
  setTimeout(injectOrUpdateWidget, 1000);
  setTimeout(injectOrUpdateWidget, 2500);
})();
