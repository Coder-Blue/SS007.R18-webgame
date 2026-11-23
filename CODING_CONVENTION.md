# CODING_CONVENTION.md

## Language and names

- Source, identifiers, tests, comments, commits and docs are English.
- In-game copy is Vietnamese written directly in the Solid component that
  renders it. Event copy is colocated in `src/ui/modals/event-modal.tsx` because
  domain events carry keys; there is no shared dictionary or translation layer.
- Files are `kebab-case.ts` / `kebab-case.tsx`. Types and components are
  `PascalCase`; values and functions are `camelCase`; constants are
  `SCREAMING_SNAKE_CASE` only for module-level balance constants.
- Boolean names read as predicates: `isSolvent`, `hasUniversalCoverage`.

## Functional core

- No `class`, `this`, `extends`, `new` for project types, or prototype edits.
- Domain functions take a readonly state and return a new readonly state or a
  `Result`.
- Do not mutate arrays or records. Use spread, `map`, `filter`, `reduce`.
- Model alternatives with discriminated unions. Use exhaustive `switch` with a
  `never` check for closed sets.
- Keep randomness explicit: `nextRandom(seed)` returns `{ value, seed }`.
- Keep I/O at the edges. No `Date.now`, `Math.random`, `localStorage` or DOM in
  `domain/`.
- Factories close over mutable handles only where the platform requires it
  (renderer, animation frame, Web Audio). Return a plain controller object.

## State

- One immutable `GameState` signal is the source of truth.
- Derived values are memos, not duplicated fields.
- Store UI-only preferences in `sessionStorage`; store game state in
  `localStorage` through the persistence adapter.
- Validate imports with Valibot and fail closed.

## Components

- Components are presentational. Pass data and callbacks; do not compute
  tariffs, debt or ending conditions inside JSX.
- Use Tailwind utilities in the component. Keep CSS files for tokens, resets,
  UI SDK integration and shared primitives; do not add pane-specific blocks.
- Every color is oklch, through a semantic token such as `--panel` or a
  Tailwind utility such as `bg-panel`. No hex or rgba in CSS or JSX.
- Use UI SDK primitives for dialogs, drawers, sliders, switches and tabs.
- Every interactive control has an accessible name and a visible focus state.
- Touch targets are at least 44x44 px.
- No emojis. Add an SVG path to `icons.tsx` instead.

## Economics

- Write the unit in the identifier: `cashBillionVnd`, `energyMillionKwh`,
  `capacityMw`, `tariffVndPerKwh`.
- Clamp at the domain boundary and explain the clamp only when the reason is
  not obvious.
- Tests cover zero, negative, cap, floor and the cliff between branches.
- Balance changes require a fixture or simulation result in the commit.

## Comments and formatting

- Comments are one or two sentences, only for a non-obvious invariant,
  economic edge case, or browser/GPU workaround.
- No banner comments, section essays, or changelog comments.
- Use oxfmt. Do not hand-align code.
- Keep files under 500 lines; target 250.

## Tests

- Test names state the behavior: `charges the fourth tier above the third`.
- Prefer table tests for formulas and boundary matrices.
- One assertion theme per test. No snapshots of entire state objects.
- Domain coverage thresholds are enforced by `pnpm coverage`.

## Git

- Conventional commits: `feat(domain): ...`, `fix(scene): ...`,
  `test(ui): ...`, `docs: ...`, `chore: ...`.
- One atomic outcome per commit. Do not mix formatting and behavior.
- Commit messages contain no emojis.
- Branches: `feat/issue-<id>-<slug>`, `fix/issue-<id>-<slug>`.
