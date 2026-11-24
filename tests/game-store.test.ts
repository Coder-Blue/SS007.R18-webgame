import { afterEach, describe, expect, it, vi } from "vitest";
import { createInitialState } from "../src/domain/constants";
import { createGameStore } from "../src/state/game-store";

const makeStorage = (): Storage => {
  const items = new Map<string, string>();

  return {
    get length() {
      return items.size;
    },
    clear: () => items.clear(),
    getItem: (key) => items.get(key) ?? null,
    key: (index) => Array.from(items.keys())[index] ?? null,
    removeItem: (key) => {
      items.delete(key);
    },
    setItem: (key, value) => {
      items.set(key, value);
    },
  };
};

const readSave = (storage: Storage): { state: { approval: unknown } } =>
  // SAFETY: the store writes a SaveFile envelope; the test only reads the approval field.
  JSON.parse(storage.getItem("dhl:autosave") ?? "null") as { state: { approval: unknown } };

describe("game store approval autosave", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("persists a pending approval and its cancellation", () => {
    const storage = makeStorage();
    vi.stubGlobal("window", { localStorage: storage });
    const store = createGameStore(createInitialState());

    const requested = store.requestTariff([1_914, 1_978, 2_297, 2_893, 3_233, 3_304], 1_750);

    expect(requested).toBe(true);
    expect(store.state().approval).not.toBeNull();
    expect(readSave(storage).state.approval).not.toBeNull();

    store.cancelApproval();

    expect(store.state().approval).toBeNull();
    expect(readSave(storage).state.approval).toBeNull();
  });
});
