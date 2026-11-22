import type { EventEffects, EventId, GameEventDefinition } from "../types";

const BASE_EFFECTS: EventEffects = {
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
};

const effects = (partial: Partial<EventEffects>): EventEffects => ({
  ...BASE_EFFECTS,
  ...partial,
});

const FUEL_DECISIONS = [
  "keep-fuel",
  "cut-staff",
  "max-hydro",
  "policy-petition",
  "negotiate-fuel",
] as const;

const DROUGHT_DECISIONS = [
  "save-power",
  "shift-industry",
  "load-shed",
  "fossil-ramp",
  "grid-maintenance",
] as const;

export const EVENTS: readonly GameEventDefinition[] = [
  {
    id: "fuel-crisis",
    kind: "shock",
    choices: [
      {
        id: "hedge-crisis",
        effects: effects({
          cashDelta: -1_500,
          fuelPriceDelta: 0.08,
          inflationDelta: 0.6,
          institutionalTrustDelta: -2,
          unlockDecisions: FUEL_DECISIONS,
        }),
      },
      {
        id: "ride-out-crisis",
        effects: effects({
          fuelPriceDelta: 0.2,
          citizenTrustDelta: -4,
          inflationDelta: 1.1,
          unlockDecisions: FUEL_DECISIONS,
        }),
      },
    ],
  },
  {
    id: "summer-drought",
    kind: "drought",
    choices: [
      {
        id: "protect-reservoir",
        effects: effects({
          reservoirDelta: -8,
          citizenTrustDelta: -5,
          institutionalTrustDelta: -2,
          unlockDecisions: DROUGHT_DECISIONS,
        }),
      },
      {
        id: "maximize-hydro",
        effects: effects({
          reservoirDelta: -22,
          cashDelta: 900,
          citizenTrustDelta: 1,
          unlockDecisions: DROUGHT_DECISIONS,
        }),
      },
    ],
  },
  {
    id: "public-skepticism",
    kind: "branch",
    choices: [
      {
        id: "privatize-grid",
        effects: effects({
          citizenTrustDelta: -12,
          institutionalTrustDelta: -8,
          inflationDelta: 2.4,
          setBranch: "private",
          disablePriceCap: true,
        }),
      },
      {
        id: "reform-path",
        effects: effects({
          citizenTrustDelta: 3,
          institutionalTrustDelta: 4,
          cashDelta: -800,
        }),
      },
    ],
  },
  {
    id: "revised-law",
    kind: "reform",
    choices: [
      {
        id: "enact-law",
        effects: effects({
          citizenTrustDelta: 3,
          institutionalTrustDelta: 6,
        }),
      },
      {
        id: "delay-law",
        effects: effects({
          citizenTrustDelta: -3,
          institutionalTrustDelta: -9,
          inflationDelta: 0.7,
        }),
      },
    ],
  },
  {
    id: "media-losses",
    kind: "media",
    choices: [
      {
        id: "acknowledge-media",
        effects: effects({ mediaMonths: 3 }),
      },
    ],
  },
] as const;

export const findEvent = (id: EventId): GameEventDefinition | null =>
  EVENTS.find((event) => event.id === id) ?? null;
