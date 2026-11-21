# CI_CD_PIPELINE.md

## Quality gates

The reviewer owns auto-merge. All six gates must pass with visible output:

1. `pnpm lint` and `pnpm format:check` exit 0. Lint includes the vendored
   anti-slop rules at error level.
2. `pnpm check:lines` confirms every owned source file is at most 500 lines
   and reports the vendored anti-slop plugin count as exempt. `pnpm check:emoji`
   confirms no emoji exists in source, docs, UI or config.
3. `pnpm check:domain` confirms `src/domain/` imports no `ui/`, `scene/`,
   `state/`, DOM, Three.js, Solid or browser globals.
4. `pnpm coverage` passes with 100 percent statements, functions and lines on
   `src/domain/` (branch threshold documented in `vitest.config.ts`).
5. `pnpm build` succeeds with zero TypeScript errors. Playwright verifies
   desktop `1440x900`, tablet `768x1024`, mobile `390x844` and narrow `360x740`.
6. An independent reviewer applies `approved-by-thermo-nuclear-review`.

Lefthook mirrors the fast gates on `pre-commit` and the full `pnpm quality`
suite on `pre-push`. A hook bypass is not evidence; CI still runs every gate.

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

`vercel.json` selects the official `tanstack-start` framework preset and nothing
else. Vercel runs the detected `pnpm build` command and consumes the Nitro Build
Output API, including the `/og.png` server route. Do not add a manual
`installCommand` or `buildCommand`; the preset owns them. Preview deployments do
not share browser storage with production.

## Post-merge

After merge, the integration role re-indexes Graphify, closes the issue, and
dispatches the next atomic issue using the template in `AGENT_DIRECTORY.md`.
