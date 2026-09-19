const fs = require('fs');
const path = require('path');

const proposals = [
  {
    pair: 'fresher_tier3 x jd_12',
    jdId: 'jd_12',
    reqType: 'Location (On-site Mumbai)',
    exactSentence: 'Location: Mumbai (On-site / Work from Office required, candidate must be based in or relocate to Mumbai)',
    currentExpected: '["Work experience not matching", "College not matching", "Degree not matching"]',
    proposedExpected: '["Work experience not matching", "College not matching", "Degree not matching", "Location not matching"]',
    rationale: 'Candidate is based in Pune, Maharashtra. JD 12 is explicitly On-site in Mumbai with mandatory office attendance. The engine emits Location not matching, but expected.json omits it.'
  },
  {
    pair: 'mid_tier2_vit x jd_12',
    jdId: 'jd_12',
    reqType: 'Location (On-site Mumbai)',
    exactSentence: 'Location: Mumbai (On-site / Work from Office required, candidate must be based in or relocate to Mumbai)',
    currentExpected: '["Work experience not matching", "College not matching", "Degree not matching"]',
    proposedExpected: '["Work experience not matching", "College not matching", "Degree not matching", "Location not matching"]',
    rationale: 'Candidate is based in Bengaluru, Karnataka. JD 12 is explicitly On-site in Mumbai. The engine emits Location not matching, but expected.json omits it.'
  },
  {
    pair: 'senior_tier1_iit x jd_12',
    jdId: 'jd_12',
    reqType: 'Experience Shortfall (6+ yrs required)',
    exactSentence: 'Minimum 6+ years of product management experience, preferably in banking or fintech.',
    currentExpected: '["Location not matching"]',
    proposedExpected: '["Location not matching", "Work experience not matching"]',
    rationale: 'Candidate has 5.3 total/relevant years. Shortfall is 0.7 years, exceeding the 0.5 yr tolerance. The engine emits Work experience not matching, which expected.json omitted.'
  },
  {
    pair: 'mid_tier2_vit x jd_30',
    jdId: 'jd_30',
    reqType: 'Experience Shortfall (Strategy/BizOps domain)',
    exactSentence: '2-4 years experience in Founder\'s Office, management consulting, or VC.',
    currentExpected: '[]',
    proposedExpected: '["Work experience not matching"]',
    rationale: 'Candidate has 1.4 relevant years in Strategy/BizOps (product exp discounted by 0.5 adjacency). Shortfall is 0.6 years (> 0.5 yr tolerance). The engine emits Work experience not matching, omitted in expected.json.'
  },
  {
    pair: 'mid_tier2_vit x jd_10',
    jdId: 'jd_10',
    reqType: 'Domain / Role Profile (ML/AI)',
    exactSentence: '2-4 years of industry or research experience in machine learning and deep learning.',
    currentExpected: '[]',
    proposedExpected: '["Role profile not matching"]',
    rationale: 'Candidate has a pure Product Management background; JD 10 is an ML/AI engineering role. Zero role adjacency (credit <= 0.25). expected.json omitted any disqualifier.'
  },
  {
    pair: 'mid_tier2_vit x jd_13',
    jdId: 'jd_13',
    reqType: 'Domain / Role Profile (Backend SWE)',
    exactSentence: '2-5 years of hands-on experience in backend engineering.',
    currentExpected: '[]',
    proposedExpected: '["Role profile not matching"]',
    rationale: 'Candidate has a pure Product Management background; JD 13 is a Backend Software Engineering role (credit <= 0.25). expected.json omitted disqualifiers.'
  },
  {
    pair: 'mid_tier2_vit x jd_17',
    jdId: 'jd_17',
    reqType: 'Domain / Role Profile (Enterprise Sales)',
    exactSentence: '3-6 years of quota-carrying B2B enterprise SaaS sales experience.',
    currentExpected: '[]',
    proposedExpected: '["Role profile not matching"]',
    rationale: 'Candidate has zero quota-carrying B2B sales background. Zero role adjacency (0.00). expected.json omitted disqualifiers.'
  },
  {
    pair: 'mid_tier2_vit x jd_23',
    jdId: 'jd_23',
    reqType: 'Domain / Role Profile (Research Scientist)',
    exactSentence: 'Minimum 2-4 years of industry research experience. PhD in Computer Science / AI required.',
    currentExpected: '["Degree not matching"]',
    proposedExpected: '["Degree not matching", "Role profile not matching"]',
    rationale: 'Role requires dedicated ML/AI research scientist background. expected.json caught the degree gap but omitted the role profile knockout.'
  },
  {
    pair: 'senior_tier1_iit x jd_06',
    jdId: 'jd_06',
    reqType: 'Domain / Role Profile (Backend SWE)',
    exactSentence: '5+ years backend software engineering experience with Go or Java, microservices, and distributed systems.',
    currentExpected: '[]',
    proposedExpected: '["Role profile not matching"]',
    rationale: 'Candidate is a Senior PM with zero backend Go/Java distributed systems engineering background (credit <= 0.25). expected.json omitted disqualifiers.'
  },
  {
    pair: 'senior_tier1_iit x jd_10',
    jdId: 'jd_10',
    reqType: 'Domain / Role Profile (ML/AI)',
    exactSentence: '2-4 years of industry or research experience in machine learning and deep learning.',
    currentExpected: '[]',
    proposedExpected: '["Role profile not matching"]',
    rationale: 'Candidate has product background with zero ML research/industry experience. expected.json omitted disqualifiers.'
  },
  {
    pair: 'senior_tier1_iit x jd_13',
    jdId: 'jd_13',
    reqType: 'Domain / Role Profile (Backend SWE)',
    exactSentence: '2-5 years of hands-on experience in backend engineering.',
    currentExpected: '[]',
    proposedExpected: '["Role profile not matching"]',
    rationale: 'Candidate has product background with zero backend engineering experience. expected.json omitted disqualifiers.'
  },
  {
    pair: 'senior_tier1_iit x jd_17',
    jdId: 'jd_17',
    reqType: 'Domain / Role Profile (Enterprise Sales)',
    exactSentence: '3-6 years of quota-carrying B2B enterprise SaaS sales experience.',
    currentExpected: '[]',
    proposedExpected: '["Role profile not matching"]',
    rationale: 'Candidate has zero quota-carrying B2B sales experience (credit 0.00). expected.json omitted disqualifiers.'
  },
  {
    pair: 'senior_tier1_iit x jd_23',
    jdId: 'jd_23',
    reqType: 'Domain / Role Profile (Research Scientist)',
    exactSentence: 'Minimum 2-4 years of industry research experience. PhD in Computer Science / AI required.',
    currentExpected: '["Degree not matching"]',
    proposedExpected: '["Degree not matching", "Role profile not matching"]',
    rationale: 'Role requires dedicated ML/AI research scientist background. expected.json caught degree but omitted role profile knockout.'
  },
  {
    pair: 'senior_tier1_iit x jd_28',
    jdId: 'jd_28',
    reqType: 'Domain / Role Profile (Staff Platform SWE)',
    exactSentence: '8+ years engineering experience with deep distributed systems, Linux kernel, and infrastructure expertise.',
    currentExpected: '[]',
    proposedExpected: '["Role profile not matching"]',
    rationale: 'Candidate has 5.3 yrs product experience; JD is a Staff Platform/Systems engineering role (credit <= 0.25). expected.json omitted disqualifiers.'
  },
  {
    pair: 'senior_tier1_iit x jd_33',
    jdId: 'jd_33',
    reqType: 'Domain / Role Profile (DevOps / Infrastructure)',
    exactSentence: '3-5 years experience managing Kubernetes clusters, CI/CD pipelines, and cloud infrastructure.',
    currentExpected: '[]',
    proposedExpected: '["Role profile not matching"]',
    rationale: 'Candidate has product experience; JD is a DevOps/Cloud Infra role (credit <= 0.25). expected.json omitted disqualifiers.'
  }
];

let md = '# PrepInterview Copilot — Proposed Ground-Truth Label Corrections\n\n';
md += 'This document audits pairs where the Job Description explicitly states a hard requirement that `tests/expected.json` omits.\n\n';
md += '> [!IMPORTANT]\n';
md += '> **Per user directive, `tests/expected.json` has NOT been edited.** These discrepancies are recorded for transparency and future recruiter calibration.\n\n';
md += '| Pair ID | Requirement Type | Exact JD Sentence | Current `expected.json` | Proposed Correction | Rationale |\n';
md += '| :--- | :--- | :--- | :--- | :--- | :--- |\n';

proposals.forEach(p => {
  md += `| \`${p.pair}\` | **${p.reqType}** | *"${p.exactSentence}"* | \`${p.currentExpected}\` | \`${p.proposedExpected}\` | ${p.rationale} |\n`;
});

const targetPath = path.resolve(__dirname, '../tests/label-corrections-proposed.md');
fs.writeFileSync(targetPath, md, 'utf8');
console.log(`Successfully written ${proposals.length} proposed corrections to tests/label-corrections-proposed.md`);
