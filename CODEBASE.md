# CODEBASE.md

This document maps the implemented game. `TARGET.md` records the original brief;
this file describes what the code actually does.

## Runtime shape

TanStack Start with the Solid adapter serves one file route, `/`. The game is a
client-side state machine. The only server routes are `/og.png` (Takumi social
card), `/sitemap.xml` and `/robots.txt`. TanStack Solid Query owns the month
mutation, snapshots and the speed-aware autoplay loop.

```
UI controls / RTS clock
  -> state actions (signals, persistence, query invalidation)
  -> pure domain transition
  -> new immutable GameState snapshot
  -> Solid signals re-render HUD, panels, charts
  -> scene factory reads the snapshot and diffs the national grid map
```

## Layers

### `src/domain/`

Pure and browser-free. Every module is a `type`-first, closure-free function
module. Randomness is threaded as a seed.

| Module | Responsibility |
| --- | --- |
| `types.ts` | readonly state, ledger, event, decision and ending types |
| `constants.ts` | 60-month balance, starting state, tariff bands, project catalog, decisions |
| `clock.ts` | act/season mapping, tick arithmetic, clamp |
| `rng.ts` | deterministic mulberry32 helpers |
| `market.ts` | fuel/drought/heat walk, competing supplier quotes, zonal demand |
| `production.ts` | hydro availability, thermal/renewable/import dispatch, reserve margin |
| `tariffs.ts` | six-tier household billing, industrial tariff, plan validation |
| `finance.ts` | spend, debt settlement, management/transmission cost, annual reports |
| `recovery.ts` | N-2 audited-loss recovery formula |
| `reforms.ts` | DPPA/VREM/NSMO/two-part wheeling revenue; NSMO is abstracted as a trust/revenue modifier rather than a separate dispatch controller |
| `reform-progress.ts` | 0–100% execution bar for N-2 (3 months), NSMO and DPPA (4), VREM (5) and two-part wheeling (3): start, monthly countdown and completion |
| `infrastructure.ts` | line, plant, substation and decision progress |
| `missions.ts` | three long-term mission progress and completion |
| `approval.ts` | autonomous State tariff audit and likelihood |
| `preview.ts` | live before/after month projection |
| `metrics.ts` | citizen and institutional trust, inflation, industrial output |
| `endings.ts` | early bad endings and final grading |
| `events/` | scripted milestone catalog, effect application, scheduling, resolution |
| `actions/` | line, plant, dispatch, supplier, tariff and policy actions |
| `tick.ts` | one-month transition composing the above |
| `validation.ts` | Valibot schemas for save import/export |

### `src/state/`

- `game-store.ts`: one immutable state signal plus the RTS pause/speed machine.
- `game-actions.ts`: thin adapters from UI intents to domain functions.
- `queries.ts`: query keys, month mutation, speed-aware autoplay
  (`8_000 ms / speed`).
- `persistence.ts`: `dhl:` localStorage slots, autosave, session preferences,
  JSON export/import with Valibot validation.
- `selectors.ts`: finance projection, coverage, mission views and the completed-quarter aggregate used by the summary modal.
- `format.ts`: Vietnamese number, date, currency, power and energy formatting.

### `src/scene/`

Factory functions only. `create-power-scene.ts` builds the WebGL renderer,
isometric camera, lights, terrain, plants, pylons, load centers and weather; it
returns a controller with `update`, `resize`, `resetView`, `dispose` and
pointer handlers. `plants.ts` owns hydro dams, thermal stacks, solar/wind farms,
substations and city/industrial/rural loads. `grid-lines.ts` owns transmission
corridors, flow pulses, DPPA feeds and the duplicate private lines.
`weather.ts` owns sky, fog, sun, rain and reservoir level. A gold beacon over the
urban load grows with aggregate reform execution. The canvas exposes a hidden
screen-reader description, and its WebGL fallback links back to the overview panel.
GSAP cameras and seasonal tweens are closures, never classes.

### `src/ui/`

Presentational Solid components with Vietnamese copy written inline. The HUD is
desktop-persistent and mobile-compact. Components use Tailwind utilities over
semantic oklch tokens; `styles/*.css` keeps the theme, resets, shared primitives
and UI SDK integration. The top bar owns the pause/resume button,
speed selectors and five live gauges. Side rails show active reform bars, long-term
missions, press pressure, MW balance and project progress; the policy panel
promotes in-flight reforms above available and enabled ones. The mobile sheet
wraps all six tabs and switches panels reactively. The bottom dock opens an accessible
right drawer with six panels: overview, production, grid, tariffs, policy and
finance. The five-step tutorial opens the production, grid and tariff panels on
wide desktop (1340 px and up), narrows the drawer to keep the map visible,
spotlights the panel anchors and dispatches `grid:tour-focus`. The scene pans
the matching thermal, rural or urban node into the gap between the mission rail
and the drawer, rings it and labels it; the final step closes the drawer before
pointing at the pause and speed controls. Charts are dependency-free SVG. The quarterly summary aggregates the last
three ledgers, hides the monthly toast, and presents energy, generation mix,
revenue/cost rows and trust on one report. All iconography comes from Lucide and
Tabler through `@iconify-icon/solid`; `icon-names.ts` is the build-time subset.

