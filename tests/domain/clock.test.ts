import { describe, expect, it } from "vitest";
import {
  actOf,
  clamp,
  clockOfTick,
  gameDateLabel,
  isGameOverDate,
  isYearEnd,
  monthIndex,
  monthOfTick,
  nextClock,
  seasonFactor,
  seasonOf,
  yearOfTick,
} from "../../src/domain/clock";

describe("clock", () => {
  it.each([
    [1, "xuan"],
    [3, "xuan"],
    [4, "ha"],
    [6, "ha"],
    [7, "thu"],
    [9, "thu"],
    [10, "dong"],
    [12, "dong"],
  ] as const)("maps month %i to season %s", (month, season) => {
    expect(seasonOf(month)).toBe(season);
  });

  it("uses a demand premium in summer and a discount in winter", () => {
    expect(seasonFactor(1)).toBe(1);
    expect(seasonFactor(7)).toBe(1);
    expect(seasonFactor(5)).toBe(1.08);
    expect(seasonFactor(11)).toBe(0.96);
  });

  it.each([
    [2022, 1, 1],
    [2023, 9, 1],
    [2023, 10, 2],
    [2023, 12, 2],
    [2024, 1, 3],
    [2026, 12, 3],
  ] as const)("maps %i-%i to act %i", (year, month, act) => {
    expect(actOf(year, month)).toBe(act);
  });

  it("rolls December into January of the next year", () => {
    expect(nextClock({ year: 2022, month: 12, tick: 11 })).toEqual({
      year: 2023,
      month: 1,
      tick: 12,
    });
    expect(nextClock({ year: 2022, month: 1, tick: 0 })).toEqual({
      year: 2022,
      month: 2,
      tick: 1,
    });
  });

  it("converts between tick and month labels", () => {
    expect(monthIndex({ year: 2022, month: 1, tick: 0 })).toBe(0);
    expect(monthIndex({ year: 2023, month: 1, tick: 12 })).toBe(12);
    expect(yearOfTick(0)).toBe(2022);
    expect(yearOfTick(11)).toBe(2022);
    expect(yearOfTick(12)).toBe(2023);
    expect(monthOfTick(0)).toBe(1);
    expect(monthOfTick(11)).toBe(12);
    expect(monthOfTick(12)).toBe(1);
    expect(clockOfTick(25)).toEqual({ year: 2024, month: 2, tick: 25 });
  });

  it("detects year end and the game over date", () => {
    expect(isYearEnd(12)).toBe(true);
    expect(isYearEnd(11)).toBe(false);
    expect(isGameOverDate({ year: 2026, month: 12, tick: 59 })).toBe(false);
    expect(isGameOverDate({ year: 2027, month: 1, tick: 60 })).toBe(true);
  });

  it("formats a Vietnamese date label", () => {
    expect(gameDateLabel(2024, 7)).toBe("Thang 7/2024");
  });

  it("clamps values at both bounds", () => {
    expect(clamp(-2, 0, 10)).toBe(0);
    expect(clamp(12, 0, 10)).toBe(10);
    expect(clamp(4, 0, 10)).toBe(4);
  });
});
