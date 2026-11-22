import { createTrackedEffect } from "solid-js";
import { useMutation, useQuery, useQueryClient } from "@tanstack/solid-query";
import type { GameState, TickOutcome } from "~/domain";
import type { GameStore } from "./game-store";

export const MONTH_BASE_MS = 8_000;

export const gameKeys = {
  all: ["grid"] as const,
  snapshot: (tick: number) => ["grid", "snapshot", tick] as const,
  history: (tick: number) => ["grid", "history", tick] as const,
};

export const useGameSnapshot = (store: GameStore) =>
  useQuery(() => ({
    queryKey: gameKeys.snapshot(store.state().clock.tick),
    queryFn: async (): Promise<GameState> => store.state(),
    initialData: store.state(),
    staleTime: Number.POSITIVE_INFINITY,
    gcTime: 1_000,
  }));

export const useAdvanceMonth = (store: GameStore) => {
  const client = useQueryClient();

  return useMutation(() => ({
    mutationFn: async (): Promise<TickOutcome | null> => {
      const result = store.advance();

      if (!result.ok) return null;
      await client.invalidateQueries({ queryKey: gameKeys.all });

      return result.value;
    },
  }));
};

export const useAutoPlay = (store: GameStore, advance: () => void): void => {
  createTrackedEffect(() => {
    if (!store.running() || store.hold()) return;

    if (store.state().phase !== "playing") return;

    if (store.state().events.activeId !== null) return;

    if (store.state().approval !== null) return;

    const interval = MONTH_BASE_MS / store.speed();
    const timer = setInterval(advance, interval);

    return () => clearInterval(timer);
  });
};
