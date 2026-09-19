# PrepInterview Copilot — Scoring Engine Specification (v1.0.6)

This document specifies the algorithmic architecture, scoring bands, gap severity hierarchies, score capping mechanics, configuration keys, and return shape for the PrepInterview Copilot matching engine.

---

## 1. Architectural Principles

1. **Pure Function Execution**: The engine (`evaluate()`) runs as a pure mathematical and linguistic pipeline with zero DOM, browser, or Chrome globals (`window`, `document`, `chrome`). It executes identically in node:test, background service workers, and popup UI contexts.
2. **Strict Determinism**: Date parsing and tenure calculations are pinned to `context.now` (or UTC current time), producing deterministic results across runs.
3. **Score Breakdown Arithmetic**: Pre-clamp score strictly satisfies `skillScore + sum(breakdown.points) === preClampScore`.
4. **Pure Score-to-Tier Determinism**: The qualification tier is derived solely and unconditionally from `finalScore`. No post-scoring tier overrides or exceptions exist.
5. **Score Bounds**: Clamped strictly within `[20, 98]`.

---

## 2. Score Bands & Qualification Tiers

| Score Range | Tier Name | Badge | Hex Color | Interpretation |
| :---: | :--- | :---: | :---: | :--- |
| **80 – 98** | **Strong Match** | 🟢 | `#3fb950` | Exceptional alignment across skills, experience, pedigree, and location. Candidate meets or exceeds core criteria. |
| **72 – 79** | **Good Match** | 🟢 | `#2ea043` | Solid candidate profile. Minor non-critical gaps or soft notes (e.g. hybrid relocation), but strong overall capability. |
| **45 – 71** | **Moderate Match (Gaps to Defend)** | 🟡 | `#d29922` | Viable candidate with one hard requirement shortfall or moderate skills deficit. Requires interview defense. |
| **20 – 44** | **Reach Role (Critical Gaps)** | 🔴 | `#f85149` | Significant hurdles (score < 45 or 2+ hard disqualifiers). Unlikely to pass initial resume screen. |

---

## 3. Gap Severity Hierarchy

Gaps are categorized into **Hard Gaps** (structural non-negotiables) and **Soft Gaps** (contextual preferences or minor shortfalls):

### 3.1 Hard Gaps
1. **Mandatory College Mismatch**: JD mandates premier/Tier-1 pedigree (`tierMandatory: true`) and candidate attended Tier 2 (`penalties.collegeTierMandatoryTier2 = 15`) or Tier 3 (`penalties.collegeTierMandatoryTier3 = 30`).
2. **Mandatory Degree Mismatch**: JD mandates PhD or MBA, and candidate lacks the credential (`penalties.degreePhdMandatory = 25`, `penalties.degreeMbaMandatory = 20`).
3. **Large Experience Shortfall**: Relevant experience shortfall $\ge 1.0$ year (`penalties.experienceGapMedium = 22` for 1–2 yrs; `penalties.experienceGapLarge = 35` for $\ge 2$ yrs).
4. **Role Profile Mismatch**: Candidate background has catastrophic cross-domain pivot to JD family with role adjacency multiplier $\le 0.25$ (e.g. Product Manager applying to Backend Systems or ML Deep Learning role). Firing this disqualifier suppresses redundant experience disqualifiers for the same cause.

### 3.2 Soft Gaps
1. **Small Experience Shortfall**:
   - **$\le 0.5$ year shortfall (Tolerance)**: Assesses configured tolerance penalty (`penalties.experienceGapTolerance = 3`), emits soft note `"Slightly below the stated minimum"`, but triggers **NO red disqualifier**.
   - **$0.5 < \text{shortfall} < 1.0$ year**: Assesses `penalties.experienceGapSmall = 12` and emits `"Work experience not matching"`.
2. **On-Site Location Mismatch**: JD is On-site in a city outside the candidate's metropolitan cluster (`penalties.locationMismatch = 18`, disqualifier `"Location not matching"`).
3. **Hybrid Relocation**: JD is Hybrid outside the candidate's cluster. Assesses 0 penalty and emits note `"Relocation needed"`.

---

## 4. Score Caps Mechanics

To maintain mathematical consistency while enforcing gating criteria, score caps replace post-hoc tier overrides. Caps operate directly on `preScore` before score clamping:

$$\text{preScore} = \text{round}(\text{skillScore} - \text{penalties} + \text{bonuses})$$

```javascript
let maxAllowed = 98;
if (hardGaps.length >= 2) {
  maxAllowed = config.caps.twoOrMoreHardGaps; // 44
} else if (hardGaps.length === 1) {
  maxAllowed = config.caps.oneHardGap;        // 71
} else if (softGaps.length > 0) {
  maxAllowed = config.caps.softGapsOnly;      // 79
}

if (preScore > maxAllowed) {
  const capDelta = maxAllowed - preScore;
  breakdown.push({ label: 'Capped: unmet requirement', points: capDelta });
  preScore = maxAllowed;
}
```

### Caps & Tier Derivation Guarantee
- **2+ Hard Gaps**: Cap $\le 44 \implies$ finalScore $\le 44 \implies$ **Reach Role (Critical Gaps)**.
- **1 Hard Gap**: Cap $\le 71 \implies$ finalScore $\le 71 \implies$ **Moderate Match** (or Reach if score < 45). Cannot reach Good or Strong.
- **Soft Gaps Only**: Cap $\le 79 \implies$ finalScore $\le 79 \implies$ **Good Match** (or Moderate/Reach). Cannot reach Strong Match.
- **Pre-Clamp Arithmetic**: Adding `{ label: 'Capped: unmet requirement', points: capDelta }` guarantees:
  $$\text{skillScore} + \sum \text{breakdown.points} = \text{preClampScore}$$

