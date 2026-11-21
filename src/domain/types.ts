export type Season = "spring" | "summer" | "autumn" | "winter";

export type Act = 1 | 2 | 3;

export type Phase = "title" | "playing" | "ended";

export type RoadGrade = "dirt" | "cobble" | "asphalt";

export type InvestmentKind =
  | "hydro"
  | "mechanized"
  | "irrigation"
  | "rnd"
  | "fleet"
  | "campaign"
  | "crackdown";

export type EndingId = "architect" | "predator" | "collapse";

export type EndingReason =
  | "debt"
  | "unrest"
  | "deposed"
  | "privatization"
  | "california"
  | "texas"
  | "final";

export type Result<T, E = string> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: E };

export const ok = <T>(value: T): Result<T, never> => ({ ok: true, value });
export const err = <E>(error: E): Result<never, E> => ({ ok: false, error });

export interface Clock {
  readonly year: number;
  readonly month: number;
  readonly tick: number;
}

export interface Village {
  readonly householdsThousand: number;
  readonly remoteHouseholdsThousand: number;
  readonly workshopsThousand: number;
}

export interface Market {
  readonly ricePrice: number;
  readonly fertilizerPrice: number;
  readonly fuelPrice: number;
  readonly exchangeRate: number;
  readonly drought: number;
  readonly privateShare: number;
  readonly demandIndex: number;
  readonly externalSupplyFactor: number;
}

export interface TariffTiers {
  readonly tiers: readonly [number, number, number, number];
  readonly workshop: number;
  readonly ceiling: number;
}

export interface Infrastructure {
  readonly dirtKm: number;
  readonly cobbleKm: number;
  readonly asphaltKm: number;
  readonly coverage: number;
  readonly remoteCoverage: number;
  readonly fleet: number;
}

export interface Production {
  readonly hydroPaddies: number;
  readonly mechanizedPaddies: number;
  readonly irrigationLevel: number;
  readonly rndLevel: number;
  readonly riceInventory: number;
}

export interface Policy {
  readonly n2Enabled: boolean;
  readonly n2Rate: number;
  readonly nsmo: boolean;
  readonly dppa: boolean;
  readonly vrem: boolean;
  readonly twoPartTariff: boolean;
  readonly antiSmuggling: boolean;
  readonly campaignCooldown: number;
  readonly bailoutUsed: boolean;
}

export interface Metrics {
  readonly satisfaction: number;
  readonly trust: number;
  readonly inflation: number;
  readonly industrialOutput: number;
  readonly reliability: number;
  readonly debateScore: number;
}

export interface MonthlyLedger {
  readonly year: number;
  readonly month: number;
  readonly tick: number;
  readonly householdDemand: number;
  readonly workshopDemand: number;
  readonly totalDemand: number;
  readonly ownProduction: number;
  readonly externalPurchase: number;
  readonly supplied: number;
  readonly shortage: number;
  readonly reliability: number;
  readonly inventoryEnd: number;
  readonly revenueHousehold: number;
  readonly revenueWorkshop: number;
  readonly revenueRecovery: number;
  readonly revenueWheeling: number;
  readonly revenueTotal: number;
  readonly costProduction: number;
  readonly costProcurement: number;
  readonly costRoads: number;
  readonly costFleet: number;
  readonly costStaff: number;
  readonly costInterest: number;
  readonly costTotal: number;
  readonly netResult: number;
  readonly cash: number;
  readonly debt: number;
  readonly tariffAverage: number;
  readonly ricePrice: number;
  readonly satisfaction: number;
  readonly trust: number;
  readonly inflation: number;
  readonly coverage: number;
}

export interface AnnualReport {
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
}

export interface Finance {
  readonly cash: number;
  readonly debt: number;
  readonly debtLimit: number;
  readonly accumulatedLoss: number;
  readonly interestRate: number;
  readonly recoveredTotal: number;
  readonly monthlyHistory: readonly MonthlyLedger[];
  readonly annualHistory: readonly AnnualReport[];
}

export interface EventEffects {
  readonly cashDelta: number;
  readonly debtDelta: number;
  readonly trustDelta: number;
  readonly satisfactionDelta: number;
  readonly inflationDelta: number;
  readonly coverageDelta: number;
  readonly remoteCoverageDelta: number;
  readonly industrialDelta: number;
  readonly reliabilityDelta: number;
  readonly debateDelta: number;
  readonly riceDelta: number;
  readonly n2Unlock: boolean;
  readonly unlocks: readonly ("dppa" | "vrem" | "nsmo" | "antiSmuggling")[];
  readonly flags: readonly string[];
  readonly ending?: readonly [EndingId, EndingReason];
}

export interface EventChoice {
  readonly id: string;
  readonly titleKey: string;
  readonly bodyKey: string;
  readonly outcomeKey: string;
  readonly effects: EventEffects;
}

export interface GameEventDefinition {
  readonly id: string;
  readonly kind: "weather" | "shock" | "debate" | "crisis" | "faction" | "reform";
  readonly titleKey: string;
  readonly bodyKey: string;
  readonly choices: readonly EventChoice[];
}

export interface EventState {
  readonly activeId: string | null;
  readonly queue: readonly string[];
  readonly resolved: readonly string[];
  readonly flags: readonly string[];
}

export interface Ending {
  readonly id: EndingId;
  readonly reason: EndingReason;
  readonly year: number;
  readonly month: number;
}

export interface GameState {
  readonly version: 1;
  readonly phase: Phase;
  readonly seed: number;
  readonly clock: Clock;
  readonly act: Act;
  readonly village: Village;
  readonly market: Market;
  readonly tariffs: TariffTiers;
  readonly infrastructure: Infrastructure;
  readonly production: Production;
  readonly policy: Policy;
  readonly metrics: Metrics;
  readonly finance: Finance;
  readonly events: EventState;
  readonly ending: Ending | null;
  readonly tutorialStep: number;
}

export interface TickOutcome {
  readonly state: GameState;
  readonly ledger: MonthlyLedger;
  readonly notices: readonly string[];
}

export interface ActionError {
  readonly code: string;
  readonly detail?: string;
}

export type ActionResult = Result<GameState, ActionError>;
