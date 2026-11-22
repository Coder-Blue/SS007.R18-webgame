# SKILL.md

The managed skill families are installed in `.agents/skills/` and linked into
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
| `heydamir/unslop` | `unslop` | remove AI-looking UI tells and polish the design |
| `nextlevelbuilder/ui-ux-pro-max-skill/ui-ux-pro-max` | `ui-ux-pro-max` | searchable palettes, type, UX rules, charts and stack guidance |
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

## Skill routing

The role table in `AGENT_DIRECTORY.md` is authoritative. Two rules are
non-negotiable:

1. Run `graphify query "<question>"` before the first grep or source read for a
   codebase question. Use `graphify path` for relationships and
   `graphify explain` for a concept. Re-index after a merge with
   `graphify update .`.
2. Use `context7` before changing a third-party API. Fetch the library ID, then
   the focused context, and cite the retrieved version in the pull request.

UI work loads `ui-sdk`, `impeccable`, `unslop` and `ui-ux-pro-max`. The UI engineer reads
`node_modules/@ui-sdk/solid/docs/llms.txt`, runs the impeccable audit and the
unslop nine-pass pass at the end, and captures `1440x900` and `390x844`
evidence. The unslop pass keeps the product's content and order, starts from the
existing brand direction, and changes spacing, color, icons, copy, type, layout,
details, visuals and motion in that order. A design critique may add one
`agency-agents` persona from `.agents/agency-agents/`; the reviewer remains a
different instance. Browser work uses `chrome-devtools`; motion work uses
`gsap-core`.

## Anti-slop

The plugin is vendored from `dmmulroy/anti-slop` commit
`63dbb09f73438e550a6991dc6d778f979ffbf183` through the `install-anti-slop`
skill. The entry point is `tools/oxlint/anti-slop/index.ts`; provenance and local
adaptations are recorded in `tools/oxlint/anti-slop/UPSTREAM.md`.

All generic rules are enabled at error level in `.oxlintrc.json`. The
`require-readable-spacing` rule is autofixable; run `pnpm exec oxlint --fix` then
`pnpm format`. Semantic findings need a real change, not a suppression. The
`oxc/no-accumulating-spread` companion rule is enabled beside the plugin.
`@oxlint/plugins` is pinned to the installed `oxlint` version so rule and host
move together.

## ui-sdk context

Read `node_modules/@ui-sdk/solid/docs/llms.txt` before changing Dialogs,
Drawers, Sliders, Tabs, Switches or Tooltips. Import each component from its
subpath and keep `@ui-sdk/core` out of Vite dependency pre-bundling.

## Graphify

The repository is indexed into `graphify-out/`. Read
`.agents/rules/graphify.md` before broad architecture questions, then use
`graphify query`, `graphify path` or `graphify explain` instead of grepping raw
source. Re-index after merges with `graphify update .`.
