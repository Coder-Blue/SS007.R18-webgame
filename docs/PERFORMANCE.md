# Performance Optimization Report

## 1. Architecture Detected

- Frontend: SolidJS 2 with `@solidjs/web`, TanStack Start (Solid), TanStack Solid Query, Tailwind CSS 4, UI SDK for Solid, Iconify subset, Three.js and GSAP.
- Backend: Nitro 3 through the Vite plugin. The only server handlers are the SSR shell, `/og.png` (Takumi) and `/sitemap.xml` / `/robots.txt`.
- Database: none. Game state lives in `localStorage` and is validated with Valibot.
- Hosting: Vercel with the `tanstack-start` preset.
- CDN: Vercel's managed edge network and immutable hashed assets.
- Cache: Vercel edge caching for assets; no application cache layer is needed because there is no API or database.

## 2. Baseline

Live production on `https://monopoly-nhom5.vercel.app`, Lighthouse CLI mobile:

| Metric | Before |
|---|---:|
| Lighthouse Performance | 54 |
| Lighthouse Accessibility | 100 |
| Lighthouse Best Practices | 100 |
| Lighthouse SEO | 100 |
| LCP | 4.1 s |
| TBT | 7,100 ms |
| CLS | 0 |
| Total transfer | 628 KiB |

Local production build through a gzip proxy, same harness used for the after run:

| Strategy | Performance | LCP | TBT | CLS | Transfer |
|---|---:|---:|---:|---:|---:|
| Mobile | 47 | 6.3 s | 142,560 ms | 0.009 | 933 KiB |
| Desktop | 67 | 1.1 s | 19,550 ms | 0 | 933 KiB |

The local TBT is dominated by the 3D scene running under software rendering; the live mobile TBT of 7.1 s shows the same user-facing problem. Initial client JavaScript was 1,268.6 kB minified (384.3 kB gzip): a single `routes-*.js` chunk of 865.2 kB included Three.js, GSAP, the title screen and every game panel.

## 3. Changes Implemented

### Frontend

- Rendered a 24 kB desktop / 9.2 kB mobile WebP village poster on the title screen and mounted the Three.js scene only during play.
- Dynamically imported the scene factory after the first paint during idle time, with single-flight loading, disposal on failure and a visible retry action.
- Removed GSAP from the HUD number tween; `AnimatedNumber` now uses a 550 ms `requestAnimationFrame` quadratic ease.
- Replaced the five full TTF faces in the UI with ten WOFF2 Latin/Vietnamese subsets; preloaded the 400/600/700/800 pairs used by the title screen.
- Removed the title heading's opacity entrance so LCP paints immediately.
- Reserved the Continue button slot with a disabled button instead of inserting it after hydration, and added a cheap envelope check for `hasAnySave`.
- Removed the infinite title prompt pulse and reduced decorative motion.
- Applied the unslop craft pass: 4px spacing rhythm, sentence-case labels, metric-weight type, hairline borders, quiet chrome, one gold accent, named meters and larger small text.
- Added one main landmark, a hidden game `<h1>`, named meters, a named reduced-motion switch, per-tab mobile `aria-expanded`, `aria-pressed` sheet tabs, and WCAG AA gold/muted text tokens.
- Added canonical, `og:url`, `og:locale`, `og:site_name`, `twitter:description`, `twitter:image:alt`, `sitemap.xml`, a dynamic `robots.txt`, and a pre-paint reduced-motion preference script.
- Fixed the social image fallback from the retired `ss007-r18-webgame.vercel.app` host to `monopoly-nhom5.vercel.app`.

### API / Backend

- No API endpoints exist. `/og.png` keeps its one-day image cache; `/sitemap.xml` and `/robots.txt` are generated from `SITE_URL` and cached for one day.
- SSR responses remain `public, max-age=0, must-revalidate` so a new deployment never serves HTML that references removed hashed chunks.

### Database

- Not applicable. There is no database, ORM, connection pool, query layer or index.

### Infrastructure

- Vercel already supplies the CDN, Brotli/gzip, HTTP/2, TLS and managed load balancing. No new CDN, reverse proxy, Redis or load balancer was added.
- Hashed `/assets/*` remain one-year immutable through Vercel. Fonts and village posters use a thirty-day shared cache without `immutable`. Favicons use thirty days and `robots.txt` one day.

### Dependencies / Build

- Added Vite 8 `rolldownOptions.output.codeSplitting` groups for Three.js, Three core and GSAP.
- Added `pnpm check:bundle` to `pnpm quality` and CI. It fails any client chunk over 500 kB and fails if the initial shell preloads Three.js or GSAP.
- Added a production-server Playwright smoke run (`PLAYWRIGHT_SERVER=start`) that asserts the scene chunk is absent on the title and loads from `/assets/create-village-scene-*.js` after starting the game.
- Audited runtime dependencies; every declared package is referenced. No package was removed.

## 4. Checklist

