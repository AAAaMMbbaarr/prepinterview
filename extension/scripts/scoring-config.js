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
      experienceGapTolerance: 3, // gap <= 0.5 year tolerance
      overqualified: 4,         // candidate > maxExp + 3 years
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
      hard: [
        'mandatory_college',
        'mandatory_degree',
        'experience_shortfall_large',
        'role_profile_mismatch'
      ],
      soft: [
        'experience_shortfall_small',
        'location_mismatch',
        'hybrid_relocation'
      ]
    },
    caps: {
      softGapsOnly: 79,
      oneHardGap: 71,
      twoOrMoreHardGaps: 44
    },
    experience: {
      internshipWeight: 0.5,
      overqualifiedYearsThreshold: 3.0,
      overqualifiedNote: 'May be junior for you',
      fresherExemptionYears: 1.0,
      // Direction: roleAdjacency[JD_FAMILY][CANDIDATE_FAMILY] = credit multiplier
      // Rows = JD Family being applied to
      // Columns = Candidate Family background
      roleAdjacency: {
        product: {
          product: 1.0,
          growth: 0.75,
          strategy_bizops: 0.75,
          design: 0.75,
          data_analytics: 0.5,
          engineering_swe: 0.5,
          marketing: 0.5,
          customer_success: 0.5,
          sales: 0.25,
          operations: 0.25,
          finance: 0.25,
          hr_recruiting: 0.1,
          unknown: 0.5
        },
        growth: {
          growth: 1.0,
          product: 0.75,
          marketing: 0.75,
          data_analytics: 0.5,
          sales: 0.5,
          customer_success: 0.5,
          strategy_bizops: 0.5,
          engineering_swe: 0.25,
          design: 0.25,
          operations: 0.25,
          finance: 0.2,
          hr_recruiting: 0.1,
          unknown: 0.5
        },
        strategy_bizops: {
          strategy_bizops: 1.0,
          finance: 0.75,
          product: 0.75,
          operations: 0.5,
          growth: 0.5,
          data_analytics: 0.5,
          marketing: 0.25,
          sales: 0.25,
          customer_success: 0.25,
          engineering_swe: 0.2,
          design: 0.1,
          hr_recruiting: 0.2,
          unknown: 0.5
        },
        data_analytics: {
          data_analytics: 1.0,
          engineering_swe: 0.5,
          finance: 0.5,
          product: 0.2,
          growth: 0.2,
          marketing: 0.25,
          strategy_bizops: 0.25,
          operations: 0.2,
          customer_success: 0.1,
          sales: 0.1,
          design: 0.1,
          hr_recruiting: 0.1,
          unknown: 0.5
        },
        engineering_swe: {
          engineering_swe: 1.0,
          data_analytics: 0.5,
          product: 0.2,
          growth: 0.2,
          design: 0.25,
          strategy_bizops: 0.1,
          marketing: 0.1,
          sales: 0.1,
          customer_success: 0.1,
          operations: 0.1,
          finance: 0.1,
          hr_recruiting: 0.1,
          unknown: 0.5
        },
        sales: {
          sales: 1.0,
          customer_success: 0.75,
          growth: 0.5,
          marketing: 0.5,
          strategy_bizops: 0.5,
          operations: 0.25,
          product: 0.0,
          finance: 0.2,
          hr_recruiting: 0.2,
          engineering_swe: 0.0,
          data_analytics: 0.1,
          design: 0.1,
          unknown: 0.5
        },
        operations: {
          operations: 1.0,
          strategy_bizops: 0.5,
          hr_recruiting: 0.5,
          customer_success: 0.5,
          finance: 0.5,
          sales: 0.25,
          product: 0.25,
          growth: 0.25,
          marketing: 0.2,
          engineering_swe: 0.1,
          data_analytics: 0.2,
          design: 0.1,
          unknown: 0.5
        },
        hr_recruiting: {
          hr_recruiting: 1.0,
          operations: 0.5,
          strategy_bizops: 0.5,
          customer_success: 0.25,
          sales: 0.2,
          marketing: 0.2,
          product: 0.1,
          growth: 0.1,
          finance: 0.2,
          engineering_swe: 0.1,
          data_analytics: 0.1,
          design: 0.1,
          unknown: 0.5
        },
        customer_success: {
          customer_success: 1.0,
          sales: 0.75,
          operations: 0.5,
          product: 0.5,
          marketing: 0.5,
          growth: 0.5,
          strategy_bizops: 0.25,
          hr_recruiting: 0.2,
          finance: 0.2,
          engineering_swe: 0.1,
          data_analytics: 0.1,
          design: 0.1,
          unknown: 0.5
        },
        finance: {
          finance: 1.0,
          strategy_bizops: 0.75,
          data_analytics: 0.5,
          operations: 0.5,
          product: 0.25,
          growth: 0.2,
          sales: 0.2,
          marketing: 0.2,
          hr_recruiting: 0.2,
          customer_success: 0.1,
          engineering_swe: 0.1,
          design: 0.1,
          unknown: 0.5
        },
        marketing: {
          marketing: 1.0,
          growth: 0.75,
          product: 0.5,
          sales: 0.5,
          design: 0.5,
          customer_success: 0.5,
          strategy_bizops: 0.25,
          operations: 0.2,
          finance: 0.2,
          hr_recruiting: 0.2,
          data_analytics: 0.25,
          engineering_swe: 0.1,
          unknown: 0.5
        },
        design: {
          design: 1.0,
          product: 0.75,
          marketing: 0.5,
          engineering_swe: 0.5,
          growth: 0.25,
          customer_success: 0.1,
          strategy_bizops: 0.1,
          operations: 0.1,
          finance: 0.1,
          hr_recruiting: 0.1,
          sales: 0.1,
          data_analytics: 0.1,
          unknown: 0.5
        },
        unknown: {
          unknown: 1.0
        }
      }
    },
    location: {
      hybridSoftNote: 'Relocation needed',
      defaultOpenToRelocation: false,
      regions: {
        ncr: ['delhi', 'new delhi', 'gurugram', 'gurgaon', 'noida', 'greater noida', 'faridabad', 'ghaziabad'],
        mmr: ['mumbai', 'navi mumbai', 'thane'],
        bengaluru: ['bengaluru', 'bangalore'],
        hyderabad: ['hyderabad', 'secunderabad'],
        pune: ['pune', 'pimpri-chinchwad'],
        chennai: ['chennai'],
        kolkata: ['kolkata'],
        ahmedabad: ['ahmedabad', 'gandhinagar'],
        jaipur: ['jaipur'],
        chandigarh: ['chandigarh', 'mohali', 'panchkula'],
        kochi: ['kochi', 'cochin'],
        indore: ['indore']
      }
    },
    education: {
      unverifiedNote: 'Could not verify tier'
    },
    thresholds: {
      reachRoleMaxDisqualifiers: 2,
      reachRoleScoreCutoff: 45,
      moderateRoleScoreCutoff: 72,
      strongMatchScoreCutoff: 80,
      domainPivotThreshold: 50,
      roleMismatchCreditThreshold: 0.25
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
    scoreBands: {
      strong: {
        id: 'strong',
        name: 'Strong Match',
        internalTier: 'Strong Match',
        minScore: 80,
        badge: '🟢',
        color: '#3fb950',
        description: 'Your resume covers the core requirements in this posting.',
        cta: 'Practice this interview'
      },
      good: {
        id: 'good',
        name: 'Good Match',
        internalTier: 'Good Match',
        minScore: 72,
        badge: '🟢',
        color: '#2ea043',
        description: 'Your resume covers most of the requirements.',
        cta: 'Practice this interview'
      },
      moderate: {
        id: 'moderate',
        name: 'Moderate Match',
        internalTier: 'Moderate Match (Gaps to Defend)',
        minScore: 45,
        badge: '🟡',
        color: '#d29922',
        description: 'Partial overlap with the requirements; see the gaps below.',
        cta: 'Practice defending your gaps'
      },
      reach: {
        id: 'reach',
        name: 'Reach Role',
        internalTier: 'Reach Role (Critical Gaps)',
        minScore: 20,
        badge: '🔴',
        color: '#f85149',
        description: 'Low overlap, or several requirements aren\'t met.',
        cta: 'Practice for a stretch role'
      },
      footer: 'Estimate based on the job text, not a hiring prediction.'
    },
    breakdownLabelMap: {
      'Experience Gap Penalty': 'Experience shortfall',
      'Experience Requirement Met': 'Meets the minimum experience',
      'Location Match Bonus': 'Location matches',
      'Location Mismatch Penalty': 'Location mismatch',
      'College Tier Penalty': 'College tier requirement',
      'College Tier Preferred Bonus': 'Preferred college bonus',
      'College Tier Mandatory Bonus': 'Mandatory college met',
      'Degree Mandatory Penalty': 'Degree requirement',
      'Degree Preferred Bonus': 'Preferred degree bonus',
      'Overqualified Penalty': 'Seniority above posted range',
      'Role Profile Mismatch': 'Role profile mismatch',
      'Soft Gaps Penalty': 'Requirement gaps adjustment'
    },
    flags: {
      enableRoleProfileDisqualifier: true
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
