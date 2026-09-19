// PrepInterview Copilot - DEPRECATED SHIM
// WARNING: scripts/data/skills.js is the single source of truth.
// This file exists only for backward compatibility with legacy consumers.
(function() {
  'use strict';

  let SkillsAPI = null;
  if (typeof require !== 'undefined') {
    try { SkillsAPI = require('./skills.js'); } catch (e) {}
  }
  if (typeof window !== 'undefined' && window.PrepInterview && window.PrepInterview.Skills) {
    SkillsAPI = SkillsAPI || window.PrepInterview.Skills;
  }

  // Generate flat array from skills if available, else legacy fallback
  let flatTaxonomy = [];
  if (SkillsAPI && SkillsAPI.SKILLS) {
    SkillsAPI.SKILLS.forEach(s => {
      flatTaxonomy.push(s.canonical.toLowerCase());
      (s.aliases || []).forEach(a => flatTaxonomy.push(a.toLowerCase()));
    });
  } else {
    flatTaxonomy = [
      "python", "javascript", "typescript", "java", "c++", "c#", "golang", "go", "ruby", "php", "rust", "swift", "kotlin",
      "react", "react.js", "next.js", "vue", "angular", "node", "node.js", "express", "fastapi", "django", "flask", "spring boot",
      "aws", "amazon web services", "azure", "gcp", "google cloud", "docker", "kubernetes", "k8s", "terraform", "ci/cd", "github actions",
      "postgresql", "postgres", "mysql", "mongodb", "redis", "elasticsearch", "kafka", "rabbitmq", "dynamodb", "graphql", "rest api", "restful",
      "microservices", "system design", "distributed systems", "data structures", "algorithms", "scalability", "linux", "git",
      "machine learning", "deep learning", "nlp", "llm", "genai", "pytorch", "tensorflow", "computer vision", "pandas", "numpy", "scikit-learn",
      "founder office", "founders office", "chief of staff", "strategy", "execution", "startups", "high-growth", "operations", "scaling", "generalist", "cross-functional", "bizops", "business operations",
      "product management", "product manager", "product strategy", "product sense", "prd", "roadmap", "user research", "wireframing", "agile", "scrum", "jira",
      "a/b testing", "user stories", "retention", "churn", "funnel analysis", "north star metric", "sql", "tableau", "powerbi", "amplitude", "mixpanel",
      "google analytics", "customer discovery", "mvp", "feature prioritization", "stakeholder management", "program manager", "program management",
      "growth", "growth product", "onboarding", "lifecycle marketing", "conversion rate", "independent projects", "ai tools", "analytical thinking", "problem solving",
      "market sizing", "go-to-market", "gtm", "financial modeling", "dcf", "unit economics", "p&l", "profit and loss", "vendor management",
      "roi", "business case", "valuation", "competitive analysis", "due diligence", "consulting frameworks", "swot", "m&a",
      "seo", "sem", "ppc", "performance marketing", "cac", "ltv", "hubspot", "salesforce", "lead generation", "cold outreach",
      "enterprise sales", "content strategy", "email marketing", "social media", "brand strategy", "copywriting", "growth hacking",
      "talent acquisition", "recruiting", "employee relations", "performance management", "onboarding", "compensation", "compliance", "payroll"
    ];
  }

  const taxonomyData = {
    TAXONOMY: flatTaxonomy,
    _deprecated: true,
    _source: 'scripts/data/skills.js'
  };

  if (typeof window !== 'undefined') {
    window.PrepInterview = window.PrepInterview || {};
    window.PrepInterview.Taxonomy = taxonomyData;
  }
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = taxonomyData;
  }
})();
