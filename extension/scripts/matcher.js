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
    growth: /\b(?:growth|growth\s+hacker|growth\s+lead|growth\s+specialist|growth\s+manager)\b/i,
    strategy_bizops: /\b(?:strategy|bizops|business\s+operations|chief\s+of\s+staff|founder(?:'s|\s+office)|strategic\s+initiatives|corporate\s+strategy)\b/i,
    data_analytics: /\b(?:data\s+analyst|data\s+scientist|analytics|business\s+analyst|bi\s+analyst|business\s+intelligence|data\s+engineer|machine\s+learning|ml\s+engineer|deep\s+learning|ai\s+engineer)\b/i,
    engineering_swe: /\b(?:software\s+engineer(?:ing)?|software\s+developer|\bswe\b|\bsde\b|\bsde-?[123iIvV]+\b|frontend|back-?end|full-?stack|web\s+developer|tech\s+lead|engineering\s+lead|engineering\s+manager|\bem\b|architect|devops|cloud\s+infrastructure)\b/i,
    sales: /\b(?:sales|account\s+executive|\bae\b|\bbdr\b|\bsdr\b|business\s+development|enterprise\s+sales|sales\s+manager|sales\s+director)\b/i,
    customer_success: /\b(?:customer\s+success|\bcsm\b|client\s+success|customer\s+support|account\s+management|client\s+servicing)\b/i,
    hr_recruiting: /\b(?:hr|human\s+resources|recruiter|recruiting|talent\s+acquisition|people\s+ops|people\s+operations|hrbp)\b/i,
    finance: /\b(?:finance|financial\s+analyst|investment\s+banking|accounting|accountant|fp&a|financial\s+controller|audit|auditor)\b/i,
    marketing: /\b(?:marketing|brand\s+manager|content\s+marketing|digital\s+marketing|seo|sem|social\s+media|growth\s+marketing|performance\s+marketing|product\s+marketing|\bpmm\b)\b/i,
    design: /\b(?:product\s+designer|ui[\/-]?ux|ux\s+designer|ui\s+designer|user\s+experience|interaction\s+designer|graphic\s+designer|visual\s+designer)\b/i,
    operations: /\b(?:operations|operations\s+manager|program\s+manager|project\s+manager|supply\s+chain|logistics)\b/i
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

    let hasExpHeading = false;
    let expSection = clean;
    const expMatch = clean.match(/\n\s*(?:##+|\*\*|[0-9]+\.|\u2022|\-)?\s*\b(?:experience|work experience|employment history|professional experience)\b/i)
      || clean.match(/\b(?:experience|work experience|employment history|professional experience)\b/i);
    if (expMatch) {
      hasExpHeading = true;
      const fromExp = clean.slice(expMatch.index + expMatch[0].length);
      const endMatch = fromExp.match(/\n\s*(?:##\s*|\*\*\s*)?(?:education|academic background|projects|technical skills|skills|certifications|publications|achievements)\b/i);
      expSection = endMatch ? fromExp.slice(0, endMatch.index) : fromExp;
    }

    const monthRegex = '(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t|tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)';
    const rangeRegex = new RegExp(
      '(?:(' + monthRegex + '|[0-9]{1,2})[\\/\'\\s.-]+)?\'?([12][0-9]{3}|[0-9]{2})\\s*(?:[-–—~]|to)\\s*(?:(present|current|now|till\\s+date|today)|(?:(' + monthRegex + '|[0-9]{1,2})[\\/\'\\s.-]+)?\'?([12][0-9]{3}|[0-9]{2}))',
      'gi'
    );

    const degreeKeywordsRegex = /\b(b\.?tech|m\.?tech|mba|bachelor|master|degree|university|college|ph\.?d|institute|school|academics|cgpa|gpa|diploma|b\.?e|b\.?s|m\.?s|bba|bca|b\.?com)\b/i;
    const nonExpHeadingRegex = /^\s*(?:##+|\*\*|[0-9]+\.|\u2022|\-)?\s*\b(?:education|academic background|projects|certifications|publications|achievements|skills|technical skills)\b/i;
    const resumeExpHeadingRegex = /^\s*(?:##+|\*\*|[0-9]+\.|\u2022|\-)?\s*\b(?:experience|work experience|employment history|professional experience)\b/i;

    const internshipWeight = (config.experience && config.experience.internshipWeight) || 0.5;
    const calendarMonths = new Map();
    const familyCounts = {};

    const lines = (hasExpHeading ? expSection : clean).split(/\r?\n/);
    let currentRoleFamily = 'unknown';
    let currentIsInternship = false;
    let inNonExpBlock = false;

    for (let i = 0; i < lines.length; i++) {
      const rawLine = lines[i];
      const line = rawLine.trim();
      if (!line) continue;

      if (!hasExpHeading) {
        if (nonExpHeadingRegex.test(line)) {
          inNonExpBlock = true;
          continue;
        }
        if (resumeExpHeadingRegex.test(line)) {
          inNonExpBlock = false;
          continue;
        }
        if (inNonExpBlock) {
          continue;
        }
        // With no Experience heading, skip ranges within 3 lines of a degree keyword
        let nearDegree = false;
        for (let j = Math.max(0, i - 3); j <= Math.min(lines.length - 1, i + 3); j++) {
          if (degreeKeywordsRegex.test(lines[j])) {
            nearDegree = true;
            break;
          }
        }
        if (nearDegree) {
          continue;
        }
      }

      if (degreeKeywordsRegex.test(line)) {
        continue;
      }

      // Check if line has only dates
      rangeRegex.lastIndex = 0;
      const hasDateMatch = rangeRegex.test(line);
      rangeRegex.lastIndex = 0;

      if (hasDateMatch) {
        const withoutDates = line.replace(new RegExp(rangeRegex.source, 'gi'), '').replace(/[\s•\-\*|~,().]/g, '');
        if (withoutDates.length === 0) {
          // Line has only dates: look at previous 2 lines
          const prev1 = (i >= 1) ? lines[i - 1].trim() : '';
          const prev2 = (i >= 2) ? lines[i - 2].trim() : '';
          if (degreeKeywordsRegex.test(prev1) || degreeKeywordsRegex.test(prev2)) {
            // Skip education dates!
            continue;
          }

          const prevTitle = prev1 + ' ' + prev2;
          const famFromPrev = detectRoleFamily(prevTitle);
          if (famFromPrev !== 'unknown') {
            currentRoleFamily = famFromPrev;
            currentIsInternship = /\b(intern|internship|trainee|apprentice)\b/i.test(prevTitle);
          } else if (/\b(intern|internship|trainee|apprentice)\b/i.test(prevTitle)) {
            currentIsInternship = true;
          }
        }
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
        const matchedSnippet = match[0];
        const afterMatch = line.slice(match.index + matchedSnippet.length, match.index + matchedSnippet.length + 4);
        if (afterMatch.includes('%') || afterMatch.includes('$')) {
          continue;
        }
        const beforeMatch = line.slice(Math.max(0, match.index - 2), match.index);
        if (beforeMatch.includes('$') || beforeMatch.includes('€') || beforeMatch.includes('£') || beforeMatch.includes('₹') || beforeMatch.includes('%')) {
          continue;
        }

        const hasStartMonth = Boolean(match[1]);
        const hasEndMonth = Boolean(match[4]);
        const startRaw = match[2];
        const endRaw = match[5];
        const isBareTwoDigitStart = !hasStartMonth && startRaw && startRaw.length === 2 && !matchedSnippet.startsWith("'");
        const isBareTwoDigitEnd = !hasEndMonth && endRaw && endRaw.length === 2 && !matchedSnippet.includes("'" + endRaw);
        if (isBareTwoDigitStart && isBareTwoDigitEnd) {
          continue;
        }

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
  const PROFESSIONAL_DEGREES = ['MD', 'MBBS', 'BDS', 'BAMS', 'BHMS', 'LLB', 'LLM', 'CA', 'CMA', 'CS', 'B.Arch', 'B.Pharm'];

  const DEGREE_RANKS = {
    'PhD': 3,
    'Doctorate': 3,
    'Master\'s': 2,
    'MBA': 2,
    'PGDM': 2,
    'M.Tech': 2,
    'MS': 2,
    'ME': 2,
    'LLM': 2,
    'Bachelor\'s': 1,
    'B.Tech': 1,
    'BS': 1,
    'BE': 1,
    'BBA': 1,
    'B.Com': 1,
    'BBA/B.Com': 1,
    'BCA': 1,
    'B.Des': 1,
    'Graduate': 1,
    'Diploma': 0
  };

  function getDegreeLadderRank(degree) {
    if (!degree) return 0;
    if (DEGREE_RANKS[degree] !== undefined) return DEGREE_RANKS[degree];
    const d = degree.toLowerCase();
    if (d.includes('phd') || d.includes('doctor')) return 3;
    if (d.includes('master') || d.includes('mba') || d.includes('pgdm') || d.includes('m.tech') || d.includes('ms') || d.includes('me') || d.includes('llm')) return 2;
    if (d.includes('bachelor') || d.includes('b.tech') || d.includes('bs') || d.includes('be') || d.includes('graduate') || d.includes('bba') || d.includes('b.com') || d.includes('bca') || d.includes('b.des')) return 1;
    return 0;
  }

  function extractCandidateEducation(text, config) {
    if (!text) return { degree: 'Not specified', degreesHeld: [], tier: 'unknown', isTier1: false, isTier2: false, tierName: '', label: 'Not specified' };

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

    const degreesHeld = [];

    // Case-sensitive short checks on original eduText
    if (/\b(?:M\.D\.|MD)\b/.test(eduText)) degreesHeld.push('MD');
    if (/\bMBBS\b/i.test(eduText)) degreesHeld.push('MBBS');
    if (/\bBDS\b/i.test(eduText)) degreesHeld.push('BDS');
    if (/\bBAMS\b/i.test(eduText)) degreesHeld.push('BAMS');
    if (/\bBHMS\b/i.test(eduText)) degreesHeld.push('BHMS');
    if (/\b(?:LL\.?B\.?|bachelor of laws?)\b/i.test(eduText)) degreesHeld.push('LLB');
    const candIsAi = /\b(?:large\s+language|model|models|ai|genai|artificial\s+intelligence|machine\s+learning|nlp)\b/i.test(eduText);
    if (!candIsAi && (/\b(?:master\s+of\s+laws?|LL\.M\.|L\.L\.M\.)\b/i.test(eduText) || (/\bLLM\b/.test(eduText) && /\b(?:law|legal|ll\.?b|bar|juris)\b/i.test(eduText)))) degreesHeld.push('LLM');
    if (/\b(?:chartered accountant|C\.?A\.)\b/i.test(eduText) || /\bCA\b/.test(eduText)) degreesHeld.push('CA');
    if (/\b(?:cost and management accountant|C\.?M\.?A\.|CMA)\b/i.test(eduText)) degreesHeld.push('CMA');
    if (/\bcompany secretary\b/i.test(eduText) || (/\bCS\b/.test(eduText) && !/\bcomputer science\b/i.test(eduText))) degreesHeld.push('CS');
    if (/\b(?:b\.?arch|bachelor of architecture)\b/i.test(eduText)) degreesHeld.push('B.Arch');
    if (/\b(?:b\.?pharm|bachelor of pharmacy)\b/i.test(eduText)) degreesHeld.push('B.Pharm');
    if (/\b(?:b\.?des|bachelor of design)\b/i.test(eduText)) degreesHeld.push('B.Des');

    if (/\b(ph\.?d|doctorate|doctor of philosophy)\b/i.test(eduText)) degreesHeld.push('PhD');
    if (/\b(m\.?b\.?a\.?|master of business administration|pgdm)\b/i.test(eduText)) degreesHeld.push('MBA');
    if (/\b(m\.?tech|master of technology)\b/i.test(eduText) || /\b(?:M\.E\.|ME)\b/.test(eduText)) degreesHeld.push('M.Tech');
    if (/\b(m\.?s\.?|master of science|m\.?sc)\b/i.test(eduText) || /\b(?:M\.S\.|MS)\b/.test(eduText)) degreesHeld.push('MS');
    if (/\b(b\.?tech|bachelor of technology|bachelor of engineering)\b/i.test(eduText) || /\b(?:B\.E\.|BE)\b/.test(eduText)) degreesHeld.push('B.Tech');
    if (/\b(b\.?s\.?|bachelor of science|b\.?sc)\b/i.test(eduText) || /\b(?:B\.S\.|BS)\b/.test(eduText)) degreesHeld.push('BS');
    if (/\b(bba|b\.?com|bachelor of commerce|bca)\b/i.test(eduText)) degreesHeld.push('BBA/B.Com');
    if (/\b(bachelor|degree)\b/i.test(eduText) && !degreesHeld.some(d => d.startsWith('B.') || d === 'BS' || d === 'Bachelor\'s')) degreesHeld.push('Bachelor\'s');

    // Primary degree: pick highest degree
    let degree = 'Bachelor\'s';
    if (degreesHeld.includes('PhD')) degree = 'PhD';
    else if (degreesHeld.includes('MD')) degree = 'MD';
    else if (degreesHeld.includes('MBBS')) degree = 'MBBS';
    else if (degreesHeld.includes('MBA')) degree = 'MBA';
    else if (degreesHeld.includes('M.Tech')) degree = 'M.Tech';
    else if (degreesHeld.includes('MS')) degree = 'MS';
    else if (degreesHeld.includes('LLM')) degree = 'LLM';
    else if (degreesHeld.includes('B.Tech')) degree = 'B.Tech';
    else if (degreesHeld.includes("Bachelor's") || degreesHeld.includes('BS')) degree = "Bachelor's";
    else if (degreesHeld.includes('LLB')) degree = 'LLB';
    else if (degreesHeld.includes('CA')) degree = 'CA';
    else if (degreesHeld.includes('B.Arch')) degree = 'B.Arch';
    else if (degreesHeld.includes('B.Pharm')) degree = 'B.Pharm';
    else if (degreesHeld.includes('B.Des')) degree = 'B.Des';
    else if (degreesHeld.includes('BBA/B.Com')) degree = 'BBA/B.Com';
    else degree = 'Bachelor\'s';

    // Best tier across detected institutions in Education section
    const detectedTier = (CollegesData && CollegesData.detectCollegeTier) ? CollegesData.detectCollegeTier(eduText) : 'unknown';
    const tier = detectedTier || 'unknown';
    const isTier1 = (tier === 'Tier 1');
    const isTier2 = (tier === 'Tier 2');
    const tierName = (tier === 'Tier 1') ? 'Tier-1' : (tier === 'Tier 2' ? 'Tier-2' : (tier === 'Tier 3' ? 'Tier-3' : ''));
    const label = (tier !== 'unknown') ? (degree + ' · ' + tier) : degree;

    return {
      degree: degree,
      degreesHeld: degreesHeld,
      tier: tier,
      isTier1: isTier1,
      isTier2: isTier2,
      tierName: tierName,
      label: label
    };
  }

  // --- 8. GENERAL MANDATORY-COLLEGE DETECTOR ---
  function isCollegeMandatory(text) {
    if (!text) return false;
    const lines = text.split(/\r?\n/);
    for (const line of lines) {
      const l = line.trim().toLowerCase();
      if (!l) continue;
      if (/\b(?:preferred|a\s+plus|bonus|nice\s+to\s+have|good\s+to\s+have|not\s+mandatory|not\s+required|not\s+strictly|optional)\b/i.test(l)) {
        continue;
      }
      const hasCollege = /\b(?:tier\s*[- ]?1|premier\s+(?:engineering\s+|management\s+)?(?:colleges?|institutes?|institutions?|universit(?:y|ies))|top[- ]tier|iits?|iims?|bits(?:\s+pilani)?|nits?)\b/i.test(l);
      if (!hasCollege) continue;

      const hasMandatoryPrefix = /\b(?:strictly|only|exclusively|mandatory)\s+(?:candidates?\s+|applicants?\s+|graduates?\s+|alumni\s+|hiring\s+)*(?:from\s+)?(?:tier\s*[- ]?1|premier|top[- ]tier|iits?|iims?|bits|nits?)/i.test(l);
      const hasMandatoryPostfix = /(?:tier\s*[- ]?1|premier|top[- ]tier|iits?|iims?|bits|nits?)[^.\n]*?\b(?:only|strictly|mandatory|required|exclusively)\b/i.test(l);
      const hasMustBeFrom = /\b(?:must\s+be\s+from|must\s+have\s+graduated\s+from|graduates?\s+of)\s+[^.\n]*?(?:tier\s*[- ]?1|premier|top[- ]tier|iits?|iims?|bits|nits?)/i.test(l);
      const hasDegreeRequired = /(?:tier\s*[- ]?1|premier|iits?|iims?|bits|nits?)\s+(?:degree|pedigree|background)\s+(?:is\s+)?(?:required|mandatory)/i.test(l);

      if (hasMandatoryPrefix || hasMandatoryPostfix || hasMustBeFrom || hasDegreeRequired) {
        return true;
      }
    }
    return false;
  }

  // --- 9. JD REQUIREMENTS EXTRACTION ---
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

  function extractJdExperienceRequirement(rawJd) {
    if (!rawJd || typeof rawJd !== 'string') {
      return { minExp: null, maxExp: null, isFresher: false };
    }

    // 1. Blurb filter: drop "over/with/more than N years" only in company sentences (we/our/founded/celebrating/serving/heritage).
    // Keep "Candidates with 3 years of experience" and "Over 5 years of experience required" as requirements.
    const companyMarker = /\b(?:we(?:\s+are|'re|\s+have)?|our|us|company|firm|founded|celebrating|serving|heritage|history|excellence|leadership|legacy)\b/i;
    const blurbPhrasePattern = /\b(?:over|with|more\s+than)\s+\d+\s+(?:years?|yrs?)\b/i;

    const rawLines = rawJd.split(/\r?\n/);
    const cleanedLines = rawLines.map(line => {
      if (blurbPhrasePattern.test(line) && companyMarker.test(line)) {
        return line.replace(/\b(?:celebrating|serving|founded(?:\s+with)?|our\s+company\s+has|we\s+have)?\s*(?:over|with|more\s+than)\s+\d+\s+(?:years?|yrs?)(?:\s+of)?(?:\s+[a-zA-Z\s]{0,25}?)?(?:excellence|history|leadership|experience|serving|service|heritage)?\b/gi, ' ');
      }
      return line;
    });

    // 2. Headings and lines processing
    // Search whole JD, never a narrowed section. Use requirement headings only to rank matches. Ignore preferred/plus lines.
    const reqHeadingRegex = /^\s*(?:##+|\*\*|[0-9]+\.|\u2022|\-)?\s*\b(?:requirements|must[- ]haves|required\s+skills|qualifications|who\s+you\s+are|what\s+we(?:'re|\s+are)?\s+looking\s+for|minimum\s+requirements|basic\s+qualifications)\b/i;
    const exitHeadingRegex = /^\s*(?:##+|\*\*|[0-9]+\.|\u2022|\-)?\s*\b(?:responsibilities|what\s+you(?:'ll|\s+will)?\s+do|benefits|perks|compensation|about\s+us|about\s+the\s+company)\b/i;
    const preferredLineRegex = /\b(?:preferred|good\s+to\s+have|nice\s+to\s+have|plus|a\s+plus|optional|not\s+mandatory|not\s+required)\b/i;

    let inReqSection = false;
    const matches = [];

    // Range separators: -, –, —, ~, "to"
    const sep = '(?:[-–—~]|\\bto\\b)';

    const rangeRegex = new RegExp(
      '\\b(\\d+(?:\\.\\d+)?)\\s*' + sep + '\\s*(\\d+(?:\\.\\d+)?)\\s*(?:years?|yrs?)(?:\\s*\'s?|\\s+of)?(?:\\s+[a-zA-Z0-9+#./-]+){0,8}?(?:\\s+(?:experience|exp)\\b|\\s+(?:in|as|of)\\b)?',
      'i'
    );

    const plusRegex = new RegExp(
      '\\b(\\d+(?:\\.\\d+)?)\\s*\\+\\s*(?:years?|yrs?)(?:\\s*\'s?|\\s+of)?(?:\\s+[a-zA-Z0-9+#./-]+){0,8}?(?:\\s+(?:experience|exp)\\b|\\s+(?:in|as|of)\\b)?',
      'i'
    );

    const atLeastRegex = new RegExp(
      '(?:at\\s+least|minimum(?:\\s+of)?|over)\\s+(\\d+(?:\\.\\d+)?)(?:\\s*' + sep + '\\s*(\\d+(?:\\.\\d+)?))?\\s*\\+?\\s*(?:years?|yrs?)(?:\\s*\'s?|\\s+of)?(?:\\s+[a-zA-Z0-9+#./-]+){0,8}?(?:\\s+(?:experience|exp)\\b|\\s+(?:in|as|of)\\b)?',
      'i'
    );

    const orMoreRegex = new RegExp(
      '\\b(\\d+(?:\\.\\d+)?)\\s*(?:or\\s+more|and\\s+above)\\s*(?:years?|yrs?)(?:\\s*\'s?|\\s+of)?(?:\\s+[a-zA-Z0-9+#./-]+){0,8}?(?:\\s+(?:experience|exp)\\b|\\s+(?:in|as|of)\\b)?',
      'i'
    );

    const colonRegex = new RegExp(
      '\\b(?:experience|exp)\\s*:\\s*(\\d+(?:\\.\\d+)?)(?:\\s*' + sep + '\\s*(\\d+(?:\\.\\d+)?))?\\s*\\+?\\s*(?:years?|yrs?)?',
      'i'
    );

    const generalExpRegex = new RegExp(
      '\\b(\\d+(?:\\.\\d+)?)\\s*(?:years?|yrs?)(?:\\s*\'s?|\\s+of)?(?:\\s+[a-zA-Z0-9+#./-]+){0,8}?\\s+(?:experience|exp)\\b',
      'i'
    );

    for (let i = 0; i < cleanedLines.length; i++) {
      const line = cleanedLines[i];
      let workingLine = line.trim();
      if (!workingLine) continue;

      if (reqHeadingRegex.test(workingLine)) {
        inReqSection = true;
        continue;
      }
      if (exitHeadingRegex.test(workingLine)) {
        inReqSection = false;
        continue;
      }

      if (preferredLineRegex.test(workingLine)) {
        continue;
      }

      // 1. Colon check
      let m = colonRegex.exec(workingLine);
      if (m && m[1]) {
        matches.push({ min: parseFloat(m[1]), max: m[2] ? parseFloat(m[2]) : null, inReq: inReqSection });
        workingLine = workingLine.replace(m[0], ' ');
      }

      // 2. Range check (e.g. 2-4 years, 3–6 years of experience)
      m = rangeRegex.exec(workingLine);
      if (m && m[1] && m[2]) {
        matches.push({ min: parseFloat(m[1]), max: parseFloat(m[2]), inReq: inReqSection });
        workingLine = workingLine.replace(m[0], ' ');
      }

      // 3. At least / minimum / over
      m = atLeastRegex.exec(workingLine);
      if (m && m[1]) {
        matches.push({ min: parseFloat(m[1]), max: m[2] ? parseFloat(m[2]) : null, inReq: inReqSection });
        workingLine = workingLine.replace(m[0], ' ');
      }

      // 4. Plus (e.g. 2+ years)
      m = plusRegex.exec(workingLine);
      if (m && m[1]) {
        matches.push({ min: parseFloat(m[1]), max: null, inReq: inReqSection });
        workingLine = workingLine.replace(m[0], ' ');
      }

      // 5. Or more
      m = orMoreRegex.exec(workingLine);
      if (m && m[1]) {
        matches.push({ min: parseFloat(m[1]), max: null, inReq: inReqSection });
        workingLine = workingLine.replace(m[0], ' ');
      }

      // 6. General (e.g. Candidates with 3 years of experience)
      m = generalExpRegex.exec(workingLine);
      if (m && m[1]) {
        matches.push({ min: parseFloat(m[1]), max: null, inReq: inReqSection });
        workingLine = workingLine.replace(m[0], ' ');
      }
    }

    const reqMatches = matches.filter(m => m.inReq);
    const pool = reqMatches.length > 0 ? reqMatches : matches;

    if (pool.length > 0) {
      let best = pool[0];
      for (let i = 1; i < pool.length; i++) {
        if (pool[i].min > best.min) {
          best = pool[i];
        }
      }
      return {
        minExp: best.min,
        maxExp: best.max,
        isFresher: false
      };
    }

    // 3. Fresher check ONLY when NO numeric years are found
    let isFresher = false;
    const fullCleanedJd = cleanedLines.join('\n');
    const sentences = fullCleanedJd.split(/(?<=[.!?\n])/);

    for (const sent of sentences) {
      const s = sent.trim();
      if (!s) continue;
      if (preferredLineRegex.test(s)) continue;

      if (/\b(?:freshers?(?:\s+(?:welcome|can\s+apply))?|entry[- ]level|new\s+grads?|new\s+graduates?)\b/i.test(s)) {
        isFresher = true;
        break;
      }

      if (/\bno\s+(?:prior\s+|previous\s+)?(?:work\s+|professional\s+)?experience\s+(?:is\s+)?(?:required|needed|necessary|mandatory)\b/i.test(s)) {
        if (!/\bexperience\s+(?:with|in|using)\b/i.test(s)) {
          isFresher = true;
          break;
        }
      }
    }

    if (isFresher) {
      return { minExp: 0, maxExp: null, isFresher: true };
    }

    return { minExp: null, maxExp: null, isFresher: false };
  }

  function parseJdEducationSentence(sentence) {
    if (!sentence || typeof sentence !== 'string') return null;

    // Case-sensitive short checks on original sentence
    const hasBE = /\b(?:B\.E\.|BE)\b/.test(sentence);
    const hasME = /\b(?:M\.E\.|ME)\b/.test(sentence);
    const hasMS = /\b(?:M\.S\.|MS)\b/.test(sentence);
    const hasBS = /\b(?:B\.S\.|BS)\b/.test(sentence);
    const hasMD = /\b(?:M\.D\.|MD)\b/.test(sentence);
    const hasCA = /\b(?:C\.A\.|CA)\b/.test(sentence);
    const hasCS = /\b(?:C\.S\.|CS)\b/.test(sentence) && !/\bcomputer\s+science\b/i.test(sentence);

    const hasPhD = /\b(?:ph\.?d|phd|doctorate|doctor\s+of\s+philosophy)\b/i.test(sentence);
    const hasMBA = /\b(?:mba|m\.?b\.?a\.?|pgdm|master\s+of\s+business\s+administration)\b/i.test(sentence);
    const hasMTech = /\b(?:m\.?tech|master\s+of\s+technology)\b/i.test(sentence) || hasME;
    const hasMasters = /\b(?:master'?s(?:\s+degree)?|master\s+of\s+science|m\.?sc)\b/i.test(sentence) || hasMS;

    const hasBTech = /\b(?:b\.?tech|bachelor\s+of\s+technology|bachelor\s+of\s+engineering)\b/i.test(sentence) || hasBE;
    const hasBachelors = /\b(?:bachelor'?s(?:\s+degree)?|undergraduate|bba|b\.?com|bca)\b/i.test(sentence) || hasBS;
    const hasGraduate = /\b(?:graduation|graduate\s+degree)\b/i.test(sentence);

    const hasMBBS = /\bMBBS\b/i.test(sentence);
    const hasBDS = /\bBDS\b/i.test(sentence);
    const hasBAMS = /\bBAMS\b/i.test(sentence);
    const hasBHMS = /\bBHMS\b/i.test(sentence);
    const hasLLB = /\b(?:LL\.?B\.?|bachelor\s+of\s+laws?|law\s+degree)\b/i.test(sentence);
    const isAiContext = /\b(?:large\s+language|model|models|ai|genai|artificial\s+intelligence|machine\s+learning|nlp|prompt|prompts|prompting|fine[- ]tuning|rag|companies|tools|technologies|frameworks|pipeline|agents?)\b/i.test(sentence);
    const hasLLM = !isAiContext && (
      /\b(?:master\s+of\s+laws?|LL\.M\.|L\.L\.M\.)\b/i.test(sentence) ||
      (/\bLLM\b/.test(sentence) && /\b(?:law|legal|ll\.?b|bar\s+admission|juris|advocate|counsel)\b/i.test(sentence))
    );
    const hasChartered = /\bchartered\s+accountant\b/i.test(sentence) || hasCA;
    const hasCMA = /\b(?:cost\s+and\s+management\s+accountant|C\.?M\.?A\.|CMA)\b/i.test(sentence);
    const hasCompSec = /\bcompany\s+secretary\b/i.test(sentence) || /\b(?:CA\s*[/,&]\s*CS|CS\s*[/,&]\s*CA)\b/i.test(sentence);
    const hasBArch = /\b(?:b\.?arch|bachelor\s+of\s+architecture)\b/i.test(sentence);
    const hasBPharm = /\b(?:b\.?pharm|bachelor\s+of\s+pharmacy)\b/i.test(sentence);
    const hasBDes = /\b(?:b\.?des|bachelor\s+of\s+design)\b/i.test(sentence);

    const degrees = [];
    if (hasPhD) degrees.push('PhD');
    if (hasMBA) degrees.push('MBA');
    if (hasMTech) degrees.push('M.Tech');
    if (hasMasters && !hasMBA && !hasMTech) degrees.push("Master's");
    if (hasMD) degrees.push('MD');
    if (hasMBBS) degrees.push('MBBS');
    if (hasBDS) degrees.push('BDS');
    if (hasBAMS) degrees.push('BAMS');
    if (hasBHMS) degrees.push('BHMS');
    if (hasLLB) degrees.push('LLB');
    if (hasLLM) degrees.push('LLM');
    if (hasChartered) degrees.push('CA');
    if (hasCMA) degrees.push('CMA');
    if (hasCompSec) degrees.push('CS');
    if (hasBArch) degrees.push('B.Arch');
    if (hasBPharm) degrees.push('B.Pharm');
    if (hasBDes) degrees.push('B.Des');
    if (hasBTech) degrees.push('B.Tech');
    if (hasBachelors && !degrees.includes('B.Tech')) degrees.push("Bachelor's");
    if (hasGraduate && degrees.length === 0) degrees.push("Bachelor's");

    if (degrees.length === 0) return null;

    // Cues
    const hasEqExp = /\bor\s+(?:equivalent|relevant)\s+(?:professional\s+|work\s+)?experience\b/i.test(sentence);
    const hasPreferredCue = /\b(?:preferred|plus|a\s+plus|desired|advantage|ideally|preferably|might\s+look\s+for|good\s+to\s+have|nice\s+to\s+have)\b/i.test(sentence);
    const hasMandatoryCue = /\b(?:required|must(?:\s+have)?|mandatory|minimum|at\s+least)\b/i.test(sentence);
    const orHigher = /\b(?:or\s+(?:higher|above|more|equivalent\s+degree))\b/i.test(sentence);

    let mandatory = false;
    if (hasEqExp || hasPreferredCue) {
      mandatory = false;
    } else if (hasMandatoryCue) {
      mandatory = true;
    } else {
      mandatory = true;
    }

    let level = degrees[0];
    if (degrees.includes('MD') && degrees.includes('MBBS')) {
      level = 'MD/MBBS';
    } else if (degrees.includes('B.Tech') && degrees.includes('M.Tech')) {
      level = 'B.Tech/M.Tech';
    }

    return {
      level: level,
      degrees: degrees,
      mandatory: mandatory,
      orHigher: orHigher,
      sentence: sentence.trim()
    };
  }

  function extractAllJdEducationRequirements(jdText) {
    if (!jdText || typeof jdText !== 'string') return [];
    const lines = jdText.split(/\r?\n/);
    const list = [];
    for (const line of lines) {
      const trimmedLine = line.trim();
      if (!trimmedLine) continue;
      if (/\bsee how you compare\b/i.test(trimmedLine) || /\b\d+\s+applicants\b/i.test(trimmedLine) || /\btop schools:\b/i.test(trimmedLine)) {
        continue;
      }
      const sentences = trimmedLine.split(/(?<=[a-z0-9][.!?])\s+(?=[A-Z])/);
      for (const sent of sentences) {
        const parsed = parseJdEducationSentence(sent);
        if (parsed) {
          list.push(parsed);
        }
      }
    }
    return list;
  }

  function extractJdEducationRequirement(jdText) {
    const list = extractAllJdEducationRequirements(jdText);
    if (list.length === 0) {
      return {
        level: null,
        degrees: [],
        mandatory: false,
        sentence: null,
        orHigher: false
      };
    }
    const mandatoryReq = list.find(r => r.mandatory);
    return mandatoryReq || list[0];
  }

  function candidateMeetsRequirement(candEdu, req) {
    if (!req || !req.degrees || req.degrees.length === 0) return true;

    const candRank = getDegreeLadderRank(candEdu.degree);

    for (const deg of req.degrees) {
      if (PROFESSIONAL_DEGREES.includes(deg)) {
        if (candEdu.degree === deg || (Array.isArray(candEdu.degreesHeld) && candEdu.degreesHeld.includes(deg))) {
          return true;
        }
      } else {
        const degRank = getDegreeLadderRank(deg);
        if (req.orHigher) {
          if (candRank >= degRank) return true;
        }
        if (deg === 'PhD') {
          if (candEdu.degree === 'PhD' || (Array.isArray(candEdu.degreesHeld) && candEdu.degreesHeld.includes('PhD'))) return true;
        } else if (deg === 'MBA' || deg === 'PGDM') {
          if (candRank >= 2 && (candEdu.degree === 'MBA' || candEdu.degree === 'PGDM' || (Array.isArray(candEdu.degreesHeld) && (candEdu.degreesHeld.includes('MBA') || candEdu.degreesHeld.includes('PGDM'))))) return true;
        } else if (deg === 'B.Tech') {
          if (candEdu.degree === 'B.Tech' || candEdu.degree === 'M.Tech' || (Array.isArray(candEdu.degreesHeld) && (candEdu.degreesHeld.includes('B.Tech') || candEdu.degreesHeld.includes('M.Tech')))) return true;
        } else if (deg === "Master's" || deg === 'M.Tech' || deg === 'MS') {
          if (candRank >= 2) return true;
        } else if (deg === "Bachelor's" || deg === 'Graduate') {
          if (candRank >= 1) return true;
        }
      }
    }

    return false;
  }

  function extractJdRequirements(jdText, locationMeta, config) {
    const rawJd = normalizeWhitespace(jdText || '');
    const rawLoc = normalizeWhitespace(locationMeta || '');
    const combined = (rawLoc + '\n' + rawJd);

    const expResult = extractJdExperienceRequirement(rawJd);
    const minExp = expResult.minExp;
    const maxExp = expResult.maxExp;
    const isFresher = expResult.isFresher;

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
      if (item.regex.test(rawJd)) {
        if (!jobCities.includes(item.name)) jobCities.push(item.name);
        const r = getCityRegion(item.name, config);
        if (r && !jobRegions.includes(r)) jobRegions.push(r);
      }
    }

    let jobCity = jobCities.length > 0 ? jobCities[0] : null;

    const normJd = rawJd.toLowerCase();

    // Tier-1 Mandatory & Preferred checks
    const tierMandatory = isCollegeMandatory(rawJd);

    const tierPreferredPattern = /\b(?:tier\s*[- ]?1|top\s*[- ]?tier|premier)\s+(?:(?:engineering\s+|b-?school\s+|management\s+)?(?:colleges?|institutes?|universities|graduates?|alumni|campus)\s+)?(?:is\s+)?(?:preferred|desired|plus|a plus)\b/i;
    const iitPreferredPattern = /\b(?:iit|iim|bits|nit)\s+(?:is\s+)?(?:preferred|desired|plus|a plus)\b/i;
    const tierPreferred = !tierMandatory && (tierPreferredPattern.test(normJd) || iitPreferredPattern.test(normJd));

    const eduReqs = extractAllJdEducationRequirements(rawJd);
    const mandatoryEdu = eduReqs.find(r => r.mandatory);
    const preferredEdu = eduReqs.find(r => !r.mandatory);

    const degreeMandatory = Boolean(mandatoryEdu);
    const degreeReq = mandatoryEdu ? mandatoryEdu.level : null;
    const mbaPref = !degreeMandatory && Boolean(preferredEdu && preferredEdu.level === 'MBA');

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
        preClampScore: 0,
        breakdown: [],
        tier: 'Resume Needed',
        badge: '⚙️',
        color: '#8b949e',
        matchedSkills: [],
        missingSkills: [],
        disqualifiers: [],
        experience: { status: 'not_stated', jdMin: null, jdMax: null, candidateYears: 0 },
        education: { status: 'not_stated', required: { level: null, mandatory: false, sentence: null }, candidate: { degree: 'Not specified', tier: 'unknown' } },
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
    const breakdown = [];
    const notes = [];
    let hardGaps = [];
    let softGaps = [];

    // FACTOR A: WORK EXPERIENCE
    if (jdReq.minExp !== null && jdReq.minExp > 0) {
      const hasDomain = Boolean(jdReq.roleFamily && jdReq.roleFamily !== 'unknown');
      const expYears = hasDomain
        ? ((candExp.relevantYears !== undefined) ? candExp.relevantYears : candExp.years)
        : ((candExp.totalYears !== undefined) ? candExp.totalYears : candExp.years);

      if (expYears < jdReq.minExp) {
        const gap = Math.round((jdReq.minExp - expYears) * 10) / 10;
        if (gap <= 0.5) {
          const pen = (config.penalties.experienceGapTolerance !== undefined) ? config.penalties.experienceGapTolerance : 3;
          penalties += pen;
          breakdown.push({ label: 'Experience Shortfall (<= 0.5 yr tolerance)', points: -pen });
          notes.push('Slightly below the stated minimum');
          softGaps.push('Experience shortfall under 1 year');
          // No red disqualifier!
        } else {
          if (gap >= 2) {
            penalties += config.penalties.experienceGapLarge;
            breakdown.push({ label: 'Experience Gap (>= 2 yrs)', points: -config.penalties.experienceGapLarge });
            hardGaps.push('Experience shortfall >= 1 year');
          } else if (gap >= 1) {
            penalties += config.penalties.experienceGapMedium;
            breakdown.push({ label: 'Experience Gap (>= 1 yr)', points: -config.penalties.experienceGapMedium });
            hardGaps.push('Experience shortfall >= 1 year');
          } else {
            penalties += config.penalties.experienceGapSmall;
            breakdown.push({ label: 'Experience Gap (< 1 yr)', points: -config.penalties.experienceGapSmall });
            softGaps.push('Experience shortfall under 1 year');
          }
          disqualifiers.push(config.disqualifierMessages.workExperience);
        }
      } else {
        // Candidate meets or exceeds minExp!
        const overqualifiedThreshold = (config.experience && config.experience.overqualifiedYearsThreshold) || 3.0;
        const isOverqualified = jdReq.maxExp !== null && (expYears > (jdReq.maxExp + overqualifiedThreshold));

        if (isOverqualified) {
          const oqPen = (config.penalties.overqualified !== undefined) ? config.penalties.overqualified : 4;
          penalties += oqPen;
          breakdown.push({ label: 'Overqualified Penalty', points: -oqPen });
          notes.push((config.experience && config.experience.overqualifiedNote) || 'May be junior for you');
        } else {
          bonuses += config.bonuses.experienceMeetsRequirement;
          breakdown.push({ label: 'Experience Meets Requirement', points: config.bonuses.experienceMeetsRequirement });
        }
      }
    }

    // Role Profile Disqualifier
    if (config.flags && config.flags.enableRoleProfileDisqualifier) {
      const totalYears = (candExp.totalYears !== undefined) ? candExp.totalYears : candExp.years;
      const fresherExemption = (config.experience && config.experience.fresherExemptionYears) || 1.0;
      const isEntryLevel = jdReq.isFresher || (jdReq.minExp !== null && jdReq.minExp === 0);

      if (totalYears >= fresherExemption && !isEntryLevel) {
        const jdFamily = jdReq.roleFamily;
        if (jdFamily && jdFamily !== 'unknown') {
          const adjMatrix = (config.experience && config.experience.roleAdjacency) || DEFAULT_CONFIG.experience.roleAdjacency || {};
          const jdAdj = adjMatrix[jdFamily] || {};
          let maxCredit = 0;
          const candidateFamilies = candExp.roleFamilies || {};
          const candFams = Object.keys(candidateFamilies).filter(f => (candidateFamilies[f] || 0) > 0);

          if (candFams.length === 0) {
            maxCredit = 0.5;
          } else {
            for (const fam of candFams) {
              let c = 0;
              if (fam === jdFamily) {
                c = 1.0;
              } else if (fam === 'unknown') {
                c = (typeof jdAdj['unknown'] === 'number') ? jdAdj['unknown'] : 0.5;
              } else if (typeof jdAdj[fam] === 'number') {
                c = jdAdj[fam];
              } else {
                c = 0.0;
              }
              if (c > maxCredit) maxCredit = c;
            }
          }

          const threshold = (config.thresholds && config.thresholds.roleMismatchCreditThreshold !== undefined)
            ? config.thresholds.roleMismatchCreditThreshold
            : 0.25;

          if (maxCredit <= threshold) {
            disqualifiers.push(config.disqualifierMessages.roleProfile);
            hardGaps.push('Role profile not matching');

            // Suppress experience gap for the same cause
            const expIdx = disqualifiers.indexOf(config.disqualifierMessages.workExperience);
            if (expIdx !== -1) {
              disqualifiers.splice(expIdx, 1);
            }
            hardGaps = hardGaps.filter(g => !g.toLowerCase().includes('experience'));
            softGaps = softGaps.filter(g => !g.toLowerCase().includes('experience'));
          }
        }
      }
    }

    // FACTOR B: COLLEGE TIER & PEDIGREE
    if (jdReq.tierMandatory) {
      if (candEdu.tier === 'Tier 1') {
        bonuses += config.bonuses.collegeTierMandatoryTier1;
        breakdown.push({ label: 'College Tier 1 Mandatory Bonus', points: config.bonuses.collegeTierMandatoryTier1 });
      } else if (candEdu.tier === 'Tier 2') {
        penalties += config.penalties.collegeTierMandatoryTier2;
        breakdown.push({ label: 'College Tier 2 Mandatory Penalty', points: -config.penalties.collegeTierMandatoryTier2 });
        disqualifiers.push(config.disqualifierMessages.college);
        hardGaps.push('Mandatory college mismatch');
      } else if (candEdu.tier === 'Tier 3') {
        penalties += config.penalties.collegeTierMandatoryTier3;
        breakdown.push({ label: 'College Tier 3 Mandatory Penalty', points: -config.penalties.collegeTierMandatoryTier3 });
        disqualifiers.push(config.disqualifierMessages.college);
        hardGaps.push('Mandatory college mismatch');
      } else {
        // 'unknown': 0 penalty, no disqualifier
      }
    } else if (jdReq.tierPreferred) {
      if (candEdu.tier === 'Tier 1') {
        bonuses += config.bonuses.collegeTierPreferredTier1;
        breakdown.push({ label: 'College Tier 1 Preferred Bonus', points: config.bonuses.collegeTierPreferredTier1 });
      } else if (candEdu.tier === 'Tier 2') {
        bonuses += config.bonuses.collegeTierPreferredTier2;
        breakdown.push({ label: 'College Tier 2 Preferred Bonus', points: config.bonuses.collegeTierPreferredTier2 });
      } else if (candEdu.tier === 'Tier 3') {
        penalties += config.penalties.collegeTierPreferredTier3;
        breakdown.push({ label: 'College Tier 3 Preferred Penalty', points: -config.penalties.collegeTierPreferredTier3 });
      }
    }

    // FACTOR B2: DEGREE EVALUATION & SCORING
    const jdEduList = extractAllJdEducationRequirements(jdText);
    let eduStatus = 'not_stated';
    let eduReqObj = { level: null, mandatory: false, sentence: null };

    if (jdEduList.length === 0) {
      eduStatus = 'not_stated';
      eduReqObj = { level: null, mandatory: false, sentence: null };
    } else {
      const mandatoryReqs = jdEduList.filter(r => r.mandatory);
      const preferredReqs = jdEduList.filter(r => !r.mandatory);

      let failedMandatory = null;
      for (const mReq of mandatoryReqs) {
        if (!candidateMeetsRequirement(candEdu, mReq)) {
          failedMandatory = mReq;
          break;
        }
      }

      if (failedMandatory) {
        eduStatus = 'not_met';
        eduReqObj = {
          level: failedMandatory.level,
          mandatory: true,
          sentence: failedMandatory.sentence
        };
      } else if (preferredReqs.length > 0) {
        let missingPref = null;
        let metPref = null;
        for (const pReq of preferredReqs) {
          if (candidateMeetsRequirement(candEdu, pReq)) {
            metPref = pReq;
          } else {
            missingPref = pReq;
            break;
          }
        }

        if (missingPref) {
          eduStatus = 'preferred_missing';
          eduReqObj = {
            level: missingPref.level,
            mandatory: false,
            sentence: missingPref.sentence
          };
        } else if (metPref) {
          eduStatus = 'met';
          eduReqObj = {
            level: metPref.level,
            mandatory: false,
            sentence: metPref.sentence
          };
        } else {
          eduStatus = 'met';
          eduReqObj = {
            level: mandatoryReqs[0].level,
            mandatory: true,
            sentence: mandatoryReqs[0].sentence
          };
        }
      } else {
        eduStatus = 'met';
        eduReqObj = {
          level: mandatoryReqs[0].level,
          mandatory: true,
          sentence: mandatoryReqs[0].sentence
        };
      }
    }

    const educationObj = {
      status: eduStatus,
      required: eduReqObj,
      candidate: {
        degree: candEdu.degree,
        tier: candEdu.tier
      }
    };

    if (educationObj.status === 'not_met') {
      const reqLevel = educationObj.required.level;
      if (reqLevel === 'PhD') {
        penalties += config.penalties.degreePhdMandatory;
        breakdown.push({ label: 'PhD Mandatory Penalty', points: -config.penalties.degreePhdMandatory });
      } else if (reqLevel === 'MBA') {
        penalties += config.penalties.degreeMbaMandatory;
        breakdown.push({ label: 'MBA Mandatory Penalty', points: -config.penalties.degreeMbaMandatory });
      } else if (reqLevel === 'B.Tech') {
        const bTechPen = config.penalties.degreeMismatch || 15;
        penalties += bTechPen;
        breakdown.push({ label: 'B.Tech Mandatory Penalty', points: -bTechPen });
      } else {
        const genPen = config.penalties.degreeMismatch || 15;
        penalties += genPen;
        breakdown.push({ label: `${reqLevel} Mandatory Penalty`, points: -genPen });
      }
      disqualifiers.push(config.disqualifierMessages.degree);
      hardGaps.push('Mandatory degree mismatch');
    } else if (educationObj.status === 'preferred_missing') {
      notes.push(`${educationObj.required.level} preferred`);
    } else if (educationObj.status === 'met') {
      if (!educationObj.required.mandatory && educationObj.required.level === 'MBA') {
        bonuses += config.bonuses.degreeMbaPreferred;
        breakdown.push({ label: 'MBA Preferred Bonus', points: config.bonuses.degreeMbaPreferred });
      }
    }

    // FACTOR C: LOCATION
    const openToRelocation = Boolean(context && context.openToRelocation);
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
        breakdown.push({ label: 'Location Match Bonus', points: config.bonuses.locationMatch });
      } else if (openToRelocation) {
        notes.push('Open to relocation');
        softGaps.push('Relocation needed');
      } else {
        if (jdReq.workMode === 'On-site') {
          penalties += config.penalties.locationMismatch;
          breakdown.push({ label: 'On-site Location Mismatch Penalty', points: -config.penalties.locationMismatch });
          disqualifiers.push(config.disqualifierMessages.location);
          softGaps.push('On-site location mismatch');
        } else if (jdReq.workMode === 'Hybrid') {
          notes.push((config.location && config.location.hybridSoftNote) || 'Relocation needed');
          softGaps.push('Hybrid relocation');
        }
      }
    }

    let preScore = Math.round(skillScore - penalties + bonuses);
    const caps = config.caps || { softGapsOnly: 79, oneHardGap: 71, twoOrMoreHardGaps: 44 };
    let maxAllowed = (config.bounds && config.bounds.max) || 98;

    if (hardGaps.length >= 2) {
      maxAllowed = caps.twoOrMoreHardGaps;
    } else if (hardGaps.length === 1) {
      maxAllowed = caps.oneHardGap;
    } else if (softGaps.length > 0) {
      maxAllowed = caps.softGapsOnly;
    }

    if (preScore > maxAllowed) {
      const capDelta = maxAllowed - preScore;
      breakdown.push({ label: 'Capped: unmet requirement', points: capDelta });
      preScore = maxAllowed;
    }

    const preClampScore = preScore;
    const finalScore = Math.max(config.bounds.min, Math.min(config.bounds.max, preClampScore));

    // Tier is derived solely from finalScore
    let tier, badge, color;
    if (finalScore >= (config.thresholds.strongMatchScoreCutoff || 80)) {
      tier = config.tiers.strongMatch.name;
      badge = config.tiers.strongMatch.badge;
      color = config.tiers.strongMatch.color;
    } else if (finalScore >= (config.thresholds.goodMatchScoreCutoff || config.thresholds.moderateRoleScoreCutoff || 72)) {
      tier = config.tiers.goodMatch.name;
      badge = config.tiers.goodMatch.badge;
      color = config.tiers.goodMatch.color;
    } else if (finalScore >= (config.thresholds.reachRoleScoreCutoff || 45)) {
      tier = config.tiers.moderateMatch.name;
      badge = config.tiers.moderateMatch.badge;
      color = config.tiers.moderateMatch.color;
    } else {
      tier = config.tiers.reachRole.name;
      badge = config.tiers.reachRole.badge;
      color = config.tiers.reachRole.color;
    }

    const candYearsValue = (candExp.years !== undefined) ? candExp.years : (candExp.totalYears || 0);
    let expChipStatus = 'not_stated';
    if (jdReq.minExp === null || (jdReq.minExp === 0 && !jdReq.isFresher)) {
      expChipStatus = 'not_stated';
    } else if (jdReq.isFresher) {
      expChipStatus = 'met';
    } else if (typeof jdReq.minExp === 'number' && jdReq.minExp > 0) {
      expChipStatus = (candYearsValue >= (jdReq.minExp - 0.5)) ? 'met' : 'not_met';
    }

    const experienceObj = {
      status: expChipStatus,
      jdMin: jdReq.minExp,
      jdMax: jdReq.maxExp,
      candidateYears: candYearsValue
    };

    return {
      status: 'ready',
      score: finalScore,
      preClampScore: preClampScore,
      breakdown: breakdown,
      notes: notes,
      hardGaps: hardGaps,
      softGaps: softGaps,
      tier: tier,
      badge: badge,
      color: color,
      matchedSkills: matched.slice(0, 6),
      missingSkills: missing.slice(0, 5),
      disqualifiers: disqualifiers,
      candExp: candExp,
      candEdu: candEdu,
      jdReq: jdReq,
      experience: experienceObj,
      education: educationObj,
      totalJdSkills: jdSkillCount,
      confidence: confidence,
      lowConfidence: lowConfidence,
      skillScore: skillScore,
      weightedMatched: weightedMatched,
      weightedTotal: weightedTotal
    };
  }

  function evaluateMultiFactor(resumeText, jdText, locationMeta, jobTitle, extraContext = {}) {
    return evaluate(resumeText, jdText, Object.assign({
      locationMeta: locationMeta,
      jobTitle: jobTitle
    }, extraContext));
  }

  function calculateMatch(resumeText, jdText, locationMeta, jobTitle, extraContext = {}) {
    return evaluate(resumeText, jdText, Object.assign({
      locationMeta: locationMeta,
      jobTitle: jobTitle
    }, extraContext));
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
    isCollegeMandatory: isCollegeMandatory,
    extractJdRequirements: extractJdRequirements,
    extractJdEducationRequirement: extractJdEducationRequirement,
    candidateMeetsRequirement: candidateMeetsRequirement,
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
