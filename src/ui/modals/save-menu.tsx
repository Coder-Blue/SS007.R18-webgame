import { createMemo, createSignal, For, Show } from "solid-js";
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

const slotName = (slot: SlotId): string =>
  slot === "autosave" ? "Tự động lưu" : `Ô ${slot.replace("slot", "")}`;

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
  anchor.download = `dien-luoi-quoc-gia-${Date.now()}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
};

export const SaveMenu = (props: {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly onNotice: (message: string) => void;
  readonly onLoaded: () => void;
  readonly onNewGame: () => void;
}): JSX.Element => {
  const { store, actions } = useGame();
  const state = store.state;
  const [refresh, setRefresh] = createSignal(0);
  const [confirmDelete, setConfirmDelete] = createSignal<SlotId | null>(null);
  const [reduced, setReduced] = createSignal(readSession().reducedMotion);

  const slots = createMemo(() => {
    refresh();

    return listSaves();
  });

  const autosave = createMemo(() => {
    refresh();

    return slotMeta("autosave");
  });

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
      props.onNotice("Đã lưu nhiệm kỳ.");
      reload();

      return;
    }

    props.onNotice("Không ghi được vào bộ nhớ trình duyệt.");
  };

  const load = (slot: SlotId): void => {
    if (actions.load(slot)) {
      writeSession({ ...readSession(), activeSlot: slot });
      props.onNotice("Đã tải nhiệm kỳ.");
      props.onLoaded();
      props.onClose();

      return;
    }

    props.onNotice("Ô lưu này đang trống.");
  };

  const importFile = (file: File | undefined): void => {
    if (file === undefined) return;
    const reader = new FileReader();
    reader.addEventListener("load", () => {
      const result = actions.importJson(String(reader.result));

      if (!result.ok) {
        props.onNotice("Không đọc được tệp lưu.");

        return;
      }

      store.setState(result.value.state);
      props.onNotice("Đã nhập bản lưu.");
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
            <p class="eyebrow">Điều Hành Lưới Điện Quốc Gia</p>
            <DialogTitle class="modal-title">Kho lưu và cài đặt</DialogTitle>
          </div>
          <IconButton icon="lucide:x" label="Đóng" onClick={props.onClose} />
        </div>
        <DialogDescription class="modal-desc">Ba ô lưu và một bản tự động.</DialogDescription>
        <div class="slot-list">
          <For each={slots()}>
            {(meta, index) => {
              const slot = SLOT_IDS[index()] ?? "slot1";

              return (
                <div class="slot-card" data-current={meta !== null && state().clock.tick > 0}>
                  <div class="slot-main">
                    <strong>{slotName(slot)}</strong>
                    <Show when={meta !== null} fallback={<span class="muted">Ô trống</span>}>
                      <span>
                        {`Tháng ${meta?.month ?? 0}/${meta?.year ?? 0}`} ·{" "}
                        {`Lưu lúc ${time(meta?.savedAt ?? "")}`}
                      </span>
                      <span class="slot-stats">
                        Nợ {Math.round(meta?.debt ?? 0)} tỷ · Phủ điện{" "}
                        {Math.round(meta?.coverage ?? 0)}% · Niềm tin dân{" "}
                        {Math.round(meta?.citizenTrust ?? 0)}%
                      </span>
                    </Show>
                  </div>
                  <div class="slot-actions">
                    <ActionButton size="sm" variant="gold" onClick={() => save(slot)}>
                      Lưu
                    </ActionButton>
                    <ActionButton
                      size="sm"
                      variant="secondary"
                      disabled={meta === null}
                      onClick={() => load(slot)}
                    >
                      Tải
                    </ActionButton>
                    <Show
                      when={confirmDelete() === slot}
                      fallback={
                        <IconButton
                          icon="lucide:trash"
                          label="Xóa"
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
                        Xác nhận
                      </ActionButton>
                    </Show>
                  </div>
                </div>
              );
            }}
          </For>
        </div>
        <Show when={autosave() !== null}>
          <div class="autosave-row">
            <Badge tone="dark">Tự động lưu</Badge>
            <span>{`Tháng ${autosave()?.month ?? 0}/${autosave()?.year ?? 0}`}</span>
            <ActionButton size="sm" variant="secondary" onClick={() => load("autosave")}>
              Tải
            </ActionButton>
          </div>
        </Show>
        <Divider />
        <div class="save-tools">
          <div>
            <strong>Xuất và nhập JSON</strong>
            <p class="muted">Sao lưu toàn bộ trạng thái để chuyển máy.</p>
          </div>
          <div class="save-tool-actions">
            <ActionButton
              size="sm"
              variant="secondary"
              icon="lucide:download"
              onClick={() => download(actions.exportJson())}
            >
              Xuất JSON
            </ActionButton>
            <label class="file-button">
              <Icon icon="lucide:upload" size={16} />
              <span>Nhập JSON</span>
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
                props.onNewGame();
                props.onClose();
              }}
            >
              Nhiệm kỳ mới
            </ActionButton>
          </div>
        </div>
        <Divider />
        <div class="settings-row">
          <div>
            <strong>Giảm chuyển động</strong>
            <p class="muted">Tắt hiệu ứng camera và chuyển mùa.</p>
          </div>
          <label class="switch-label">
            <Switch checked={reduced()} onCheckedChange={applyMotion} aria-label="Giảm chuyển động">
              <SwitchThumb />
            </Switch>
          </label>
        </div>
        <div class="settings-row">
          <div>
            <strong>Ngôn ngữ</strong>
            <p class="muted">Tiếng Việt</p>
          </div>
          <Badge tone="gold">Tiếng Việt</Badge>
        </div>
        <Divider />
        <div class="settings-row">
          <div>
            <strong>Xóa toàn bộ dữ liệu</strong>
            <p class="muted">Xóa ba ô lưu và bản tự động. Không thể hoàn tác.</p>
          </div>
          <ActionButton
            size="sm"
            variant="danger"
            icon="lucide:trash"
            onClick={() => {
              actions.newGame();
              clearAllSaves();
              reload();
              props.onClose();
            }}
          >
            Xóa toàn bộ dữ liệu
          </ActionButton>
        </div>
      </DialogContent>
    </Dialog>
  );
};
