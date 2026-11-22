export type Season = "spring" | "summer" | "autumn" | "winter";

export type Act = 1 | 2 | 3 | 4;

export type Phase = "title" | "playing" | "ended";

export type ZoneId = "urban" | "industrial" | "rural";

export type MissionId = "electrification" | "market" | "security";

export type PolicyKey = "n2" | "nsmo" | "dppa" | "vrem" | "twoPart";

export type SupplierKind = "ipp" | "bot" | "coal" | "gas";

export type ProjectKind = "line" | "hydro" | "thermal" | "renewable" | "substation" | "decision";

export type DecisionId =
  | "keep-fuel"
  | "cut-staff"
  | "max-hydro"
  | "policy-petition"
  | "negotiate-fuel"
  | "save-power"
  | "shift-industry"
  | "load-shed"
  | "fossil-ramp"
  | "grid-maintenance";

export type EventId =
  | "fuel-crisis"
  | "summer-drought"
  | "public-skepticism"
  | "revised-law"
  | "media-losses";

export type Branch = "state" | "private";

export type EndingId = "reformer" | "caretaker" | "captured" | "collapse";

export type EndingReason =
  | "citizen-trust"
  | "institutional-trust"
  | "debt"
  | "privatization"
  | "blackout"
  | "final";

export type Result<T, E = string> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: E };

export const ok = <T>(value: T): Result<T, never> => ({ ok: true, value });
export const err = <E>(error: E): Result<never, E> => ({ ok: false, error });

export type Clock = {
  readonly year: number;
  readonly month: number;
  readonly tick: number;
};

export type Zone = {
  readonly coverage: number;
  readonly baseDemandMw: number;
  readonly growth: number;
};

export type Zones = {
  readonly urban: Zone;
  readonly industrial: Zone;
  readonly rural: Zone;
};

export type SupplierQuote = {
  readonly id: string;
  readonly kind: SupplierKind;
  readonly priceVndPerKwh: number;
  readonly capacityMw: number;
};

export type Market = {
  readonly fuelPriceIndex: number;
  readonly coalPrice: number;
  readonly gasPrice: number;
  readonly exchangeRate: number;
  readonly drought: number;
  readonly heat: number;
  readonly renewableFactor: number;
  readonly demandIndex: number;
  readonly suppliers: readonly SupplierQuote[];
};

export type TariffTiers = {
  readonly tiers: readonly [number, number, number, number, number, number];
  readonly industrial: number;
  readonly ceiling: number;
};

export type Infrastructure = {
  readonly lineKm500: number;
  readonly lineKm220: number;
  readonly substations: number;
  readonly gridStrength: number;
};

export type Generation = {
  readonly hydroCapacityMw: number;
  readonly thermalCapacityMw: number;
  readonly renewableCapacityMw: number;
  readonly reservoir: number;
  readonly maintenance: number;
};

export type Dispatch = {
  readonly hydroMw: number;
  readonly thermalMw: number;
  readonly importMw: number;
};

export type Policy = {
  readonly n2Enabled: boolean;
  readonly n2Rate: number;
  readonly nsmo: boolean;
  readonly dppa: boolean;
  readonly vrem: boolean;
  readonly twoPartTariff: boolean;
  readonly petitionDone: boolean;
  readonly branch: Branch;
  readonly priceCap: boolean;
};

export type Metrics = {
  readonly citizenTrust: number;
  readonly institutionalTrust: number;
  readonly inflation: number;
  readonly industrialOutput: number;
  readonly reliability: number;
  readonly reserveMargin: number;
};

export type MediaState = {
  readonly activeMonths: number;
  readonly cooldown: number;
  readonly pulses: number;
};

export type MonthlyLedger = {
  readonly year: number;
  readonly month: number;
  readonly tick: number;
  readonly demandMw: number;
  readonly connectedDemandMw: number;
  readonly supplyMw: number;
  readonly shortageMw: number;
  readonly energySoldMillionKwh: number;
  readonly hydroMillionKwh: number;
  readonly thermalMillionKwh: number;
  readonly renewableMillionKwh: number;
  readonly importMillionKwh: number;
  readonly revenueElectricity: number;
  readonly revenueOther: number;
  readonly revenueTotal: number;
  readonly costManagement: number;
  readonly costSupply: number;
  readonly costTotal: number;
  readonly netResult: number;
  readonly cash: number;
  readonly debt: number;
  readonly accumulatedLoss: number;
  readonly averageRetailTariff: number;
  readonly industrialTariff: number;
  readonly reliability: number;
  readonly reserveMargin: number;
  readonly citizenTrust: number;
  readonly institutionalTrust: number;
  readonly inflation: number;
  readonly coverage: number;
  readonly mediaActive: boolean;
};

