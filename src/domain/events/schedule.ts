import type { EventId, GameState } from "../types";

export const mediaShouldTrigger = (state: GameState): boolean => {
  if (state.media.cooldown > 0 || state.media.activeMonths > 0) return false;
  const last = state.finance.monthlyHistory[state.finance.monthlyHistory.length - 1];
  const previous = state.finance.monthlyHistory[state.finance.monthlyHistory.length - 2];

  if (last === undefined) return false;

  if (last.netResult < -180) return true;

  if (state.finance.debt > 60_000) return true;

  return previous !== undefined && last.averageRetailTariff > previous.averageRetailTariff * 1.01;
};

export const scriptedEventFor = (state: GameState): EventId | null => {
  const tick = state.clock.tick;

  if (tick === 9) return "fuel-crisis";

  if (tick === 16) return "summer-drought";

  if (tick === 36) return "public-skepticism";

  if (tick === 44 && state.policy.branch === "state") {
    return state.events.flags.includes("event:public-skepticism:reform-path")
      ? "revised-law"
      : null;
  }

  return null;
};

const enqueue = (queue: readonly EventId[], id: EventId): readonly EventId[] => [...queue, id];

export const scheduleEvent = (state: GameState): GameState => {
  if (state.ending !== null) return state;
  let queue = state.events.queue;

  if (state.events.activeId === null) {
    const scripted = scriptedEventFor(state);

    if (
      scripted !== null &&
      !state.events.resolved.includes(scripted) &&
      !queue.includes(scripted)
    ) {
      queue = enqueue(queue, scripted);
    }

    if (mediaShouldTrigger(state) && !queue.includes("media-losses")) {
      queue = enqueue(queue, "media-losses");
    }
  }

  const activeId = state.events.activeId ?? queue[0] ?? null;
  const remaining = activeId === null ? queue : queue.filter((id) => id !== activeId);

  return {
    ...state,
    events: { ...state.events, activeId, queue: remaining },
  };
};
