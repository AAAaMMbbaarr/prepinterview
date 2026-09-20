// PrepInterview Copilot - Release Configuration (Beta)
(function() {
  'use strict';

  const RELEASE_CONFIG = {
    FEEDBACK_URL: "https://docs.google.com/forms/d/e/1FAIpQLSfP0mZBcah9TZ6qwmtVBkeFUSUX180q5E9OyDy7w2lwMSbYnw/viewform?usp=header",
    SUPPORT_EMAIL: "REPLACE_ME",
    PRIVACY_POLICY_URL: "REPLACE_ME"
  };

  if (typeof window !== 'undefined') {
    window.PrepInterview = window.PrepInterview || {};
    window.PrepInterview.ReleaseConfig = RELEASE_CONFIG;
  }
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = RELEASE_CONFIG;
  }
})();
