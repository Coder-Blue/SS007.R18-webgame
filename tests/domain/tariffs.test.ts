import { describe, expect, it } from "vitest";
import {
  averageHouseholdTariff,
  computeRevenue,
  tariffBurden,
  validateTariffs,
  withCeiling,
} from "../../src/domain/tariffs";
import { INITIAL_TARIFFS } from "../../src/domain/constants";
import type { TariffTiers } from "../../src/domain/types";

const tiers: readonly [number, number, number, number] = [8, 10, 12, 15];

describe("tariffs", () => {
  it("weights the four progressive tiers", () => {
    expect(averageHouseholdTariff(INITIAL_TARIFFS)).toBeCloseTo(10.58, 2);
    expect(averageHouseholdTariff({ ...INITIAL_TARIFFS, tiers })).toBeCloseTo(
      8 * 0.45 + 10 * 0.28 + 12 * 0.18 + 15 * 0.09,
    );
  });

  it("splits revenue by segment", () => {
    const revenue = computeRevenue(200, 100, INITIAL_TARIFFS, 0.9);
    expect(revenue.household).toBeCloseTo(200 * 10.58 * 0.9, 2);
    expect(revenue.workshop).toBeCloseTo(100 * 7.4 * 0.9);
    expect(revenue.total).toBeCloseTo(revenue.household + revenue.workshop);
  });

  it("accepts a valid in-ceiling tariff", () => {
    const validated = validateTariffs(tiers, 7.4, 13.8);
    expect(validated.ok).toBe(true);

    if (validated.ok) {
      expect(validated.value.tiers).toEqual(tiers);
      expect(validated.value.workshop).toBe(7.4);
      expect(validated.value.ceiling).toBe(13.8);
    }
  });

  it.each([
    [[7, 10, 12, 15], 7.4, "tariff.out-of-band"],
    [[9, 9, 12, 15], 7.4, "tariff.not-progressive"],
    [[8, 10, 12, 15], 5, "tariff.workshop-out-of-band"],
    [[10.2, 13.2, 18.0, 26.0], 9.2, "tariff.above-ceiling"],
  ] as const)("rejects invalid tariff input %j / %j", (candidate, workshop, error) => {
    const result = validateTariffs(candidate, workshop, 13.8);

    expect(result).toEqual({ ok: false, error });
  });

  it("rejects a malformed tier list defensively", () => {
    const result = validateTariffs([8, 10, 12], 7.4, 13.8);

    expect(result).toEqual({ ok: false, error: "tariff.missing-tier" });
  });

  it("updates the ceiling", () => {
    const updated: TariffTiers = withCeiling(INITIAL_TARIFFS, 15.1);
    expect(updated.ceiling).toBe(15.1);
    expect(updated.tiers).toEqual(INITIAL_TARIFFS.tiers);
  });

  it("computes a tariff burden against income", () => {
    expect(tariffBurden(11, 1)).toBe(110);
    expect(tariffBurden(11, 0)).toBe(220);
  });
});
