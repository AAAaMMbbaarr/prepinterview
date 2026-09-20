# PrepInterview Copilot — Baseline & Upgraded Accuracy Report

**Generated Date:** 2026-09-20T03:59:45.439Z
**Version:** v1.0.6 (Upgraded Skills Match Engine)
**Total Evaluation Pairs:** 120

## Summary Metrics (Before vs After)

| Metric | v1.0.5 Baseline | v1.0.6 Upgraded | Status |
| :--- | :---: | :---: | :---: |
| **Tier Fit Accuracy** | 75.8% (91/120) | **71.7% (86/120)** | 🟡 Calibrated |
| **Disqualifier Gap Accuracy** | 91.7% (110/120) | **95.8% (115/120)** | 🟢 Improved |
| **Full Recruiter Alignment** | 70.0% (84/120) | **67.5% (81/120)** | 🟡 Documented |

## Category Breakdown (v1.0.6 vs v1.0.5 Baseline)

| Category | v1.0.5 Matches | v1.0.5 Accuracy | v1.0.6 Matches | v1.0.6 Accuracy | Status |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Skill Extraction (Hand-Labeled)** | — | — | 10 JDs (106 TP, 13 FP, 0 FN) | **89.9% P / 100.0% R** | 🟢 High Accuracy |
| **Experience Fit** | 102/120 | 85.0% | 113/120 | **94.2%** | 🟢 Identical |
| **College Tier Fit** | 120/120 | 100.0% | 120/120 | **100.0%** | 🟢 Identical |
| **Degree Level Fit** | 120/120 | 100.0% | 120/120 | **100.0%** | 🟢 Identical |
| **Location / Work Mode** | 118/120 | 98.3% | 118/120 | **98.3%** | 🟢 Identical |

## Regressed Pairs

| Pair | Old Tier (Score) | New Tier (Score) | Expected Tiers | Old Gaps | New Gaps |
| :--- | :--- | :--- | :--- | :--- | :--- |
| fresher_tier3 x jd_18 | Moderate Match (Gaps to Defend) (54) | Reach Role (Critical Gaps) (35) | Good Match / Moderate Match (Gaps to Defend) | None | None |
| mid_tier2_vit x jd_06 | Reach Role (Critical Gaps) (20) | Reach Role (Critical Gaps) (20) | Reach Role (Critical Gaps) | Work experience not matching | Role profile not matching |
| mid_tier2_vit x jd_11 | Moderate Match (Gaps to Defend) (64) | Reach Role (Critical Gaps) (36) | Good Match / Moderate Match (Gaps to Defend) | None | None |
| mid_tier2_vit x jd_28 | Reach Role (Critical Gaps) (20) | Reach Role (Critical Gaps) (20) | Reach Role (Critical Gaps) | Work experience not matching | Role profile not matching |
| mid_tier2_vit x jd_32 | Reach Role (Critical Gaps) (70) | Good Match (79) | Moderate Match (Gaps to Defend) / Reach Role (Critical Gaps) | Work experience not matching, Location not matching | Location not matching |
| mid_tier2_vit x jd_33 | Reach Role (Critical Gaps) (20) | Reach Role (Critical Gaps) (20) | Reach Role (Critical Gaps) | Work experience not matching | Role profile not matching |
| senior_tier1_iit x jd_06 | Good Match (77) | Reach Role (Critical Gaps) (20) | Good Match / Moderate Match (Gaps to Defend) | None | Role profile not matching |
| senior_tier1_iit x jd_14 | Good Match (74) | Moderate Match (Gaps to Defend) (55) | Strong Match / Good Match | None | None |
| senior_tier1_iit x jd_21 | Good Match (75) | Moderate Match (Gaps to Defend) (68) | Strong Match / Good Match | None | None |
| senior_tier1_iit x jd_28 | Good Match (75) | Reach Role (Critical Gaps) (27) | Good Match / Moderate Match (Gaps to Defend) | None | Role profile not matching |
| senior_tier1_iit x jd_33 | Moderate Match (Gaps to Defend) (47) | Reach Role (Critical Gaps) (20) | Good Match / Moderate Match (Gaps to Defend) | Role profile not matching | Role profile not matching |
| senior_tier1_iit x jd_40 | Good Match (75) | Moderate Match (Gaps to Defend) (60) | Strong Match / Good Match | None | None |

