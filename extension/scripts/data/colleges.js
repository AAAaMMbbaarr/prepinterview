// PrepInterview Copilot - College Tiers, Cities & Education Classification
(function() {
  'use strict';

  const CITY_MAP = [
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

  const collegeTiers = {
    tier1: {
      iit: {
        normPattern: /\b(iit\b|iits\b|iitd\b|iitb\b|iitk\b|iitkgp\b|iitm\b|iitr\b|iith\b|iitg\b|iiti\b|iitgn\b|iitrpr\b|iitp\b|iitbbs\b|iitmandi\b|iitj\b|iittp\b|iitpkd\b|iitdhd\b|iitbhi\b|iitjm\b|iitbhu\b|iitism\b|indian\s+institute\s+of\s+technology)\b/i,
        dotPattern: /\b(iit\b|iits\b)/i,
        campusesPattern: /\b(iit\s*[- ]*(?:bombay|delhi|madras|kanpur|kharagpur|roorkee|guwahati|hyderabad|indore|gandhinagar|ropar|patna|bhubaneswar|mandi|jodhpur|tirupati|palakkad|dharwad|bhilai|jammu|goa|bhu|varanasi|ism|dhanbad))\b/i
      },
      bits: /\b(bits\s+pilani|bits\s+goa|bits\s+hyderabad|birla\s+institute\s+of\s+technology\s+and\s+science|\bbits\b)/i,
      topNit: /\b(nit\s*[- ]*(?:trichy|tiruchirappalli|surathkal|warangal|rourkela|calicut|nagpur|vnit|jaipur|mnit|allahabad|mnnit|surat|svnit))\b/i,
      topNitAbbr: /\b(nitk\b|nitt\b|nitw\b|vnit\b|mnit\b|mnnit\b|svnit\b)/i,
      premierEng: /\b(iiit\s*[- ]*(?:hyderabad|bangalore|delhi|allahabad)|iiith\b|iiitb\b|iiitd\b|iiita\b|dtu\b|delhi\s+technological\s+university|delhi\s+college\s+of\s+engineering|\bdce\b|nsut\b|netaji\s+subhas|\bnsit\b|jadavpur\s+university|coep\b|college\s+of\s+engineering\s+pune|vjti\b|veermata\s+jijabai|college\s+of\s+engineering\s+guindy|\bceg\b|psg\s+college\s+of\s+technology|psg\s+tech|institute\s+of\s+chemical\s+technology|\bict\s+mumbai\b|iiest\s+shibpur)\b/i,
      tier1Mba: /\b(iim\b|iims\b|iima\b|iimb\b|iimc\b|iiml\b|iimk\b|iimi\b|indian\s+institute\s+of\s+management)\b/i,
      tier1MbaDot: /\b(iim\b|iims\b)/i,
      tier1MbaOther: /\b(isb\b|indian\s+school\s+of\s+business|xlri\b|fms\b|faculty\s+of\s+management\s+studies|spjimr\b|sp\s+jain|mdi\s+gurgaon|\bmdi\b|iift\b|jbims\b|tiss\s+mumbai|\btiss\b|sibm\s+pune|nmims\s+mumbai)\b/i,
      otherTier1: /\b(srcc\b|shri\s+ram\s+college\s+of\s+commerce|st\.?\s*stephen|lady\s+shri\s+ram|\blsr\b|hindu\s+college|miranda\s+house|loyola\s+college|st\.?\s*xavier|christ\s+university)\b/i,
      globalTier1: /\b(stanford|mit\b|harvard|uc\s*berkeley|carnegie\s*mellon|cmu\b|oxford|cambridge|princeton|columbia|caltech|yale|cornell|upenn|wharton|insead|london\s+business\s+school|\blbs\b)\b/i
    },
    tier2: {
      nit: /\b(nit\b|nits\b|national\s+institute\s+of\s+technology|manit\b)\b/i,
      iiit: /\b(iiit\b|iiits\b|indian\s+institute\s+of\s+information\s+technology)\b/i,
      tech: /\b(thapar\b|tiet\b|vit\b|vellore\s+institute\s+of\s+technology|manipal\s+institute\s+of\s+technology|mit\s+manipal|\bmahe\b|bit\s+mesra|birla\s+institute\s+of\s+technology\s+mesra|rvce\b|rv\s+college\s+of\s+engineering|bmsce\b|bms\s+college\s+of\s+engineering|msrit\b|ramaiah\s+institute|pes\s+university|pesit\b|mit\s+pune|mit\s+world\s+peace|ssn\s+college|sastra\s+university|amrita\s+(?:school\s+of\s+engineering|vishwa|university)|srm\s+(?:university|institute)|kiit\b|kalinga\s+institute|shiv\s+nadar|ashoka\s+university|plaksha|heritage\s+institute|techno\s+india|walchand|spce\b|cummins\s+college|pict\s+pune|dayananda\s+sagar|dsce\b|nirma\s+university|pdeu\b)\b/i,
      mba: /\b(imt\s+ghaziabad|imi\s+delhi|ximb\b|xim\s+university|tapmi\b|fore\s+school|gim\s+goa|great\s+lakes|glim\b|irma\b|somaiya\b|lbsim\b|bimtech\b|welingkar\b|weschool\b|liba\b|scmhrd\b|iim\s+(?:amritsar|bodh\s+gaya|jammu|nagpur|sambalpur|sirmaur|visakhapatnam))\b/i
    }
  };

  const collegesData = {
    CITY_MAP: CITY_MAP,
    tiers: collegeTiers
  };

  if (typeof window !== 'undefined') {
    window.PrepInterview = window.PrepInterview || {};
    window.PrepInterview.Colleges = collegesData;
  }
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = collegesData;
  }
})();
