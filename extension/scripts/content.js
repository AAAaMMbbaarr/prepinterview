// PrepInterview Copilot - Content Script & LinkedIn Integration (Beta v1.0.6)
(function() {
  'use strict';
  console.log('[PrepInterview Copilot Beta v1.0.6] Initialized');

  const CardRenderer = (typeof window !== 'undefined' && window.PrepInterview && window.PrepInterview.CardRenderer) || null;
  const Matcher = (typeof window !== 'undefined' && window.PrepInterview && window.PrepInterview.Matcher) || null;

  // --- 1. ACCURATE LINKEDIN DATA EXTRACTION ---
  function isFilterOrListElement(el) {
    if (!el || !el.closest) return false;
    return Boolean(
      el.closest('li') ||
      el.closest('[role="listitem"]') ||
      el.closest('.jobs-search-results-list') ||
      el.closest('.scaffold-layout__list') ||
      el.closest('.jobs-search-results') ||
      el.closest('[data-occludable-job-id]') ||
      el.closest('.search-reuslts-filter') ||
      el.closest('.search-results-filters') ||
      el.closest('.artdeco-pill') ||
      el.closest('[role="toolbar"]') ||
      el.closest('ul.search-results__filter-list') ||
      el.closest('.jobs-search-box') ||
      el.closest('.global-nav') ||
      el.closest('header') ||
      el.closest('nav')
    );
  }

  function findApplyButton(scope) {
    if (!scope) return null;
    const candidates = scope.querySelectorAll('button, a, [role="button"]');
    const applyRegex = /^(?:easy\s+apply|apply(?:\s+on\s+company\s+website|\s+now)?)\b/i;
    for (const el of candidates) {
      if (el.closest && (el.closest('#prepinterview-copilot-container') || el.closest('#prepinterview-floating-pill'))) continue;
      if (isFilterOrListElement(el)) continue;

      const label = (el.getAttribute && el.getAttribute('aria-label')) || '';
      const text = (el.innerText || el.textContent || '').trim();
      if ((text.length > 0 && text.length <= 40 && applyRegex.test(text)) ||
          (label.length > 0 && label.length <= 80 && applyRegex.test(label))) {
        return el;
      }
    }
    return null;
  }

  function findSaveButton(scope) {
    if (!scope) return null;
    const candidates = scope.querySelectorAll('button, a, [role="button"]');
    const saveRegex = /^\s*save(?:d)?(?:\s+job)?\b/i;
    for (const el of candidates) {
      if (el.closest && (el.closest('#prepinterview-copilot-container') || el.closest('#prepinterview-floating-pill'))) continue;
      if (isFilterOrListElement(el)) continue;

      const label = (el.getAttribute && el.getAttribute('aria-label')) || '';
      const text = (el.innerText || el.textContent || '').trim();
      if ((text.length > 0 && text.length <= 30 && saveRegex.test(text)) ||
          (label.length > 0 && label.length <= 60 && saveRegex.test(label))) {
        return el;
      }
    }
    return null;
  }

  function getJobDetailsPane() {
    if (typeof document === 'undefined') return null;

    // 1. Explicit search details pane if present (classic /jobs/search/ and /jobs/view/)
    const explicitPane = document.querySelector(
      '.scaffold-layout__detail, ' +
      '.jobs-search-results-list__details, ' +
      '.jobs-search__job-details--container, ' +
      '.jobs-search__job-details, ' +
      '.jobs-details__main-content, ' +
      'main .job-view-layout'
    );
    if (explicitPane) {
      return explicitPane;
    }

    // 2. Fallback for new /jobs/search-results/ (hashed classes):
    // Find the right column by finding Save button or Apply button outside of any list item
    const saveBtn = findSaveButton(document);
    const applyBtn = findApplyButton(document);
    const actionBtn = saveBtn || applyBtn;
    if (actionBtn) {
      return actionBtn.closest('.scaffold-layout__detail, main, [role="main"], section, article') || actionBtn.parentElement;
    }

    // 3. Find common ancestor of job description (#job-details) and top card
    const jdEl = document.querySelector('#job-details, .jobs-description__content, .jobs-description');
    const topCard = document.querySelector(
      '.job-details-jobs-unified-top-card, ' +
      '.jobs-unified-top-card, ' +
      '[class*="top-card"]'
    );
    if (jdEl && topCard) {
      let curr = jdEl.parentElement;
      while (curr && curr !== document.body && curr !== document.documentElement) {
        if (curr.contains(topCard)) {
          return curr;
        }
        curr = curr.parentElement;
      }
      return jdEl.parentElement || topCard.parentElement;
    }

    if (topCard) {
      const parent = topCard.closest(
        '.jobs-search-results-list__details, .scaffold-layout__detail, .jobs-search__job-details--container, .jobs-search__job-details, .jobs-details__main-content, .job-view-layout'
      );
      if (parent) return parent;
      return topCard.parentElement || topCard;
    }

    if (jdEl) {
      return jdEl.closest('.scaffold-layout__detail, main, [role="main"], section, article') || jdEl.parentElement;
    }

    return null;
  }

  function getCurrentJobId(pane) {
    if (typeof window === 'undefined') return '';

    // 1. From URL query params (?currentJobId=123)
    if (window.location && window.location.search) {
      const urlParams = new URLSearchParams(window.location.search);
      const id = urlParams.get('currentJobId');
      if (id && /^\d+$/.test(id)) return id;
    }

    // 2. From URL pathname (/jobs/view/12345/)
    if (window.location && window.location.pathname) {
      const match = window.location.pathname.match(/\/jobs\/view\/(\d+)/);
      if (match && match[1]) return match[1];
    }

    // 3. From details pane: job link href (/jobs/view/<id>)
    const targetPane = pane || getJobDetailsPane();
    if (targetPane) {
      const jobLink = targetPane.querySelector(
        'a[href*="/jobs/view/"], ' +
        '.job-details-jobs-unified-top-card__job-title a, ' +
        'h1 a[href*="/jobs/view/"]'
      );
      if (jobLink) {
        const href = jobLink.getAttribute('href') || '';
        const m = href.match(/\/jobs\/view\/(\d+)/);
        if (m && m[1]) return m[1];
      }

      const allDataEls = targetPane.querySelectorAll('[data-job-id], [data-job-runner-job-id]');
      for (const dataEl of allDataEls) {
        if (dataEl.id === 'prepinterview-copilot-card' || dataEl.id === 'prepinterview-copilot-container' || (dataEl.closest && dataEl.closest('#prepinterview-copilot-container'))) {
          continue;
        }
        const id = dataEl.getAttribute('data-job-id') || dataEl.getAttribute('data-job-runner-job-id');
        if (id && /^\d+$/.test(id)) return id;
      }
    }

    // 4. From active selected job card in search results list
    if (typeof document !== 'undefined') {
      const activeCard = document.querySelector(
        '.jobs-search-results-list__list-item--active, ' +
        '.job-card-container--active, ' +
        '.scaffold-layout__list-item--active, ' +
        '[data-occludable-job-id].active, ' +
        'li.active[data-occludable-job-id]'
      );
      if (activeCard) {
        const id = activeCard.getAttribute('data-occludable-job-id') ||
                   activeCard.getAttribute('data-job-id') ||
                   (activeCard.querySelector('[data-job-id]') && activeCard.querySelector('[data-job-id]').getAttribute('data-job-id'));
        if (id && /^\d+$/.test(id)) return id;
      }
    }

    // 5. Fallback: unique key from Job Title + Company
    if (targetPane) {
      const title = getJobTitle(targetPane);
      const company = getCompanyName(targetPane);
      if (title && title !== 'Target Role') {
        return `${title}__${company}`.toLowerCase().replace(/\s+/g, '_');
      }
    }

    return (window.location && window.location.href) || '';
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
    const titleText = titleEl ? (titleEl.innerText || titleEl.textContent || '').trim() : '';
    if (titleText.length > 2) {
      return titleText;
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
    const compText = compEl ? (compEl.innerText || compEl.textContent || '').trim() : '';
    if (compText.length > 1) {
      return compText;
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
      const locText = el ? (el.innerText || el.textContent || '').trim() : '';
      if (locText.length > 2) {
        return locText;
      }
    }
    return '';
  }

  function getDescriptionFromAboutTheJob(pane) {
    const scope = pane || (typeof document !== 'undefined' ? document : null);
    if (!scope) return '';

    const candidates = scope.querySelectorAll('h1, h2, h3, h4, h5, h6, [role="heading"], strong, b, div, span, p');
    let aboutHeading = null;
    for (const el of candidates) {
      if (el.closest && (el.closest('#prepinterview-copilot-container') || el.closest('#prepinterview-floating-pill'))) continue;
      const t = (el.innerText || el.textContent || '').trim();
      if (/^about\s+the\s+job\b/i.test(t) && t.length <= 40) {
        aboutHeading = el;
        break;
      }
    }

    if (!aboutHeading) return '';

    let text = '';
    let targetNode = aboutHeading;
    if (targetNode.parentElement && targetNode.parentElement !== scope && targetNode.parentElement.children.length === 1) {
      targetNode = targetNode.parentElement;
    }

    let curr = targetNode.nextElementSibling;
    while (curr) {
      if (!curr.closest || (!curr.closest('#prepinterview-copilot-container') && !curr.closest('#prepinterview-floating-pill'))) {
        const sibText = (curr.innerText || curr.textContent || '').trim();
        if (sibText) {
          text += (text ? '\n\n' : '') + sibText;
        }
      }
      curr = curr.nextElementSibling;
    }

    return text.trim();
  }

  // Passive description extraction: NEVER click page elements during extraction
  function getFullJobDescription(pane) {
    // 1. Text-based "About the job" heading + following siblings
    const aboutText = getDescriptionFromAboutTheJob(pane);
    if (aboutText && aboutText.length >= 200) {
      return aboutText;
    }

    let text = '';
    const jdSelectors = [
      '#job-details',
      '.jobs-description__content',
      '.jobs-description-content__text',
      '.jobs-box__html-content',
      '.jobs-description',
      'article.jobs-description__container'
    ];

    const junkSelectors = [
      '#prepinterview-copilot-container',
      '#prepinterview-copilot-card',
      '.jobs-premium-applicant-insights',
      '[data-view-name*="applicant-insights"]',
      '.jobs-unified-top-card__applicant-count',
      '.jobs-premium-insights',
      '.hiring-team',
      '.jobs-poster-profile',
      '.jobs-company__box',
      'button',
      'svg',
      '[role="button"]'
    ].join(',');

    for (const sel of jdSelectors) {
      const el = (pane && pane.querySelector(sel)) || (typeof document !== 'undefined' ? document.querySelector(sel) : null);
      const rawText = el ? (el.innerText || el.textContent || '').trim() : '';
      if (rawText.length > 80) {
        const clone = el.cloneNode(true);
        try {
          clone.querySelectorAll(junkSelectors).forEach(n => n.remove());
        } catch (e) {}
        const cleaned = (clone.innerText || clone.textContent || '').trim();
        if (cleaned.length > 80) {
          text = cleaned;
          break;
        }
      }
    }

    const mainEl = typeof document !== 'undefined' ? document.querySelector('main') : null;
    const bodyEl = typeof document !== 'undefined' ? document.body : null;
    if (!text && pane && pane !== bodyEl && pane !== mainEl) {
      const clone = pane.cloneNode(true);
      try {
        clone.querySelectorAll(junkSelectors).forEach(n => n.remove());
        const topCard = clone.querySelector('.job-details-jobs-unified-top-card, .jobs-unified-top-card, [class*="top-card"]');
        if (topCard) topCard.remove();
      } catch (e) {}
      text = (clone.innerText || clone.textContent || '').trim();
    }

    text = text.replace(/^about the job\s*/i, '');
    text = text.replace(/\s*\.\.\.\s*more\s*$/gi, '');
    text = text.replace(/\s*see more\s*$/gi, '');
    text = text.replace(/\s*show more\s*$/gi, '');

    return text.trim();
  }

  function extractMinExpFromDescription(text) {
    if (!text || typeof text !== 'string') return null;
    const clean = text.replace(/[\u2013\u2014]/g, '-').replace(/\s+/g, ' ');

    if (/\b(?:fresher|freshers|entry[- ]level|new\s+grad|new\s+graduate|no\s+prior\s+experience|no\s+experience\s+required)\b/i.test(clean)) {
      return 0;
    }

    const filtered = clean.replace(/\b(?:over|with|founded|celebrating|more than)\s+\d+\s+(?:years?|yrs?)\s+(?:of\s+)?(?:experience|history|innovation|leadership|excellence|serving)\b/gi, ' ');

    let searchText = filtered;
    const reqMatch = filtered.match(/\b(?:requirements|qualifications|what you(?:'ll)? need|what we(?:'re)? looking for|minimum requirements|required skills|basic qualifications)\b/i);
    if (reqMatch) {
      const fromReq = filtered.slice(reqMatch.index);
      const endReq = fromReq.match(/\n\s*(?:responsibilities|benefits|about us|perks|compensation)\b/i);
      const section = endReq ? fromReq.slice(0, endReq.index) : fromReq;
      if (/\b(?:experience|exp|years?|yrs?)\b/i.test(section)) {
        searchText = section;
      }
    }

    const rangePattern = /\b(\d+(?:\.\d+)?)\s*(?:-|to)\s*(\d+(?:\.\d+)?)\s*\+?\s*(?:years?|yrs?)(?:\s+of\b|\s+[a-zA-Z\s]{0,35}?\s+experience\b|\s+experience\b)/i;
    const rangeM = searchText.match(rangePattern);
    if (rangeM && rangeM[1]) return parseFloat(rangeM[1]);

    const expPattern = /(?:minimum\s+(?:of\s+)?|at\s+least\s+)?(\d+(?:\.\d+)?)\s*\+?\s*(?:years?|yrs?)(?:\s+of)?(?:\s+[a-zA-Z\s]{0,35}?)?\s+(?:experience|exp)\b/i;
    const expM = searchText.match(expPattern);
    if (expM && expM[1]) return parseFloat(expM[1]);

    const orMorePattern = /\b(\d+(?:\.\d+)?)\s*(?:years?|yrs?)\s+or\s+(?:more|above)\b/i;
    const orMoreM = searchText.match(orMorePattern);
    if (orMoreM && orMoreM[1]) return parseFloat(orMoreM[1]);

    const colonPattern = /(?:experience|exp)\s*:\s*(\d+(?:\.\d+)?)/i;
    const colonM = searchText.match(colonPattern);
    if (colonM && colonM[1]) return parseFloat(colonM[1]);

    return null;
  }

  function isFlexOrGrid(el) {
  function isFlexRowOrGrid(el) {
    if (!el || el === document.body || el === document.documentElement) return false;
    try {
      let display = '';
      let flexDir = 'row';
      if (typeof window !== 'undefined' && window.getComputedStyle) {
        const cs = window.getComputedStyle(el);
        display = (cs && cs.display) || '';
        flexDir = (cs && cs.flexDirection) || 'row';
      }
      if (!display && el.style) {
        display = el.style.display || '';
        flexDir = el.style.flexDirection || 'row';
      }
      if (display.includes('grid')) {
        return true;
      }
      if (display.includes('flex')) {
        return !flexDir.includes('column');
      }
      return false;
    } catch (e) {
      return false;
    }
  }
  const isFlexOrGrid = isFlexRowOrGrid;

  function climbToBlockOrColumn(row, scope) {
    if (!row) return null;
    let anchor = row;
    let levelsClimbed = 0;
    for (let i = 0; i < 3; i++) {
      const parent = anchor.parentElement;
      if (!parent || parent === scope || parent === document.body || parent === document.documentElement) {
        break;
      }
      if (parent.id === 'job-details' || (parent.classList && (parent.classList.contains('jobs-description') || parent.classList.contains('jobs-description__content')))) {
        break;
      }
      if (isFlexRowOrGrid(parent)) {
        anchor = parent;
        levelsClimbed++;
      } else {
        break;
      }
    }
    anchor.__prepinterview_levels_climbed = levelsClimbed;
    anchor.__prepinterview_raw_row = row;
    return anchor;
  }

  function getClosestCommonAncestor(nodeA, nodeB, boundary) {
    if (!nodeA || !nodeB) return nodeA || nodeB;
    if (nodeA === nodeB) return nodeA;

    const ancestorsA = new Set();
    let curr = nodeA;
    while (curr && curr !== boundary && curr !== document.body && curr !== document.documentElement) {
      ancestorsA.add(curr);
      curr = curr.parentElement;
    }

    curr = nodeB;
    while (curr && curr !== boundary && curr !== document.body && curr !== document.documentElement) {
      if (ancestorsA.has(curr)) {
        return curr;
      }
      curr = curr.parentElement;
    }

    return nodeA.parentElement || boundary;
  }

  function logAnchorDebug(anchor) {
    const isDebug = typeof window !== 'undefined' && (
      window.PREPINTERVIEW_DEBUG === true ||
      window.__PREPINTERVIEW_DEBUG__ === true ||
      (typeof localStorage !== 'undefined' && localStorage.getItem('prepinterview_debug') === 'true')
    );
    if (!isDebug || !anchor) return;

    function getDisplay(el) {
      try {
        if (typeof window !== 'undefined' && window.getComputedStyle) {
          const cs = window.getComputedStyle(el);
          return (cs && cs.display) || (el.style && el.style.display) || 'unknown';
        }
        return el.style ? (el.style.display || 'inline') : 'unknown';
      } catch (e) {
        return 'error';
      }
    }

    const anchorInfo = {
      tag: anchor.tagName ? anchor.tagName.toLowerCase() : 'unknown',
      classes: anchor.className || '',
      display: getDisplay(anchor)
    };

    const parentChain = [];
    let curr = anchor.parentElement;
    for (let i = 1; i <= 5 && curr; i++) {
      parentChain.push({
        level: i,
        tag: curr.tagName ? curr.tagName.toLowerCase() : 'unknown',
        classes: curr.className || '',
        display: getDisplay(curr)
      });
      curr = curr.parentElement;
    }

    console.log('[PrepInterview Debug] Anchor resolution:', {
      anchor: anchorInfo,
      parentChain: parentChain
    });
  }

  function logPlacementDebug(row, anchor, levelsClimbed, wrapper) {
    const isDebug = typeof window !== 'undefined' && (
      window.PREPINTERVIEW_DEBUG === true ||
      window.__PREPINTERVIEW_DEBUG__ === true ||
      (typeof localStorage !== 'undefined' && localStorage.getItem('prepinterview_debug') === 'true')
    );
    if (!isDebug) return;

    const targetRow = row || anchor;
    const rowTag = targetRow && targetRow.tagName ? targetRow.tagName.toLowerCase() : 'unknown';

    let parentDisplay = 'unknown';
    let parentFlexDir = 'unknown';
    const parent = targetRow ? targetRow.parentElement : null;
    if (parent) {
      try {
        if (typeof window !== 'undefined' && window.getComputedStyle) {
          const cs = window.getComputedStyle(parent);
          parentDisplay = cs.display || '';
          parentFlexDir = cs.flexDirection || '';
        }
      } catch (e) {}
      if (!parentDisplay && parent.style) parentDisplay = parent.style.display || '';
      if (!parentFlexDir && parent.style) parentFlexDir = parent.style.flexDirection || '';
    }

    let rowBox = null;
    let wrapperBox = null;
    let gap = null;

    try {
      if (targetRow && typeof targetRow.getBoundingClientRect === 'function') {
        rowBox = targetRow.getBoundingClientRect();
      }
      if (wrapper && typeof wrapper.getBoundingClientRect === 'function') {
        wrapperBox = wrapper.getBoundingClientRect();
      }
      if (rowBox && wrapperBox) {
        gap = Math.round(wrapperBox.top - rowBox.bottom);
      }
    } catch (e) {}

    console.log('[PrepInterview Placement Debug]', {
      rowTag,
      parentDisplayFlexDir: `${parentDisplay} ${parentFlexDir}`.trim(),
      levelsClimbed,
      rowBox,
      wrapperBox,
      gapPx: gap
    });
  }

  let lastAnchorStrategy = 'none';
  let lastActionRow = null;

  function getAnchorElement(pane) {
    const scope = pane || (typeof document !== 'undefined' ? document : null);
    if (!scope) return null;

    // 1. Classic action row on LinkedIn: The full container holding BOTH Apply and Save buttons
    // NOTE: Never match .jobs-apply-button--top-card because that is only the Apply button wrapper,
    // which caused the card to be inserted BETWEEN Apply and Save!
    const classicActionsRow = scope.querySelector(
      '.job-details-jobs-unified-top-card__actions-container, ' +
      '.jobs-unified-top-card__actions-container'
    );
    if (classicActionsRow) {
      lastAnchorStrategy = 'classic_actions_container';
      lastActionRow = classicActionsRow;
      logAnchorDebug(classicActionsRow);
      return classicActionsRow;
    }

    // 2. Semantic Apply + Save buttons (for /jobs/search-results/ with hashed classes):
    // 1. Semantic Apply + Save buttons (works across /jobs/search/ and /jobs/search-results/)
    const applyBtn = findApplyButton(scope);
    const saveBtn = findSaveButton(scope);

    let actionRow = null;
    let row = null;
    if (applyBtn && saveBtn) {
      actionRow = getClosestCommonAncestor(applyBtn, saveBtn, scope);
      row = getClosestCommonAncestor(applyBtn, saveBtn, scope);
      lastAnchorStrategy = 'semantic_apply_save';
    } else if (applyBtn) {
      actionRow = applyBtn.closest('[class*="actions"], [class*="action"]') || applyBtn.parentElement;
      row = applyBtn.closest('.job-details-jobs-unified-top-card__actions-container, .jobs-unified-top-card__actions-container, [class*="actions"], [class*="action"]') || applyBtn.parentElement;
      lastAnchorStrategy = 'semantic_apply_only';
    } else if (saveBtn) {
      actionRow = saveBtn.closest('[class*="actions"], [class*="action"]') || saveBtn.parentElement;
      row = saveBtn.closest('.job-details-jobs-unified-top-card__actions-container, .jobs-unified-top-card__actions-container, [class*="actions"], [class*="action"]') || saveBtn.parentElement;
      lastAnchorStrategy = 'semantic_save_only';
    }

    if (actionRow) {
      lastActionRow = actionRow;
      logAnchorDebug(actionRow);
      return actionRow;
    // Classic action row if buttons weren't located:
    if (!row) {
      const classicActionsRow = scope.querySelector(
        '.job-details-jobs-unified-top-card__actions-container, ' +
        '.jobs-unified-top-card__actions-container'
      );
      if (classicActionsRow) {
        row = classicActionsRow;
        lastAnchorStrategy = 'classic_actions_container';
      }
    }

    // Never insert after Apply or Save themselves
    if (row && (row === applyBtn || row === saveBtn)) {
      row = row.parentElement;
    }

    if (row) {
      const anchor = climbToBlockOrColumn(row, scope);
      lastActionRow = anchor;
      logAnchorDebug(anchor);
      return anchor;
    }

    // 3. Fallback: Job description element (#job-details) -> card will be inserted before it
    const descEl = scope.querySelector('#job-details, .jobs-description__content, .jobs-description');
    if (descEl) {
      lastAnchorStrategy = 'desc_fallback';
      lastActionRow = descEl;
      logAnchorDebug(descEl);
      return descEl;
    }

    // 4. Fallback directly under job title / heading in the details pane
    const h1 = scope.querySelector(
      '.job-details-jobs-unified-top-card__job-title, ' +
      '.jobs-unified-top-card__job-title, ' +
      'h1, [role="heading"][aria-level="1"], [role="heading"]'
    );
    if (h1 && !isFilterOrListElement(h1)) {
      lastAnchorStrategy = 'h1_fallback';
      lastActionRow = h1;
      logAnchorDebug(h1);
      return h1;
    }

    lastAnchorStrategy = 'none';
    lastActionRow = null;
    return null;
  }

  function insertCardAfterAnchor(anchor, container) {
    if (!container) return;
    container.style.cssText = 'display:block!important;width:100%!important;box-sizing:border-box!important;flex:1 1 100%!important;max-width:100%!important;margin:16px 0!important;position:relative!important;clear:both!important;';
    container.setAttribute('data-prepinterview-wrapper', 'true');
    container.style.cssText = 'display:block!important;width:100%!important;box-sizing:border-box!important;clear:both!important;flex:0 0 100%!important;align-self:stretch!important;padding:12px 0!important;margin:0!important;position:static!important;';

    if (!anchor) {
      const pane = getJobDetailsPane();
      const descEl = (pane && pane.querySelector('#job-details, .jobs-description__content, .jobs-description')) || (typeof document !== 'undefined' ? document.querySelector('#job-details') : null);
      if (descEl && typeof descEl.before === 'function') {
        descEl.before(container);
        logPlacementDebug(null, descEl, 0, container);
        return;
      }
      return;
    }

    // Safety guard: If anchor is the job description container itself (#job-details), insert BEFORE it
    if (anchor.id === 'job-details' || (anchor.classList && (anchor.classList.contains('jobs-description') || anchor.classList.contains('jobs-description__content')))) {
      if (typeof anchor.before === 'function') {
        anchor.before(container);
        logPlacementDebug(anchor, anchor, 0, container);
        return;
      } else if (anchor.parentNode) {
        anchor.parentNode.insertBefore(container, anchor);
        logPlacementDebug(anchor, anchor, 0, container);
        return;
      }
    }

    // Safety guard: Never insert as a child of any element that contains Apply or Save
    const applyBtn = findApplyButton(anchor.parentElement || anchor);
    const saveBtn = findSaveButton(anchor.parentElement || anchor);
    if (anchor === applyBtn || anchor === saveBtn) {
      anchor = anchor.parentElement;
    }

    if (anchor.parentElement) {
      try {
        const cs = typeof window !== 'undefined' && window.getComputedStyle ? window.getComputedStyle(anchor.parentElement) : null;
        if (cs && cs.display && cs.display.includes('flex') && cs.flexWrap === 'nowrap') {
          anchor.parentElement.style.flexWrap = 'wrap';
        }
      } catch (e) {}
    }

    if (typeof anchor.after === 'function') {
      anchor.after(container);
    } else if (anchor.insertAdjacentElement) {
      anchor.insertAdjacentElement('afterend', container);
    } else if (anchor.parentNode) {
      anchor.parentNode.insertBefore(container, anchor.nextSibling);
    }

    const rawRow = anchor.__prepinterview_raw_row || anchor;
    const climbed = anchor.__prepinterview_levels_climbed || 0;
    logPlacementDebug(rawRow, anchor, climbed, container);
  }

  let activeJobId = null;
  let activeFingerprint = null;
  let activeDesc = null;
  let activeDescLength = 0;
  let activeTitle = '';
  let activeCompany = '';
  let activeLocationMeta = '';
  let activeResumeText = '';
  let activeOverrides = {};
  let activeProfile = 'default';
  let activeOpenToRelocation = false;
  let cardObserver = null;
  let currentFlightId = 0;
  let retryTimers = [];
  let moDebounceTimer = null;
  let moObserver = null;
  let pollInterval = null;
  let domCheckTimer500 = null;
  let domCheckTimer2000 = null;
  let lastKnownHref = (typeof window !== 'undefined' && window.location && window.location.href) || '';

  let lastRecordedError = 'none';
  let noDescTimer = null;
  let waitingForDescTimedOut = false;
  let pendingDescText = '';
  let pendingDescTimer = null;
  let isDescStable = false;

  const isTestEnv = typeof process !== 'undefined' && (process.env.NODE_ENV === 'test' || (process.release && process.release.name === 'node'));
  const RETRY_DELAYS = isTestEnv ? [10, 20, 30] : [100, 200, 350, 500, 800, 1200, 1800];
  const NO_DESC_TIMEOUT = isTestEnv ? 200 : 8000;

  function clearDomCheckTimers() {
    if (domCheckTimer500) {
      clearTimeout(domCheckTimer500);
      domCheckTimer500 = null;
    }
    if (domCheckTimer2000) {
      clearTimeout(domCheckTimer2000);
      domCheckTimer2000 = null;
    }
  }

  function clearDescTimers() {
    if (noDescTimer) {
      clearTimeout(noDescTimer);
      noDescTimer = null;
    }
    if (pendingDescTimer) {
      clearTimeout(pendingDescTimer);
      pendingDescTimer = null;
    }
    waitingForDescTimedOut = false;
    pendingDescText = '';
    isDescStable = false;
  }

  function showFailedPill(reason) {
    if (reason) {
      lastRecordedError = reason;
      console.warn('[PrepInterview] Failed step:', reason);
    }
    let floatPill = (typeof document !== 'undefined') ? document.getElementById('prepinterview-floating-pill') : null;
    if (!floatPill && typeof document !== 'undefined' && document.body) {
      floatPill = document.createElement('div');
      floatPill.id = 'prepinterview-floating-pill';
      floatPill.className = 'prepinterview-floating-pill';
      floatPill.setAttribute('role', 'status');
      document.body.appendChild(floatPill);
    }
    if (floatPill) {
      floatPill.textContent = "Card didn't load. Refresh the page.";
      floatPill.classList.remove('hidden');
    }
  }

  function getUrlPathType() {
    if (typeof window === 'undefined' || !window.location) return 'unknown';
    const path = window.location.pathname || '';
    if (path.includes('/jobs/search-results')) return 'search-results';
    if (path.includes('/jobs/search')) return 'search';
    if (path.includes('/jobs/view')) return 'view';
    if (path.includes('/jobs/tracker')) return 'tracker';
    if (path.includes('/jobs/preferences')) return 'preferences';
    if (path.includes('/jobs')) return 'jobs';
    return 'other';
  }

  function getActionRowDebugInfo(actionRow) {
    if (!actionRow) return null;
    let display = 'unknown', flexDir = 'unknown';
    try {
      if (typeof window !== 'undefined' && window.getComputedStyle) {
        const cs = window.getComputedStyle(actionRow);
        display = cs.display || '';
        flexDir = cs.flexDirection || '';
      }
    } catch (e) {}
    if (!display && actionRow.style) display = actionRow.style.display || '';
    if (!flexDir && actionRow.style) flexDir = actionRow.style.flexDirection || '';

    const ancestors = [];
    let curr = actionRow.parentElement;
    for (let i = 0; i < 3 && curr && curr !== document.documentElement; i++) {
      let ancDisplay = 'unknown';
      try {
        if (typeof window !== 'undefined' && window.getComputedStyle) {
          ancDisplay = window.getComputedStyle(curr).display || '';
        }
      } catch (e) {}
      if (!ancDisplay && curr.style) ancDisplay = curr.style.display || '';
      ancestors.push({
        tag: (curr.tagName || '').toLowerCase(),
        display: ancDisplay || 'block'
      });
      curr = curr.parentElement;
    }

    return {
      tag: (actionRow.tagName || '').toLowerCase(),
      display: display || 'block',
      flexDirection: flexDir || 'row',
      ancestors: ancestors
    };
  }

  function attachCopyDebugListener(link) {
    if (!link) return;
    link.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();

      const card = (typeof document !== 'undefined') ? document.getElementById('prepinterview-copilot-card') : null;
      const report = {
        urlPathType: getUrlPathType(),
        gateResult: isViewingJob(),
        anchorStrategy: lastAnchorStrategy || 'none',
        actionRow: getActionRowDebugInfo(lastActionRow),
        descriptionLength: (activeDesc || '').length,
        stable: isDescStable ? 'yes' : 'no',
        cardInserted: Boolean(card && document.contains(card)) ? 'yes' : 'no',
        lastError: lastRecordedError || 'none'
      };

      const reportStr = JSON.stringify(report, null, 2);
      try {
        if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(reportStr).catch(() => {});
        }
      } catch (err) {}

      if (typeof window !== 'undefined') {
        window.__prepinterview_last_copied_debug = reportStr;
      }
      link.__lastCopiedReport = reportStr;

      const origText = link.textContent;
      link.textContent = 'Copied!';
      setTimeout(() => {
        link.textContent = origText;
      }, 2000);
    });
  }

  function handleDescriptionCandidate(newDesc) {
    if (!newDesc || newDesc.length < 200) return;
    if (newDesc !== pendingDescText) {
      pendingDescText = newDesc;
      isDescStable = false;
      clearTimeout(pendingDescTimer);
      pendingDescTimer = setTimeout(() => {
        const pane = getJobDetailsPane();
        const verifyDesc = pane ? getFullJobDescription(pane) : '';
        if (verifyDesc && verifyDesc === pendingDescText && verifyDesc.length >= 200) {
          isDescStable = true;
          activeDesc = verifyDesc;
          activeDescLength = verifyDesc.length;
          clearTimeout(noDescTimer);
          waitingForDescTimedOut = false;
          renderCardInPlace();
        }
      }, 500);
    }
  }

  function isContextInvalidated(err) {
    try {
      if (typeof chrome === 'undefined') return false;
      if (!chrome.runtime || !chrome.runtime.id) return true;
      if (err && (/invalidated/i.test(err.message || '') || /context/i.test(err.message || ''))) {
        return true;
      }
    } catch (e) {
      return true;
    }
    return false;
  }

  function clearRetryTimers() {
    retryTimers.forEach(t => clearTimeout(t));
    retryTimers = [];
  }

  function disconnectAll() {
    clearDomCheckTimers();
    clearDescTimers();
    if (moObserver) {
      try { moObserver.disconnect(); } catch (e) {}
      moObserver = null;
    }
    if (cardObserver) {
      try { cardObserver.disconnect(); } catch (e) {}
      cardObserver = null;
    }
    if (pollInterval) {
      clearInterval(pollInterval);
      pollInterval = null;
    }
    clearRetryTimers();
    if (moDebounceTimer) {
      clearTimeout(moDebounceTimer);
      moDebounceTimer = null;
    }
  }

  function isJobsPath() {
    if (typeof window === 'undefined' || !window.location) return false;
    const path = window.location.pathname || '';
    return path.startsWith('/jobs/') || path.startsWith('/comm/jobs/') || path === '/jobs' || path === '/comm/jobs';
  }

  function isNonJobLandingPage() {
    if (typeof window === 'undefined' || !window.location) return false;
    const pathname = (window.location.pathname || '').replace(/\/+$/, '');
    const search = window.location.search || '';

    // If there is an explicit job ID in query or path, it is NEVER a landing page
    if (search && /[?&]currentJobId=\d+/i.test(search)) return false;
    if (/\/jobs\/view\/\d+/i.test(pathname)) return false;

    // /jobs/search-results is an active search results page, not a non-job landing page
    if (pathname.includes('/jobs/search-results')) return false;

    // These specific paths are landing / tracker / preference dashboards with NO job selected by default:
    if (pathname === '/jobs' || pathname === '/comm/jobs') return true;
    if (pathname.startsWith('/jobs/tracker')) return true;
    if (pathname.startsWith('/jobs/preferences')) return true;
    if (pathname.startsWith('/jobs/my-items')) return true;

    return false;
  }

  function isViewingJob() {
    if (typeof window === 'undefined' || !window.location) return false;
    if (!isJobsPath()) return false;

    // Block non-job landing/dashboard pages
    if (isNonJobLandingPage()) return false;

    return true;
  }

  function removeCard() {
    clearDomCheckTimers();
    clearDescTimers();
    if (typeof document !== 'undefined') {
      const allContainers = document.querySelectorAll('#prepinterview-copilot-container');
      allContainers.forEach(el => el.remove());
      const pill = document.getElementById('prepinterview-floating-pill');
      if (pill) pill.remove();
    }
    if (cardObserver) {
      try { cardObserver.disconnect(); } catch (e) {}
      cardObserver = null;
    }
    activeJobId = null;
    activeFingerprint = null;
    activeDesc = null;
    activeDescLength = 0;
    activeTitle = '';
    activeCompany = '';
    activeLocationMeta = '';
  }

  let activeFlightJobId = null;
  let activeFlightPromise = null;

  function handleNavigation() {
    if (!isViewingJob()) {
      removeCard();
      return Promise.resolve();
    }

    const pane = getJobDetailsPane();
    const currentTargetId = getCurrentJobId(pane);

    // If a flight is already active and working on the exact same target job ID, reuse it only if card exists in DOM
    const card = (typeof document !== 'undefined') ? document.getElementById('prepinterview-copilot-card') : null;
    if (activeFlightPromise && activeFlightJobId && currentTargetId && activeFlightJobId === currentTargetId && card && document.contains(card)) {
      return activeFlightPromise;
    }

    clearRetryTimers();
    const flightId = ++currentFlightId;
    activeFlightJobId = currentTargetId;

    activeFlightPromise = executeFlight(flightId, 0).finally(() => {
      if (activeFlightJobId === currentTargetId) {
        activeFlightPromise = null;
        activeFlightJobId = null;
      }
    });

    return activeFlightPromise;
  }


  async function executeFlight(flightId, retryIndex) {
    if (!isViewingJob()) {
      removeCard();
      return;
    }

    const pane = getJobDetailsPane();
    const currentTargetId = getCurrentJobId(pane);

    // Only abort if user navigated away to a completely different job
    if (flightId !== currentFlightId && activeFlightJobId && currentTargetId && activeFlightJobId !== currentTargetId) {
      return;
    }

    const anchor = pane ? getAnchorElement(pane) : null;
    const desc = pane ? getFullJobDescription(pane) : '';
    const jobId = currentTargetId || (pane ? getCurrentJobId(pane) : '');
    const title = pane ? getJobTitle(pane) : '';

    // Guard against grabbing previous job's description while LinkedIn is fetching/rendering the new job
    const isStaleDesc = Boolean(
      activeDesc &&
      desc &&
      desc === activeDesc &&
      (
        (jobId && activeJobId && jobId !== activeJobId) ||
        (title && activeTitle && title !== 'Target Role' && activeTitle !== 'Target Role' && title !== activeTitle)
      )
    );

    // Decouple from description: as soon as pane && anchor exist, proceed immediately!
    const isReady = Boolean(pane && anchor);

    if (!isReady) {
      if (retryIndex < RETRY_DELAYS.length) {
        const delay = RETRY_DELAYS[retryIndex];
        return new Promise((resolve) => {
          const timer = setTimeout(async () => {
            const res = await executeFlight(flightId, retryIndex + 1);
            resolve(res);
          }, delay);
          retryTimers.push(timer);
        });
      } else {
        // Retries exhausted
        if (!anchor) {
          showFailedPill('Anchor or pane not found after retries');
        }
        if (!pane) {
          removeCard();
        }
        return;
      }
    }

    clearRetryTimers();
    return runInjectionForFlight(flightId, pane, anchor, isStaleDesc ? '' : desc);
  }

  function attachCardEventListeners(container, match, renderOptions) {
    if (!container) return;

    const toggleHeader = container.querySelector('#prepinterview-toggle-header');
    const detailsPanel = container.querySelector('#prepinterview-details-panel');
    const toggleBtn = container.querySelector('#prepinterview-toggle-btn');

    function toggleDetails() {
      if (!detailsPanel || !toggleBtn) return;
      const isHidden = detailsPanel.classList.toggle('prepinterview-collapsed');
      const nowExpanded = !isHidden;
      toggleBtn.textContent = nowExpanded ? 'Hide Match Insights ▴' : 'View Match Insights ▾';
      toggleBtn.setAttribute('aria-expanded', nowExpanded ? 'true' : 'false');
      if (toggleHeader) toggleHeader.setAttribute('aria-expanded', nowExpanded ? 'true' : 'false');
      try {
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem('prepinterview_is_expanded', nowExpanded ? 'true' : 'false');
        }
      } catch (e) {}
    }

    if (toggleHeader) {
      toggleHeader.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleDetails();
      });
      toggleHeader.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          e.stopPropagation();
          toggleDetails();
        }
      });
    }

    // Relocation Switch: updates storage and re-renders IN-PLACE without moving container in DOM
    const relSwitch = container.querySelector('#prepinterview-card-relocation-toggle');
    if (relSwitch) {
      const handleSwitch = async (e) => {
        e.stopPropagation();
        e.preventDefault();
        const currentVal = relSwitch.getAttribute('aria-checked') === 'true';
        const newVal = !currentVal;
        relSwitch.setAttribute('aria-checked', newVal ? 'true' : 'false');
        if (newVal) {
          relSwitch.classList.add('active');
        } else {
          relSwitch.classList.remove('active');
        }
        activeOpenToRelocation = newVal;
        try {
          if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
            await chrome.storage.local.set({ openToRelocation: newVal });
          }
        } catch (err) {
          if (isContextInvalidated(err)) {
            disconnectAll();
          }
        }
        // In-place update: container mount is never touched, zero jumping
        renderCardInPlace(newVal);
      };

      relSwitch.addEventListener('click', handleSwitch);
      relSwitch.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          handleSwitch(e);
        }
      });
    }

    // "Score looks off?" click handler
    const diagLink = container.querySelector('#prepinterview-diag-link');
    if (diagLink) {
      diagLink.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const renderer = (typeof window !== 'undefined' && window.PrepInterview && window.PrepInterview.CardRenderer) || CardRenderer;
        const relConfig = (typeof window !== 'undefined' && window.PrepInterview && window.PrepInterview.ReleaseConfig)
          ? window.PrepInterview.ReleaseConfig
          : null;
        if (renderer && typeof renderer.handleScoreLooksOff === 'function') {
          renderer.handleScoreLooksOff(window, relConfig);
        } else {
          const url = (relConfig && relConfig.FEEDBACK_URL && typeof relConfig.FEEDBACK_URL === 'string')
            ? relConfig.FEEDBACK_URL.trim()
            : '';
          if (url && url !== 'REPLACE_ME') {
            window.open(url, '_blank', 'noopener,noreferrer');
          }
        }
      });
    }

    // 1-Click CTA Launch handler: opens tab with JD text, title and company. RESUME IS NEVER SENT.
    const ctaButtons = container.querySelectorAll('.prepinterview-action-trigger');
    ctaButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const targetUrl = 'https://prepinterview.online/?jd=' + encodeURIComponent(activeDesc || '') +
                          '&title=' + encodeURIComponent(activeTitle || '') +
                          '&company=' + encodeURIComponent(activeCompany || '') +
                          '&utm_source=linkedin_copilot';
        window.open(targetUrl, '_blank', 'noopener,noreferrer');
      });
    });
  }

  function renderCardInPlace(overrideRelocationVal) {
    if (!isViewingJob()) {
      removeCard();
      return;
    }
    let container = (typeof document !== 'undefined') ? document.getElementById('prepinterview-copilot-container') : null;
    const pane = getJobDetailsPane();
    if (!pane) {
      removeCard();
      return;
    }

    const anchor = getAnchorElement(pane);
    const anchorTag = anchor ? anchor.tagName.toLowerCase() : '';
    const anchorClasses = anchor && anchor.className ? '.' + String(anchor.className).trim().split(/\s+/).filter(Boolean).join('.') : '';
    console.log('[PrepInterview] Anchor found: ' + (anchor ? (anchorTag + anchorClasses) : 'none'));

    const existingCard = (typeof document !== 'undefined') ? document.getElementById('prepinterview-copilot-card') : null;
    const cardAlreadyInDom = Boolean(existingCard && document.contains(existingCard));

    if (!cardAlreadyInDom || !container || !pane.contains(container)) {
      if (container) container.remove();
      container = document.createElement('div');
      container.id = 'prepinterview-copilot-container';
      insertCardAfterAnchor(anchor, container);
      if (!pane.contains(container)) {
        const descEl = (pane && pane.querySelector('#job-details, .jobs-description__content, .jobs-description')) || (typeof document !== 'undefined' ? document.querySelector('#job-details') : null);
        if (descEl && typeof descEl.before === 'function') {
          descEl.before(container);
        } else if (pane.firstElementChild) {
          pane.insertBefore(container, pane.firstElementChild);
        }
      }
    }
    if (!container) return;

    if (typeof overrideRelocationVal === 'boolean') {
      activeOpenToRelocation = overrideRelocationVal;
    }

    if (!activeDesc || activeDesc.length < 200 || !isDescStable) {
      const copyDebugLink = '<a href="#" id="prepinterview-copy-debug-link" role="button" style="color:#58a6ff; text-decoration:underline; font-size:11px;">Copy debug info</a>';
      if (waitingForDescTimedOut) {
        container.innerHTML = `
          <div id="prepinterview-copilot-card" class="prepinterview-widget-card prepinterview-card-neutral" data-job-id="${activeJobId || ''}">
            <div class="prepinterview-header" style="padding:12px 16px; border-bottom:1px solid #30363d; display:flex; justify-content:space-between; align-items:center;">
              <span class="prepinterview-score-pill prepinterview-tier-neutral" style="background:#21262d; color:#8b949e; border:1px solid #30363d; border-radius:12px; padding:4px 10px; font-size:12px; font-weight:600;">Scroll to load job</span>
            </div>
            <div class="prepinterview-body" style="padding:14px 16px; font-size:13px; color:#c9d1d9; line-height:1.5;">
              Scroll down so the job description loads, then the score appears.
              <div style="margin-top:12px;">${copyDebugLink}</div>
            </div>
          </div>
        `;
        const floatPill = (typeof document !== 'undefined') ? document.getElementById('prepinterview-floating-pill') : null;
        if (floatPill) {
          floatPill.textContent = 'Scroll to load job';
          floatPill.setAttribute('aria-label', 'PrepInterview: Scroll to load job');
          floatPill.classList.remove('hidden');
        }
      } else {
        container.innerHTML = `
          <div id="prepinterview-copilot-card" class="prepinterview-widget-card prepinterview-card-loading" data-job-id="${activeJobId || ''}">
            <div class="prepinterview-header" style="padding:12px 16px; border-bottom:1px solid #30363d; display:flex; justify-content:space-between; align-items:center;">
              <span class="prepinterview-score-pill prepinterview-tier-neutral" style="background:#21262d; color:#8b949e; border:1px solid #30363d; border-radius:12px; padding:4px 10px; font-size:12px; font-weight:600;">Reading job description…</span>
            </div>
            <div class="prepinterview-body" style="padding:14px 16px; font-size:13px; color:#8b949e; line-height:1.5;">
              Reading job description…
              <div style="margin-top:12px;">${copyDebugLink}</div>
            </div>
          </div>
        `;
        const floatPill = (typeof document !== 'undefined') ? document.getElementById('prepinterview-floating-pill') : null;
        if (floatPill) {
          floatPill.textContent = 'Reading job description…';
          floatPill.setAttribute('aria-label', 'PrepInterview: Reading job description…');
          floatPill.classList.remove('hidden');
        }
      }

      const cardEl = (typeof document !== 'undefined') ? document.getElementById('prepinterview-copilot-card') : null;
      const cardInserted = Boolean(cardEl && document.contains(cardEl));
      console.log('[PrepInterview] Card inserted: ' + (cardInserted ? 'yes' : 'no'));

      attachCopyDebugListener(container.querySelector('#prepinterview-copy-debug-link'));

      clearDomCheckTimers();
      domCheckTimer500 = setTimeout(() => {
        const c = (typeof document !== 'undefined') ? document.getElementById('prepinterview-copilot-card') : null;
        const present = Boolean(c && document.contains(c));
        console.log('[PrepInterview] Card still in DOM 500ms later: ' + (present ? 'yes' : 'no'));
        if (!present && isViewingJob()) {
          renderCardInPlace();
        }
      }, 500);

      domCheckTimer2000 = setTimeout(() => {
        const c = (typeof document !== 'undefined') ? document.getElementById('prepinterview-copilot-card') : null;
        const present = Boolean(c && document.contains(c));
        console.log('[PrepInterview] Card still in DOM 2s later: ' + (present ? 'yes' : 'no'));
        if (!present && isViewingJob()) {
          renderCardInPlace();
        }
      }, 2000);

      return;
    }

    const renderer = (typeof window !== 'undefined' && window.PrepInterview && window.PrepInterview.CardRenderer) || CardRenderer;
    const matcher = (typeof window !== 'undefined' && window.PrepInterview && window.PrepInterview.Matcher) || Matcher;

    const descText = activeDesc || '';
    const match = matcher && typeof matcher.evaluate === 'function'
      ? matcher.evaluate(activeResumeText, descText, {
          locationMeta: activeLocationMeta,
          jobTitle: activeTitle,
          openToRelocation: activeOpenToRelocation
        })
      : {
          status: activeResumeText ? 'ready' : 'no_resume',
          score: 50,
          tier: 'Moderate Match',
          matchedSkills: [],
          missingSkills: [],
          hardGaps: [],
          softGaps: [],
          notes: [],
          breakdown: []
        };

    const fingerprint = renderer && typeof renderer.getRenderFingerprint === 'function'
      ? renderer.getRenderFingerprint(activeResumeText, {
          openToRelocation: activeOpenToRelocation,
          overrides: activeOverrides,
          activeProfile: activeProfile
        })
      : `${activeResumeText.length}_${activeOpenToRelocation}`;

    activeFingerprint = fingerprint;

    let isExpanded = false;
    try {
      if (typeof localStorage !== 'undefined') {
        isExpanded = localStorage.getItem('prepinterview_is_expanded') === 'true';
      }
    } catch (e) {}

    let extractedMinExp = (match.jdReq && typeof match.jdReq.minExp === 'number' && match.jdReq.minExp > 0)
      ? match.jdReq.minExp
      : (typeof match.extractedMinExp === 'number' && match.extractedMinExp > 0 ? match.extractedMinExp : null);

    if (extractedMinExp === null && typeof descText === 'string') {
      extractedMinExp = extractMinExpFromDescription(descText);
    }

    const renderOptions = {
      title: activeTitle,
      company: activeCompany,
      jobId: activeJobId,
      openToRelocation: activeOpenToRelocation,
      isExpanded: isExpanded,
      extractedMinExp: extractedMinExp,
      extractedSkills: (match.jdReq && match.jdReq.extractedSkills) || match.extractedSkills || (match.matchedSkills && match.missingSkills ? match.matchedSkills.concat(match.missingSkills) : []),
      workMode: (match.jdReq && match.jdReq.workMode) || match.workMode || (descText.toLowerCase().includes('remote') ? 'Remote' : (descText.toLowerCase().includes('hybrid') ? 'Hybrid' : 'On-site')),
      locationMatched: !match.hardGaps || !match.hardGaps.some(g => /location/i.test(g)),
      educationMentioned: Boolean((match.jdReq && (match.jdReq.degreeMandatory || match.jdReq.tierMandatory || match.jdReq.tierPreferred)) || /bachelor|master|b\.?tech|degree|mba|phd/i.test(descText))
    };

    const cardHtml = renderer && typeof renderer.renderCopilotCard === 'function'
      ? renderer.renderCopilotCard(match, renderOptions)
      : `<div class="prepinterview-header"><span class="prepinterview-score-pill">${match.score}% ${match.tier}</span></div>`;

    container.innerHTML = `<div id="prepinterview-copilot-card" class="prepinterview-widget-card" data-job-id="${activeJobId}" data-fingerprint="${fingerprint}">${cardHtml}</div>`;

    const cardEl = (typeof document !== 'undefined') ? document.getElementById('prepinterview-copilot-card') : null;
    const cardInserted = Boolean(cardEl && document.contains(cardEl));
    console.log('[PrepInterview] Card inserted: ' + (cardInserted ? 'yes' : 'no'));

    attachCardEventListeners(container, match, renderOptions);
    attachCopyDebugListener(container.querySelector('#prepinterview-copy-debug-link'));

    // Update floating pill if present
    const floatPill = (typeof document !== 'undefined') ? document.getElementById('prepinterview-floating-pill') : null;
    if (floatPill) {
      if (renderer && typeof renderer.renderFloatingPill === 'function') {
        floatPill.innerHTML = renderer.renderFloatingPill(match, renderOptions);
      } else {
        floatPill.textContent = `PrepInterview: ${match.score}%`;
      }
      floatPill.setAttribute('aria-label', `PrepInterview match score: ${match.score}%`);
    }

    clearDomCheckTimers();
    domCheckTimer500 = setTimeout(() => {
      const c = (typeof document !== 'undefined') ? document.getElementById('prepinterview-copilot-card') : null;
      const present = Boolean(c && document.contains(c));
      console.log('[PrepInterview] Card still in DOM 500ms later: ' + (present ? 'yes' : 'no'));
      if (!present && isViewingJob()) {
        renderCardInPlace();
      }
    }, 500);

    domCheckTimer2000 = setTimeout(() => {
      const c = (typeof document !== 'undefined') ? document.getElementById('prepinterview-copilot-card') : null;
      const present = Boolean(c && document.contains(c));
      console.log('[PrepInterview] Card still in DOM 2s later: ' + (present ? 'yes' : 'no'));
      if (!present && isViewingJob()) {
        renderCardInPlace();
      }
    }, 2000);
  }

  async function runInjectionForFlight(flightId, pane, anchor, desc) {
    if (!isViewingJob()) {
      removeCard();
      return;
    }
    const livePane = getJobDetailsPane() || pane;
    if (!livePane) {
      removeCard();
      return;
    }
    const currentTargetId = getCurrentJobId(livePane);

    // Only abort if the user navigated away to a completely different job
    if (activeFlightJobId && currentTargetId && activeFlightJobId !== currentTargetId) {
      return;
    }

    const jobId = currentTargetId || getCurrentJobId(livePane);
    const title = getJobTitle(livePane);
    const company = getCompanyName(livePane);

    let resumeText = '';
    let openToRelocation = false;
    let overrides = {};
    let activeProfile = 'default';

    try {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        const stored = await chrome.storage.local.get(['resumeText', 'openToRelocation', 'overrides', 'activeProfile']);
        resumeText = stored.resumeText || '';
        openToRelocation = Boolean(stored.openToRelocation);
        overrides = stored.overrides || {};
        activeProfile = stored.activeProfile || 'default';
      }
    } catch (err) {
      if (isContextInvalidated(err)) {
        disconnectAll();
        return;
      }
    }

    const latestPane = getJobDetailsPane() || livePane;
    const latestTargetId = getCurrentJobId(latestPane);
    if (jobId && latestTargetId && jobId !== latestTargetId) {
      return; // User switched jobs during storage read
    }

    const renderer = (typeof window !== 'undefined' && window.PrepInterview && window.PrepInterview.CardRenderer) || CardRenderer;

    const fingerprint = renderer && typeof renderer.getRenderFingerprint === 'function'
      ? renderer.getRenderFingerprint(resumeText, { openToRelocation, overrides, activeProfile })
      : `${resumeText.length}_${openToRelocation}`;

    // Re-render when job ID or description changes
    const isSameJob = Boolean(
      jobId && activeJobId && jobId === activeJobId &&
      (!title || !activeTitle || title === activeTitle) &&
      (!desc || !activeDesc || desc.slice(0, 150) === activeDesc.slice(0, 150))
    );
    const isSameDesc = (desc === activeDesc);
    const isSameFingerprint = (fingerprint === activeFingerprint);
    const existingContainer = (typeof document !== 'undefined') ? document.getElementById('prepinterview-copilot-container') : null;
    const card = (typeof document !== 'undefined') ? document.getElementById('prepinterview-copilot-card') : null;
    const cardExists = Boolean(card && document.contains(card));

    if (isSameJob && isSameDesc && isSameFingerprint && cardExists && latestPane && latestPane.contains(card)) {
      return;
    }

    // Resolve fresh live anchor in case DOM reconciled during async read
    let liveAnchor = anchor;
    if (!liveAnchor || !liveAnchor.isConnected || (latestPane && !latestPane.contains(liveAnchor))) {
      liveAnchor = latestPane ? getAnchorElement(latestPane) : null;
    }

    // Single dedicated mount container: ensure only ONE container exists in DOM
    let container = existingContainer;
    const allContainers = (typeof document !== 'undefined') ? document.querySelectorAll('#prepinterview-copilot-container') : [];
    if (allContainers.length > 1) {
      allContainers.forEach((el, idx) => { if (idx > 0) el.remove(); });
      container = allContainers[0];
    }

    if (!container || !latestPane || !latestPane.contains(container)) {
      if (container) container.remove();
      container = document.createElement('div');
      container.id = 'prepinterview-copilot-container';
      insertCardAfterAnchor(liveAnchor, container);
    } else if (!isSameJob) {
      // When switching to a different job, ensure container is anchored to the new job's header
      insertCardAfterAnchor(liveAnchor, container);
    }

    // Failsafe: if container is still not inside pane, insert before job description
    if (latestPane && !latestPane.contains(container)) {
      const descEl = (latestPane && latestPane.querySelector('#job-details, .jobs-description__content, .jobs-description')) || (typeof document !== 'undefined' ? document.querySelector('#job-details') : null);
      if (descEl && typeof descEl.before === 'function') {
        descEl.before(container);
      } else if (latestPane.firstElementChild) {
        latestPane.insertBefore(container, latestPane.firstElementChild);
      }
    }

    const locationMeta = getJobLocation(pane);

    activeJobId = jobId;
    activeFingerprint = fingerprint;
    activeTitle = title;
    activeCompany = company;
    activeLocationMeta = locationMeta;
    activeResumeText = resumeText;
    activeOverrides = overrides;
    activeProfile = activeProfile;
    activeOpenToRelocation = openToRelocation;
    if (typeof window !== 'undefined' && window.location && window.location.href) {
      lastKnownHref = window.location.href;
    }

    clearDescTimers();
    if (desc && desc.length >= 200) {
      activeDesc = desc;
      activeDescLength = desc.length;
      isDescStable = true;
      waitingForDescTimedOut = false;
    } else {
      activeDesc = '';
      activeDescLength = 0;
      isDescStable = false;
      waitingForDescTimedOut = false;
      noDescTimer = setTimeout(() => {
        waitingForDescTimedOut = true;
        renderCardInPlace();
      }, NO_DESC_TIMEOUT);
    }

    renderCardInPlace();

    // Floating pill docked clear of LinkedIn Messaging
    let floatPill = (typeof document !== 'undefined') ? document.getElementById('prepinterview-floating-pill') : null;
    if (!floatPill && typeof document !== 'undefined' && document.body) {
      floatPill = document.createElement('div');
      floatPill.id = 'prepinterview-floating-pill';
      floatPill.className = 'prepinterview-floating-pill';
      floatPill.setAttribute('role', 'status');
      document.body.appendChild(floatPill);
      floatPill.addEventListener('click', (e) => {
        e.stopPropagation();
        if (container) container.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
    }

    // Hide floating pill while card is visible in viewport via IntersectionObserver
    if (cardObserver) {
      try { cardObserver.disconnect(); } catch (e) {}
      cardObserver = null;
    }
    const IO = (typeof window !== 'undefined' && window.IntersectionObserver) || null;
    if (IO && floatPill && container) {
      try {
        cardObserver = new IO((entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              floatPill.classList.add('hidden');
            } else {
              floatPill.classList.remove('hidden');
            }
          });
        }, { threshold: 0.1 });
        cardObserver.observe(container);
      } catch (e) {}
    }
  }

  async function runInjection() {
    return handleNavigation();
  }

  // --- 3. LIFECYCLE LISTENERS: OBSERVER, POPSTATE & 250MS POLL ---
  function onMutationObserved(mutations) {
    if (mutations && mutations.length > 0) {
      const isOnlyOurMutations = mutations.every(m => {
        const t = m.target;
        return t && t.closest && (
          t.closest('#prepinterview-copilot-container') ||
          t.closest('#prepinterview-floating-pill')
        );
      });
      if (isOnlyOurMutations) {
        return;
      }
    }

    clearTimeout(moDebounceTimer);
    moDebounceTimer = setTimeout(() => {
      if (!isViewingJob()) {
        if (typeof document !== 'undefined' && (document.getElementById('prepinterview-copilot-container') || document.getElementById('prepinterview-floating-pill'))) {
          removeCard();
        }
        return;
      }

      if (typeof window !== 'undefined' && window.location && window.location.href) {
        if (lastKnownHref && window.location.href !== lastKnownHref) {
          lastKnownHref = window.location.href;
          handleNavigation();
          return;
        }
      }

      const pane = getJobDetailsPane();
      const currentId = getCurrentJobId(pane);
      const currentTitle = pane ? getJobTitle(pane) : '';
      const currentDesc = pane ? getFullJobDescription(pane) : '';
      const card = (typeof document !== 'undefined') ? document.getElementById('prepinterview-copilot-card') : null;
      const cardExists = Boolean(card && document.contains(card));

      const isDifferentJob = Boolean(
        (currentId && activeJobId && currentId !== activeJobId) ||
        (currentTitle && activeTitle && currentTitle !== 'Target Role' && activeTitle !== 'Target Role' && currentTitle !== activeTitle) ||
        (currentDesc && activeDesc && currentDesc.slice(0, 150) !== activeDesc.slice(0, 150))
      );

      if (isDifferentJob) {
        handleNavigation();
        return;
      }

      // Check for dynamic description arrival on current job
      if (currentDesc && currentDesc.length >= 200 && (!activeDesc || currentDesc !== activeDesc)) {
        handleDescriptionCandidate(currentDesc);
        return;
      }

      // Re-run injection if LinkedIn removed the card from the DOM
      if (!cardExists || (pane && !pane.contains(card))) {
        renderCardInPlace();
        return;
      }

      // Guard: If card is already properly mounted for current job ID, update if JD expanded
      if (cardExists && !isDifferentJob && pane && pane.contains(card)) {
        if (currentDesc && activeDesc && currentDesc.length > activeDesc.length + 80) {
          activeDesc = currentDesc;
          activeDescLength = currentDesc.length;
          renderCardInPlace();
        }
      }
    }, 50);
  }

  function attachNavigationListeners(targetWindow) {
    const win = targetWindow || (typeof window !== 'undefined' ? window : null);
    if (!win || !win.document) return;
    const doc = win.document;

    disconnectAll();

    // 1. Hook history.pushState & replaceState for immediate SPA navigation reaction
    if (win.history && !win.history.__prepinterview_patched) {
      const origPush = win.history.pushState;
      if (typeof origPush === 'function') {
        win.history.pushState = function() {
          const ret = origPush.apply(this, arguments);
          setTimeout(handleNavigation, 50);
          setTimeout(handleNavigation, 250);
          return ret;
        };
      }
      const origReplace = win.history.replaceState;
      if (typeof origReplace === 'function') {
        win.history.replaceState = function() {
          const ret = origReplace.apply(this, arguments);
          setTimeout(handleNavigation, 50);
          setTimeout(handleNavigation, 250);
          return ret;
        };
      }
      win.history.__prepinterview_patched = true;
    }

    // 2. Direct click listener on job search results list cards, list items, and job links
    if (doc.addEventListener) {
      doc.addEventListener('click', (e) => {
        try {
          const target = e.target;
          if (!target) return;
          const isJobElement = target.closest && (
            target.closest('.jobs-search-results-list') ||
            target.closest('.scaffold-layout__list') ||
            target.closest('.jobs-search-results') ||
            target.closest('.job-card-container') ||
            target.closest('.job-card-list') ||
            target.closest('.artdeco-entity-lockup') ||
            target.closest('[data-view-name="job-card"]') ||
            target.closest('[data-job-id]') ||
            target.closest('[data-occludable-job-id]') ||
            target.closest('a[href*="/jobs/view/"]') ||
            target.closest('a[href*="currentJobId="]')
          );
          if (isJobElement) {
            setTimeout(handleNavigation, 50);
            setTimeout(handleNavigation, 250);
            setTimeout(handleNavigation, 750);
          }
        } catch (err) {}
      }, true);
    }

    // 3. MutationObserver (50ms debounce)
    const MO = win.MutationObserver || (typeof MutationObserver !== 'undefined' ? MutationObserver : null);
    if (MO) {
      moObserver = new MO((mutations) => {
        onMutationObserved(mutations);
      });
      const targetNode = doc.body || doc.documentElement;
      if (targetNode) {
        moObserver.observe(targetNode, { childList: true, subtree: true });
      }
    }

    // 4. popstate
    if (win.addEventListener) {
      win.addEventListener('popstate', () => {
        handleNavigation();
      });
    }

    // 5. 250ms URL/job-ID poll
    pollInterval = setInterval(() => {
      if (isContextInvalidated()) {
        disconnectAll();
        return;
      }
      if (!isViewingJob()) {
        if (doc.getElementById('prepinterview-copilot-container') || doc.getElementById('prepinterview-floating-pill')) {
          removeCard();
        }
        return;
      }

      if (win.location && win.location.href) {
        if (lastKnownHref && win.location.href !== lastKnownHref) {
          lastKnownHref = win.location.href;
          handleNavigation();
          return;
        }
      }

      const pane = getJobDetailsPane();
      const currentId = getCurrentJobId(pane);
      const currentTitle = pane ? getJobTitle(pane) : '';
      const currentDesc = pane ? getFullJobDescription(pane) : '';
      const card = doc.getElementById('prepinterview-copilot-card');
      const cardExists = Boolean(card && doc.contains(card));

      const isDifferentJob = Boolean(
        (currentId && activeJobId && currentId !== activeJobId) ||
        (currentTitle && activeTitle && currentTitle !== 'Target Role' && activeTitle !== 'Target Role' && currentTitle !== activeTitle) ||
        (currentDesc && activeDesc && currentDesc.slice(0, 150) !== activeDesc.slice(0, 150))
      );

      if (isDifferentJob) {
        handleNavigation();
        return;
      }

      // Check for dynamic description arrival on current job
      if (currentDesc && currentDesc.length >= 200 && (!activeDesc || currentDesc !== activeDesc)) {
        handleDescriptionCandidate(currentDesc);
        return;
      }

      // Self-healing: If it is the SAME job but LinkedIn removed the card, re-insert immediately
      if (!cardExists) {
        renderCardInPlace();
        return;
      }

      if (cardExists && !isDifferentJob && pane && pane.contains(card)) {
        if (currentDesc && activeDesc && currentDesc.length > activeDesc.length + 80) {
          activeDesc = currentDesc;
          activeDescLength = currentDesc.length;
          renderCardInPlace();
        }
      }
    }, 250);

    // Initial navigation check without early return
    handleNavigation();
  }

  // Attach automatically in browser on every page
  if (typeof window !== 'undefined' && typeof document !== 'undefined' && (typeof process === 'undefined' || !process.release || process.release.name !== 'node')) {
    attachNavigationListeners(window);
  }

  // Storage listener reacting to resume and every setting
  try {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.onChanged) {
      chrome.storage.onChanged.addListener((changes, areaName) => {
        try {
          if (areaName === 'local') {
            const relevantKeys = ['resumeText', 'openToRelocation', 'overrides', 'activeProfile'];
            const hasRelevantChange = Object.keys(changes).some(k => relevantKeys.includes(k));
            if (hasRelevantChange) {
              const currentId = getCurrentJobId();
              const existingCont = (typeof document !== 'undefined') ? document.getElementById('prepinterview-copilot-container') : null;
              if (existingCont && currentId && currentId === activeJobId) {
                if (changes.openToRelocation) activeOpenToRelocation = Boolean(changes.openToRelocation.newValue);
                if (changes.resumeText) activeResumeText = changes.resumeText.newValue || '';
                if (changes.overrides) activeOverrides = changes.overrides.newValue || {};
                if (changes.activeProfile) activeProfile = changes.activeProfile.newValue || 'default';
                // In-place update: keep container exactly where it is!
                renderCardInPlace();
              } else {
                activeFingerprint = null;
                handleNavigation();
              }
            }
          }
        } catch (err) {
          if (isContextInvalidated(err)) {
            disconnectAll();
          }
        }
      });
    }
  } catch (err) {
    if (isContextInvalidated(err)) {
      disconnectAll();
    }
  }

  // Broadcast message listener from popup
  try {
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
      chrome.runtime.onMessage.addListener((msg) => {
        try {
          if (msg && (msg.action === 'RESUME_UPDATED' || msg.action === 'SETTINGS_UPDATED')) {
            const currentId = getCurrentJobId();
            const existingCont = (typeof document !== 'undefined') ? document.getElementById('prepinterview-copilot-container') : null;
            if (existingCont && currentId && currentId === activeJobId) {
              chrome.storage.local.get(['resumeText', 'openToRelocation', 'overrides', 'activeProfile']).then(stored => {
                activeResumeText = stored.resumeText || '';
                activeOpenToRelocation = Boolean(stored.openToRelocation);
                activeOverrides = stored.overrides || {};
                activeProfile = stored.activeProfile || 'default';
                renderCardInPlace();
              }).catch(() => {});
            } else {
              activeFingerprint = null;
              handleNavigation();
            }
          }
        } catch (err) {
          if (isContextInvalidated(err)) {
            disconnectAll();
          }
        }
      });
    }
  } catch (err) {
    if (isContextInvalidated(err)) {
      disconnectAll();
    }
  }

  // Expose helpers for testing and external access
  if (typeof window !== 'undefined') {
    window.PrepInterview = window.PrepInterview || {};
    window.PrepInterview.getAnchorElement = getAnchorElement;
    window.PrepInterview.getClosestCommonAncestor = getClosestCommonAncestor;
    window.PrepInterview.isFlexOrGrid = isFlexOrGrid;
    window.PrepInterview.logAnchorDebug = logAnchorDebug;
    window.PrepInterview.insertCardAfterAnchor = insertCardAfterAnchor;
    window.PrepInterview.handleNavigation = handleNavigation;
    window.PrepInterview.runInjection = runInjection;
    window.PrepInterview.renderCardInPlace = renderCardInPlace;
    window.PrepInterview.onMutationObserved = onMutationObserved;
    window.PrepInterview.attachNavigationListeners = attachNavigationListeners;
    window.PrepInterview.disconnectAll = disconnectAll;
    window.PrepInterview.removeCard = removeCard;
    window.PrepInterview.isJobsPath = isJobsPath;
    window.PrepInterview.isNonJobLandingPage = isNonJobLandingPage;
    window.PrepInterview.isViewingJob = isViewingJob;
    window.PrepInterview.getJobDetailsPane = getJobDetailsPane;
    window.PrepInterview.getCurrentJobId = getCurrentJobId;
    window.PrepInterview.getFullJobDescription = getFullJobDescription;
    window.PrepInterview.climbToBlockOrColumn = climbToBlockOrColumn;
    window.PrepInterview.isFlexRowOrGrid = isFlexRowOrGrid;
    window.PrepInterview.logPlacementDebug = logPlacementDebug;
  }
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
      getAnchorElement,
      getClosestCommonAncestor,
      isFlexOrGrid,
      isFlexRowOrGrid,
      climbToBlockOrColumn,
      logAnchorDebug,
      logPlacementDebug,
      insertCardAfterAnchor,
      handleNavigation,
      runInjection,
      renderCardInPlace,
      onMutationObserved,
      attachNavigationListeners,
      disconnectAll,
      removeCard,
      isJobsPath,
      isNonJobLandingPage,
      isViewingJob,
      getJobDetailsPane,
      getCurrentJobId,
      getFullJobDescription
    };
  }
})();
