# TARGET.md

## Goal

**Điều Hành Lưới Điện Quốc Gia** is a Vietnamese browser game about the
political economy of the national power grid. The player runs a state-backed
electricity corporation for 60 months (2022–2026) across generation and
competitive procurement, 500kV/220kV transmission, and six-tier price-capped
retail. The village allegory is retired; the grid is literal.

The implementation must keep the SolidJS 2, TanStack Start, TanStack Solid
Query, `@ui-sdk/solid`, Three.js, GSAP, Tailwind CSS, Vite, Vitest,
oxlint/oxfmt, Nix and Graphify stack. Code, identifiers and docs are English;
in-game copy is Vietnamese and written inline. Zero emojis, no classes, no file
over 500 lines, pure domain, responsive `390x844`, `1440x900` and `360px`.

## Onboarding

A mandatory Chairman briefing pauses the game until completed or skipped:

> Bạn được chủ tịch giao cho công việc quản lý nguồn điện trong khu vực. Bạn
> điều hành các công ty con trong 3 mảng: sản xuất, truyền tải và phân phối. Bạn
> có các nhiệm vụ cần đạt được là: (1) Phủ điện đến mọi khu vực, (2) Điều hành
> thị trường điện hợp lý, (3) Đảm bảo an ninh năng lượng.

The walkthrough highlights HUD panels and map nodes in sequence, opens the
production, grid and tariff panels, and explains the three-mandate loop.

## Systems

- **Three long-term missions**: 100% electrification; competitive procurement,
  reliability and structural pricing reform; reserve margin above blackout
  thresholds. Progress pays institutional trust.
- **Two sentiment metrics**: citizen trust/satisfaction and institutional
  trust. Each reaching 0% ends the run. Debt above `100,000 tỷ` also ends it.
- **RTS pacing**: 60 months, 8 seconds per month at 1x, 1x/2x/3x selectors,
  Space to pause, active pause halts every tick and scene animation, and
  auto-pause for Big Events, State approvals and quarterly/annual summaries.
- **Competitive procurement**: at least three IPP/BOT/coal suppliers with
  nearly identical prices and capacities.
- **MW balance**: hydro, thermal, renewable and import dispatch against urban,
  industrial and rural load with a visible reserve margin.
- **Six-tier retail tariffs** with industrial cross-subsidy and a State ceiling.
  Increases up to 5% apply directly; larger increases open a State submission
  dialog whose autonomous audit returns agree or refuse.
- **Accounting**: revenue split into electricity and other; costs split into
  management and supply (production, transmission, distribution).
- **Live preview**: every dispatch, supplier and tariff change shows a
  before-to-after monthly profit, reserve, reliability, trust and approval
  likelihood.
- **Execution progress**: construction, post-event decisions, fuel negotiation,
  policy petitions and reforms progress from 0% to 100% in the HUD and on map
  nodes.

## Scripted timeline

1. **2022 global fuel crisis**: coal, gas, oil and FX surge; five post-event
   decisions (keep fuel, cut staff, maximize hydro, policy petition, negotiate
   fuel contracts).
2. **Summer 2023 drought and heatwave**: reservoirs reach dead water while peak
   demand spikes; five decisions (save power, shift industry, load shedding,
   fossil ramp, grid maintenance).
3. **2025 public skepticism**: privatize the whole sector (duplicate lines,
   uncapped prices, throttled unprofitable regions) or continue controlled
   reform.
4. **2025–2026 revised Electricity Law**: NSMO dispatch separation, DPPA, VREM
   roadmap and N-2 audited cost recovery.
5. **Recurring media sub-event**: loss/debt/price-hike coverage applies one
   accelerated citizen-trust decay and a pulsing HUD badge.

## Three.js map

Replace all rice-village assets with hydro dams, thermal plants, solar/wind
farms, 500kV/220kV lattice pylons, substations and urban/industrial/rural load
centers. Progression erects new lines and lights settlements. Big Events morph
the world: fuel crisis focuses thermal plants and darkens smoke; drought lowers
reservoirs and scorches light; load shedding and industry shifts change sector
lights; privatization adds chaotic duplicate lines; collapse cascades a
grid-wide blackout.

## Five-year deficit

The main branch must lose money even under optimal play, ending near
`-45,000 tỷ` cumulative with debt safely below `100,000 tỷ`, 100%
electrification and high industrial output before Post-Year 5 recovery.

## Verification

Graphify rebuild, `oxlint`, `oxfmt --check`, Vitest with 100% domain coverage,
production build, bundle budget, Playwright desktop/mobile/narrow checks, and
Chrome DevTools bounding-box overlap assertions for charts and tables.
