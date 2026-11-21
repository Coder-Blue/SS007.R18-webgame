import type { GameEventDefinition, GameState } from "../types";
import { monthIndex } from "../clock";
import { EARLY_EVENTS, type ScheduledEvent } from "./catalog";
import { LATE_EVENTS } from "./catalog-late";
import { DEBT_WARNING_EVENT } from "./conditional";

export const EVENT_SCHEDULE: readonly ScheduledEvent[] = [...EARLY_EVENTS, ...LATE_EVENTS];

export const ALL_EVENTS: readonly GameEventDefinition[] = [
  ...EVENT_SCHEDULE.map((entry) => entry.definition),
  DEBT_WARNING_EVENT,
];

export const eventById = (id: string): GameEventDefinition | undefined =>
  ALL_EVENTS.find((event) => event.id === id);

export const dueEventIds = (state: GameState): readonly string[] => {
  const index = monthIndex(state.clock);
  const ids = EVENT_SCHEDULE.filter((entry) => entry.tick <= index).map(
    (entry) => entry.definition.id,
  );
  const debtPressure =
    state.finance.debt >= state.finance.debtLimit * 0.78 && state.clock.tick >= 6;
  if (debtPressure) ids.push(DEBT_WARNING_EVENT.id);
  return ids.filter(
    (id) =>
      id !== state.events.activeId &&
      !state.events.resolved.includes(id) &&
      !state.events.queue.includes(id),
  );
};

export const scheduleEvents = (state: GameState): GameState => {
  const queue = [...state.events.queue, ...dueEventIds(state)];
  const activeId = state.events.activeId ?? queue[0] ?? null;
  return {
    ...state,
    events: {
      ...state.events,
      activeId,
      queue: activeId === queue[0] ? queue.slice(1) : queue,
    },
  };
};

export const activeEvent = (state: GameState): GameEventDefinition | null => {
  const id = state.events.activeId;
  return id === null ? null : (eventById(id) ?? null);
};
