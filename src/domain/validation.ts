import * as v from "valibot";
import type { GameState } from "./types";
import { SAVE_VERSION } from "./constants";
import { err, ok, type Result } from "./types";

const finiteNumber = v.pipe(v.number(), v.finite());
const percent = v.pipe(finiteNumber, v.minValue(0), v.maxValue(100));
const nonNegative = v.pipe(finiteNumber, v.minValue(0));

const ClockSchema = v.object({
  year: finiteNumber,
  month: finiteNumber,
  tick: finiteNumber,
});

const ZoneSchema = v.object({
  coverage: percent,
  baseDemandMw: nonNegative,
  growth: finiteNumber,
});

const SupplierSchema = v.object({
  id: v.string(),
  kind: v.picklist(["ipp", "bot", "coal", "gas"] as const),
  priceVndPerKwh: nonNegative,
  capacityMw: nonNegative,
});

const MarketSchema = v.object({
  fuelPriceIndex: nonNegative,
  coalPrice: nonNegative,
  gasPrice: nonNegative,
  exchangeRate: nonNegative,
  drought: percent,
  heat: nonNegative,
  renewableFactor: percent,
  demandIndex: nonNegative,
  suppliers: v.array(SupplierSchema),
});

const TariffSchema = v.object({
  tiers: v.tuple([
    finiteNumber,
    finiteNumber,
    finiteNumber,
    finiteNumber,
    finiteNumber,
    finiteNumber,
  ]),
  industrial: finiteNumber,
  ceiling: finiteNumber,
});

const InfrastructureSchema = v.object({
  lineKm500: nonNegative,
  lineKm220: nonNegative,
  substations: nonNegative,
  gridStrength: percent,
});

const GenerationSchema = v.object({
  hydroCapacityMw: nonNegative,
  thermalCapacityMw: nonNegative,
  renewableCapacityMw: nonNegative,
  reservoir: percent,
  maintenance: percent,
});

const DispatchSchema = v.object({
  hydroMw: nonNegative,
  thermalMw: nonNegative,
  importMw: nonNegative,
});

const PolicySchema = v.object({
  n2Enabled: v.boolean(),
  n2Rate: percent,
  nsmo: v.boolean(),
  dppa: v.boolean(),
  vrem: v.boolean(),
  twoPartTariff: v.boolean(),
  petitionDone: v.boolean(),
  branch: v.picklist(["state", "private"] as const),
  priceCap: v.boolean(),
});

const MetricsSchema = v.object({
  citizenTrust: percent,
  institutionalTrust: percent,
  inflation: nonNegative,
  industrialOutput: nonNegative,
  reliability: percent,
  reserveMargin: finiteNumber,
});

const MediaSchema = v.object({
  activeMonths: nonNegative,
  cooldown: nonNegative,
  pulses: nonNegative,
});

const LedgerSchema = v.object({
  year: finiteNumber,
  month: finiteNumber,
  tick: finiteNumber,
  demandMw: nonNegative,
  connectedDemandMw: nonNegative,
  supplyMw: nonNegative,
  shortageMw: nonNegative,
  energySoldMillionKwh: nonNegative,
  hydroMillionKwh: nonNegative,
  thermalMillionKwh: nonNegative,
  renewableMillionKwh: nonNegative,
  importMillionKwh: nonNegative,
  revenueElectricity: finiteNumber,
  revenueOther: finiteNumber,
  revenueTotal: finiteNumber,
  costManagement: finiteNumber,
  costSupply: finiteNumber,
  costTotal: finiteNumber,
  netResult: finiteNumber,
  cash: finiteNumber,
  debt: nonNegative,
  accumulatedLoss: nonNegative,
  averageRetailTariff: nonNegative,
  industrialTariff: nonNegative,
  reliability: percent,
  reserveMargin: finiteNumber,
  citizenTrust: percent,
  institutionalTrust: percent,
  inflation: nonNegative,
  coverage: percent,
  mediaActive: v.boolean(),
});

const AnnualSchema = v.object({
  year: finiteNumber,
  revenue: finiteNumber,
  costs: finiteNumber,
  netResult: finiteNumber,
  debtEnd: nonNegative,
  coverage: percent,
  trustAverage: percent,
  satisfactionAverage: percent,
  reliability: percent,
  inflationAverage: nonNegative,
});

