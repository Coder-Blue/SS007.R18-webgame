# Changelog

All notable changes are recorded here. The format follows Keep a Changelog and
the project uses semantic versioning for save-compatible releases.

## [Unreleased]

### Changed

- Self-hosted Be Vietnam Pro WOFF2 subsets serve the UI and preload manifest;
  full TTF weights remain for the Open Graph image.
- The title screen uses a lightweight village poster and renders the Three.js
  scene only during play, so the first visit does not pay for the renderer.
- The title and HUD reserve their layout, preload the visible font weights, and
  expose named meters, a single main landmark, accessible mobile tabs and the
  reduced-motion switch.

### Added

- Canonical, Open Graph locale/site metadata, a crawlable `sitemap.xml` and a
  dynamic `robots.txt` for the public deployment.

## [1.0.0] - 2026-11-21

### Added

- SolidJS 2 + TanStack Start (Solid) foundation with TanStack Solid Query game
  loop.
- Pure domain economy: market walk, production, cross-subsidy tariffs, debt,
  N-2 recovery, infrastructure, metrics, events, endings and actions.
- Vietnamese UI with Be Vietnam Pro, responsive desktop and mobile HUD.
- Isometric Three.js village with roads, paddies, huts, workshops and fleet.
- GSAP camera and seasonal transitions.
- Three save slots, autosave, JSON export/import with Valibot validation.
- Nix flakes for glibc and musl, direnv detection, Vercel configuration.
- Vitest domain suite and Playwright responsive checks.
- Agent, architecture and contribution documentation.
