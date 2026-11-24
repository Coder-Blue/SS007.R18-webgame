import { Show, createTrackedEffect, onSettled } from "solid-js";
import type { JSX } from "@solidjs/web";
import { Tabs, TabsList, TabsPanel, TabsTab } from "@ui-sdk/solid/tabs";
import { Icon } from "../components/icons";
import { PanelView } from "../panels/panel-view";
import { PANEL_TABS } from "../hud/bottom-dock";
import { PANEL_IDS, type PanelId } from "../mobile/mobile-nav";

// A plain fixed aside avoids the SDK drawer's promoted translate layer, which left stale paint bands on some GPUs.
export const WorkspaceDrawer = (props: {
  readonly open: boolean;
  readonly panel: PanelId;
  readonly onPanel: (panel: PanelId) => void;
  readonly onClose: () => void;
}): JSX.Element => {
  let closeButton: HTMLButtonElement | undefined;
  let lastFocused: HTMLElement | null = null;

  const restoreFocus = (): void => {
    if (lastFocused === null) return;
    lastFocused.focus();
    lastFocused = null;
  };

  createTrackedEffect(() => {
    if (typeof document === "undefined") return;

    if (props.open) {
      const active = document.activeElement;
      lastFocused = active instanceof HTMLElement ? active : null;
      queueMicrotask(() => closeButton?.focus());

      return;
    }

    restoreFocus();
  });

  onSettled(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      if (!props.open || event.key !== "Escape") return;

      if (document.querySelector(".modal, .ending-overlay") !== null) return;
      event.preventDefault();
      props.onClose();
    };

    window.addEventListener("keydown", onKeyDown, true);

    return () => {
      window.removeEventListener("keydown", onKeyDown, true);
      restoreFocus();
    };
  });

  return (
    <Show when={props.open}>
      <aside
        class="workspace-drawer flex flex-col overflow-hidden"
        data-side="right"
        role="dialog"
        aria-modal="false"
        aria-labelledby="workspace-drawer-title"
      >
        <div class="workspace-head shrink-0">
          <div>
            <p class="eyebrow">Bảng điều hành</p>
            <h2 id="workspace-drawer-title" class="modal-title">
              Điều Hành Lưới Điện Quốc Gia
            </h2>
            <p class="modal-desc">Ra quyết định, xem dự đoán, rồi tiếp tục mô phỏng.</p>
          </div>
          <button
            ref={(element) => {
              closeButton = element;
            }}
            type="button"
            class="icon-btn"
            aria-label="Đóng"
            onClick={props.onClose}
          >
            <Icon icon="lucide:x" size={18} />
          </button>
        </div>
        <Tabs
          class="flex min-h-0 flex-1 flex-col"
          value={props.panel}
          onValueChange={(value) =>
            props.onPanel(PANEL_IDS.find((panel) => panel === value) ?? "overview")
          }
        >
          <TabsList class="workspace-tabs shrink-0" aria-label="Bảng điều hành">
            {PANEL_TABS.map((tab) => (
              <TabsTab value={tab.id}>
                <Icon icon={tab.icon} size={16} />
                {tab.label}
              </TabsTab>
            ))}
          </TabsList>
          {PANEL_TABS.map((tab) => (
            <TabsPanel
              value={tab.id}
              class="workspace-panel min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain [scrollbar-color:var(--ink-faint)_var(--panel)] [scrollbar-gutter:stable]"
            >
              <PanelView panel={tab.id} />
            </TabsPanel>
          ))}
        </Tabs>
      </aside>
    </Show>
  );
};
