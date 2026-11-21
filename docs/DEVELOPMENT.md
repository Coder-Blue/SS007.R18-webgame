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
