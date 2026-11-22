import { describe, expect, it } from "vitest";
import {
  buildLineAction,
  buildableZones,
  canBuildLine,
  lineProjectOf,
} from "../../src/domain/actions/lines";
import {
  buildPlantAction,
  buildablePlants,
  isPlantKind,
  plantAction,
  plantPlan,
} from "../../src/domain/actions/plants";
import { setDispatchAction, setSupplierAction } from "../../src/domain/actions/dispatch";
import {
  cancelApprovalAction,
  requestTariffAction,
  resolveApprovalAction,
  setRecoveryRateAction,
} from "../../src/domain/actions/tariffs";
import {
  enableN2Action,
  enablePolicyAction,
  setRecoveryRate,
  startDecisionAction,
} from "../../src/domain/actions/policy";
import { baseState } from "./test-helpers";
import { ceilingFor } from "../../src/domain/constants";

const rich = () => ({
  ...baseState(),
  finance: { ...baseState().finance, cash: 50_000 },
});

describe("line actions", () => {
  it("builds a line and charges the treasury", () => {
    const state = rich();
    const result = buildLineAction(state, "rural");

    expect(result.ok).toBe(true);

    if (result.ok) {
      expect(result.value.operations.projects).toHaveLength(1);
      expect(result.value.finance.cash).toBeLessThan(state.finance.cash);
    }
  });

  it("rejects a completed zone, a pending zone and a full queue", () => {
    const state = rich();

    const done = {
      ...state,
      zones: { ...state.zones, urban: { ...state.zones.urban, coverage: 100 } },
    };

    const pending = buildLineAction(state, "rural");

    expect(buildLineAction(done, "urban").ok).toBe(false);

    if (pending.ok) {
      expect(buildLineAction(pending.value, "rural").ok).toBe(false);

      const full = {
        ...pending.value,
        operations: {
          ...pending.value.operations,
          projects: [
            ...pending.value.operations.projects,
            { id: "a", kind: "hydro" as const, targetId: "hydro", monthsLeft: 2, totalMonths: 2 },
            {
              id: "b",
              kind: "thermal" as const,
              targetId: "thermal",
              monthsLeft: 2,
              totalMonths: 2,
            },
          ],
        },
      };

      expect(buildLineAction(full, "industrial").ok).toBe(false);
    }
  });

  it("fails when the treasury cannot cover the line", () => {
    const state = {
      ...baseState(),
      finance: { ...baseState().finance, cash: 0, debt: baseState().finance.debtLimit },
    };

    expect(buildLineAction(state, "rural").ok).toBe(false);
  });

  it("reports buildable zones and plans", () => {
    expect(buildableZones(baseState())).toContain("rural");
    expect(canBuildLine(baseState(), "rural")).toBe(true);
    expect(lineProjectOf("rural").coverage).toBeGreaterThan(0);
  });
});

describe("plant actions", () => {
  it("builds every plant kind when funded", () => {
    for (const kind of buildablePlants()) {
      const result = buildPlantAction(rich(), kind);

      expect(result.ok).toBe(true);
    }
  });

  it("rejects an unfunded plant", () => {
    const state = {
      ...baseState(),
      finance: { ...baseState().finance, cash: 0, debt: baseState().finance.debtLimit },
    };

    expect(buildPlantAction(state, "hydro").ok).toBe(false);
  });

  it("validates plant kinds and exposes plans", () => {
    expect(isPlantKind("hydro")).toBe(true);
    expect(isPlantKind("coal")).toBe(false);
    expect(plantPlan("thermal").capacityMw).toBe(300);
    expect(plantAction(rich(), "thermal").ok).toBe(true);
    expect(plantAction(rich(), "coal").ok).toBe(true);
  });
});

