# SKILL.md

The 18 target skill families are installed in `.agents/skills/` and linked into
the four supported runtimes: `.opencode/`, `.codex/`, `.claude/`, and
`.agents/`. `skills-lock.json` pins the managed packages. Use
`npx skills list` to inspect the live set.

## Target matrix

| Target command | Installed skill | Notes |
| --- | --- | --- |
| `caldoai/skills/untangle-codebase` | `untangle-codebase` | dependency and duplication audit |
| `vercel-labs/skills/find-skills` | `find-skills` | discovery before hand-rolling |
| `mattpocock/skills/grill-me` | `grill-me` | design stress test |
| `pbakaus/impeccable/impeccable` | `impeccable` | UI craft and audit |
| `dietrichgebert/ponytail/ponytail` | `ponytail` | smallest complete change |
| `juliusbrussee/caveman/caveman` | `caveman` | terse communication mode |
| `herdrdev/herdr/herdr` | `herdr` | pane orchestration when requested |
| `suryavirkapur/skills/solidjs` | `solidjs` | Solid 2 signals and routes |
| `whatiskadudoing/fp-ts-skills` | `pragmatic-functional-programming` | pure core |
| `intellectronica/agent-skills/context7` | `context7` | current library docs |
| `dmmulroy/anti-slop/install-anti-slop` | `install-anti-slop` | hygiene rules |
| `cursor/plugins/thermo-nuclear...` | `thermo-nuclear-code-quality-review` | review gate |
| `sickn33/agentic-awesome-skills` | `typescript-expert` | strict typing |
| `cloudai-x/threejs-skills` | `threejs-*` suite | 13 focused Three.js skills |
| `greensock/gsap-skills/gsap-core` | `gsap-core` | motion and cleanup |
| `googlechrome/modern-web-guidance` | `modern-web-guidance` | platform guidance |
| `github/awesome-copilot/chrome-devtools` | `chrome-devtools` | browser verification |
| `msitarzewski/agency-agents` | `agency-agents` | upstream ships personas, not SKILL.md files; relevant personas are vendored in `.agents/agency-agents/` with the MIT license and exposed through `.agents/skills/agency-agents/SKILL.md` |

`ui-sdk` is installed in addition because the app uses `@ui-sdk/solid`.

## ui-sdk context

Read `node_modules/@ui-sdk/solid/docs/llms.txt` before changing Dialogs,
Drawers, Sliders, Tabs, Switches or Tooltips. Import each component from its
subpath and keep `@ui-sdk/core` out of Vite dependency pre-bundling.

## Graphify

The repository is indexed into `graphify-out/`. Read
`.agents/rules/graphify.md` before broad architecture questions, then use
`graphify query`, `graphify path` or `graphify explain` instead of grepping raw
source. Re-index after merges with `graphify update .`.
