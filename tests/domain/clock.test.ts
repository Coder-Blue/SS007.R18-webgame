import { describe, expect, it } from "vitest";
import {
  actOf,
  clamp,
  clockOfTick,
  isYearEnd,
  monthIndex,
  monthOfTick,
  nextClock,
  seasonOf,
  yearOfTick,
} from "../../src/domain/clock";

describe("clock", () => {
  it("maps months to seasons", () => {
    expect(["spring", "summer", "autumn", "winter"]).toEqual([
      seasonOf(1),
      seasonOf(4),
      seasonOf(7),
      seasonOf(10),
    ]);
  });

  it("maps years to acts", () => {
    expect(actOf(2022, 12)).toBe(1);
    expect(actOf(2023, 1)).toBe(2);
    expect(actOf(2024, 6)).toBe(3);
    expect(actOf(2025, 1)).toBe(4);
  });

  it("advances across year boundaries", () => {
    expect(nextClock({ year: 2022, month: 1, tick: 0 })).toEqual({
      year: 2022,
      month: 2,
      tick: 1,
    });
    expect(nextClock({ year: 2022, month: 12, tick: 11 })).toEqual({
      year: 2023,
      month: 1,
      tick: 12,
    });
  });

  it("converts between ticks and dates", () => {
    expect(monthIndex({ year: 2023, month: 2, tick: 13 })).toBe(13);
    expect(yearOfTick(0)).toBe(2022);
    expect(yearOfTick(12)).toBe(2023);
    expect(monthOfTick(0)).toBe(1);
    expect(monthOfTick(13)).toBe(2);
    expect(clockOfTick(13)).toEqual({ year: 2023, month: 2, tick: 13 });
    expect(isYearEnd(12)).toBe(true);
    expect(isYearEnd(11)).toBe(false);
  });

  it("clamps values into a range", () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(-1, 0, 10)).toBe(0);
    expect(clamp(11, 0, 10)).toBe(10);
  });
});
