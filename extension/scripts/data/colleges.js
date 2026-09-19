// PrepInterview Copilot - College Tiers, Cities & Education Classification
// Compiled from colleges.json (Version: 2026-09-19)
(function() {
  'use strict';

  const COLLEGES_VERSION = "2026-09-19";

  const CITY_MAP = [
    { regex: /\b(bengaluru|bangalore)\b/i, name: 'Bengaluru', country: 'India' },
    { regex: /\b(delhi|new delhi|ncr|gurugram|gurgaon|noida|greater noida|faridabad|ghaziabad)\b/i, name: 'Delhi NCR', country: 'India' },
    { regex: /\b(mumbai|bombay|navi mumbai|thane)\b/i, name: 'Mumbai', country: 'India' },
    { regex: /\b(hyderabad|secunderabad)\b/i, name: 'Hyderabad', country: 'India' },
    { regex: /\b(pune|pimpri\-chinchwad)\b/i, name: 'Pune', country: 'India' },
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

  const TIER1_REGEXES = [
    new RegExp('\\b(indian institute of technology|iitmandi|iitkgp|iitrpr|iitbbs|iitpkd|iitdhd|iitbhi|iitbhu|iitism|iitgn|iittp|iitjm|iits|iitd|iitb|iitk|iitm|iitr|iith|iitg|iiti|iitp|iitj|iit)\\b', 'i'),
    new RegExp('\\b(birla institute of technology and science|bits hyderabad|bits pilani|bits goa|bits)\\b', 'i'),
    new RegExp('\\b(mnnit allahabad|nit surathkal|nit warangal|nit rourkela|nit calicut|vnit nagpur|mnit jaipur|svnit surat|nit trichy|mnnit|svnit|nitk|nitt|nitw|vnit|mnit)\\b', 'i'),
    new RegExp('\\b(institute of chemical technology|delhi technological university|college of engineering guindy|delhi college of engineering|college of engineering pune|psg college of technology|jadavpur university|veermata jijabai|iiit hyderabad|iiit bangalore|iiit allahabad|netaji subhas|iiest shibpur|iiit delhi|ict mumbai|psg tech|iiith|iiitb|iiitd|iiita|nsut|nsit|coep|vjti|dtu|dce|ceg)\\b', 'i'),
    new RegExp('\\b(indian institute of management|iims|iima|iimb|iimc|iiml|iimk|iimi|iim)\\b', 'i'),
    new RegExp('\\b(faculty of management studies|indian school of business|nmims mumbai|mdi gurgaon|tiss mumbai|sibm pune|sp jain|spjimr|jbims|xlri|iift|tiss|isb|fms|mdi)\\b', 'i'),
    new RegExp('\\b(shri ram college of commerce|christ university|loyola college|lady shri ram|hindu college|miranda house|st stephen|st xavier|srcc|lsr)\\b', 'i'),
    new RegExp('\\b(london business school|carnegie mellon|uc berkeley|cambridge|princeton|stanford|columbia|harvard|caltech|cornell|wharton|oxford|insead|upenn|yale|mit|cmu|lbs)\\b', 'i')
  ];

  const TIER2_REGEXES = [
    new RegExp('\\b(national institute of technology|nit kurukshetra|nit meghalaya|manit bhopal|nit durgapur|nit hamirpur|nit silchar|nit raipur|nit patna|manit|nits|nit)\\b', 'i'),
    new RegExp('\\b(indian institute of information technology|iiit kanchipuram|iiit jabalpur|iiit vadodara|iiit gwalior|iiits|iiit)\\b', 'i'),
    new RegExp('\\b(birla institute of technology mesra|vellore institute of technology|manipal institute of technology|amrita school of engineering|bms college of engineering|rv college of engineering|heritage institute|ramaiah institute|sastra university|amrita university|kalinga institute|ashoka university|nirma university|mit world peace|cummins college|dayananda sagar|pes university|srm university|srm institute|techno india|vit vellore|mit manipal|ssn college|shiv nadar|bit mesra|pict pune|mit pune|walchand|plaksha|thapar|bmsce|msrit|pesit|tiet|mahe|rvce|kiit|spce|dsce|pdeu|vit)\\b', 'i'),
    new RegExp('\\b(iim visakhapatnam|xim university|imt ghaziabad|iim bodh gaya|iim sambalpur|iim amritsar|fore school|great lakes|iim sirmaur|iim nagpur|imi delhi|welingkar|iim jammu|weschool|gim goa|somaiya|bimtech|scmhrd|tapmi|lbsim|ximb|glim|irma|liba)\\b', 'i')
  ];

  const TIER3_REGEXES = [
    new RegExp('\\b(lovely professional university|chandigarh university|galgotias university|teerthanker mahaveer|quantum university|galgotias college|sharda university|amity university|parul university|geeta university|sage university|gla university|graphic era|galgotias|invertis|sharda|amity|parul|lpu|cu)\\b', 'i')
  ];

  function detectCollegeTier(text) {
    if (!text || typeof text !== 'string') return 'unknown';
    for (const r of TIER1_REGEXES) {
      if (r.test(text)) return 'Tier 1';
    }
    for (const r of TIER2_REGEXES) {
      if (r.test(text)) return 'Tier 2';
    }
    for (const r of TIER3_REGEXES) {
      if (r.test(text)) return 'Tier 3';
    }
    return 'unknown';
  }

  const collegesAPI = {
    version: COLLEGES_VERSION,
    CITY_MAP: CITY_MAP,
    detectCollegeTier: detectCollegeTier,
    tiers: {
      tier1: TIER1_REGEXES,
      tier2: TIER2_REGEXES,
      tier3: TIER3_REGEXES
    }
  };

  if (typeof window !== 'undefined') {
    window.PrepInterview = window.PrepInterview || {};
    window.PrepInterview.Colleges = collegesAPI;
  }
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = collegesAPI;
  }
})();
