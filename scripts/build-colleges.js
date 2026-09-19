const fs = require('fs');
const path = require('path');

const collegesJsonPath = path.join(__dirname, '../extension/scripts/data/colleges.json');
const collegesJsPath = path.join(__dirname, '../extension/scripts/data/colleges.js');

const data = JSON.parse(fs.readFileSync(collegesJsonPath, 'utf8'));

function escapeRegex(str) {
  return str.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
}

function makePattern(aliases) {
  const sorted = aliases.slice().sort((a, b) => b.length - a.length);
  const escaped = sorted.map(escapeRegex);
  return '\\b(' + escaped.join('|') + ')\\b';
}

const tier1Patterns = data.tiers.tier1.map(item => makePattern(item.aliases));
const tier2Patterns = data.tiers.tier2.map(item => makePattern(item.aliases));
const tier3Patterns = data.tiers.tier3.map(item => makePattern(item.aliases));

const lines = [
  '// PrepInterview Copilot - College Tiers, Cities & Education Classification',
  '// Compiled from colleges.json (Version: ' + data.version + ')',
  '(function() {',
  "  'use strict';",
  '',
  '  const COLLEGES_VERSION = "' + data.version + '";',
  '',
  '  const CITY_MAP = [',
  data.cities.map(c => "    { regex: /\\b(" + c.aliases.map(escapeRegex).join('|') + ")\\b/i, name: '" + c.name + "', country: '" + c.country + "' }").join(',\n'),
  '  ];',
  '',
  '  const TIER1_REGEXES = [',
  tier1Patterns.map(p => "    new RegExp('" + p.replace(/\\/g, '\\\\') + "', 'i')").join(',\n'),
  '  ];',
  '',
  '  const TIER2_REGEXES = [',
  tier2Patterns.map(p => "    new RegExp('" + p.replace(/\\/g, '\\\\') + "', 'i')").join(',\n'),
  '  ];',
  '',
  '  const TIER3_REGEXES = [',
  tier3Patterns.map(p => "    new RegExp('" + p.replace(/\\/g, '\\\\') + "', 'i')").join(',\n'),
  '  ];',
  '',
  '  function detectCollegeTier(text) {',
  "    if (!text || typeof text !== 'string') return 'unknown';",
  '    for (const r of TIER1_REGEXES) {',
  "      if (r.test(text)) return 'Tier 1';",
  '    }',
  '    for (const r of TIER2_REGEXES) {',
  "      if (r.test(text)) return 'Tier 2';",
  '    }',
  '    for (const r of TIER3_REGEXES) {',
  "      if (r.test(text)) return 'Tier 3';",
  '    }',
  "    return 'unknown';",
  '  }',
  '',
  '  const collegesAPI = {',
  '    version: COLLEGES_VERSION,',
  '    CITY_MAP: CITY_MAP,',
  '    detectCollegeTier: detectCollegeTier,',
  '    tiers: {',
  '      tier1: TIER1_REGEXES,',
  '      tier2: TIER2_REGEXES,',
  '      tier3: TIER3_REGEXES',
  '    }',
  '  };',
  '',
  "  if (typeof window !== 'undefined') {",
  '    window.PrepInterview = window.PrepInterview || {};',
  '    window.PrepInterview.Colleges = collegesAPI;',
  '  }',
  "  if (typeof module !== 'undefined' && module.exports) {",
  '    module.exports = collegesAPI;',
  '  }',
  '})();',
  ''
];

fs.writeFileSync(collegesJsPath, lines.join('\n'), 'utf8');
console.log('Successfully compiled colleges.json -> colleges.js');
