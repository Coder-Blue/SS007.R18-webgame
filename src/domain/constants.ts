import type { DecisionDefinition, GameState, TariffTiers, ZoneId } from "./types";

export const GAME_VERSION = "2.0.0" as const;
export const SAVE_VERSION = 2 as const;
export const START_YEAR = 2022;
export const START_MONTH = 1;
export const END_YEAR = 2026;
export const END_MONTH = 12;
export const TOTAL_MONTHS = 60;
export const MONTHS_PER_YEAR = 12;
export const HOURS_PER_MONTH = 720;

export const STARTING_CASH = 4_000;
export const STARTING_DEBT = 26_000;
export const DEBT_LIMIT = 100_000;
export const CASH_FLOOR = 2_000;
export const CASH_REPAY_RESERVE = 6_000;
export const INTEREST_RATE = 0.065;
export const RECOVERY_RATE_MIN = 0.3;
export const RECOVERY_RATE_MAX = 0.8;
export const RECOVERY_RATE_DEFAULT = 0.55;

export const REFORM_MONTHS = {
  n2: 3,
  nsmo: 4,
  dppa: 4,
  vrem: 5,
  twoPart: 3,
} as const;

export const TARIFF_WEIGHTS = [0.15, 0.17, 0.19, 0.2, 0.17, 0.12] as const;

export const TARIFF_BANDS = [
  [1_700, 2_050],
  [1_780, 2_120],
  [2_050, 2_450],
  [2_580, 2_980],
  [2_900, 3_260],
  [2_980, 3_340],
] as const;

export const INDUSTRIAL_TARIFF_MIN = 1_550;
export const INDUSTRIAL_TARIFF_MAX = 1_950;

export const ceilingFor = (year: number): number => {
  if (year <= 2022) return 2_450;

  if (year === 2023) return 2_510;

  if (year === 2024) return 2_580;

  if (year === 2025) return 2_650;

  return 2_720;
};

export const INITIAL_TARIFFS: TariffTiers = {
  tiers: [1_806, 1_866, 2_167, 2_729, 3_050, 3_117],
  industrial: 1_750,
  ceiling: ceilingFor(START_YEAR),
};

export const DIRECT_TARIFF_CAP_PCT = 5;
export const APPROVAL_THRESHOLD = 55;
export const TARIFF_HIKE_MEDIA_PCT = 4;

export const HYDRO_VARIABLE_COST = 350;
export const THERMAL_FUEL_COST = 2_500;
export const RENEWABLE_PPA_COST = 1_050;
export const TRANSMISSION_COST_PER_KWH = 380;
export const MANAGEMENT_BASE_COST = 540;
export const MANAGEMENT_PER_GW = 26;
export const INTEREST_MONTHS = 12;

export const LOSS_FACTOR_BASE = 0.09;
export const LOSS_FACTOR_STRENGTH = 0.0005;
export const LOSS_FACTOR_MIN = 0.04;

export const RESERVE_TARGET = 15;
export const SECURITY_STREAK_MONTHS = 12;

export type LineProject = {
  readonly zone: ZoneId;
  readonly cost: number;
  readonly months: number;
  readonly coverage: number;
  readonly lineKm500: number;
  readonly lineKm220: number;
};

export const LINE_PROJECTS: Readonly<Record<ZoneId, LineProject>> = {
  urban: { zone: "urban", cost: 1_200, months: 2, coverage: 8, lineKm500: 40, lineKm220: 120 },
  industrial: {
    zone: "industrial",
    cost: 1_600,
    months: 3,
    coverage: 10,
    lineKm500: 60,
    lineKm220: 180,
  },
  rural: { zone: "rural", cost: 2_100, months: 4, coverage: 12, lineKm500: 90, lineKm220: 240 },
};

export type PlantKind = "hydro" | "thermal" | "renewable" | "substation";

export type PlantProject = {
  readonly kind: PlantKind;
  readonly cost: number;
  readonly months: number;
  readonly capacityMw: number;
  readonly gridStrength: number;
  readonly substations: number;
};

export const PLANT_PROJECTS: Readonly<Record<PlantKind, PlantProject>> = {
  hydro: {
    kind: "hydro",
    cost: 3_200,
    months: 8,
    capacityMw: 250,
    gridStrength: 0,
    substations: 0,
  },
  thermal: {
    kind: "thermal",
    cost: 2_800,
    months: 6,
    capacityMw: 300,
    gridStrength: 0,
    substations: 0,
  },
  renewable: {
    kind: "renewable",
    cost: 2_600,
    months: 5,
    capacityMw: 200,
    gridStrength: 0,
    substations: 0,
  },
  substation: {
    kind: "substation",
    cost: 1_400,
    months: 3,
    capacityMw: 0,
    gridStrength: 6,
    substations: 1,
  },
};

const noEffects = {
  cashDelta: 0,
  debtDelta: 0,
  citizenTrustDelta: 0,
  institutionalTrustDelta: 0,
  inflationDelta: 0,
  fuelPriceDelta: 0,
  reservoirDelta: 0,
  hydroCapacityDelta: 0,
  thermalCapacityDelta: 0,
  renewableCapacityDelta: 0,
  coverageDelta: 0,
  gridStrengthDelta: 0,
  demandDelta: 0,
  mediaMonths: 0,
  unlockDecisions: [],
  enablePolicy: [],
  disablePriceCap: false,
} as const;