export type AnnualReport = {
  readonly year: number;
  readonly revenue: number;
  readonly costs: number;
  readonly netResult: number;
  readonly debtEnd: number;
  readonly coverage: number;
  readonly trustAverage: number;
  readonly satisfactionAverage: number;
  readonly reliability: number;
  readonly inflationAverage: number;
};

export type RecoveryYear = {
  readonly year: number;
  readonly amount: number;
};

export type Finance = {
  readonly cash: number;
  readonly debt: number;
  readonly debtLimit: number;
  readonly accumulatedLoss: number;
  readonly interestRate: number;
  readonly recoveredTotal: number;
  readonly recoveredYears: readonly RecoveryYear[];
  readonly monthlyHistory: readonly MonthlyLedger[];
  readonly annualHistory: readonly AnnualReport[];
};

export type Project = {
  readonly id: string;
  readonly kind: ProjectKind;
  readonly targetId: string;
  readonly monthsLeft: number;
  readonly totalMonths: number;
};

export type Operations = {
  readonly dispatch: Dispatch;
  readonly supplierId: string;
  readonly projects: readonly Project[];
};

export type EventEffects = {
  readonly cashDelta: number;
  readonly debtDelta: number;
  readonly citizenTrustDelta: number;
  readonly institutionalTrustDelta: number;
  readonly inflationDelta: number;
  readonly fuelPriceDelta: number;
  readonly reservoirDelta: number;
  readonly hydroCapacityDelta: number;
  readonly thermalCapacityDelta: number;
  readonly renewableCapacityDelta: number;
  readonly coverageDelta: number;
  readonly gridStrengthDelta: number;
  readonly demandDelta: number;
  readonly mediaMonths: number;
  readonly unlockDecisions: readonly DecisionId[];
  readonly enablePolicy: readonly PolicyKey[];
  readonly setBranch?: Branch;
  readonly disablePriceCap: boolean;
};

export type EventChoice = {
  readonly id: string;
  readonly effects: EventEffects;
};

export type GameEventDefinition = {
  readonly id: EventId;
  readonly kind: "shock" | "drought" | "branch" | "reform" | "media";
  readonly choices: readonly EventChoice[];
};

export type EventState = {
  readonly activeId: EventId | null;
  readonly queue: readonly EventId[];
  readonly resolved: readonly EventId[];
  readonly flags: readonly string[];
  readonly decisions: readonly DecisionId[];
  readonly completedDecisions: readonly DecisionId[];
};

export type DecisionDefinition = {
  readonly id: DecisionId;
  readonly cost: number;
  readonly months: number;
  readonly effects: EventEffects;
};

export type ApprovalRequest = {
  readonly proposedTiers: readonly [number, number, number, number, number, number];
  readonly proposedIndustrial: number;
  readonly average: number;
  readonly changePct: number;
  readonly likelihood: number;
};

export type Missions = {
  readonly completed: readonly MissionId[];
  readonly reserveStreak: number;
  readonly privateMonths: number;
};

export type Ending = {
  readonly id: EndingId;
  readonly reason: EndingReason;
  readonly year: number;
  readonly month: number;
};

export type GameState = {
  readonly version: 2;
  readonly phase: Phase;
  readonly seed: number;
  readonly clock: Clock;
  readonly act: Act;
  readonly zones: Zones;
  readonly market: Market;
  readonly generation: Generation;
  readonly infrastructure: Infrastructure;
  readonly operations: Operations;
  readonly tariffs: TariffTiers;
  readonly policy: Policy;
  readonly metrics: Metrics;
  readonly media: MediaState;
  readonly finance: Finance;
  readonly events: EventState;
  readonly missions: Missions;
  readonly approval: ApprovalRequest | null;
  readonly ending: Ending | null;
  readonly tutorialStep: number;
};

export type TickOutcome = {
  readonly state: GameState;
  readonly ledger: MonthlyLedger;
  readonly notices: readonly string[];
};

export type ActionError = {
  readonly code: string;
  readonly detail?: string;
};

export type ActionResult = Result<GameState, string>;

export type Spendable = {
  readonly cash: number;
  readonly debt: number;
  readonly amount: number;
};
