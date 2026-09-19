# PrepInterview Copilot — Behavior Diff vs part2-fixed (Part 3)

**Generated Date:** 2026-09-19T08:22:30.137Z
**Base Tag:** `part2-fixed`
**Total Evaluation Pairs:** 120
**Changed Pairs:** 76 / 120 (63.3%)

## Summary of Changes in Part 3

Part 3 upgraded hard-requirement logic: multi-format calendar date parsing, internship 0.5x weighting, role family adjacency, overqualified soft penalty, single-source college tier lookup with unknown fallback, and regional location clustering.

| Pair | Old Score | New Score | Delta | Old Tier | New Tier | Old Gaps | New Gaps |
| :--- | :---: | :---: | :---: | :--- | :--- | :--- | :--- |
| fresher_tier3 x jd_02 | 20 | 25 | +5 | Reach Role (Critical Gaps) | Reach Role (Critical Gaps) | None | None |
| fresher_tier3 x jd_05 | 54 | 67 | +13 | Moderate Match (Gaps to Defend) | Moderate Match (Gaps to Defend) | None | None |
| fresher_tier3 x jd_12 | 20 | 20 | 0 | Reach Role (Critical Gaps) | Reach Role (Critical Gaps) | College not matching, Degree not matching, Location not matching | College not matching, Degree not matching, Location not matching, Work experience not matching |
| fresher_tier3 x jd_15 | 50 | 20 | -30 | Moderate Match (Gaps to Defend) | Reach Role (Critical Gaps) | None | None |
| fresher_tier3 x jd_17 | 20 | 23 | +3 | Reach Role (Critical Gaps) | Reach Role (Critical Gaps) | Work experience not matching | Work experience not matching |
| fresher_tier3 x jd_18 | 54 | 35 | -19 | Moderate Match (Gaps to Defend) | Reach Role (Critical Gaps) | None | None |
| fresher_tier3 x jd_19 | 20 | 20 | 0 | Reach Role (Critical Gaps) | Reach Role (Critical Gaps) | College not matching, Location not matching | College not matching, Location not matching, Work experience not matching |
| fresher_tier3 x jd_25 | 32 | 49 | +17 | Reach Role (Critical Gaps) | Moderate Match (Gaps to Defend) | Location not matching | Location not matching |
| fresher_tier3 x jd_31 | 50 | 85 | +35 | Moderate Match (Gaps to Defend) | Strong Match | None | None |
| fresher_tier3 x jd_37 | 32 | 39 | +7 | Reach Role (Critical Gaps) | Reach Role (Critical Gaps) | Location not matching | Location not matching |
| fresher_tier3 x jd_38 | 20 | 20 | 0 | Reach Role (Critical Gaps) | Reach Role (Critical Gaps) | None | Work experience not matching |
| fresher_tier3 x jd_40 | 20 | 20 | 0 | Reach Role (Critical Gaps) | Reach Role (Critical Gaps) | None | Work experience not matching |
| mid_tier2_vit x jd_01 | 20 | 84 | +64 | Reach Role (Critical Gaps) | Moderate Match (Gaps to Defend) | Work experience not matching | Work experience not matching |
| mid_tier2_vit x jd_02 | 20 | 73 | +53 | Reach Role (Critical Gaps) | Moderate Match (Gaps to Defend) | Location not matching | Location not matching |
| mid_tier2_vit x jd_04 | 20 | 35 | +15 | Reach Role (Critical Gaps) | Reach Role (Critical Gaps) | None | None |
| mid_tier2_vit x jd_05 | 32 | 20 | -12 | Reach Role (Critical Gaps) | Reach Role (Critical Gaps) | Location not matching | Location not matching |
| mid_tier2_vit x jd_07 | 20 | 42 | +22 | Reach Role (Critical Gaps) | Reach Role (Critical Gaps) | Location not matching | Location not matching |
| mid_tier2_vit x jd_08 | 20 | 21 | +1 | Reach Role (Critical Gaps) | Reach Role (Critical Gaps) | Work experience not matching | Work experience not matching |
| mid_tier2_vit x jd_09 | 20 | 79 | +59 | Reach Role (Critical Gaps) | Good Match | None | None |
| mid_tier2_vit x jd_11 | 20 | 36 | +16 | Reach Role (Critical Gaps) | Reach Role (Critical Gaps) | None | None |
| mid_tier2_vit x jd_12 | 20 | 20 | 0 | Reach Role (Critical Gaps) | Reach Role (Critical Gaps) | College not matching, Degree not matching, Location not matching | College not matching, Degree not matching, Location not matching, Work experience not matching |
| mid_tier2_vit x jd_15 | 50 | 98 | +48 | Moderate Match (Gaps to Defend) | Strong Match | None | None |
| mid_tier2_vit x jd_17 | 20 | 33 | +13 | Reach Role (Critical Gaps) | Reach Role (Critical Gaps) | None | None |
| mid_tier2_vit x jd_18 | 32 | 65 | +33 | Reach Role (Critical Gaps) | Moderate Match (Gaps to Defend) | Location not matching | Location not matching |
| mid_tier2_vit x jd_19 | 39 | 20 | -19 | Reach Role (Critical Gaps) | Reach Role (Critical Gaps) | College not matching | College not matching, Work experience not matching |
| mid_tier2_vit x jd_20 | 82 | 20 | -62 | Moderate Match (Gaps to Defend) | Reach Role (Critical Gaps) | Location not matching | Location not matching |
| mid_tier2_vit x jd_22 | 20 | 55 | +35 | Reach Role (Critical Gaps) | Moderate Match (Gaps to Defend) | Location not matching | Location not matching |
| mid_tier2_vit x jd_25 | 32 | 22 | -10 | Reach Role (Critical Gaps) | Reach Role (Critical Gaps) | Location not matching | Location not matching |
| mid_tier2_vit x jd_26 | 20 | 35 | +15 | Reach Role (Critical Gaps) | Reach Role (Critical Gaps) | Work experience not matching | Work experience not matching |
| mid_tier2_vit x jd_27 | 36 | 20 | -16 | Reach Role (Critical Gaps) | Reach Role (Critical Gaps) | Location not matching | Location not matching |
| mid_tier2_vit x jd_29 | 20 | 98 | +78 | Reach Role (Critical Gaps) | Strong Match | None | None |
| mid_tier2_vit x jd_30 | 38 | 20 | -18 | Reach Role (Critical Gaps) | Reach Role (Critical Gaps) | Work experience not matching | Work experience not matching |
| mid_tier2_vit x jd_31 | 50 | 40 | -10 | Moderate Match (Gaps to Defend) | Reach Role (Critical Gaps) | None | None |
| mid_tier2_vit x jd_32 | 20 | 66 | +46 | Reach Role (Critical Gaps) | Reach Role (Critical Gaps) | Location not matching, Work experience not matching | Location not matching, Work experience not matching |
| mid_tier2_vit x jd_34 | 56 | 74 | +18 | Moderate Match (Gaps to Defend) | Good Match | None | None |
| mid_tier2_vit x jd_35 | 20 | 98 | +78 | Reach Role (Critical Gaps) | Strong Match | None | None |
| mid_tier2_vit x jd_36 | 43 | 26 | -17 | Reach Role (Critical Gaps) | Reach Role (Critical Gaps) | College not matching | College not matching |
| mid_tier2_vit x jd_37 | 54 | 77 | +23 | Moderate Match (Gaps to Defend) | Good Match | None | None |
| mid_tier2_vit x jd_38 | 20 | 20 | 0 | Reach Role (Critical Gaps) | Reach Role (Critical Gaps) | None | Work experience not matching |
| mid_tier2_vit x jd_39 | 20 | 47 | +27 | Reach Role (Critical Gaps) | Moderate Match (Gaps to Defend) | Work experience not matching | Work experience not matching |
| mid_tier2_vit x jd_40 | 20 | 51 | +31 | Reach Role (Critical Gaps) | Moderate Match (Gaps to Defend) | None | Work experience not matching |
| senior_tier1_iit x jd_01 | 20 | 49 | +29 | Reach Role (Critical Gaps) | Moderate Match (Gaps to Defend) | None | None |
| senior_tier1_iit x jd_02 | 20 | 41 | +21 | Reach Role (Critical Gaps) | Reach Role (Critical Gaps) | Location not matching | Location not matching |
| senior_tier1_iit x jd_03 | 20 | 98 | +78 | Reach Role (Critical Gaps) | Strong Match | None | None |
| senior_tier1_iit x jd_04 | 20 | 53 | +33 | Reach Role (Critical Gaps) | Moderate Match (Gaps to Defend) | None | None |
| senior_tier1_iit x jd_05 | 32 | 29 | -3 | Reach Role (Critical Gaps) | Reach Role (Critical Gaps) | Location not matching | Location not matching |
| senior_tier1_iit x jd_06 | 20 | 59 | +39 | Reach Role (Critical Gaps) | Moderate Match (Gaps to Defend) | None | None |
| senior_tier1_iit x jd_08 | 20 | 94 | +74 | Reach Role (Critical Gaps) | Strong Match | None | None |
| senior_tier1_iit x jd_09 | 20 | 51 | +31 | Reach Role (Critical Gaps) | Moderate Match (Gaps to Defend) | None | None |
| senior_tier1_iit x jd_11 | 20 | 36 | +16 | Reach Role (Critical Gaps) | Reach Role (Critical Gaps) | None | None |
| senior_tier1_iit x jd_12 | 38 | 47 | +9 | Reach Role (Critical Gaps) | Reach Role (Critical Gaps) | Location not matching | Location not matching, Work experience not matching |
| senior_tier1_iit x jd_13 | 20 | 67 | +47 | Reach Role (Critical Gaps) | Moderate Match (Gaps to Defend) | None | None |
| senior_tier1_iit x jd_14 | 20 | 55 | +35 | Reach Role (Critical Gaps) | Moderate Match (Gaps to Defend) | None | None |
| senior_tier1_iit x jd_16 | 60 | 52 | -8 | Moderate Match (Gaps to Defend) | Moderate Match (Gaps to Defend) | None | None |
| senior_tier1_iit x jd_17 | 20 | 45 | +25 | Reach Role (Critical Gaps) | Moderate Match (Gaps to Defend) | None | None |
| senior_tier1_iit x jd_18 | 32 | 24 | -8 | Reach Role (Critical Gaps) | Reach Role (Critical Gaps) | Location not matching | Location not matching |
| senior_tier1_iit x jd_19 | 60 | 43 | -17 | Moderate Match (Gaps to Defend) | Reach Role (Critical Gaps) | None | Work experience not matching |
| senior_tier1_iit x jd_20 | 20 | 37 | +17 | Reach Role (Critical Gaps) | Reach Role (Critical Gaps) | Location not matching | Location not matching |
| senior_tier1_iit x jd_21 | 20 | 68 | +48 | Reach Role (Critical Gaps) | Moderate Match (Gaps to Defend) | None | None |
| senior_tier1_iit x jd_24 | 20 | 25 | +5 | Reach Role (Critical Gaps) | Reach Role (Critical Gaps) | None | None |
| senior_tier1_iit x jd_25 | 32 | 35 | +3 | Reach Role (Critical Gaps) | Reach Role (Critical Gaps) | Location not matching | Location not matching |
| senior_tier1_iit x jd_26 | 20 | 73 | +53 | Reach Role (Critical Gaps) | Good Match | None | None |
| senior_tier1_iit x jd_27 | 36 | 50 | +14 | Reach Role (Critical Gaps) | Moderate Match (Gaps to Defend) | Location not matching | Location not matching |
| senior_tier1_iit x jd_28 | 20 | 53 | +33 | Reach Role (Critical Gaps) | Moderate Match (Gaps to Defend) | None | None |
| senior_tier1_iit x jd_29 | 20 | 53 | +33 | Reach Role (Critical Gaps) | Moderate Match (Gaps to Defend) | None | None |
| senior_tier1_iit x jd_30 | 57 | 50 | -7 | Moderate Match (Gaps to Defend) | Moderate Match (Gaps to Defend) | None | None |
| senior_tier1_iit x jd_31 | 50 | 63 | +13 | Moderate Match (Gaps to Defend) | Moderate Match (Gaps to Defend) | None | None |
| senior_tier1_iit x jd_32 | 20 | 67 | +47 | Reach Role (Critical Gaps) | Moderate Match (Gaps to Defend) | Location not matching | Location not matching |
| senior_tier1_iit x jd_33 | 20 | 38 | +18 | Reach Role (Critical Gaps) | Reach Role (Critical Gaps) | None | None |
| senior_tier1_iit x jd_34 | 60 | 68 | +8 | Moderate Match (Gaps to Defend) | Moderate Match (Gaps to Defend) | None | None |
| senior_tier1_iit x jd_35 | 20 | 50 | +30 | Reach Role (Critical Gaps) | Moderate Match (Gaps to Defend) | None | None |
| senior_tier1_iit x jd_36 | 64 | 47 | -17 | Moderate Match (Gaps to Defend) | Moderate Match (Gaps to Defend) | None | None |
| senior_tier1_iit x jd_37 | 54 | 83 | +29 | Moderate Match (Gaps to Defend) | Strong Match | None | None |
| senior_tier1_iit x jd_38 | 20 | 48 | +28 | Reach Role (Critical Gaps) | Moderate Match (Gaps to Defend) | None | Work experience not matching |
| senior_tier1_iit x jd_39 | 20 | 66 | +46 | Reach Role (Critical Gaps) | Moderate Match (Gaps to Defend) | None | None |
| senior_tier1_iit x jd_40 | 20 | 60 | +40 | Reach Role (Critical Gaps) | Moderate Match (Gaps to Defend) | None | None |
