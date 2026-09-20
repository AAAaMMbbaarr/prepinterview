# PrepInterview Copilot — Behavior Diff (Round 3 Correctness Upgrades)

**Generated Date:** 2026-09-20T10:07:41.067Z
**Base Commit:** `HEAD` (Pre-Round 3)
**Total Evaluation Pairs:** 120
**Changed Pairs:** 0 / 120 (0.0%)

## Summary of Round 3 Core Upgrades

1. **Score Invariant Restored**: Removed temporary small-shortfall override. Score < 45 unconditionally triggers `Reach Role (Critical Gaps)`.
2. **Experience Tolerance**: Shortfall <= 0.5 year gives config penalty (-3) and soft note, without firing a red disqualifier.
3. **Gap Severity Hierarchy**: Hard gaps (mandatory college, mandatory degree, shortfall >= 1 yr, role mismatch) vs Soft gaps (shortfall < 1 yr, on-site location, hybrid relocation). Reach = score < 45 OR 2+ hard gaps. Capped at Moderate with 1 hard or any soft gaps.
4. **Directional `roleAdjacency` Matrix**: Explicit JD-to-Candidate multiplier matrix with role mismatch threshold <= 0.25 suppressing redundant experience gaps.
5. **Score Breakdown**: Returns `breakdown: [{label, points}]` and `preClampScore` with strict arithmetic verification.

| Pair | Old Score | New Score | Delta | Old Tier | New Tier | Old Gaps | New Gaps | Movement |
| :--- | :---: | :---: | :---: | :--- | :--- | :--- | :--- | :--- |
