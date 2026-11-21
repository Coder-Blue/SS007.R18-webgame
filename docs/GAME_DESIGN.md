# Game Design: Doc Quyen Kinh Te

## Fantasy

You are the chairman of the village rice corporation. The village is
industrialising faster than its rice grid. The Chairman sets the retail ceiling
and demands universal service to mountain huts. Private growers sell into the
same market. Every month you choose between social obligations and solvency.

The rice system is a direct allegory for a state-owned electricity utility:

| Rice system | Electricity system |
| --- | --- |
| Hydro and mechanized paddies | EVNGENCO and IPP generation |
| Private growers | Private generation, ~58 percent share |
| Exclusive road network | EVNNPT 500 kV / 220 kV transmission |
| Road grades | Voltage levels and line upgrades |
| Rice trucks | Dispatch and transmission losses |
| Household tier tariffs | Residential progressive tariff |
| Workshop tariff | Subsidized industrial tariff |
| Chairman's ceiling | Regulated retail price cap |
| N-2 recovery | Decision 05/2024 cost-recovery lag |
| System operator spin-off | A0 to NSMO |
| Direct rice purchase agreement | DPPA |
| Competitive retail pilot | VREM |

## Acts

### Act 1: Universal coverage and structural deficit (2022-2023)

- Extend roads to every household, especially remote huts.
- Keep the workshop tariff cheap enough for industrialization.
- Absorb El Nino drought, fertilizer and fuel shocks, and currency pressure.
- Buy at volatile market prices while retail is capped.
- End the act with deep accumulated debt.

### Act 2: The privatization debate and crisis cases (late 2023)

- Villagers and workshops ask why the roads and retail should not be privatized.
- The player answers three debate challenges. Evidence-based answers increase
  public debate score and trust; populist answers trade short-term approval for
  long-term fragility.
- California 2001 simulation: wholesale prices float while retail is frozen,
  and hoarding collapses supply. The robust choice is a regulated wholesale
  market with strategic reserves, not a frozen retail price with free wholesale.
- Texas 2021 simulation: an isolated grid with no reserve fails in extreme
  weather. The robust choice is interconnection, reserve capacity and demand
  response, not scarcity pricing alone.
- Factions act: smugglers arbitrage the subsidized workshop rate, wealthy
  workshop owners offer bribes, farmers and workers lobby opposite prices.

### Act 3: Recovery and modernization (2024-2026)

- Enact Decision 05/2024: audited N-2 losses return through the ceiling at a
  player-chosen rate.
- Optional reforms: NSMO spin-off, DPPA wheeling toll, competitive retail pilot
  and two-part tariffs.
- Manage inflation and trust while the balance sheet heals.
- Reach December 2026 with a defensible model.

## Monthly simulation

```
market walk -> demand -> production -> procurement -> sales -> costs ->
debt -> metrics -> annual audit -> events -> endings
```

### Demand

```
servedHouseholdShare = 0.55 + 0.45 * coverage / 100
householdDemand = households * servedHouseholdShare * 0.55 * season * demandIndex
workshopDemand = workshops * 18 * industrialOutput / 100
totalDemand = householdDemand + workshopDemand
```

Households are measured in thousand households, workshops in thousand
workshops, demand in thousand tonnes per month.

### Production

```
hydroYield = hydroPaddies * 24 * (1 - 0.55 * drought) * (1 + 0.02 * rnd)
mechanizedYield = mechanizedPaddies * 30 * (1 + 0.05 * irrigation)
                  * (1 + 0.03 * rnd) * fertilizerFactor
ownProduction = hydroYield + mechanizedYield
externalOffer = totalDemand * privateShare * externalSupplyFactor
```

Private growers supply at most roughly 58 percent of demand. Drought reduces
hydro output. Expensive fertilizer reduces mechanized yield. R&D raises both.

### Tariffs

Four progressive tiers with fixed population weights:

| Tier | Weight | Default | Minimum | Maximum |
| --- | --- | --- | --- | --- |
| 1 | 0.45 | 8.2 | 7.2 | 11.0 |
| 2 | 0.28 | 10.4 | 9.0 | 14.5 |
| 3 | 0.18 | 13.6 | 11.5 | 21.0 |
| 4 | 0.09 | 17.0 | 14.0 | 32.0 |

Workshop tariff: default 7.4, maximum 9.2.

