# PrepInterview Copilot — Hard Requirement Failure Analysis (Experience & Location)

This document audits the **18 failing experience pairs** and **2 failing location pairs** identified during the baseline benchmark.
All figures and sentences are extracted directly from fixture texts and engine evaluations.

> [!NOTE]
> Per engineering guidelines, `tests/expected.json` remains completely unmodified.

---

## 1. Summary of Underlying Mechanisms

Across the 18 experience failures, there are two distinct failure modes in the baseline engine:
1. **JD Extraction Regex Limitation (Senior Roles, 6+ / 7+ / 8+ yrs)**:
   - JDs `jd_12` (6+ yrs), `jd_19` (7+ yrs), `jd_38` (8+ yrs), and `jd_40` (5+ yrs) use phrasing like *"Minimum 6+ years"* or *"7+ years of hardcore backend"*.
   - The baseline regex in `matcher.js` failed to extract `minExp`, returning `null`. Consequently, zero experience penalties or disqualifiers were assigned to freshers or mid-level candidates applying for senior/architect roles.
2. **Tolerance Window for Mid-Level Candidate (`mid_tier2_vit` at 1.8 yrs vs 2-4 yrs JDs)**:
   - Candidate `mid_tier2_vit` has 1.8 years of verified experience.
   - JDs `jd_01`, `jd_10`, `jd_13`, `jd_23`, `jd_24`, `jd_30`, `jd_32`, and `jd_39` require 2–4 years.
   - The engine flags `gap = 2.0 - 1.8 = 0.2 yrs` as `Work experience not matching`.
   - In `expected.json`, recruiters treated 1.8 years as satisfying a "2-4 years" requirement without a disqualifier gap.

In the 2 location failures (`fresher_tier3 x jd_12` and `mid_tier2_vit x jd_12`):
- `jd_12` is strictly On-site in Mumbai.
- `fresher_tier3` is in Delhi NCR, and `mid_tier2_vit` is in Bengaluru.
- The engine correctly detected `Location not matching`, whereas `expected.json` did not list location gap (focusing only on Experience, College, and Degree).

---

## 2. Detailed Audit: 18 Experience Failures

