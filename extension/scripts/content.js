// PrepInterview Copilot - True Pane Anchoring v1.0.5
(function() {
  console.log('[PrepInterview Copilot v1.0.5] Initialized');

  // --- 1. SKILL TAXONOMY & MATCHER ---
  const TAXONOMY = [
    // Tech & Engineering
    "python", "javascript", "typescript", "java", "c++", "c#", "golang", "go", "ruby", "php", "rust", "swift", "kotlin",
    "react", "react.js", "next.js", "vue", "angular", "node", "node.js", "express", "fastapi", "django", "flask", "spring boot",
    "aws", "amazon web services", "azure", "gcp", "google cloud", "docker", "kubernetes", "k8s", "terraform", "ci/cd", "github actions",
    "postgresql", "postgres", "mysql", "mongodb", "redis", "elasticsearch", "kafka", "rabbitmq", "dynamodb", "graphql", "rest api", "restful",
    "microservices", "system design", "distributed systems", "data structures", "algorithms", "scalability", "linux", "git",
    "machine learning", "deep learning", "nlp", "llm", "genai", "pytorch", "tensorflow", "computer vision", "pandas", "numpy", "scikit-learn",
    // Product, Strategy & Startup
    "founder office", "founders office", "chief of staff", "strategy", "execution", "startups", "high-growth", "operations", "scaling", "generalist", "cross-functional", "bizops", "business operations",
    "product management", "product manager", "product strategy", "product sense", "prd", "roadmap", "user research", "wireframing", "agile", "scrum", "jira",
    "a/b testing", "user stories", "retention", "churn", "funnel analysis", "north star metric", "sql", "tableau", "powerbi", "amplitude", "mixpanel",
    "google analytics", "customer discovery", "mvp", "feature prioritization", "stakeholder management", "program manager", "program management",
    "growth", "growth product", "onboarding", "lifecycle marketing", "conversion rate", "independent projects", "ai tools", "analytical thinking", "problem solving",
    // Business, MBA & Finance
    "market sizing", "go-to-market", "gtm", "financial modeling", "dcf", "unit economics", "p&l", "profit and loss", "vendor management",
    "roi", "business case", "valuation", "competitive analysis", "due diligence", "consulting frameworks", "swot", "m&a", "cross-border", "capital strategy",
    // Marketing & Sales
    "seo", "sem", "ppc", "performance marketing", "cac", "ltv", "hubspot", "salesforce", "lead generation", "cold outreach",
    "enterprise sales", "content strategy", "email marketing", "social media", "brand strategy", "copywriting", "growth hacking",
    // Operations & HR
    "talent acquisition", "recruiting", "employee relations", "performance management", "onboarding", "compensation", "compliance", "payroll"
  ];

  function normalize(str) {
    return (str || '').toLowerCase().replace(/'/g, '').replace(/[^a-z0-9+#./\s-]/g, ' ');
  }

  function extractSkills(text) {
    const norm = ' ' + normalize(text) + ' ';
    const found = new Set();
    for (const skill of TAXONOMY) {
      const pattern = new RegExp('(\\s|^)' + skill.replace(/[-/\^$*+?.()|[\]{}]/g, '\\$&') + '(\\s|$)', 'i');
      if (pattern.test(norm)) {
        found.add(skill);
      }
    }
    return Array.from(found);
  }

  function calculateMatch(resumeText, jdText, locationMeta, jobTitle, extraContext = {}) {
    const ctx = Object.assign({ locationMeta, jobTitle }, extraContext);
    if (window.PrepInterview && window.PrepInterview.Matcher && typeof window.PrepInterview.Matcher.evaluate === 'function') {
      return window.PrepInterview.Matcher.evaluate(resumeText, jdText, ctx);
    }
    if (window.PrepInterviewMatcher && typeof window.PrepInterviewMatcher.calculateMatch === 'function') {
      return window.PrepInterviewMatcher.calculateMatch(resumeText, jdText, locationMeta, jobTitle, ctx);
    }

    if (!resumeText || resumeText.trim().length < 20) {
      return {
        status: 'no_resume',
        score: 0,
        preClampScore: 0,
        breakdown: [],
        tier: 'Resume Needed',
        badge: '⚙️',
        color: '#8b949e',
        matchedSkills: [],
        missingSkills: [],
        hardGaps: [],
        softGaps: [],
        notes: [],
        disqualifiers: []
      };
    }

    const jdSkills = extractSkills(jdText);
    const resumeSkills = extractSkills(resumeText);

    const matched = [];
    const missing = [];

    for (const skill of jdSkills) {
      if (resumeSkills.includes(skill)) {
        matched.push(skill);
      } else {
        missing.push(skill);
      }
    }

    let score = 50;
    if (jdSkills.length > 0) {
      score = Math.round((matched.length / jdSkills.length) * 70 + 25);
    } else {
      const jdTokens = new Set(normalize(jdText).split(/\s+/).filter(w => w.length > 4));
      const resTokens = new Set(normalize(resumeText).split(/\s+/).filter(w => w.length > 4));
      let common = 0;
      jdTokens.forEach(t => { if (resTokens.has(t)) common++; });
      const ratio = common / Math.max(1, jdTokens.size);
      score = Math.min(68, Math.max(42, Math.round(ratio * 55 + 25)));
    }

    score = Math.max(20, Math.min(98, score));
    let tier = 'Reach Role (Critical Gaps)';
    let badge = '🔴';
    let color = '#f85149';

    if (score >= 80) {
      tier = 'Strong Match';
      badge = '🟢';
      color = '#3fb950';
    } else if (score >= 72) {
      tier = 'Good Match';
      badge = '🟢';
      color = '#2ea043';
    } else if (score >= 45) {
      tier = 'Moderate Match (Gaps to Defend)';
      badge = '🟡';
      color = '#d29922';
    }

    return {
      status: 'ready',
      score: score,
      preClampScore: score,
      breakdown: [{ label: 'Skills Overlap Base', points: score }],
      notes: [],
      hardGaps: [],
      softGaps: [],
      tier: tier,
      badge: badge,
      color: color,
      matchedSkills: matched.slice(0, 5),
      missingSkills: missing.slice(0, 4),
      disqualifiers: [],
      skillScore: score,
      totalJdSkills: jdSkills.length,
      lowConfidence: jdSkills.length < 3
    };
  }

  // --- 2. ACCURATE LINKEDIN DATA EXTRACTION (RESTRICTED TO JOB DETAILS PANE) ---

  function getJobDetailsPane() {
    // Finds the right-hand job details column on LinkedIn
    const pane = document.querySelector(
      '.scaffold-layout__detail, ' +
      '.jobs-search__job-details--container, ' +
      '.jobs-search__job-details, ' +
      'main .job-view-layout, ' +
      '.jobs-details__main-content, ' +
      '.job-details-jobs-unified-top-card'
    );
    if (pane) {
      return pane.closest('.scaffold-layout__detail') || pane;
    }
    return document.querySelector('.scaffold-layout__detail') || document.querySelector('main');
  }

  function getCurrentJobId() {
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('currentJobId');
    if (id) return id;
    const match = window.location.pathname.match(/\/jobs\/view\/(\d+)/);
    return match ? match[1] : window.location.href;
  }

  function getJobTitle(pane) {
    const titleEl = (pane || document).querySelector(
      '.job-details-jobs-unified-top-card__job-title, ' +
      '.jobs-unified-top-card__job-title, ' +
      '.job-details-jobs-unified-top-card h1, ' +
      '.jobs-unified-top-card h1, ' +
      '.scaffold-layout__detail h1, ' +
      'h1.t-24'
    );
    if (titleEl && titleEl.innerText.trim().length > 2) {
      return titleEl.innerText.trim();
    }
    return 'Target Role';
  }

  function getCompanyName(pane) {
    const compEl = (pane || document).querySelector(
      '.job-details-jobs-unified-top-card__company-name, ' +
      '.jobs-unified-top-card__company-name, ' +
      '.job-details-jobs-unified-top-card__primary-description a, ' +
      '.scaffold-layout__detail a[href*="/company/"]'
    );
    if (compEl && compEl.innerText.trim().length > 1) {
      return compEl.innerText.trim();
    }
    return '';
  }

  function getJobLocation(pane) {
    const locSelectors = [
      '.job-details-jobs-unified-top-card__primary-description-container',
      '.jobs-unified-top-card__primary-description',
      '.jobs-unified-top-card__bullet',
      '.jobs-unified-top-card__workplace-type',
      '.scaffold-layout__detail .jobs-unified-top-card__primary-description'
    ];
    for (const sel of locSelectors) {
      const el = (pane || document).querySelector(sel);
      if (el && el.innerText && el.innerText.trim().length > 2) {
        return el.innerText.trim();
      }
    }
    return '';
  }

  function expandLinkedInMoreButton(pane) {
    const moreButtons = Array.from((pane || document).querySelectorAll(
      'button.show-more-less-html__button, ' +
      'button.show-more-less-html__button--more, ' +
      'button[aria-label*="more description"], ' +
      'button[aria-label*="see more"], ' +
      '.jobs-description button, ' +
      '.scaffold-layout__detail button'
    ));

    for (const b of moreButtons) {
      const txt = (b.innerText || '').trim().toLowerCase();
      if (txt.includes('more') || txt.includes('see more') || txt.includes('show more')) {
        try {
          b.click();
        } catch (e) {}
        break;
      }
    }
  }

  function getFullJobDescription(pane) {
    expandLinkedInMoreButton(pane);

    let text = '';
    const jdSelectors = [
      '#job-details',
      '.jobs-description__content',
      '.jobs-description-content__text',
      '.jobs-box__html-content',
      '.jobs-description',
      'article.jobs-description__container',
      'article'
    ];

    const junkSelectors = [
      '#prepinterview-copilot-card',
      '.jobs-premium-applicant-insights',
      '[data-view-name*="applicant-insights"]',
      '.jobs-unified-top-card__applicant-count',
      '.jobs-premium-insights',
      '.hiring-team',
      '.jobs-poster-profile',
      '.jobs-company__box',
      '.artdeco-card',
      'button',
      'svg',
      '[role="button"]'
    ].join(',');

    for (const sel of jdSelectors) {
      const el = (pane || document).querySelector(sel);
      if (el && el.innerText && el.innerText.trim().length > 100) {
        const clone = el.cloneNode(true);
        try {
          clone.querySelectorAll(junkSelectors).forEach(n => n.remove());
        } catch (e) {}
        text = clone.innerText.trim();
        break;
      }
    }

    if (!text && pane) {
      const clone = pane.cloneNode(true);
      try {
        clone.querySelectorAll(junkSelectors).forEach(n => n.remove());
        const topCard = clone.querySelector('.job-details-jobs-unified-top-card, .jobs-unified-top-card, [class*="top-card"]');
        if (topCard) topCard.remove();
      } catch (e) {}
      text = clone.innerText.trim();
    }

    text = text.replace(/^about the job\s*/i, '');
    text = text.replace(/\s*\.\.\.\s*more\s*$/gi, '');
    text = text.replace(/\s*see more\s*$/gi, '');
    text = text.replace(/\s*show more\s*$/gi, '');

    return text.trim();
  }

  function getAnchorElement(pane) {
    if (!pane) return null;

    // 1. Target the action row (Apply / Save button bar) INSIDE the pane
    const actionRow = pane.querySelector(
      '.jobs-apply-button--top-card, ' +
      '.job-details-jobs-unified-top-card__container--two-pane, ' +
      '.jobs-unified-top-card__content--two-pane, ' +
      '.job-details-jobs-unified-top-card__actions-container, ' +
      '.job-details-jobs-unified-top-card'
    );

    if (actionRow) {
      return actionRow;
    }

    // 2. Find Apply / Save button inside pane (NEVER in top navbar)
    const buttons = Array.from(pane.querySelectorAll('button, a'));
    const actionBtn = buttons.find(b => {
      const t = (b.innerText || '').trim().toLowerCase();
      return t === 'apply' || t === 'easy apply' || t === 'save';
    });

    if (actionBtn) {
      const parent = actionBtn.closest('div');
      if (parent && parent !== pane) return parent;
    }

    return pane.querySelector('#job-details, .jobs-description__content, .jobs-description');
  }

  // --- 3. WIDGET INJECTION & LIFECYCLE ---

  async function runInjection() {
    if (!window.location.href.includes('linkedin.com/jobs')) {
      return;
    }

    const pane = getJobDetailsPane();
    if (!pane) {
      return;
    }

    const jobId = getCurrentJobId();
    const existing = document.getElementById('prepinterview-copilot-card');

    const desc = getFullJobDescription(pane);
    const title = getJobTitle(pane);
    const company = getCompanyName(pane);
    const anchor = getAnchorElement(pane);

    if (!desc || desc.length < 40 || !anchor) {
      return;
    }

    let resumeText = '';
    let openToRelocation = false;
    try {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        const stored = await chrome.storage.local.get(['resumeText', 'openToRelocation']);
        resumeText = stored.resumeText || '';
        openToRelocation = Boolean(stored.openToRelocation);
      }
    } catch (e) {
      console.warn('[PrepInterview Copilot] Storage notice:', e);
    }

    const resumeFingerprint = (resumeText ? (resumeText.length + '_' + resumeText.slice(0, 40).replace(/\s+/g, '')) : 'none') + (openToRelocation ? '_reloc' : '');

    if (existing && existing.dataset.jobId === jobId && existing.dataset.resumeFingerprint === resumeFingerprint) {
      return;
    }

    if (existing) {
      existing.remove();
    }

    console.log('[PrepInterview Copilot] Anchored in Job Pane:', title, 'at', company, '(JD Length:', desc.length, 'chars)');

    const locationMeta = getJobLocation(pane);
    const match = calculateMatch(resumeText, desc, locationMeta, title, { openToRelocation });

    const card = document.createElement('div');
    card.id = 'prepinterview-copilot-card';
    card.className = 'prepinterview-widget-card';
    card.dataset.jobId = jobId;
    card.dataset.jobTitle = title;
    card.dataset.resumeFingerprint = resumeFingerprint;

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
            Save your resume once in the Chrome toolbar to see your <strong>Skill Match</strong>, experience, location, and education fit for <strong>${title}</strong>!
          </div>
          <a href="#" class="prepinterview-cta-btn prepinterview-action-trigger" style="margin-top:6px;">
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
        : (match.score >= 80
            ? '<span style="font-size:11px;color:#3fb950;">No critical skill gaps detected</span>'
            : '<span class="prepinterview-pill prepinterview-pill-gap">⚠️ Functional domain alignment required</span>');

      // 1. Hard Gaps (Red Pills)
      const hardGapsList = (Array.isArray(match.hardGaps) && match.hardGaps.length > 0)
        ? match.hardGaps
        : (Array.isArray(match.disqualifiers) ? match.disqualifiers : []);

      const hardGapsHtml = hardGapsList.length > 0
        ? `
          <div class="prepinterview-label" style="color:#ff7b72; margin-top:10px;">⛔ Hard Requirement Gaps (${hardGapsList.length})</div>
          <div class="prepinterview-pills-row">
            ${hardGapsList.map(g => `<span class="prepinterview-pill prepinterview-pill-hard">⛔ ${g}</span>`).join('')}
          </div>
        `
        : `
          <div class="prepinterview-line-green" style="margin-top:8px;">✓ No hard disqualifying gaps detected</div>
        `;

      // 2. Soft Gaps & Notes (Amber Lines)
      const amberItems = [];
      if (Array.isArray(match.softGaps)) {
        match.softGaps.forEach(g => { if (!amberItems.includes(g)) amberItems.push(g); });
      }
      if (Array.isArray(match.notes)) {
        match.notes.forEach(n => { if (!amberItems.includes(n)) amberItems.push(n); });
      }

      const amberLinesHtml = amberItems.length > 0
        ? `
          <div class="prepinterview-label" style="color:#d29922; margin-top:10px;">⚠️ Soft Notes & Profile Considerations (${amberItems.length})</div>
          <div class="prepinterview-amber-block" style="margin: 6px 0 10px 0;">
            ${amberItems.map(item => `<div class="prepinterview-line-amber">🔸 ${item}</div>`).join('')}
          </div>
        `
        : '';

      // 3. Low Confidence Notice
      const lowConfidenceHtml = match.lowConfidence
        ? `
          <div class="prepinterview-line-amber" style="margin: 8px 0; font-size:11px;">
            ⚠️ <strong>Low Extraction Confidence:</strong> Fewer than 3 structured skills found in JD (${match.totalJdSkills || 0} detected). Fallback keyword matching was applied.
          </div>
        `
        : '';

      // 4. "How this score was built" Section
      const breakdownItems = Array.isArray(match.breakdown) ? match.breakdown : [];
      let breakdownRowsHtml = `
        <div class="prepinterview-breakdown-row" style="display:flex; justify-content:space-between; padding:5px 0; border-bottom:1px solid #21262d; font-size:11px;">
          <span style="color:#c9d1d9;">Base Skills Match</span>
          <span style="font-weight:700; color:#58a6ff;">+${match.skillScore !== undefined ? match.skillScore : 50} pts</span>
        </div>
      `;

      breakdownItems.forEach(item => {
        const isPositive = item.points > 0;
        const color = isPositive ? '#3fb950' : (item.points === 0 ? '#8b949e' : '#ff7b72');
        const sign = isPositive ? '+' : '';
        breakdownRowsHtml += `
          <div class="prepinterview-breakdown-row" style="display:flex; justify-content:space-between; padding:5px 0; border-bottom:1px solid #21262d; font-size:11px;">
            <span style="color:#8b949e;">${item.label}</span>
            <span style="font-weight:600; color:${color};">${sign}${item.points} pts</span>
          </div>
        `;
      });

      const preClampDisplay = (match.preClampScore !== undefined && match.preClampScore !== match.score)
        ? `<div style="font-size:10px; color:#8b949e; text-align:right; margin-top:6px;">Pre-clamp: ${match.preClampScore} pts → Clamped [20–98]: <strong>${match.score}%</strong></div>`
        : '';

      const howBuiltHtml = `
        <div class="prepinterview-how-built-card" style="background:#161b22; border:1px solid #30363d; border-radius:8px; padding:10px 12px; margin-top:12px;">
          <div class="prepinterview-label" style="color:#58a6ff; margin-bottom:8px; display:flex; justify-content:space-between; align-items:center;">
            <span>📊 How this score was built</span>
            <span style="color:#f0f6fc; font-weight:700;">${match.score}% (${match.tier})</span>
          </div>
          ${lowConfidenceHtml}
          <div class="prepinterview-breakdown-list">
            ${breakdownRowsHtml}
          </div>
          ${preClampDisplay}
        </div>
      `;

      // 5. Relocation Toggle in Card
      const relocationToggleHtml = `
        <div class="prepinterview-relocation-row" style="display:flex; justify-content:space-between; align-items:center; margin-top:10px; padding:8px 10px; background:#161b22; border-radius:6px; border:1px solid #30363d;">
          <div>
            <div style="font-size:11px; font-weight:600; color:#f0f6fc;">✈️ Open to Relocation</div>
            <div style="font-size:10px; color:#8b949e;">Waives on-site location mismatch disqualifier</div>
          </div>
          <label class="switch" style="position:relative; display:inline-block; width:34px; height:18px; margin:0; flex-shrink:0;">
            <input type="checkbox" id="prepinterview-card-relocation-toggle" ${openToRelocation ? 'checked' : ''} style="opacity:0; width:0; height:0;">
            <span class="slider round" style="position:absolute; cursor:pointer; top:0; left:0; right:0; bottom:0; background-color:${openToRelocation ? '#238636' : '#30363d'}; transition:.2s; border-radius:18px;">
              <span style="position:absolute; height:14px; width:14px; left:${openToRelocation ? '17px' : '3px'}; bottom:2px; background-color:white; transition:.2s; border-radius:50%;"></span>
            </span>
          </label>
        </div>
      `;

      card.innerHTML = `
        <div class="prepinterview-header" id="prepinterview-toggle-header">
          <div class="prepinterview-badge-row">
            <span class="prepinterview-score-pill" style="background:${match.color}22; color:${match.color}; border-color:${match.color}66;">
              ${match.badge} ${match.score}% Role Match
            </span>
            <span class="prepinterview-brand-title">${match.tier}</span>
          </div>
          <button class="prepinterview-toggle-btn" id="prepinterview-toggle-btn">View Match Insights ▾</button>
        </div>

        <div class="prepinterview-details prepinterview-collapsed" id="prepinterview-details-panel">
          <div style="display:flex; justify-content:space-between; margin-bottom:10px; font-size:11px; flex-wrap:wrap; gap:6px;">
            <span style="color:#8b949e;">Evaluated against <strong>${title}</strong> ${company ? 'at <strong>' + company + '</strong>' : ''}</span>
            <span style="color:#58a6ff; font-weight:600;">✨ Multi-Factor Match Evaluation</span>
          </div>

          ${hardGapsHtml}
          ${amberLinesHtml}
          ${relocationToggleHtml}
          ${howBuiltHtml}

          <div class="prepinterview-label" style="margin-top:12px;">🟢 Matched Strengths (${match.matchedSkills.length})</div>
          <div class="prepinterview-pills-row">
            ${matchPills}
          </div>

          <div class="prepinterview-label">🎯 Key Focus Areas for Interview (${match.missingSkills.length})</div>
          <div class="prepinterview-pills-row">
            ${gapPills}
          </div>

          <a href="#" class="prepinterview-cta-btn prepinterview-action-trigger">
            🎙️ Practice Spoken Interview for this Job (1-Click) ↗
          </a>
        </div>
      `;

      const toggleHeader = card.querySelector('#prepinterview-toggle-header');
      const detailsPanel = card.querySelector('#prepinterview-details-panel');
      const toggleBtn = card.querySelector('#prepinterview-toggle-btn');

      if (toggleHeader && detailsPanel && toggleBtn) {
        toggleHeader.addEventListener('click', (e) => {
          e.stopPropagation();
          const isHidden = detailsPanel.classList.toggle('prepinterview-collapsed');
          toggleBtn.textContent = isHidden ? 'View Match Insights ▾' : 'Hide Match Insights ▴';
        });
      }

      const relToggle = card.querySelector('#prepinterview-card-relocation-toggle');
      if (relToggle) {
        relToggle.addEventListener('change', async (e) => {
          e.stopPropagation();
          const val = e.target.checked;
          try {
            if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
              await chrome.storage.local.set({ openToRelocation: val });
            }
          } catch (err) {}
          card.remove();
          runInjection();
        });
      }
    }

    // 1-Click CTA Launch handler: always captures full expanded description
    const ctaButtons = card.querySelectorAll('.prepinterview-action-trigger');
    ctaButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        expandLinkedInMoreButton(pane);
        const latestDesc = getFullJobDescription(pane) || desc;
        const targetUrl = 'https://prepinterview.online/?jd=' + encodeURIComponent(latestDesc) +
                          '&title=' + encodeURIComponent(title) +
                          '&company=' + encodeURIComponent(company) +
                          '&utm_source=linkedin_copilot';
        window.open(targetUrl, '_blank');
      });
    });

    // Insert cleanly below action buttons inside the job details pane
    anchor.insertAdjacentElement('afterend', card);

    // Floating pill indicator
    let floatPill = document.getElementById('prepinterview-floating-pill');
    if (!floatPill) {
      floatPill = document.createElement('div');
      floatPill.id = 'prepinterview-floating-pill';
      floatPill.className = 'prepinterview-floating-pill';
      document.body.appendChild(floatPill);
      floatPill.addEventListener('click', (e) => {
        e.stopPropagation();
        card.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
    }
    floatPill.innerHTML = `🎯 PrepInterview: <strong>${match.score > 0 ? match.score + '%' : 'Copilot Active'}</strong>`;
  }

  // --- 4. SAFE MUTATION OBSERVER ---
  let debounceTimer = null;
  const observer = new MutationObserver((mutations) => {
    const isOurMutation = mutations.every(m => {
      const target = m.target;
      return target && target.closest && (target.closest('#prepinterview-copilot-card') || target.closest('#prepinterview-floating-pill'));
    });
    if (isOurMutation) return;

    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(runInjection, 300);
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

  setTimeout(runInjection, 800);
  setTimeout(runInjection, 2000);
  window.addEventListener('popstate', () => setTimeout(runInjection, 400));

  // Listen for resume changes in local storage
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.onChanged) {
    chrome.storage.onChanged.addListener((changes, areaName) => {
      if (areaName === 'local' && (changes.resumeText || changes.openToRelocation)) {
        console.log('[PrepInterview Copilot] Settings updated in storage, refreshing card...');
        const existing = document.getElementById('prepinterview-copilot-card');
        if (existing) existing.remove();
        runInjection();
      }
    });
  }

  // Listen for direct broadcast messages from popup
  if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
    chrome.runtime.onMessage.addListener((msg) => {
      if (msg && msg.action === 'RESUME_UPDATED') {
        console.log('[PrepInterview Copilot] Received RESUME_UPDATED, refreshing card...');
        const existing = document.getElementById('prepinterview-copilot-card');
        if (existing) existing.remove();
        runInjection();
      }
    });
  }
})();
