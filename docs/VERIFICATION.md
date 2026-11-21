# Verification Record

Date: 2026-11-21

This record lists commands that were actually run in the repository and the
results observed. A later change must rerun the relevant commands.

## Environment

| Check | Command | Result |
| --- | --- | --- |
| direnv load | `direnv allow` then `direnv exec . bash` | load completed in about 1.9 s |
| shell tools | `nix develop .#musl --command node --version` | Node v24.22.3, pnpm 12.4.2 via shim |
| flake evaluation | `nix flake check --no-build` | exit 0 |
| installed skills | `npx skills list` | 30 managed skills plus vendored agency-agents |

`.#default` and `.#musl` are the same cached toolchain to avoid compiling a
full `pkgsMusl` GCC on Chimera. `.#musl-full` remains available for an explicit
musl build. The shell provides a pnpm shim because Nix's pnpm binary crashes on
the Chimera loader.

## Static and domain gates

```
pnpm quality
EXIT 0
```

Observed sub-results:

```
Line budget: OK (all source files <= 500 lines)
Emoji audit: OK (119 text files scanned)
Domain boundary: OK (29 pure files)
Test Files  16 passed (16)
Tests       137 passed (137)

Statements   : 100% (659/659)
Branches     : 100% (346/346)
Functions    : 100% (118/118)
Lines        : 100% (574/574)
```

The 60-month deterministic playthrough test reaches the `architect` ending at
debt 14,167 with full road coverage on seed 7. Passive play runs into the debt
ceiling in 2024, which is the intended Act 2 pressure.

## Browser matrix

```
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=<nix chromium> pnpm exec playwright test
17 passed, 7 skipped
```

The skipped checks are desktop-only workspace/ceiling tests on the mobile
projects. The executed checks cover `1440x900`, `768x1024`, `390x844` and
`360x740`, assert no horizontal overflow, check 44 px touch targets, exercise
the tutorial, month advance, tariff ceiling rejection, save/reload/continue,
the June drought event, and the desktop workspace tabs.

## Production and deployment

```
pnpm build
EXIT 0

NITRO_PRESET=vercel pnpm build
EXIT 0

.vercel/output/functions/__server.func/index.mjs
.vercel/output/static/_shell.html
.vercel/output/config.json
```

The Node production server was started on port 3011 and returned HTTP 200 for
`/`. `vercel.json` delegates to the Vercel Build Output API and does not rewrite
requests away from the server function.

## Native binding fix

The host is Chimera Linux (musl), while the Nix dev shell supplies a glibc
Node. Rolldown picked its binding from `/usr/bin/ldd`, which is musl, and tried
to load the musl `.node` inside a glibc process. The repository patches
`rolldown@1.2.19`, `rolldown@1.3.3`, `oxlint@1.94.0` and `oxfmt@0.79.0` to
consult `process.report` first, and
`pnpm-workspace.yaml` declares both `glibc` and `musl` in
`supportedArchitectures` so the matching native package is present in a fresh
install. `pnpm dev` now starts in the direnv shell.

## Residual risks

- TanStack Start's Solid 2 line is an RC. The `request-scope` export patch is
  documented in `docs/adr/0001-solid2-tanstack-start.md` and must be removed
  when upstream publishes the export.
- Playwright needs a Chromium binary. Use `nix develop .#playwright` or set
  `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`.
- The game is balanced for a 60-month run. A future balance change must rerun
  `pnpm test` and the architect playthrough fixture.
