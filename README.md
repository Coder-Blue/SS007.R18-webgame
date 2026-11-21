# Doc Quyen Kinh Te

*The Rice Monopoly* is an isometric browser game about running a state-backed
rice corporation in a fast-industrialising Vietnamese village. It condenses the
political economy of a natural monopoly into a five-year management game:

- **San xuat** (generation): hydro paddies, mechanized farms, private growers,
  drought and imported fertilizer.
- **Truyen tai** (transmission): an exclusive road network that must reach
  every household, including remote mountain huts.
- **Phan phoi** (distribution): progressive household tariffs, deeply
  subsidized workshop rates, and a Chairman-enforced retail ceiling.

The player must keep the lights on, contain inflation, satisfy households and
workshops, retain the Chairman's trust, and climb out of a structural deficit
that deepens in the first two years. The 2024 reform lets audited N-2 losses
return through the regulated ceiling without a price shock.

## Stack

SolidJS 2, TanStack Start (Solid), TanStack Solid Query, UI SDK for Solid,
Tailwind CSS 4, Be Vietnam Pro, Three.js, GSAP, Valibot, Vitest, oxlint, oxfmt,
Nix flakes, Vercel.

## Development

```bash
direnv allow
pnpm install
pnpm dev
```

Open `http://localhost:3000`.

| Command | Purpose |
| --- | --- |
| `pnpm build` | Production build and typecheck |
| `pnpm test` | Domain tests |
| `pnpm coverage` | Coverage gate |
| `pnpm quality` | All static and test gates |
| `pnpm exec playwright test` | Responsive browser checks |

## How to play

1. Start a term and read the five-step tutorial.
2. Open a road project on the left dock or in the Transport panel. Asphalt reaches
   remote huts fastest.
3. Invest in hydro and mechanized paddies before drought years; production is
   cheaper than buying every tonne from private growers.
4. Keep the average household tariff inside the Chairman's ceiling. Use the
   four tier sliders and the workshop rate deliberately.
5. In 2024, enact Decision 05/2024, then add DPPA and VREM. The wheeling toll and
   N-2 recovery are the recovery levers.
6. Use the end-month button. Save slots, autosave and JSON export are in the
   save menu. Camera controls work with mouse drag/scroll and one-finger pan /
   two-finger pinch on touch devices.

## Game loop

Each month:

1. Market prices and weather move.
2. Households and workshops demand rice.
3. Your farms produce; private growers offer external supply.
4. You buy, sell under the ceiling, and book the result.
5. Satisfaction, trust, inflation and debt move.
6. Events force decisions and the 2024 reform unlocks N-2 recovery.

Build roads, expand production, set tariffs carefully, and choose a path
through the privatization debate. The ending depends on what you protect.

## Docs

- `AGENTS.md`: rules for every agent runtime.
- `CODEBASE.md`: implemented architecture and economy.
- `AGENT_DIRECTORY.md`: role roster and Herdr workflow.
- `docs/GAME_DESIGN.md`: detailed mechanics and balance.
- `docs/DEVELOPMENT.md`: local workflow, saves and verification.
- `docs/adr/0001-solid2-tanstack-start.md`: why the Solid 2 patch exists.
- `docs/VERIFICATION.md`: reproducible gate results and residual risks.
- `SKILL.md`: installed skill matrix and Graphify/ui-sdk notes.
- `CODING_CONVENTION.md`, `CONTRIBUTE.md`, `CI_CD_PIPELINE.md`.

## Repository history

The previous repository, including pull requests #1 through #7 and the full
review discussion, is preserved at
[Coder-Blue/SS007.R18-webgame-history](https://github.com/Coder-Blue/SS007.R18-webgame-history).
This repository is the current primary and contains the same commit graph. It
was recreated because GitHub had cached JavaScript as the primary language from
the original repository ID; the new repository computes TypeScript from the
same tree.
