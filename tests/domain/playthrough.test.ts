import { describe, expect, it } from "vitest";
import {
  advanceMonth,
  buildLineAction,
  createInitialState,
  enableN2Action,
  requestTariffAction,
  resolveApprovalAction,
  resolveEvent,
  setDispatchAction,
  startDecisionAction,
} from "../../src/domain";
import type { GameState } from "../../src/domain";

const eventChoice = (state: GameState): string => {
  if (state.events.activeId === "fuel-crisis") return "hedge-crisis";

  if (state.events.activeId === "summer-drought") return "maximize-hydro";

  if (state.events.activeId === "public-skepticism") return "reform-path";

  if (state.events.activeId === "revised-law") return "enact-law";

  return "acknowledge-media";
};

const play = (): GameState => {
  let state = createInitialState(7);

  for (let month = 0; month < 60; month += 1) {
    if (state.ending !== null) break;

    if (state.approval !== null) {
      const resolved = resolveApprovalAction(state);

      if (resolved.ok) state = resolved.value;
    }

    while (state.events.activeId !== null) {
      const resolved = resolveEvent(state, eventChoice(state));

      if (!resolved.ok) break;
      state = resolved.value;
    }

    for (const zone of ["rural", "industrial", "urban"] as const) {
      const built = buildLineAction(state, zone);

      if (built.ok) state = built.value;
    }

    for (const decision of state.events.decisions) {
      if (!state.events.completedDecisions.includes(decision)) {
        const started = startDecisionAction(state, decision);

        if (started.ok) state = started.value;
      }
    }

    if (state.clock.month === 1 || state.clock.month === 7) {
      const current = state.tariffs.tiers;

      const tiers: [number, number, number, number, number, number] = [
        Math.min(current[0] * 1.05, 2_050),
        Math.min(current[1] * 1.05, 2_120),
        Math.min(current[2] * 1.05, 2_450),
        Math.min(current[3] * 1.05, 2_980),
        Math.min(current[4] * 1.05, 3_260),
        Math.min(current[5] * 1.05, 3_340),
      ];

      const requested = requestTariffAction(state, tiers, state.tariffs.industrial);

      if (requested.ok) {
        state = requested.value;

        if (state.approval !== null) {
          const resolved = resolveApprovalAction(state);

          if (resolved.ok) state = resolved.value;
        }
      }
    }

    if (state.policy.petitionDone && !state.policy.n2Enabled) {
      const enabled = enableN2Action(state);

      if (enabled.ok) state = enabled.value;
    }

    const summer = state.clock.month >= 4 && state.clock.month <= 8;

    const dispatch = setDispatchAction(
      state,
      summer
        ? { hydroMw: 700, thermalMw: 750, importMw: 250 }
        : { hydroMw: 550, thermalMw: 450, importMw: 150 },
    );

    if (dispatch.ok) state = dispatch.value;
    const outcome = advanceMonth(state);

    if (!outcome.ok) break;
    state = outcome.value.state;
  }

  return state;
};

describe("five-year playthrough", () => {
  it("delivers universal coverage and a controlled structural deficit", () => {
    const state = play();
    const cumulative = state.finance.monthlyHistory.reduce((sum, row) => sum + row.netResult, 0);

    expect(state.finance.monthlyHistory).toHaveLength(60);
    expect(state.zones.urban.coverage).toBe(100);
    expect(state.zones.industrial.coverage).toBe(100);
    expect(state.zones.rural.coverage).toBe(100);
    expect(cumulative).toBeLessThan(0);
    expect(cumulative).toBeGreaterThan(-60_000);
    expect(state.finance.debt).toBeLessThan(100_000);
    expect(state.ending).not.toBeNull();
  });

  it("keeps the final ledger conservative even after reforms", () => {
    const state = play();
    const revenue = state.finance.monthlyHistory.reduce((sum, row) => sum + row.revenueTotal, 0);
    const costs = state.finance.monthlyHistory.reduce((sum, row) => sum + row.costTotal, 0);

    expect(costs).toBeGreaterThan(revenue);
    expect(state.metrics.citizenTrust).toBeGreaterThanOrEqual(0);
    expect(state.metrics.institutionalTrust).toBeGreaterThanOrEqual(0);
  });
});