export const DECISIONS: readonly DecisionDefinition[] = [
  { id: "keep-fuel", cost: 0, months: 1, effects: { ...noEffects, thermalCapacityDelta: 100 } },
  {
    id: "cut-staff",
    cost: 0,
    months: 1,
    effects: { ...noEffects, institutionalTrustDelta: -6, cashDelta: 900 },
  },
  {
    id: "max-hydro",
    cost: 0,
    months: 1,
    effects: { ...noEffects, reservoirDelta: -14, cashDelta: 1_200, citizenTrustDelta: 1 },
  },
  {
    id: "policy-petition",
    cost: 700,
    months: 6,
    effects: { ...noEffects, institutionalTrustDelta: 3 },
  },
  {
    id: "negotiate-fuel",
    cost: 1_100,
    months: 12,
    effects: { ...noEffects, fuelPriceDelta: -0.14, institutionalTrustDelta: 2 },
  },
  {
    id: "save-power",
    cost: 600,
    months: 3,
    effects: { ...noEffects, demandDelta: -0.05, citizenTrustDelta: 2 },
  },
  {
    id: "shift-industry",
    cost: 350,
    months: 2,
    effects: { ...noEffects, demandDelta: -0.04, citizenTrustDelta: -3 },
  },
  {
    id: "load-shed",
    cost: 0,
    months: 1,
    effects: {
      ...noEffects,
      citizenTrustDelta: -10,
      institutionalTrustDelta: -2,
      demandDelta: -0.03,
    },
  },
  {
    id: "fossil-ramp",
    cost: 500,
    months: 1,
    effects: { ...noEffects, thermalCapacityDelta: 150, inflationDelta: 0.4 },
  },
  {
    id: "grid-maintenance",
    cost: 900,
    months: 4,
    effects: { ...noEffects, gridStrengthDelta: 8, institutionalTrustDelta: 1 },
  },
] as const;

export const createInitialState = (seed: number = 7): GameState => ({
  version: SAVE_VERSION,
  phase: "playing",
  seed,
  clock: { year: START_YEAR, month: START_MONTH, tick: 0 },
  act: 1,
  zones: {
    urban: { coverage: 92, baseDemandMw: 620, growth: 0.012 },
    industrial: { coverage: 74, baseDemandMw: 540, growth: 0.02 },
    rural: { coverage: 46, baseDemandMw: 210, growth: 0.008 },
  },
  market: {
    fuelPriceIndex: 1,
    coalPrice: 140,
    gasPrice: 9.8,
    exchangeRate: 1,
    drought: 0.28,
    heat: 1,
    renewableFactor: 0.55,
    demandIndex: 1,
    suppliers: [
      { id: "ipp-lac-hong", kind: "ipp", priceVndPerKwh: 2_450, capacityMw: 450 },
      { id: "bot-duyen-hai", kind: "bot", priceVndPerKwh: 2_465, capacityMw: 400 },
      { id: "coal-quang-ninh", kind: "coal", priceVndPerKwh: 2_440, capacityMw: 500 },
    ],
  },
  generation: {
    hydroCapacityMw: 900,
    thermalCapacityMw: 1_000,
    renewableCapacityMw: 300,
    reservoir: 68,
    maintenance: 80,
  },
  infrastructure: {
    lineKm500: 1_850,
    lineKm220: 4_200,
    substations: 18,
    gridStrength: 62,
  },
  operations: {
    dispatch: { hydroMw: 500, thermalMw: 350, importMw: 150 },
    supplierId: "coal-quang-ninh",
    projects: [],
  },
  tariffs: INITIAL_TARIFFS,
  policy: {
    n2Enabled: false,
    n2Rate: RECOVERY_RATE_DEFAULT,
    nsmo: false,
    dppa: false,
    vrem: false,
    twoPartTariff: false,
    petitionDone: false,
    branch: "state",
    priceCap: true,
    reformProgress: [],
  },
  metrics: {
    citizenTrust: 68,
    institutionalTrust: 62,
    inflation: 3.4,
    industrialOutput: 100,
    reliability: 100,
    reserveMargin: 39,
  },
  media: { activeMonths: 0, cooldown: 0, pulses: 0 },
  finance: {
    cash: STARTING_CASH,
    debt: STARTING_DEBT,
    debtLimit: DEBT_LIMIT,
    accumulatedLoss: 0,
    interestRate: INTEREST_RATE,
    recoveredTotal: 0,
    recoveredYears: [],
    monthlyHistory: [],
    annualHistory: [],
  },
  events: {
    activeId: null,
    queue: [],
    resolved: [],
    flags: [],
    decisions: [],
    completedDecisions: [],
  },
  missions: { completed: [], reserveStreak: 0, privateMonths: 0 },
  approval: null,
  ending: null,
  tutorialStep: 0,
});
