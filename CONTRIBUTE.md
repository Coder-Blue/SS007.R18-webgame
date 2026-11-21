# CONTRIBUTE.md

## Setup

```bash
direnv allow
pnpm install
pnpm dev
```

`direnv` selects `.#default` on glibc and `.#musl` on musl hosts. Playwright
uses the host browser cache by default; `nix develop .#playwright` provides a
Nix Chromium and the required shared libraries.

## Before opening a change

```bash
pnpm lint
pnpm format:check
pnpm check:lines
pnpm check:emoji
pnpm check:domain
pnpm coverage
pnpm build
```

For a UI or scene change, also run the Playwright responsiveness spec and
review screenshots at `1440x900`, `768x1024`, `390x844` and `360x740`.

## Change shape

- One coherent outcome per branch and commit.
- Domain changes include unit tests and, when balance changes, a short note in
  the PR describing the before/after simulation.
- UI changes include Vietnamese copy and both desktop and mobile evidence.
- Scene changes include disposal verification and a note on pixel-ratio caps.
- Policy or event changes include the player-facing choices and the economic
  consequence of each branch.
- Never edit `TARGET.md` to match a shortcut. Update the implementation or
  record an explicit decision in `docs/adr/`.

## Review

A different agent instance reviews every change. The reviewer verifies the six
gates in `CI_CD_PIPELINE.md`, then applies the
`approved-by-thermo-nuclear-review` label. Auto-merge is allowed only after that
label exists and the branch is current with `main`.

## Saves and compatibility

The save schema version lives in `src/state/persistence.ts`. A breaking state
change bumps the version and adds a migration or a clean rejection message.
Never silently discard a save.
