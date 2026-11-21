import { createTrackedEffect } from "solid-js";
import { useMutation, useQuery, useQueryClient } from "@tanstack/solid-query";
import type { GameState, TickOutcome } from "~/domain";
import type { GameStore } from "./game-store";

export const gameKeys = {
  all: ["game"] as const,
  snapshot: (tick: number) => ["game", "snapshot", tick] as const,
  history: (tick: number) => ["game", "history", tick] as const,
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

export const useAutoPlay = (store: GameStore, advance: () => void, delayMs: number): void => {
  createTrackedEffect(() => {
    if (!store.autoPlay() || store.state().phase !== "playing") return;
    if (store.state().events.activeId !== null) return;
    const timer = setInterval(advance, delayMs);
    return () => clearInterval(timer);
  });
};
