// PrepInterview Copilot - Bulletproof Content Script v1.0.3
(function() {
  console.log('[PrepInterview Copilot v1.0.3] Initialized');

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
    "product management", "product manager", "product strategy", "product sense", "prd", "roadmap", "user research", "wireframing", "agile", "scrum", "jira",
    "a/b testing", "user stories", "retention", "churn", "funnel analysis", "north star metric", "sql", "tableau", "powerbi", "amplitude", "mixpanel",
    "google analytics", "customer discovery", "mvp", "feature prioritization", "stakeholder management", "program manager", "program management",
    "growth", "growth product", "onboarding", "lifecycle marketing", "conversion rate",
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

    score = Math.max(30, Math.min(96, score));
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

  // --- 2. ACCURATE LINKEDIN DATA EXTRACTION ---

  function getCurrentJobId() {
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('currentJobId');
    if (id) return id;
    const match = window.location.pathname.match(/\/jobs\/view\/(\d+)/);
    return match ? match[1] : window.location.href;
  }

  function getJobTitle() {
    // LinkedIn Job Title is always in an h1 in the top card
    const titleEl = document.querySelector(
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
    // Fallback: any h1 on page that isn't logo
    const h1s = Array.from(document.querySelectorAll('h1'));
    for (const h of h1s) {
      const txt = (h.innerText || '').trim();
      if (txt.length > 3 && !txt.toLowerCase().includes('linkedin') && !txt.toLowerCase().includes('preferences')) {
        return txt;
      }
    }
    return 'Target Role';
  }

  function getCompanyName() {
    const compEl = document.querySelector(
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

  function getFullJobDescription() {
    // Strategy 1: Dedicated description container across document
    const jdSelectors = [
      '#job-details',
      '.jobs-description__content',
      '.jobs-description-content__text',
      '.jobs-box__html-content',
      '.jobs-description',
      'article.jobs-description__container',
      'article'
    ];

    for (const sel of jdSelectors) {
      const el = document.querySelector(sel);
      if (el && el.innerText && el.innerText.trim().length > 120) {
        let text = el.innerText.trim();
        text = text.replace(/^about the job\s*/i, '');
        return text;
      }
    }

    // Strategy 2: Look for heading "About the job" across entire document
    const allHeadings = Array.from(document.querySelectorAll('h2, h3, h4, h5, div, span'));
    for (const h of allHeadings) {
      const txt = (h.textContent || '').trim().toLowerCase();
      if (txt === 'about the job' || txt === 'job description' || txt === 'about this job') {
        let container = h.parentElement;
        while (container && container !== document.body) {
          if (container.innerText && container.innerText.length > 200) {
            let fullText = container.innerText.trim();
            fullText = fullText.replace(/^about the job\s*/i, '');
            return fullText;
          }
          container = container.parentElement;
        }
      }
    }

    // Strategy 3: Right detail column (strip top card and our card)
    const detailPane = document.querySelector('.scaffold-layout__detail, .jobs-search__job-details--container, .jobs-search__job-details');
    if (detailPane) {
      const clone = detailPane.cloneNode(true);
      const ourCard = clone.querySelector('#prepinterview-copilot-card');
      if (ourCard) ourCard.remove();
      const topCard = clone.querySelector('.job-details-jobs-unified-top-card, .jobs-unified-top-card, [class*="top-card"]');
      if (topCard) topCard.remove();
      clone.querySelectorAll('button, svg, [role="button"]').forEach(b => b.remove());
      const res = clone.innerText.trim();
      if (res.length > 100) return res;
    }

    return '';
  }

  function getAnchorElement() {
    // Find Apply or Save button
    const buttons = Array.from(document.querySelectorAll('button, a'));
    const actionBtn = buttons.find(b => {
      const t = (b.innerText || '').trim().toLowerCase();
      return t === 'apply' || t === 'easy apply' || t === 'save';
    });

    if (actionBtn) {
      // Find the row or top-card container
      const row = actionBtn.closest('.jobs-apply-button--top-card') ||
                  actionBtn.closest('.job-details-jobs-unified-top-card__container--two-pane') ||
                  actionBtn.closest('.jobs-unified-top-card__content--two-pane') ||
                  actionBtn.parentElement.parentElement;
      if (row) return row;
    }

    // Fallback: description element
    return document.querySelector('#job-details, .jobs-description__content, .jobs-description');
  }

  // --- 3. WIDGET INJECTION & LIFECYCLE ---

  async function runInjection() {
    if (!window.location.href.includes('linkedin.com/jobs')) {
      return;
    }

    const jobId = getCurrentJobId();
    const existing = document.getElementById('prepinterview-copilot-card');

    // If card is already injected for this EXACT job, do not re-run!
    if (existing && existing.dataset.jobId === jobId) {
      return;
    }

    const desc = getFullJobDescription();
    const title = getJobTitle();
    const company = getCompanyName();
    const anchor = getAnchorElement();

    if (!desc || desc.length < 50 || !anchor) {
      return;
    }

    if (existing) {
      existing.remove();
    }

    console.log('[PrepInterview Copilot] Extracted Role:', title, 'at', company, '(JD Length:', desc.length, 'chars)');

    let resumeText = '';
    try {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        const stored = await chrome.storage.local.get(['resumeText']);
        resumeText = stored.resumeText || '';
      }
    } catch (e) {
      console.warn('[PrepInterview Copilot] Storage notice:', e);
    }

    const match = calculateMatch(resumeText, desc);
    const prepUrl = 'https://prepinterview.online/?jd=' + encodeURIComponent(desc) + '&title=' + encodeURIComponent(title) + '&company=' + encodeURIComponent(company) + '&utm_source=linkedin_copilot';

    const card = document.createElement('div');
    card.id = 'prepinterview-copilot-card';
    card.className = 'prepinterview-widget-card';
    card.dataset.jobId = jobId;
    card.dataset.jobTitle = title;

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
            Save your resume once in the Chrome toolbar to see your <strong>Fit Score</strong> and skill gaps for <strong>${title}</strong>!
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

        <div class="prepinterview-details prepinterview-collapsed" id="prepinterview-details-panel">
          <div style="display:flex; justify-content:space-between; margin-bottom:8px; font-size:11px;">
            <span style="color:#8b949e;">Matched against <strong>${title}</strong> ${company ? 'at <strong>' + company + '</strong>' : ''}</span>
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

      // Breakdown toggle: ONLY toggles class, NEVER triggers re-injection
      const toggleHeader = card.querySelector('#prepinterview-toggle-header');
      const detailsPanel = card.querySelector('#prepinterview-details-panel');
      const toggleBtn = card.querySelector('#prepinterview-toggle-btn');

      if (toggleHeader && detailsPanel && toggleBtn) {
        toggleHeader.addEventListener('click', (e) => {
          e.stopPropagation();
          const isHidden = detailsPanel.classList.toggle('prepinterview-collapsed');
          toggleBtn.textContent = isHidden ? 'View Breakdown ▾' : 'Hide Breakdown ▴';
        });
      }
    }

    // Insert cleanly below action buttons
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
    // Ignore any mutation caused by our own card
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
})();
