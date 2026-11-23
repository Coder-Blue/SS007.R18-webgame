# Verification Record

Date: 2026-11-23

This record lists commands that were actually run in the repository and the
results observed. A later change must rerun the relevant commands.

## Environment

| Check | Command | Result |
| --- | --- | --- |
| direnv load | `direnv allow` then `direnv exec . bash` | load completed |
| installed skills | `npx skills list` | ui-ux-pro-max added at the pinned commit |
| browser | Playwright Chromium headless shell patched to the Nix glibc/browser library closure | launches and serves the E2E suite |

The local Nix Playwright browser cache could not start under the host loader;
`nix build` of the browser library closure plus a patched headless shell fixed
the loader mismatch. CI installs Chromium through `playwright install --with-deps`.

## Static and domain gates

```
pnpm quality
EXIT 0
```

Observed sub-results:

```
Line budget: OK (owned source files <= 500 lines; 36 vendored files exempt)
Emoji audit: OK (173 text files scanned)
Domain boundary: OK (32 pure files)
Test Files  25 passed (25)
Tests       181 passed (181)

Statements   : 100% (826/826)
Branches     : 100% (460/460)
Functions    : 100% (160/160)
Lines        : 100% (709/709)
```

The deterministic 60-month playthrough test completes at full coverage with a
cumulative result near `-45,740 tỷ` and debt near `89,690 tỷ`, below the
`100,000 tỷ` failure cap.

## Bundle

```
pnpm build
pnpm check:bundle
```

All 15 client chunks are below 500 kB minified. The initial shell preloads
628.5 kB minified / 211.5 kB gzip and contains no Three.js or GSAP. The deferred
`create-power-scene-*.js` chunk is loaded only after the game starts.

## Favicon set

```
public/favicon.png:          PNG image data, 64 x 64, 8-bit/color RGBA
public/favicon.ico:          MS Windows icon resource - 4 icons, 16x16, 32x32, 48x48, 64x64
public/apple-touch-icon.png: PNG image data, 180 x 180, 8-bit/color RGB
```

The SVG uses the game palette (`#07121b`, `#39d7ff`, `#f2d06b`, `#5bd6a2`) and
a transmission-pylon mark. The SEO test verifies the 16/32/48/64 ICO frames, every declared PNG
dimension, Apple's opaque color type and the Nitro/Vercel cache rules;
`tests/e2e/branding.spec.ts` fetches all four assets and checks all four
versioned document links at every viewport.

## De-slop pass

The theme now uses oklch tokens and Tailwind utilities in components. The
quarter summary aggregates the last three ledgers into one report; its monthly
toast is suppressed, its continue action is sticky on mobile, and the
integrity mix shares always sum to 100. Overview, finance and grid empty/action
states were rewritten with Tailwind utilities and shared empty states.

```
Tests       181 passed (181)
Playwright  78 passed, 14 skipped
```

The summary selector tests cover two- and three-month windows, previous-quarter
comparison, zero-energy tariff fallback and closing balance selection. The
summary browser test runs at 1440x900, 768x1024, 390x844 and 360x740 and checks
that no stat cards remain, the toast is gone and the 44 px continue action is
inside the viewport.

## Browser matrix

```
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/tmp/grid-browser/chrome-headless-shell \
  pnpm exec playwright test
78 passed, 14 skipped
```

The skipped checks are desktop-only workspace/overlap tests on mobile projects,
the short-wide tour check outside the desktop project, and the production-chunk
test in dev mode. The suite covers `1440x900`, `1366x768`, `768x1024`, `390x844`
and `360x740`, no horizontal overflow, 44 px controls,
mobile speed selectors and reserve, pause/resume, month advance, tutorial panel
tours with an uncovered scene focus anchor, tutorial reset, hidden map text
descriptions, the WebGL fallback dashboard action, mobile overlay clearance
(scene badges 172, toast 210, pause 280 at 390x844 and 360x740; 168/206/270 at
768x1024), mobile sheet tab wrapping and reactive policy/overview switching,
save/reload/continue, scene chunk deferral and failure recovery, named meters,
Iconify without API calls, OG metadata, chart/table overlap assertions and
screenshots. A CDP accessibility probe at 1440x900 returned one image node named
"Bản đồ lưới điện quốc gia" with the full coverage/weather/reserve/reform
description and no duplicate paragraph in the reading order.

The production chunk check was also run against the built server:

```
PLAYWRIGHT_SERVER=start PLAYWRIGHT_PORT=3210 \
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/tmp/grid-browser/chrome-headless-shell \
  pnpm exec playwright test tests/e2e/game.spec.ts --project=desktop \
  --grep "deferred production chunk"
1 passed
```

The final `main` push workflow for the polish merge passed both gates: lint in
22 s, and `unit and build` plus `browser` in 8m52s. Its production smoke run
reported 14 passed / 1 skipped, and the responsive browser run reported 70
passed / 14 skipped.

The headless shell exposes no WebGL in this container, so the scene factory
shows the graceful `Bản đồ 3D cần WebGL` fallback during E2E. The same scene is
exercised by typecheck/build; a WebGL-capable browser renders it normally.
