import type {
  DecisionId,
  GameState,
  PlantKind,
  PolicyKey,
  Result,
  SaveFile,
  TickOutcome,
  ZoneId,
} from "~/domain";
import {
  buildLineAction,
  buildPlantAction,
  enableN2Action,
  enablePolicyAction,
  setRecoveryRate,
  startDecisionAction,
} from "~/domain";
import type { GameStore } from "./game-store";
import type { SlotId } from "./persistence";
import { exportSave, importSave, loadFromSlot, saveToSlot } from "./persistence";

export type GameActions = {
  readonly buildLine: (zone: ZoneId) => boolean;
  readonly buildPlant: (kind: PlantKind) => boolean;
  readonly startDecision: (id: DecisionId) => boolean;
  readonly enableN2: () => boolean;
  readonly enablePolicy: (key: PolicyKey) => boolean;
  readonly setRecoveryRate: (rate: number) => boolean;
  readonly resolve: (choiceId: string) => boolean;
  readonly advance: () => Result<TickOutcome>;
  readonly save: (slot: SlotId) => boolean;
  readonly load: (slot: SlotId) => boolean;
  readonly exportJson: () => string;
  readonly importJson: (text: string) => Result<SaveFile>;
  readonly newGame: (seed?: number) => void;
};

export const createGameActions = (store: GameStore): GameActions => ({
  buildLine: (zone) => store.dispatch(buildLineAction(store.state(), zone)),
  buildPlant: (kind) => store.dispatch(buildPlantAction(store.state(), kind)),
  startDecision: (id) => store.dispatch(startDecisionAction(store.state(), id)),
  enableN2: () => store.dispatch(enableN2Action(store.state())),
  enablePolicy: (key) => store.dispatch(enablePolicyAction(store.state(), key)),
  setRecoveryRate: (rate) => store.dispatch(setRecoveryRate(store.state(), rate)),
  resolve: (choiceId) => store.resolve(choiceId),
  advance: () => store.advance(),
  save: (slot) => saveToSlot(slot, store.state()).ok,
  load: (slot) => {
    const result = loadFromSlot(slot);

    if (!result.ok) return false;
    store.setState(result.value);

    return true;
  },
  exportJson: () => exportSave(store.state()),
  importJson: (text) => importSave(text),
  newGame: (seed) => {
    store.newGame(seed);
    saveToSlot("autosave", store.state());
  },
});

export const snapshotOf = (store: GameStore): GameState => store.state();