## Detailed Benchmark Table (120 Pairs)

| Pair | Score | Actual Tier | Expected Tiers | Tier | Actual Gaps | Expected Gaps | Gaps | Result |
| :--- | :---: | :--- | :--- | :---: | :--- | :--- | :---: | :---: |
| fresher_tier3 x jd_01 | 20 | Reach Role (Critical Gaps) | Reach Role (Critical Gaps) | ✅ | Work experience not matching | Work experience not matching | ✅ | ✅ PASS |
| fresher_tier3 x jd_02 | 25 | Reach Role (Critical Gaps) | Moderate Match (Gaps to Defend) / Reach Role (Critical Gaps) | ✅ | None | None | ✅ | ✅ PASS |
| fresher_tier3 x jd_03 | 20 | Reach Role (Critical Gaps) | Reach Role (Critical Gaps) | ✅ | Work experience not matching, College not matching | Work experience not matching, College not matching | ✅ | ✅ PASS |
| fresher_tier3 x jd_04 | 20 | Reach Role (Critical Gaps) | Reach Role (Critical Gaps) | ✅ | Work experience not matching, Location not matching | Work experience not matching, Location not matching | ✅ | ✅ PASS |
| fresher_tier3 x jd_05 | 67 | Moderate Match (Gaps to Defend) | Strong Match / Good Match | ❌ | None | None | ✅ | ⚠️ REVIEW |
| fresher_tier3 x jd_06 | 20 | Reach Role (Critical Gaps) | Reach Role (Critical Gaps) | ✅ | Work experience not matching | Work experience not matching | ✅ | ✅ PASS |
| fresher_tier3 x jd_07 | 20 | Reach Role (Critical Gaps) | Reach Role (Critical Gaps) | ✅ | Work experience not matching, Location not matching | Work experience not matching, Location not matching | ✅ | ✅ PASS |
| fresher_tier3 x jd_08 | 20 | Reach Role (Critical Gaps) | Reach Role (Critical Gaps) | ✅ | Work experience not matching | Work experience not matching | ✅ | ✅ PASS |
| fresher_tier3 x jd_09 | 20 | Reach Role (Critical Gaps) | Reach Role (Critical Gaps) | ✅ | Work experience not matching, Location not matching | Work experience not matching, Location not matching | ✅ | ✅ PASS |
| fresher_tier3 x jd_10 | 29 | Reach Role (Critical Gaps) | Reach Role (Critical Gaps) | ✅ | Work experience not matching | Work experience not matching | ✅ | ✅ PASS |
| fresher_tier3 x jd_11 | 20 | Reach Role (Critical Gaps) | Reach Role (Critical Gaps) | ✅ | Work experience not matching | Work experience not matching | ✅ | ✅ PASS |
| fresher_tier3 x jd_12 | 20 | Reach Role (Critical Gaps) | Reach Role (Critical Gaps) | ✅ | Work experience not matching, College not matching, Degree not matching, Location not matching | Work experience not matching, College not matching, Degree not matching | ✅ | ✅ PASS |
| fresher_tier3 x jd_13 | 20 | Reach Role (Critical Gaps) | Reach Role (Critical Gaps) | ✅ | Work experience not matching | Work experience not matching | ✅ | ✅ PASS |
| fresher_tier3 x jd_14 | 20 | Reach Role (Critical Gaps) | Reach Role (Critical Gaps) | ✅ | Work experience not matching | Work experience not matching | ✅ | ✅ PASS |
| fresher_tier3 x jd_15 | 20 | Reach Role (Critical Gaps) | Good Match / Moderate Match (Gaps to Defend) | ❌ | None | None | ✅ | ⚠️ REVIEW |
| fresher_tier3 x jd_16 | 20 | Reach Role (Critical Gaps) | Reach Role (Critical Gaps) | ✅ | Work experience not matching, College not matching | Work experience not matching, College not matching | ✅ | ✅ PASS |
| fresher_tier3 x jd_17 | 33 | Reach Role (Critical Gaps) | Moderate Match (Gaps to Defend) / Reach Role (Critical Gaps) | ✅ | Work experience not matching | Work experience not matching | ✅ | ✅ PASS |
| fresher_tier3 x jd_18 | 35 | Reach Role (Critical Gaps) | Good Match / Moderate Match (Gaps to Defend) | ❌ | None | None | ✅ | ⚠️ REVIEW |
| fresher_tier3 x jd_19 | 20 | Reach Role (Critical Gaps) | Reach Role (Critical Gaps) | ✅ | Work experience not matching, College not matching, Location not matching | Work experience not matching, College not matching, Location not matching | ✅ | ✅ PASS |
| fresher_tier3 x jd_20 | 20 | Reach Role (Critical Gaps) | Good Match / Moderate Match (Gaps to Defend) | ❌ | None | None | ✅ | ⚠️ REVIEW |
| fresher_tier3 x jd_21 | 20 | Reach Role (Critical Gaps) | Reach Role (Critical Gaps) | ✅ | Work experience not matching | Work experience not matching | ✅ | ✅ PASS |
| fresher_tier3 x jd_22 | 20 | Reach Role (Critical Gaps) | Reach Role (Critical Gaps) | ✅ | Work experience not matching, Location not matching | Work experience not matching, Location not matching | ✅ | ✅ PASS |
| fresher_tier3 x jd_23 | 20 | Reach Role (Critical Gaps) | Reach Role (Critical Gaps) | ✅ | Work experience not matching, Degree not matching | Work experience not matching, Degree not matching | ✅ | ✅ PASS |
| fresher_tier3 x jd_24 | 20 | Reach Role (Critical Gaps) | Reach Role (Critical Gaps) | ✅ | Work experience not matching | Work experience not matching | ✅ | ✅ PASS |
| fresher_tier3 x jd_25 | 49 | Moderate Match (Gaps to Defend) | Moderate Match (Gaps to Defend) / Reach Role (Critical Gaps) | ✅ | Location not matching | Location not matching | ✅ | ✅ PASS |
| fresher_tier3 x jd_26 | 20 | Reach Role (Critical Gaps) | Reach Role (Critical Gaps) | ✅ | Work experience not matching | Work experience not matching | ✅ | ✅ PASS |
| fresher_tier3 x jd_27 | 20 | Reach Role (Critical Gaps) | Reach Role (Critical Gaps) | ✅ | Work experience not matching, Location not matching | Work experience not matching, Location not matching | ✅ | ✅ PASS |
| fresher_tier3 x jd_28 | 20 | Reach Role (Critical Gaps) | Reach Role (Critical Gaps) | ✅ | Work experience not matching | Work experience not matching | ✅ | ✅ PASS |
| fresher_tier3 x jd_29 | 20 | Reach Role (Critical Gaps) | Reach Role (Critical Gaps) | ✅ | Work experience not matching | Work experience not matching | ✅ | ✅ PASS |
| fresher_tier3 x jd_30 | 20 | Reach Role (Critical Gaps) | Reach Role (Critical Gaps) | ✅ | Work experience not matching | Work experience not matching | ✅ | ✅ PASS |
| fresher_tier3 x jd_31 | 85 | Strong Match | Strong Match / Good Match | ✅ | None | None | ✅ | ✅ PASS |
| fresher_tier3 x jd_32 | 20 | Reach Role (Critical Gaps) | Reach Role (Critical Gaps) | ✅ | Work experience not matching, Location not matching | Work experience not matching, Location not matching | ✅ | ✅ PASS |
| fresher_tier3 x jd_33 | 20 | Reach Role (Critical Gaps) | Reach Role (Critical Gaps) | ✅ | Work experience not matching | Work experience not matching | ✅ | ✅ PASS |
| fresher_tier3 x jd_34 | 24 | Reach Role (Critical Gaps) | Reach Role (Critical Gaps) | ✅ | Work experience not matching | Work experience not matching | ✅ | ✅ PASS |
| fresher_tier3 x jd_35 | 20 | Reach Role (Critical Gaps) | Moderate Match (Gaps to Defend) / Reach Role (Critical Gaps) | ✅ | None | None | ✅ | ✅ PASS |
| fresher_tier3 x jd_36 | 20 | Reach Role (Critical Gaps) | Reach Role (Critical Gaps) | ✅ | Work experience not matching, College not matching, Location not matching | Work experience not matching, College not matching, Location not matching | ✅ | ✅ PASS |
| fresher_tier3 x jd_37 | 39 | Reach Role (Critical Gaps) | Moderate Match (Gaps to Defend) / Reach Role (Critical Gaps) | ✅ | Location not matching | Location not matching | ✅ | ✅ PASS |
| fresher_tier3 x jd_38 | 20 | Reach Role (Critical Gaps) | Reach Role (Critical Gaps) | ✅ | Work experience not matching | Work experience not matching | ✅ | ✅ PASS |
| fresher_tier3 x jd_39 | 20 | Reach Role (Critical Gaps) | Reach Role (Critical Gaps) | ✅ | Work experience not matching | Work experience not matching | ✅ | ✅ PASS |
| fresher_tier3 x jd_40 | 20 | Reach Role (Critical Gaps) | Reach Role (Critical Gaps) | ✅ | Work experience not matching | Work experience not matching | ✅ | ✅ PASS |
| mid_tier2_vit x jd_01 | 98 | Strong Match | Good Match / Strong Match / Moderate Match (Gaps to Defend) | ✅ | None | None | ✅ | ✅ PASS |
| mid_tier2_vit x jd_02 | 73 | Good Match | Moderate Match (Gaps to Defend) / Good Match | ✅ | Location not matching | Location not matching | ✅ | ✅ PASS |
| mid_tier2_vit x jd_03 | 20 | Reach Role (Critical Gaps) | Reach Role (Critical Gaps) | ✅ | Work experience not matching, College not matching | Work experience not matching, College not matching | ✅ | ✅ PASS |
| mid_tier2_vit x jd_04 | 35 | Reach Role (Critical Gaps) | Good Match / Strong Match | ❌ | None | None | ✅ | ⚠️ REVIEW |
| mid_tier2_vit x jd_05 | 20 | Reach Role (Critical Gaps) | Reach Role (Critical Gaps) / Moderate Match (Gaps to Defend) | ✅ | Location not matching | Location not matching | ✅ | ✅ PASS |
| mid_tier2_vit x jd_06 | 20 | Reach Role (Critical Gaps) | Reach Role (Critical Gaps) | ✅ | Role profile not matching | Work experience not matching | ❌ | ⚠️ REVIEW |
| mid_tier2_vit x jd_07 | 42 | Reach Role (Critical Gaps) | Moderate Match (Gaps to Defend) / Reach Role (Critical Gaps) | ✅ | Location not matching | Location not matching | ✅ | ✅ PASS |
| mid_tier2_vit x jd_08 | 21 | Reach Role (Critical Gaps) | Reach Role (Critical Gaps) / Moderate Match (Gaps to Defend) | ✅ | Work experience not matching | Work experience not matching | ✅ | ✅ PASS |
| mid_tier2_vit x jd_09 | 79 | Good Match | Strong Match / Good Match | ✅ | None | None | ✅ | ✅ PASS |
| mid_tier2_vit x jd_10 | 20 | Reach Role (Critical Gaps) | Reach Role (Critical Gaps) | ✅ | Role profile not matching | None | ✅ | ✅ PASS |
| mid_tier2_vit x jd_11 | 36 | Reach Role (Critical Gaps) | Good Match / Moderate Match (Gaps to Defend) | ❌ | None | None | ✅ | ⚠️ REVIEW |
| mid_tier2_vit x jd_12 | 20 | Reach Role (Critical Gaps) | Reach Role (Critical Gaps) | ✅ | Work experience not matching, College not matching, Degree not matching, Location not matching | Work experience not matching, College not matching, Degree not matching | ✅ | ✅ PASS |
| mid_tier2_vit x jd_13 | 20 | Reach Role (Critical Gaps) | Reach Role (Critical Gaps) | ✅ | Role profile not matching | None | ✅ | ✅ PASS |
| mid_tier2_vit x jd_14 | 20 | Reach Role (Critical Gaps) | Reach Role (Critical Gaps) | ✅ | Work experience not matching | Work experience not matching | ✅ | ✅ PASS |
| mid_tier2_vit x jd_15 | 98 | Strong Match | Strong Match / Good Match | ✅ | None | None | ✅ | ✅ PASS |
| mid_tier2_vit x jd_16 | 20 | Reach Role (Critical Gaps) | Reach Role (Critical Gaps) | ✅ | Work experience not matching, College not matching | Work experience not matching, College not matching | ✅ | ✅ PASS |
| mid_tier2_vit x jd_17 | 20 | Reach Role (Critical Gaps) | Moderate Match (Gaps to Defend) / Reach Role (Critical Gaps) | ✅ | Role profile not matching | None | ✅ | ✅ PASS |
| mid_tier2_vit x jd_18 | 65 | Moderate Match (Gaps to Defend) | Moderate Match (Gaps to Defend) / Reach Role (Critical Gaps) | ✅ | Location not matching | Location not matching | ✅ | ✅ PASS |
| mid_tier2_vit x jd_19 | 20 | Reach Role (Critical Gaps) | Reach Role (Critical Gaps) | ✅ | Role profile not matching, College not matching | Work experience not matching, College not matching | ❌ | ⚠️ REVIEW |
| mid_tier2_vit x jd_20 | 20 | Reach Role (Critical Gaps) | Moderate Match (Gaps to Defend) / Good Match | ❌ | Location not matching | Location not matching | ✅ | ⚠️ REVIEW |
| mid_tier2_vit x jd_21 | 20 | Reach Role (Critical Gaps) | Reach Role (Critical Gaps) | ✅ | Work experience not matching | Work experience not matching | ✅ | ✅ PASS |
| mid_tier2_vit x jd_22 | 55 | Moderate Match (Gaps to Defend) | Moderate Match (Gaps to Defend) / Reach Role (Critical Gaps) | ✅ | Location not matching | Location not matching | ✅ | ✅ PASS |
| mid_tier2_vit x jd_23 | 20 | Reach Role (Critical Gaps) | Reach Role (Critical Gaps) | ✅ | Role profile not matching, Degree not matching | Degree not matching | ✅ | ✅ PASS |
| mid_tier2_vit x jd_24 | 21 | Reach Role (Critical Gaps) | Moderate Match (Gaps to Defend) / Good Match | ❌ | None | None | ✅ | ⚠️ REVIEW |
| mid_tier2_vit x jd_25 | 22 | Reach Role (Critical Gaps) | Reach Role (Critical Gaps) | ✅ | Location not matching | Location not matching | ✅ | ✅ PASS |
| mid_tier2_vit x jd_26 | 35 | Reach Role (Critical Gaps) | Reach Role (Critical Gaps) | ✅ | Work experience not matching | Work experience not matching | ✅ | ✅ PASS |
| mid_tier2_vit x jd_27 | 20 | Reach Role (Critical Gaps) | Moderate Match (Gaps to Defend) / Reach Role (Critical Gaps) | ✅ | Location not matching | Location not matching | ✅ | ✅ PASS |
| mid_tier2_vit x jd_28 | 20 | Reach Role (Critical Gaps) | Reach Role (Critical Gaps) | ✅ | Role profile not matching | Work experience not matching | ❌ | ⚠️ REVIEW |
| mid_tier2_vit x jd_29 | 98 | Strong Match | Strong Match / Good Match | ✅ | None | None | ✅ | ✅ PASS |
| mid_tier2_vit x jd_30 | 20 | Reach Role (Critical Gaps) | Moderate Match (Gaps to Defend) / Good Match | ❌ | Work experience not matching | None | ✅ | ⚠️ REVIEW |
| mid_tier2_vit x jd_31 | 40 | Reach Role (Critical Gaps) | Moderate Match (Gaps to Defend) / Reach Role (Critical Gaps) | ✅ | None | None | ✅ | ✅ PASS |
| mid_tier2_vit x jd_32 | 79 | Good Match | Moderate Match (Gaps to Defend) / Reach Role (Critical Gaps) | ❌ | Location not matching | Location not matching | ✅ | ⚠️ REVIEW |
| mid_tier2_vit x jd_33 | 20 | Reach Role (Critical Gaps) | Reach Role (Critical Gaps) | ✅ | Role profile not matching | Work experience not matching | ❌ | ⚠️ REVIEW |
| mid_tier2_vit x jd_34 | 74 | Good Match | Good Match / Strong Match / Moderate Match (Gaps to Defend) | ✅ | None | None | ✅ | ✅ PASS |
| mid_tier2_vit x jd_35 | 98 | Strong Match | Strong Match / Good Match | ✅ | None | None | ✅ | ✅ PASS |
| mid_tier2_vit x jd_36 | 26 | Reach Role (Critical Gaps) | Reach Role (Critical Gaps) / Moderate Match (Gaps to Defend) | ✅ | College not matching | College not matching | ✅ | ✅ PASS |
| mid_tier2_vit x jd_37 | 77 | Good Match | Good Match / Moderate Match (Gaps to Defend) | ✅ | None | None | ✅ | ✅ PASS |
| mid_tier2_vit x jd_38 | 20 | Reach Role (Critical Gaps) | Reach Role (Critical Gaps) | ✅ | Work experience not matching | Work experience not matching | ✅ | ✅ PASS |
| mid_tier2_vit x jd_39 | 63 | Moderate Match (Gaps to Defend) | Good Match / Moderate Match (Gaps to Defend) | ✅ | None | None | ✅ | ✅ PASS |
| mid_tier2_vit x jd_40 | 51 | Moderate Match (Gaps to Defend) | Reach Role (Critical Gaps) | ❌ | Work experience not matching | Work experience not matching | ✅ | ⚠️ REVIEW |
| senior_tier1_iit x jd_01 | 49 | Moderate Match (Gaps to Defend) | Strong Match / Good Match | ❌ | None | None | ✅ | ⚠️ REVIEW |
| senior_tier1_iit x jd_02 | 41 | Reach Role (Critical Gaps) | Good Match / Moderate Match (Gaps to Defend) | ❌ | Location not matching | Location not matching | ✅ | ⚠️ REVIEW |
| senior_tier1_iit x jd_03 | 98 | Strong Match | Strong Match / Good Match | ✅ | None | None | ✅ | ✅ PASS |
| senior_tier1_iit x jd_04 | 53 | Moderate Match (Gaps to Defend) | Strong Match / Good Match | ❌ | None | None | ✅ | ⚠️ REVIEW |
| senior_tier1_iit x jd_05 | 29 | Reach Role (Critical Gaps) | Moderate Match (Gaps to Defend) / Reach Role (Critical Gaps) | ✅ | Location not matching | Location not matching | ✅ | ✅ PASS |
| senior_tier1_iit x jd_06 | 20 | Reach Role (Critical Gaps) | Good Match / Moderate Match (Gaps to Defend) | ❌ | Role profile not matching | None | ✅ | ⚠️ REVIEW |
| senior_tier1_iit x jd_07 | 20 | Reach Role (Critical Gaps) | Moderate Match (Gaps to Defend) / Reach Role (Critical Gaps) | ✅ | Location not matching | Location not matching | ✅ | ✅ PASS |
| senior_tier1_iit x jd_08 | 79 | Good Match | Strong Match / Good Match | ✅ | None | None | ✅ | ✅ PASS |
| senior_tier1_iit x jd_09 | 43 | Reach Role (Critical Gaps) | Strong Match / Good Match | ❌ | None | None | ✅ | ⚠️ REVIEW |
| senior_tier1_iit x jd_10 | 20 | Reach Role (Critical Gaps) | Moderate Match (Gaps to Defend) / Good Match | ❌ | Role profile not matching | None | ✅ | ⚠️ REVIEW |
| senior_tier1_iit x jd_11 | 36 | Reach Role (Critical Gaps) | Good Match / Strong Match | ❌ | None | None | ✅ | ⚠️ REVIEW |
| senior_tier1_iit x jd_12 | 57 | Moderate Match (Gaps to Defend) | Moderate Match (Gaps to Defend) / Good Match | ✅ | Work experience not matching, Location not matching | Location not matching | ✅ | ✅ PASS |
| senior_tier1_iit x jd_13 | 51 | Moderate Match (Gaps to Defend) | Good Match / Moderate Match (Gaps to Defend) | ✅ | Role profile not matching | None | ✅ | ✅ PASS |
| senior_tier1_iit x jd_14 | 55 | Moderate Match (Gaps to Defend) | Strong Match / Good Match | ❌ | None | None | ✅ | ⚠️ REVIEW |
| senior_tier1_iit x jd_15 | 50 | Moderate Match (Gaps to Defend) | Strong Match / Good Match | ❌ | None | None | ✅ | ⚠️ REVIEW |
| senior_tier1_iit x jd_16 | 52 | Moderate Match (Gaps to Defend) | Strong Match / Good Match | ❌ | None | None | ✅ | ⚠️ REVIEW |
| senior_tier1_iit x jd_17 | 45 | Moderate Match (Gaps to Defend) | Good Match / Moderate Match (Gaps to Defend) | ✅ | Role profile not matching | None | ✅ | ✅ PASS |
| senior_tier1_iit x jd_18 | 24 | Reach Role (Critical Gaps) | Moderate Match (Gaps to Defend) / Reach Role (Critical Gaps) | ✅ | Location not matching | Location not matching | ✅ | ✅ PASS |
| senior_tier1_iit x jd_19 | 43 | Reach Role (Critical Gaps) | Moderate Match (Gaps to Defend) / Reach Role (Critical Gaps) | ✅ | Role profile not matching | Work experience not matching | ❌ | ⚠️ REVIEW |
| senior_tier1_iit x jd_20 | 37 | Reach Role (Critical Gaps) | Good Match / Moderate Match (Gaps to Defend) | ❌ | Location not matching | Location not matching | ✅ | ⚠️ REVIEW |
| senior_tier1_iit x jd_21 | 68 | Moderate Match (Gaps to Defend) | Strong Match / Good Match | ❌ | None | None | ✅ | ⚠️ REVIEW |
| senior_tier1_iit x jd_22 | 20 | Reach Role (Critical Gaps) | Moderate Match (Gaps to Defend) / Reach Role (Critical Gaps) | ✅ | Location not matching | Location not matching | ✅ | ✅ PASS |
| senior_tier1_iit x jd_23 | 20 | Reach Role (Critical Gaps) | Reach Role (Critical Gaps) | ✅ | Role profile not matching, Degree not matching | Degree not matching | ✅ | ✅ PASS |
| senior_tier1_iit x jd_24 | 25 | Reach Role (Critical Gaps) | Good Match / Moderate Match (Gaps to Defend) | ❌ | None | None | ✅ | ⚠️ REVIEW |
| senior_tier1_iit x jd_25 | 35 | Reach Role (Critical Gaps) | Moderate Match (Gaps to Defend) / Reach Role (Critical Gaps) | ✅ | Location not matching | Location not matching | ✅ | ✅ PASS |
| senior_tier1_iit x jd_26 | 76 | Good Match | Strong Match / Good Match | ✅ | None | None | ✅ | ✅ PASS |
| senior_tier1_iit x jd_27 | 50 | Moderate Match (Gaps to Defend) | Moderate Match (Gaps to Defend) / Reach Role (Critical Gaps) | ✅ | Location not matching | Location not matching | ✅ | ✅ PASS |
| senior_tier1_iit x jd_28 | 27 | Reach Role (Critical Gaps) | Good Match / Moderate Match (Gaps to Defend) | ❌ | Role profile not matching | None | ✅ | ⚠️ REVIEW |
| senior_tier1_iit x jd_29 | 45 | Moderate Match (Gaps to Defend) | Strong Match / Good Match | ❌ | None | None | ✅ | ⚠️ REVIEW |
| senior_tier1_iit x jd_30 | 50 | Moderate Match (Gaps to Defend) | Strong Match / Good Match | ❌ | None | None | ✅ | ⚠️ REVIEW |
| senior_tier1_iit x jd_31 | 63 | Moderate Match (Gaps to Defend) | Good Match / Moderate Match (Gaps to Defend) | ✅ | None | None | ✅ | ✅ PASS |
| senior_tier1_iit x jd_32 | 67 | Moderate Match (Gaps to Defend) | Moderate Match (Gaps to Defend) / Reach Role (Critical Gaps) | ✅ | Location not matching | Location not matching | ✅ | ✅ PASS |
| senior_tier1_iit x jd_33 | 20 | Reach Role (Critical Gaps) | Good Match / Moderate Match (Gaps to Defend) | ❌ | Role profile not matching | None | ✅ | ⚠️ REVIEW |
| senior_tier1_iit x jd_34 | 68 | Moderate Match (Gaps to Defend) | Strong Match / Good Match | ❌ | None | None | ✅ | ⚠️ REVIEW |
| senior_tier1_iit x jd_35 | 50 | Moderate Match (Gaps to Defend) | Strong Match / Good Match | ❌ | None | None | ✅ | ⚠️ REVIEW |
| senior_tier1_iit x jd_36 | 47 | Moderate Match (Gaps to Defend) | Strong Match / Good Match | ❌ | None | None | ✅ | ⚠️ REVIEW |
| senior_tier1_iit x jd_37 | 83 | Strong Match | Good Match / Moderate Match (Gaps to Defend) | ❌ | None | None | ✅ | ⚠️ REVIEW |
| senior_tier1_iit x jd_38 | 48 | Moderate Match (Gaps to Defend) | Moderate Match (Gaps to Defend) / Reach Role (Critical Gaps) | ✅ | Work experience not matching | Work experience not matching | ✅ | ✅ PASS |
| senior_tier1_iit x jd_39 | 66 | Moderate Match (Gaps to Defend) | Strong Match / Good Match | ❌ | None | None | ✅ | ⚠️ REVIEW |
| senior_tier1_iit x jd_40 | 60 | Moderate Match (Gaps to Defend) | Strong Match / Good Match | ❌ | None | None | ✅ | ⚠️ REVIEW |
