import type { ActionResult, GameState, InvestmentKind } from "../types";
import { err } from "../types";
import {
  CAMPAIGN_COOLDOWN_MONTHS,
  FLEET_MAX,
  CAMPAIGN_COST,
  CRACKDOWN_COST,
  FLEET_COST,
  FLEET_STEP,
  HYDRO_COST,
  IRRIGATION_BASE_COST,
  MECHANIZED_COST,
  RND_BASE_COST,
} from "../constants";
import { clamp } from "../clock";
import { fleetUpgrade } from "../infrastructure";
import { appendFlags } from "../events/effects";
import { finishAction, pay, requirePlaying } from "./helpers";

export const investmentCost = (state: GameState, kind: InvestmentKind): number => {
  const production = state.production;
  const fleetSteps = Math.max(0, Math.round((state.infrastructure.fleet - 120) / FLEET_STEP));
  switch (kind) {
    case "hydro":
      return HYDRO_COST + Math.max(0, production.hydroPaddies - 5) * 180;
    case "mechanized":
      return MECHANIZED_COST + Math.max(0, production.mechanizedPaddies - 3) * 160;
    case "irrigation":
      return IRRIGATION_BASE_COST * (production.irrigationLevel + 1);
    case "rnd":
      return RND_BASE_COST * (production.rndLevel + 1);
    case "fleet":
      return FLEET_COST + fleetSteps * 80;
    case "campaign":
      return CAMPAIGN_COST;
    case "crackdown":
      return CRACKDOWN_COST;
  }
};

const atCap = (state: GameState, kind: InvestmentKind): boolean => {
  switch (kind) {
    case "hydro":
      return state.production.hydroPaddies >= 12;
    case "mechanized":
      return state.production.mechanizedPaddies >= 10;
    case "irrigation":
      return state.production.irrigationLevel >= 6;
    case "rnd":
      return state.production.rndLevel >= 5;
    case "fleet":
      return state.infrastructure.fleet >= FLEET_MAX;
    case "campaign":
      return state.policy.campaignCooldown > 0;
    case "crackdown":
      return state.policy.antiSmuggling;
  }
};

export const investAction = (state: GameState, kind: InvestmentKind): ActionResult => {
  const blocked = requirePlaying(state);
  if (blocked !== null) return blocked;
  if (atCap(state, kind)) return err({ code: "action.at-cap" });
  const paid = pay(state, investmentCost(state, kind));
  if (!paid.ok) return paid;
  const next = paid.value;
  if (kind === "hydro") {
    return finishAction({
      ...next,
      production: {
        ...next.production,
        hydroPaddies: next.production.hydroPaddies + 1,
      },
    });
  }
  if (kind === "mechanized") {
    return finishAction({
      ...next,
      production: {
        ...next.production,
        mechanizedPaddies: next.production.mechanizedPaddies + 1,
      },
    });
  }
  if (kind === "irrigation") {
    return finishAction({
      ...next,
      production: {
        ...next.production,
        irrigationLevel: next.production.irrigationLevel + 1,
      },
    });
  }
  if (kind === "rnd") {
    return finishAction({
      ...next,
      production: {
        ...next.production,
        rndLevel: next.production.rndLevel + 1,
      },
    });
  }
  if (kind === "fleet") {
    return finishAction({
      ...next,
      infrastructure: fleetUpgrade(next.infrastructure, FLEET_STEP),
    });
  }
  if (kind === "campaign") {
    return finishAction({
      ...next,
      metrics: {
        ...next.metrics,
        trust: clamp(next.metrics.trust + 6, 0, 100),
        satisfaction: clamp(next.metrics.satisfaction + 3, 0, 100),
      },
      policy: {
        ...next.policy,
        campaignCooldown: CAMPAIGN_COOLDOWN_MONTHS,
      },
    });
  }
  return finishAction({
    ...next,
    metrics: {
      ...next.metrics,
      trust: clamp(next.metrics.trust + 2, 0, 100),
      satisfaction: clamp(next.metrics.satisfaction - 1, 0, 100),
    },
    policy: { ...next.policy, antiSmuggling: true },
    events: {
      ...next.events,
      flags: appendFlags(next.events.flags, ["smuggling_cracked"]),
    },
  });
};
