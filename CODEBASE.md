# CODEBASE.md

This document describes the implemented game architecture and the economic
model. It is intentionally narrower than `TARGET.md`: the target is the brief;
this file is the map of the code.

## Runtime shape

TanStack Start with the Solid adapter serves one file route, `/`. The game is a
client-side state machine; the only server route is `/og.png`, a Nitro handler
that renders the social card with Takumi. The document shell renders the
Vietnamese locale, Be Vietnam Pro, the app CSS, and the game. TanStack Solid
Query owns the month mutation, snapshot queries and the optional autoplay loop.

```
UI controls
  -> state actions (signals, persistence, query invalidation)
  -> pure domain transition
  -> new immutable GameState snapshot
  -> Solid signals re-render HUD, panels, charts
  -> scene factory reads a snapshot and diffs the isometric village
```

## Layers

### `src/domain/`

Pure and browser-free.

| Module | Responsibility |
| --- | --- |
| `types.ts` | readonly game state, ledger, event, ending and result types |
| `constants.ts` | balance constants, initial state, tariff and debt bounds |
| `clock.ts` | month arithmetic, season, act, public date labels |
| `rng.ts` | deterministic mulberry32 step and helpers |
| `market.ts` | price walk, drought, demand and external supply |
| `production.ts` | hydro and mechanized yields, cost per tonne |
| `tariffs.ts` | tiered household billing, ceiling validation, revenue |
| `finance.ts` | spend, borrowing, interest, P&L, annual reports |
| `recovery.ts` | N-2 audited-loss recovery formula |
| `infrastructure.ts` | road coverage and build projects |
| `metrics.ts` | satisfaction, trust, inflation, reliability |
| `endings.ts` | final and early ending resolution |
| `events/` | event catalog, scheduling, effect application |
| `actions/` | road, investment, tariff, policy and campaign actions |
| `tick.ts` | one-month state transition, composition of the above |
| `validation.ts` | Valibot schemas for save import/export |

### `src/state/`

- `game-store.ts`: one signal holding the immutable state, plus derived memos.
- `game-actions.ts`: thin adapters from UI intents to domain functions.
- `queries.ts`: query keys, snapshot query, advance-month mutation, autoplay.
- `persistence.ts`: localStorage slots, autosave, session UI preferences,
  JSON export/import, Valibot validation.
- `format.ts`: Vietnamese number/date/currency presentation helpers.

### `src/scene/`

Factory functions only. `create-village-scene.ts` builds the renderer, camera,
lights, terrain, buildings, roads, fleet and weather; returns a controller
object with `update`, `resize`, `focus`, `dispose`, and pointer handlers.
`road-mesh.ts`, `building-mesh.ts`, `terrain-mesh.ts`, `fleet.ts`, `weather.ts`
and `camera-rig.ts` keep the scene modules cohesive. GSAP cameras and seasonal
tweens are factory closures, never classes.

### `src/ui/`

Presentational Solid components with Vietnamese copy written inline at each use
site. Domain events still carry title, body and outcome keys; the event modal
owns a component-local Vietnamese copy map that resolves them.
The HUD is desktop-persistent and mobile-compact. Bottom tabs open accessible
drawers built on UI SDK primitives. Charts are dependency-free SVG components.
All iconography comes from Lucide and Tabler through
`@iconify-icon/solid`. Components use ordinary names such as
`icon="lucide:circle-exclamation-point"`. A Vite virtual module
(`build/iconify-subset.ts`) reads the two `@iconify-json` packages at build time
and registers only the names listed in `icon-names.ts`, so the repository
contains no hand-written SVG and the page makes no Iconify API request. The
package is patched for Solid 2's attribute namespace and element typings.

## Open Graph image

`routes/og.png.ts` is a Nitro route enabled by `serverDir: "."` in
`nitro.config.ts`. Takumi builds a 1200x630 card from the local Be Vietnam Pro
TTF weights under `public/fonts/`; Nitro bundles those files as server assets so
the Vercel function does not need a self-fetch, and `ImageResponse` streams the
card with a one-day immutable cache. Public font responses use a seven-day
shared cache. Nitro bundles the Takumi WASM backend for production; Vite dev
feeds the WASM bytes directly because pnpm's virtual store hides the native
addon. The root route advertises an absolute `/og.png` URL through the Open
Graph and Twitter tags, using `VITE_SITE_URL` with the Vercel project URL as
fallback.
Preview it after a build with:

```bash
pnpm build
PORT=3100 node .output/server/index.mjs
curl -o og.png http://127.0.0.1:3100/og.png
```

## Economy

Units:

- money: billion VND (`ty dong`)
- rice: thousand tonnes (`nghin tan`)
- tariffs and costs: million VND per tonne
- population: thousand households and thousand workshops

The month transition composes:

1. Price and weather walk from the seeded RNG.
2. Demand from connected households, season and workshop activity.
3. State production from hydro and mechanized paddies, drought, irrigation,
   fertilizer and R&D, plus external private supply.
4. Procurement, stock draw, shortage and reliability.
5. Revenue: four progressive household tiers plus the subsidized workshop
   tariff. The average household tariff is validated against the Chairman's
   ceiling.
6. Costs: production, external purchase, roads, fleet, staff, interest and
   policy.
7. Debt, auto-repayment, accumulated loss, the N-2 recovery credit and DPPA/VREM wheeling revenue.
8. Satisfaction, trust, inflation and industrial output.
9. Annual audit at December; annual report and N-2 eligibility.
10. Event scheduling and ending checks.

### Cross-subsidy

Households are billed across four progressive tiers. Low-consumption and remote
households sit in the cheap tiers; heavy users pay a rising marginal price.
Workshops pay a deeply subsidized rate to support industrialization. The player
can move sliders inside the Chairman's allowed band, but cannot exceed the
average ceiling or the workshop cap. Raising tariffs improves cash and hurts
satisfaction and inflation; lowering them protects trust and deepens the
structural deficit.

### N-2 recovery

When Decision 05/2024 is enacted, the audited net loss from two years earlier
becomes eligible for recovery. Each month the allowed credit is:

```
monthlyCredit = abs(netResult[year - 2]) * recoveryRate / 12
```

The credit stops when the eligible loss is exhausted. A higher rate heals the
balance sheet faster but raises inflation and reduces Chairman trust. The
policy is unavailable before 2024.

### Endings

- `architect`: debt at or below 25,000, universal road coverage, N-2 reform,
  DPPA and VREM, credible trust and satisfaction.
- `predator`: large treasury while households and workshops stagnate.
- `collapse`: insolvency, unrest, dismissal, or a premature privatization that
  produces a California/Texas style supply failure.

## Persistence

Three named slots plus autosave live in `localStorage`; the active slot, panel
tab, and onboarding acknowledgement live in `sessionStorage`. Saves carry a
schema version and are validated with Valibot on import. The export is a JSON
file with the full immutable state. Invalid imports fail closed with a
Vietnamese error message and never overwrite the active slot.

## Three.js lifecycle

The canvas is created once per game session. Snapshot updates diff primitive
collections by id and reuse geometry/material caches. `dispose` traverses the
scene, disposes every geometry, material and texture, removes listeners, cancels
the animation frame and calls `renderer.dispose()`. The renderer caps pixel
ratio at `min(devicePixelRatio, 2)` on desktop and `1.5` on coarse pointers.
