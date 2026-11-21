import type { Act, Clock, Season } from "./types";
import { MONTHS_PER_YEAR } from "./constants";

export const seasonOf = (month: number): Season => {
  if (month <= 3) return "xuan";
  if (month <= 6) return "ha";
  if (month <= 9) return "thu";
  return "dong";
};

export const seasonFactor = (month: number): number => {
  const season = seasonOf(month);
  if (season === "ha") return 1.08;
  if (season === "dong") return 0.96;
  return 1;
};

export const actOf = (year: number, month: number): Act => {
  if (year < 2023) return 1;
  if (year === 2023 && month < 10) return 1;
  if (year === 2023) return 2;
  return 3;
};

export const nextClock = (clock: Clock): Clock => {
  const month = clock.month === MONTHS_PER_YEAR ? 1 : clock.month + 1;
  const year = clock.month === MONTHS_PER_YEAR ? clock.year + 1 : clock.year;
  return { year, month, tick: clock.tick + 1 };
};

export const monthIndex = (clock: Clock): number =>
  (clock.year - 2022) * MONTHS_PER_YEAR + (clock.month - 1);

export const isYearEnd = (month: number): boolean => month === MONTHS_PER_YEAR;

export const yearOfTick = (tick: number): number => 2022 + Math.floor(tick / MONTHS_PER_YEAR);

export const monthOfTick = (tick: number): number => (tick % MONTHS_PER_YEAR) + 1;

export const clockOfTick = (tick: number): Clock => ({
  year: yearOfTick(tick),
  month: monthOfTick(tick),
  tick,
});

export const isGameOverDate = (clock: Clock): boolean =>
  clock.year > 2026 || (clock.year === 2026 && clock.month > 12);

export const gameDateLabel = (year: number, month: number): string => `Thang ${month}/${year}`;

export const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));
