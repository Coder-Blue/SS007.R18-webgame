# Vendored anti-slop Oxlint plugin

Source: [dmmulroy/anti-slop](https://github.com/dmmulroy/anti-slop), skill
`install-anti-slop` at commit `63dbb09f73438e550a6991dc6d778f979ffbf183`
(recorded in `skills-lock.json`). The bundle was copied with
`node .agents/skills/install-anti-slop/scripts/install.mjs` on 2026-11-21.

Installed paths:

- `index.ts`: generic plugin entry point.
- `rules/`: the generic rule implementations.
- `shared/`: AST, scope and type helpers.
- `vendor/eslint-stylistic/`: the adapted padding-line rule, its license and
  provenance.
- `effect/`: optional Effect plugin, not registered because this project does
  not depend on Effect.

## Local configuration

- `.oxlintrc.json` registers the plugin as `anti-slop` and enables every generic
  rule at error level.
- `oxc/no-accumulating-spread` is enabled as the native companion.
- Agent runtime directories and this plugin directory are ignored so installed
  skills are not linted as application source.
- `@oxlint/plugins` is pinned to `1.94.0`, matching the installed `oxlint`.

## Intentional deviations

- The Effect plugin is present but disabled; there is no direct Effect
  dependency.
- No rules were weakened or disabled. The source was cleaned instead.
- `require-readable-spacing` fixed 706 findings with
  `pnpm exec oxlint --fix`; `pnpm format` then normalized the touched files.
- Casts kept for Valibot output narrowing and GSAP handles carry a `SAFETY:`
  comment naming the checked invariant.

`tools/` is excluded from `tsconfig.json` because the vendored rules use
`.ts` import specifiers and Oxlint's host API, not the application module
resolution.
