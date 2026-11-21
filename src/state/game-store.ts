import { createSignal } from "solid-js";
import type { ActionResult, GameState, TickOutcome, Result } from "~/domain";
import { advanceMonth, createInitialState, resolveEvent } from "~/domain";
import { saveToSlot } from "./persistence";

export interface GameStore {
  readonly state: () => GameState;
  readonly lastOutcome: () => TickOutcome | null;
  readonly notice: () => string | null;
  readonly lastError: () => string | null;
  readonly autoPlay: () => boolean;
  readonly setState: (state: GameState) => void;
  readonly newGame: (seed?: number) => void;
  readonly dispatch: (action: ActionResult) => boolean;
  readonly advance: () => Result<TickOutcome>;
  readonly resolve: (choiceId: string) => boolean;
  readonly setAutoPlay: (value: boolean) => void;
  readonly clearNotice: () => void;
}

const initial = (seed?: number): GameState =>
  seed === undefined ? createInitialState() : createInitialState(seed);

export const createGameStore = (initialState: GameState = initial()): GameStore => {
  const [state, setState] = createSignal<GameState>(initialState);
  const [lastOutcome, setLastOutcome] = createSignal<TickOutcome | null>(null);
  const [notice, setNotice] = createSignal<string | null>(null);
  const [lastError, setLastError] = createSignal<string | null>(null);
  const [autoPlay, setAutoPlaySignal] = createSignal(false);

  const commit = (next: GameState): void => {
    setState(next);
    if (next.ending !== null) setAutoPlaySignal(false);
  };

  const dispatch = (action: ActionResult): boolean => {
    if (action.ok) {
      commit(action.value);
      setLastError(null);
      return true;
    }
    setLastError(action.error.code);
    return false;
  };

  const advance = (): Result<TickOutcome> => {
    const outcome = advanceMonth(state());
    if (!outcome.ok) {
      setLastError(outcome.error);
      return outcome;
    }
    setLastOutcome(outcome.value);
    commit(outcome.value.state);
    setLastError(null);
    saveToSlot("autosave", outcome.value.state);
    if (outcome.value.notices.length > 0) {
      setNotice(outcome.value.notices[outcome.value.notices.length - 1] ?? null);
    }
    if (outcome.value.state.events.activeId !== null) {
      setAutoPlaySignal(false);
    }
    return outcome;
  };

  const resolve = (choiceId: string): boolean => {
    const resolved = resolveEvent(state(), choiceId);
    if (!resolved.ok) {
      setLastError(resolved.error);
      return false;
    }
    commit(resolved.value);
    setLastError(null);
    return true;
  };

  const newGame = (seed?: number): void => {
    setLastOutcome(null);
    setNotice(null);
    setLastError(null);
    setAutoPlaySignal(false);
    setState(initial(seed));
  };

  return {
    state,
    lastOutcome,
    notice,
    lastError,
    autoPlay,
    setState,
    newGame,
    dispatch,
    advance,
    resolve,
    setAutoPlay: (value: boolean) => {
      if (value && state().ending !== null) return;
      setAutoPlaySignal(value);
    },
    clearNotice: () => setNotice(null),
  };
};
