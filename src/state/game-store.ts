import { createSignal } from "solid-js";
import type { ActionResult, Dispatch, GameState, Result, TickOutcome } from "~/domain";
import {
  advanceMonth,
  createInitialState,
  requestTariffAction,
  resolveApprovalAction,
  resolveEvent,
  setDispatchAction,
  setSupplierAction,
} from "~/domain";
import type { GameSpeed } from "./persistence";
import { saveToSlot } from "./persistence";

export type ApprovalResult = "approved" | "refused";

export type GameStore = {
  readonly state: () => GameState;
  readonly lastOutcome: () => TickOutcome | null;
  readonly notice: () => string | null;
  readonly lastError: () => string | null;
  readonly running: () => boolean;
  readonly wantsRunning: () => boolean;
  readonly speed: () => GameSpeed;
  readonly lastApproval: () => ApprovalResult | null;
  readonly hold: () => boolean;
  readonly setState: (state: GameState) => void;
  readonly newGame: (seed?: number) => void;
  readonly dispatch: (action: ActionResult) => boolean;
  readonly advance: () => Result<TickOutcome>;
  readonly resolve: (choiceId: string) => boolean;
  readonly requestTariff: (
    tiers: readonly [number, number, number, number, number, number],
    industrial: number,
  ) => boolean;
  readonly submitApproval: () => boolean;
  readonly cancelApproval: () => void;
  readonly setDispatch: (dispatch: Dispatch) => void;
  readonly setSupplier: (supplierId: string) => boolean;
  readonly togglePause: () => void;
  readonly setRunning: (value: boolean) => void;
  readonly setSpeed: (speed: GameSpeed) => void;
  readonly clearNotice: () => void;
  readonly clearApprovalResult: () => void;
  readonly setHold: (value: boolean) => void;
};

const needsPause = (state: GameState): boolean =>
  state.events.activeId !== null || state.approval !== null || state.ending !== null;

const initial = (seed?: number): GameState =>
  seed === undefined ? createInitialState() : createInitialState(seed);

export const createGameStore = (initialState: GameState = initial()): GameStore => {
  const [state, setStateSignal] = createSignal<GameState>(initialState);
  const [lastOutcome, setLastOutcome] = createSignal<TickOutcome | null>(null);
  const [notice, setNotice] = createSignal<string | null>(null);
  const [lastError, setLastError] = createSignal<string | null>(null);
  const [wantsRunning, setRunning] = createSignal(false);
  const [speed, setSpeedSignal] = createSignal<GameSpeed>(1);
  const [lastApproval, setLastApproval] = createSignal<ApprovalResult | null>(null);
  const [hold, setHoldSignal] = createSignal(false);
  const running = (): boolean => wantsRunning() && !needsPause(state()) && !hold();

  const dispatch = (action: ActionResult): boolean => {
    if (action.ok) {
      setStateSignal(action.value);
      setLastError(null);

      return true;
    }

    setLastError(action.error);

    return false;
  };

  const advance = (): Result<TickOutcome> => {
    const outcome = advanceMonth(state());

    if (!outcome.ok) {
      setLastError(outcome.error);

      return outcome;
    }

    setLastOutcome(outcome.value);
    setStateSignal(outcome.value.state);
    setLastError(null);
    saveToSlot("autosave", outcome.value.state);

    const nextNotice = outcome.value.notices.findLast(
      (code) => code !== "notice.media" && !code.startsWith("notice.event:"),
    );

    if (nextNotice !== undefined) setNotice(nextNotice);

    return outcome;
  };

  const resolve = (choiceId: string): boolean => {
    const resolved = resolveEvent(state(), choiceId);

    if (!resolved.ok) {
      setLastError(resolved.error);

      return false;
    }

    setStateSignal(resolved.value);
    saveToSlot("autosave", resolved.value);
    setLastError(null);

    return true;
  };

  const requestTariff: GameStore["requestTariff"] = (tiers, industrial) => {
    const result = requestTariffAction(state(), tiers, industrial);

    if (!result.ok) {
      setLastError(result.error);

      return false;
    }

    setStateSignal(result.value);
    saveToSlot("autosave", result.value);
    setLastError(null);

    return true;
  };

  const submitApproval = (): boolean => {
    const before = state().tariffs.tiers;
    const result = resolveApprovalAction(state());

    if (!result.ok) {
      setLastError(result.error);

      return false;
    }

    const changed = result.value.tariffs.tiers !== before;
    setLastApproval(changed ? "approved" : "refused");
    setStateSignal(result.value);
    saveToSlot("autosave", result.value);

    return true;
  };

  const setDispatch = (nextDispatch: Dispatch): void => {
    const result = setDispatchAction(state(), nextDispatch);

    if (result.ok) setStateSignal(result.value);
  };

  const setSupplier = (supplierId: string): boolean => {
    const result = setSupplierAction(state(), supplierId);

    if (!result.ok) {
      setLastError(result.error);

      return false;
    }

    setStateSignal(result.value);

    return true;
  };

  const newGame = (seed?: number): void => {
    setLastOutcome(null);
    setNotice(null);
    setLastError(null);
    setLastApproval(null);
    setRunning(false);
    setStateSignal(initial(seed));
  };

  return {
    state,
    lastOutcome,
    notice,
    lastError,
    running,
    wantsRunning,
    speed,
    lastApproval,
    hold,
    setState: (next) => {
      setRunning(false);
      setLastApproval(null);
      setLastOutcome(null);
      setStateSignal(next);
    },
    newGame,
    dispatch,
    advance,
    resolve,
    requestTariff,
    submitApproval,
    cancelApproval: () => {
      const current = state();

      if (current.approval === null) return;
      const next = { ...current, approval: null };
      setStateSignal(next);
      saveToSlot("autosave", next);
    },
    setDispatch,
    setSupplier,
    togglePause: () => {
      if (needsPause(state()) || hold()) return;
      setRunning(!wantsRunning());
    },
    setRunning,
    setSpeed: (next) => setSpeedSignal(next),
    clearNotice: () => setNotice(null),
    clearApprovalResult: () => setLastApproval(null),
    setHold: setHoldSignal,
  };
};
