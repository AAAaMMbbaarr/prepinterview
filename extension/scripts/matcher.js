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

  // --- 5. EXPERIENCE EXTRACTION ---
  function extractExperience(text, context) {
    if (!text || text.trim().length < 10) {
      return { years: 0, label: 'Not specified' };
    }

    const clean = normalizeWhitespace(text);

    const explicitRegex = /(?:over|more than|around|approx(?:imately)?|\+)?\s*(\d+(?:\.\d+)?)\s*\+?\s*(?:years?|yrs?)(?:\s+of)?\s+(?:relevant\s+|work\s+|professional\s+)?(?:experience|exp|background|track record)/i;
    const explicitMatch = clean.slice(0, 1500).match(explicitRegex);
    if (explicitMatch && explicitMatch[1]) {
      const parsed = parseFloat(explicitMatch[1]);
      if (parsed > 0 && parsed <= 35) {
        return { years: parsed, label: `~${parsed} yrs` };
      }
    }

    const refDate = (context && context.now) ? new Date(context.now) : new Date(2026, 8, 19);
    const defaultCurrentYear = !isNaN(refDate.getTime()) ? refDate.getFullYear() : 2026;
    const defaultCurrentMonth = !isNaN(refDate.getTime()) ? refDate.getMonth() : 8;

    let expSection = clean;
    const expMatch = clean.match(/\b(?:experience|work experience|employment history|professional experience)\b/i);
    if (expMatch) {
      const fromExp = clean.slice(expMatch.index + expMatch[0].length);
      const endMatch = fromExp.match(/\n\s*(?:##\s*|\*\*\s*)?(?:education|projects|technical skills|skills|certifications|publications|achievements)\b/i);
      expSection = endMatch ? fromExp.slice(0, endMatch.index) : fromExp;
    }

    const monthNames = 'jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t|tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?';
    
    const rangeRegex = new RegExp(
      `\\b(${monthNames})?\\s*([12]\\d{3})\\s*(?:-|to)\\s*(?:(${monthNames})?\\s*([12]\\d{3})|(present|current|now|till date))\\b`,
      'gi'
    );

    const intervals = [];
    let match;
    while ((match = rangeRegex.exec(expSection)) !== null) {
      const startMonthStr = (match[1] || 'jan').toLowerCase();
      const startYear = parseInt(match[2], 10);
      const isPresent = Boolean(match[5]);
      const endMonthStr = match[3] ? match[3].toLowerCase() : (isPresent ? 'sep' : 'dec');
      const endYear = match[4] ? parseInt(match[4], 10) : defaultCurrentYear;

      const startMonth = MONTH_MAP[startMonthStr] !== undefined ? MONTH_MAP[startMonthStr] : 0;
      const endMonth = MONTH_MAP[endMonthStr] !== undefined ? MONTH_MAP[endMonthStr] : (isPresent ? defaultCurrentMonth : 11);

      const startTotalMonths = startYear * 12 + startMonth;
      const endTotalMonths = endYear * 12 + endMonth;

      if (endTotalMonths >= startTotalMonths) {
        intervals.push({ start: startTotalMonths, end: endTotalMonths });
      }
    }

    const singleDateRegex = new RegExp(`\\b(${monthNames})\\s*([12]\\d{3})\\b`, 'gi');
    let sMatch;
    while ((sMatch = singleDateRegex.exec(expSection)) !== null) {
      const mStr = sMatch[1].toLowerCase();
      const yr = parseInt(sMatch[2], 10);
      const m = MONTH_MAP[mStr] !== undefined ? MONTH_MAP[mStr] : 0;
      const totalM = yr * 12 + m;
      const alreadyCovered = intervals.some(inv => totalM >= inv.start && totalM <= inv.end);
      if (!alreadyCovered) {
        const nowTotalM = defaultCurrentYear * 12 + defaultCurrentMonth;
        intervals.push({ start: totalM, end: Math.max(totalM + 1, nowTotalM) });
      }
    }

    if (intervals.length === 0) {
      return { years: 0, label: 'Not detected' };
    }

    intervals.sort((a, b) => a.start - b.start);
    const merged = [intervals[0]];
    for (let i = 1; i < intervals.length; i++) {
      const prev = merged[merged.length - 1];
      const curr = intervals[i];
      if (curr.start <= prev.end) {
        prev.end = Math.max(prev.end, curr.end);
      } else {
        merged.push(curr);
      }
    }

    const totalMonths = merged.reduce((acc, curr) => acc + (curr.end - curr.start + 1), 0);
    const calculatedYears = Math.round((totalMonths / 12) * 10) / 10;

    return {
      years: calculatedYears,
      label: calculatedYears > 0 ? `~${calculatedYears} yrs` : 'Not detected',
      months: totalMonths
    };
  }

  // --- 6. LOCATION EXTRACTION ---
  function extractCandidateLocation(text) {
    if (!text) return { city: 'Not specified', isRemote: false, label: 'Not specified' };

    const norm = normalizeWhitespace(text);
    const splitIndex = norm.search(/\b(education|experience|work history|projects|summary)\b/i);
    const headerBlock = (splitIndex > 50 ? norm.slice(0, splitIndex) : norm.slice(0, 450));
    const cleanHeader = headerBlock.replace(/\b(iit|iim|nit|university|institute|college)\s+[a-z]+/gi, '');

    const cityMap = (CollegesData && CollegesData.CITY_MAP) ? CollegesData.CITY_MAP : [
      { regex: /\b(bengaluru|bangalore)\b/i, name: 'Bengaluru', country: 'India' },
      { regex: /\b(delhi|new delhi|ncr|gurugram|gurgaon|noida)\b/i, name: 'Delhi NCR', country: 'India' },
      { regex: /\b(mumbai|bombay)\b/i, name: 'Mumbai', country: 'India' },
      { regex: /\b(hyderabad)\b/i, name: 'Hyderabad', country: 'India' },
      { regex: /\b(pune)\b/i, name: 'Pune', country: 'India' },
      { regex: /\b(chennai|madras)\b/i, name: 'Chennai', country: 'India' },
      { regex: /\b(kolkata|calcutta)\b/i, name: 'Kolkata', country: 'India' },
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
    let label = foundCity ? `${foundCity}, ${foundCountry}` : (isRemote ? 'Remote / Anywhere' : 'Not specified');

    return {
      city: foundCity || (isRemote ? 'Remote' : 'Not specified'),
      country: foundCountry || '',
      isRemote: isRemote,
      label: label
    };
  }

  // --- 7. EDUCATION & PEDIGREE EXTRACTION ---
  function extractCandidateEducation(text) {
    if (!text) return { degree: 'Not specified', tier: 'Tier 3', isTier1: false, isTier2: false, tierName: '', label: 'Not specified' };

    const norm = normalizeWhitespace(text).toLowerCase().replace(/\s+/g, ' ');

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

    let tier = 'Tier 3';
    let isTier1 = false;
    let isTier2 = false;
    let tierName = '';

    const dotClean = norm.replace(/\./g, '');

    const isIit = /\b(iit\b|iits\b|iitd\b|iitb\b|iitk\b|iitkgp\b|iitm\b|iitr\b|iith\b|iitg\b|iiti\b|iitgn\b|iitrpr\b|iitp\b|iitbbs\b|iitmandi\b|iitj\b|iittp\b|iitpkd\b|iitdhd\b|iitbhi\b|iitjm\b|iitbhu\b|iitism\b|indian\s+institute\s+of\s+technology)\b/i.test(norm)
      || /\b(iit\b|iits\b)/i.test(dotClean)
      || /\b(iit\s*[- ]*(?:bombay|delhi|madras|kanpur|kharagpur|roorkee|guwahati|hyderabad|indore|gandhinagar|ropar|patna|bhubaneswar|mandi|jodhpur|tirupati|palakkad|dharwad|bhilai|jammu|goa|bhu|varanasi|ism|dhanbad))\b/i.test(dotClean);

    const isBits = /\b(bits\s+pilani|bits\s+goa|bits\s+hyderabad|birla\s+institute\s+of\s+technology\s+and\s+science|\bbits\b)/i.test(norm);

    const isTier1Nit = /\b(nit\s*[- ]*(?:trichy|tiruchirappalli|surathkal|warangal|rourkela|calicut|nagpur|vnit|jaipur|mnit|allahabad|mnnit|surat|svnit))\b/i.test(norm)
      || /\b(nitk\b|nitt\b|nitw\b|vnit\b|mnit\b|mnnit\b|svnit\b)/i.test(norm);

    const isPremierEng = /\b(iiit\s*[- ]*(?:hyderabad|bangalore|delhi|allahabad)|iiith\b|iiitb\b|iiitd\b|iiita\b|dtu\b|delhi\s+technological\s+university|delhi\s+college\s+of\s+engineering|\bdce\b|nsut\b|netaji\s+subhas|\bnsit\b|jadavpur\s+university|coep\b|college\s+of\s+engineering\s+pune|vjti\b|veermata\s+jijabai|college\s+of\s+engineering\s+guindy|\bceg\b|psg\s+college\s+of\s+technology|psg\s+tech|institute\s+of\s+chemical\s+technology|\bict\s+mumbai\b|iiest\s+shibpur)\b/i.test(norm);

    const isTier1Mba = /\b(iim\b|iims\b|iima\b|iimb\b|iimc\b|iiml\b|iimk\b|iimi\b|indian\s+institute\s+of\s+management)\b/i.test(norm)
      || /\b(iim\b|iims\b)/i.test(dotClean)
      || /\b(isb\b|indian\s+school\s+of\s+business|xlri\b|fms\b|faculty\s+of\s+management\s+studies|spjimr\b|sp\s+jain|mdi\s+gurgaon|\bmdi\b|iift\b|jbims\b|tiss\s+mumbai|\btiss\b|sibm\s+pune|nmims\s+mumbai)\b/i.test(norm);

    const isOtherTier1 = /\b(srcc\b|shri\s+ram\s+college\s+of\s+commerce|st\.?\s*stephen|lady\s+shri\s+ram|\blsr\b|hindu\s+college|miranda\s+house|loyola\s+college|st\.?\s*xavier|christ\s+university)\b/i.test(norm)
      || /\b(stanford|mit\b|harvard|uc\s*berkeley|carnegie\s*mellon|cmu\b|oxford|cambridge|princeton|columbia|caltech|yale|cornell|upenn|wharton|insead|london\s+business\s+school|\blbs\b)\b/i.test(norm);

    if (isIit) {
      tier = 'Tier 1';
      isTier1 = true;
      tierName = 'Tier-1 (IIT)';
    } else if (isBits) {
      tier = 'Tier 1';
      isTier1 = true;
      tierName = 'Tier-1 (BITS)';
    } else if (isTier1Nit) {
      tier = 'Tier 1';
      isTier1 = true;
      tierName = 'Tier-1 (Top NIT)';
    } else if (isPremierEng) {
      tier = 'Tier 1';
      isTier1 = true;
      tierName = 'Tier-1 (Premier Eng)';
    } else if (isTier1Mba) {
      tier = 'Tier 1';
      isTier1 = true;
      tierName = 'Tier-1 (Premier MBA)';
    } else if (isOtherTier1) {
      tier = 'Tier 1';
      isTier1 = true;
      tierName = 'Tier-1 (Premier)';
    } else {
      const isTier2Nit = /\b(nit\b|nits\b|national\s+institute\s+of\s+technology|manit\b)\b/i.test(norm)
        || /\b(nit\b|nits\b)/i.test(dotClean);

      const isTier2Iiit = /\b(iiit\b|iiits\b|indian\s+institute\s+of\s+information\s+technology)\b/i.test(norm);

      const isTier2Tech = /\b(thapar\b|tiet\b|vit\b|vellore\s+institute\s+of\s+technology|manipal\s+institute\s+of\s+technology|mit\s+manipal|\bmahe\b|bit\s+mesra|birla\s+institute\s+of\s+technology\s+mesra|rvce\b|rv\s+college\s+of\s+engineering|bmsce\b|bms\s+college\s+of\s+engineering|msrit\b|ramaiah\s+institute|pes\s+university|pesit\b|mit\s+pune|mit\s+world\s+peace|ssn\s+college|sastra\s+university|amrita\s+(?:school\s+of\s+engineering|vishwa|university)|srm\s+(?:university|institute)|kiit\b|kalinga\s+institute|shiv\s+nadar|ashoka\s+university|plaksha|heritage\s+institute|techno\s+india|walchand|spce\b|cummins\s+college|pict\s+pune|dayananda\s+sagar|dsce\b|nirma\s+university|pdeu\b)\b/i.test(norm);

      const isTier2Mba = /\b(imt\s+ghaziabad|imi\s+delhi|ximb\b|xim\s+university|tapmi\b|fore\s+school|gim\s+goa|great\s+lakes|glim\b|irma\b|somaiya\b|lbsim\b|bimtech\b|welingkar\b|weschool\b|liba\b|scmhrd\b|iim\s+(?:amritsar|bodh\s+gaya|jammu|nagpur|sambalpur|sirmaur|visakhapatnam))\b/i.test(norm);

      if (isTier2Nit) {
        tier = 'Tier 2';
        isTier2 = true;
        tierName = 'Tier-2 (NIT)';
      } else if (isTier2Iiit) {
        tier = 'Tier 2';
        isTier2 = true;
        tierName = 'Tier-2 (IIIT)';
      } else if (isTier2Tech) {
        tier = 'Tier 2';
        isTier2 = true;
        tierName = 'Tier-2 (Leading Tech)';
      } else if (isTier2Mba) {
        tier = 'Tier 2';
        isTier2 = true;
        tierName = 'Tier-2 (Respected B-School)';
      } else {
        tier = 'Tier 3';
        tierName = 'State / Private University';
      }
    }

    const label = (tier === 'Tier 1' || tier === 'Tier 2') ? `${degree} · ${tierName}` : degree;

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
  function extractJdRequirements(jdText, locationMeta) {
    const rawJd = normalizeWhitespace(jdText || '');
    const rawLoc = normalizeWhitespace(locationMeta || '');
    const combined = (rawLoc + '\n' + rawJd);

    let minExp = null;
    let maxExp = null;
    const expRegex = /(?:minimum\s+(?:of\s+)?|at\s+least\s+)?(\d+(?:\.\d+)?)(?:\s*(?:-|to)\s*(\d+(?:\.\d+)?))?\s*\+?\s*(?:years?|yrs?)(?:\s+of)?\s+(?:relevant\s+|work\s+|professional\s+)?(?:experience|exp)/i;
    const expMatch = rawJd.match(expRegex);

    if (expMatch && expMatch[1]) {
      minExp = parseFloat(expMatch[1]);
      if (expMatch[2]) {
        maxExp = parseFloat(expMatch[2]);
      }
    } else {
      const altMatch = rawJd.match(/(?:experience|exp)\s*:\s*(\d+(?:\.\d+)?)(?:\s*(?:-|to)\s*(\d+(?:\.\d+)?))?\s*\+?\s*(?:years?|yrs?)/i);
      if (altMatch && altMatch[1]) {
        minExp = parseFloat(altMatch[1]);
        if (altMatch[2]) {
          maxExp = parseFloat(altMatch[2]);
        }
      } else {
        const rangeMatch = rawJd.match(/\b(\d+(?:\.\d+)?)\s*(?:-|to)\s*(\d+(?:\.\d+)?)\s*(?:years?|yrs?)\b/i);
        if (rangeMatch && rangeMatch[1]) {
          minExp = parseFloat(rangeMatch[1]);
          maxExp = parseFloat(rangeMatch[2]);
        }
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

    let jobCity = null;
    const cityMatch = combined.match(/\b(bengaluru|bangalore|delhi|new delhi|ncr|gurugram|gurgaon|noida|mumbai|hyderabad|pune|chennai|kolkata|san francisco|new york|london|singapore|dubai)\b/i);
    if (cityMatch) {
      const c = cityMatch[1].toLowerCase();
      if (c === 'bangalore' || c === 'bengaluru') jobCity = 'Bengaluru';
      else if (c === 'gurgaon' || c === 'gurugram' || c === 'noida' || c === 'delhi' || c === 'new delhi' || c === 'ncr') jobCity = 'Delhi NCR';
      else if (c === 'mumbai') jobCity = 'Mumbai';
      else if (c === 'pune') jobCity = 'Pune';
      else if (c === 'hyderabad') jobCity = 'Hyderabad';
      else if (c === 'chennai') jobCity = 'Chennai';
      else if (c === 'kolkata') jobCity = 'Kolkata';
      else jobCity = cityMatch[1];
    }

    const normJd = rawJd.toLowerCase();

    const tierPreferredPattern = /\b(?:tier\s*[- ]?1|top\s*[- ]?tier|premier)\s+(?:engineering\s+|b-?school\s+|management\s+)?(?:colleges?|institutes?|universities|graduates?|alumni|campuses)\b/i.test(normJd)
      || /\b(?:colleges?|institutes?|universities)\s*:\s*(?:tier\s*[- ]?1|premier|top\s*[- ]?tier)\b/i.test(normJd)
      || /\b(?:iits?|iims?|bits(?:\s+pilani)?|nits?)(?:[\s\/,|]+(?:and|or)?[\s\/,|]*(?:iits?|iims?|bits(?:\s+pilani)?|nits?))*\s+(?:graduates?|alumni|only|freshers?)\s+(?:preferred|required|mandatory)\b/i.test(normJd)
      || /\b(?:iits?|iims?|bits(?:\s+pilani)?|nits?)\s+(?:strongly\s+)?preferred\b/i.test(normJd)
      || /\b(?:degree\s+from\s+)?(?:a\s+)?tier\s*[- ]?1\s+(?:college|institute|engineering)\b/i.test(normJd)
      || /\bfrom\s+(?:premier|tier\s*[- ]?1)\s+(?:institutes?|colleges?|b-?schools?)\b/i.test(normJd);

    const isStrictTier1 = /\b(?:only|strictly)\s+(?:candidates\s+|applicants\s+)?(?:from\s+)?(?:iits?|iims?|bits|nits?|tier\s*[- ]?1|premier)\b/i.test(normJd)
      || /\b(?:tier\s*[- ]?1|premier\s+institute|iits?|iims?|bits|nits?)[^.\n]*?\b(?:only|mandatory|required|must)\b/i.test(normJd)
      || /\b(?:must\s+be|mandatory)\s*:\s*(?:tier\s*[- ]?1|iits?|premier)\b/i.test(normJd);

    const isPhdMandatory = /\b(ph\.?d\s+(?:is\s+)?(?:mandatory|required|must)|must\s+(?:have|hold|possess)\s+(?:a\s+)?ph\.?d|doctorate\s+required)\b/i.test(normJd);

    const isMbaAlternativeOrPreferred = /\b(?:b\.?tech|b\.?e\.?|bachelors?)\s*[\/|\bor\b]\s*mba\b/i.test(normJd)
      || /\bmba\s*[\/|\bor\b]\s*(?:b\.?tech|b\.?e\.?|bachelors?)\b/i.test(normJd)
      || /\bmba\s+(?:is\s+)?(?:preferred|desirable|plus|optional|advantage)\b/i.test(normJd)
      || /\b(?:preferred|desirable)\s*:\s*mba\b/i.test(normJd);

    const isStrictMba = !isMbaAlternativeOrPreferred && /\b(mba\s+(?:is\s+)?(?:mandatory|required|must)|must\s+(?:have|hold|possess)\s+(?:an\s+)?mba|mandatory\s*:\s*mba|degree\s+required\s*:\s*mba|minimum\s+qualification\s*:\s*mba)\b/i.test(normJd);

    let degreeReq = 'Bachelor\'s';
    let degreeMandatory = false;
    let mbaPreferred = false;

    if (isPhdMandatory) {
      degreeReq = 'PhD';
      degreeMandatory = true;
    } else if (isStrictMba) {
      degreeReq = 'MBA';
      degreeMandatory = true;
    } else if (isMbaAlternativeOrPreferred) {
      degreeReq = 'Bachelor\'s';
      mbaPreferred = true;
    }

    return {
      minExp: minExp,
      maxExp: maxExp,
      workMode: workMode,
      jobCity: jobCity,
      tierPreferred: tierPreferredPattern,
      tierMandatory: isStrictTier1,
      degreeReq: degreeReq,
      degreeMandatory: degreeMandatory,
      mbaPreferred: mbaPreferred
    };
  }

  // --- 9. PURE EVALUATION FUNCTION ---
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
      // Improved fallback phrase extraction
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

    const candExp = extractExperience(resumeText, context);
    const jdReq = extractJdRequirements(jdText, locationMeta);
    const candEdu = extractCandidateEducation(resumeText);
    const candLoc = extractCandidateLocation(resumeText);

    let penalties = 0;
    let bonuses = 0;
    const disqualifiers = [];

    // FACTOR A: WORK EXPERIENCE
    if (jdReq.minExp !== null && jdReq.minExp > 0) {
      if (candExp.years < jdReq.minExp) {
        const gap = Math.round((jdReq.minExp - candExp.years) * 10) / 10;
        if (gap >= 2) {
          penalties += config.penalties.experienceGapLarge;
        } else if (gap >= 1) {
          penalties += config.penalties.experienceGapMedium;
        } else {
          penalties += config.penalties.experienceGapSmall;
        }
        disqualifiers.push(config.disqualifierMessages.workExperience);
      } else {
        bonuses += config.bonuses.experienceMeetsRequirement;
      }
    }

    // FACTOR B: COLLEGE TIER & PEDIGREE
    if (jdReq.tierMandatory) {
      if (candEdu.tier === 'Tier 1') {
        bonuses += config.bonuses.collegeTierMandatoryTier1;
      } else if (candEdu.tier === 'Tier 2') {
        penalties += config.penalties.collegeTierMandatoryTier2;
        disqualifiers.push(config.disqualifierMessages.college);
      } else {
        penalties += config.penalties.collegeTierMandatoryTier3;
        disqualifiers.push(config.disqualifierMessages.college);
      }
    } else if (jdReq.tierPreferred) {
      if (candEdu.tier === 'Tier 1') {
        bonuses += config.bonuses.collegeTierPreferredTier1;
      } else if (candEdu.tier === 'Tier 2') {
        bonuses += config.bonuses.collegeTierPreferredTier2;
      } else {
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
      }
    } else if (jdReq.mbaPreferred && candEdu.degree === 'MBA') {
      bonuses += config.bonuses.degreeMbaPreferred;
    }

    // FACTOR C: LOCATION
    if (jdReq.workMode === 'On-site' && jdReq.jobCity) {
      if (candLoc.city && candLoc.city !== 'Not specified' && !candLoc.isRemote) {
        if (candLoc.city.toLowerCase() !== jdReq.jobCity.toLowerCase()) {
          penalties += config.penalties.locationMismatch;
          disqualifiers.push(config.disqualifierMessages.location);
        } else {
          bonuses += config.bonuses.locationMatch;
        }
      }
    }

    let finalScore = Math.round(skillScore - penalties + bonuses);
    finalScore = Math.max(config.bounds.min, Math.min(config.bounds.max, finalScore));

    if (config.flags && config.flags.enableRoleProfileDisqualifier && finalScore < config.thresholds.domainPivotThreshold && disqualifiers.length === 0) {
      disqualifiers.push(config.disqualifierMessages.roleProfile);
    }

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
    extractJdRequirements: extractJdRequirements,
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
