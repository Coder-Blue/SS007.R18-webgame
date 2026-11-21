import type { GameState, Result, RoadGrade, SaveFile, TickOutcome } from "~/domain";
import {
  buildRoadAction,
  enableDppaAction,
  enableNsmoAction,
  enableTwoPartAction,
  enableVremAction,
  enactRecoveryAction,
  importRiceAction,
  investAction,
  requestBailoutAction,
  setRecoveryRateAction,
  setTariffsAction,
} from "~/domain";
import type { GameStore } from "./game-store";
import type { SlotId } from "./persistence";
import { exportSave, importSave, loadFromSlot, saveToSlot } from "./persistence";

export interface GameActions {
  readonly buildRoad: (grade: RoadGrade) => boolean;
  readonly invest: (kind: Parameters<typeof investAction>[1]) => boolean;
  readonly importRice: () => boolean;
  readonly setTariffs: (
    tiers: readonly [number, number, number, number],
    workshop: number,
  ) => boolean;
  readonly enactRecovery: () => boolean;
  readonly setRecoveryRate: (rate: number) => boolean;
  readonly enableNsmo: () => boolean;
  readonly enableDppa: () => boolean;
  readonly enableVrem: () => boolean;
  readonly enableTwoPart: () => boolean;
  readonly requestBailout: () => boolean;
  readonly advance: () => Result<TickOutcome>;
  readonly resolve: (choiceId: string) => boolean;
  readonly save: (slot: SlotId) => boolean;
  readonly load: (slot: SlotId) => boolean;
  readonly exportJson: () => string;
  readonly importJson: (text: string) => Result<SaveFile>;
  readonly newGame: (seed?: number) => void;
}

export const createGameActions = (store: GameStore): GameActions => ({
  buildRoad: (grade) => store.dispatch(buildRoadAction(store.state(), grade)),
  invest: (kind) => store.dispatch(investAction(store.state(), kind)),
  importRice: () => store.dispatch(importRiceAction(store.state())),
  setTariffs: (tiers, workshop) => store.dispatch(setTariffsAction(store.state(), tiers, workshop)),
  enactRecovery: () => store.dispatch(enactRecoveryAction(store.state())),
  setRecoveryRate: (rate) => store.dispatch(setRecoveryRateAction(store.state(), rate)),
  enableNsmo: () => store.dispatch(enableNsmoAction(store.state())),
  enableDppa: () => store.dispatch(enableDppaAction(store.state())),
  enableVrem: () => store.dispatch(enableVremAction(store.state())),
  enableTwoPart: () => store.dispatch(enableTwoPartAction(store.state())),
  requestBailout: () => store.dispatch(requestBailoutAction(store.state())),
  advance: () => store.advance(),
  resolve: (choiceId) => store.resolve(choiceId),
  save: (slot) => {
    const result = saveToSlot(slot, store.state());

    return result.ok;
  },
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
