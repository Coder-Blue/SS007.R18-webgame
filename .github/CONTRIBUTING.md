# Contributing to Doc Quyen Kinh Te

Thanks for helping improve *The Rice Monopoly*. This repository keeps a small,
strict surface: a pure economic simulation, a Solid client, a Three.js village,
and a documented agent workflow. Read this guide before opening a change.

## Code of Conduct

Participation is covered by the [Code of Conduct](./CODE_OF_CONDUCT.md). Report
unacceptable behaviour to the maintainer through GitHub.

## Questions, bugs and features

- Search the [issue tracker](https://github.com/Coder-Blue/SS007.R18-webgame/issues)
  before opening a new issue.
- Use the bug report form for a reproducible defect. Include the viewport, the
  game month, the save slot state and console output.
- Use the feature request form for a design proposal. Large features should be
  discussed in an issue before implementation.
- Security reports follow [SECURITY.md](../SECURITY.md) and must not be public
  issues.

## Environment

The supported path is Nix with direnv on Linux or macOS:

```bash
direnv allow
pnpm install
pnpm dev
```

`direnv` selects `.#default` on glibc and `.#musl` on musl hosts. On Linux,
`nix develop .#playwright` supplies Chromium and the shared libraries it needs.
macOS uses the host browser cache and `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`.
Node 24 and pnpm 12 are the supported runtime versions.

## Quality gates

Every change must pass the same gates locally and in CI:

| Command | What it proves |
| --- | --- |
| `pnpm lint` | oxlint, anti-slop rules and project rules pass |
| `pnpm format:check` | oxfmt reports no diff |
| `pnpm check:lines` | no source file exceeds 500 lines |
| `pnpm check:emoji` | no emoji in source, UI, docs or config |
| `pnpm check:domain` | `src/domain/` has no UI, scene, state or browser imports |
| `pnpm coverage` | domain statements, functions and lines stay at 100 percent |
| `pnpm build` | Vite production build and zero TypeScript errors |
| `pnpm check:bundle` | every client chunk is at most 500 kB and the shell defers Three.js and GSAP |
| `pnpm exec playwright test` | desktop, tablet, mobile and narrow layouts behave |

Run the static suite with `pnpm quality`. Run the browser suite separately.
The `lint` and `test` GitHub workflows mirror these commands and publish their
status in the repository Deployments section through the `Lint` and `Test`
environments.

## Git hooks

`pnpm install` runs `lefthook install` through the `prepare` script. The
checked-in `lefthook.yml` runs the fast gates on every commit:

- oxlint on staged TypeScript and oxfmt check on staged source;
- the file budget, emoji and layer-boundary audits;
- the Vitest suite.

`pre-push` runs the full `pnpm quality` suite. Run the hooks manually with
`pnpm exec lefthook run pre-commit`. Use `LEFTHOOK=0` or `git commit --no-verify`
only for an emergency, and state why in the pull request. CI still runs every
gate.

## Change shape

- One coherent outcome per branch, pull request and commit.
- Domain changes include unit tests. Balance changes include a before/after
  simulation note in the pull request.
- UI changes include Vietnamese copy, keyboard and focus behaviour, and
  screenshots at `1440x900` and `390x844`. Also check `360x740`.
- Scene changes include disposal verification and a note on the pixel-ratio
  cap.
- Policy, tariff or event changes explain each player-facing branch and its
  economic consequence.
- Never edit `TARGET.md` to match a shortcut. Change the implementation or
  record a decision in `docs/adr/`.

## Layer rules

Dependency direction is one-way:

```text
routes -> ui -> state -> domain
scene  -> domain
```

`src/domain/` is pure: no DOM, browser global, Solid signal, Three.js or
`Date.now`/`Math.random`. Randomness is a seeded value threaded through ticks.
There are no classes, no prototype mutation and no mutation of readonly input.
Files stay under 500 lines and preferably under 250.

## Vietnamese copy

Every in-game string is Vietnamese written inline in the Solid component that
renders it. Domain events keep their keys, and the event modal resolves them
through a component-local copy map in `src/ui/modals/event-modal.tsx`. Code,
identifiers, comments, tests, docs and commits are English. The UI must render
correctly with Be Vietnam Pro. Do not add emoji; use the icon component instead.

## Commit messages

Commits follow [COMMIT_CONVENTION.md](./COMMIT_CONVENTION.md):

```text
feat(domain): price the fourth household tier above the third
fix(scene): release terrain geometry on unmount
docs: explain the N-2 recovery schedule
```

Keep formatting changes separate from behaviour changes.

## Pull requests

1. Branch from `main` as `feat/issue-<id>-<slug>` or `fix/issue-<id>-<slug>`.
2. Keep the pull request focused on one issue.
3. Fill the pull request template, including the gates you ran and the evidence.
4. The `lint` and `test` workflows must pass. The reviewer checks the six gates
   in [CI_CD_PIPELINE.md](../CI_CD_PIPELINE.md).
5. An independent reviewer applies the `approved-by-thermo-nuclear-review`
   label. Auto-merge is allowed only after that label exists and the branch is
   current with `main`.
6. The author of a change never reviews or merges that change.

Reviewers use the role definitions in [AGENT_DIRECTORY.md](../AGENT_DIRECTORY.md).
When Herdr is available, review runs in a separate pane from a different agent
instance than the author.

## Saves and compatibility

The save schema version lives in `src/state/persistence.ts`. A breaking state
change bumps the version and adds a migration or a clear rejection message in
Vietnamese. Never silently discard a save. Imported JSON is validated with
Valibot and rejected on failure.

## Documentation

Update the affected document in the same change:

- `AGENTS.md`: rules for every agent runtime.
- `CODEBASE.md`: implemented architecture and economy.
- `docs/DEVELOPMENT.md`: local workflow, saves and verification.
- `docs/VERIFICATION.md`: gate evidence and residual risks.
- `SKILL.md`: installed skill matrix and skill routing.
