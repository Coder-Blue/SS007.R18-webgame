import { describe, expect, it } from "vitest";
import { createInitialState } from "../../src/domain/constants";
import type { GameState } from "../../src/domain/types";
import { addAnnual, advanceMonth, buildNotices } from "../../src/domain/tick";

const initial = createInitialState();

const months = (count: number): GameState => {
  let state = initial;

  for (let index = 0; index < count; index += 1) {
    const result = advanceMonth(state);

    if (!result.ok) return state;

    if (result.value.state.events.activeId !== null) {
      return { ...result.value.state, events: { ...result.value.state.events, activeId: null } };
    }

    state = result.value.state;
  }

  return state;
};

describe("tick", () => {
  it("rejects advancing outside play or with a pending event", () => {
    expect(advanceMonth({ ...initial, phase: "ended" })).toEqual({
      ok: false,
      error: "tick.not-playing",
    });
    expect(
      advanceMonth({
        ...initial,
        events: { ...initial.events, activeId: "drought_2022" },
      }),
    ).toEqual({ ok: false, error: "tick.event-pending" });
  });

  it("advances one month and records a ledger", () => {
    const result = advanceMonth(initial);
    expect(result.ok).toBe(true);

    if (result.ok) {
      const { state, ledger, notices } = result.value;
      expect(ledger.month).toBe(1);
      expect(ledger.totalDemand).toBeGreaterThan(0);
      expect(ledger.costTotal).toBeGreaterThan(0);
      expect(state.clock).toEqual({ year: 2022, month: 2, tick: 1 });
      expect(state.finance.monthlyHistory).toHaveLength(1);
      expect(state.production.riceInventory).toBeGreaterThanOrEqual(0);
      expect(notices).toEqual(expect.any(Array));
    }
  });

  it("schedules the June drought when entering June", () => {
    const may = months(4);
    const result = advanceMonth(may);
    expect(result.ok).toBe(true);

    if (result.ok) {
      expect(result.value.state.clock.month).toBe(6);
      expect(result.value.state.events.activeId).toBe("drought_2022");
      expect(result.value.notices).toContain("notice.event:drought_2022");
    }
  });

  it("produces annual reports in December", () => {
    const december = {
      ...initial,
      clock: { year: 2022, month: 12, tick: 11 },
      finance: { ...initial.finance, monthlyHistory: [] },
    };

    const result = advanceMonth(december);
    expect(result.ok).toBe(true);

    if (result.ok) {
      expect(result.value.state.finance.annualHistory).toHaveLength(1);
      expect(result.value.state.finance.annualHistory[0]?.year).toBe(2022);
    }
  });

  it("grows the village in January and raises the ceiling", () => {
    const december = {
      ...initial,
      clock: { year: 2023, month: 12, tick: 23 },
    };

    const result = advanceMonth(december);
    expect(result.ok).toBe(true);

    if (result.ok) {
      expect(result.value.state.clock.year).toBe(2024);
      expect(result.value.state.village.householdsThousand).toBeGreaterThan(
        december.village.householdsThousand,
      );
      expect(result.value.state.tariffs.ceiling).toBe(14.2);
    }
  });

  it("ends in insolvency and keeps the clock at the failed month", () => {
    const state = {
      ...initial,
      clock: { year: 2022, month: 2, tick: 1 },
      finance: { ...initial.finance, debt: 65_000, cash: 1_000 },
    };

    const result = advanceMonth(state);
    expect(result.ok).toBe(true);

    if (result.ok) {
      expect(result.value.state.phase).toBe("ended");
      expect(result.value.state.ending?.reason).toBe("debt");
      expect(result.value.state.clock.month).toBe(2);
    }
  });

  it("resolves the final ending at the end of 2026", () => {
    const state = {
      ...initial,
      clock: { year: 2026, month: 12, tick: 59 },
      finance: { ...initial.finance, debt: 40_000 },
    };

    const result = advanceMonth(state);
    expect(result.ok).toBe(true);

    if (result.ok) {
      expect(result.value.state.phase).toBe("ended");
      expect(result.value.state.ending?.reason).toBe("final");
      expect(result.value.state.clock.year).toBe(2026);
    }
  });

  it("adds annual aggregation only in December", () => {
    const noReport = addAnnual([], 2022, 11, []);
    expect(noReport).toHaveLength(0);
  });

  it("builds all operational notices", () => {
    const recovery = {
      ...initial,
      clock: { year: 2024, month: 3, tick: 26 },
      policy: { ...initial.policy, n2Enabled: true },
      metrics: { ...initial.metrics, inflation: 10, satisfaction: 20 },
      finance: {
        ...initial.finance,
        annualHistory: [
          {
            year: 2022,
            revenue: 1,
            costs: 2,
            netResult: -12_000,
            debtEnd: 1,
            coverage: 1,
            trustAverage: 1,
            satisfactionAverage: 1,
            reliability: 1,
            inflationAverage: 1,
          },
        ],
      },
    };

    expect(buildNotices(recovery, 10, 100)).toEqual(
      expect.arrayContaining([
        "notice.shortage",
        "notice.inflation",
        "notice.recovery",
        "notice.unrest",
      ]),
    );
    expect(
      buildNotices(
        {
          ...initial,
          finance: { ...initial.finance, debt: 50_000 },
          infrastructure: { ...initial.infrastructure, coverage: 100 },
        },
        0,
        0,
      ),
    ).toEqual(["notice.debt", "notice.coverage"]);
  });

  it("reports no notices for a stable month", () => {
    expect(buildNotices(initial, 0, 0)).toEqual([]);
  });
});

describe("zero-demand tick", () => {
  it("uses full reliability and zero served ratio when nobody is connected", () => {
    const state = {
      ...initial,
      village: {
        householdsThousand: 0,
        remoteHouseholdsThousand: 0,
        workshopsThousand: 0,
      },
      production: { ...initial.production, riceInventory: 0 },
      infrastructure: { ...initial.infrastructure, coverage: 0, fleet: 0 },
    };

    const result = advanceMonth(state);
    expect(result.ok).toBe(true);

    if (result.ok) {
      expect(result.value.ledger.totalDemand).toBe(0);
      expect(result.value.ledger.reliability).toBe(100);
      expect(result.value.ledger.revenueTotal).toBe(0);
    }
  });
});
