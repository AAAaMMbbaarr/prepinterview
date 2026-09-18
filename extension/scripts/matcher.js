// PrepInterview Copilot - Client-Side Skill & FitScore Engine
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

  function calculateMatch(resumeText, jdText) {
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

    // Skill-based scoring with fallback
    let score = 50;
    if (jdSkills.length > 0) {
      const skillOverlapRatio = matched.length / jdSkills.length;
      score = Math.round(skillOverlapRatio * 70 + 25);
    } else {
      // Word frequency overlap fallback
      const jdTokens = new Set(normalize(jdText).split(/\s+/).filter(w => w.length > 4));
      const resTokens = new Set(normalize(resumeText).split(/\s+/).filter(w => w.length > 4));
      let common = 0;
      jdTokens.forEach(t => { if (resTokens.has(t)) common++; });
      const ratio = common / Math.max(1, jdTokens.size);
      score = Math.min(68, Math.max(42, Math.round(ratio * 55 + 25)));
    }

    score = Math.max(30, Math.min(95, score));

    let tier = 'Skill Gap Detected';
    let badge = '🔴';
    let color = '#f85149';

    if (score >= 75) {
      tier = 'Strong Skill Match';
      badge = '🟢';
      color = '#3fb950';
    } else if (score >= 52) {
      tier = 'Moderate Skill Match';
      badge = '🟡';
      color = '#d29922';
    }

    return {
      status: 'ready',
      score: score,
      tier: tier,
      badge: badge,
      color: color,
      matchedSkills: matched.slice(0, 5),
      missingSkills: missing.slice(0, 4),
      totalJdSkills: jdSkills.length
    };
  }

  window.PrepInterviewMatcher = {
    calculateMatch: calculateMatch,
    extractSkills: extractSkills
  };
})();
