import { describe, expect, it } from "vitest";
import {
  averageHouseholdTariff,
  averageOfTiers,
  industrialRevenue,
  lossFactor,
  residentialRevenue,
  tariffChangePct,
  validateTariffs,
} from "../../src/domain/tariffs";
import { INITIAL_TARIFFS } from "../../src/domain/constants";

describe("tariffs", () => {
  it("weights the six progressive tiers", () => {
    expect(averageHouseholdTariff(INITIAL_TARIFFS)).toBeCloseTo(2_438.19, 1);
    expect(averageOfTiers([2_000, 2_000, 2_000, 2_000, 2_000, 2_000])).toBe(2_000);
  });

  it("computes percentage changes without dividing by zero", () => {
    expect(tariffChangePct(0, 100)).toBe(0);
    expect(tariffChangePct(100, 105)).toBe(5);
  });

  it("accepts a progressive plan inside every band", () => {
    const result = validateTariffs(
      { tiers: [1_806, 1_900, 2_200, 2_700, 3_050, 3_117], industrial: 1_750 },
      2_450,
    );

    expect(result.ok).toBe(true);
  });

  it("rejects invalid plans", () => {
    expect(
      validateTariffs(
        { tiers: [1_600, 1_866, 2_167, 2_729, 3_050, 3_117], industrial: 1_750 },
        2_500,
      ).ok,
    ).toBe(false);
    expect(
      validateTariffs(
        { tiers: [1_806, 1_806, 2_167, 2_729, 3_050, 3_117], industrial: 1_750 },
        2_500,
      ).ok,
    ).toBe(false);
    expect(
      validateTariffs(
        { tiers: [1_806, 1_866, 2_167, 2_729, 3_050, 3_117], industrial: 1_000 },
        2_500,
      ).ok,
    ).toBe(false);
    expect(
      validateTariffs(
        { tiers: [1_806, 1_866, 2_167, 2_729, 3_050, 3_117], industrial: 1_750 },
        1_000,
      ).ok,
    ).toBe(false);
    expect(
      validateTariffs(
        { tiers: [1_806, Number.NaN, 2_167, 2_729, 3_050, 3_117], industrial: 1_750 },
        2_500,
      ).ok,
    ).toBe(false);
    expect(
      validateTariffs(
        { tiers: [1_806, 1_866, 2_167, 2_729, 3_050, 3_117], industrial: Number.NaN },
        2_500,
      ).ok,
    ).toBe(false);
  });

  it("converts energy into revenue", () => {
    expect(residentialRevenue(1_000, 2_500)).toBe(2_500);
    expect(industrialRevenue(1_000, 1_750)).toBe(1_750);
  });

  it("reduces losses as the grid strengthens and floors at four percent", () => {
    expect(lossFactor(0)).toBe(0.09);
    expect(lossFactor(100)).toBe(0.04);
    expect(lossFactor(50)).toBeCloseTo(0.065);
  });
});
