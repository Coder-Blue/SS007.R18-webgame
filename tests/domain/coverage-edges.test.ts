import { describe, expect, it } from "vitest";
import { withFinalCheck } from "../../src/domain/endings";
import { averageOfTiers } from "../../src/domain/tariffs";
import { advanceMarket } from "../../src/domain/market";
import { missionStatus } from "../../src/domain/missions";
import { projectMonth } from "../../src/domain/preview";
import { advanceMonth } from "../../src/domain/tick";
import { uniqueFlag } from "../../src/domain/actions/helpers";
import { buildableZones } from "../../src/domain/actions/lines";
import { enablePolicyAction, startDecisionAction } from "../../src/domain/actions/policy";
import { completeDecision } from "../../src/domain/events/effects";
import { resolveEvent } from "../../src/domain/events/resolve";
import { scheduleEvent } from "../../src/domain/events/schedule";
import type { DecisionId, EventId } from "../../src/domain/types";
import { baseState, ledger } from "./test-helpers";

describe("coverage edges", () => {
  it("keeps a final state when an ending already exists", () => {
    const state = {
      ...baseState(),
      ending: { id: "collapse" as const, reason: "debt" as const, year: 2022, month: 1 },
    };

    expect(withFinalCheck(state)).toBe(state);
  });

  it("refreshes a fourth supplier with a neutral spread", () => {
    const state = baseState();

    const market = {
      ...state.market,
      suppliers: [
        ...state.market.suppliers,
        { id: "gas-mien-tay", kind: "gas" as const, priceVndPerKwh: 2_450, capacityMw: 100 },
      ],
    };

    const step = advanceMarket(market, 4, state.metrics, 9);

    expect(step.market.suppliers).toHaveLength(4);
  });

  it("marks a market mission as non-competitive when the chosen quote is expensive", () => {
    const state = baseState();

    const market = {
      ...state.market,
      suppliers: state.market.suppliers.map((row) =>
        row.id === state.operations.supplierId ? { ...row, priceVndPerKwh: 3_000 } : row,
      ),
    };

    expect(missionStatus({ ...state, market })[1]?.progress).toBeLessThan(100);
  });

  it("previews a market with no suppliers and no demand", () => {
    const state = baseState();
    const emptyMarket = { ...state.market, suppliers: [] };

    const noDemand = {
      ...state,
      zones: {
        urban: { ...state.zones.urban, coverage: 0 },
        industrial: { ...state.zones.industrial, coverage: 0 },
        rural: { ...state.zones.rural, coverage: 0 },
      },
    };

    expect(
      projectMonth({ ...state, market: emptyMarket }, state.operations.dispatch, state.tariffs, "x")
        .revenue,
    ).toBeGreaterThan(0);
    expect(
      projectMonth(noDemand, state.operations.dispatch, state.tariffs, "coal-quang-ninh")
        .reliability,
    ).toBe(100);
  });

  it("caps the private branch preview at the rural service limit", () => {
    const state = baseState();

    const privateBranch = {
      ...state,
      policy: { ...state.policy, branch: "private" as const, priceCap: false },
    };

    const forecast = projectMonth(
      privateBranch,
      state.operations.dispatch,
      state.tariffs,
      state.operations.supplierId,
    );

    expect(forecast.reliability).toBeLessThan(100);
  });

  it("matches the private-branch forecast with the settled average tariff", () => {
    const state = baseState();

    const privateState = {
      ...state,
      policy: { ...state.policy, branch: "private" as const, priceCap: false },
    };

    const forecast = projectMonth(
      privateState,
      privateState.operations.dispatch,
      privateState.tariffs,
      privateState.operations.supplierId,
    );

    const result = advanceMonth(privateState);

    expect(result.ok).toBe(true);

    if (result.ok) {
      expect(forecast.averageTariff).toBeCloseTo(result.value.ledger.averageRetailTariff, 6);
      expect(forecast.averageTariff).toBeGreaterThan(averageOfTiers(privateState.tariffs.tiers));
    }
  });

  it("advances a month with no connected demand", () => {
    const state = baseState();

    const result = advanceMonth({
      ...state,
      zones: {
        urban: { ...state.zones.urban, coverage: 0 },
        industrial: { ...state.zones.industrial, coverage: 0 },
        rural: { ...state.zones.rural, coverage: 0 },
      },
    });

    expect(result.ok).toBe(true);

    if (result.ok) {
      expect(result.value.ledger.reliability).toBe(100);
      expect(result.value.ledger.revenueElectricity).toBe(0);
    }
  });

  it("adds a unique flag only once", () => {
    expect(uniqueFlag(["a"], "a")).toEqual(["a"]);
    expect(uniqueFlag(["a"], "b")).toEqual(["a", "b"]);
  });

  it("excludes a zone that already has a pending line", () => {
    const state = baseState();

    const pending = {
      ...state,
      operations: {
        ...state.operations,
        projects: [
          { id: "line", kind: "line" as const, targetId: "rural", monthsLeft: 2, totalMonths: 2 },
        ],
      },
    };

    expect(buildableZones(pending)).not.toContain("rural");
  });

  it("reports already-enabled reforms for every key", () => {
    const state = {
      ...baseState(),
      clock: { year: 2025, month: 1, tick: 36 },
      policy: {
        ...baseState().policy,
        n2Enabled: true,
        nsmo: true,
        dppa: true,
        vrem: true,
        twoPartTariff: true,
      },
    };

    expect(enablePolicyAction(state, "n2").ok).toBe(false);
    expect(enablePolicyAction(state, "nsmo").ok).toBe(false);
    expect(enablePolicyAction(state, "dppa").ok).toBe(false);
    expect(enablePolicyAction(state, "vrem").ok).toBe(false);
    expect(enablePolicyAction(state, "twoPart").ok).toBe(false);
  });

  it("rejects an unknown decision definition defensively", () => {
    const state = {
      ...baseState(),
      events: {
        ...baseState().events,
        decisions: [
          // SAFETY: the cast exercises the defensive lookup branch for an id no caller can produce.
          "missing" as DecisionId,
        ],
      },
    };

    // SAFETY: the cast exercises the defensive lookup branch for an id no caller can produce.
    expect(startDecisionAction(state, "missing" as DecisionId).ok).toBe(false);
    // SAFETY: the cast exercises the defensive completion branch for a non-catalog id.
    expect(completeDecision(state, "missing" as DecisionId)).toBe(state);
  });

  it("rejects an unknown active event defensively", () => {
    const state = baseState();
    // SAFETY: the cast exercises the defensive catalog lookup branch.
    const corrupted = { ...state, events: { ...state.events, activeId: "missing" as EventId } };

    expect(resolveEvent(corrupted, "x").ok).toBe(false);
  });

  it("does not schedule after the term ended and avoids duplicate queue entries", () => {
    const ended = {
      ...baseState(),
      ending: { id: "collapse" as const, reason: "debt" as const, year: 2022, month: 1 },
    };

    const queued = {
      ...baseState(),
      events: { ...baseState().events, queue: ["media-losses" as const] },
      finance: { ...baseState().finance, monthlyHistory: [ledger({ netResult: -500 })] },
    };

    expect(scheduleEvent(ended)).toBe(ended);
    expect(scheduleEvent(queued).events.activeId).toBe("media-losses");
    expect(
      scheduleEvent({ ...queued, events: { ...queued.events, activeId: "media-losses" } }).events
        .queue,
    ).toHaveLength(0);

    const alreadyQueued = {
      ...baseState(),
      clock: { year: 2022, month: 1, tick: 9 },
      events: { ...baseState().events, queue: ["fuel-crisis" as const] },
    };

    expect(scheduleEvent(alreadyQueued).events.activeId).toBe("fuel-crisis");
  });
});