| Pair | JD Requirement Sentence | Extracted JD minExp | Candidate Years | Expected Gaps | Actual Disqualifiers | Root Cause |
| :--- | :--- | :---: | :---: | :--- | :--- | :--- |
| `fresher_tier3 x jd_12` | • Minimum 6+ years of product management experience, preferably in banking or fintech. | `null (missed)` | `0 yrs` | Work experience not matching, College not matching, Degree not matching | College not matching, Degree not matching, Location not matching | JD parser missed senior requirement (• Minimum 6+ years of product management experience, preferably in banking or fintech.) |
| `fresher_tier3 x jd_19` | • 7+ years of hardcore backend and architecture experience. | `null (missed)` | `0 yrs` | Work experience not matching, College not matching, Location not matching | College not matching, Location not matching | JD parser missed senior requirement (• 7+ years of hardcore backend and architecture experience.) |
| `fresher_tier3 x jd_38` | • 8+ years of software architecture and cloud engineering experience. | `null (missed)` | `0 yrs` | Work experience not matching | None | JD parser missed senior requirement (• 8+ years of software architecture and cloud engineering experience.) |
| `fresher_tier3 x jd_40` | • 5+ years of product management experience with proven growth track record. | `null (missed)` | `0 yrs` | Work experience not matching | None | JD parser missed senior requirement (• 5+ years of product management experience with proven growth track record.) |
| `mid_tier2_vit x jd_01` | • 2-4 years of experience in product management or growth product roles. | `2 yrs` | `1.8 yrs` | None | Work experience not matching | Engine strictly penalized 0.2 yr gap (1.8y vs 2y) |
| `mid_tier2_vit x jd_10` | • 2-4 years of industry or research experience in machine learning and deep learning. | `2 yrs` | `1.8 yrs` | None | Work experience not matching | Engine strictly penalized 0.2 yr gap (1.8y vs 2y) |
| `mid_tier2_vit x jd_12` | • Minimum 6+ years of product management experience, preferably in banking or fintech. | `null (missed)` | `1.8 yrs` | Work experience not matching, College not matching, Degree not matching | College not matching, Degree not matching, Location not matching | JD parser missed senior requirement (• Minimum 6+ years of product management experience, preferably in banking or fintech.) |
| `mid_tier2_vit x jd_13` | We are looking for an experienced backend engineer to scale our restaurant dispatch engines. | `2 yrs` | `1.8 yrs` | None | Work experience not matching | Engine strictly penalized 0.2 yr gap (1.8y vs 2y) |
| `mid_tier2_vit x jd_19` | • 7+ years of hardcore backend and architecture experience. | `null (missed)` | `1.8 yrs` | Work experience not matching, College not matching | College not matching | JD parser missed senior requirement (• 7+ years of hardcore backend and architecture experience.) |
| `mid_tier2_vit x jd_23` | • Minimum 2-4 years of industry research experience. | `2 yrs` | `1.8 yrs` | Degree not matching | Work experience not matching, Degree not matching | Engine strictly penalized 0.2 yr gap (1.8y vs 2y) |
| `mid_tier2_vit x jd_24` | • 2-4 years of experience in performance marketing, growth hacking, or digital marketing. | `2 yrs` | `1.8 yrs` | None | Work experience not matching | Engine strictly penalized 0.2 yr gap (1.8y vs 2y) |
| `mid_tier2_vit x jd_30` | • 2-4 years experience in Founder's Office, management consulting, or VC. | `2 yrs` | `1.8 yrs` | None | Work experience not matching | Engine strictly penalized 0.2 yr gap (1.8y vs 2y) |
| `mid_tier2_vit x jd_32` | • 2 to 4 years of experience in fintech or consumer product management. | `2 yrs` | `1.8 yrs` | Location not matching | Work experience not matching, Location not matching | Engine strictly penalized 0.2 yr gap (1.8y vs 2y) |
| `mid_tier2_vit x jd_38` | • 8+ years of software architecture and cloud engineering experience. | `null (missed)` | `1.8 yrs` | Work experience not matching | None | JD parser missed senior requirement (• 8+ years of software architecture and cloud engineering experience.) |
| `mid_tier2_vit x jd_39` | • 2-3 years experience in product management, preferably in B2B SaaS. | `2 yrs` | `1.8 yrs` | None | Work experience not matching | Engine strictly penalized 0.2 yr gap (1.8y vs 2y) |
| `mid_tier2_vit x jd_40` | • 5+ years of product management experience with proven growth track record. | `null (missed)` | `1.8 yrs` | Work experience not matching | None | JD parser missed senior requirement (• 5+ years of product management experience with proven growth track record.) |
| `senior_tier1_iit x jd_19` | • 7+ years of hardcore backend and architecture experience. | `null (missed)` | `5 yrs` | Work experience not matching | None | JD parser missed senior requirement (• 7+ years of hardcore backend and architecture experience.) |
| `senior_tier1_iit x jd_38` | • 8+ years of software architecture and cloud engineering experience. | `null (missed)` | `5 yrs` | Work experience not matching | None | JD parser missed senior requirement (• 8+ years of software architecture and cloud engineering experience.) |

---

## 3. Detailed Audit: 2 Location Failures

| Pair | JD Location Sentence | Extracted Mode & City | Candidate City | Expected Gaps | Actual Disqualifiers | Root Cause |
| :--- | :--- | :---: | :---: | :--- | :--- | :--- |
| `fresher_tier3 x jd_12` | Mumbai, Maharashtra, India (On-site) | `On-site in Mumbai` | `Delhi NCR` | Work experience not matching, College not matching, Degree not matching | College not matching, Degree not matching, Location not matching | Recruiter omitted location gap in expected.json |
| `mid_tier2_vit x jd_12` | Mumbai, Maharashtra, India (On-site) | `On-site in Mumbai` | `Bengaluru` | Work experience not matching, College not matching, Degree not matching | College not matching, Degree not matching, Location not matching | Recruiter omitted location gap in expected.json |
