# PrepInterview Copilot — Behavior Diff (Round 3 Correctness Upgrades)

**Generated Date:** 2026-09-19T09:23:07.340Z
**Base Commit:** `HEAD` (Pre-Round 3)
**Total Evaluation Pairs:** 120
**Changed Pairs:** 23 / 120 (19.2%)

## Summary of Round 3 Core Upgrades

1. **Score Invariant Restored**: Removed temporary small-shortfall override. Score < 45 unconditionally triggers `Reach Role (Critical Gaps)`.
2. **Experience Tolerance**: Shortfall <= 0.5 year gives config penalty (-3) and soft note, without firing a red disqualifier.
3. **Gap Severity Hierarchy**: Hard gaps (mandatory college, mandatory degree, shortfall >= 1 yr, role mismatch) vs Soft gaps (shortfall < 1 yr, on-site location, hybrid relocation). Reach = score < 45 OR 2+ hard gaps. Capped at Moderate with 1 hard or any soft gaps.
4. **Directional `roleAdjacency` Matrix**: Explicit JD-to-Candidate multiplier matrix with role mismatch threshold <= 0.25 suppressing redundant experience gaps.
5. **Score Breakdown**: Returns `breakdown: [{label, points}]` and `preClampScore` with strict arithmetic verification.

| Pair | Old Score | New Score | Delta | Old Tier | New Tier | Old Gaps | New Gaps | Movement |
| :--- | :---: | :---: | :---: | :--- | :--- | :--- | :--- | :--- |
| mid_tier2_vit x jd_02 | 73 | 73 | 0 | Moderate Match (Gaps to Defend) | Good Match | Location not matching | Location not matching | 🟢 Toward (Exact Gap Match) |
| mid_tier2_vit x jd_06 | 20 | 20 | 0 | Reach Role (Critical Gaps) | Reach Role (Critical Gaps) | Work experience not matching | Role profile not matching | ⚪ Neutral (Recalibrated) |
| mid_tier2_vit x jd_08 | 21 | 21 | 0 | Moderate Match (Gaps to Defend) | Reach Role (Critical Gaps) | Work experience not matching | Work experience not matching | 🟢 Toward (Score Invariant Restored) |
| mid_tier2_vit x jd_10 | 20 | 20 | 0 | Reach Role (Critical Gaps) | Reach Role (Critical Gaps) | Work experience not matching | Role profile not matching | ⚪ Neutral (Recalibrated) |
| mid_tier2_vit x jd_13 | 20 | 20 | 0 | Reach Role (Critical Gaps) | Reach Role (Critical Gaps) | Work experience not matching | Role profile not matching | ⚪ Neutral (Recalibrated) |
| mid_tier2_vit x jd_17 | 20 | 20 | 0 | Moderate Match (Gaps to Defend) | Reach Role (Critical Gaps) | Work experience not matching | Role profile not matching | 🟢 Toward (Score Invariant Restored) |
| mid_tier2_vit x jd_19 | 20 | 20 | 0 | Reach Role (Critical Gaps) | Reach Role (Critical Gaps) | College not matching, Work experience not matching | College not matching, Role profile not matching | ⚪ Neutral (Recalibrated) |
| mid_tier2_vit x jd_23 | 20 | 20 | 0 | Reach Role (Critical Gaps) | Reach Role (Critical Gaps) | Degree not matching, Work experience not matching | Degree not matching, Role profile not matching | ⚪ Neutral (Recalibrated) |
| mid_tier2_vit x jd_24 | 20 | 21 | +1 | Moderate Match (Gaps to Defend) | Reach Role (Critical Gaps) | Work experience not matching | None | 🔴 Away (Tier Divergence) |
| mid_tier2_vit x jd_28 | 20 | 20 | 0 | Reach Role (Critical Gaps) | Reach Role (Critical Gaps) | Work experience not matching | Role profile not matching | ⚪ Neutral (Recalibrated) |
| mid_tier2_vit x jd_30 | 20 | 20 | 0 | Moderate Match (Gaps to Defend) | Reach Role (Critical Gaps) | Work experience not matching | Work experience not matching | 🔴 Away (Tier Divergence) |
| mid_tier2_vit x jd_32 | 82 | 79 | -3 | Moderate Match (Gaps to Defend) | Good Match | Location not matching | Location not matching | 🔴 Away (Tier Divergence) |
| mid_tier2_vit x jd_33 | 20 | 20 | 0 | Reach Role (Critical Gaps) | Reach Role (Critical Gaps) | Work experience not matching | Role profile not matching | ⚪ Neutral (Recalibrated) |
| senior_tier1_iit x jd_06 | 20 | 20 | 0 | Reach Role (Critical Gaps) | Reach Role (Critical Gaps) | Work experience not matching | Role profile not matching | ⚪ Neutral (Recalibrated) |
| senior_tier1_iit x jd_08 | 94 | 79 | -15 | Strong Match | Good Match | None | None | 🟢 Toward (Exact Gap Match) |
| senior_tier1_iit x jd_10 | 20 | 20 | 0 | Moderate Match (Gaps to Defend) | Reach Role (Critical Gaps) | Work experience not matching | Role profile not matching | 🔴 Away (Tier Divergence) |
| senior_tier1_iit x jd_12 | 57 | 57 | 0 | Reach Role (Critical Gaps) | Moderate Match (Gaps to Defend) | Location not matching, Work experience not matching | Location not matching, Work experience not matching | 🟢 Toward (Tier Match) |
| senior_tier1_iit x jd_13 | 51 | 51 | 0 | Moderate Match (Gaps to Defend) | Moderate Match (Gaps to Defend) | Work experience not matching | Role profile not matching | ⚪ Neutral (Recalibrated) |
| senior_tier1_iit x jd_17 | 45 | 45 | 0 | Moderate Match (Gaps to Defend) | Moderate Match (Gaps to Defend) | None | Role profile not matching | ⚪ Neutral (Recalibrated) |
| senior_tier1_iit x jd_19 | 43 | 43 | 0 | Reach Role (Critical Gaps) | Reach Role (Critical Gaps) | Work experience not matching | Role profile not matching | ⚪ Neutral (Recalibrated) |
| senior_tier1_iit x jd_23 | 20 | 20 | 0 | Reach Role (Critical Gaps) | Reach Role (Critical Gaps) | Degree not matching, Work experience not matching | Degree not matching, Role profile not matching | ⚪ Neutral (Recalibrated) |
| senior_tier1_iit x jd_28 | 27 | 27 | 0 | Reach Role (Critical Gaps) | Reach Role (Critical Gaps) | Work experience not matching | Role profile not matching | ⚪ Neutral (Recalibrated) |
| senior_tier1_iit x jd_33 | 20 | 20 | 0 | Reach Role (Critical Gaps) | Reach Role (Critical Gaps) | Work experience not matching | Role profile not matching | ⚪ Neutral (Recalibrated) |
