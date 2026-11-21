# Development

## Environment

```bash
direnv allow
direnv exec . bash
pnpm install
pnpm dev
```

`direnv` reads `.envrc`, detects musl with `ldd /bin/sh`, and enters
`.#musl` or `.#default`. Both point at the lean cached toolchain so `direnv
allow` is measured in seconds: Node.js, git, TypeScript and the Playwright
driver. The shell installs a small `pnpm` shim backed by
`npm exec pnpm@12.4.2`; Nix's packaged pnpm crashes on Chimera's loader. Use
`nix develop .#playwright` for Nix Chromium and `.#musl-full` only when a true
`pkgsMusl` toolchain is required.

`@tanstack/solid-start@2.0.0-rc.11` declares `solid-js >=2` but its pinned
`@tanstack/start-server-core@1.169.45` lacks the `request-scope` export used by
the Solid handler. The project applies a `pnpm patch` that maps
`@tanstack/start-server-core/request-scope` to
`dist/esm/internal-request-response.js`, which exports the same
`finalizeResponse` and `withStartRequest` symbols. The patch is checked in under
`patches/`; `pnpm install` reapplies it. Remove it once upstream publishes the
export.

Rolldown, oxlint and oxfmt also receive a small patch: their libc detection
reads `/usr/bin/ldd` before `process.report`, which misidentifies a glibc Node
inside the Nix shell on Chimera. The patches consult the runtime report first
and `pnpm-workspace.yaml` installs both glibc and musl native bindings.

## Git hooks

`pnpm install` runs `lefthook install` through the `prepare` script. The
checked-in `lefthook.yml` defines the local gates:

- `pre-commit`: oxlint on staged TypeScript, oxfmt check on staged source, the
  file budget, emoji, layer-boundary audits, and the Vitest suite.
- `pre-push`: the full `pnpm quality` gate.

Run the hooks manually with `pnpm exec lefthook run pre-commit`. Use
`LEFTHOOK=0` or `git commit --no-verify` only for an emergency, and state why in
the pull request. CI repeats every gate, so a bypass cannot merge unreviewed.
`@iconify-icon/solid@3.0.6` targets Solid 1's removed `attr:` namespace and
imports Solid 1 JSX types. A checked-in pnpm patch removes the `attr:` prefix
and gives the custom element a local attribute contract so the wrapper compiles
against Solid 2. Remove the patch when upstream ships Solid 2 support.

Icons are named in `src/ui/components/icon-names.ts`. The
`build/iconify-subset.ts` Vite plugin reads `@iconify-json/lucide` and
`@iconify-json/tabler`, then emits a virtual module that registers only those
names with `addCollection`. Add a name to both places; do not commit SVG.

## Source layout

- `src/domain`: pure economy and state transitions.
- `src/state`: signals, TanStack Query, persistence.
- `src/scene`: Three.js and GSAP factories.
- `src/ui`: Solid components, charts, icons, Vietnamese copy.
- `src/routes`: TanStack Start file routes.

Do not import across the arrows in reverse. `pnpm check:domain` enforces the
pure boundary.

## Tests

```bash
pnpm test
pnpm coverage
```

Vitest includes `tests/**/*.test.ts`. Coverage is limited to `src/domain/` and
enforces 100 percent statements, functions and lines with a documented branch
threshold. Add table tests for boundary values. Never lower a threshold to hide
a missing branch.

## Browser verification

```bash
pnpm build
nix develop .#playwright --command pnpm exec playwright test
# or set PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH to a Chromium binary
```

The spec boots Vite preview, checks `1440x900`, `768x1024`, `390x844` and
`360x740`, asserts no horizontal overflow, checks 44 px controls, exercises the
tutorial, advances a month, opens the mobile drawer, and verifies save/export.
Screenshots are written to `test-results/`.

## Saves

Three localStorage slots plus `autosave`. sessionStorage holds the current slot,
active panel and tutorial acknowledgement. Export produces a JSON file with the
schema version. Import validates with Valibot and rejects malformed or future
versions without overwriting a slot.

To reset a save during development, open the browser console and remove keys
prefixed with `dqkt:`. The UI also offers a reset in Settings.

## Balance work

Use `scripts/simulate.ts` to run a deterministic session without a browser:

```bash
pnpm exec tsx scripts/simulate.ts --months 60 --strategy balanced
```

The script prints monthly ledger rows and the ending. Keep a short before/after
note in the PR when changing a constant in `src/domain/constants.ts`.