---

## 5. Directional Role Adjacency Matrix

The matrix models career transferability as a directional credit multiplier:
$$\text{roleAdjacency}[\text{JD\_FAMILY}][\text{CANDIDATE\_FAMILY}] = \text{credit multiplier}$$

- **Asymmetric Examples**:
  - SWE / Data candidate applying to Product JD: **0.50** credit (technical product managers).
  - Product / Growth candidate applying to SWE / Data JD: **0.20** credit (cannot write production code without engineering background).
  - Product to Design: **0.75**; Design to Product: **0.75**.
  - Sales to Product: **0.00**; Product to Sales: **0.25**.

---

## 6. Centralized Configuration Keys (`scoring-config.js`)

```javascript
{
  bounds: { min: 20, max: 98 },
  skillWeights: { required: 2.0, niceToHave: 1.0, unlabeled: 1.5 },
  evidenceStrength: { experienceBullet: 1.0, skillsListOnly: 0.8, default: 1.0 },
  confidenceThresholds: { highCount: 6, mediumCount: 3 },
  penalties: {
    experienceGapLarge: 35,
    experienceGapMedium: 22,
    experienceGapSmall: 12,
    experienceGapTolerance: 3,
    overqualified: 4,
    collegeTierMandatoryTier2: 15,
    collegeTierMandatoryTier3: 30,
    collegeTierPreferredTier3: 8,
    degreePhdMandatory: 25,
    degreeMbaMandatory: 20,
    locationMismatch: 18
  },
  bonuses: {
    experienceMeetsRequirement: 4,
    collegeTierMandatoryTier1: 6,
    collegeTierPreferredTier1: 6,
    collegeTierPreferredTier2: 2,
    degreeMbaPreferred: 3,
    locationMatch: 4
  },
  gapSeverity: {
    hard: ['mandatory_college', 'mandatory_degree', 'experience_shortfall_large', 'role_profile_mismatch'],
    soft: ['experience_shortfall_small', 'location_mismatch', 'hybrid_relocation']
  },
  caps: {
    softGapsOnly: 79,
    oneHardGap: 71,
    twoOrMoreHardGaps: 44
  },
  thresholds: {
    reachRoleScoreCutoff: 45,
    goodMatchScoreCutoff: 72,
    strongMatchScoreCutoff: 80,
    roleMismatchCreditThreshold: 0.25
  },
  disqualifierMessages: {
    workExperience: 'Work experience not matching',
    college: 'College not matching',
    degree: 'Degree not matching',
    location: 'Location not matching',
    roleProfile: 'Role profile not matching'
  },
  flags: {
    enableRoleProfileDisqualifier: true
  }
}
```

---

## 7. `evaluate()` Return Shape Specification

Calling `matcher.evaluate(resumeText, jdText, context)` returns an immutable evaluation object:

```typescript
interface EvaluationResult {
  status: 'ready';
  score: number;                // Final clamped integer in [20, 98]
  preClampScore: number;        // Score before clamping; satisfies breakdown arithmetic
  tier: string;                 // e.g. 'Strong Match', 'Good Match', 'Moderate Match (Gaps to Defend)', 'Reach Role (Critical Gaps)'
  badge: string;                // '🟢' | '🟡' | '🔴'
  color: string;                // Hex color code ('#3fb950', '#2ea043', '#d29922', '#f85149')
  breakdown: Array<{            // Pre-clamp line items
    label: string;              // e.g. 'Experience Meets Requirement', 'Capped: unmet requirement'
    points: number;             // Positive bonus or negative penalty/cap delta
  }>;
  notes: string[];              // Soft contextual notes (e.g. 'Relocation needed', 'Slightly below the stated minimum')
  hardGaps: string[];           // List of active hard gaps
  softGaps: string[];           // List of active soft gaps
  disqualifiers: string[];      // Red disqualifier labels displayed in UI banner
  matchedSkills: string[];      // Top matched skills (up to 6)
  missingSkills: string[];      // Top missing skills (up to 5)
  skillScore: number;           // Unweighted or weighted skill overlap base percentage (0-100)
  totalJdSkills: number;        // Total distinct skills extracted from JD
  weightedMatched: number;      // Numerator of skill match arithmetic
  weightedTotal: number;        // Denominator of skill match arithmetic
  confidence: 'HIGH' | 'MEDIUM' | 'LOW'; // Extraction confidence level
  lowConfidence: boolean;       // True if fewer than 3 skills extracted from JD
  candExp: {
    totalYears: number;         // Total parsed chronological tenure
    relevantYears: number;      // Adjacency-weighted relevant domain tenure
    roleFamilies: Record<string, number>; // Breakdown by functional family
  };
  candEdu: {
    degree: string;             // Highest degree detected ('PhD' | 'MBA' | 'Master\'s' | 'Bachelor\'s' | 'Not specified')
    tier: 'Tier 1' | 'Tier 2' | 'Tier 3' | 'unknown'; // NIRF/premier tier classification
    label: string;              // Formatted institution name
  };
  jdReq: {
    minExp: number;             // Minimum years required
    maxExp: number;             // Maximum years required
    roleFamily: string;         // Primary job domain
    workMode: 'On-site' | 'Hybrid' | 'Remote';
    jobCity: string;            // Primary job city
    tierMandatory: boolean;     // True if Tier 1 college required
    degreeMandatory: boolean;   // True if degree required
  };
}
```
