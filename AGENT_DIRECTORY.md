# AGENT_DIRECTORY.md

The agent pool may assign any available runtime to any role, provided the
reviewer is not the author of the change. The definitions are mirrored for
OpenCode, Claude Code, Codex and the generic `.agents` folder.

| Role | Owns | Must not |
| --- | --- | --- |
| `architect` | domain schema, dependency order, issue slicing, ADR-worthy decisions | write feature code before the contract is stable |
| `developer` | one vertical slice: domain + state + UI + tests | cross layer boundaries or skip tests |
| `domain-economist` | formulas, tick composition, balance, event effects | touch the DOM, Three.js or Solid signals |
| `scene-engineer` | Three.js factories, camera, weather, fleet, disposal | encode game rules or import `state/` |
| `ui-engineer` | Solid components, Vietnamese copy, responsive layout, accessibility | compute economics in components |
| `integrator` | state wiring, persistence, query loop, build and viewport fixes | approve their own work |
| `reviewer` | independent audit against every gate; auto-merge authority | author the reviewed change |
| `tester` | Vitest, Playwright, coverage and regression fixtures | weaken assertions to pass |
| `docs` | AGENTS, CODEBASE, ADR, changelog, operator notes | claim evidence that was not run |

## Skills per role

Load these before working. The full inventory and usage notes live in `SKILL.md`.

| Role | Skills |
| --- | --- |
| `architect` | `grill-me`, `pragmatic-functional-programming`, `context7`, `graphify` |
| `developer` | `solidjs`, `typescript-expert`, `pragmatic-functional-programming`, `ponytail`, `context7`, `graphify` |
| `domain-economist` | `pragmatic-functional-programming`, `typescript-expert`, `graphify` |
| `scene-engineer` | `threejs-fundamentals`, `threejs-geometry`, `threejs-materials`, `threejs-lighting`, `threejs-animation`, `threejs-loaders`, `threejs-textures`, `threejs-performance`, `threejs-postprocessing`, `threejs-shaders`, `threejs-interaction`, `threejs-react-three-fiber`, `threejs-asset-pipeline`, `gsap-core`, `chrome-devtools`, `graphify` |
| `ui-engineer` | `ui-sdk`, `impeccable`, `unslop`, `ui-ux-pro-max`, `agency-agents`, `modern-web-guidance`, `solidjs`, `chrome-devtools`, `context7` |
| `integrator` | `solidjs`, `modern-web-guidance`, `ponytail`, `chrome-devtools`, `graphify` |
| `reviewer` | `impeccable`, `unslop`, `ui-ux-pro-max`, `agency-agents`, `install-anti-slop`, `chrome-devtools`, `graphify` |
| `tester` | `chrome-devtools`, `typescript-expert`, `graphify` |
| `docs` | `context7`, `ponytail`, `graphify` |

UI changes also require the `impeccable` audit, the `unslop` nine-pass polish
and, for a design review, one `agency-agents` persona. Browser evidence uses
`chrome-devtools`. Library API
questions use `context7` before reading `node_modules` or guessing.

## Sequence

$$
\text{Architecture} \longrightarrow \text{Developer} \longrightarrow
\text{Integrator} \longrightarrow \text{Reviewer} \longrightarrow \text{Merge}
$$

1. The architect slices work into atomic, dependency-ordered issues and records
   the contract in `CODEBASE.md` or `docs/adr/`.
2. The developer implements one issue on `feat/issue-<id>-<slug>` with tests and
   evidence.
3. The integrator wires the slice, resolves conflicts, runs desktop and mobile
   checks and the production build.
4. A different agent reviews. The reviewer runs every gate in
   `CI_CD_PIPELINE.md`, records the command output, and applies the
   `approved-by-thermo-nuclear-review` label before merge.
5. Post-merge, Graphify is re-indexed and the next issue is dispatched.

## Herdr

Herdr is active when `HERDR_ENV=1`, the binary is installed, and the user asks
for parallel agent work. Prefer sibling panes in the current tab and the
current working directory. Start an agent only in a shell pane that is at its
interactive prompt. Use `herdr agent prompt <name> "..." --wait` and inspect
`blocked` or `timeout` states before resending. Never answer an approval dialog
on the user's behalf.

Role names for Herdr agent names: `architect`, `developer`, `reviewer`,
`integrator`, `tester`, `docs`. Keep them short and unique.

## Dispatch template

```
Role: <role>
Read: AGENTS.md, CODEBASE.md, CODING_CONVENTION.md, TARGET.md
Skills: <skills from the role table in AGENT_DIRECTORY.md>
Issue: <atomic outcome>
Paths: <owned files>
Constraints: zero classes, zero emojis, <500 LOC/file, Vietnamese UI, English code, anti-slop lint clean
Acceptance: <observable behavior + test names>
Evidence: paste command output, coverage table, build result, viewport notes
```
