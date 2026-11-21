# AGENTS.md

`SS007.R18-webgame` is **Doc Quyen Kinh Te** (*The Rice Monopoly*), a browser
game about the political economy of a village rice grid. The village is a
standing allegory for Vietnam's electricity system: farming is generation,
exclusive roads are transmission, and price-capped rice retail is distribution.
The player runs the state-backed rice corporation for five years while the
Chairman enforces universal service and retail ceilings.

The repo is the source of truth for the game, not for the target document.
`TARGET.md` records the brief. `AGENTS.md`, `CODEBASE.md`, and the config files
describe what is actually implemented.

## Stack

- SolidJS 2 with `@solidjs/web`, TanStack Start (Solid) and
  TanStack Solid Query 6.
- UI SDK for Solid (`@ui-sdk/solid`) for accessible unstyled primitives.
- Iconify icons for Solid (`@iconify-icon/solid`) with generated Lucide and
  Tabler data, Tailwind CSS 4, Be Vietnam Pro, GSAP and Three.js.
- Takumi with Nitro for the generated Open Graph image.
- Valibot for every runtime boundary. Do not add Zod.
- Vite 8, TypeScript 6, Vitest 5, oxlint and oxfmt.
- Nix flakes with `glibc` and `musl` development shells; Vercel deployment.

## Commands

Use pnpm. The shell normally runs inside `direnv` / `nix develop`.

| Task | Command |
| --- | --- |
| Enter environment | `direnv allow` then `direnv exec . bash` |
| Install | `pnpm install` |
| Git hooks | `pnpm exec lefthook install` |
| Dev server | `pnpm dev` |
| Build and typecheck | `pnpm build` |
| Unit tests | `pnpm test` |
| Domain coverage | `pnpm coverage` |
| Lint | `pnpm lint` |
| Format | `pnpm format` / `pnpm format:check` |
| File budget | `pnpm check:lines` |
| Client chunk budget | `pnpm check:bundle` |
| Emoji audit | `pnpm check:emoji` |
| Layer boundary audit | `pnpm check:domain` |
| Full quality gate | `pnpm quality` |
| Browser verification | `pnpm exec playwright test` |

## Architecture

```
src/
  domain/   pure types, economics, events, actions, endings; no DOM or UI
  state/    signals, TanStack Query orchestration, storage adapters
  scene/    Three.js isometric renderer and GSAP timeline factories
  ui/       Solid components, hooks, inline Vietnamese copy, icons
  routes/   TanStack Start file routes and the document shell
```

Dependency direction is one-way: `routes -> ui -> state -> domain` and
`scene -> domain`. `domain/` never imports `ui/`, `scene/`, `state/`, a browser
global, or Three.js. `scene/` receives immutable snapshots and does not own game
rules. Persistence is a `state/` adapter and validates imported JSON with
Valibot.

## Non-negotiable rules

- **Zero classes.** No `class`, `this`, inheritance, or prototype mutation.
  Factories return closures and plain records. Signals and stores are the only
  sanctioned mutable edge.
- **Pure domain.** Economic formulas and state transitions are pure functions
  over readonly data. Randomness is a seeded value threaded through ticks.
  Results use the local `Result` discriminated union.
- **File budget.** No owned `.ts`, `.tsx`, `.css`, or `.json` source file over
  500 lines. Generated `routeTree.gen.ts`, lockfiles and the vendored
  `tools/oxlint/anti-slop/` plugin are exempt; `pnpm check:lines` reports the
  vendored count explicitly. Prefer many cohesive files under 250 lines.
- **Zero emojis.** Not in code, comments, UI, docs, commits, or logs. Use SVG
  icons through `src/ui/components/icons.tsx`.
- **Minimal comments.** Explain a non-obvious economic edge case, a Three.js
  workaround, or a platform constraint. Never narrate code.
- **Vietnamese first.** Every in-game string, tutorial, event, and ending is
  Vietnamese written inline in the Solid component that renders it. Domain
  events keep their keys, and the event modal resolves them through a
  component-local Vietnamese copy map. Code, identifiers, docs, and commits are
  English. The UI must render correctly with Be Vietnam Pro.
- **Responsive parity.** Verify `390x844` and `1440x900` and a `360px` narrow
  viewport. Touch targets are at least 44x44 px. The 3D canvas uses
  `touch-action: none` and both mouse and touch camera controls.
- **Mobile GPU discipline.** Cap device pixel ratio, dispose geometries,
  materials, textures, render targets, listeners, and animation frames.

## ui-sdk

Before using `@ui-sdk/solid`, read
`node_modules/@ui-sdk/solid/docs/llms.txt`. Import each component from its own
subpath, keep `@ui-sdk/core` out of Vite dependency pre-bundling, and style
with Tailwind classes plus data attributes.

## Multi-agent workflow

The canonical role roster and ownership map live in `AGENT_DIRECTORY.md`.
The sequence is architecture -> developer -> integrator -> independent reviewer
-> auto-merge. The reviewer must be a different agent instance from the author.
Use Herdr when `HERDR_ENV=1` and the user explicitly asks for multi-agent work.
The reviewer holds auto-merge authority only after every gate in
`CI_CD_PIPELINE.md` passes.

## Evidence

Every change must leave reproducible evidence: test output, coverage summary,
build output, lint/format status, a viewport check, or a screenshot. Do not
claim a gate passed without the command output that proves it.

## Skills

Load the skill before starting work that it owns. The routing table in
`AGENT_DIRECTORY.md` maps every role to its skills. Context7 is mandatory
before changing a dependency API; graphify is mandatory before exploring code;
the impeccable, unslop and agency-agents reviews are mandatory before UI
polish. The unslop skill lives at `.agents/skills/unslop` and keeps the
product's content and order; it changes spacing, color, icons, copy, type,
layout, details, visuals and motion in that order.

Do not install, update or vendor a skill inside an unrelated feature branch.
Skill changes travel in their own issue with provenance in `skills-lock.json`
and `tools/oxlint/anti-slop/UPSTREAM.md`.

## Anti-slop

`tools/oxlint/anti-slop` is vendored at the pinned skill snapshot. Its rules run
at error level from `.oxlintrc.json`; `oxc/no-accumulating-spread` runs beside
them. `require-readable-spacing` is autofixable, so run `pnpm exec oxlint --fix`
and then `pnpm format` before deciding a finding is real. Do not suppress a
rule, weaken its severity or add an unsafe cast to make lint pass. A cast that
is genuinely safe gets a `SAFETY:` comment stating the checked invariant.

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

When the user types `/graphify`, use the installed graphify skill or instructions before doing anything else.

Rules:
- When graphify-out/graph.json exists, run `graphify query "<question>"` before your first grep, search or source-file read for a codebase question, and put this rule in every subagent prompt that explores code. Read raw files only for lines the graph or an earlier read already located. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- Dirty graphify-out/ files are expected after hooks or incremental updates; dirty graph files are not a reason to skip graphify. Only skip graphify if the task is about stale or incorrect graph output, or the user explicitly says not to use it.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).
- A committed graphify-out/graph.json is rewritten whole on every build, so a large diff to it in a pull request is expected. Do not flag it as churn or suggest skipping the graph rebuild or its hooks.
