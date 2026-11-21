import type { GameState, Result, SaveFile } from "~/domain";
import { SAVE_VERSION, decodeSaveFile, err, ok } from "~/domain";

export type SlotId = "slot1" | "slot2" | "slot3" | "autosave";

export const SLOT_IDS: readonly SlotId[] = ["slot1", "slot2", "slot3"];

const PREFIX = "dqkt:";
const SESSION_KEY = `${PREFIX}session`;

export interface SessionPrefs {
  readonly activeSlot: SlotId | null;
  readonly panel: string;
  readonly tutorialDone: boolean;
  readonly reducedMotion: boolean;
}

export const DEFAULT_PREFS: SessionPrefs = {
  activeSlot: null,
  panel: "overview",
  tutorialDone: false,
  reducedMotion: false,
};

export interface SaveMeta {
  readonly slot: SlotId;
  readonly savedAt: string;
  readonly year: number;
  readonly month: number;
  readonly act: number;
  readonly debt: number;
  readonly satisfaction: number;
  readonly trust: number;
  readonly ended: boolean;
}

const keyFor = (slot: SlotId): string => `${PREFIX}${slot}`;

const hasStorage = (): boolean =>
  typeof window !== "undefined" && typeof window.localStorage !== "undefined";

const nowIso = (): string => new Date().toISOString();

export const makeSaveFile = (state: GameState): SaveFile => ({
  format: "dqkt-save",
  version: SAVE_VERSION,
  savedAt: nowIso(),
  state,
});

export const saveToSlot = (slot: SlotId, state: GameState): Result<SaveFile> => {
  if (!hasStorage()) return err("save.storage-unavailable");
  const file = makeSaveFile(state);
  try {
    window.localStorage.setItem(keyFor(slot), JSON.stringify(file));
    return ok(file);
  } catch {
    return err("save.write-failed");
  }
};

export const loadFromSlot = (slot: SlotId): Result<GameState> => {
  if (!hasStorage()) return err("save.storage-unavailable");
  const raw = window.localStorage.getItem(keyFor(slot));
  if (raw === null) return err("save.empty");
  const decoded = decodeSaveFile(raw);
  if (!decoded.ok) return decoded;
  return ok(decoded.value.state);
};

export const deleteSlot = (slot: SlotId): void => {
  if (!hasStorage()) return;
  window.localStorage.removeItem(keyFor(slot));
};

export const slotMeta = (slot: SlotId): SaveMeta | null => {
  if (!hasStorage()) return null;
  const raw = window.localStorage.getItem(keyFor(slot));
  if (raw === null) return null;
  const decoded = decodeSaveFile(raw);
  if (!decoded.ok) return null;
  const state = decoded.value.state;
  return {
    slot,
    savedAt: decoded.value.savedAt,
    year: state.clock.year,
    month: state.clock.month,
    act: state.act,
    debt: state.finance.debt,
    satisfaction: state.metrics.satisfaction,
    trust: state.metrics.trust,
    ended: state.ending !== null,
  };
};

export const listSaves = (): readonly (SaveMeta | null)[] =>
  ["slot1", "slot2", "slot3"].map((slot) => slotMeta(slot as SlotId));

export const latestSave = (): {
  readonly slot: SlotId;
  readonly state: GameState;
  readonly savedAt: string;
} | null => {
  if (!hasStorage()) return null;
  const candidates: { slot: SlotId; state: GameState; savedAt: string }[] = [];
  for (const slot of ["autosave", "slot1", "slot2", "slot3"] as SlotId[]) {
    const loaded = loadFromSlot(slot);
    if (loaded.ok) {
      const meta = slotMeta(slot);
      if (meta !== null) {
        candidates.push({ slot, state: loaded.value, savedAt: meta.savedAt });
      }
    }
  }
  if (candidates.length === 0) return null;
  return candidates.toSorted((a, b) => b.savedAt.localeCompare(a.savedAt))[0] ?? null;
};

export const exportSave = (state: GameState): string =>
  JSON.stringify(makeSaveFile(state), null, 2);

export const importSave = (text: string): Result<SaveFile> => decodeSaveFile(text);

export const readSession = (): SessionPrefs => {
  if (typeof window === "undefined" || !window.sessionStorage) return DEFAULT_PREFS;
  const raw = window.sessionStorage.getItem(SESSION_KEY);
  if (raw === null) return DEFAULT_PREFS;
  try {
    const parsed = JSON.parse(raw) as Partial<SessionPrefs>;
    return {
      activeSlot:
        parsed.activeSlot === "slot1" ||
        parsed.activeSlot === "slot2" ||
        parsed.activeSlot === "slot3" ||
        parsed.activeSlot === "autosave"
          ? parsed.activeSlot
          : null,
      panel: typeof parsed.panel === "string" ? parsed.panel : "overview",
      tutorialDone: parsed.tutorialDone === true,
      reducedMotion: parsed.reducedMotion === true,
    };
  } catch {
    return DEFAULT_PREFS;
  }
};

export const writeSession = (prefs: SessionPrefs): void => {
  if (typeof window === "undefined" || !window.sessionStorage) return;
  window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(prefs));
};

export const clearAllSaves = (): void => {
  for (const slot of ["autosave", "slot1", "slot2", "slot3"] as SlotId[]) {
    deleteSlot(slot);
  }
};
