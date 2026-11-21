import * as v from "valibot";
import type { GameState } from "./types";
import { SAVE_VERSION } from "./constants";
import { ok, err, type Result } from "./types";

const number = v.number();
const finiteNumber = v.pipe(v.number(), v.finite());
const percent = v.pipe(finiteNumber, v.minValue(0), v.maxValue(100));
const nonNegative = v.pipe(finiteNumber, v.minValue(0));

const ClockSchema = v.object({
  year: finiteNumber,
  month: finiteNumber,
  tick: finiteNumber,
});

const VillageSchema = v.object({
  householdsThousand: nonNegative,
  remoteHouseholdsThousand: nonNegative,
  workshopsThousand: nonNegative,
});

const MarketSchema = v.object({
  ricePrice: nonNegative,
  fertilizerPrice: nonNegative,
  fuelPrice: nonNegative,
  exchangeRate: nonNegative,
  drought: percent,
  privateShare: percent,
  demandIndex: nonNegative,
  externalSupplyFactor: nonNegative,
});

const TariffSchema = v.object({
  tiers: v.tuple([number, number, number, number]),
  workshop: number,
  ceiling: number,
});

const InfrastructureSchema = v.object({
  dirtKm: nonNegative,
  cobbleKm: nonNegative,
  asphaltKm: nonNegative,
  coverage: percent,
  remoteCoverage: percent,
  fleet: nonNegative,
});

const ProductionSchema = v.object({
  hydroPaddies: nonNegative,
  mechanizedPaddies: nonNegative,
  irrigationLevel: nonNegative,
  rndLevel: nonNegative,
  riceInventory: nonNegative,
});

const PolicySchema = v.object({
  n2Enabled: v.boolean(),
  n2Rate: percent,
  nsmo: v.boolean(),
  dppa: v.boolean(),
  vrem: v.boolean(),
  twoPartTariff: v.boolean(),
  antiSmuggling: v.boolean(),
  campaignCooldown: nonNegative,
  bailoutUsed: v.boolean(),
});

const MetricsSchema = v.object({
  satisfaction: percent,
  trust: percent,
  inflation: nonNegative,
  industrialOutput: nonNegative,
  reliability: percent,
  debateScore: percent,
});

const MonthlyLedgerSchema = v.object({
  year: finiteNumber,
  month: finiteNumber,
  tick: finiteNumber,
  householdDemand: nonNegative,
  workshopDemand: nonNegative,
  totalDemand: nonNegative,
  ownProduction: number,
  externalPurchase: nonNegative,
  supplied: nonNegative,
  shortage: nonNegative,
  reliability: percent,
  inventoryEnd: nonNegative,
  revenueHousehold: number,
  revenueWorkshop: number,
  revenueRecovery: number,
  revenueWheeling: number,
  revenueTotal: number,
  costProduction: number,
  costProcurement: number,
  costRoads: number,
  costFleet: number,
  costStaff: number,
  costInterest: number,
  costTotal: number,
  netResult: number,
  cash: number,
  debt: number,
  tariffAverage: number,
  ricePrice: number,
  satisfaction: percent,
  trust: percent,
  inflation: nonNegative,
  coverage: percent,
});

const AnnualReportSchema = v.object({
  year: finiteNumber,
  revenue: number,
  costs: number,
  netResult: number,
  debtEnd: number,
  coverage: percent,
  trustAverage: percent,
  satisfactionAverage: percent,
  reliability: percent,
  inflationAverage: nonNegative,
});

const FinanceSchema = v.object({
  cash: number,
  debt: number,
  debtLimit: nonNegative,
  accumulatedLoss: nonNegative,
  interestRate: nonNegative,
  recoveredTotal: nonNegative,
  monthlyHistory: v.array(MonthlyLedgerSchema),
  annualHistory: v.array(AnnualReportSchema),
});

const EventStateSchema = v.object({
  activeId: v.nullable(v.string()),
  queue: v.array(v.string()),
  resolved: v.array(v.string()),
  flags: v.array(v.string()),
});

const EndingSchema = v.object({
  id: v.picklist(["architect", "predator", "collapse"] as const),
  reason: v.picklist([
    "debt",
    "unrest",
    "deposed",
    "privatization",
    "california",
    "texas",
    "final",
  ] as const),
  year: finiteNumber,
  month: finiteNumber,
});

export const GameStateSchema = v.object({
  version: v.literal(SAVE_VERSION),
  phase: v.picklist(["title", "playing", "ended"] as const),
  seed: finiteNumber,
  clock: ClockSchema,
  act: v.picklist([1, 2, 3] as const),
  village: VillageSchema,
  market: MarketSchema,
  tariffs: TariffSchema,
  infrastructure: InfrastructureSchema,
  production: ProductionSchema,
  policy: PolicySchema,
  metrics: MetricsSchema,
  finance: FinanceSchema,
  events: EventStateSchema,
  ending: v.nullable(EndingSchema),
  tutorialStep: nonNegative,
});

export const SaveFileSchema = v.object({
  format: v.literal("dqkt-save"),
  version: v.literal(SAVE_VERSION),
  savedAt: v.string(),
  state: GameStateSchema,
});

export interface SaveFile {
  readonly format: "dqkt-save";
  readonly version: 1;
  readonly savedAt: string;
  readonly state: GameState;
}

export type JsonValue =
  | string
  | number
  | boolean
  | null
  | readonly JsonValue[]
  | { readonly [key: string]: JsonValue };

export const parseGameState = (value: JsonValue): Result<GameState> => {
  const parsed = v.safeParse(GameStateSchema, value);

  if (!parsed.success) {
    return err("save.invalid-state");
  }

  // SAFETY: GameStateSchema checks every field before this cast; readonly
  // modifiers only differ from the schema's inferred output type.
  return ok(parsed.output as GameState);
};

export const decodeSaveFile = (text: string): Result<SaveFile> => {
  let value: unknown;

  try {
    value = JSON.parse(text);
  } catch {
    return err("save.invalid-json");
  }

  const parsed = v.safeParse(SaveFileSchema, value);

  if (!parsed.success) return err("save.invalid-format");

  // SAFETY: SaveFileSchema validated the format tag, version and state above.
  return ok(parsed.output as SaveFile);
};

export const safeParseText = (text: string): Result<unknown> => {
  try {
    return ok(JSON.parse(text));
  } catch {
    return err("save.invalid-json");
  }
};
