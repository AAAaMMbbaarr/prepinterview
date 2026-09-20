# Changelog

All notable changes to PrepInterview Copilot are documented in this file.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.7] - 2026-09-20 (Beta Release)

### Fixed
- **Dedicated Search-Results Content Track Mount**: Cleanly mounted Copilot container inside `[data-component-type="lazy-column"]` Child 1 (content track) before existing job description.
- **Search Route Readiness Watcher**: Bounded readiness bootstrap on `/jobs/search/` with automatic startup preloading to ensure seamless card rendering without requiring page reload or manual saving.

## [1.0.6] - 2026-09-19 (Beta Release)

### Added
- **Beta Labeling**: Manifest named `"PrepInterview Copilot - Job Match & Interview Prep (Beta)"` with Beta tag in popup and card header.
- **Feedback Link**: Configurable `FEEDBACK_URL` and `SUPPORT_EMAIL` in `release-config.js`, linked from popup footer and card.
- **Known Limitations Section**: Plain-language disclosure in popup and documentation detailing one resume at a time, Indian college tiers, finite skills taxonomy, English post preference, and LinkedIn layout updates.
- **Privacy Disclosures**: Clear statements that resume text is stored locally only and never sent; deep-link Practice button sends only public job text, title, and company to prepinterview.online.
- **Clear All Data**: Popup action that completely deletes all stored extension data (resume, settings, preferences).
- **Four-Chip Factor Summary**: Compact visual chip row for Skills, Experience, Education, and Location status.
- **Score Looks Off? Diagnostic Exporter**: One-click clipboard copy of sanitized job matching metadata (zero resume or full JD text, zero network egress).
- **Release Automation**: `npm run release:check` and `npm run release:build` validation and packaging pipeline.

### Changed
- **Visual Weight**: Replaced heavy drop shadow and glowing blue border with 1px neutral border (`#30363d`), 8px border-radius, and collapsed height $\le 56$px.
- **Color Semantics**: Red restricted strictly to hard requirement gaps; amber for soft notes; neutral styling for skills.
- **Display Tiers**: Clean display names (`Strong Match`, `Good Match`, `Moderate Match`, `Reach Role`) with all internal IDs and scoring tests preserved.
- **Calibrated Copy**: Standardized single source of truth for band descriptions; completely removed all hiring outcome predictions ("Shortlist likely", "probability", "guarantee").
- **Relocation Switch**: Card toggle displayed conditionally only when on-site or hybrid location mismatch exists; persists preference and synchronizes with popup.
- **Floating Pill Docking**: Positioned clear of LinkedIn Messaging dock with `IntersectionObserver` hiding the pill when the main card is visible.

### Fixed
- **Duplicate Card Bug**: Single container mounting and sequence token locking preventing multiple cards on job navigation or toggle click.
- **Scroll Hijacking Bug**: Eliminated automated button click simulations during background extraction, ensuring smooth 60fps scrolling on LinkedIn.
