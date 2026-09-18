// PrepInterview Copilot - Client-Side Multi-Factor Match Engine (Skills, Experience, Location, Education)
(function() {
  const TAXONOMY = [
    // Tech & Engineering
    "python", "javascript", "typescript", "java", "c++", "c#", "golang", "go", "ruby", "php", "rust", "swift", "kotlin",
    "react", "react.js", "next.js", "vue", "angular", "node", "node.js", "express", "fastapi", "django", "flask", "spring boot",
    "aws", "amazon web services", "azure", "gcp", "google cloud", "docker", "kubernetes", "k8s", "terraform", "ci/cd", "github actions",
    "postgresql", "postgres", "mysql", "mongodb", "redis", "elasticsearch", "kafka", "rabbitmq", "dynamodb", "graphql", "rest api", "restful",
    "microservices", "system design", "distributed systems", "data structures", "algorithms", "scalability", "linux", "git",
    "machine learning", "deep learning", "nlp", "llm", "genai", "pytorch", "tensorflow", "computer vision", "pandas", "numpy", "scikit-learn",
    // Product, Strategy & Startup
    "founder office", "founders office", "chief of staff", "strategy", "execution", "startups", "high-growth", "operations", "scaling", "generalist", "cross-functional", "bizops", "business operations",
    "product management", "product manager", "product strategy", "product sense", "prd", "roadmap", "user research", "wireframing", "agile", "scrum", "jira",
    "a/b testing", "user stories", "retention", "churn", "funnel analysis", "north star metric", "sql", "tableau", "powerbi", "amplitude", "mixpanel",
    "google analytics", "customer discovery", "mvp", "feature prioritization", "stakeholder management", "program manager", "program management",
    "growth", "growth product", "onboarding", "lifecycle marketing", "conversion rate", "independent projects", "ai tools", "analytical thinking", "problem solving",
    // Business, MBA & Strategy
    "market sizing", "go-to-market", "gtm", "financial modeling", "dcf", "unit economics", "p&l", "profit and loss", "vendor management",
    "roi", "business case", "valuation", "competitive analysis", "due diligence", "consulting frameworks", "swot", "m&a",
    // Marketing & Sales
    "seo", "sem", "ppc", "performance marketing", "cac", "ltv", "hubspot", "salesforce", "lead generation", "cold outreach",
    "enterprise sales", "content strategy", "email marketing", "social media", "brand strategy", "copywriting", "growth hacking",
    // Operations & HR
    "talent acquisition", "recruiting", "employee relations", "performance management", "onboarding", "compensation", "compliance", "payroll"
  ];

  function normalize(str) {
    return (str || '').toLowerCase().replace(/'/g, '').replace(/[^a-z0-9+#./\s-]/g, ' ');
  }

  function extractSkills(text) {
    const norm = ' ' + normalize(text) + ' ';
    const found = new Set();
    
    for (const skill of TAXONOMY) {
      const pattern = new RegExp('(\\s|^)' + skill.replace(/[-/\^$*+?.()|[\]{}]/g, '\\$&') + '(\\s|$)', 'i');
      if (pattern.test(norm)) {
        found.add(skill);
      }
    }
    return Array.from(found);
  }

  // --- EXPERIENCE EXTRACTION ---
  function extractExperience(text) {
    if (!text || text.trim().length < 10) {
      return { years: 0, label: 'Not specified' };
    }

    // 1. Direct explicit mention e.g. "4+ years of experience", "over 5 yrs exp"
    const explicitRegex = /(?:over|more than|around|approx(?:imately)?|\+)?\s*(\d+(?:\.\d+)?)\s*\+?\s*(?:years?|yrs?)(?:\s+of)?\s+(?:relevant\s+|work\s+|professional\s+)?(?:experience|exp|background|track record)/i;
    const explicitMatch = text.slice(0, 1500).match(explicitRegex);
    let explicitYears = null;
    if (explicitMatch && explicitMatch[1]) {
      const parsed = parseFloat(explicitMatch[1]);
      if (parsed > 0 && parsed <= 35) {
        explicitYears = parsed;
      }
    }

    // 2. Year intervals across work history (e.g. 2020-2024, 2021-Present, etc.)
    const currentYear = new Date().getFullYear();
    const intervalRegex = /\b(19\d{2}|20\d{2})\s*(?:-|–|—|to)\s*(19\d{2}|20\d{2}|present|current|now|till date)\b/gi;
    let match;
    let minYear = 9999;
    let maxYear = 0;
    let foundIntervals = 0;

    while ((match = intervalRegex.exec(text)) !== null) {
      const start = parseInt(match[1], 10);
      let end = match[2].toLowerCase();
      if (end.includes('present') || end.includes('current') || end.includes('now') || end.includes('till')) {
        end = currentYear;
      } else {
        end = parseInt(end, 10);
      }

      if (start >= 1990 && start <= currentYear && end >= start && (end - start) <= 35) {
        foundIntervals++;
        if (start < minYear) minYear = start;
        if (end > maxYear) maxYear = end;
      }
    }

    let calculatedYears = 0;
    if (foundIntervals > 0 && maxYear >= minYear) {
      calculatedYears = Math.max(1, maxYear - minYear);
    }

    const years = explicitYears !== null ? explicitYears : calculatedYears;
    const label = years > 0 ? `~${years} yr${years === 1 ? '' : 's'}` : 'Not detected';

    return {
      years: years,
      label: label
    };
  }

  // --- LOCATION EXTRACTION ---
  function extractCandidateLocation(text) {
    if (!text) return { city: 'Not specified', isRemote: false, label: 'Not specified' };

    const head = text.slice(0, 1000);
    const cityMap = [
      { regex: /\b(bengaluru|bangalore)\b/i, name: 'Bengaluru', country: 'India' },
      { regex: /\b(mumbai|bombay)\b/i, name: 'Mumbai', country: 'India' },
      { regex: /\b(delhi|new delhi|ncr|gurugram|gurgaon|noida)\b/i, name: 'Delhi NCR', country: 'India' },
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
      { regex: /\b(dubai)\b/i, name: 'Dubai', country: 'UAE' },
      { regex: /\b(toronto)\b/i, name: 'Toronto', country: 'Canada' },
      { regex: /\b(berlin)\b/i, name: 'Berlin', country: 'Germany' }
    ];

    let foundCity = null;
    let foundCountry = null;
    for (const c of cityMap) {
      if (c.regex.test(head)) {
        foundCity = c.name;
        foundCountry = c.country;
        break;
      }
    }

    const isRemote = /\b(remote|work from anywhere|open to remote)\b/i.test(head);
    let label = foundCity ? `${foundCity}, ${foundCountry}` : (isRemote ? 'Remote / Anywhere' : 'Not specified');

    return {
      city: foundCity || (isRemote ? 'Remote' : 'Not specified'),
      country: foundCountry || '',
      isRemote: isRemote,
      label: label
    };
  }

  // --- EDUCATION & PEDIGREE EXTRACTION ---
  function extractCandidateEducation(text) {
    if (!text) return { degree: 'Not specified', isTier1: false, tierName: '', label: 'Not specified' };

    const norm = text.toLowerCase();

    // 1. Degree
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

    // 2. College / Tier-1 Pedigree
    let isTier1 = false;
    let tierName = '';

    if (/\b(iit\b|indian institute of technology)\b/i.test(text)) {
      isTier1 = true;
      tierName = 'Tier-1 (IIT)';
    } else if (/\b(bits pilani|bits\b)\b/i.test(text)) {
      isTier1 = true;
      tierName = 'Tier-1 (BITS)';
    } else if (/\b(nit\b|national institute of technology)\b/i.test(text)) {
      isTier1 = true;
      tierName = 'Tier-1 (NIT)';
    } else if (/\b(iiit\b|dtu\b|delhi technological university|nsut\b|jadavpur university)\b/i.test(text)) {
      isTier1 = true;
      tierName = 'Tier-1 (Premier Eng)';
    } else if (/\b(iim\b|indian institute of management)\b/i.test(text)) {
      isTier1 = true;
      tierName = 'Tier-1 (IIM)';
    } else if (/\b(isb\b|indian school of business|xlri|fms\b|spjimr)\b/i.test(text)) {
      isTier1 = true;
      tierName = 'Tier-1 (Premier MBA)';
    } else if (/\b(stanford|mit\b|harvard|uc berkeley|carnegie mellon|cmu\b|oxford|cambridge|princeton|columbia|caltech)\b/i.test(text)) {
      isTier1 = true;
      tierName = 'Global Top-Tier';
    } else if (/\b(srcc|st\.? stephen|loyola|christ university|st\.? xavier)\b/i.test(text)) {
      isTier1 = true;
      tierName = 'Tier-1 (Commerce)';
    }

    const label = isTier1 ? `${degree} · ${tierName}` : degree;

    return {
      degree: degree,
      isTier1: isTier1,
      tierName: tierName,
      label: label
    };
  }

  // --- JD REQUIREMENTS EXTRACTION ---
  function extractJdRequirements(jdText, locationMeta) {
    const rawJd = jdText || '';
    const rawLoc = locationMeta || '';
    const combined = (rawLoc + '\n' + rawJd);

    // 1. Experience Required
    let minExp = null;
    let maxExp = null;
    const expRegex = /(?:minimum\s+(?:of\s+)?|at\s+least\s+)?(\d+)(?:\s*(?:-|to)\s*(\d+))?\s*\+?\s*(?:years?|yrs?)(?:\s+of)?\s+(?:relevant\s+|work\s+|professional\s+)?(?:experience|exp)/i;
    const expMatch = rawJd.match(expRegex);

    if (expMatch && expMatch[1]) {
      minExp = parseInt(expMatch[1], 10);
      if (expMatch[2]) {
        maxExp = parseInt(expMatch[2], 10);
      }
    } else {
      const plusMatch = rawJd.match(/(\d+)\+\s*(?:years?|yrs?)/i);
      if (plusMatch && plusMatch[1]) {
        minExp = parseInt(plusMatch[1], 10);
      }
    }

    // 2. Work Mode & Location
    let workMode = 'On-site';
    if (/\b(remote|work from home|wfh|anywhere)\b/i.test(combined)) {
      workMode = 'Remote';
    } else if (/\b(hybrid)\b/i.test(combined)) {
      workMode = 'Hybrid';
    } else if (/\b(on-site|onsite|in-office)\b/i.test(combined)) {
      workMode = 'On-site';
    }

    const cityMap = [
      { regex: /\b(bengaluru|bangalore)\b/i, name: 'Bengaluru' },
      { regex: /\b(mumbai|bombay)\b/i, name: 'Mumbai' },
      { regex: /\b(delhi|new delhi|ncr|gurugram|gurgaon|noida)\b/i, name: 'Delhi NCR' },
      { regex: /\b(hyderabad)\b/i, name: 'Hyderabad' },
      { regex: /\b(pune)\b/i, name: 'Pune' },
      { regex: /\b(chennai)\b/i, name: 'Chennai' },
      { regex: /\b(kolkata)\b/i, name: 'Kolkata' },
      { regex: /\b(san francisco|bay area|san jose)\b/i, name: 'San Francisco Bay Area' },
      { regex: /\b(new york|nyc)\b/i, name: 'New York' },
      { regex: /\b(seattle)\b/i, name: 'Seattle' },
      { regex: /\b(austin)\b/i, name: 'Austin' },
      { regex: /\b(london)\b/i, name: 'London' },
      { regex: /\b(singapore)\b/i, name: 'Singapore' },
      { regex: /\b(dubai)\b/i, name: 'Dubai' }
    ];

    let jobCity = null;
    for (const c of cityMap) {
      if (c.regex.test(combined)) {
        jobCity = c.name;
        break;
      }
    }

    // 3. Education / Tier requirement in JD
    const tierPreferred = /\b(tier\s*1|tier-1|premier institute|top engineering college|top-tier|ivy league|top tier)\b/i.test(rawJd);
    let degreeReq = 'Bachelor\'s';
    if (/\b(mba)\b/i.test(rawJd)) {
      degreeReq = 'MBA';
    } else if (/\b(master|ms|m\.?tech)\b/i.test(rawJd)) {
      degreeReq = 'Master\'s';
    } else if (/\b(ph\.?d)\b/i.test(rawJd)) {
      degreeReq = 'PhD';
    }

    return {
      minExp: minExp,
      maxExp: maxExp,
      workMode: workMode,
      jobCity: jobCity,
      tierPreferred: tierPreferred,
      degreeReq: degreeReq
    };
  }

  // --- MULTI-FACTOR EVALUATION ---
  function evaluateMultiFactor(resumeText, jdText, locationMeta) {
    if (!resumeText || resumeText.trim().length < 20) {
      return {
        status: 'no_resume',
        score: 0,
        tier: 'Resume Needed',
        badge: '⚙️',
        color: '#8b949e',
        matchedSkills: [],
        missingSkills: [],
        message: 'Click extension icon to save your resume and unlock instant Skill Match.'
      };
    }

    // 1. Skills
    const jdSkills = extractSkills(jdText);
    const resumeSkills = extractSkills(resumeText);
    const matched = [];
    const missing = [];

    for (const skill of jdSkills) {
      if (resumeSkills.includes(skill)) {
        matched.push(skill);
      } else {
        missing.push(skill);
      }
    }

    // 1. Skill overlap (core base: 30-75 points)
    let baseScore = 50;
    if (jdSkills.length > 0) {
      const skillRatio = matched.length / jdSkills.length;
      baseScore = Math.round(skillRatio * 55 + 25);
    } else {
      const jdTokens = new Set(normalize(jdText).split(/\s+/).filter(w => w.length > 4));
      const resTokens = new Set(normalize(resumeText).split(/\s+/).filter(w => w.length > 4));
      let common = 0;
      jdTokens.forEach(t => { if (resTokens.has(t)) common++; });
      const ratio = common / Math.max(1, jdTokens.size);
      baseScore = Math.min(65, Math.max(38, Math.round(ratio * 45 + 25)));
    }

    // 2. Experience alignment (+4 to +8 points)
    const candExp = extractExperience(resumeText);
    const jdReq = extractJdRequirements(jdText, locationMeta);
    let expBonus = 5;
    if (jdReq.minExp !== null) {
      if (candExp.years >= jdReq.minExp) {
        expBonus = 8;
      } else if (candExp.years >= jdReq.minExp - 1) {
        expBonus = 5;
      } else {
        expBonus = 2;
      }
    } else if (candExp.years >= 2) {
      expBonus = 6;
    }

    // 3. Location & Mode alignment (+4 to +8 points)
    const candLoc = extractCandidateLocation(resumeText);
    let locBonus = 5;
    if (jdReq.workMode === 'Remote') {
      locBonus = 8;
    } else if (jdReq.jobCity && candLoc.city && candLoc.city !== 'Not specified') {
      if (candLoc.city.toLowerCase() === jdReq.jobCity.toLowerCase()) {
        locBonus = 8;
      } else {
        locBonus = 3;
      }
    } else {
      locBonus = 5; // neutral benefit of doubt
    }

    // 4. Education & Pedigree (+4 to +7 points)
    const candEdu = extractCandidateEducation(resumeText);
    let eduBonus = 4;
    if (candEdu.isTier1) {
      eduBonus = 7;
    } else if (candEdu.degree && candEdu.degree !== 'Graduate') {
      eduBonus = 5;
    }

    // Integrated total match percentage
    let totalScore = baseScore + expBonus + locBonus + eduBonus;
    totalScore = Math.max(35, Math.min(96, totalScore));

    let tier = 'Competitive Match';
    let badge = '🟡';
    let color = '#d29922';

    if (totalScore >= 80) {
      tier = 'Strong Match';
      badge = '🟢';
      color = '#3fb950';
    } else if (totalScore >= 64) {
      tier = 'Good Match';
      badge = '🟢';
      color = '#2ea043';
    } else if (totalScore >= 48) {
      tier = 'Moderate Match';
      badge = '🟡';
      color = '#d29922';
    } else {
      tier = 'Growth Role';
      badge = '🔴';
      color = '#f85149';
    }

    return {
      status: 'ready',
      score: totalScore,
      tier: tier,
      badge: badge,
      color: color,
      matchedSkills: matched.slice(0, 6),
      missingSkills: missing.slice(0, 5),
      totalJdSkills: jdSkills.length
    };
  }

  function calculateMatch(resumeText, jdText, locationMeta) {
    return evaluateMultiFactor(resumeText, jdText, locationMeta);
  }

  window.PrepInterviewMatcher = {
    TAXONOMY: TAXONOMY,
    normalize: normalize,
    extractSkills: extractSkills,
    extractExperience: extractExperience,
    extractCandidateLocation: extractCandidateLocation,
    extractCandidateEducation: extractCandidateEducation,
    extractJdRequirements: extractJdRequirements,
    evaluateMultiFactor: evaluateMultiFactor,
    calculateMatch: calculateMatch
  };
})();
