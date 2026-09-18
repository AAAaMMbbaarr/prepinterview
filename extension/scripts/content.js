// PrepInterview Copilot - Clean Content Script & Matcher
(function() {
  console.log('[PrepInterview Copilot] Loaded on:', window.location.href);

  // --- 1. SKILL TAXONOMY & MATCHER ---
  const TAXONOMY = [
    // Tech & Engineering
    "python", "javascript", "typescript", "java", "c++", "c#", "golang", "go", "ruby", "php", "rust", "swift", "kotlin",
    "react", "react.js", "next.js", "vue", "angular", "node", "node.js", "express", "fastapi", "django", "flask", "spring boot",
    "aws", "amazon web services", "azure", "gcp", "google cloud", "docker", "kubernetes", "k8s", "terraform", "ci/cd", "github actions",
    "postgresql", "postgres", "mysql", "mongodb", "redis", "elasticsearch", "kafka", "rabbitmq", "dynamodb", "graphql", "rest api", "restful",
    "microservices", "system design", "distributed systems", "data structures", "algorithms", "scalability", "linux", "git",
    "machine learning", "deep learning", "nlp", "llm", "genai", "pytorch", "tensorflow", "computer vision", "pandas", "numpy", "scikit-learn",
    // Product & Analytics
    "product management", "product strategy", "product sense", "prd", "roadmap", "user research", "wireframing", "agile", "scrum", "jira",
    "a/b testing", "user stories", "retention", "churn", "funnel analysis", "north star metric", "sql", "tableau", "powerbi", "amplitude", "mixpanel",
    "google analytics", "customer discovery", "mvp", "feature prioritization", "stakeholder management", "program manager", "program management",
    // Business, MBA & Strategy
    "market sizing", "go-to-market", "gtm", "financial modeling", "dcf", "unit economics", "p&l", "profit and loss", "vendor management",
    "roi", "business case", "valuation", "competitive analysis", "due diligence", "consulting frameworks", "swot", "m&a",
    // Marketing & Sales
    "seo", "sem", "ppc", "performance marketing", "cac", "ltv", "hubspot", "salesforce", "lead generation", "cold outreach",
    "enterprise sales", "content strategy", "email marketing", "social media", "brand strategy", "copywriting", "growth hacking",
    // Operations & HR
    "talent acquisition", "recruiting", "employee relations", "performance management", "onboarding", "compensation", "compliance", "payroll"
  ];

  function normalize(str) {
    return (str || '').toLowerCase().replace(/[^a-z0-9+#./\s-]/g, ' ');
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

  function calculateMatch(resumeText, jdText) {
    if (!resumeText || resumeText.trim().length < 20) {
      return {
        status: 'no_resume',
        score: 0,
        tier: 'Resume Needed',
        badge: '⚙️',
        color: '#8b949e',
        matchedSkills: [],
        missingSkills: []
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
      score = Math.round((matched.length / jdSkills.length) * 75 + 20);
    } else {
      const jdTokens = new Set(normalize(jdText).split(/\s+/).filter(w => w.length > 4));
      const resTokens = new Set(normalize(resumeText).split(/\s+/).filter(w => w.length > 4));
      let common = 0;
      jdTokens.forEach(t => { if (resTokens.has(t)) common++; });
      score = Math.min(90, Math.round((common / Math.max(1, jdTokens.size)) * 120 + 20));
    }

    score = Math.max(25, Math.min(95, score));
    let tier = 'Reach Role';
    let badge = '🔴';
    let color = '#f85149';

    if (score >= 78) {
      tier = 'Strong Match';
      badge = '🟢';
      color = '#3fb950';
    } else if (score >= 55) {
      tier = 'Moderate Match';
      badge = '🟡';
      color = '#d29922';
    }

    return {
      status: 'ready',
      score: score,
      tier: tier,
      badge: badge,
      color: color,
      matchedSkills: matched.slice(0, 5),
      missingSkills: missing.slice(0, 4)
    };
  }

  // --- 2. CLEAN ELEMENT EXTRACTORS ---

  function getCleanJobTitle(pane) {
    const titleSelectors = [
      '.job-details-jobs-unified-top-card__job-title',
      '.jobs-unified-top-card__job-title',
      'h1.t-24',
      'h1',
      'h2'
    ];

    const forbidden = ['easy apply', 'apply', 'save', 'preferences', 'prepinterview', 'fit score', 'linkedin', 'share', 'notification'];

    for (const sel of titleSelectors) {
      const elements = Array.from((pane || document).querySelectorAll(sel));
      for (const el of elements) {
        if (el.closest('#prepinterview-copilot-card')) continue;
        const txt = (el.innerText || '').trim();
        const lower = txt.toLowerCase();
        const isForbidden = forbidden.some(f => lower.includes(f));
        if (txt.length > 3 && txt.length < 80 && !isForbidden) {
          return txt;
        }
      }
    }
    return 'Target Role';
  }

  function getCleanCompanyName(pane) {
    const compLink = (pane || document).querySelector('.job-details-jobs-unified-top-card__company-name a, .jobs-unified-top-card__company-name a, a[href*="/company/"]');
    if (compLink && compLink.innerText.trim().length > 1) {
      return compLink.innerText.trim();
    }
    const compEl = (pane || document).querySelector('.job-details-jobs-unified-top-card__company-name, .jobs-unified-top-card__company-name');
    if (compEl && compEl.innerText.trim().length > 1) {
      return compEl.innerText.trim();
    }
    return '';
  }

  function getCleanJobDescription(pane) {
    // 1. Check for dedicated LinkedIn description container
    const jdSelectors = [
      '#job-details',
      '.jobs-description__content',
      '.jobs-description-content__text',
      '.jobs-box__html-content',
      '.jobs-description',
      '[class*="jobs-description"]'
    ];

    for (const sel of jdSelectors) {
      const el = (pane || document).querySelector(sel);
      if (el && el.innerText && el.innerText.trim().length > 80) {
        let text = el.innerText.trim();
        text = text.replace(/^about the job\s*/i, '');
        return text;
      }
    }

    // 2. Fallback: clone pane and strip top cards, buttons, and our card
    if (pane) {
      const clone = pane.cloneNode(true);
      const ourCard = clone.querySelector('#prepinterview-copilot-card');
      if (ourCard) ourCard.remove();
      const ourPill = clone.querySelector('#prepinterview-floating-pill');
      if (ourPill) ourPill.remove();

      clone.querySelectorAll('button, .artdeco-button, svg, [role="button"], [class*="top-card"], [class*="actions"], header, nav').forEach(el => el.remove());

      let text = clone.innerText.trim();
      // Remove button residual lines
      text = text.replace(/^(easy apply|apply|save|share|\s)+/gi, '');
      return text.trim();
    }

    return '';
  }

  function findJobContext() {
    const allButtons = Array.from(document.querySelectorAll('button, a'));
    const actionBtn = allButtons.find(el => {
      const t = (el.innerText || '').trim().toLowerCase();
      return t === 'apply' || t === 'easy apply' || t === 'save';
    });

    if (!actionBtn) {
      return null;
    }

    let pane = actionBtn.parentElement;
    while (pane && pane !== document.body) {
      if (pane.offsetWidth > 280 && pane.offsetHeight > 280) {
        break;
      }
      pane = pane.parentElement;
    }

    if (!pane) {
      pane = document.querySelector('main, .scaffold-layout__detail, .jobs-search__job-details') || document.body;
    }

    const title = getCleanJobTitle(pane);
    const company = getCleanCompanyName(pane);
    const desc = getCleanJobDescription(pane);

    let anchor = actionBtn.parentElement;
    if (anchor.parentElement && anchor.parentElement.offsetWidth < 600) {
      anchor = anchor.parentElement;
    }

    return { pane, anchor, title, company, desc };
  }

  // --- 3. WIDGET INJECTION ---
  async function runInjection() {
    if (!window.location.href.includes('linkedin.com/jobs')) {
      return;
    }

    const ctx = findJobContext();
    if (!ctx || ctx.desc.length < 40) {
      return;
    }

    const existing = document.getElementById('prepinterview-copilot-card');
    if (existing && existing.dataset.jobTitle === ctx.title) {
      return;
    }

    if (existing) {
      existing.remove();
    }

    console.log('[PrepInterview Copilot] Extracted Clean Job:', ctx.title, 'at', ctx.company, '(JD length:', ctx.desc.length, 'chars)');

    let resumeText = '';
    try {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        const stored = await chrome.storage.local.get(['resumeText']);
        resumeText = stored.resumeText || '';
      }
    } catch (err) {
      console.warn('[PrepInterview Copilot] Storage read notice:', err);
    }

    const match = calculateMatch(resumeText, ctx.desc);
    const prepUrl = 'https://prepinterview.online/?jd=' + encodeURIComponent(ctx.desc) + '&title=' + encodeURIComponent(ctx.title) + '&company=' + encodeURIComponent(ctx.company) + '&utm_source=linkedin_copilot';

    const card = document.createElement('div');
    card.id = 'prepinterview-copilot-card';
    card.className = 'prepinterview-widget-card';
    card.dataset.jobTitle = ctx.title;

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
            Save your resume once in the Chrome toolbar to see your <strong>Fit Score (80%+ High, 50% Moderate)</strong> and skill gaps for <strong>${ctx.title}</strong>!
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
            <span style="color:#8b949e;">Matched against <strong>${ctx.title}</strong> ${ctx.company ? 'at <strong>' + ctx.company + '</strong>' : ''}</span>
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

    if (ctx.anchor && ctx.anchor.parentElement) {
      ctx.anchor.insertAdjacentElement('afterend', card);
    } else {
      ctx.pane.prepend(card);
    }

    let floatPill = document.getElementById('prepinterview-floating-pill');
    if (!floatPill) {
      floatPill = document.createElement('div');
      floatPill.id = 'prepinterview-floating-pill';
      floatPill.className = 'prepinterview-floating-pill';
      document.body.appendChild(floatPill);
      floatPill.addEventListener('click', () => {
        card.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
    }
    floatPill.innerHTML = `🎯 PrepInterview: <strong>${match.score > 0 ? match.score + '%' : 'Copilot Active'}</strong>`;
  }

  let debounceTimer = null;
  const observer = new MutationObserver(() => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(runInjection, 400);
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

  setTimeout(runInjection, 1000);
  setTimeout(runInjection, 2000);
  window.addEventListener('popstate', () => setTimeout(runInjection, 500));
})();
