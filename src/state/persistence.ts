import * as v from "valibot";
import type { GameState, Result, SaveFile } from "~/domain";
import { SAVE_VERSION, decodeSaveFile, err, ok } from "~/domain";

export type SlotId = "slot1" | "slot2" | "slot3" | "autosave";

export const SLOT_IDS = ["slot1", "slot2", "slot3"] as const satisfies readonly SlotId[];
export const ALL_SLOT_IDS = ["autosave", ...SLOT_IDS] as const satisfies readonly SlotId[];

const PREFIX = "dqkt:";
const SESSION_KEY = `${PREFIX}session`;

export interface SessionPrefs {
  readonly activeSlot: SlotId | null;
  readonly panel: string;
  readonly tutorialDone: boolean;
  readonly reducedMotion: boolean;
}

const SessionPrefsSchema = v.object({
  activeSlot: v.optional(v.nullable(v.picklist(ALL_SLOT_IDS)), null),
  panel: v.optional(v.string(), "overview"),
  tutorialDone: v.optional(v.boolean(), false),
  reducedMotion: v.optional(v.boolean(), false),
});

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

export const listSaves = (): readonly (SaveMeta | null)[] => SLOT_IDS.map((slot) => slotMeta(slot));

export const hasAnySave = (): boolean => {
  if (!hasStorage()) return false;

  return ALL_SLOT_IDS.some((slot) => window.localStorage.getItem(keyFor(slot)) !== null);
};

export const latestSave = (): {
  readonly slot: SlotId;
  readonly state: GameState;
  readonly savedAt: string;
} | null => {
  if (!hasStorage()) return null;
  const candidates: { slot: SlotId; state: GameState; savedAt: string }[] = [];

  for (const slot of ALL_SLOT_IDS) {
    const raw = window.localStorage.getItem(keyFor(slot));

    if (raw === null) continue;
    const decoded = decodeSaveFile(raw);

    if (decoded.ok) {
      candidates.push({
        slot,
        state: decoded.value.state,
        savedAt: decoded.value.savedAt,
      });
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
    const parsed = v.safeParse(SessionPrefsSchema, JSON.parse(raw));

    // Fail closed: one malformed preference must not keep stale UI state alive.
    return parsed.success ? parsed.output : DEFAULT_PREFS;
  } catch {
    return DEFAULT_PREFS;
  }
};

export const writeSession = (prefs: SessionPrefs): void => {
  if (typeof window === "undefined" || !window.sessionStorage) return;
  window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(prefs));
};

export const clearAllSaves = (): void => {
  for (const slot of ALL_SLOT_IDS) {
    deleteSlot(slot);
  }
};
