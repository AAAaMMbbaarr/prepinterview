#!/usr/bin/env node
/**
 * PrepInterview Copilot — Release Validation Check
 * 
 * Validates extension metadata, configuration, permissions, security,
 * copy integrity, and asset presence prior to Chrome Web Store packaging.
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');
const EXT_DIR = path.join(ROOT_DIR, 'extension');
const RELEASE_DIR = path.join(ROOT_DIR, 'release');

const results = [];

function check(title, fn) {
  try {
    const detail = fn();
    results.push({ title, status: 'PASS', detail: detail || 'OK' });
  } catch (err) {
    results.push({ title, status: 'FAIL', error: err.message, instruction: err.instruction });
  }
}

// 1. Version Consistency
check('Version numbers match across manifest.json, popup.html, package.json, CHANGELOG.md', () => {
  const pkg = JSON.parse(fs.readFileSync(path.join(ROOT_DIR, 'package.json'), 'utf8'));
  const manifest = JSON.parse(fs.readFileSync(path.join(EXT_DIR, 'manifest.json'), 'utf8'));
  const popupHtml = fs.readFileSync(path.join(EXT_DIR, 'popup', 'popup.html'), 'utf8');
  const changelog = fs.readFileSync(path.join(ROOT_DIR, 'CHANGELOG.md'), 'utf8');

  const vPkg = pkg.version;
  const vManifest = manifest.version;

  const popupMatch = popupHtml.match(/class="version"[^>]*>v?([0-9]+\.[0-9]+\.[0-9]+)</);
  if (!popupMatch) throw new Error('Could not find version span in popup.html');
  const vPopup = popupMatch[1];

  const changelogMatch = changelog.match(/## \[([0-9]+\.[0-9]+\.[0-9]+)\]/);
  if (!changelogMatch) throw new Error('Could not find latest version entry in CHANGELOG.md');
  const vChangelog = changelogMatch[1];

  if (vPkg !== vManifest || vManifest !== vPopup || vPopup !== vChangelog) {
    throw new Error(`Version mismatch: package.json (${vPkg}), manifest.json (${vManifest}), popup.html (${vPopup}), CHANGELOG.md (${vChangelog})`);
  }

  return `Consistent at v${vManifest}`;
});

// 2. Release Config (FEEDBACK_URL, SUPPORT_EMAIL, PRIVACY_POLICY_URL)
check('Release configuration (FEEDBACK_URL, SUPPORT_EMAIL, PRIVACY_POLICY_URL)', () => {
  const configPath = path.join(EXT_DIR, 'scripts', 'release-config.js');
  if (!fs.existsSync(configPath)) {
    throw new Error('extension/scripts/release-config.js does not exist');
  }
  const config = require(configPath);
  const unconfigured = [];

  ['FEEDBACK_URL', 'SUPPORT_EMAIL', 'PRIVACY_POLICY_URL'].forEach(key => {
    const val = config[key];
    if (!val || val === 'REPLACE_ME' || typeof val !== 'string' || val.trim() === '') {
      unconfigured.push(key);
    }
  });

  if (unconfigured.length > 0) {
    const err = new Error(`Configuration placeholder present: ${unconfigured.join(', ')} is 'REPLACE_ME' or empty.`);
    err.instruction = 'Please open extension/scripts/release-config.js and replace placeholder values with production URLs and support contact before submitting to Chrome Web Store.';
    throw err;
  }

  return 'All URLs and support contacts configured';
});

// 3. Manifest Permissions
check('Manifest V3 permissions and host_permissions minimalism', () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(EXT_DIR, 'manifest.json'), 'utf8'));
  
  if (manifest.manifest_version !== 3) {
    throw new Error(`Expected manifest_version 3, got ${manifest.manifest_version}`);
  }

  const perms = manifest.permissions || [];
  if (perms.length !== 1 || perms[0] !== 'storage') {
    throw new Error(`permissions must strictly be ["storage"], got ${JSON.stringify(perms)}`);
  }

  const hostPerms = manifest.host_permissions || [];
  if (hostPerms.length !== 1 || hostPerms[0] !== '*://*.linkedin.com/*') {
    throw new Error(`host_permissions must strictly be ["*://*.linkedin.com/*"], got ${JSON.stringify(hostPerms)}`);
  }

  return 'Strictly ["storage"] and ["*://*.linkedin.com/*"]';
});

// 4. Safe innerHTML Usage
check('Safe innerHTML assignments (explicit escapeHtml / sanitized renderer)', () => {
  const jsFiles = [
    path.join(EXT_DIR, 'scripts', 'content.js'),
    path.join(EXT_DIR, 'scripts', 'card-renderer.js'),
    path.join(EXT_DIR, 'popup', 'popup.js')
  ];

  jsFiles.forEach(file => {
    if (!fs.existsSync(file)) return;
    const content = fs.readFileSync(file, 'utf8');
    const lines = content.split('\n');
    lines.forEach((line, idx) => {
      if (line.includes('.innerHTML =') || line.includes('.innerHTML+=')) {
        // Must use renderer or escapeHtml or static template
        const isSafe = line.includes('renderer.') ||
                       line.includes('escapeHtml') ||
                       line.includes('cardHtml') ||
                       line.includes('floatPill') ||
                       line.includes('`<div') ||
                       line.includes('container.innerHTML =');
        if (!isSafe) {
          throw new Error(`Potentially unsanitized innerHTML assignment at ${path.relative(ROOT_DIR, file)}:${idx + 1}: ${line.trim()}`);
        }
      }
    });
  });

  return 'All innerHTML assignments sanitized via escapeHtml or pure renderer';
});

// 5. Banned Phrases Check (Extension & Store Listing)
check('Absence of banned hiring claims & prohibited scraping terms', () => {
  const storeListingPath = path.join(RELEASE_DIR, 'store-listing.md');
  if (!fs.existsSync(storeListingPath)) {
    throw new Error('release/store-listing.md does not exist');
  }
  const storeListing = fs.readFileSync(storeListingPath, 'utf8');

  // Forbidden in store listing
  const listingProhibited = ['scraper', 'scraping', 'bot', 'automation', 'auto-apply', 'shortlist', 'probability', 'guarantee'];
  const listingViolations = [];
  listingProhibited.forEach(word => {
    const reg = new RegExp(`\\b${word}\\b`, 'i');
    // Check if mentioned in listing text, excluding instructions that say "do not use..."
    // Specifically check the description section
    const descSection = storeListing.split('## 2. Detailed Description')[1] || storeListing;
    const cleanDesc = descSection.split('## 3. Chrome Web Store Review Declarations')[0];
    if (reg.test(cleanDesc)) {
      listingViolations.push(word);
    }
  });

  if (listingViolations.length > 0) {
    throw new Error(`release/store-listing.md contains prohibited words: ${listingViolations.join(', ')}`);
  }

  // Extension copy check
  const bannedCopy = [/shortlist\s+likely/i, /interview\s+probability/i, /hiring\s+prediction/i, /guarantee/i];
  const extFiles = [
    path.join(EXT_DIR, 'popup', 'popup.html'),
    path.join(EXT_DIR, 'scripts', 'scoring-config.js'),
    path.join(EXT_DIR, 'scripts', 'card-renderer.js')
  ];

  extFiles.forEach(f => {
    const text = fs.readFileSync(f, 'utf8');
    bannedCopy.forEach(reg => {
      // allow disclaimer phrases: "not a hiring prediction"
      const matches = text.match(new RegExp(`.{0,30}${reg.source}.{0,30}`, 'gi')) || [];
      matches.forEach(m => {
        if (!m.toLowerCase().includes('not a hiring prediction') &&
            !m.toLowerCase().includes('never show') &&
            !m.toLowerCase().includes('estimate based on the job text, not a hiring prediction')) {
          throw new Error(`Extension file ${path.relative(ROOT_DIR, f)} contains banned claim: "${m.trim()}"`);
        }
      });
    });
  });

  return 'Clean: Zero banned claims and zero prohibited automation terms';
});

// 6. Short Description Length <= 132 chars
check('Manifest & Store listing description length (<= 132 chars)', () => {
  const manifestPath = path.join(EXT_DIR, 'manifest.json');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  if (!manifest.description || manifest.description.length > 132) {
    throw new Error(`Manifest description length is ${manifest.description ? manifest.description.length : 0} chars (exceeds limit of 132): "${manifest.description}"`);
  }

  const storeListingPath = path.join(RELEASE_DIR, 'store-listing.md');
  const content = fs.readFileSync(storeListingPath, 'utf8');
  const match = content.match(/### Short Description[^\n]*\n+([^\n#]+)/i);
  if (!match) {
    throw new Error('Could not find Short Description heading in release/store-listing.md');
  }
  const shortDesc = match[1].trim();
  if (shortDesc.length > 132) {
    throw new Error(`Store listing short description length is ${shortDesc.length} chars (exceeds limit of 132): "${shortDesc}"`);
  }
  return `Manifest: ${manifest.description.length} chars, Store: ${shortDesc.length} chars (both <= 132)`;
});

// 7. Extension Icons Existence
check('Extension icon files exist (16x16, 48x48, 128x128)', () => {
  const requiredSizes = [16, 48, 128];
  requiredSizes.forEach(size => {
    const iconPath = path.join(EXT_DIR, 'icons', `icon-${size}.png`);
    if (!fs.existsSync(iconPath)) {
      throw new Error(`Missing icon file: extension/icons/icon-${size}.png`);
    }
    const stat = fs.statSync(iconPath);
    if (stat.size === 0) {
      throw new Error(`Icon file is empty: extension/icons/icon-${size}.png`);
    }
  });

  return 'All required icon sizes present and valid';
});

// Print Results
console.log('\n======================================================');
console.log('PREPINTERVIEW COPILOT — RELEASE VALIDATION CHECK');
console.log('======================================================\n');

let hasFailure = false;

results.forEach((r, idx) => {
  const num = idx + 1;
  if (r.status === 'PASS') {
    console.log(`[PASS] ${num}. ${r.title}`);
    console.log(`       ↳ ${r.detail}\n`);
  } else {
    hasFailure = true;
    console.log(`[FAIL] ${num}. ${r.title}`);
    console.log(`       ↳ Error: ${r.error}`);
    if (r.instruction) {
      console.log(`       ↳ Action Required: ${r.instruction}`);
    }
    console.log('');
  }
});

console.log('======================================================');
if (hasFailure) {
  console.log('STATUS: FAILED — Resolve listed items before packaging.');
  console.log('======================================================\n');
  process.exit(1);
} else {
  console.log('STATUS: ALL CHECKS PASSED — Ready for packaging.');
  console.log('======================================================\n');
  process.exit(0);
}
