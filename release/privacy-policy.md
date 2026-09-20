# Privacy Policy for PrepInterview Copilot

> **Note for Extension Publisher:** This document is a plain-language privacy policy draft. Before submitting PrepInterview Copilot to the Chrome Web Store, host this policy at a publicly accessible URL (e.g. `https://prepinterview.online/privacy-extension` or GitHub Pages) and enter that URL into `extension/scripts/release-config.js` (`PRIVACY_POLICY_URL`) and the Chrome Web Store Developer Dashboard.

**Last Updated:** September 19, 2026  
**Effective Date:** September 19, 2026  

PrepInterview Copilot ("we", "our", or "the extension") is committed to protecting your personal privacy. This Privacy Policy describes how your information is handled when using the PrepInterview Copilot Chrome Extension.

---

### 1. Fundamental Privacy Principle: Local-First & Zero Network Requests

PrepInterview Copilot operates under a strict **local-first architecture**:
* **The extension itself makes zero outbound network requests.** It contains no backend API endpoints, no tracking pixels, no telemetry beacons, and no remote server connections.
* **All resume parsing, skill matching, and fit score calculations happen entirely within your local browser sandbox.**

---

### 2. Information Stored Locally on Your Device

When you use PrepInterview Copilot, the following data is saved locally on your computer via the Chrome Extension Storage API (`chrome.storage.local`):
* **Your Resume Text:** Plain-text content of the resume you paste into the extension popup.
* **User Preferences:** Local settings such as your "Open to Relocation" preference and UI drawer collapsed/expanded state.

**Your resume and settings are stored strictly in this browser.** This data is never synchronized to cloud servers, never backed up externally, and never accessible to anyone other than you.

You can completely remove all locally stored data at any time by clicking the **"Clear All Data"** button in the extension popup or by uninstalling the extension.

---

### 3. Information Transmitted When Using External Links

The extension includes links to our web-based interview preparation platform ([prepinterview.online](https://prepinterview.online)).

* **Default Browsing:** While browsing LinkedIn, absolutely no data is transmitted over the internet.
* **Clicking "Practice this interview":** If you choose to click the practice button on an evaluation card, your browser will open `https://prepinterview.online` in a new browser tab. The URL parameters will contain public job posting metadata:
  - Job Title
  - Company Name
  - Job Description Text from the active LinkedIn post
* **Important:** **Your resume text is NEVER transmitted or included in this link.** The web platform generates mock interview questions using only the public job description details.

---

### 4. Third-Party Analytics, Cookies, and Tracking

* **No Cookies:** PrepInterview Copilot does not set or read any cookies.
* **No Analytics:** We do not track user behavior, page views, search queries, or interaction statistics.
* **No Third-Party Trackers:** No third-party SDKs, tracking pixels, or remote scripts are bundled with or loaded by the extension.
* **No Data Sales:** We do not collect, buy, sell, or rent user data under any circumstances.

---

### 5. Permissions Used

PrepInterview Copilot requests the minimum permissions necessary to function:
* `storage`: Required to save your resume and relocation preference locally in your browser.
* `host_permissions` (`*://*.linkedin.com/*`): Required exclusively to read the job description text on the LinkedIn job page you are actively viewing and render the match insights card.

---

### 6. Children's Privacy

PrepInterview Copilot is intended for career-seeking professionals and students. We do not knowingly collect or solicit information from anyone under the age of 13.

---

### 7. Changes to This Policy

If we make updates to this Privacy Policy, we will update the "Last Updated" date at the top of this document. Any material modifications will be reflected in the extension's changelog.

---

### 8. Contact & Support

If you have any questions, feedback, or concerns regarding your privacy, please contact:

* **Support Email:** `SUPPORT_EMAIL` (configured in `extension/scripts/release-config.js`)
* **Project Website:** [https://prepinterview.online](https://prepinterview.online)
