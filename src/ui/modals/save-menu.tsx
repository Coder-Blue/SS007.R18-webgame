import { createSignal, For, Show } from "solid-js";
import type { JSX } from "@solidjs/web";
import {
  Dialog,
  DialogBackdrop,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@ui-sdk/solid/dialog";
import { Switch, SwitchThumb } from "@ui-sdk/solid/switch";
import { useGame } from "../game-context";
import { ActionButton, Badge, Divider, IconButton } from "../components/base";
import { Icon } from "../components/icons";
import { t } from "../localization";
import {
  clearAllSaves,
  deleteSlot,
  listSaves,
  readSession,
  SLOT_IDS,
  slotMeta,
  writeSession,
  type SlotId,
} from "~/state/persistence";

const slotName = (slot: SlotId): string => {
  if (slot === "autosave") return t("save.autosave");

  return t("save.slot", { index: slot.replace("slot", "") });
};

const time = (iso: string): string => {
  try {
    return new Date(iso).toLocaleString("vi-VN");
  } catch {
    return iso;
  }
};

const download = (content: string): void => {
  if (typeof window === "undefined") return;
  const blob = new Blob([content], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `doc-quyen-kinh-te-${Date.now()}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
};

export const SaveMenu = (props: {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly onNotice: (message: string) => void;
  readonly onLoaded: () => void;
}): JSX.Element => {
  const { store, actions } = useGame();
  const state = store.state;
  const [refresh, setRefresh] = createSignal(0);
  const [confirmDelete, setConfirmDelete] = createSignal<SlotId | null>(null);
  const [reduced, setReduced] = createSignal(readSession().reducedMotion);
  const slots = () => (refresh(), listSaves());
  const autosave = () => (refresh(), slotMeta("autosave"));

  const reload = (): void => {
    setRefresh(refresh() + 1);
  };

  const applyMotion = (value: boolean): void => {
    setReduced(value);
    const prefs = readSession();
    writeSession({ ...prefs, reducedMotion: value });

    if (typeof document !== "undefined") {
      document.documentElement.dataset.motion = value ? "reduced" : "full";
    }
  };

  const save = (slot: SlotId): void => {
    if (actions.save(slot)) {
      writeSession({ ...readSession(), activeSlot: slot });
      props.onNotice(t("notice.saved"));
      reload();

      return;
    }

    props.onNotice(t("error.save.write-failed"));
  };

  const load = (slot: SlotId): void => {
    if (actions.load(slot)) {
      writeSession({ ...readSession(), activeSlot: slot });
      props.onNotice(t("notice.loaded"));
      props.onLoaded();
      props.onClose();

      return;
    }

    props.onNotice(t("error.save.empty"));
  };

  const importFile = (file: File | undefined): void => {
    if (file === undefined) return;
    const reader = new FileReader();
    reader.addEventListener("load", () => {
      const result = actions.importJson(String(reader.result));

      if (!result.ok) {
        props.onNotice(t("save.importError"));

        return;
      }

      store.setState(result.value.state);
      props.onNotice(t("notice.imported"));
      props.onLoaded();
      props.onClose();
    });
    reader.readAsText(file);
  };

  return (
    <Dialog open={props.open} onOpenChange={(open) => (open ? undefined : props.onClose())}>
      <DialogBackdrop class="modal-backdrop" />
      <DialogContent class="modal save-modal">
        <div class="save-head">
          <div>
            <p class="eyebrow">{t("app.title")}</p>
            <DialogTitle class="modal-title">{t("save.title")}</DialogTitle>
          </div>
          <IconButton icon="lucide:x" label={t("save.close")} onClick={props.onClose} />
        </div>
        <DialogDescription class="modal-desc">{t("save.slots")}</DialogDescription>
        <div class="slot-list">
          <For each={slots()}>
            {(meta, index) => {
              const slot = SLOT_IDS[index()] ?? "slot1";

              return (
                <div class="slot-card" data-current={meta !== null && state().clock.tick > 0}>
                  <div class="slot-main">
                    <strong>{slotName(slot)}</strong>
                    <Show
                      when={meta !== null}
                      fallback={<span class="muted">{t("save.empty")}</span>}
                    >
                      <span>
                        {t("hud.date", { month: meta!.month, year: meta!.year })} ·{" "}
                        {t("save.savedAt", { time: time(meta!.savedAt) })}
                      </span>
                      <span class="slot-stats">
                        {t("hud.debt")} {Math.round(meta!.debt)} · {t("hud.trust")}{" "}
                        {Math.round(meta!.trust)}%
                      </span>
                    </Show>
                  </div>
                  <div class="slot-actions">
                    <ActionButton size="sm" variant="gold" onClick={() => save(slot)}>
                      {t("action.save")}
                    </ActionButton>
                    <ActionButton
                      size="sm"
                      variant="secondary"
                      disabled={meta === null}
                      onClick={() => load(slot)}
                    >
                      {t("action.load")}
                    </ActionButton>
                    <Show
                      when={confirmDelete() === slot}
                      fallback={
                        <IconButton
                          icon="lucide:trash"
                          label={t("action.delete")}
                          onClick={() => setConfirmDelete(slot)}
                          disabled={meta === null}
                        />
                      }
                    >
                      <ActionButton
                        size="sm"
                        variant="danger"
                        onClick={() => {
                          deleteSlot(slot);
                          setConfirmDelete(null);
                          reload();
                        }}
                      >
                        {t("action.confirm")}
                      </ActionButton>
                    </Show>
                  </div>
                </div>
              );
            }}
          </For>
        </div>
        <Show when={autosave()}>
          <div class="autosave-row">
            <Badge tone="dark">{t("save.autosave")}</Badge>
            <span>{t("hud.date", { month: autosave()!.month, year: autosave()!.year })}</span>
            <ActionButton size="sm" variant="secondary" onClick={() => load("autosave")}>
              {t("action.load")}
            </ActionButton>
          </div>
        </Show>
        <Divider />
        <div class="save-tools">
          <div>
            <strong>{t("save.exportImport")}</strong>
            <p class="muted">{t("save.exportHelp")}</p>
          </div>
          <div class="save-tool-actions">
            <ActionButton
              size="sm"
              variant="secondary"
              icon="lucide:download"
              onClick={() => download(actions.exportJson())}
            >
              {t("action.export")}
            </ActionButton>
            <label class="file-button">
              <Icon icon="lucide:upload" size={16} />
              <span>{t("action.importFile")}</span>
              <input
                type="file"
                accept="application/json,.json"
                onChange={(event) => importFile(event.currentTarget.files?.[0])}
              />
            </label>
            <ActionButton
              size="sm"
              variant="ghost"
              icon="lucide:play"
              onClick={() => {
                actions.newGame();
                props.onLoaded();
              }}
            >
              {t("action.new")}
            </ActionButton>
          </div>
        </div>
        <Divider />
        <div class="settings-row">
          <div>
            <strong>{t("save.motion")}</strong>
            <p class="muted">{t("save.motionHelp")}</p>
          </div>
          <label class="switch-label">
            <Switch checked={reduced()} onCheckedChange={applyMotion}>
              <SwitchThumb />
            </Switch>
          </label>
        </div>
        <div class="settings-row">
          <div>
            <strong>{t("save.language")}</strong>
            <p class="muted">{t("save.vietnamese")}</p>
          </div>
          <Badge tone="gold">Tiếng Việt</Badge>
        </div>
        <Divider />
        <div class="settings-row">
          <div>
            <strong>{t("save.reset")}</strong>
            <p class="muted">{t("save.resetHelp")}</p>
          </div>
          <ActionButton
            size="sm"
            variant="danger"
            icon="lucide:trash"
            onClick={() => {
              clearAllSaves();
              actions.newGame();
              reload();
              props.onClose();
            }}
          >
            {t("save.reset")}
          </ActionButton>
        </div>
      </DialogContent>
    </Dialog>
  );
};
