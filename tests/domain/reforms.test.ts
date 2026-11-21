import { describe, expect, it } from "vitest";
import { createInitialState } from "../../src/domain/constants";
import { reformRevenue } from "../../src/domain/reforms";

const initial = createInitialState();

describe("reform revenue", () => {
  it("returns nothing before a reform", () => {
    expect(reformRevenue(initial.policy, initial.village)).toEqual({
      dppa: 0,
      vrem: 0,
      twoPart: 0,
      total: 0,
    });
  });

  it("prices the DPPA wheeling toll, VREM pilot and two-part tariff", () => {
    const revenue = reformRevenue(
      { ...initial.policy, dppa: true, vrem: true, twoPartTariff: true },
      initial.village,
    );

    expect(revenue.dppa).toBe(240);
    expect(revenue.vrem).toBeCloseTo(252);
    expect(revenue.twoPart).toBe(48);
    expect(revenue.total).toBeCloseTo(540);
  });
});
