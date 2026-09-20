# PrepInterview Copilot — Chrome Web Store Listing Assets

---

## 1. Store Metadata

### Title
PrepInterview Copilot - Job Match & Interview Prep (Beta)

### Short Description (130 characters <= 132)
See resume skill match, experience, and requirement fit on LinkedIn jobs, and practice tailored interview questions in one click.

### Category
Productivity / Workflow & Planning

---

## 2. Detailed Description

PrepInterview Copilot is a lightweight, privacy-first companion for your LinkedIn job search. It reads the job description on the page you are viewing, compares stated requirements against your resume locally, and provides an instant breakdown of your match score and preparation gaps.

### How It Works in 3 Steps
1. **Paste your resume once:** Open the extension popup, paste your plain-text resume, and save it. It stays strictly inside your browser's local storage.
2. **Browse jobs on LinkedIn:** As you browse openings, the extension reads the job description on the page you are viewing and performs a local, instant evaluation.
3. **See your match breakdown:** View a clear fit tier (Strong Match, Good Match, Moderate Match, or Reach Role), inspect matched vs missing skills, check experience requirements, and launch targeted interview practice in one click.

### What It Checks
* **Core Skills:** Discovers essential domain skills and technical proficiencies named in the job text, showing which ones appear in your resume and which ones are missing.
* **Experience Fit:** Calculates total and domain-relevant years of experience from your career history and compares them against stated minimum requirements.
* **Education & College Tier:** Evaluates degree levels and institutional background when specified in the posting.
* **Location & Work Mode:** Checks on-site, hybrid, and remote requirements against your location, with a flexible relocation toggle.

### Complete Privacy Protection
* **100% Client-Side:** All text analysis, skill extraction, and scoring occur entirely inside your browser sandbox.
* **Zero Outbound Network Requests:** The extension itself makes no network requests, contains no tracking scripts, loads no remote assets, and collects no telemetry.
* **Your Resume Stays On Your Device:** Your resume is saved only in this browser and is never uploaded, transferred, or shared.
* **Clear Disclosure:** If you choose to click "Practice", your browser opens prepinterview.online in a new tab with the job's title, company, and description in the link so you can practice mock interview questions. Your resume is never included in the link.

### Known Limitations
* Works on LinkedIn jobs pages (search results, collections, and direct job postings); not active on non-jobs pages like feed or messaging.
* Evaluates one resume at a time (stores a single active resume profile).
* College tier detection covers Indian institutions only; non-Indian colleges default to neutral fit without penalty.
* LinkedIn layout changes: DOM updates by LinkedIn can temporarily misalign or break card insertion until updated.
* Only evaluates English job descriptions.
* Skills not explicitly named in the job text won't be counted, even if common in the role.
* Tier estimates are heuristics based on stated requirements, not actual hiring decisions.
* Relocation preference is manual; the extension does not infer your willingness to move.

---

*Disclaimer: Not affiliated with or endorsed by LinkedIn.*

---

## 3. Chrome Web Store Review Declarations

### Single-Purpose Statement
The single purpose of PrepInterview Copilot is to evaluate candidate resume compatibility with job postings on LinkedIn and launch targeted interview preparation.

### Permission Justifications
* `storage`: Used exclusively to store the user's plain-text resume and relocation preference locally within their browser profile via `chrome.storage.local`.
* Host permission (`*://*.linkedin.com/*`): Required exclusively to read the job description on the page you are viewing and render the match insights panel directly within the job post layout.

### Data Usage & Privacy Disclosures
* **Does the extension collect personal data?** No. The developer does not collect, log, or transmit any personally identifiable information.
* **Does the extension sell user data?** No. User data is never sold or rented.
* **Does the extension transfer data to third parties?** No. No data is transferred to third parties.
* **Does the extension use data for purposes unrelated to the single purpose?** No.
* **Does the extension determine creditworthiness or lending?** No.

---

## 4. Visual Asset Specifications

### Screenshot Requirements (1280x800 px)
1. **Screenshot 1 — Main In-Page Match Card:** Shows the compact evaluation card embedded in a LinkedIn job posting with a "Good Match" pill, reason sentence, and 4-chip factor row.
2. **Screenshot 2 — Factor Row & Requirement Breakdown:** Close-up of the expanded panel showing skills match %, experience check, college tier check, and requirement notes.
3. **Screenshot 3 — Skill Breakdown:** Displays the "In your resume" and "Not found in your resume" skill pills showing keyword alignment.
4. **Screenshot 4 — Local Popup Configuration:** Shows the popup interface where users securely paste their resume locally and toggle relocation preferences.

### Icon & Promo Tile Specifications
* **Extension Icons (PNG, transparent background):**
  - 16x16 px (`icons/icon-16.png`) — Favicon & extension bar
  - 48x48 px (`icons/icon-48.png`) — Chrome extensions management page
  - 128x128 px (`icons/icon-128.png`) — Chrome Web Store installation & detail view
* **Promotional Tiles (JPG or 24-bit PNG, no transparency):**
  - Small Promo Tile: 440x280 px
  - Marquee Promo Tile: 1400x560 px
