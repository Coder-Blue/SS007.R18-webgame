# Game Design: National Grid Command

## Fantasy

You are the general director of a state-backed power corporation. The grid is
not a metaphor for a village: it is the national electricity system. You buy
power from competing upstream suppliers, dispatch it across 500kV/220kV lines,
and sell it under a State retail ceiling to households, factories and remote
communities. The State wants universal service and energy security; the press
wants someone to blame for the losses.

## Core loop

1. Read the month: demand, reservoir, fuel index, reliability and reserve.
2. Choose a supplier and set hydro/thermal/import dispatch.
3. Fund transmission, generation or substation projects.
4. Adjust the six-tier retail tariff within the political band.
5. Advance the month; read the ledger, trust movements and reports.
6. Resolve scripted events and post-event decisions.
7. Keep both trust gauges above zero and debt below `100,000 tỷ` until the
   revised Electricity Law unlocks recovery.

## Three mandates

| Mandate | Completion | Reward |
| --- | --- | --- |
| Universal electrification | All three zones at 100% | Institutional trust pulse |
| Well-run market | Reliability ≥ 98%, 3/4 reforms, competitive supplier | Trust and inflation relief |
| Energy security | Reserve margin ≥ 15% for 12 months | Strong trust pulse |

Mission progress is shown in the left rail and the policy panel. Completed
mandates permanently raise the trust target, countering media decay.

## Economy

- Units: billion VND, million kWh, MW, VND/kWh.
- Household tiers: six progressive blocks; industrial tariff is subsidized.
- Revenue: electricity sales plus other revenue (N-2, DPPA, VREM, NSMO,
  two-part tariff).
- Costs: supply (fuel, import, hydro/renewable O&M, transmission) plus
  management (staff, admin, interest).
- Starting position: cash `4,000 tỷ`, debt `26,000 tỷ`, coverage
  92/74/46 (urban/industrial/rural).
- The calibrated main branch loses roughly `45,000 tỷ` over 60 months. Debt ends
  below the `100,000 tỷ` failure threshold but high enough to force reform.

## Sentiment

- **Citizen trust** responds to reliability, blackouts, prices, inflation and
  media. A published loss accelerates its decay.
- **Institutional trust** responds to debt, losses, coverage, reforms and
  mission completion. Staff cuts and delays hurt it.
- Either gauge at 0% ends the run immediately.

## Events

| Month | Event | Decision space |
| --- | --- | --- |
| Oct 2022 | Global fuel crisis | hedge or ride out; unlock five decisions |
| May 2023 | Drought and heatwave | protect reservoir or maximize hydro; unlock five decisions |
| Jan 2025 | Public skepticism | privatize or reform |
| Sep 2025 | Revised Electricity Law | enact or delay |

The media sub-event recurs after an eight-month cooldown when losses, debt or a
tariff jump cross the trigger. It has one focused effect: faster citizen-trust
decay for three months.

## State approval

Tariff increases up to 5% execute immediately. Larger increases create an
approval request and pause the game. The State audits fuel pressure, cumulative
loss, debt, inflation, public mood and the policy petition. A likelihood of 55
or higher is accepted. Refusal costs institutional trust.

## Endings

- **Reformer**: 100% coverage, at least three reforms, trust ≥ 50/45.
- **Caretaker**: survived the term without the full reform package.
- **Captured**: citizens abandoned while the corporation protected its cash.
- **Collapse**: citizen trust 0, institutional trust 0, debt over `100,000 tỷ`,
  blackout reliability, or twelve months in the privatized branch.

## Controls

- Pause/resume button, `Space`.
- Speed 1x/2x/3x, keys `1`–`3`.
- Drag to pan, wheel or pinch to zoom, tap a plant or load center to inspect.
- Every destructive action has an accessible label and 44x44 px target.