const FinanceSchema = v.object({
  cash: finiteNumber,
  debt: nonNegative,
  debtLimit: nonNegative,
  accumulatedLoss: nonNegative,
  interestRate: nonNegative,
  recoveredTotal: nonNegative,
  monthlyHistory: v.array(LedgerSchema),
  annualHistory: v.array(AnnualSchema),
});

const ProjectSchema = v.object({
  id: v.string(),
  kind: v.picklist(["line", "hydro", "thermal", "renewable", "substation", "decision"] as const),
  targetId: v.string(),
  monthsLeft: nonNegative,
  totalMonths: nonNegative,
});

const OperationsSchema = v.object({
  dispatch: DispatchSchema,
  supplierId: v.string(),
  projects: v.array(ProjectSchema),
});

const EventStateSchema = v.object({
  activeId: v.nullable(
    v.picklist([
      "fuel-crisis",
      "summer-drought",
      "public-skepticism",
      "revised-law",
      "media-losses",
    ] as const),
  ),
  queue: v.array(
    v.picklist([
      "fuel-crisis",
      "summer-drought",
      "public-skepticism",
      "revised-law",
      "media-losses",
    ] as const),
  ),
  resolved: v.array(
    v.picklist([
      "fuel-crisis",
      "summer-drought",
      "public-skepticism",
      "revised-law",
      "media-losses",
    ] as const),
  ),
  flags: v.array(v.string()),
  decisions: v.array(
    v.picklist([
      "keep-fuel",
      "cut-staff",
      "max-hydro",
      "policy-petition",
      "negotiate-fuel",
      "save-power",
      "shift-industry",
      "load-shed",
      "fossil-ramp",
      "grid-maintenance",
    ] as const),
  ),
  completedDecisions: v.array(
    v.picklist([
      "keep-fuel",
      "cut-staff",
      "max-hydro",
      "policy-petition",
      "negotiate-fuel",
      "save-power",
      "shift-industry",
      "load-shed",
      "fossil-ramp",
      "grid-maintenance",
    ] as const),
  ),
});

const MissionsSchema = v.object({
  completed: v.array(v.picklist(["electrification", "market", "security"] as const)),
  reserveStreak: nonNegative,
  privateMonths: nonNegative,
});

const ApprovalSchema = v.object({
  proposedTiers: v.tuple([
    finiteNumber,
    finiteNumber,
    finiteNumber,
    finiteNumber,
    finiteNumber,
    finiteNumber,
  ]),
  proposedIndustrial: finiteNumber,
  average: finiteNumber,
  changePct: finiteNumber,
  likelihood: percent,
});

const EndingSchema = v.object({
  id: v.picklist(["reformer", "caretaker", "captured", "collapse"] as const),
  reason: v.picklist([
    "citizen-trust",
    "institutional-trust",
    "debt",
    "privatization",
    "blackout",
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
  act: v.picklist([1, 2, 3, 4] as const),
  zones: v.object({
    urban: ZoneSchema,
    industrial: ZoneSchema,
    rural: ZoneSchema,
  }),
  market: MarketSchema,
  generation: GenerationSchema,
  infrastructure: InfrastructureSchema,
  operations: OperationsSchema,
  tariffs: TariffSchema,
  policy: PolicySchema,
  metrics: MetricsSchema,
  media: MediaSchema,
  finance: FinanceSchema,
  events: EventStateSchema,
  missions: MissionsSchema,
  approval: v.nullable(ApprovalSchema),
  ending: v.nullable(EndingSchema),
  tutorialStep: nonNegative,
});

export const SaveFileSchema = v.object({
  format: v.literal("grid-save"),
  version: v.literal(SAVE_VERSION),
  savedAt: v.string(),
  state: GameStateSchema,
});

export type SaveFile = {
  readonly format: "grid-save";
  readonly version: 2;
  readonly savedAt: string;
  readonly state: GameState;
};

export type JsonValue =
  | string
  | number
  | boolean
  | null
  | readonly JsonValue[]
  | { readonly [key: string]: JsonValue };

export const parseGameState = (value: JsonValue): Result<GameState> => {
  const parsed = v.safeParse(GameStateSchema, value);

  if (!parsed.success) return err("save.invalid-state");

  // SAFETY: GameStateSchema validates every field; readonly modifiers only differ
  // from the schema output type.
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