## Economy

Units:

- money: billion VND (`tỷ đồng`)
- energy: million kWh (`triệu kWh`)
- power: MW
- tariffs and input costs: VND per kWh
- coverage and trust: percent

Each month composes:

1. Project progress and decision completion.
2. Fuel, drought, heat and renewable walk from the seeded RNG.
3. Zonal demand from coverage, season, heat and industrial output.
4. Dispatch of hydro, thermal and import; renewable output is must-run, and
   available reserve is computed from the dispatchable fleet.
5. Served energy, transmission losses, six-tier residential and industrial
   revenue.
6. Variable supply cost, transmission cost, management cost and interest.
7. Debt settlement, accumulated loss and N-2 recovery credit.
8. Media pressure, citizen trust, institutional trust, inflation, industrial
   output, mission rewards and reform execution progress.
9. Annual audit in December, ending checks, event scheduling and clock advance.

### Structural deficit

The 60-month main branch is calibrated to lose money even under good
management. Revenue is suppressed by the retail ceiling and industrial
cross-subsidy; fuel, transmission, staff and interest exceed it. A full
playthrough lands near `-45_000 tỷ` cumulative and below the `100_000 tỷ` debt
ending, leaving room for Post-Year 5 recovery under N-2.

### Five-minute pacing

One month is `8_000 ms` at 1x, `4_000 ms` at 2x and `2_667 ms` at 3x. A clean
60-month run is about eight minutes at 1x and under five at 2x, excluding
tactical pause and tutorials. Active pause stops the timer, scene flow
animation and all domain ticks; command actions remain interactive.

### Tariff approval

The player edits six household tiers and one industrial tariff. A plan whose
weighted average rises by at most 5% applies immediately. A larger rise creates
an `ApprovalRequest`; the game pauses and the State audits fuel pressure,
accumulated loss, debt, inflation, public mood and the policy petition. The
likelihood is deterministic and the request is accepted at 55 or above.

### Events

| Tick | Event | Branch |
| --- | --- | --- |
| 9 | Global fuel crisis (2022) | opens five executive decisions |
| 16 | Summer drought and heatwave (2023) | opens five response decisions |
| 36 | Public skepticism (2024–2025) | privatization or reform path |
| 44 | Revised Electricity Law (2025) | unlocks NSMO, DPPA, VREM and N-2; each then runs its execution bar |
| conditional | Media coverage of EVN losses | one effect: faster citizen-trust decay |

The media event recurs after an eight-month cooldown when monthly losses, debt
or a tariff jump trigger it. Its HUD badge pulses until the three-month decay
window ends.

## Persistence

Three named slots plus autosave live in `localStorage` under `dhl:`; the active
slot, panel, onboarding flag, speed and paused preference live in
`sessionStorage`. Saves carry schema version 2 and are validated with Valibot
on import. Invalid imports fail closed with a Vietnamese error and never
overwrite the active slot.

## Three.js lifecycle

The canvas is created once per game session. Its factory is dynamically
imported after first paint during idle time, so Three.js and GSAP stay out of
the initial route chunk; a failed chunk shows a retry control. Snapshot updates
set visibility, emissive intensity, flow colors, smoke and reservoir level.
`dispose` traverses the scene, disposes geometries, materials and textures,
removes listeners, cancels the animation frame and calls `renderer.dispose()`.
The renderer caps pixel ratio at `min(devicePixelRatio, 2)` on desktop and `1.5`
on coarse pointers.

## Open Graph image and public metadata

`routes/og.png.ts` renders a 1200x630 card with Takumi and the local Be Vietnam
Pro fonts under `public/fonts/`. Nitro bundles the fonts and WASM backend for
production; Vite dev feeds the WASM bytes directly. The favicon set uses the
same brand system: a cyan transmission pylon with amber insulator nodes and the
green live dot on a `#07121b` tile. `favicon.svg` is the primary icon,
`favicon.ico` bundles 16/32/48/64 px images, `favicon.png` is the 64 px fallback
and `apple-touch-icon.png` is an opaque 180 px home-screen tile. The root route owns social
metadata, while the index route owns canonical and robots directives so a 404
is never advertised as indexable.
