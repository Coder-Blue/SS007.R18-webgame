import type { DecisionId, GameState, PolicyKey } from "../types";
import { err, ok, type Result } from "../types";
import { DECISIONS, RECOVERY_RATE_MAX, RECOVERY_RATE_MIN } from "../constants";
import { addProject, charge } from "./helpers";
import { isReformPending, startReform } from "../reform-progress";

export const enableN2Action = (state: GameState): Result<GameState> => {
  if (state.policy.n2Enabled) return err("policy.already-enabled");

  if (state.clock.year < 2024) return err("policy.too-early");

  if (!state.policy.petitionDone && !state.events.flags.includes("event:revised-law:enact-law")) {
    return err("policy.requires-petition");
  }

  if (isReformPending(state.policy, "n2")) return err("policy.pending");

  return ok({ ...state, policy: startReform(state.policy, "n2") });
};

export const enablePolicyAction = (state: GameState, key: PolicyKey): Result<GameState> => {
  if (state.policy.branch === "private" || !state.policy.priceCap) {
    return err("policy.no-authority");
  }

  const current = state.policy;

  if (
    (key === "n2" && current.n2Enabled) ||
    (key === "nsmo" && current.nsmo) ||
    (key === "dppa" && current.dppa) ||
    (key === "vrem" && current.vrem) ||
    (key === "twoPart" && current.twoPartTariff)
  ) {
    return err("policy.already-enabled");
  }

  if (key === "twoPart" && !current.vrem) return err("policy.requires-vrem");

  if (
    key === "n2" &&
    (state.clock.year < 2024 ||
      (!current.petitionDone && !state.events.flags.includes("event:revised-law:enact-law")))
  ) {
    return err("policy.requires-petition");
  }

  if (
    key !== "n2" &&
    key !== "twoPart" &&
    !state.events.flags.includes("event:revised-law:enact-law")
  ) {
    return err("policy.requires-law");
  }

  if (isReformPending(current, key)) return err("policy.pending");

  return ok({ ...state, policy: startReform(current, key) });
};

export const setRecoveryRate = (state: GameState, rate: number): Result<GameState> => {
  if (!Number.isFinite(rate) || rate < RECOVERY_RATE_MIN || rate > RECOVERY_RATE_MAX) {
    return err("policy.rate-out-of-range");
  }

  return ok({ ...state, policy: { ...state.policy, n2Rate: rate } });
};

export const startDecisionAction = (state: GameState, id: DecisionId): Result<GameState> => {
  if (!state.events.decisions.includes(id)) return err("decision.unavailable");

  if (state.events.completedDecisions.includes(id)) return err("decision.completed");

  if (
    state.operations.projects.some(
      (project) => project.kind === "decision" && project.targetId === id,
    )
  ) {
    return err("decision.pending");
  }

  const definition = DECISIONS.find((candidate) => candidate.id === id);

  if (definition === undefined) return err("decision.unknown");
  const paid = charge(state, definition.cost);

  if (!paid.ok) return paid;

  return addProject(paid.value, "decision", id, definition.months);
};
