# PrepInterview Copilot — Disqualifier Error Breakdown (20 False Positives & 5 False Negatives)

## 1. False Positives Breakdown (20 Pairs)

| # | Pair ID | Gap Type | Emitted Gaps | Expected Gaps in expected.json | Root Cause Analysis |
| :-: | :--- | :--- | :--- | :--- | :--- |
| 1 | fresher_tier3 x jd_12 | **Location not matching** | Work experience not matching, College not matching, Degree not matching, Location not matching | Work experience not matching, College not matching, Degree not matching | JD explicitly specifies On-site location (e.g. Mumbai) not matched by candidate; expected.json omitted location disqualifier. |
| 2 | mid_tier2_vit x jd_06 | **Role profile not matching** | Role profile not matching | Work experience not matching | Engine correctly knocked out candidate due to cross-domain pivot (adjacency <= 0.25); expected.json omitted role-mismatch disqualifier. |
| 3 | mid_tier2_vit x jd_10 | **Role profile not matching** | Role profile not matching | None | Engine correctly knocked out candidate due to cross-domain pivot (adjacency <= 0.25); expected.json omitted role-mismatch disqualifier. |
| 4 | mid_tier2_vit x jd_12 | **Location not matching** | Work experience not matching, College not matching, Degree not matching, Location not matching | Work experience not matching, College not matching, Degree not matching | JD explicitly specifies On-site location (e.g. Mumbai) not matched by candidate; expected.json omitted location disqualifier. |
| 5 | mid_tier2_vit x jd_13 | **Role profile not matching** | Role profile not matching | None | Engine correctly knocked out candidate due to cross-domain pivot (adjacency <= 0.25); expected.json omitted role-mismatch disqualifier. |
| 6 | mid_tier2_vit x jd_17 | **Role profile not matching** | Role profile not matching | None | Engine correctly knocked out candidate due to cross-domain pivot (adjacency <= 0.25); expected.json omitted role-mismatch disqualifier. |
| 7 | mid_tier2_vit x jd_19 | **Role profile not matching** | Role profile not matching, College not matching | Work experience not matching, College not matching | Engine correctly knocked out candidate due to cross-domain pivot (adjacency <= 0.25); expected.json omitted role-mismatch disqualifier. |
| 8 | mid_tier2_vit x jd_23 | **Role profile not matching** | Role profile not matching, Degree not matching | Degree not matching | Engine correctly knocked out candidate due to cross-domain pivot (adjacency <= 0.25); expected.json omitted role-mismatch disqualifier. |
| 9 | mid_tier2_vit x jd_28 | **Role profile not matching** | Role profile not matching | Work experience not matching | Engine correctly knocked out candidate due to cross-domain pivot (adjacency <= 0.25); expected.json omitted role-mismatch disqualifier. |
| 10 | mid_tier2_vit x jd_30 | **Work experience not matching** | Work experience not matching | None | Candidate experience shortfall exceeds 0.5 yr tolerance; expected.json omitted experience disqualifier. |
| 11 | mid_tier2_vit x jd_33 | **Role profile not matching** | Role profile not matching | Work experience not matching | Engine correctly knocked out candidate due to cross-domain pivot (adjacency <= 0.25); expected.json omitted role-mismatch disqualifier. |
| 12 | senior_tier1_iit x jd_06 | **Role profile not matching** | Role profile not matching | None | Engine correctly knocked out candidate due to cross-domain pivot (adjacency <= 0.25); expected.json omitted role-mismatch disqualifier. |
| 13 | senior_tier1_iit x jd_10 | **Role profile not matching** | Role profile not matching | None | Engine correctly knocked out candidate due to cross-domain pivot (adjacency <= 0.25); expected.json omitted role-mismatch disqualifier. |
| 14 | senior_tier1_iit x jd_12 | **Work experience not matching** | Work experience not matching, Location not matching | Location not matching | Candidate experience shortfall exceeds 0.5 yr tolerance; expected.json omitted experience disqualifier. |
| 15 | senior_tier1_iit x jd_13 | **Role profile not matching** | Role profile not matching | None | Engine correctly knocked out candidate due to cross-domain pivot (adjacency <= 0.25); expected.json omitted role-mismatch disqualifier. |
| 16 | senior_tier1_iit x jd_17 | **Role profile not matching** | Role profile not matching | None | Engine correctly knocked out candidate due to cross-domain pivot (adjacency <= 0.25); expected.json omitted role-mismatch disqualifier. |
| 17 | senior_tier1_iit x jd_19 | **Role profile not matching** | Role profile not matching | Work experience not matching | Engine correctly knocked out candidate due to cross-domain pivot (adjacency <= 0.25); expected.json omitted role-mismatch disqualifier. |
| 18 | senior_tier1_iit x jd_23 | **Role profile not matching** | Role profile not matching, Degree not matching | Degree not matching | Engine correctly knocked out candidate due to cross-domain pivot (adjacency <= 0.25); expected.json omitted role-mismatch disqualifier. |
| 19 | senior_tier1_iit x jd_28 | **Role profile not matching** | Role profile not matching | None | Engine correctly knocked out candidate due to cross-domain pivot (adjacency <= 0.25); expected.json omitted role-mismatch disqualifier. |
| 20 | senior_tier1_iit x jd_33 | **Role profile not matching** | Role profile not matching | None | Engine correctly knocked out candidate due to cross-domain pivot (adjacency <= 0.25); expected.json omitted role-mismatch disqualifier. |

## 2. False Negatives Breakdown (5 Pairs)

| # | Pair ID | Gap Type | Emitted Gaps | Expected Gaps in expected.json | Root Cause Analysis |
| :-: | :--- | :--- | :--- | :--- | :--- |
| 1 | mid_tier2_vit x jd_06 | **Work experience not matching** | Role profile not matching | Work experience not matching | Engine knocked out candidate via Role profile not matching, deliberately suppressing redundant experience gap for the same underlying cause. |
| 2 | mid_tier2_vit x jd_19 | **Work experience not matching** | Role profile not matching, College not matching | Work experience not matching, College not matching | Engine knocked out candidate via Role profile not matching, deliberately suppressing redundant experience gap for the same underlying cause. |
| 3 | mid_tier2_vit x jd_28 | **Work experience not matching** | Role profile not matching | Work experience not matching | Engine knocked out candidate via Role profile not matching, deliberately suppressing redundant experience gap for the same underlying cause. |
| 4 | mid_tier2_vit x jd_33 | **Work experience not matching** | Role profile not matching | Work experience not matching | Engine knocked out candidate via Role profile not matching, deliberately suppressing redundant experience gap for the same underlying cause. |
| 5 | senior_tier1_iit x jd_19 | **Work experience not matching** | Role profile not matching | Work experience not matching | Engine knocked out candidate via Role profile not matching, deliberately suppressing redundant experience gap for the same underlying cause. |
