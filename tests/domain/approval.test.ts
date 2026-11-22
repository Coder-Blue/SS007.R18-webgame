import { describe, expect, it } from "vitest";
import {
  approvalLikelihood,
  auditTariffRequest,
  tariffChangePercent,
} from "../../src/domain/approval";
import {
  dispatchPreview,
  nextAverage,
  projectMonth,
  supplierPreview,
  tariffPreview,
} from "../../src/domain/preview";
import { baseState } from "./test-helpers";

describe("approval", () => {
  it("computes the change against the current weighted average", () => {
    const state = baseState();

    expect(tariffChangePercent(state, 2_439)).toBeCloseTo(0, 1);
    expect(
      tariffChangePercent(
        { ...state, tariffs: { ...state.tariffs, tiers: [0, 0, 0, 0, 0, 0] } },
        100,
      ),
    ).toBe(0);
  });

  it("raises the likelihood when costs and deficits justify a hike", () => {
    const state = baseState();
    const normal = approvalLikelihood(state, 2_500, 2.5);

    const stressed = approvalLikelihood(
      {
        ...state,
        market: { ...state.market, fuelPriceIndex: 1.6 },
        finance: { ...state.finance, accumulatedLoss: 20_000, debt: 90_000 },
        policy: { ...state.policy, petitionDone: true },
      },
      2_700,
      8,
    );

    expect(stressed).toBeGreaterThan(normal);
  });

  it("penalizes inflation, overshoot and the private branch", () => {
    const state = baseState();

    const high = approvalLikelihood(
      {
        ...state,
        metrics: { ...state.metrics, inflation: 20, citizenTrust: 10 },
        policy: { ...state.policy, branch: "private" },
      },
      3_000,
      30,
    );

    expect(high).toBe(5);
  });

  it("audits with a threshold at fifty-five", () => {
    const state = baseState();

    expect(auditTariffRequest(state, 2_600, 6).approved).toBe(
      auditTariffRequest(state, 2_600, 6).likelihood >= 55,
    );
  });
});

describe("preview", () => {
  it("projects a month from dispatch and tariffs", () => {
    const state = baseState();

    const preview = projectMonth(
      state,
      state.operations.dispatch,
      state.tariffs,
      "coal-quang-ninh",
    );

    expect(preview.revenue).toBeGreaterThan(0);
    expect(preview.cost).toBeGreaterThan(0);
    expect(Number.isFinite(preview.netResult)).toBe(true);
    expect(preview.approvalLikelihood).toBeGreaterThan(0);
  });

  it("compares before and after dispatch and supplier choices", () => {
    const state = baseState();
    const dispatch = dispatchPreview(state, { hydroMw: 100, thermalMw: 100, importMw: 10 });
    const supplier = supplierPreview(state, "ipp-lac-hong");

    expect(dispatch.before.netResult).not.toBe(dispatch.after.netResult);
    expect(supplier.after.revenue).toBeGreaterThan(0);
  });

  it("falls back when a supplier id is unknown", () => {
    const state = baseState();
    const preview = projectMonth(state, state.operations.dispatch, state.tariffs, "missing");

    expect(preview.revenue).toBeGreaterThan(0);
  });

  it("handles an empty industrial tariff in the preview", () => {
    const state = baseState();
    const zero = { ...state, tariffs: { ...state.tariffs, industrial: 0 } };

    expect(
      projectMonth(zero, zero.operations.dispatch, zero.tariffs, "coal-quang-ninh").revenue,
    ).toBeGreaterThan(0);
  });

  it("previews a tariff plan and its average", () => {
    const state = baseState();
    const tiers = [1_806, 2_000, 2_300, 2_800, 3_100, 3_200] as const;
    const preview = tariffPreview(state, tiers, 1_800);

    expect(preview.after.averageTariff).toBeCloseTo(nextAverage(tiers));
  });
});
