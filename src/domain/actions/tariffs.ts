import type { GameState, TariffTiers } from "../types";
import { err, ok, type Result } from "../types";
import { DIRECT_TARIFF_CAP_PCT, RECOVERY_RATE_MAX, RECOVERY_RATE_MIN } from "../constants";
import { auditTariffRequest } from "../approval";
import {
  averageHouseholdTariff,
  averageOfTiers,
  tariffChangePct,
  validateTariffs,
} from "../tariffs";
import { uniqueFlag } from "./helpers";

const applyTariffs = (state: GameState, tariffs: TariffTiers): GameState => ({
  ...state,
  tariffs,
  approval: null,
});

export const requestTariffAction = (
  state: GameState,
  tiers: readonly [number, number, number, number, number, number],
  industrial: number,
): Result<GameState> => {
  if (!state.policy.priceCap) return err("tariff.no-authority");
  const currentAverage = averageHouseholdTariff(state.tariffs);
  const average = averageOfTiers(tiers);
  const householdChange = tariffChangePct(currentAverage, average);

  const industrialChange =
    state.tariffs.industrial <= 0
      ? 0
      : Math.max(0, ((industrial - state.tariffs.industrial) / state.tariffs.industrial) * 100);

  const changePct = Math.max(householdChange, industrialChange);

  // A large change always opens the State audit, even when the current ceiling
  // cannot hold it; the audit may still refuse on the ceiling at resolution.
  const structural = validateTariffs(
    { tiers, industrial },
    changePct > DIRECT_TARIFF_CAP_PCT ? Number.POSITIVE_INFINITY : state.tariffs.ceiling,
  );

  if (!structural.ok) return structural;

  if (changePct > DIRECT_TARIFF_CAP_PCT) {
    const audit = auditTariffRequest(state, average, changePct);

    return ok({
      ...state,
      approval: {
        proposedTiers: tiers,
        proposedIndustrial: industrial,
        average: audit.average,
        changePct: audit.changePct,
        likelihood: audit.likelihood,
      },
    });
  }

  return ok(applyTariffs(state, structural.value));
};

export const resolveApprovalAction = (state: GameState): Result<GameState> => {
  if (state.approval === null) return err("approval.none-pending");
  const request = state.approval;
  const audit = auditTariffRequest(state, request.average, request.changePct);

  const validated = validateTariffs(
    { tiers: request.proposedTiers, industrial: request.proposedIndustrial },
    state.tariffs.ceiling,
  );

  if (audit.approved && validated.ok) {
    const accepted = applyTariffs(state, validated.value);

    return ok({
      ...accepted,
      metrics: {
        ...accepted.metrics,
        institutionalTrust: Math.min(100, accepted.metrics.institutionalTrust + 1),
      },
      events: {
        ...accepted.events,
        flags: uniqueFlag(accepted.events.flags, "approval-approved"),
      },
    });
  }

  return ok({
    ...state,
    approval: null,
    metrics: {
      ...state.metrics,
      institutionalTrust: Math.max(0, state.metrics.institutionalTrust - 4),
      citizenTrust: Math.max(0, state.metrics.citizenTrust - 1),
      inflation: Math.min(30, state.metrics.inflation + 0.3),
    },
    events: {
      ...state.events,
      flags: uniqueFlag(state.events.flags, "approval-refused"),
    },
  });
};

export const setRecoveryRateAction = (state: GameState, rate: number): Result<GameState> => {
  if (!Number.isFinite(rate) || rate < RECOVERY_RATE_MIN || rate > RECOVERY_RATE_MAX) {
    return err("policy.rate-out-of-range");
  }

  return ok({ ...state, policy: { ...state.policy, n2Rate: rate } });
};

export const cancelApprovalAction = (state: GameState): Result<GameState> =>
  ok({ ...state, approval: null });
