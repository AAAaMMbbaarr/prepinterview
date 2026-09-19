// PrepInterview Copilot - Centralized Scoring Configuration
(function() {
  'use strict';

  const ScoringConfig = {
    bounds: {
      min: 20,
      max: 98
    },
    skillWeights: {
      required: 2.0,
      niceToHave: 1.0,
      unlabeled: 1.5
    },
    evidenceStrength: {
      experienceBullet: 1.0,
      skillsListOnly: 0.8,
      default: 1.0
    },
    confidenceThresholds: {
      highCount: 6,
      mediumCount: 3
    },
    penalties: {
      experienceGapLarge: 35,   // gap >= 2 years
      experienceGapMedium: 22,  // gap >= 1 year
      experienceGapSmall: 12,   // gap < 1 year
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
    thresholds: {
      reachRoleMaxDisqualifiers: 2,
      reachRoleScoreCutoff: 45,
      moderateRoleScoreCutoff: 72,
      strongMatchScoreCutoff: 80,
      domainPivotThreshold: 50
    },
    disqualifierMessages: {
      workExperience: 'Work experience not matching',
      college: 'College not matching',
      degree: 'Degree not matching',
      location: 'Location not matching',
      roleProfile: 'Role profile not matching'
    },
    tiers: {
      reachRole: {
        name: 'Reach Role (Critical Gaps)',
        badge: '🔴',
        color: '#f85149'
      },
      moderateMatch: {
        name: 'Moderate Match (Gaps to Defend)',
        badge: '🟡',
        color: '#d29922'
      },
      goodMatch: {
        name: 'Good Match',
        badge: '🟢',
        color: '#2ea043'
      },
      strongMatch: {
        name: 'Strong Match',
        badge: '🟢',
        color: '#3fb950'
      }
    },
    flags: {
      enableRoleProfileDisqualifier: false
    }
  };

  if (typeof window !== 'undefined') {
    window.PrepInterview = window.PrepInterview || {};
    window.PrepInterview.Config = ScoringConfig;
  }
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = ScoringConfig;
  }
})();
