// PrepInterview Copilot - Pure Card Renderer & Sanitizer (v1.0.6)
(function() {
  'use strict';

  const SCORING_VERSION = '1.0.6';

  let Config = null;
  if (typeof require !== 'undefined') {
    try { Config = require('./scoring-config.js'); } catch (e) {}
  }
  if (typeof window !== 'undefined' && window.PrepInterview && window.PrepInterview.Config) {
    Config = window.PrepInterview.Config;
  }

  // --- 1. HTML ESCAPING & SANITIZATION ---
  function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // --- 2. TIER DISPLAY NAMES & CONFIG RESOLUTION ---
  function getTierDisplayName(tier) {
    if (!tier) return 'Reach Role';
    const t = String(tier).trim();
    if (t.startsWith('Strong Match')) return 'Strong Match';
    if (t.startsWith('Good Match')) return 'Good Match';
    if (t.startsWith('Moderate Match')) return 'Moderate Match';
    if (t.startsWith('Reach Role')) return 'Reach Role';
    return t.replace(/\s*\([^)]*\)/g, '').trim();
  }

  function getTierConfig(score, rawTier) {
    const bands = (Config && Config.scoreBands) || {
      strong: { minScore: 80, name: 'Strong Match', color: '#3fb950', badge: '🟢', cta: 'Practice this interview', description: 'Your resume covers the core requirements in this posting.' },
      good: { minScore: 72, name: 'Good Match', color: '#2ea043', badge: '🟢', cta: 'Practice this interview', description: 'Your resume covers most of the requirements.' },
      moderate: { minScore: 45, name: 'Moderate Match', color: '#d29922', badge: '🟡', cta: 'Practice defending your gaps', description: 'Partial overlap with the requirements; see the gaps below.' },
      reach: { minScore: 20, name: 'Reach Role', color: '#f85149', badge: '🔴', cta: 'Practice for a stretch role', description: 'Low overlap, or several requirements aren\'t met.' },
      footer: 'Estimate based on the job text, not a hiring prediction.'
    };

    const s = Number(score) || 0;
    const displayName = getTierDisplayName(rawTier);

    if (displayName === 'Strong Match' || s >= 80) return bands.strong;
    if (displayName === 'Good Match' || s >= 72) return bands.good;
    if (displayName === 'Moderate Match' || s >= 45) return bands.moderate;
    return bands.reach;
  }

  function getTierCtaText(rawTier) {
    const displayName = getTierDisplayName(rawTier);
    if (displayName === 'Strong Match' || displayName === 'Good Match') return 'Practice this interview ↗';
    if (displayName === 'Moderate Match') return 'Practice defending your gaps ↗';
    return 'Practice for a stretch role ↗';
  }

  // --- 3. RENDER FINGERPRINT ---
  function getRenderFingerprint(resumeText, settings) {
    const rText = resumeText || '';
    const s = settings || {};
    const reloc = Boolean(s.openToRelocation);
    const profile = s.activeProfile || 'default';
    const overrides = JSON.stringify(s.overrides || {});
    
    // Deterministic hash-like string
    const resumePart = rText.length + '_' + rText.slice(0, 30).replace(/[^a-zA-Z0-9]/g, '');
    return `${SCORING_VERSION}::${resumePart}::reloc=${reloc}::prof=${profile}::over=${overrides}`;
  }

  // --- 4. FACTOR ROW CHIPS COMPUTATION ---
  function getFactorRowData(match, options) {
    const opts = options || {};
    const hardGaps = Array.isArray(match.hardGaps) ? match.hardGaps : (match.disqualifiers || []);
    const softGaps = Array.isArray(match.softGaps) ? match.softGaps : [];
    const allGaps = hardGaps.concat(softGaps);

    // 1. Skills
    const skillPct = match.skillScore !== undefined ? match.skillScore : match.score;
    const skillsChip = {
      label: 'Skills',
      value: `${skillPct}%`,
      status: skillPct >= 70 ? 'pass' : (skillPct >= 45 ? 'warn' : 'gap')
    };

    // 2. Experience Factor Chip
    let expValue = 'Not stated';
    let expStatus = 'neutral';

    const exp = (match && match.experience) ? match.experience : null;
    if (exp) {
      if (exp.status === 'not_met' || exp.status === 'gap') {
        if (typeof exp.candidateYears === 'number' && typeof exp.jdMin === 'number') {
          expValue = `Not met · you ${exp.candidateYears} / needs ${exp.jdMin}+`;
        } else {
          expValue = 'Not met';
        }
        expStatus = 'gap';
      } else if (exp.status === 'met' || exp.status === 'pass') {
        if (typeof exp.candidateYears === 'number') {
          const needs = (exp.jdMin != null) ? `${exp.jdMin}+` : '0+';
          expValue = `Met · you ${exp.candidateYears} / needs ${needs}`;
        } else {
          expValue = 'Met';
        }
        expStatus = 'pass';
      } else {
        expValue = 'Not stated';
        expStatus = 'neutral';
      }
    } else if (match) {
      const allGaps = (Array.isArray(match.hardGaps) ? match.hardGaps : [])
        .concat(Array.isArray(match.softGaps) ? match.softGaps : [])
        .concat(Array.isArray(match.disqualifiers) ? match.disqualifiers : []);
      const hasExpGap = allGaps.some(g => /experience/i.test(g));
      const hasExpBreakdownPenalty = Array.isArray(match.breakdown) && match.breakdown.some(b => b.points < 0 && /experience/i.test(b.label));

      const min = match.jdReq ? match.jdReq.minExp : (typeof opts.extractedMinExp === 'number' ? opts.extractedMinExp : null);
      const cand = match.candExp;
      const yrs = cand ? (cand.years != null ? cand.years : cand.totalYears) : null;

      if (hasExpGap || hasExpBreakdownPenalty) {
        if (typeof yrs === 'number' && typeof min === 'number') {
          expValue = `Not met · you ${yrs} / needs ${min}+`;
        } else {
          expValue = 'Not met';
        }
        expStatus = 'gap';
      } else if (typeof min === 'number' && min > 0) {
        if (typeof yrs === 'number') {
          if (yrs < (min - 0.5)) {
            expValue = `Not met · you ${yrs} / needs ${min}+`;
            expStatus = 'gap';
          } else {
            expValue = `Met · you ${yrs} / needs ${min}+`;
            expStatus = 'pass';
          }
        } else {
          expValue = 'Met';
          expStatus = 'pass';
        }
      } else if (Array.isArray(match.breakdown) && match.breakdown.some(b => b.points > 0 && /experience.*meets/i.test(b.label))) {
        expValue = 'Met';
        expStatus = 'pass';
      } else {
        expValue = 'Not stated';
        expStatus = 'neutral';
      }
    }

    const expChip = { label: 'Experience', value: expValue, status: expStatus };

    // 3. Education
    const edu = match && match.education;
    let eduValue = 'Not stated';
    let eduStatus = 'neutral';
    if (edu && edu.status) {
      if (edu.status === 'met') {
        const held = (edu.candidate && edu.candidate.degree) || (edu.required && edu.required.level) || 'Degree';
        eduValue = `Met · ${held} held`;
        eduStatus = 'pass';
      } else if (edu.status === 'not_met') {
        const needed = (edu.required && edu.required.level) || 'degree';
        eduValue = `Not met · needs ${needed}`;
        eduStatus = 'gap';
      } else if (edu.status === 'preferred_missing') {
        const pref = (edu.required && edu.required.level) || 'degree';
        eduValue = `Preferred · ${pref}`;
        eduStatus = 'warn';
      } else {
        eduValue = 'Not stated';
        eduStatus = 'neutral';
      }
    }
    const eduChip = { label: 'Education', value: eduValue, status: eduStatus };

    // 4. Location
    const hasLocHard = hardGaps.some(g => /location/i.test(g));
    const hasRelocSoft = softGaps.some(g => /relocation/i.test(g));
    const isRemote = opts.workMode === 'Remote';
    let locValue = 'Not stated';
    let locStatus = 'neutral';
    if (hasLocHard) {
      locValue = 'Not matching';
      locStatus = 'gap';
    } else if (hasRelocSoft) {
      locValue = 'Relocation needed';
      locStatus = 'warn';
    } else if (isRemote || opts.locationMatched) {
      locValue = 'Matches';
      locStatus = 'pass';
    }
    const locChip = { label: 'Location', value: locValue, status: locStatus };

    return [skillsChip, expChip, eduChip, locChip];
  }

  // --- 5. PLAIN REASON SENTENCE ---
  function formatPlainReason(match) {
    const matchedCount = Array.isArray(match.matchedSkills) ? match.matchedSkills.length : 0;
    const totalSkills = Number(match.totalJdSkills) || ((match.matchedSkills ? match.matchedSkills.length : 0) + (match.missingSkills ? match.missingSkills.length : 0)) || 0;
    const hardGaps = Array.isArray(match.hardGaps) ? match.hardGaps : (match.disqualifiers || []);
    const hardCount = hardGaps.length;

    let text = totalSkills > 0 
      ? `${matchedCount} of ${totalSkills} skills in this posting found in your resume.`
      : 'Skills evaluated from available job text.';

    if (hardCount > 0) {
      text += ` ${hardCount} requirement${hardCount > 1 ? 's' : ''} not met.`;
    }

    return text;
  }

  // --- 6. WCAG CONTRAST RATIO CALCULATION (for verification) ---
  function getLuminance(hex) {
    const cleaned = hex.replace('#', '');
    const r = parseInt(cleaned.slice(0, 2), 16) / 255;
    const g = parseInt(cleaned.slice(2, 4), 16) / 255;
    const b = parseInt(cleaned.slice(4, 6), 16) / 255;
    const a = [r, g, b].map(v => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)));
    return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
  }

  function getContrastRatio(fgHex, bgHex) {
    const l1 = getLuminance(fgHex);
    const l2 = getLuminance(bgHex);
    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);
    return (lighter + 0.05) / (darker + 0.05);
  }

  // --- 7. MAIN PURE CARD RENDERER ---
  function renderCopilotCard(match, options) {
    const opts = options || {};
    const rawTitle = (opts.title || '').trim();
    const hasTitle = rawTitle.length > 0 && rawTitle.toLowerCase() !== 'target role';
    const title = hasTitle ? escapeHtml(rawTitle) : '';
    const company = escapeHtml(opts.company || '');
    const desc = opts.jd || opts.desc || '';
    const isExpanded = Boolean(opts.isExpanded);
    const openToRelocation = Boolean(opts.openToRelocation);

    const CTA_EXTERNAL_ICON_SVG = `<svg class="prepinterview-cta-icon" width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3.5 8.5L8.5 3.5M8.5 3.5H4.5M8.5 3.5V7.5"/></svg>`;

    if (!match || match.status === 'no_resume') {
      return `
        <div class="prepinterview-header" style="flex-direction:column; align-items:flex-start; gap:8px;">
          <div class="prepinterview-badge-row" style="width:100%; justify-content:space-between;">
            <span class="prepinterview-score-pill">
              <span class="prepinterview-status-dot" style="background:#58a6ff;"></span>
              PrepInterview Copilot
            </span>
            <span class="prepinterview-secondary-text">Click extension icon to save resume</span>
          </div>
          <div style="font-size:12px; color:#c9d1d9; line-height:1.4;">
            Save your resume once in the Chrome toolbar to see your skill match, experience, location, and education fit${hasTitle ? ` for <strong>${title}</strong>` : ''}.
          </div>
          <a href="#" class="prepinterview-cta-btn prepinterview-action-trigger" style="margin-top:6px;" aria-label="Practice spoken interview for this job (opens prepinterview.online in a new tab)">
            <span>Practice spoken interview for this job</span>
            ${CTA_EXTERNAL_ICON_SVG}
          </a>
        </div>
      `;
    }

    const band = getTierConfig(match.score, match.tier);
    const tierDisplay = getTierDisplayName(match.tier);
    const ctaText = getTierCtaText(match.tier);
    const ctaBaseLabel = ctaText.replace(/\s*↗\s*$/, '');
    const reasonSentence = escapeHtml(formatPlainReason(match));

    // Factor chips
    const factorChips = getFactorRowData(match, opts);
    const factorChipsHtml = factorChips.map(c => {
      const cls = c.status === 'pass' ? 'prepinterview-chip-pass' : (c.status === 'gap' ? 'prepinterview-chip-gap' : (c.status === 'warn' ? 'prepinterview-chip-warn' : 'prepinterview-chip-neutral'));
      return `<span class="prepinterview-factor-chip ${cls}"><strong>${escapeHtml(c.label)}:</strong> ${escapeHtml(c.value)}</span>`;
    }).join(' ');

    // Skills: at most 6 pills plus "+N more" (Neutral styling)
    const matched = Array.isArray(match.matchedSkills) ? match.matchedSkills : [];
    const missing = Array.isArray(match.missingSkills) ? match.missingSkills : [];

    const maxPills = 6;
    let matchPillsHtml = '';
    if (matched.length > 0) {
      const shown = matched.slice(0, maxPills);
      const remaining = matched.length - shown.length;
      matchPillsHtml = shown.map(s => `<span class="prepinterview-pill prepinterview-pill-neutral">${escapeHtml(s)}</span>`).join('');
      if (remaining > 0) {
        matchPillsHtml += `<span class="prepinterview-pill-more">+${remaining} more</span>`;
      }
    } else {
      matchPillsHtml = '<span class="prepinterview-secondary-text">No core keyword overlaps</span>';
    }

    let missingPillsHtml = '';
    if (missing.length > 0) {
      const shown = missing.slice(0, maxPills);
      const remaining = missing.length - shown.length;
      missingPillsHtml = shown.map(s => `<span class="prepinterview-pill prepinterview-pill-neutral">${escapeHtml(s)}</span>`).join('');
      if (remaining > 0) {
        missingPillsHtml += `<span class="prepinterview-pill-more">+${remaining} more</span>`;
      }
    } else {
      missingPillsHtml = '<span class="prepinterview-secondary-text">No skill gaps identified</span>';
    }

    // 1. Hard Gaps (Red Pills only)
    const hardGaps = Array.isArray(match.hardGaps) ? match.hardGaps : (match.disqualifiers || []);
    const hardGapsHtml = hardGaps.length > 0
      ? `
        <div class="prepinterview-section-label" style="color:#ff7b72;">Hard requirement gaps (${hardGaps.length})</div>
        <div class="prepinterview-pills-row">
          ${hardGaps.map(g => `<span class="prepinterview-pill prepinterview-pill-hard">${escapeHtml(g)}</span>`).join('')}
        </div>
      `
      : '';

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
        <div class="prepinterview-section-label" style="color:#d29922; margin-top:10px;">Soft notes & profile considerations (${amberItems.length})</div>
        <div class="prepinterview-amber-block">
          ${amberItems.map(item => `<div class="prepinterview-line-amber">${escapeHtml(item)}</div>`).join('')}
        </div>
      `
      : '';

    // 3. Relocation toggle on card: ONLY when location mismatch exists
    const hasLocationMismatch = hardGaps.some(g => /location/i.test(g)) || amberItems.some(item => /location|relocation/i.test(item));
    const relocationToggleHtml = hasLocationMismatch
      ? `
        <div class="prepinterview-relocation-row">
          <div>
            <div style="font-size:12px; font-weight:600; color:#f0f6fc;">I&#39;m open to relocating</div>
            <div class="prepinterview-secondary-text">Waives on-site location mismatch</div>
          </div>
          <button type="button" role="switch" aria-checked="${openToRelocation ? 'true' : 'false'}" id="prepinterview-card-relocation-toggle" class="prepinterview-switch-btn ${openToRelocation ? 'active' : ''}" aria-label="I'm open to relocating">
            <span class="prepinterview-switch-handle"></span>
          </button>
        </div>
      `
      : '';

    // 4. Breakdown section with plain language labels and no 'Pre-clamp'
    const labelMap = (Config && Config.breakdownLabelMap) || {
      'Experience Gap Penalty': 'Experience shortfall',
      'Experience Requirement Met': 'Meets the minimum experience',
      'Location Match Bonus': 'Location matches',
      'Location Mismatch Penalty': 'Location mismatch',
      'College Tier Penalty': 'College tier requirement',
      'College Tier Preferred Bonus': 'Preferred college bonus',
      'College Tier Mandatory Bonus': 'Mandatory college met',
      'Degree Mandatory Penalty': 'Degree requirement',
      'Degree Preferred Bonus': 'Preferred degree bonus',
      'Overqualified Penalty': 'Seniority above posted range',
      'Role Profile Mismatch': 'Role profile mismatch',
      'Soft Gaps Penalty': 'Requirement gaps adjustment'
    };

    const breakdownItems = Array.isArray(match.breakdown) ? match.breakdown : [];
    let breakdownRowsHtml = `
      <div class="prepinterview-breakdown-row">
        <span class="prepinterview-breakdown-label">Base skills match</span>
        <span class="prepinterview-breakdown-pts prepinterview-pts-base">+${match.skillScore !== undefined ? match.skillScore : 50} pts</span>
      </div>
    `;

    breakdownItems.forEach(item => {
      const isPos = item.points > 0;
      const ptsClass = isPos ? 'prepinterview-pts-pos' : (item.points === 0 ? 'prepinterview-pts-neutral' : 'prepinterview-pts-neg');
      const sign = isPos ? '+' : '';
      let mapped = labelMap[item.label] || item.label;

      if (item.label === 'Capped: unmet requirement') {
        const hasGaps = (Array.isArray(match.hardGaps) && match.hardGaps.length > 0) ||
                        (Array.isArray(match.softGaps) && match.softGaps.length > 0);
        if (!hasGaps || match.score === 98) {
          mapped = 'Maximum score shown is 98';
        }
      }

      breakdownRowsHtml += `
        <div class="prepinterview-breakdown-row">
          <span class="prepinterview-breakdown-label">${escapeHtml(mapped)}</span>
          <span class="prepinterview-breakdown-pts ${ptsClass}">${sign}${item.points} pts</span>
        </div>
      `;
    });

    // Dynamic cap line
    let capNoticeHtml = '';
    if (match.preClampScore !== undefined && match.preClampScore !== match.score) {
      if (match.preClampScore > 98) {
        capNoticeHtml = '<div class="prepinterview-cap-notice">Maximum score shown is 98</div>';
      } else if (match.preClampScore < 20) {
        capNoticeHtml = '<div class="prepinterview-cap-notice">Minimum score shown is 20</div>';
      } else if (match.score <= 79) {
        const maxLimit = match.score <= 44 ? 44 : (match.score <= 71 ? 71 : 79);
        capNoticeHtml = `<div class="prepinterview-cap-notice">Score limited because a stated requirement isn&#39;t met (max ${maxLimit})</div>`;
      }
    }

    const lowConfidenceHtml = match.lowConfidence
      ? `
        <div class="prepinterview-line-amber" style="margin: 8px 0; font-size:12px;">
          Low extraction confidence: Fewer than 3 structured skills found in JD. Fallback matching applied.
        </div>
      `
      : '';

    const howBuiltHtml = `
      <div class="prepinterview-how-built-card">
        <div class="prepinterview-breakdown-header">
          <span style="color:#58a6ff; font-weight:600;">How this score was built</span>
          <span style="color:#f0f6fc; font-weight:700;">${match.score}% (${escapeHtml(tierDisplay)})</span>
        </div>
        ${lowConfidenceHtml}
        <div class="prepinterview-breakdown-list">
          ${breakdownRowsHtml}
        </div>
        ${capNoticeHtml}
      </div>
    `;

    let ReleaseConfig = null;
    if (typeof require !== 'undefined') {
      try { ReleaseConfig = require('./release-config.js'); } catch (e) {}
    }
    if (typeof window !== 'undefined' && window.PrepInterview && window.PrepInterview.ReleaseConfig) {
      ReleaseConfig = window.PrepInterview.ReleaseConfig;
    }


    return `
      <div class="prepinterview-header" id="prepinterview-toggle-header" tabindex="0" role="button" aria-expanded="${isExpanded ? 'true' : 'false'}" aria-controls="prepinterview-details-panel">
        <div class="prepinterview-header-main">
          <div class="prepinterview-badge-row">
            <span class="prepinterview-score-pill">
              <span class="prepinterview-status-dot" style="background-color:${band.color};"></span>
              <strong>${match.score}%</strong> ${escapeHtml(tierDisplay)}
            </span>
            <span class="prepinterview-beta-tag">Beta</span>
          </div>
          <div class="prepinterview-reason-sentence">${reasonSentence}</div>
        </div>
        <button class="prepinterview-toggle-btn" id="prepinterview-toggle-btn" aria-expanded="${isExpanded ? 'true' : 'false'}" aria-controls="prepinterview-details-panel">
          ${isExpanded ? 'Hide Match Insights ▴' : 'View Match Insights ▾'}
        </button>
      </div>

      <div class="prepinterview-details ${isExpanded ? '' : 'prepinterview-collapsed'}" id="prepinterview-details-panel">
        ${hasTitle ? `
        <div class="prepinterview-context-bar">
          <span class="prepinterview-secondary-text">Target: <strong>${title}</strong> ${company ? 'at <strong>' + company + '</strong>' : ''}</span>
          <span class="prepinterview-description-note">${escapeHtml(band.description)}</span>
        </div>` : (band.description ? `
        <div class="prepinterview-context-bar">
          <span class="prepinterview-description-note">${escapeHtml(band.description)}</span>
        </div>` : '')}

        <div class="prepinterview-factor-chips-row">
          ${factorChipsHtml}
        </div>

        ${hardGapsHtml}
        ${amberLinesHtml}
        ${relocationToggleHtml}
        ${howBuiltHtml}

        <div class="prepinterview-section-label" style="margin-top:12px;">In your resume (${matched.length})</div>
        <div class="prepinterview-pills-row">
          ${matchPillsHtml}
        </div>

        <div class="prepinterview-section-label">Not found in your resume (${missing.length})</div>
        <div class="prepinterview-pills-row">
          ${missingPillsHtml}
        </div>

        <a href="${escapeHtml(buildPracticeUrl({ title, company, jd: desc }))}" class="prepinterview-cta-btn prepinterview-action-trigger" target="_blank" rel="noopener noreferrer" aria-label="${escapeHtml(ctaBaseLabel)} (opens prepinterview.online in a new tab)">
          <span>${escapeHtml(ctaBaseLabel)}</span>
          ${CTA_EXTERNAL_ICON_SVG}
        </a>
        <div class="prepinterview-cta-disclosure">Opens prepinterview.online in a new tab with this job&#39;s text, title and company. Your resume is not sent.</div>

        <div class="prepinterview-footer-divider"></div>

        <div class="prepinterview-footer-row">
          <span class="prepinterview-footer-text">${escapeHtml((Config && Config.scoreBands && Config.scoreBands.footer) || 'Estimate based on the job text, not a hiring prediction.')}</span>
          <div class="prepinterview-footer-actions">
            <a href="#" class="prepinterview-diagnostic-link" id="prepinterview-diag-link" role="button">Score looks off?</a>
            <a href="#" class="prepinterview-diagnostic-link" id="prepinterview-copy-debug-link" role="button" style="margin-left:8px;">Copy debug info</a>
          </div>
        </div>
      </div>
    `;
  }

  // --- 8. FLOATING PILL RENDERER ---
  function renderFloatingPill(match) {
    if (!match || match.status === 'no_resume') {
      return `PrepInterview Copilot`;
    }
    const band = getTierConfig(match.score, match.tier);
    return `<span class="prepinterview-status-dot" style="background-color:${band.color};"></span> PrepInterview: <strong>${match.score}%</strong>`;
  }

  // --- 9. SANITIZED DIAGNOSTIC EXPORTER ---
  function buildDiagnosticPayload(match, options) {
    const opts = options || {};
    return {
      version: SCORING_VERSION,
      timestamp: new Date().toISOString(),
      jobId: opts.jobId || 'unknown',
      title: opts.title || '',
      company: opts.company || '',
      extractedMinExp: (opts.extractedMinExp !== undefined && opts.extractedMinExp !== null)
        ? opts.extractedMinExp
        : ((match.jdReq && match.jdReq.minExp !== undefined && match.jdReq.minExp !== null) ? match.jdReq.minExp : null),
      extractedSkills: opts.extractedSkills || [],
      breakdown: Array.isArray(match.breakdown) ? match.breakdown : [],
      notes: Array.isArray(match.notes) ? match.notes : [],
      hardGaps: Array.isArray(match.hardGaps) ? match.hardGaps : (match.disqualifiers || []),
      softGaps: Array.isArray(match.softGaps) ? match.softGaps : []
    };
  }

  // --- 8. PRACTICE URL BUILDER ---
  function buildPracticeUrl(opts) {
    opts = opts || {};
    const title = opts.title || '';
    const company = opts.company || '';
    const jd = opts.jd || opts.desc || '';
    const params = new URLSearchParams();
    if (jd) params.set('jd', jd);
    if (title) params.set('title', title);
    if (company) params.set('company', company);
    params.set('utm_source', 'linkedin_copilot');
    return 'https://prepinterview.online/?' + params.toString();
  }

  // --- 10. SCORE LOOKS OFF / FEEDBACK HANDLER ---
  function handleScoreLooksOff(targetWindow, releaseConfig) {
    const win = targetWindow || (typeof window !== 'undefined' ? window : null);
    let cfg = releaseConfig;
    if (!cfg) {
      if (typeof window !== 'undefined' && window.PrepInterview && window.PrepInterview.ReleaseConfig) {
        cfg = window.PrepInterview.ReleaseConfig;
      } else if (typeof require !== 'undefined') {
        try { cfg = require('./release-config.js'); } catch (e) {}
      }
    }
    const url = (cfg && cfg.FEEDBACK_URL && typeof cfg.FEEDBACK_URL === 'string') ? cfg.FEEDBACK_URL.trim() : '';
    if (!win || !url || url === 'REPLACE_ME') {
      return false;
    }
    win.open(url, '_blank', 'noopener,noreferrer');
    return true;
  }

  const api = {
    SCORING_VERSION,
    escapeHtml,
    getTierDisplayName,
    getTierConfig,
    getTierCtaText,
    getRenderFingerprint,
    getFactorRowData,
    formatPlainReason,
    getLuminance,
    getContrastRatio,
    renderCopilotCard,
    renderFloatingPill,
    buildDiagnosticPayload,
    buildPracticeUrl,
    handleScoreLooksOff
  };

  if (typeof window !== 'undefined') {
    window.PrepInterview = window.PrepInterview || {};
    window.PrepInterview.CardRenderer = api;
  }
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})();