The average household tariff is the weighted sum. It must not exceed the
Chairman's ceiling. The ceiling starts at 13.8 and rises with the reform:
14.2 in 2024, 14.7 in 2025, 15.1 in 2026. The top of the allowed bands
reaches an average of 15.67, so the later ceilings are attainable.

### Costs

```
productionCostPerTonne = 8.4 * (0.55 + 0.45 * fertilizerIndex)
                         * (0.80 + 0.20 * fuelIndex)
                         * (1 - 0.02 * rnd)
externalCost = purchasedTonnes * ricePrice * (1 + 0.02 * (exchange - 1))
roadMaintenance = datKm * 0.12 + daKm * 0.28 + nhuaKm * 0.50
fleetCost = fleet * 0.38 * fuelIndex
staffCost = 280 + workshops * 3
interest = debt * 0.065 / 12
wheeling = dppa * workshops * 20 + vrem * households * 0.6
          + twoPart * workshops * 4
```

### Debt

Cash below 1,000 automatically borrows to restore the floor. Cash above 4,000
automatically repays debt. Debt above 60,000 is insolvency. A one-time
Chairman bailout removes 8,000 of debt at a trust and satisfaction cost.

### N-2 recovery

From 2024, after enacting Decision 05:

```
eligibleLoss = abs(annualNetResult[year - 2])
monthlyCredit = eligibleLoss * recoveryRate / 12
```

The monthly credit is revenue, not debt relief. A higher rate speeds recovery
and raises inflation. The default rate is 0.55.

### Metrics

Satisfaction is driven by reliability, remote coverage, tariff burden and
workshop rates. Trust is driven by coverage, industrial output, inflation,
debate score and policy execution. Both are smoothed monthly and clamped to
0-100. Zero satisfaction means unrest; zero trust means dismissal.

## Player actions

| Group | Actions |
| --- | --- |
| Roads | Dirt, cobblestone, asphalt project; each adds coverage and remote coverage |
| Generation | Hydro paddy, mechanized paddy, irrigation, R&D |
| Fleet | Add 20 trucks, lower logistics cost |
| Stock | Import 100 thousand tonnes of rice at market price |
| Retail | Set four household tiers and workshop tariff within caps |
| Politics | Public campaign, anti-smuggling crackdown, bailout request |
| Reform | N-2 recovery, NSMO, DPPA, VREM, two-part tariff |

## Events

The catalog is deterministic by month, with prices and demand still seeded:

| Month | Event | Decision |
| --- | --- | --- |
| 2022-06 | El Nino | emergency imports vs irrigation rescue vs prayer |
| 2022-10 | Fertilizer shock | absorb, ration, or subsidize farmers |
| 2023-04 | Currency pressure | hedge, pass through, or price controls |
| 2023-10 | Privatization debate I | natural monopoly and sunk cost |
| 2023-11 | California 2001 | market design under a frozen retail cap |
| 2023-12 | Texas 2021 | reserve and interconnection |
| 2024-01 | Debate II | public trust and compensation |
| 2024-04 | DPPA request | direct purchase pilot |
| 2024-06 | NSMO | system operator independence |
| 2024-09 | Smugglers | crackdown or tolerance |
| 2024-11 | Bribe | classify luxury brewing as a worker tariff |
| 2025-03 | VREM | competitive retail pilot |
| 2025-07 | Farmer lobby | procurement price vs retail cap |
| 2026-03 | Final audit | N-2 execution evidence |

Every choice has a visible short consequence and a hidden flag used by endings.

## Endings

### Kien Truc Su An Ninh Quoc Gia

Debt at or below 25,000, road coverage 100, N-2 enacted, DPPA and VREM enabled,
trust at least 55, satisfaction at least 55, reliability at least 95 in the
final year, and no collapse flag.

### Tu Ban Do Doc Quyen

Treasury at least 28,000, at least two bribe or smuggler flags, and
satisfaction below 50 at the end. The village stagnates while the corporation
accumulates cash.

### Vo Tran Thi Truong / Cach Chuc

Debt above the limit, satisfaction or trust at zero, a premature privatization,
or a failed crisis simulation. The ending record names the cause.

## Balance targets

- Act 1 ends with debt between 25,000 and 45,000 if the player is passive.
- A competent player reaches 2024 with debt below 55,000 and at least 70
  percent road coverage.
- The reforms plus production investment can clear the debt by late 2026.
- Maximum tariffs alone do not win; without production investment the
  corporation still buys too much external rice and drifts toward collapse.
- The architect ending requires both social and financial performance; a
  tested 60-month playthrough ends at 14,167 billion debt with full coverage.
