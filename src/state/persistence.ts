import * as v from "valibot";
import type { GameState, Result, SaveFile } from "~/domain";
import { SAVE_VERSION, decodeSaveFile, err, ok } from "~/domain";

export type SlotId = "slot1" | "slot2" | "slot3" | "autosave";

export type GameSpeed = 1 | 2 | 3;

export const SLOT_IDS = ["slot1", "slot2", "slot3"] as const satisfies readonly SlotId[];
export const ALL_SLOT_IDS = ["autosave", ...SLOT_IDS] as const satisfies readonly SlotId[];

const PREFIX = "dhl:";
const SESSION_KEY = `${PREFIX}session`;

export type SessionPrefs = {
  readonly activeSlot: SlotId | null;
  readonly panel: string;
  readonly tutorialDone: boolean;
  readonly reducedMotion: boolean;
  readonly speed: GameSpeed;
  readonly paused: boolean;
};

const SessionPrefsSchema = v.object({
  activeSlot: v.optional(v.nullable(v.picklist(ALL_SLOT_IDS)), null),
  panel: v.optional(v.string(), "overview"),
  tutorialDone: v.optional(v.boolean(), false),
  reducedMotion: v.optional(v.boolean(), false),
  speed: v.optional(v.picklist([1, 2, 3] as const), 1),
  paused: v.optional(v.boolean(), false),
});

const SaveEnvelopeSchema = v.object({
  format: v.literal("grid-save"),
  version: v.literal(SAVE_VERSION),
});

export const DEFAULT_PREFS: SessionPrefs = {
  activeSlot: null,
  panel: "overview",
  tutorialDone: false,
  reducedMotion: false,
  speed: 1,
  paused: false,
};

export type SaveMeta = {
  readonly slot: SlotId;
  readonly savedAt: string;
  readonly year: number;
  readonly month: number;
  readonly act: number;
  readonly debt: number;
  readonly citizenTrust: number;
  readonly institutionalTrust: number;
  readonly coverage: number;
  readonly ended: boolean;
};

const keyFor = (slot: SlotId): string => `${PREFIX}${slot}`;

const readItem = (
  key: string,
  kind: "localStorage" | "sessionStorage" = "localStorage",
): string | null => {
  if (typeof window === "undefined") return null;

  try {
    return window[kind].getItem(key);
  } catch {
    return null;
  }
};

const nowIso = (): string => new Date().toISOString();

export const makeSaveFile = (state: GameState): SaveFile => ({
  format: "grid-save",
  version: SAVE_VERSION,
  savedAt: nowIso(),
  state,
});

export const saveToSlot = (slot: SlotId, state: GameState): Result<SaveFile> => {
  if (typeof window === "undefined") return err("save.storage-unavailable");
  const file = makeSaveFile(state);

  try {
    const storage = window.localStorage;

    if (storage === undefined) return err("save.storage-unavailable");
    storage.setItem(keyFor(slot), JSON.stringify(file));

    return ok(file);
  } catch {
    return err("save.write-failed");
  }
};

export const loadFromSlot = (slot: SlotId): Result<GameState> => {
  if (typeof window === "undefined") return err("save.storage-unavailable");

  try {
    const raw = window.localStorage.getItem(keyFor(slot));

    if (raw === null) return err("save.empty");
    const decoded = decodeSaveFile(raw);

    return decoded.ok ? ok(decoded.value.state) : decoded;
  } catch {
    return err("save.storage-unavailable");
  }
};

export const deleteSlot = (slot: SlotId): void => {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.removeItem(keyFor(slot));
  } catch {
    return;
  }
};

export const slotMeta = (slot: SlotId): SaveMeta | null => {
  const raw = readItem(keyFor(slot));

  if (raw === null) return null;
  const decoded = decodeSaveFile(raw);

  if (!decoded.ok) return null;
  const state = decoded.value.state;

  const coverage =
    (state.zones.urban.coverage + state.zones.industrial.coverage + state.zones.rural.coverage) / 3;

  return {
    slot,
    savedAt: decoded.value.savedAt,
    year: state.clock.year,
    month: state.clock.month,
    act: state.act,
    debt: state.finance.debt,
    citizenTrust: state.metrics.citizenTrust,
    institutionalTrust: state.metrics.institutionalTrust,
    coverage,
    ended: state.ending !== null,
  };
};

export const listSaves = (): readonly (SaveMeta | null)[] => SLOT_IDS.map((slot) => slotMeta(slot));

export const hasAnySave = (): boolean => {
  return ALL_SLOT_IDS.some((slot) => {
    const raw = readItem(keyFor(slot));

    if (raw === null) return false;

    try {
      return v.safeParse(SaveEnvelopeSchema, JSON.parse(raw)).success;
    } catch {
      return false;
    }
  });
};

export const latestSave = (): {
  readonly slot: SlotId;
  readonly state: GameState;
  readonly savedAt: string;
} | null => {
  const candidates: { slot: SlotId; state: GameState; savedAt: string }[] = [];

  for (const slot of ALL_SLOT_IDS) {
    const raw = readItem(keyFor(slot));

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
  const raw = readItem(SESSION_KEY, "sessionStorage");

  if (raw === null) return DEFAULT_PREFS;

  try {
    const parsed = v.safeParse(SessionPrefsSchema, JSON.parse(raw));

    return parsed.success ? parsed.output : DEFAULT_PREFS;
  } catch {
    return DEFAULT_PREFS;
  }
};

export const writeSession = (prefs: SessionPrefs): void => {
  if (typeof window === "undefined") return;

  try {
    window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(prefs));
  } catch {
    return;
  }
};

export const clearAllSaves = (): void => {
  for (const slot of ALL_SLOT_IDS) deleteSlot(slot);
};
