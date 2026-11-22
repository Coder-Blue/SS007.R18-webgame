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
Emoji audit: OK (159 text files scanned)
Domain boundary: OK (31 pure files)
Test Files  22 passed (22)
Tests       170 passed (170)

Statements   : 100% (828/828)
Branches     : 100% (470/470)
Functions    : 100% (161/161)
Lines        : 100% (710/710)
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
624.2 kB minified / 210.1 kB gzip and contains no Three.js or GSAP. The deferred
`create-power-scene-*.js` chunk is loaded only after the game starts.

## Browser matrix

```
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/tmp/grid-browser/chrome-headless-shell \
  pnpm exec playwright test
61 passed, 11 skipped
```

The skipped checks are desktop-only workspace/overlap tests on mobile projects
and the production-chunk test in dev mode. The suite covers `1440x900`,
`768x1024`, `390x844` and `360x740`, no horizontal overflow, 44 px controls,
mobile speed selectors and reserve, pause/resume, month advance, tutorial panel
tours with an uncovered scene focus anchor, tutorial reset,
save/reload/continue, scene chunk deferral and failure recovery, named meters,
Iconify without API calls, OG metadata, chart/table overlap assertions and
screenshots.

The production chunk check was also run against the built server:

```
PLAYWRIGHT_SERVER=start PLAYWRIGHT_PORT=3210 \
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/tmp/grid-browser/chrome-headless-shell \
  pnpm exec playwright test tests/e2e/game.spec.ts --project=desktop \
  --grep "deferred production chunk"
1 passed
```

The final `main` push workflow passed both gates: lint in 23 s, and
`unit and build` plus `browser` in 6m35s. Its production smoke run reported
12 passed / 1 skipped, and the responsive browser run reported 61 passed /
11 skipped.

The headless shell exposes no WebGL in this container, so the scene factory
shows the graceful `Bản đồ 3D cần WebGL` fallback during E2E. The same scene is
exercised by typecheck/build; a WebGL-capable browser renders it normally.
