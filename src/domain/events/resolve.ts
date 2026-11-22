import type { GameState } from "../types";
import { err, ok, type Result } from "../types";
import { findEvent } from "./catalog";
import { applyEffects } from "./effects";
import { withEndingCheck } from "../endings";

const unique = <T>(items: readonly T[], value: T): readonly T[] =>
  items.includes(value) ? items : [...items, value];

export const resolveEvent = (state: GameState, choiceId: string): Result<GameState> => {
  if (state.events.activeId === null) return err("event.none-active");
  const event = findEvent(state.events.activeId);

  if (event === null) return err("event.unknown");
  const choice = event.choices.find((candidate) => candidate.id === choiceId);

  if (choice === undefined) return err("event.unknown-choice");
  const applied = applyEffects(state, choice.effects);
  const queue = applied.events.queue;
  const nextActive = queue[0] ?? null;

  const next: GameState = {
    ...applied,
    media: event.id === "media-losses" ? { ...applied.media, cooldown: 8 } : applied.media,
    events: {
      ...applied.events,
      activeId: nextActive,
      queue: queue.slice(nextActive === null ? 0 : 1),
      resolved: unique(applied.events.resolved, event.id),
      flags: unique(applied.events.flags, `event:${event.id}:${choice.id}`),
    },
  };

  return ok(withEndingCheck(next));
};
