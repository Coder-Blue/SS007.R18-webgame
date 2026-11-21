import type { GameState, RoadGrade, TariffTiers } from "./types";

export const SAVE_VERSION = 1 as const;
export const START_YEAR = 2022;
export const START_MONTH = 1;
export const END_YEAR = 2026;
export const END_MONTH = 12;
export const TOTAL_MONTHS = 60;
export const MONTHS_PER_YEAR = 12;

export const STARTING_CASH = 6_000;
export const STARTING_DEBT = 14_000;
export const DEBT_LIMIT = 60_000;
export const CASH_FLOOR = 1_000;
export const CASH_REPAY_RESERVE = 4_000;
export const INTEREST_RATE = 0.065;
export const BAILOUT_AMOUNT = 8_000;
export const BAILOUT_TRUST_COST = 9;
export const BAILOUT_SATISFACTION_COST = 4;

export const TARIFF_WEIGHTS = [0.45, 0.28, 0.18, 0.09] as const;
export const TARIFF_BANDS = [
  [7.2, 11.0],
  [9.0, 14.5],
  [11.5, 21.0],
  [14.0, 32.0],
] as const;
export const WORKSHOP_TARIFF_MIN = 6.8;
export const WORKSHOP_TARIFF_MAX = 9.2;
export const N2_RATE_MIN = 0.3;
export const N2_RATE_MAX = 0.8;
export const N2_RATE_DEFAULT = 0.55;

export const CEILINGS: Readonly<Record<number, number>> = {
  2022: 13.8,
  2023: 13.8,
  2024: 14.2,
  2025: 14.7,
  2026: 15.1,
};

export interface RoadProject {
  readonly grade: RoadGrade;
  readonly cost: number;
  readonly km: number;
  readonly coverage: number;
  readonly remoteCoverage: number;
}

export const ROAD_PROJECTS: Readonly<Record<RoadGrade, RoadProject>> = {
  dirt: { grade: "dirt", cost: 220, km: 8, coverage: 3, remoteCoverage: 8 },
  cobble: { grade: "cobble", cost: 380, km: 6, coverage: 5, remoteCoverage: 12 },
  asphalt: { grade: "asphalt", cost: 650, km: 4, coverage: 7, remoteCoverage: 16 },
};

export const HYDRO_COST = 1_400;
export const MECHANIZED_COST = 1_100;
export const IRRIGATION_BASE_COST = 600;
export const RND_BASE_COST = 500;
export const FLEET_COST = 320;
export const FLEET_STEP = 20;
export const FLEET_MAX = 320;
export const CAMPAIGN_COST = 450;
export const CAMPAIGN_COOLDOWN_MONTHS = 6;
export const CRACKDOWN_COST = 350;
export const IMPORT_RICE_VOLUME = 100;
export const IMPORT_RICE_MARKUP = 1.03;

export const INITIAL_TARIFFS: TariffTiers = {
  tiers: [8.2, 10.4, 13.6, 17.0],
  workshop: 7.4,
  ceiling: CEILINGS[START_YEAR]!,
};

export const ARCHITECT_DEBT_MAX = 25_000;
export const PREDATOR_CASH_MIN = 28_000;
export const PREDATOR_SATISFACTION_MAX = 50;
export const FINAL_TRUST_MIN = 55;
export const FINAL_SATISFACTION_MIN = 55;
export const FINAL_RELIABILITY_MIN = 95;

export const createInitialState = (seed: number = 7): GameState => ({
  version: SAVE_VERSION,
  phase: "playing",
  seed,
  clock: { year: START_YEAR, month: START_MONTH, tick: 0 },
  act: 1,
  village: {
    householdsThousand: 420,
    remoteHouseholdsThousand: 38,
    workshopsThousand: 12,
  },
  market: {
    ricePrice: 12,
    fertilizerPrice: 8.4,
    fuelPrice: 22,
    exchangeRate: 1,
    drought: 0.25,
    privateShare: 0.58,
    demandIndex: 1,
    externalSupplyFactor: 1,
  },
  tariffs: INITIAL_TARIFFS,
  infrastructure: {
    dirtKm: 210,
    cobbleKm: 140,
    asphaltKm: 90,
    coverage: 62,
    remoteCoverage: 18,
    fleet: 120,
  },
  production: {
    hydroPaddies: 5,
    mechanizedPaddies: 3,
    irrigationLevel: 1,
    rndLevel: 0,
    riceInventory: 140,
  },
  policy: {
    n2Enabled: false,
    n2Rate: N2_RATE_DEFAULT,
    nsmo: false,
    dppa: false,
    vrem: false,
    twoPartTariff: false,
    antiSmuggling: false,
    campaignCooldown: 0,
    bailoutUsed: false,
  },
  metrics: {
    satisfaction: 72,
    trust: 66,
    inflation: 3.2,
    industrialOutput: 100,
    reliability: 100,
    debateScore: 50,
  },
  finance: {
    cash: STARTING_CASH,
    debt: STARTING_DEBT,
    debtLimit: DEBT_LIMIT,
    accumulatedLoss: 0,
    interestRate: INTEREST_RATE,
    recoveredTotal: 0,
    monthlyHistory: [],
    annualHistory: [],
  },
  events: {
    activeId: null,
    queue: [],
    resolved: [],
    flags: [],
  },
  ending: null,
  tutorialStep: 0,
});
