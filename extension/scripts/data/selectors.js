// PrepInterview Copilot - LinkedIn DOM Selectors & Scrapers
(function() {
  'use strict';

  const Selectors = {
    detailsPane: [
      '.scaffold-layout__detail',
      '.jobs-search__job-details--container',
      '.jobs-search__job-details',
      'main .job-view-layout',
      '.jobs-details__main-content',
      '.job-details-jobs-unified-top-card'
    ],
    jobTitle: [
      '.job-details-jobs-unified-top-card__job-title',
      '.jobs-unified-top-card__job-title',
      '.job-details-jobs-unified-top-card h1',
      '.jobs-unified-top-card h1',
      '.scaffold-layout__detail h1',
      'h1.t-24'
    ],
    companyName: [
      '.job-details-jobs-unified-top-card__company-name',
      '.jobs-unified-top-card__company-name',
      '.job-details-jobs-unified-top-card__primary-description a',
      '.scaffold-layout__detail a[href*="/company/"]'
    ],
    jobLocation: [
      '.job-details-jobs-unified-top-card__primary-description-container',
      '.jobs-unified-top-card__primary-description',
      '.jobs-unified-top-card__bullet',
      '.jobs-unified-top-card__workplace-type',
      '.scaffold-layout__detail .jobs-unified-top-card__primary-description'
    ],
    expandMoreButtons: [
      'button.show-more-less-html__button',
      'button.show-more-less-html__button--more',
      'button[aria-label*="more description"]',
      'button[aria-label*="see more"]',
      '.jobs-description button',
      '.scaffold-layout__detail button'
    ],
    jobDescriptionContainers: [
      '#job-details',
      '.jobs-description__content',
      '.jobs-description-content__text',
      '.jobs-box__html-content',
      '.jobs-description',
      'article.jobs-description__container',
      'article'
    ],
    junkToRemove: [
      '#prepinterview-copilot-card',
      '.jobs-premium-applicant-insights',
      '[data-view-name*="applicant-insights"]',
      '.jobs-unified-top-card__applicant-count',
      '.jobs-premium-insights',
      '.hiring-team',
      '.jobs-poster-profile',
      '.jobs-company__box',
      '.artdeco-card',
      'button',
      'svg',
      '[role="button"]'
    ]
  };

  if (typeof window !== 'undefined') {
    window.PrepInterview = window.PrepInterview || {};
    window.PrepInterview.Selectors = Selectors;
  }
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = Selectors;
  }
})();