describe("dispatch actions", () => {
  it("clamps sliders to installed capacity", () => {
    const result = setDispatchAction(baseState(), {
      hydroMw: 99_999,
      thermalMw: 10,
      importMw: 99_999,
    });

    expect(result.ok).toBe(true);

    if (result.ok) {
      expect(result.value.operations.dispatch.hydroMw).toBe(baseState().generation.hydroCapacityMw);
    }
  });

  it("ignores non-finite values", () => {
    const state = baseState();

    const result = setDispatchAction(state, {
      hydroMw: Number.NaN,
      thermalMw: 1,
      importMw: 1,
    });

    expect(result.ok).toBe(true);

    if (result.ok) expect(result.value).toBe(state);
  });

  it("selects a supplier and rejects an unknown one", () => {
    expect(setSupplierAction(baseState(), "ipp-lac-hong").ok).toBe(true);
    expect(setSupplierAction(baseState(), "missing").ok).toBe(false);
  });
});

describe("tariff actions", () => {
  it("applies a small adjustment immediately", () => {
    const state = baseState();
    const result = requestTariffAction(state, [1_800, 1_850, 2_150, 2_700, 3_020, 3_100], 1_760);

    expect(result.ok).toBe(true);

    if (result.ok) {
      expect(result.value.approval).toBeNull();
      expect(result.value.tariffs.tiers[0]).toBe(1_800);
    }
  });

  it("creates a state audit for a large adjustment", () => {
    const base = baseState();

    const state = {
      ...base,
      clock: { year: 2026, month: 1, tick: 48 },
      tariffs: { ...base.tariffs, ceiling: ceilingFor(2026) },
    };

    const result = requestTariffAction(state, [2_000, 2_050, 2_400, 2_900, 3_200, 3_300], 1_900);

    expect(result.ok).toBe(true);

    if (result.ok) {
      expect(result.value.approval?.likelihood).toBeGreaterThan(0);
      expect(result.value.tariffs).toEqual(state.tariffs);
    }
  });

  it("rejects invalid plans and the private branch", () => {
    expect(
      requestTariffAction(baseState(), [1_000, 1_866, 2_167, 2_729, 3_050, 3_117], 1_750).ok,
    ).toBe(false);
    expect(
      requestTariffAction(
        { ...baseState(), policy: { ...baseState().policy, priceCap: false } },
        [1_806, 1_866, 2_167, 2_729, 3_050, 3_117],
        1_750,
      ).ok,
    ).toBe(false);
  });

  it("resolves an approval as accepted when the audit is favourable", () => {
    const base = baseState();

    const state = {
      ...base,
      clock: { year: 2026, month: 1, tick: 48 },
      tariffs: { ...base.tariffs, ceiling: ceilingFor(2026) },
    };

    const requested = requestTariffAction(state, [2_000, 2_050, 2_400, 2_900, 3_200, 3_300], 1_900);

    expect(requested.ok).toBe(true);

    if (!requested.ok) return;

    const result = resolveApprovalAction({
      ...requested.value,
      approval:
        requested.value.approval === null ? null : { ...requested.value.approval, likelihood: 80 },
      market: { ...requested.value.market, fuelPriceIndex: 2 },
      finance: { ...requested.value.finance, accumulatedLoss: 40_000, debt: 90_000 },
      policy: { ...requested.value.policy, petitionDone: true },
    });

    expect(result.ok).toBe(true);

    if (result.ok) {
      expect(result.value.events.flags).toContain("approval-approved");
      expect(result.value.approval).toBeNull();
    }
  });

  it("resolves an approval as refused when the audit is hostile", () => {
    const base = baseState();

    const state = {
      ...base,
      clock: { year: 2026, month: 1, tick: 48 },
      tariffs: { ...base.tariffs, ceiling: ceilingFor(2026) },
    };

    const requested = requestTariffAction(state, [2_000, 2_050, 2_400, 2_900, 3_200, 3_300], 1_900);

    expect(requested.ok).toBe(true);

    if (!requested.ok) return;

    const result = resolveApprovalAction({
      ...requested.value,
      metrics: { ...requested.value.metrics, inflation: 20, citizenTrust: 10 },
      policy: { ...requested.value.policy, branch: "private" },
    });

    expect(result.ok).toBe(true);

    if (result.ok) {
      expect(result.value.events.flags).toContain("approval-refused");
      expect(result.value.metrics.institutionalTrust).toBeLessThan(
        requested.value.metrics.institutionalTrust,
      );
    }
  });

  it("rejects a missing approval and bad recovery rates", () => {
    expect(resolveApprovalAction(baseState()).ok).toBe(false);
    expect(setRecoveryRateAction(baseState(), 0.1).ok).toBe(false);
    expect(setRecoveryRateAction(baseState(), 0.5).ok).toBe(true);
    expect(cancelApprovalAction({ ...baseState(), approval: null }).ok).toBe(true);
  });
});

