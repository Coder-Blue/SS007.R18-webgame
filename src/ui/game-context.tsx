import { createContext, useContext } from "solid-js";
import type { JSX } from "@solidjs/web";
import { QueryClient, QueryClientProvider } from "@tanstack/solid-query";
import { createGameActions, type GameActions } from "~/state/game-actions";
import { createGameStore, type GameStore } from "~/state/game-store";

interface GameContextValue {
  readonly store: GameStore;
  readonly actions: GameActions;
}

const GameContext = createContext<GameContextValue>();

const makeClient = (): QueryClient =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false, refetchOnWindowFocus: false },
      mutations: { retry: false },
    },
  });

export const GameProvider = (props: { readonly children: JSX.Element }): JSX.Element => {
  const store = createGameStore();
  const actions = createGameActions(store);
  const client = makeClient();

  return (
    <QueryClientProvider client={client}>
      <GameContext value={{ store, actions }}>{props.children}</GameContext>
    </QueryClientProvider>
  );
};

export const useGame = (): GameContextValue => {
  const context = useContext(GameContext);

  if (context === undefined) throw new Error("useGame must be used inside GameProvider");

  return context;
};
