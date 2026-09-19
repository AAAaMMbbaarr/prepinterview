// PrepInterview Copilot - Upgraded Multi-Factor Match Engine (v1.0.6)
// Pure evaluate(resumeText, jdText, context) with Section-Weighted Skills, Evidence Strength & Fallback
(function() {
  'use strict';

  // Fallback resolution for Node environment or script load order
  let Config = null;
  let SkillsAPI = null;
  let CollegesData = null;

  if (typeof require !== 'undefined') {
    try { Config = require('./scoring-config.js'); } catch (e) {}
    try { SkillsAPI = require('./data/skills.js'); } catch (e) {}
    try { CollegesData = require('./data/colleges.js'); } catch (e) {}
  }

  if (typeof window !== 'undefined' && window.PrepInterview) {
    Config = Config || window.PrepInterview.Config;
    SkillsAPI = SkillsAPI || window.PrepInterview.Skills;
    CollegesData = CollegesData || window.PrepInterview.Colleges;
  }

  const DEFAULT_CONFIG = Config || {
    bounds: { min: 20, max: 98 },
    skillWeights: { required: 2.0, niceToHave: 1.0, unlabeled: 1.5 },
    evidenceStrength: { experienceBullet: 1.0, skillsListOnly: 0.8, default: 1.0 },
    confidenceThresholds: { highCount: 6, mediumCount: 3 },
    penalties: {
      experienceGapLarge: 35,
      experienceGapMedium: 22,
      experienceGapSmall: 12,
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
      reachRole: { name: 'Reach Role (Critical Gaps)', badge: '🔴', color: '#f85149' },
      moderateMatch: { name: 'Moderate Match (Gaps to Defend)', badge: '🟡', color: '#d29922' },
      goodMatch: { name: 'Good Match', badge: '🟢', color: '#2ea043' },
      strongMatch: { name: 'Strong Match', badge: '🟢', color: '#3fb950' }
    }
  };

  function normalizeWhitespace(text) {
    if (!text) return '';
    return text
      .replace(/[\u00A0\u1680\u2000-\u200B\u202F\u205F\u3000]/g, ' ')
      .replace(/[\u2010\u2011\u2012\u2013\u2014\u2015]/g, '-')
      .replace(/\r\n|\r|\n/g, '\n');
  }

  function normalize(str) {
    return normalizeWhitespace(str).toLowerCase().replace(/'/g, '').replace(/[^a-z0-9+#./\s-]/g, ' ');
  }

  // --- 1. SKILL EXTRACTION WITH GUARDS & IMPLICATIONS ---
  function extractSkillsFromText(text) {
    const found = new Map();
    if (!text || !SkillsAPI || !SkillsAPI.COMPILED_SKILLS) return found;

    for (const item of SkillsAPI.COMPILED_SKILLS) {
      let isMatched = false;
      if (item.guarded && SkillsAPI.GUARDED_MATCHERS && SkillsAPI.GUARDED_MATCHERS[item.guarded]) {
        isMatched = SkillsAPI.GUARDED_MATCHERS[item.guarded].match(text);
      } else {
        for (const p of item.patterns) {
          if (p.test(text)) {
            isMatched = true;
            break;
          }
        }
      }

      if (isMatched) {
        found.set(item.canonical, item);
        if (item.implies && item.implies.length > 0) {
          for (const imp of item.implies) {
            const impItem = SkillsAPI.COMPILED_SKILLS.find(s => s.canonical.toLowerCase() === imp.toLowerCase());
            if (impItem) {
              found.set(impItem.canonical, impItem);
            }
          }
        }
      }
    }

    return found;
  }

  function extractSkills(text) {
    const map = extractSkillsFromText(text);
    return Array.from(map.keys());
  }

  // --- 2. JD SECTION DETECTION & SKILL WEIGHTING ---
  function isLineHeading(line) {
    if (line.length > 80) return null;
    const trimmed = line.trim();

    // Compensation / benefits headings
    if (/^(?:##+|\*\*|[0-9]+\.|\u2022|\-)?\s*(?:benefits|perks|compensation|what we offer|rewards)\b/i.test(trimmed)) {
      return { type: 'unlabeled' };
    }

    // Nice-to-have headings
    if (/^(?:##+|\*\*|[0-9]+\.|\u2022|\-)?\s*(?:preferred qualifications|good to have|nice to have|preferred skills|bonus points|preferred requirements|desirable skills|what is nice to have)\b/i.test(trimmed)) {
      return { type: 'niceToHave' };
    }

    // Required headings
    if (/^(?:##+|\*\*|[0-9]+\.|\u2022|\-)?\s*(?:requirements|qualifications|what you(?:'ll)? need|what we(?:'re)? looking for|minimum requirements|minimum qualifications|who you are|must have|key requirements|candidate profile)\b/i.test(trimmed)) {
      return { type: 'required' };
    }

    // Explicit Unlabeled headings (Responsibilities, What you'll do, Overview)
    if (/^(?:##+|\*\*|[0-9]+\.|\u2022|\-)?\s*(?:responsibilities|what you(?:'ll)? do|key responsibilities|role overview|the role|about the role|job description|about us|company overview)\b/i.test(trimmed)) {
      return { type: 'unlabeled' };
    }

    return null;
  }

  function parseJdSections(jdText) {
    const lines = (jdText || '').split(/\r?\n/);
    const sections = [];
    let currentSection = 'unlabeled';

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line) continue;

      const heading = isLineHeading(line);
      if (heading) {
        currentSection = heading.type;
        continue;
      }

      let lineType = currentSection;
      const isCompensation = /\b(?:annual\s+bonus|performance\s+bonus|sign-on\s+bonus|retention\s+bonus|bonus\s+pool|salary\s+plus|benefits\s+plus|compensation\s+plus|plus\s+equity|plus\s+benefits)\b/i.test(line);
      if (!isCompensation && /\b(?:preferred|good to have|nice to have|plus|bonus|desirable)\b/i.test(line)) {
        lineType = 'niceToHave';
      }

      sections.push({ line, type: lineType });
    }

    return sections;
  }

  function extractJdSkillsWithWeights(jdText, config) {
    const sections = parseJdSections(jdText);
    const jdSkillsMap = new Map(); // canonical -> { weight, skillItem, section }

    const weightMap = {
      required: (config.skillWeights && config.skillWeights.required) || 2.0,
      niceToHave: (config.skillWeights && config.skillWeights.niceToHave) || 1.0,
      unlabeled: (config.skillWeights && config.skillWeights.unlabeled) || 1.5
    };

    for (const sec of sections) {
      const skillsOnLine = extractSkillsFromText(sec.line);
      const lineWeight = weightMap[sec.type] || 1.5;

      for (const [canonical, skillItem] of skillsOnLine.entries()) {
        if (jdSkillsMap.has(canonical)) {
          const existing = jdSkillsMap.get(canonical);
          if (lineWeight > existing.weight) {
            existing.weight = lineWeight;
            existing.section = sec.type;
          }
        } else {
          jdSkillsMap.set(canonical, {
            weight: lineWeight,
            skillItem: skillItem,
            section: sec.type
          });
        }
      }
    }

    const fullTextSkills = extractSkillsFromText(jdText);
    for (const [canonical, skillItem] of fullTextSkills.entries()) {
      if (!jdSkillsMap.has(canonical)) {
        jdSkillsMap.set(canonical, {
          weight: (config.skillWeights && config.skillWeights.unlabeled) || 1.5,
          skillItem: skillItem,
          section: 'unlabeled'
        });
      }
    }

    return jdSkillsMap;
  }

  // --- 3. RESUME SECTION SEGMENTATION & EVIDENCE STRENGTH ---
  function segmentResume(resumeText) {
    const clean = normalizeWhitespace(resumeText);
    const expMatch = clean.match(/\n\s*(?:##+|\*\*|[0-9]+\.|\u2022|\-)?\s*(?:experience|work experience|employment history|professional experience)\b/i);
    const skillsMatch = clean.match(/\n\s*(?:##+|\*\*|[0-9]+\.|\u2022|\-)?\s*(?:technical skills|skills|technologies|competencies|core skills|tools & technologies)\b/i);

    if (!expMatch || !skillsMatch) {
      return {
        hasReliableSections: false,
        experienceText: clean,
        skillsText: clean
      };
    }

    let expText = '';
    let skillsText = '';

    if (expMatch.index < skillsMatch.index) {
      expText = clean.slice(expMatch.index, skillsMatch.index);
      skillsText = clean.slice(skillsMatch.index);
    } else {
      skillsText = clean.slice(skillsMatch.index, expMatch.index);
      expText = clean.slice(expMatch.index);
    }

    return {
      hasReliableSections: true,
      experienceText: expText,
      skillsText: skillsText
    };
  }

  function extractCandidateSkillsWithEvidence(resumeText, config) {
    const segmentation = segmentResume(resumeText);
    const allCandidateSkills = extractSkillsFromText(resumeText);
    const candidateMap = new Map();

    const evConfig = config.evidenceStrength || { experienceBullet: 1.0, skillsListOnly: 0.8, default: 1.0 };

    if (!segmentation.hasReliableSections) {
      for (const canonical of allCandidateSkills.keys()) {
        candidateMap.set(canonical, evConfig.default);
      }
      return candidateMap;
    }

    const expSkills = extractSkillsFromText(segmentation.experienceText);
    const listSkills = extractSkillsFromText(segmentation.skillsText);

    for (const canonical of allCandidateSkills.keys()) {
      const inExp = expSkills.has(canonical);
      const inList = listSkills.has(canonical);

      if (inExp && inList) {
        candidateMap.set(canonical, Math.max(evConfig.experienceBullet, evConfig.skillsListOnly));
      } else if (inExp) {
        candidateMap.set(canonical, evConfig.experienceBullet);
      } else if (inList) {
        candidateMap.set(canonical, evConfig.skillsListOnly);
      } else {
        candidateMap.set(canonical, evConfig.default);
      }
    }

    return candidateMap;
  }

  // --- 4. FALLBACK PHRASE EXTRACTION FOR LOW CONFIDENCE ---
  const GENERIC_STOPWORDS = new Set([
    'experience', 'years', 'working', 'skills', 'ability', 'candidate', 'apply', 'degree',
    'responsibilities', 'requirements', 'looking', 'about', 'company', 'team', 'work', 'role',
    'strong', 'good', 'proven', 'excellent', 'must', 'have', 'with', 'hands-on', 'knowledge',
    'proficiency', 'familiarity', 'background', 'understanding', 'expertise', 'preferred'
  ]);

  function extractFallbackPhrases(text) {
    const phrases = new Set();
    const pattern = /(?:experience (?:with|in)|knowledge of|proficiency in|hands-on (?:with|in)|skills? in|familiarity with|background in|understanding of|expertise in)\s+([a-zA-Z0-9+#./\s-]{3,40}?)(?:[;,.\n]|\band\b|\bwith\b)/gi;
    let match;
    while ((match = pattern.exec(text || '')) !== null) {
      const phrase = match[1].trim().toLowerCase();
      const words = phrase.split(/\s+/).filter(w => !GENERIC_STOPWORDS.has(w));
      if (words.length > 0) {
        phrases.add(words.join(' '));
      }
    }
    return Array.from(phrases);
  }

  const MONTH_MAP = {
    jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
    jul: 6, aug: 7, sep: 8, sept: 8, oct: 9, nov: 10, dec: 11,
    january: 0, february: 1, march: 2, april: 3, june: 5,
    july: 6, august: 7, september: 8, october: 9, november: 10, december: 11
  };

  const ROLE_FAMILIES = {
    product: /\b(?:product\s+(?:manager|management|owner|intern|lead|head|vp|specialist)|\bpm\b|\bapm\b|\bgpm\b|associate\s+product\s+manager|group\s+product\s+manager|technical\s+product\s+manager|\btpm\b)\b/i,
    growth: /\b(?:growth|growth\s+hacker|growth\s+lead|growth\s+marketing|user\s+acquisition|growth\s+specialist|growth\s+manager)\b/i,
    strategy_bizops: /\b(?:strategy|bizops|business\s+operations|chief\s+of\s+staff|founder(?:'s|\s+office)|strategic\s+initiatives|corporate\s+strategy)\b/i,
    data_analytics: /\b(?:data\s+analyst|data\s+scientist|analytics|business\s+analyst|bi\s+analyst|business\s+intelligence|data\s+engineer|machine\s+learning|ml\s+engineer|deep\s+learning|ai\s+engineer)\b/i,
    engineering_swe: /\b(?:software\s+engineer(?:ing)?|software\s+developer|\bswe\b|\bsde\b|\bsde-?[123iIvV]+\b|frontend|back-?end|full-?stack|web\s+developer|tech\s+lead|engineering\s+lead|engineering\s+manager|\bem\b|architect)\b/i,
    sales: /\b(?:sales|account\s+executive|\bae\b|\bbdr\b|\bsdr\b|business\s+development|enterprise\s+sales|sales\s+manager|sales\s+director)\b/i,
    operations: /\b(?:operations|operations\s+manager|program\s+manager|project\s+manager|customer\s+success|customer\s+support|supply\s+chain|logistics)\b/i
  };

  function detectRoleFamily(text) {
    if (!text) return 'unknown';
    for (const [family, regex] of Object.entries(ROLE_FAMILIES)) {
      if (regex.test(text)) return family;
    }
    return 'unknown';
  }

  // --- 5. EXPERIENCE EXTRACTION ---
  function extractExperience(text, context) {
    if (!text || text.trim().length < 10) {
      return { years: 0, totalYears: 0, relevantYears: 0, label: 'Not specified', months: 0, roleFamilies: {} };
    }

    const config = (context && context.config) ? context.config : DEFAULT_CONFIG;
    const jdRoleFamily = (context && context.jdRoleFamily) ? context.jdRoleFamily : null;
    const clean = normalizeWhitespace(text);

    const refDate = (context && context.now) ? new Date(context.now) : new Date(2026, 8, 19);
    const defaultCurrentYear = !isNaN(refDate.getTime()) ? refDate.getFullYear() : 2026;
    const defaultCurrentMonth = !isNaN(refDate.getTime()) ? refDate.getMonth() : 8;
    const currentMaxKey = defaultCurrentYear * 12 + defaultCurrentMonth;

    let expSection = clean;
    const expMatch = clean.match(/\b(?:experience|work experience|employment history|professional experience)\b/i);
    if (expMatch) {
      const fromExp = clean.slice(expMatch.index + expMatch[0].length);
      const endMatch = fromExp.match(/\n\s*(?:##\s*|\*\*\s*)?(?:education|projects|technical skills|skills|certifications|publications|achievements)\b/i);
      expSection = endMatch ? fromExp.slice(0, endMatch.index) : fromExp;
    }

    const monthRegex = '(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t|tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)';
    const rangeRegex = new RegExp(
      '(?:(' + monthRegex + '|[0-9]{1,2})[\\/\'\\s.-]+)?\'?([12][0-9]{3}|[0-9]{2})\\s*(?:[-–—~]|to)\\s*(?:(present|current|now|till\\s+date|today)|(?:(' + monthRegex + '|[0-9]{1,2})[\\/\'\\s.-]+)?\'?([12][0-9]{3}|[0-9]{2}))',
      'gi'
    );

    const internshipWeight = (config.experience && config.experience.internshipWeight) || 0.5;
    const calendarMonths = new Map();
    const familyCounts = {};

    const lines = expSection.split(/\r?\n/);
    let currentRoleFamily = 'unknown';
    let currentIsInternship = false;

    for (let i = 0; i < lines.length; i++) {
      const rawLine = lines[i];
      const line = rawLine.trim();
      if (!line) continue;

      if (/\b(b\.?tech|m\.?tech|mba|bachelor|master|degree|university|college|cgpa|gpa)\b/i.test(line)) {
        continue;
      }

      const detectedFam = detectRoleFamily(line);
      if (detectedFam !== 'unknown') {
        currentRoleFamily = detectedFam;
        currentIsInternship = /\b(intern|internship|trainee|apprentice)\b/i.test(line);
      } else if (/\b(intern|internship|trainee|apprentice)\b/i.test(line)) {
        currentIsInternship = true;
      }

      let match;
      rangeRegex.lastIndex = 0;
      while ((match = rangeRegex.exec(line)) !== null) {
        let roleFam = currentRoleFamily;
        let isInt = currentIsInternship;

        if (roleFam === 'unknown' && i + 1 < lines.length) {
          const nextFam = detectRoleFamily(lines[i + 1]);
          if (nextFam !== 'unknown') roleFam = nextFam;
          if (/\b(intern|internship|trainee|apprentice)\b/i.test(lines[i + 1])) isInt = true;
        }

        const roleWeight = isInt ? internshipWeight : 1.0;

        let startMonth = 0;
        if (match[1]) {
          const mLower = match[1].toLowerCase();
          startMonth = (MONTH_MAP[mLower] !== undefined) ? MONTH_MAP[mLower] : Math.max(0, Math.min(11, parseInt(match[1], 10) - 1));
        }

        let startYear = parseInt(match[2], 10);
        if (startYear < 100) startYear += 2000;

        let endYear = defaultCurrentYear;
        let endMonth = defaultCurrentMonth;

        if (match[3]) {
          endYear = defaultCurrentYear;
          endMonth = defaultCurrentMonth;
        } else if (match[5]) {
          endYear = parseInt(match[5], 10);
          if (endYear < 100) endYear += 2000;

          if (match[4]) {
            const endMLower = match[4].toLowerCase();
            endMonth = (MONTH_MAP[endMLower] !== undefined) ? MONTH_MAP[endMLower] : Math.max(0, Math.min(11, parseInt(match[4], 10) - 1));
          } else {
            endMonth = 11;
          }
        }

        const startKey = startYear * 12 + startMonth;
        const endKey = Math.min(endYear * 12 + endMonth, currentMaxKey);

        if (startKey <= endKey && startYear >= 1990 && startKey <= currentMaxKey) {
          for (let k = startKey; k <= endKey; k++) {
            const existing = calendarMonths.get(k);
            if (!existing) {
              calendarMonths.set(k, { weight: roleWeight, roleFamily: roleFam });
            } else {
              if (roleWeight > existing.weight) {
                existing.weight = roleWeight;
              }
              if (existing.roleFamily === 'unknown' && roleFam !== 'unknown') {
                existing.roleFamily = roleFam;
              }
            }
          }
        }
      }
    }

    let totalWeightedMonths = 0;
    let relevantWeightedMonths = 0;
    const adjMatrix = (config.experience && config.experience.roleAdjacency) || DEFAULT_CONFIG.experience.roleAdjacency || {};

    for (const [, entry] of calendarMonths.entries()) {
      totalWeightedMonths += entry.weight;
      familyCounts[entry.roleFamily] = (familyCounts[entry.roleFamily] || 0) + (entry.weight / 12);

      if (!jdRoleFamily || jdRoleFamily === 'unknown' || entry.roleFamily === jdRoleFamily) {
        relevantWeightedMonths += entry.weight;
      } else {
        const familyAdj = adjMatrix[jdRoleFamily] || {};
        const mult = (typeof familyAdj[entry.roleFamily] === 'number') ? familyAdj[entry.roleFamily] : 0;
        relevantWeightedMonths += entry.weight * mult;
      }
    }

    let calculatedTotalYears = Math.round((totalWeightedMonths / 12) * 10) / 10;
    let calculatedRelevantYears = Math.round((relevantWeightedMonths / 12) * 10) / 10;

    // Check explicit regex fallback if date range was missing or sparse
    if (calculatedTotalYears === 0) {
      const explicitRegex = /(?:over|more than|around|approx(?:imately)?|\+)?\s*(\d+(?:\.\d+)?)\s*\+?\s*(?:years?|yrs?)(?:\s+of)?\s+(?:relevant\s+|work\s+|professional\s+)?(?:experience|exp|background|track record)/i;
      const explicitMatch = clean.slice(0, 1500).match(explicitRegex);
      if (explicitMatch && explicitMatch[1]) {
        const parsed = parseFloat(explicitMatch[1]);
        if (parsed > 0 && parsed <= 35) {
          calculatedTotalYears = parsed;
          calculatedRelevantYears = parsed;
        }
      }
    }

    for (const fam in familyCounts) {
      familyCounts[fam] = Math.round(familyCounts[fam] * 10) / 10;
    }

    return {
      years: calculatedRelevantYears,
      totalYears: calculatedTotalYears,
      relevantYears: calculatedRelevantYears,
      label: calculatedTotalYears > 0 ? ('~' + calculatedTotalYears + ' yrs') : 'Not detected',
      months: totalWeightedMonths,
      calendarMonthsCount: calendarMonths.size,
      roleFamilies: familyCounts
    };
  }

  // --- 6. LOCATION EXTRACTION WITH REGIONAL CLUSTERING ---
  function getCityRegion(cityName, config) {
    if (!cityName) return null;
    const lower = cityName.toLowerCase().trim();
    const regions = (config && config.location && config.location.regions) || (DEFAULT_CONFIG.location && DEFAULT_CONFIG.location.regions) || {};
    for (const [regionName, cityList] of Object.entries(regions)) {
      if (cityList.some(c => c.toLowerCase() === lower || lower.includes(c.toLowerCase()) || c.toLowerCase().includes(lower))) {
        return regionName;
      }
    }
    return null;
  }

  function extractCandidateLocation(text, config) {
    if (!text) return { city: 'Not specified', country: '', isRemote: false, region: null, label: 'Not specified' };

    const norm = normalizeWhitespace(text);
    const splitIndex = norm.search(/\b(education|experience|work history|projects|summary|skills)\b/i);
    const headerBlock = (splitIndex > 50 ? norm.slice(0, splitIndex) : norm.slice(0, 450));
    const cleanHeader = headerBlock.replace(/\b(iit|iim|nit|university|institute|college)\s+[a-z]+/gi, '');

    const cityMap = (CollegesData && CollegesData.CITY_MAP) ? CollegesData.CITY_MAP : [
      { regex: /\b(bengaluru|bangalore)\b/i, name: 'Bengaluru', country: 'India' },
      { regex: /\b(delhi|new delhi|ncr|gurugram|gurgaon|noida|greater noida|faridabad|ghaziabad)\b/i, name: 'Delhi NCR', country: 'India' },
      { regex: /\b(mumbai|navi mumbai|thane|bombay)\b/i, name: 'Mumbai', country: 'India' },
      { regex: /\b(hyderabad|secunderabad)\b/i, name: 'Hyderabad', country: 'India' },
      { regex: /\b(pune|pimpri-chinchwad)\b/i, name: 'Pune', country: 'India' },
      { regex: /\b(chennai|madras)\b/i, name: 'Chennai', country: 'India' },
      { regex: /\b(kolkata|calcutta)\b/i, name: 'Kolkata', country: 'India' },
      { regex: /\b(ahmedabad|gandhinagar)\b/i, name: 'Ahmedabad', country: 'India' },
      { regex: /\b(jaipur)\b/i, name: 'Jaipur', country: 'India' },
      { regex: /\b(chandigarh|mohali|panchkula)\b/i, name: 'Chandigarh', country: 'India' },
      { regex: /\b(kochi|cochin)\b/i, name: 'Kochi', country: 'India' },
      { regex: /\b(indore)\b/i, name: 'Indore', country: 'India' },
      { regex: /\b(san francisco|bay area|san jose|sunnyvale|palo alto)\b/i, name: 'San Francisco Bay Area', country: 'US' },
      { regex: /\b(new york|nyc|manhattan|brooklyn)\b/i, name: 'New York', country: 'US' },
      { regex: /\b(seattle|redmond)\b/i, name: 'Seattle', country: 'US' },
      { regex: /\b(austin)\b/i, name: 'Austin', country: 'US' },
      { regex: /\b(boston|cambridge)\b/i, name: 'Boston', country: 'US' },
      { regex: /\b(london)\b/i, name: 'London', country: 'UK' },
      { regex: /\b(singapore)\b/i, name: 'Singapore', country: 'Singapore' },
      { regex: /\b(dubai)\b/i, name: 'Dubai', country: 'UAE' }
    ];

    let earliestIndex = 999999;
    let foundCity = null;
    let foundCountry = null;

    for (const c of cityMap) {
      const match = cleanHeader.match(c.regex);
      if (match && match.index !== undefined && match.index < earliestIndex) {
        earliestIndex = match.index;
        foundCity = c.name;
        foundCountry = c.country;
      }
    }

    const isRemote = /\b(remote|work from anywhere|open to remote)\b/i.test(cleanHeader);
    const region = foundCity ? getCityRegion(foundCity, config) : null;
    let label = foundCity ? (foundCity + ', ' + foundCountry) : (isRemote ? 'Remote / Anywhere' : 'Not specified');

    return {
      city: foundCity || (isRemote ? 'Remote' : 'Not specified'),
      country: foundCountry || '',
      isRemote: isRemote,
      region: region,
      label: label
    };
  }

  // --- 7. EDUCATION & PEDIGREE EXTRACTION ---
  function extractCandidateEducation(text, config) {
    if (!text) return { degree: 'Not specified', tier: 'unknown', isTier1: false, isTier2: false, tierName: '', label: 'Not specified' };

    // 1. Prefer isolating the Education section
    const eduMatch = text.match(/\n?\s*(?:##+|\*\*|[0-9]+\.|\u2022|\-)?\s*\b(?:education|academic background|academics|qualifications)\b/i);
    let eduText = '';

    if (eduMatch) {
      const fromEdu = text.slice(eduMatch.index + eduMatch[0].length);
      const endMatch = fromEdu.match(/\n\s*(?:##+|\*\*|[0-9]+\.|\u2022|\-)?\s*(?:experience|work experience|employment history|projects|technical skills|skills|certifications|publications|achievements)\b/i);
      eduText = endMatch ? fromEdu.slice(0, endMatch.index) : fromEdu;
    } else {
      // 2. Fallback for heading-less resume: scan full resume excluding experience bullet lines
      const lines = text.split(/\r?\n/);
      const nonExpLines = lines.filter(l => !/^\s*(?:[•\-*]|[0-9]+\.)\s+(?:built|developed|led|managed|engineered|designed|shipped|created|spearheaded|architected|implemented|drove|worked|authored|analyzed|conducted|monitored)/i.test(l));
      eduText = nonExpLines.join('\n');
    }

    const norm = normalizeWhitespace(eduText).toLowerCase().replace(/\s+/g, ' ');

    // Best degree across text
    let degree = 'Bachelor\'s';
    if (/\b(ph\.?d|doctorate|doctor of philosophy)\b/i.test(norm)) {
      degree = 'PhD';
    } else if (/\b(m\.?b\.?a\.?|master of business administration|pgdm)\b/i.test(norm)) {
      degree = 'MBA';
    } else if (/\b(m\.?tech|m\.?e\.?|master of technology)\b/i.test(norm)) {
      degree = 'M.Tech';
    } else if (/\b(m\.?s\.?|master of science|m\.?sc)\b/i.test(norm)) {
      degree = 'MS';
    } else if (/\b(b\.?tech|b\.?e\.?|bachelor of technology|bachelor of engineering)\b/i.test(norm)) {
      degree = 'B.Tech';
    } else if (/\b(b\.?s\.?|bachelor of science|b\.?sc)\b/i.test(norm)) {
      degree = 'BS';
    } else if (/\b(bba|b\.?com|bachelor of commerce|bca)\b/i.test(norm)) {
      degree = 'BBA/B.Com';
    } else if (/\b(bachelor|degree)\b/i.test(norm)) {
      degree = 'Bachelor\'s';
    } else {
      degree = 'Graduate';
    }

    // Best tier across detected institutions in Education section
    const detectedTier = (CollegesData && CollegesData.detectCollegeTier) ? CollegesData.detectCollegeTier(norm) : 'unknown';
    const tier = detectedTier || 'unknown';
    const isTier1 = (tier === 'Tier 1');
    const isTier2 = (tier === 'Tier 2');
    const tierName = (tier === 'Tier 1') ? 'Tier-1' : (tier === 'Tier 2' ? 'Tier-2' : (tier === 'Tier 3' ? 'Tier-3' : ''));
    const label = (tier !== 'unknown') ? (degree + ' · ' + tier) : degree;

    return {
      degree: degree,
      tier: tier,
      isTier1: isTier1,
      isTier2: isTier2,
      tierName: tierName,
      label: label
    };
  }

  // --- 8. JD REQUIREMENTS EXTRACTION ---
  const NUMBER_WORDS = {
    zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5,
    six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
    fifteen: 15, twenty: 20
  };

  function parseNumberWord(word) {
    if (!word) return null;
    const w = word.toLowerCase().trim();
    if (NUMBER_WORDS[w] !== undefined) return NUMBER_WORDS[w];
    const n = parseFloat(w);
    return isNaN(n) ? null : n;
  }

  function extractJdRequirements(jdText, locationMeta, config) {
    const rawJd = normalizeWhitespace(jdText || '');
    const rawLoc = normalizeWhitespace(locationMeta || '');
    const combined = (rawLoc + '\n' + rawJd);

    // Blurb filter: remove marketing/company blurbs
    const filteredJd = rawJd.replace(/\b(?:over|with|founded|celebrating|more than)\s+\d+\s+(?:years?|yrs?)\s+(?:of\s+)?(?:experience|history|innovation|leadership|excellence|serving)\b/gi, ' ');

    // Prefer Requirements section for experience extraction
    let expSearchText = filteredJd;
    const reqMatch = filteredJd.match(/\n?\s*(?:##+|\*\*|[0-9]+\.|\u2022|\-)?\s*\b(?:requirements|qualifications|what you(?:'ll)? need|what we(?:'re)? looking for|minimum requirements)\b/i);
    if (reqMatch) {
      const fromReq = filteredJd.slice(reqMatch.index + reqMatch[0].length);
      const endReq = fromReq.match(/\n\s*(?:##+|\*\*|[0-9]+\.|\u2022|\-)?\s*(?:responsibilities|benefits|about us|perks|compensation)\b/i);
      const reqSection = endReq ? fromReq.slice(0, endReq.index) : fromReq;
      if (/\b(?:experience|exp|years?|yrs?)\b/i.test(reqSection)) {
        expSearchText = reqSection;
      }
    }

    let minExp = null;
    let maxExp = null;

    // Check for fresher / entry level phrases first
    const isFresher = /\b(?:fresher|freshers|entry[- ]level|new\s+grad|new\s+graduate|no\s+prior\s+experience|no\s+experience\s+required)\b/i.test(expSearchText);
    if (isFresher) {
      minExp = 0;
    }

    if (minExp === null) {
      const expRegex = /(?:minimum\s+(?:of\s+)?|at\s+least\s+)?(\d+(?:\.\d+)?)(?:\s*(?:-|to)\s*(\d+(?:\.\d+)?))?\s*\+?\s*(?:years?|yrs?)(?:\s+of)?\s+(?:relevant\s+|work\s+|professional\s+)?(?:experience|exp)/i;
      const expMatch = expSearchText.match(expRegex);
      if (expMatch && expMatch[1]) {
        minExp = parseFloat(expMatch[1]);
        if (expMatch[2]) maxExp = parseFloat(expMatch[2]);
      }
    }

    if (minExp === null) {
      const altMatch = expSearchText.match(/(?:experience|exp)\s*:\s*(\d+(?:\.\d+)?)(?:\s*(?:-|to)\s*(\d+(?:\.\d+)?))?\s*\+?\s*(?:years?|yrs?)/i);
      if (altMatch && altMatch[1]) {
        minExp = parseFloat(altMatch[1]);
        if (altMatch[2]) maxExp = parseFloat(altMatch[2]);
      }
    }

    if (minExp === null) {
      const rangeMatch = expSearchText.match(/\b(\d+(?:\.\d+)?)\s*(?:-|to)\s*(\d+(?:\.\d+)?)\s*(?:years?|yrs?)\b/i);
      if (rangeMatch && rangeMatch[1]) {
        minExp = parseFloat(rangeMatch[1]);
        maxExp = parseFloat(rangeMatch[2]);
      }
    }

    if (minExp === null) {
      const words = 'zero|one|two|three|four|five|six|seven|eight|nine|ten';
      const wordMatch = expSearchText.match(new RegExp('(?:minimum(?:\\s+of)?|at\\s+least)?\\s*(' + words + ')\\s*(?:-|to)?\\s*(' + words + ')?\\s*(?:years?|yrs?)\\s+(?:of)?\\s*(?:[a-zA-Z\\s]{0,35}?)?(?:experience|exp)', 'i'));
      if (wordMatch && wordMatch[1]) {
        minExp = parseNumberWord(wordMatch[1]);
        if (wordMatch[2]) maxExp = parseNumberWord(wordMatch[2]);
      }
    }

    if (minExp === null) {
      const anyExpMatch = expSearchText.match(/(\d+)\+?\s*(?:years?|yrs?)/i);
      if (anyExpMatch) {
        minExp = parseFloat(anyExpMatch[1]);
      } else {
        minExp = 0;
      }
    }

    let workMode = 'Flexible';
    if (/\b(remote|work from home|wfh|anywhere)\b/i.test(combined)) {
      workMode = 'Remote';
    } else if (/\b(hybrid)\b/i.test(combined)) {
      workMode = 'Hybrid';
    } else if (/\b(on-site|onsite|in-office)\b/i.test(combined)) {
      workMode = 'On-site';
    }

    // Extract all listed locations (multi-location support)
    const allKnownCities = [
      { regex: /\b(bengaluru|bangalore)\b/i, name: 'Bengaluru' },
      { regex: /\b(delhi|new delhi|ncr|gurugram|gurgaon|noida|greater noida|faridabad|ghaziabad)\b/i, name: 'Delhi NCR' },
      { regex: /\b(mumbai|navi mumbai|thane)\b/i, name: 'Mumbai' },
      { regex: /\b(hyderabad|secunderabad)\b/i, name: 'Hyderabad' },
      { regex: /\b(pune|pimpri-chinchwad)\b/i, name: 'Pune' },
      { regex: /\b(chennai|madras)\b/i, name: 'Chennai' },
      { regex: /\b(kolkata|calcutta)\b/i, name: 'Kolkata' },
      { regex: /\b(ahmedabad|gandhinagar)\b/i, name: 'Ahmedabad' },
      { regex: /\b(jaipur)\b/i, name: 'Jaipur' },
      { regex: /\b(chandigarh|mohali|panchkula)\b/i, name: 'Chandigarh' },
      { regex: /\b(kochi|cochin)\b/i, name: 'Kochi' },
      { regex: /\b(indore)\b/i, name: 'Indore' },
      { regex: /\b(san francisco|bay area|san jose|sunnyvale|palo alto)\b/i, name: 'San Francisco Bay Area' },
      { regex: /\b(new york|nyc)\b/i, name: 'New York' },
      { regex: /\b(seattle)\b/i, name: 'Seattle' },
      { regex: /\b(london)\b/i, name: 'London' },
      { regex: /\b(singapore)\b/i, name: 'Singapore' },
      { regex: /\b(dubai)\b/i, name: 'Dubai' }
    ];

    const jobCities = [];
    const jobRegions = [];

    // locationMeta first
    if (rawLoc) {
      for (const item of allKnownCities) {
        if (item.regex.test(rawLoc)) {
          if (!jobCities.includes(item.name)) jobCities.push(item.name);
          const r = getCityRegion(item.name, config);
          if (r && !jobRegions.includes(r)) jobRegions.push(r);
        }
      }
    }

    // Then search JD text for any additional locations
    for (const item of allKnownCities) {
      if (item.regex.test(filteredJd)) {
        if (!jobCities.includes(item.name)) jobCities.push(item.name);
        const r = getCityRegion(item.name, config);
        if (r && !jobRegions.includes(r)) jobRegions.push(r);
      }
    }

    let jobCity = jobCities.length > 0 ? jobCities[0] : null;

    const normJd = rawJd.toLowerCase();

    // Tier-1 Mandatory & Preferred checks
    const tierMandatory = /\b(?:only|strictly)\s+(?:candidates\s+|applicants\s+)?(?:from\s+)?(?:iits?|iims?|bits|nits?|tier\s*[- ]?1|premier)\b/i.test(normJd)
      || /\b(?:tier\s*[- ]?1|premier\s+institute|iits?|iims?|bits|nits?)[^.\n]*?\b(?:only|mandatory|required|must)\b/i.test(normJd)
      || /\b(?:must\s+be|mandatory)\s*:\s*(?:tier\s*[- ]?1|iits?|premier)\b/i.test(normJd);

    const tierPreferredPattern = /\b(?:tier\s*[- ]?1|top\s*[- ]?tier|premier)\s+(?:(?:engineering\s+|b-?school\s+|management\s+)?(?:colleges?|institutes?|universities|graduates?|alumni|campus)\s+)?(?:is\s+)?(?:preferred|desired|plus|a plus)\b/i;
    const iitPreferredPattern = /\b(?:iit|iim|bits|nit)\s+(?:is\s+)?(?:preferred|desired|plus|a plus)\b/i;
    const tierPreferred = !tierMandatory && (tierPreferredPattern.test(normJd) || iitPreferredPattern.test(normJd));

    const phdReq = /\b(?:ph\.?d|doctorate)\s+(?:is\s+)?(?:mandatory|required|must have)\b/i.test(normJd);
    const mbaMandatory = /\b(?:mba|pgdm)\s+(?:is\s+)?(?:mandatory|required|must have)\b/i.test(normJd);
    const mbaPref = !mbaMandatory && /\b(?:mba|pgdm)\s+(?:is\s+)?(?:preferred|plus|a plus|desired)\b/i.test(normJd);
    const btechMandatory = /\b(?:b\.?tech|b\.?e\.?|bachelor\s+of\s+engineering|bachelor\s+of\s+technology)\s*(?:degree\s*)?(?:is\s+)?(?:mandatory|required|must\s+have)\b/i.test(normJd);

    let degreeMandatory = phdReq || mbaMandatory || btechMandatory;
    let degreeReq = phdReq ? 'PhD' : (mbaMandatory ? 'MBA' : (btechMandatory ? 'B.Tech' : null));

    const roleFamily = detectRoleFamily(combined);

    return {
      minExp: minExp,
      maxExp: maxExp,
      workMode: workMode,
      jobCity: jobCity,
      jobCities: jobCities,
      jobRegions: jobRegions,
      region: getCityRegion(jobCity, config),
      tierMandatory: tierMandatory,
      tierPreferred: tierPreferred,
      degreeMandatory: degreeMandatory,
      degreeReq: degreeReq,
      mbaPreferred: mbaPref,
      isFresher: isFresher,
      roleFamily: roleFamily
    };
  }

  // --- 9. EVALUATE ---
  function evaluate(resumeText, jdText, context = {}) {
    const config = context.config || DEFAULT_CONFIG;
    const locationMeta = context.locationMeta || '';
    const jobTitle = context.jobTitle || '';

    if (!resumeText || resumeText.trim().length < 20) {
      return {
        status: 'no_resume',
        score: 0,
        tier: 'Resume Needed',
        badge: '⚙️',
        color: '#8b949e',
        matchedSkills: [],
        missingSkills: [],
        disqualifiers: [],
        message: 'Click extension icon to save your resume and unlock instant Skill Match.'
      };
    }

    const jdSkillsMap = extractJdSkillsWithWeights(jdText, config);
    const candSkillsMap = extractCandidateSkillsWithEvidence(resumeText, config);

    const matched = [];
    const missing = [];
    let weightedMatched = 0;
    let weightedTotal = 0;

    for (const [canonical, entry] of jdSkillsMap.entries()) {
      weightedTotal += entry.weight;
      if (candSkillsMap.has(canonical)) {
        matched.push(canonical);
        const evidence = candSkillsMap.get(canonical);
        weightedMatched += (entry.weight * evidence);
      } else {
        missing.push(canonical);
      }
    }

    // Determine confidence
    const jdSkillCount = jdSkillsMap.size;
    let confidence = 'high';
    let lowConfidence = false;

    if (jdSkillCount >= config.confidenceThresholds.highCount) {
      confidence = 'high';
    } else if (jdSkillCount >= config.confidenceThresholds.mediumCount) {
      confidence = 'medium';
    } else {
      confidence = 'low';
      lowConfidence = true;
    }

    let skillScore = 50;
    if (weightedTotal > 0) {
      skillScore = Math.round((weightedMatched / weightedTotal) * 100);
    } else {
      const jdPhrases = extractFallbackPhrases(jdText);
      const resPhrases = extractFallbackPhrases(resumeText);
      if (jdPhrases.length > 0) {
        let phraseMatches = 0;
        jdPhrases.forEach(p => {
          if (resPhrases.some(rp => rp.includes(p) || p.includes(rp))) {
            phraseMatches++;
            matched.push(p);
          } else {
            missing.push(p);
          }
        });
        skillScore = Math.round((phraseMatches / jdPhrases.length) * 100);
      } else {
        skillScore = 50;
      }
    }

    const jdReq = extractJdRequirements(jdText, locationMeta, config);
    const expContext = Object.assign({}, context, { jdRoleFamily: jdReq.roleFamily, config: config });
    const candExp = extractExperience(resumeText, expContext);
    const candEdu = extractCandidateEducation(resumeText, config);
    const candLoc = extractCandidateLocation(resumeText, config);

    let penalties = 0;
    let bonuses = 0;
    const disqualifiers = [];

    // FACTOR A: WORK EXPERIENCE
    if (jdReq.minExp !== null && jdReq.minExp > 0) {
      const expYears = (candExp.relevantYears !== undefined) ? candExp.relevantYears : candExp.years;
      if (expYears < jdReq.minExp) {
        const gap = Math.round((jdReq.minExp - expYears) * 10) / 10;
        if (gap >= 2) {
          penalties += config.penalties.experienceGapLarge;
        } else if (gap >= 1) {
          penalties += config.penalties.experienceGapMedium;
        } else {
          penalties += config.penalties.experienceGapSmall;
        }
        disqualifiers.push(config.disqualifierMessages.workExperience);
      } else {
        // Candidate meets or exceeds minExp!
        const overqualifiedThreshold = (config.experience && config.experience.overqualifiedYearsThreshold) || 3.0;
        const isOverqualified = jdReq.maxExp !== null && (expYears > (jdReq.maxExp + overqualifiedThreshold));

        if (isOverqualified) {
          penalties += (config.penalties.overqualified || 4);
          // Overqualified: soft penalty, NO bonus, NO red disqualifier!
        } else {
          bonuses += config.bonuses.experienceMeetsRequirement;
        }
      }
    }

    // Role Profile Disqualifier
    if (config.flags && config.flags.enableRoleProfileDisqualifier) {
      const totalYears = (candExp.totalYears !== undefined) ? candExp.totalYears : candExp.years;
      const fresherExemption = (config.experience && config.experience.fresherExemptionYears) || 1.0;
      if (totalYears > fresherExemption && jdReq.minExp > 0) {
        const jdFamily = jdReq.roleFamily;
        if (jdFamily && jdFamily !== 'unknown') {
          const candidateFamilies = candExp.roleFamilies || {};
          const yearsInOtherFamilies = Object.entries(candidateFamilies)
            .filter(([fam, yrs]) => fam !== jdFamily && fam !== 'unknown')
            .reduce((acc, [, yrs]) => acc + yrs, 0);

          const yearsInJdFamily = candidateFamilies[jdFamily] || 0;
          const yearsInUnknown = candidateFamilies['unknown'] || 0;
          const relevantExp = (candExp.relevantYears !== undefined) ? candExp.relevantYears : candExp.years;

          // "unknown" family never counts as zero (it does not trigger role-mismatch knockout)
          if (yearsInOtherFamilies >= 1.0 && yearsInJdFamily === 0 && relevantExp === 0 && yearsInUnknown === 0) {
            disqualifiers.push(config.disqualifierMessages.roleProfile);
            const expIdx = disqualifiers.indexOf(config.disqualifierMessages.workExperience);
            if (expIdx !== -1) {
              disqualifiers.splice(expIdx, 1);
            }
          }
        }
      }
    }

    // FACTOR B: COLLEGE TIER & PEDIGREE
    if (jdReq.tierMandatory) {
      if (candEdu.tier === 'Tier 1') {
        bonuses += config.bonuses.collegeTierMandatoryTier1;
      } else if (candEdu.tier === 'Tier 2') {
        penalties += config.penalties.collegeTierMandatoryTier2;
        disqualifiers.push(config.disqualifierMessages.college);
      } else if (candEdu.tier === 'Tier 3') {
        penalties += config.penalties.collegeTierMandatoryTier3;
        disqualifiers.push(config.disqualifierMessages.college);
      } else {
        // 'unknown': 0 penalty, no disqualifier
      }
    } else if (jdReq.tierPreferred) {
      if (candEdu.tier === 'Tier 1') {
        bonuses += config.bonuses.collegeTierPreferredTier1;
      } else if (candEdu.tier === 'Tier 2') {
        bonuses += config.bonuses.collegeTierPreferredTier2;
      } else if (candEdu.tier === 'Tier 3') {
        penalties += config.penalties.collegeTierPreferredTier3;
      }
    }

    // Degree check
    if (jdReq.degreeMandatory) {
      if (jdReq.degreeReq === 'PhD' && candEdu.degree !== 'PhD') {
        penalties += config.penalties.degreePhdMandatory;
        disqualifiers.push(config.disqualifierMessages.degree);
      } else if (jdReq.degreeReq === 'MBA' && candEdu.degree !== 'MBA') {
        penalties += config.penalties.degreeMbaMandatory;
        disqualifiers.push(config.disqualifierMessages.degree);
      } else if (jdReq.degreeReq === 'B.Tech' && !/\b(B\.Tech|M\.Tech|BE|ME)\b/i.test(candEdu.degree)) {
        penalties += config.penalties.degreeMismatch || 15;
        disqualifiers.push(config.disqualifierMessages.degree);
      }
    } else if (jdReq.mbaPreferred && candEdu.degree === 'MBA') {
      bonuses += config.bonuses.degreeMbaPreferred;
    }

    // FACTOR C: LOCATION
    if (jdReq.workMode === 'Remote') {
      // Remote is neutral: 0 penalty, 0 bonus, no disqualifier
    } else if (candLoc.city && candLoc.city !== 'Not specified' && !candLoc.isRemote) {
      const candRegion = candLoc.region || getCityRegion(candLoc.city, config);

      // Support multi-location matching: match if candidate matches ANY listed job city or region
      const listedCities = jdReq.jobCities || (jdReq.jobCity ? [jdReq.jobCity] : []);
      const listedRegions = jdReq.jobRegions || (jdReq.region ? [jdReq.region] : []);

      const isSameCity = listedCities.some(jc => jc.toLowerCase() === candLoc.city.toLowerCase());
      const isSameRegion = candRegion && listedRegions.includes(candRegion);

      if (isSameCity || isSameRegion) {
        bonuses += config.bonuses.locationMatch;
      } else {
        if (jdReq.workMode === 'On-site') {
          penalties += config.penalties.locationMismatch;
          disqualifiers.push(config.disqualifierMessages.location);
        }
      }
    }

    let finalScore = Math.round(skillScore - penalties + bonuses);
    finalScore = Math.max(config.bounds.min, Math.min(config.bounds.max, finalScore));

    let tier = config.tiers.goodMatch.name;
    let badge = config.tiers.goodMatch.badge;
    let color = config.tiers.goodMatch.color;

    if (disqualifiers.length >= config.thresholds.reachRoleMaxDisqualifiers || finalScore < config.thresholds.reachRoleScoreCutoff) {
      tier = config.tiers.reachRole.name;
      badge = config.tiers.reachRole.badge;
      color = config.tiers.reachRole.color;
    } else if (disqualifiers.length === 1 || (finalScore >= config.thresholds.reachRoleScoreCutoff && finalScore < config.thresholds.moderateRoleScoreCutoff)) {
      tier = config.tiers.moderateMatch.name;
      badge = config.tiers.moderateMatch.badge;
      color = config.tiers.moderateMatch.color;
    } else if (finalScore >= config.thresholds.strongMatchScoreCutoff) {
      tier = config.tiers.strongMatch.name;
      badge = config.tiers.strongMatch.badge;
      color = config.tiers.strongMatch.color;
    }

    return {
      status: 'ready',
      score: finalScore,
      tier: tier,
      badge: badge,
      color: color,
      matchedSkills: matched.slice(0, 6),
      missingSkills: missing.slice(0, 5),
      disqualifiers: disqualifiers,
      candExp: candExp,
      candEdu: candEdu,
      jdReq: jdReq,
      totalJdSkills: jdSkillCount,
      confidence: confidence,
      lowConfidence: lowConfidence,
      skillScore: skillScore,
      weightedMatched: weightedMatched,
      weightedTotal: weightedTotal
    };
  }

  function evaluateMultiFactor(resumeText, jdText, locationMeta, jobTitle) {
    return evaluate(resumeText, jdText, {
      locationMeta: locationMeta,
      jobTitle: jobTitle
    });
  }

  function calculateMatch(resumeText, jdText, locationMeta, jobTitle) {
    return evaluate(resumeText, jdText, {
      locationMeta: locationMeta,
      jobTitle: jobTitle
    });
  }

  const api = {
    extractSkills: extractSkills,
    extractSkillsFromText: extractSkillsFromText,
    extractJdSkillsWithWeights: extractJdSkillsWithWeights,
    extractCandidateSkillsWithEvidence: extractCandidateSkillsWithEvidence,
    parseJdSections: parseJdSections,
    segmentResume: segmentResume,
    extractExperience: extractExperience,
    extractCandidateLocation: extractCandidateLocation,
    extractCandidateEducation: extractCandidateEducation,
    extractEducation: extractCandidateEducation,
    extractJdRequirements: extractJdRequirements,
    detectRoleFamily: detectRoleFamily,
    evaluate: evaluate,
    evaluateMultiFactor: evaluateMultiFactor,
    calculateMatch: calculateMatch
  };

  if (typeof window !== 'undefined') {
    window.PrepInterview = window.PrepInterview || {};
    window.PrepInterview.Matcher = api;
    window.PrepInterviewMatcher = api;
  }
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})();
