# Design Document & UI/UX Specification
## PrepInterview Copilot — LinkedIn Extension (v1.0.5)

---

## 1. Design Philosophy & Aesthetic Principles

PrepInterview Copilot is designed to look and feel like an **executive recruiting HUD** natively embedded inside LinkedIn. It avoids bright, flashy gimmicks in favor of a sleek, dark-mode terminal aesthetic inspired by Linear, GitHub Dark Dimmed, and modern developer tooling.

### Core Principles
1. **Zero Intrusiveness:** The card embeds directly inside LinkedIn’s existing layout hierarchy—positioned immediately below the primary CTA row (`Apply` and `Save` buttons)—without distorting page layout.
2. **5-Second Scannability:** A candidate should glance at the card and instantly know:
   - Match Score & Application Tier (`🟢 75% Good Match`).
   - Hard Disqualifiers (`⚠️ Work experience not matching`).
   - Key Strengths & Gaps (`✓ SQL`, `⚠️ B2B SaaS`).
3. **Respectful Transparency:** No complex algorithmic jargon. Disqualifiers are labeled in plain, human terms without revealing raw mathematical penalties or internal test weights.

---

## 2. Design Tokens & Color Palette

All colors comply with WCAG 2.1 AA contrast standards against deep dark backgrounds (`#0d1117` and `#161b22`).

| Token Name | Hex Value | Application |
| :--- | :--- | :--- |
| `--bg-card` | `#0d1117` | Main card background |
| `--bg-card-header` | `#161b22` | Header section & pill containers |
| `--border-subtle` | `#30363d` | Card border & dividers |
| `--border-accent` | `#388bfd33` | Focus rings & subtle card glow |
| `--text-primary` | `#c9d1d9` | Body text, labels, questions |
| `--text-secondary` | `#8b949e` | Helper text, word counts, timestamps |
| `--text-title` | `#f0f6fc` | Headings, score numbers, tier titles |
| `--badge-strong-green` | `#3fb950` | Strong Match ($\ge 80\%$), Matched Strengths pill |
| `--badge-good-green` | `#2ea043` | Good Match ($72–79\%$) |
| `--badge-warn-yellow` | `#d29922` | Moderate Match ($45–71\%$) |
| `--badge-danger-red` | `#f85149` | Reach Role ($<45\%$), Disqualifier pills |
| `--cta-gradient` | `linear-gradient(135deg, #1f6feb 0%, #238636 100%)` | 1-Click Practice Spoken Interview CTA |

---

## 3. Component Architecture & UI Anatomy

### 3.1 In-Page Copilot Card Layout

```
+-------------------------------------------------------------------------+
| [ 🎯 75% Role Match ]  Moderate Match (Gaps to Defend)  [ View Match Insights ▾ ] |
+-------------------------------------------------------------------------+
| Evaluated against Senior Growth Lead       ✨ Skills • Experience • Location • Education |
|                                                                         |
| ⚠️ REQUIREMENT GAPS (1)                                                 |
| [ ⚠️ Work experience not matching ]                                     |
|                                                                         |
| (When Expanded):                                                        |
| MATCHED STRENGTHS (4)                                                   |
| [ ✓ SQL ] [ ✓ Growth ] [ ✓ AI Workflows ] [ ✓ Experimentation ]         |
|                                                                         |
| KEY FOCUS AREAS FOR INTERVIEW (2)                                       |
| [ ⚠️ B2B SaaS ] [ ⚠️ Enterprise HR Tech ]                               |
+-------------------------------------------------------------------------+
| [ 🎙️ Practice Spoken Interview for this Job (1-Click) ↗               ] |
+-------------------------------------------------------------------------+
```

---

### 3.2 Component Breakdown

#### A. Topline Score Row
- **Score Pill:** Displays `Badge + Score% Role Match` in a compact, colored chip with 15% opacity background and solid border:
  ```css
  background: rgba(63, 185, 80, 0.15);
  color: #3fb950;
  border: 1px solid rgba(63, 185, 80, 0.35);
  border-radius: 9999px;
  font-weight: 700;
  ```
- **Brand Title / Tier:** Displays recruiting status (`Strong Match`, `Moderate Match (Gaps to Defend)`, `Reach Role`).
- **Collapsible Toggle:** Secondary ghost button (`View Match Insights ▾` / `Hide Breakdown ▴`) to keep the default view clean and compact.