- Cache API responses: Not applicable. There are no API endpoints; static assets have an explicit cache policy.
- Database indexes: Not applicable. There is no database.
- Image compression: Implemented. WebP posters are 24 kB and 9.2 kB with explicit dimensions.
- Loading skeletons: Implemented. The scene has status and retry states; existing panel loading states are preserved.
- Expensive query caching: Not applicable. There is no database or remote query.
- N+1 prevention: Not applicable. There is no database.
- Debounced inputs: Not applicable. All sliders and inputs are local and immediate.
- Code splitting: Implemented. The scene is game-only plus Three.js/GSAP vendor chunks.
- CDN: Already handled. Vercel's managed edge CDN was already present and is used.
- Server-side caching: Not applicable. There are no expensive server reads; static-shell and asset caching cover the surface.
- Lighthouse audit: Implemented. Mobile and desktop run against a production build.
- API payload compression: Already handled. Vercel Brotli/gzip; there is no JSON API.
- Reduced unnecessary re-renders: Implemented. Solid fine-grained updates and an rAF counter tween; no broad context additions.
- JS/CSS minification: Implemented. Vite production build.
- Lazy loading: Implemented. The 3D scene is dynamic; the title poster is eager because it is above the fold.
- Deferred non-critical scripts: Implemented. There are no third-party scripts; the scene is dynamically imported.
- Removed unused npm packages: Implemented. Dependency audit found none unused.
- Database connection pooling: Not applicable. There is no database.
- Load balancer assessed/configured: Already handled. Vercel-managed; no app-level balancer needed.

## 5. Results

Local production build through the same gzip proxy:

| Metric | Before | After | Change |
|---|---:|---:|---:|
| Lighthouse Performance, mobile | 47 | 93 | +46 |
| Lighthouse Performance, desktop | 67 | 100 | +33 |
| LCP, mobile | 6.3 s | 3.2 s | -3.1 s |
| LCP, desktop | 1.1 s | 0.7 s | -0.4 s |
| TBT, mobile | 142,560 ms | 10 ms | eliminated |
| TBT, desktop | 19,550 ms | 0 ms | eliminated |
| CLS, mobile | 0.009 | 0.001 | -0.008 |
| CLS, desktop | 0 | 0.001 | negligible |
| Initial JS | 1,268.6 kB min / 384.3 kB gzip | 641.9 kB min / 214.1 kB gzip | -49.4% min / -44.3% gzip |
| Deferred game scene | in the initial chunk | 630.0 kB min / 169.9 kB gzip after start | moved off first load |
| Initial transfer | 933 KiB | 419 KiB | -55% |
| Slowest API | none | none | n/a |
| Slowest DB query | none | none | n/a |

Live production after the performance and CWV PRs: mobile 92 / accessibility 100 / best practices 100 / SEO 100, LCP 3.2 s, TBT 0 ms, CLS 0, total transfer 395 KiB; desktop 97 / 100 / 100 / 100, LCP 1.1 s, CLS 0.007. The unslop build keeps mobile 93 and desktop 100 in the local gzip harness.

## 6. Remaining Bottlenecks

- Mobile LCP is 3.2 s in the simulated slow-4G run, close to but above the 2.5 s target. The remaining cost is the 25 kB gzip render-blocking stylesheet and font startup; a critical-CSS split or a smaller title-only font subset is the next step.
- Starting a game still downloads Three.js and GSAP (about 170 kB gzip). This is after user intent and does not affect the title benchmark.
- The initial route chunk still contains the game panels and HUD because `GameShell` imports them statically. Lighthouse reports unused JavaScript on the title; lazy-loading the game UI after Start is the next safe reduction.
- Chrome UX Report has no field data for this project yet, so the scores are lab measurements.

## 7. Files Changed

- `src/ui/scene/title-poster.tsx`, `src/ui/scene/village-canvas.tsx`, `src/ui/app/game-shell.tsx`
- `src/ui/components/animated-number.tsx`, `src/ui/components/base.tsx`
- `src/routes/__root.tsx`, `src/routes/index.tsx`, `src/site.ts`, `routes/sitemap.xml.ts`, `routes/robots.txt.ts`
- `src/styles/*.css`, `src/state/persistence.ts`
- `public/fonts/*.woff2`, `public/images/village-poster-*.webp`
- `vite.config.ts`, `nitro.config.ts`, `vercel.json`, `scripts/check-bundle.mjs`
- `playwright.config.ts`, `tests/e2e/game.spec.ts`, `tests/e2e/font-loading.spec.ts`, `tests/fonts.test.ts`, `tests/seo.test.ts`
- `AGENTS.md`, `AGENT_DIRECTORY.md`, `SKILL.md`, `CODEBASE.md`, `CHANGELOG.md`, `CI_CD_PIPELINE.md`, `.github/workflows/test.yml`
- `.agents/skills/unslop/**` and its runtime links

## 8. Manual Infrastructure Steps

- None required. Vercel provides the CDN, Brotli/gzip and load balancing.
- If the project moves to a custom domain, set `VITE_SITE_URL` in Vercel so canonical, Open Graph, sitemap and robots stay aligned.
- PageSpeed Insights API quota returned HTTP 429 during this work, so the report uses the Lighthouse CLI against the production build and the public deployment instead.

## Evidence Commands

```bash
pnpm quality
pnpm check:bundle
PLAYWRIGHT_SERVER=start PLAYWRIGHT_PORT=3108 \
  PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/nix/store/.../bin/chromium \
  pnpm exec playwright test tests/e2e/game.spec.ts tests/e2e/font-loading.spec.ts --project=desktop
CHROME_PATH=/nix/store/.../bin/chromium npx lighthouse@12.8.2 <url> \
  --only-categories=performance,accessibility,best-practices,seo
```

`pnpm quality` final output: 22 test files / 173 tests passed, lint, format, line budget, emoji, domain boundary, coverage, production build and bundle budget all green.
