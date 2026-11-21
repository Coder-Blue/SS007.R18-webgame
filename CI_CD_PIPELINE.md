# CI_CD_PIPELINE.md

## Quality gates

The reviewer owns auto-merge. All six gates must pass with visible output:

1. `pnpm lint` and `pnpm format:check` exit 0.
2. `pnpm check:lines` and `pnpm check:emoji` confirm no file exceeds 500 lines
   and no emoji exists in source, docs, UI or config.
3. `pnpm check:domain` confirms `src/domain/` imports no `ui/`, `scene/`,
   `state/`, DOM, Three.js, Solid or browser globals.
4. `pnpm coverage` passes with 100 percent statements, functions and lines on
   `src/domain/` (branch threshold documented in `vitest.config.ts`).
5. `pnpm build` succeeds with zero TypeScript errors. Playwright verifies
   desktop `1440x900`, tablet `768x1024`, mobile `390x844` and narrow `360x740`.
6. An independent reviewer applies `approved-by-thermo-nuclear-review`.

Run everything locally with:

```bash
pnpm quality
pnpm exec playwright test
```

## Continuous integration

`.github/workflows/lint.yml` and `.github/workflows/test.yml` run on every pull
request to `main`, on every push to `main`, and by manual dispatch. Each job
uses a named GitHub environment (`Lint` or `Test`), so its status is visible in
the repository Deployments section as well as the Actions tab.

The lint workflow performs:

```bash
pnpm install --frozen-lockfile
pnpm lint
pnpm format:check
pnpm check:lines
pnpm check:emoji
pnpm check:domain
```

The test workflow performs:

```bash
pnpm install --frozen-lockfile
pnpm coverage
pnpm build
pnpm exec playwright install --with-deps chromium
pnpm exec playwright test
```

The Playwright spec boots the development server, checks overflow, touch target
sizes, panel behavior and the save/load flow, and captures screenshots as
artifacts. Nix users can run the same commands inside `nix develop`; musl hosts
select `.#musl` through `.envrc`.

## Deployment

Vercel builds with `pnpm build` and serves `.output/public`. The SPA fallback
rewrites unknown paths to `index.html`. `vercel.json` is the deployment source
of truth. Preview deployments do not share browser storage with production.

## Post-merge

After merge, the integration role re-indexes Graphify, closes the issue, and
dispatches the next atomic issue using the template in `AGENT_DIRECTORY.md`.
