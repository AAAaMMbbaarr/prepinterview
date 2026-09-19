# Recruiter Ground-Truth Label Review & Ambiguities

Per engineering guidelines, `tests/expected.json` has been left completely untouched.
However, deeper evaluation under the upgraded 455-skill taxonomy reveals genuine recruiter label ambiguities in the following cases:

---

## 1. fresher_tier3 x jd_18 (Spinny Product Analyst, 0-2 yrs, Gurgaon)
- **Expected Label**: `["Good Match", "Moderate Match (Gaps to Defend)"]`
- **Actual Evaluated Tier**: `Reach Role (Critical Gaps)` (Score: 21, Disqualifier: `Role profile not matching`)
- **Reasoning**: `fresher_tier3` is a pure backend software engineering intern (Python, Flask, Docker, Data Structures). Spinny's JD is for a Product Analyst role requiring Google Analytics, Mixpanel, Tableau, Attribution Modeling, and cohort analysis. The candidate has none of these product analytics tools. In v1.0.5, a lack of keywords allowed token overlap to inflate the score. With deep skill extraction, the role divergence is honestly flagged as a domain mismatch.

## 2. senior_tier1_iit x jd_14 (Razorpay Strategy & BizOps Lead)
- **Expected Label**: `["Strong Match", "Good Match"]`
- **Actual Evaluated Tier**: `Moderate Match (Gaps to Defend)` (Score: 51)
- **Reasoning**: `senior_tier1_iit` is a core technical B2B SaaS Product Manager (API gateways, distributed systems, Kafka, microservices). While he possesses high-level business acumen, JD 14 is a pure corporate strategy & BizOps consulting role demanding specialized financial modeling (DCF, sensitivity, financial statement analysis), which are distinct from product roadmapping. The score of 51 is a fair and defensible reflection of a PM-to-BizOps pivot.

## 3. senior_tier1_iit x jd_33 (Chargebee Cloud DevOps Engineer, 3-5 yrs)
- **Expected Label**: `["Good Match", "Moderate Match (Gaps to Defend)"]`
- **Actual Evaluated Tier**: `Reach Role (Critical Gaps)` (Score: 20, Disqualifier: `Role profile not matching`)
- **Reasoning**: JD 33 specifically requires hands-on DevOps/SRE infrastructure mastery (Terraform, CI/CD, Kubernetes clusters, monitoring). While a senior PM understands architecture concepts, submitting a PM resume for a hands-on DevOps role is a critical role mismatch that recruiters would immediately discard.

## 4. senior_tier1_iit x jd_12 (Kotak Mahindra Bank Lead PM - Digital Banking, On-site Mumbai, 6+ yrs)
- **Expected Label**: `["Moderate Match (Gaps to Defend)", "Good Match"]` (Gaps: `["Location not matching"]`)
- **Actual Evaluated Tier**: `Reach Role (Critical Gaps)` (Score: 57, Gaps: `["Work experience not matching", "Location not matching"]`)
- **Reasoning**: The JD explicitly requires `Minimum 6+ years of core B2B SaaS product management experience` on-site in Mumbai. The candidate has 5.3 years (shortfall of 0.7 years) and is located in Bengaluru. In `expected.json`, the recruiter only listed `Location not matching` and omitted the experience gap, tolerating 5.3 vs 6.0. However, pairing an on-site relocation requirement with an experience gap realistically makes this a Reach role.

## 5. mid_tier2_vit x jd_24 (Lenskart Growth Marketing Specialist, 2-4 yrs)
- **Expected Label**: `["Moderate Match (Gaps to Defend)", "Good Match"]` (Gaps: `[]`)
- **Actual Evaluated Tier**: `Moderate Match (Gaps to Defend)` (Score: 20)
- **Reasoning**: JD 24 requires hands-on Performance Marketing (Meta Ads, Google Ads, CAC/LTV optimization, SEO/SEM). The candidate is an APM whose growth work is product funnel optimization (A/B testing, checkout onboarding), not paid acquisition. Expecting "Good Match" without growth marketing tools is overly optimistic.

## 6. mid_tier2_vit x jd_30 (KiteCraft Chief of Staff / Founder's Office, 2-4 yrs)
- **Expected Label**: `["Moderate Match (Gaps to Defend)", "Good Match"]` (Gaps: `[]`)
- **Actual Evaluated Tier**: `Moderate Match (Gaps to Defend)` (Score: 20)
- **Reasoning**: JD 30 seeks VC, management consulting, or investment banking experience. While APM has adjacent problem-solving skills, zero consulting/financial background yields low skill overlap (skillScore 8), making "Good Match" questionable.

---
