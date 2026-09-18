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

  const MONTH_MAP = {
    jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
    jul: 6, aug: 7, sep: 8, sept: 8, oct: 9, nov: 10, dec: 11,
    january: 0, february: 1, march: 2, april: 3, june: 5,
    july: 6, august: 7, september: 8, october: 9, november: 10, december: 11
  };

  // --- EXPERIENCE EXTRACTION ---
  function extractExperience(text) {
    if (!text || text.trim().length < 10) {
      return { years: 0, label: 'Not specified' };
    }

    const clean = normalizeWhitespace(text);

    // 1. Direct explicit mention e.g. "1.3 years of experience", "4+ years exp"
    const explicitRegex = /(?:over|more than|around|approx(?:imately)?|\+)?\s*(\d+(?:\.\d+)?)\s*\+?\s*(?:years?|yrs?)(?:\s+of)?\s+(?:relevant\s+|work\s+|professional\s+)?(?:experience|exp|background|track record)/i;
    const explicitMatch = clean.slice(0, 1500).match(explicitRegex);
    if (explicitMatch && explicitMatch[1]) {
      const parsed = parseFloat(explicitMatch[1]);
      if (parsed > 0 && parsed <= 35) {
        return { years: parsed, label: `~${parsed} yrs` };
      }
    }

    // 2. Isolate Experience section to avoid counting university duration (e.g. 2021-2025)
    let expSection = clean;
    const expMatch = clean.match(/\b(?:experience|work experience|employment history|professional experience)\b/i);
    if (expMatch) {
      const fromExp = clean.slice(expMatch.index + expMatch[0].length);
      const endMatch = fromExp.match(/\n\s*(?:##\s*|\*\*\s*)?(?:education|projects|technical skills|skills|certifications|publications|achievements)\b/i);
      expSection = endMatch ? fromExp.slice(0, endMatch.index) : fromExp;
    }

    const monthNames = 'jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t|tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?';
    
    // Date intervals e.g. "Aug 2025 - Jun 2026", "May 2025 - Aug 2025", "Aug 2025 - Present"
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
      const endYear = match[4] ? parseInt(match[4], 10) : 2026;

      const startMonth = MONTH_MAP[startMonthStr] !== undefined ? MONTH_MAP[startMonthStr] : 0;
      const endMonth = MONTH_MAP[endMonthStr] !== undefined ? MONTH_MAP[endMonthStr] : 11;

      const startTotalMonths = startYear * 12 + startMonth;
      const endTotalMonths = endYear * 12 + endMonth;

      if (endTotalMonths >= startTotalMonths) {
        intervals.push({ start: startTotalMonths, end: endTotalMonths });
      }
    }

    // Also check for single standalone date in role header e.g. "Jul 2026" (current role)
    const singleDateRegex = new RegExp(`\\b(${monthNames})\\s*([12]\\d{3})\\b`, 'gi');
    let sMatch;
    while ((sMatch = singleDateRegex.exec(expSection)) !== null) {
      const mStr = sMatch[1].toLowerCase();
      const yr = parseInt(sMatch[2], 10);
      const m = MONTH_MAP[mStr] !== undefined ? MONTH_MAP[mStr] : 0;
      const totalM = yr * 12 + m;
      const alreadyCovered = intervals.some(inv => totalM >= inv.start && totalM <= inv.end);
      if (!alreadyCovered) {
        const nowTotalM = 2026 * 12 + 8; // Sep 2026
        intervals.push({ start: totalM, end: Math.max(totalM + 1, nowTotalM) });
      }
    }

    if (intervals.length === 0) {
      return { years: 0, label: 'Not detected' };
    }

    // Merge overlapping intervals
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

  // --- LOCATION EXTRACTION ---
  function extractCandidateLocation(text) {
    if (!text) return { city: 'Not specified', isRemote: false, label: 'Not specified' };

    const norm = normalizeWhitespace(text);
    const splitIndex = norm.search(/\b(education|experience|work history|projects|summary)\b/i);
    const headerBlock = (splitIndex > 50 ? norm.slice(0, splitIndex) : norm.slice(0, 450));
    const cleanHeader = headerBlock.replace(/\b(iit|iim|nit|university|institute|college)\s+[a-z]+/gi, '');

    const cityMap = [
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

  // --- EDUCATION & PEDIGREE EXTRACTION ---
  function extractCandidateEducation(text) {
    if (!text) return { degree: 'Not specified', tier: 'Tier 3', isTier1: false, isTier2: false, tierName: '', label: 'Not specified' };

    const norm = normalizeWhitespace(text).toLowerCase().replace(/\s+/g, ' ');

    // 1. Degree Detection
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

    // 2. Comprehensive Indian College Tier Classification (Tier 1, Tier 2, Tier 3)
    let tier = 'Tier 3';
    let isTier1 = false;
    let isTier2 = false;
    let tierName = '';

    // Clean string for acronym checking (e.g. i.i.t. -> iit)
    const dotClean = norm.replace(/\./g, '');

    // --- TIER 1 INSTITUTES ---
    // A. IITs (All 23 campuses + abbreviations + punctuated I.I.T. + hyphens)
    const isIit = /\b(iit\b|iits\b|iitd\b|iitb\b|iitk\b|iitkgp\b|iitm\b|iitr\b|iith\b|iitg\b|iiti\b|iitgn\b|iitrpr\b|iitp\b|iitbbs\b|iitmandi\b|iitj\b|iittp\b|iitpkd\b|iitdhd\b|iitbhi\b|iitjm\b|iitbhu\b|iitism\b|indian\s+institute\s+of\s+technology)\b/i.test(norm)
      || /\b(iit\b|iits\b)/i.test(dotClean)
      || /\b(iit\s*[- ]*(?:bombay|delhi|madras|kanpur|kharagpur|roorkee|guwahati|hyderabad|indore|gandhinagar|ropar|patna|bhubaneswar|mandi|jodhpur|tirupati|palakkad|dharwad|bhilai|jammu|goa|bhu|varanasi|ism|dhanbad))\b/i.test(dotClean);

    // B. BITS Pilani (All Campuses: Pilani, Goa, Hyderabad)
    const isBits = /\b(bits\s+pilani|bits\s+goa|bits\s+hyderabad|birla\s+institute\s+of\s+technology\s+and\s+science|\bbits\b)/i.test(norm);

    // C. Top Tier-1 NITs
    const isTier1Nit = /\b(nit\s*[- ]*(?:trichy|tiruchirappalli|surathkal|warangal|rourkela|calicut|nagpur|vnit|jaipur|mnit|allahabad|mnnit|surat|svnit))\b/i.test(norm)
      || /\b(nitk\b|nitt\b|nitw\b|vnit\b|mnit\b|mnnit\b|svnit\b)/i.test(norm);

    // D. Premier Tech Institutes (IIIT Hyderabad/Bangalore/Delhi/Allahabad, DTU, NSUT, Jadavpur, etc.)
    const isPremierEng = /\b(iiit\s*[- ]*(?:hyderabad|bangalore|delhi|allahabad)|iiith\b|iiitb\b|iiitd\b|iiita\b|dtu\b|delhi\s+technological\s+university|delhi\s+college\s+of\s+engineering|\bdce\b|nsut\b|netaji\s+subhas|\bnsit\b|jadavpur\s+university|coep\b|college\s+of\s+engineering\s+pune|vjti\b|veermata\s+jijabai|college\s+of\s+engineering\s+guindy|\bceg\b|psg\s+college\s+of\s+technology|psg\s+tech|institute\s+of\s+chemical\s+technology|\bict\s+mumbai\b|iiest\s+shibpur)\b/i.test(norm);

    // E. Premier IIMs & MBA Institutes
    const isTier1Mba = /\b(iim\b|iims\b|iima\b|iimb\b|iimc\b|iiml\b|iimk\b|iimi\b|indian\s+institute\s+of\s+management)\b/i.test(norm)
      || /\b(iim\b|iims\b)/i.test(dotClean)
      || /\b(isb\b|indian\s+school\s+of\s+business|xlri\b|fms\b|faculty\s+of\s+management\s+studies|spjimr\b|sp\s+jain|mdi\s+gurgaon|\bmdi\b|iift\b|jbims\b|tiss\s+mumbai|\btiss\b|sibm\s+pune|nmims\s+mumbai)\b/i.test(norm);

    // F. Premier Commerce/Arts & Global Elite
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
      // --- TIER 2 INSTITUTES ---
      // Mid/New NITs, Mid IIITs, Reputed Tech Universities (VIT, Manipal, Thapar, RVCE, etc.)
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
        // --- TIER 3 / REGIONAL / STATE AFFILIATED ---
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

  // --- JD REQUIREMENTS EXTRACTION ---
  function extractJdRequirements(jdText, locationMeta) {
    const rawJd = normalizeWhitespace(jdText || '');
    const rawLoc = normalizeWhitespace(locationMeta || '');
    const combined = (rawLoc + '\n' + rawJd);

    // 1. Experience Required
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

    // 2. Work Mode & Location
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

    // 3. Education & Degree requirement in JD
    const normJd = rawJd.toLowerCase();

    // 3. Education / Tier requirement in JD
    const tierPreferredPattern = /\b(?:tier\s*[- ]?1|top\s*[- ]?tier|premier)\s+(?:engineering\s+|b-?school\s+|management\s+)?(?:colleges?|institutes?|universities|graduates?|alumni|campuses)\b/i.test(normJd)
      || /\b(?:colleges?|institutes?|universities)\s*:\s*(?:tier\s*[- ]?1|premier|top\s*[- ]?tier)\b/i.test(normJd)
      || /\b(?:iits?|iims?|bits(?:\s+pilani)?|nits?)(?:[\s\/,|]+(?:and|or)?[\s\/,|]*(?:iits?|iims?|bits(?:\s+pilani)?|nits?))*\s+(?:graduates?|alumni|only|freshers?)\s+(?:preferred|required|mandatory)\b/i.test(normJd)
      || /\b(?:iits?|iims?|bits(?:\s+pilani)?|nits?)\s+(?:strongly\s+)?preferred\b/i.test(normJd)
      || /\b(?:degree\s+from\s+)?(?:a\s+)?tier\s*[- ]?1\s+(?:college|institute|engineering)\b/i.test(normJd)
      || /\bfrom\s+(?:premier|tier\s*[- ]?1)\s+(?:institutes?|colleges?|b-?schools?)\b/i.test(normJd);

    // Is it strictly mandatory? (e.g. "Only Tier-1", "Tier-1 colleges only", "Strictly IIT", "Mandatory: Tier-1")
    const isStrictTier1 = /\b(?:only|strictly)\s+(?:candidates\s+|applicants\s+)?(?:from\s+)?(?:iits?|iims?|bits|nits?|tier\s*[- ]?1|premier)\b/i.test(normJd)
      || /\b(?:tier\s*[- ]?1|premier\s+institute|iits?|iims?|bits|nits?)[^.\n]*?\b(?:only|mandatory|required|must)\b/i.test(normJd)
      || /\b(?:must\s+be|mandatory)\s*:\s*(?:tier\s*[- ]?1|iits?|premier)\b/i.test(normJd);

    const tierPreferred = tierPreferredPattern;
    const tierMandatory = isStrictTier1;

    // Check if PhD is strictly mandatory
    const isPhdMandatory = /\b(ph\.?d\s+(?:is\s+)?(?:mandatory|required|must)|must\s+(?:have|hold|possess)\s+(?:a\s+)?ph\.?d|doctorate\s+required)\b/i.test(normJd);

    // Check if MBA is merely preferred or an alternative (e.g. "B.Tech/MBA", "B.Tech or MBA", "MBA preferred", "MBA is preferred")
    const isMbaAlternativeOrPreferred = /\b(?:b\.?tech|b\.?e\.?|bachelors?)\s*[\/|\bor\b]\s*mba\b/i.test(normJd)
      || /\bmba\s*[\/|\bor\b]\s*(?:b\.?tech|b\.?e\.?|bachelors?)\b/i.test(normJd)
      || /\bmba\s+(?:is\s+)?(?:preferred|desirable|plus|optional|advantage)\b/i.test(normJd)
      || /\b(?:preferred|desirable)\s*:\s*mba\b/i.test(normJd);

    // Check for strict mandatory MBA requirement (e.g. "MBA required", "Must have an MBA", "Mandatory: MBA")
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
      tierPreferred: tierPreferred,
      tierMandatory: tierMandatory,
      degreeReq: degreeReq,
      degreeMandatory: degreeMandatory,
      mbaPreferred: mbaPreferred
    };
  }

  // --- MULTI-FACTOR EVALUATION WITH DISQUALIFIER KNOCKOUTS ---
  function evaluateMultiFactor(resumeText, jdText, locationMeta, jobTitle) {
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

    // 1. Core Skill Score (0 to 100)
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

    let skillScore = 50;
    if (jdSkills.length > 0) {
      skillScore = Math.round((matched.length / jdSkills.length) * 100);
    } else {
      const jdTokens = new Set(normalize(jdText).split(/\s+/).filter(w => w.length > 4));
      const resTokens = new Set(normalize(resumeText).split(/\s+/).filter(w => w.length > 4));
      let common = 0;
      jdTokens.forEach(t => { if (resTokens.has(t)) common++; });
      const ratio = common / Math.max(1, jdTokens.size);
      skillScore = Math.min(88, Math.max(35, Math.round(ratio * 90 + 20)));
    }

    // Fallback domain extraction if JD had 0 taxonomy skills
    if (missing.length === 0 && matched.length === 0) {
      const stopWords = new Set(['years', 'experience', 'looking', 'skills', 'about', 'their', 'which', 'where', 'these', 'those', 'working', 'ability', 'degree', 'responsibilities', 'requirements', 'candidate', 'apply', 'team', 'work', 'role', 'company', 'india', 'must', 'have', 'with']);
      const jdWords = normalize(jdText).split(/\s+/).filter(w => w.length >= 4 && !stopWords.has(w));
      const freq = {};
      jdWords.forEach(w => { freq[w] = (freq[w] || 0) + 1; });
      const topWords = Object.keys(freq).sort((a, b) => freq[b] - freq[a]).slice(0, 5);
      missing.push(...topWords);
    }

    const candExp = extractExperience(resumeText);
    const jdReq = extractJdRequirements(jdText, locationMeta);
    const candEdu = extractCandidateEducation(resumeText);
    const candLoc = extractCandidateLocation(resumeText);

    let penalties = 0;
    let bonuses = 0;
    const disqualifiers = [];

    // --- FACTOR A: WORK EXPERIENCE (Only active if specified in JD) ---
    if (jdReq.minExp !== null && jdReq.minExp > 0) {
      if (candExp.years < jdReq.minExp) {
        const gap = Math.round((jdReq.minExp - candExp.years) * 10) / 10;
        if (gap >= 2) {
          penalties += 35;
        } else if (gap >= 1) {
          penalties += 22;
        } else {
          penalties += 12;
        }
        disqualifiers.push(`Work experience not matching`);
      } else {
        bonuses += 4; // Meets or exceeds stated experience requirement
      }
    }

    // --- FACTOR B: COLLEGE TIER & PEDIGREE (Only active if specified in JD) ---
    if (jdReq.tierMandatory) {
      // JD STRICTLY MANDATES TIER-1 (e.g. "Only Tier-1 colleges", "Strictly IIT/NIT only")
      if (candEdu.tier === 'Tier 1') {
        bonuses += 6; // Meets strict Tier-1 mandate
      } else if (candEdu.tier === 'Tier 2') {
        penalties += 15;
        disqualifiers.push(`College not matching`);
      } else {
        penalties += 30;
        disqualifiers.push(`College not matching`);
      }
    } else if (jdReq.tierPreferred) {
      // JD PREFERS TIER-1 (e.g. "IIT/NIT strongly preferred", "Top-tier college preferred")
      if (candEdu.tier === 'Tier 1') {
        bonuses += 6; // Tier-1 candidate gets strong boost
      } else if (candEdu.tier === 'Tier 2') {
        bonuses += 2; // Tier-2 candidate meets high bar, NO disqualifier
      } else {
        // Tier 3 candidate for preferred role: minor preference penalty, NO disqualifier!
        penalties += 8;
      }
    }

    // Degree level check (Only penalize if strictly mandatory, never for preferences or alternatives!)
    if (jdReq.degreeMandatory) {
      if (jdReq.degreeReq === 'PhD' && candEdu.degree !== 'PhD') {
        penalties += 25;
        disqualifiers.push(`Degree not matching`);
      } else if (jdReq.degreeReq === 'MBA' && candEdu.degree !== 'MBA') {
        penalties += 20;
        disqualifiers.push(`Degree not matching`);
      }
    } else if (jdReq.mbaPreferred && candEdu.degree === 'MBA') {
      bonuses += 3; // Modest bonus if candidate has MBA when preferred
    }

    // --- FACTOR C: LOCATION & WORK MODE (Only active if On-site in a specific city) ---
    if (jdReq.workMode === 'On-site' && jdReq.jobCity) {
      if (candLoc.city && candLoc.city !== 'Not specified' && !candLoc.isRemote) {
        if (candLoc.city.toLowerCase() !== jdReq.jobCity.toLowerCase()) {
          penalties += 18;
          disqualifiers.push(`Location not matching`);
        } else {
          bonuses += 4; // Local candidate for on-site role
        }
      }
    }

    // If NOTHING was specified in JD (no minExp, no tierPreferred, flexible location):
    // penalties = 0, bonuses = 0, so score is 100% evaluated on skills!
    let finalScore = Math.round(skillScore - penalties + bonuses);
    finalScore = Math.max(20, Math.min(98, finalScore));

    // If score is low (<50) and no hard criteria deficits exist, explain why (Domain Pivot)
    if (finalScore < 50 && disqualifiers.length === 0) {
      disqualifiers.push(`Role profile not matching`);
    }

    // Determine honest recruiting tier
    let tier = 'Competitive Match';
    let badge = '🟡';
    let color = '#d29922';

    if (disqualifiers.length >= 2 || finalScore < 45) {
      tier = 'Reach Role (Critical Gaps)';
      badge = '🔴';
      color = '#f85149';
    } else if (disqualifiers.length === 1 || (finalScore >= 45 && finalScore < 72)) {
      tier = 'Moderate Match (Gaps to Defend)';
      badge = '🟡';
      color = '#d29922';
    } else if (finalScore >= 80) {
      tier = 'Strong Match';
      badge = '🟢';
      color = '#3fb950';
    } else {
      tier = 'Good Match';
      badge = '🟢';
      color = '#2ea043';
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
      totalJdSkills: jdSkills.length
    };
  }

  function calculateMatch(resumeText, jdText, locationMeta, jobTitle) {
    return evaluateMultiFactor(resumeText, jdText, locationMeta, jobTitle);
  }

  const api = {
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

  if (typeof window !== 'undefined') {
    window.PrepInterviewMatcher = api;
  }
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})();
