# Changelog

All notable changes are recorded here. The format follows Keep a Changelog and
the project uses semantic versioning for save-compatible releases.

## [Unreleased]

### Changed

- Self-hosted Be Vietnam Pro WOFF2 subsets serve the UI and preload manifest;
  full TTF weights remain for the Open Graph image.
- The title screen uses a lightweight CSS/SVG poster and renders the Three.js
  scene only during play, so the first visit does not pay for the renderer.
- The game surface, save menu and tutorial are lazy chunks; the current initial
  shell preloads 620.5 kB minified / 209.0 kB gzip with no Three.js or GSAP.
- The title and HUD reserve their layout, preload the visible font weights, and
  expose named meters, a single main landmark, accessible mobile tabs and the
  reduced-motion switch.

### Added

- Canonical, Open Graph locale/site metadata, a crawlable `sitemap.xml` and a
  dynamic `robots.txt` for the public deployment.

### Design

- Applied the unslop pass to the title, HUD, docks, panels, tables, modals and
  mobile sheet: quieter chrome, 4px spacing, sentence-case labels, metric-weight
  type, hairline borders, named meter values and reduced decorative motion.

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

## [2.0.0] - 2026-11-23

### Changed

- Replaced the village rice economy with the 60-month national power grid
  simulation: competitive procurement, MW dispatch, 500kV/220kV coverage,
  six-tier retail tariffs and autonomous State price review.
- Rebuilt the Three.js scene as a national grid map with hydro dams, thermal
  stacks, solar/wind farms, pylons, substations and load centers; added fuel
  crisis, drought, privatization and blackout world states.
- Reworked the HUD around tactical pause, 1x/2x/3x speed, dual trust gauges,
  long-term missions, media pressure, project progress and monthly reports.
- Rewrote the domain catalog with four scripted Big Events, ten post-event
  decisions, DPPA/VREM/NSMO reforms, N-2 recovery and calibrated structural
  deficit near `-45,000 tỷ` with debt below `100,000 tỷ`.

### Added

- Installed the `ui-ux-pro-max` design skill and applied its data-dense
  dashboard guidance with the unslop nine-pass polish.
- Guided Chairman briefing with a five-step spotlight tutorial.
- Live before/after previews for dispatch, supplier and tariff changes.
- Stacked revenue/cost breakdown chart, trust trend chart and generation mix.
- State approval dialog with a deterministic audit of fuel, deficit, inflation,
  debt and public mood.
- Save schema version 2 with `grid-save` envelopes.
