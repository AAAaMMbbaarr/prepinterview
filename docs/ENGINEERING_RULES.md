# PrepInterview Copilot — Engineering Rules & Non-Negotiables

These engineering rules are strictly enforced across the PrepInterview Copilot codebase. Any Pull Request or commit violating these principles must be rejected during review and automated CI checks.

---

## 1. Manifest V3 & Minimal Permission Surface
- The extension runs exclusively on Chrome Manifest V3.
- Permissions must remain strictly limited to:
  - `"storage"` for persisting user preferences, parsed resume text, and local candidate profile settings.
- Host permissions must remain strictly limited to:
  - `"*://*.linkedin.com/*"` for reading job postings and injecting the non-intrusive evaluation panel.
- Under no circumstances may background scripts or content scripts request broad permissions (such as `"<all_urls>"`, `"webRequest"`, `"cookies"`, or `"tabs"`).

---

## 2. Zero Outbound Network Requests
- The extension runs completely client-side and offline after installation.
- Absolutely **zero outbound network requests** (no `fetch()`, `XMLHttpRequest`, `WebSocket`, or `navigator.sendBeacon()`).
- Absolutely no external resources, CDNs, external stylesheets, analytics pixels (e.g. Google Analytics, Mixpanel), or remote fonts may be loaded.
- All code, vendor libraries, icons, stylesheets, and datasets must be bundled locally inside the extension directory.
- Automated static checks in the test suite enforce that no network primitives or remote URLs exist in extension scripts.

---

## 3. Total Resume & Data Privacy: Never Leaves the Browser
- Candidate resumes and job description texts contain sensitive, personally identifiable information (PII).
- Parsing, keyword matching, multi-factor evaluation, date math, and gap analysis must execute **100% locally** in the content script sandbox.
- The raw resume text, parsed profile, and scoring results **never leave the user's browser**.
- Resume data stored in `chrome.storage.local` stays strictly within the user's local Chrome profile and is never synced or exfiltrated.

---

## 4. Defensible Scoring Claims & Honest Communication
- We never make unrealistic or legally hazardous claims such as "Interview Probability", "Hiring Chance", "Offer Likelihood", or "Guaranteed Selection".
- The evaluation engine computes an objective **Role Readiness Score** (scaled 20–98) and categorizes candidates into clear fit tiers:
  - **High Fit** (80–98)
  - **Moderate Fit** (60–79)
  - **Low Fit** (40–59)
  - **Gap Detected / Disqualified** (<40 or disqualifier triggered)
- Disqualifiers and gaps must be communicated in simple, factual, and neutral terms (e.g. "College tier requirement not met", "Experience below required minimum").

---

## 5. Centralized Configuration
- Hardcoded weights, penalty factors, floor/ceiling bounds, and tier thresholds scattered across parsing logic are strictly forbidden.
- All scoring parameters, weights, penalty values, tier thresholds, and score bounds must reside exclusively in `scripts/scoring-config.js`.
- Any modification to weights or scoring curves requires updating this central configuration file and running the regression test suite.

---

## 6. Decoupled Data & Modular Separation of Concerns
- Data tables must not be embedded inside evaluation or DOM logic.
- They must be structured into standalone modules located in `scripts/data/`:
  - `scripts/data/taxonomy.js`: Role definitions, skill aliases, core competencies, and domain keywords.
  - `scripts/data/colleges.js`: College tiers (Tier-1, Tier-2, Tier-3) and tier detection regex patterns.
  - `scripts/data/selectors.js`: LinkedIn DOM selectors for job title, company, description, and metadata containers.
- The core evaluation engine (`scripts/matcher.js`) must remain a **pure function** free of DOM and Chrome extension runtime APIs, allowing 100% deterministic unit testing in Node.js.