describe("policy actions", () => {
  it("unlocks N-2 only after the petition and 2024", () => {
    expect(enableN2Action(baseState()).ok).toBe(false);
    expect(enableN2Action({ ...baseState(), clock: { year: 2024, month: 1, tick: 24 } }).ok).toBe(
      false,
    );
    expect(
      enableN2Action({
        ...baseState(),
        clock: { year: 2024, month: 1, tick: 24 },
        policy: { ...baseState().policy, petitionDone: true },
      }).ok,
    ).toBe(true);
    expect(
      enableN2Action({
        ...baseState(),
        clock: { year: 2025, month: 1, tick: 36 },
        policy: { ...baseState().policy, n2Enabled: true },
      }).ok,
    ).toBe(false);
    expect(
      enableN2Action({
        ...baseState(),
        clock: { year: 2025, month: 1, tick: 36 },
        events: { ...baseState().events, flags: ["event:revised-law:enact-law"] },
      }).ok,
    ).toBe(true);
  });

  it("enables policy reforms with prerequisites", () => {
    const state = { ...baseState(), clock: { year: 2025, month: 1, tick: 36 } };

    expect(enablePolicyAction(state, "nsmo").ok).toBe(true);
    expect(enablePolicyAction(state, "twoPart").ok).toBe(false);
    expect(
      enablePolicyAction({ ...state, policy: { ...state.policy, vrem: true } }, "twoPart").ok,
    ).toBe(true);
    expect(enablePolicyAction(state, "dppa").ok).toBe(true);
    expect(enablePolicyAction(state, "vrem").ok).toBe(true);
    expect(
      enablePolicyAction({ ...state, policy: { ...state.policy, nsmo: true } }, "nsmo").ok,
    ).toBe(false);
    expect(
      enablePolicyAction({ ...state, clock: { year: 2024, month: 1, tick: 24 } }, "nsmo").ok,
    ).toBe(false);
    expect(
      enablePolicyAction({ ...state, policy: { ...state.policy, branch: "private" } }, "dppa").ok,
    ).toBe(false);
  });

  it("validates the recovery rate", () => {
    expect(setRecoveryRate(baseState(), 0.2).ok).toBe(false);
    expect(setRecoveryRate(baseState(), 0.5).ok).toBe(true);
  });

  it("starts an available decision and rejects invalid ones", () => {
    const state = {
      ...rich(),
      events: { ...baseState().events, decisions: ["keep-fuel" as const] },
    };

    expect(startDecisionAction(state, "keep-fuel").ok).toBe(true);
    expect(startDecisionAction(baseState(), "keep-fuel").ok).toBe(false);
    expect(
      startDecisionAction(
        {
          ...state,
          events: { ...state.events, completedDecisions: ["keep-fuel"] },
        },
        "keep-fuel",
      ).ok,
    ).toBe(false);

    const building = startDecisionAction(state, "keep-fuel");

    if (building.ok) {
      expect(startDecisionAction(building.value, "keep-fuel").ok).toBe(false);
    }
  });

  it("rejects an unfunded decision", () => {
    const state = {
      ...baseState(),
      finance: { ...baseState().finance, cash: 0, debt: baseState().finance.debtLimit },
      events: { ...baseState().events, decisions: ["policy-petition" as const] },
    };

    expect(startDecisionAction(state, "policy-petition").ok).toBe(false);
  });
});