#### B. Requirement Gaps Section (`⚠️ Requirement Gaps`)
- Rendered only when hard qualification gaps exist.
- Standardized, simple pill layout with red warning accent (`#f85149`).
- Padded with `4px 10px`, rounded corners (`6px`), and clear font hierarchy.

#### C. Skill Pills Matrix (`Matched Strengths` vs. `Focus Areas`)
- **Matched Skills (`.prepinterview-pill-match`):**
  - Background: `#2386361a` (10% green).
  - Text: `#3fb950` with checkmark icon `✓`.
- **Missing Skills / Focus Areas (`.prepinterview-pill-gap`):**
  - Background: `#da36331a` (10% red).
  - Text: `#f85149` with warning icon `⚠️`.

#### D. Primary Action Button (`.prepinterview-cta-btn`)
- Full-width call to action positioned at the bottom of the card.
- Vibrant, energetic gradient (`#1f6feb` to `#238636`) with hover lift animation (`translateY(-1px)`).
- Clear external indicator arrow `↗`.

#### E. Floating Sticky Indicator (`#prepinterview-floating-pill`)
- Positioned `fixed; bottom: 20px; right: 20px; z-index: 999999`.
- Smooth slide-up entry on scroll.
- Clicking it smoothly scrolls the page back to the Copilot card (`scrollIntoView({ behavior: 'smooth' })`).

---

## 4. UI States & Edge Cases

| State | Visual Trigger | Card Appearance | Primary Action |
| :--- | :--- | :--- | :--- |
| **1. No Resume Saved** | `resumeText` is empty or $<20$ chars | Soft blue banner: *"Save your resume once in the Chrome toolbar to unlock instant Skill Match"* | Prompt to open extension icon |
| **2. Strong Match (80%+)** | 0 disqualifiers, high skill & pedigree overlap | Green theme (`#3fb950`). Badges `Strong Match 🟢`. | Launches 1-Click Spoken Prep |
| **3. Moderate Match (Gaps to Defend)** | 1 disqualifier OR 45–71% skill score | Amber theme (`#d29922`). Highlights specific gaps to defend in interview. | Launches 1-Click Spoken Prep |
| **4. Reach Role (Critical Gaps)** | 2+ disqualifiers OR $<45\%$ score | Red theme (`#f85149`). Clearly flags knockout criteria. | Focuses on defense strategy |
| **5. Pure Skill Match** | Job mentions no min experience, no tier, flexible location | Criteria breakdown shows *"Evaluated on Skills"*. Zero artificial penalties. | Highlights key strengths |

---

## 5. Extension Popup Modal (`popup.html`)

The popup interface is clean, distraction-free, and respects candidate data ownership.

```
+--------------------------------------------------------+
| 🎯 PrepInterview Copilot                   🟢 Active   |
| LinkedIn Match & Interview Coach                       |
+--------------------------------------------------------+
| 📄 YOUR MASTER RESUME                         312 words|
| Paste your resume text below. It stays 100% private in |
| your browser.                                          |
| +----------------------------------------------------+ |
| | AMBAR BANERJEE                                     | |
| | Product & Growth Professional...                   | |
| | Experience: Cuemath, Senior Associate...           | |
| | Education: B.Tech Computer Science...              | |
| +----------------------------------------------------+ |
| [ 💾 Save Resume Locally ]             [ Clear ]      |
| ✅ Resume saved! Copilot active on LinkedIn.           |
+--------------------------------------------------------+
| ⚡ HOW IT WORKS ON LINKEDIN                             |
| • 🎯 Role Fit: Evaluates skills, experience & tier.    |
| • 🟢 80%+ Match: High interview probability.          |
| • 🎙️ 1-Click Prep: Real-time spoken AI mock.          |
+--------------------------------------------------------+
| Open PrepInterview AI ↗                         v1.0.5 |
+--------------------------------------------------------+
```

### Micro-Interactions
- **Real-Time Word Count:** Dynamically updates on keystroke (`X words`).
- **Save Feedback Toast:** Smooth fade-in green toast (`✅ Resume saved! Copilot active on LinkedIn`) that auto-hides after 3 seconds.
- **Immediate Tab Reflow:** Saving immediately reflows open LinkedIn tabs via cross-script message passing.
