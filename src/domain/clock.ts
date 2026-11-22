import type { Act, Clock, Season } from "./types";
import { MONTHS_PER_YEAR } from "./constants";

export const seasonOf = (month: number): Season => {
  if (month <= 3) return "spring";

  if (month <= 6) return "summer";

  if (month <= 9) return "autumn";

  return "winter";
};

export const actOf = (year: number, _month: number): Act => {
  if (year <= 2022) return 1;

  if (year === 2023) return 2;

  if (year === 2024) return 3;

  return 4;
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

export const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));
