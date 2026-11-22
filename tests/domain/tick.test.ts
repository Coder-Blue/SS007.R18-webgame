import { describe, expect, it } from "vitest";
import { advanceMonth, buildNotices } from "../../src/domain/tick";
import { baseState, ledger } from "./test-helpers";

describe("advanceMonth", () => {
  it("refuses to advance outside a playing phase", () => {
    expect(advanceMonth({ ...baseState(), phase: "ended" }).ok).toBe(false);
  });

  it("refuses to advance while an event is active", () => {
    const state = baseState();

    expect(
      advanceMonth({ ...state, events: { ...state.events, activeId: "fuel-crisis" } }).ok,
    ).toBe(false);
  });

  it("refuses to advance while an approval is pending", () => {
    const state = baseState();

    const approval = {
      proposedTiers: [1_806, 1_866, 2_167, 2_729, 3_050, 3_117] as const,
      proposedIndustrial: 1_750,
      average: 2_439,
      changePct: 10,
      likelihood: 60,
    };

    expect(advanceMonth({ ...state, approval }).ok).toBe(false);
  });

  it("records a month and advances the clock", () => {
    const result = advanceMonth(baseState());

    expect(result.ok).toBe(true);

    if (!result.ok) return;
    expect(result.value.ledger.year).toBe(2022);
    expect(result.value.state.clock.month).toBe(2);
    expect(result.value.state.finance.monthlyHistory).toHaveLength(1);
    expect(result.value.ledger.energySoldMillionKwh).toBeGreaterThan(0);
    expect(result.value.ledger.revenueElectricity).toBeGreaterThan(0);
  });

  it("advances construction and completes a line", () => {
    const state = baseState();

    const queued = {
      ...state,
      operations: {
        ...state.operations,
        projects: [
          {
            id: "line-rural",
            kind: "line" as const,
            targetId: "rural",
            monthsLeft: 1,
            totalMonths: 1,
          },
        ],
      },
    };

    const result = advanceMonth(queued);

    expect(result.ok).toBe(true);

    if (result.ok) {
      expect(result.value.state.zones.rural.coverage).toBeGreaterThan(state.zones.rural.coverage);
      expect(result.value.notices.some((notice) => notice.startsWith("notice.project:"))).toBe(
        true,
      );
    }
  });

  it("completes a reform project and emits a notice", () => {
    const state = baseState();

    const result = advanceMonth({
      ...state,
      policy: {
        ...state.policy,
        reformProgress: [{ key: "n2", monthsLeft: 1, totalMonths: 4 }],
      },
    });

    expect(result.ok).toBe(true);

    if (result.ok) {
      expect(result.value.state.policy.n2Enabled).toBe(true);
      expect(result.value.notices).toContain("notice.reform:n2");
    }
  });

  it("completes a mission and pays the trust reward", () => {
    const state = baseState();

    const ready = {
      ...state,
      zones: {
        urban: { ...state.zones.urban, coverage: 100 },
        industrial: { ...state.zones.industrial, coverage: 100 },
        rural: { ...state.zones.rural, coverage: 100 },
      },
      policy: { ...state.policy, n2Enabled: true, nsmo: true, dppa: true },
      operations: {
        ...state.operations,
        dispatch: { hydroMw: 800, thermalMw: 900, importMw: 300 },
      },
    };

    const result = advanceMonth(ready);

    expect(result.ok).toBe(true);

    if (result.ok) {
      expect(result.value.state.missions.completed).toContain("electrification");
      expect(result.value.notices).toContain("notice.mission:electrification");
    }
  });

  it("applies media decay and decrements the press window", () => {
    const state = baseState();

    const result = advanceMonth({ ...state, media: { ...state.media, activeMonths: 2 } });

    expect(result.ok).toBe(true);

    if (result.ok) {
      expect(result.value.ledger.mediaActive).toBe(true);
      expect(result.value.state.media.activeMonths).toBe(1);
    }
  });

  it("spikes tariffs when the price cap is gone", () => {
    const state = baseState();

    const result = advanceMonth({
      ...state,
      policy: { ...state.policy, priceCap: false, branch: "private" },
    });

    expect(result.ok).toBe(true);

    if (result.ok) {
      expect(result.value.ledger.averageRetailTariff).toBeGreaterThan(state.tariffs.tiers[0] ?? 0);
    }
  });

  it("records an annual report in December", () => {
    const state = baseState();

    const december = {
      ...state,
      clock: { year: 2022, month: 12, tick: 11 },
      finance: { ...state.finance, monthlyHistory: [ledger({ month: 1 })] },
    };

    const result = advanceMonth(december);

    expect(result.ok).toBe(true);

    if (result.ok) expect(result.value.state.finance.annualHistory).toHaveLength(1);
  });

  it("ends the term at the final audit", () => {
    const state = baseState();

    const result = advanceMonth({
      ...state,
      clock: { year: 2026, month: 12, tick: 59 },
    });

    expect(result.ok).toBe(true);

    if (result.ok) {
      expect(result.value.state.phase).toBe("ended");
      expect(result.value.state.ending).not.toBeNull();
    }
  });

  it("ends immediately when a trust metric hits zero", () => {
    const state = baseState();

    const result = advanceMonth({
      ...state,
      metrics: { ...state.metrics, citizenTrust: 0 },
      operations: { ...state.operations, dispatch: { hydroMw: 0, thermalMw: 0, importMw: 0 } },
      media: { ...state.media, activeMonths: 3 },
    });

    expect(result.ok).toBe(true);

    if (result.ok) expect(result.value.state.ending?.reason).toBe("citizen-trust");
  });

  it("fails when the market has no suppliers", () => {
    const state = baseState();

    expect(advanceMonth({ ...state, market: { ...state.market, suppliers: [] } }).ok).toBe(false);
  });
});

describe("buildNotices", () => {
  it("reports every operational alert", () => {
    const notices = buildNotices(
      {
        ...baseState(),
        finance: { ...baseState().finance, debt: 90_000 },
        policy: { ...baseState().policy, branch: "private" },
      },
      ledger({ shortageMw: 5, reliability: 80, reserveMargin: 1, mediaActive: true }),
      [{ id: "1", kind: "line", targetId: "rural", monthsLeft: 1, totalMonths: 1 }],
      ["electrification"],
    );

    expect(notices).toEqual(
      expect.arrayContaining([
        "notice.shortage",
        "notice.blackout",
        "notice.reserve",
        "notice.debt",
        "notice.media",
        "notice.privatization",
        "notice.mission:electrification",
        "notice.project:line:rural",
      ]),
    );
  });

  it("stays quiet in a healthy month", () => {
    expect(
      buildNotices(
        baseState(),
        ledger({ shortageMw: 0, reliability: 100, reserveMargin: 30 }),
        [],
        [],
      ),
    ).toHaveLength(0);
  });
});
