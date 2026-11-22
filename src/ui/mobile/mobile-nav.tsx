import { createSignal, Show } from "solid-js";
import type { JSX } from "@solidjs/web";
import {
  Drawer,
  DrawerBackdrop,
  DrawerClose,
  DrawerContent,
  DrawerTitle,
} from "@ui-sdk/solid/drawer";
import { Icon } from "../components/icons";
import { PanelView } from "../panels/panel-view";
import { PANEL_TABS } from "../hud/bottom-dock";

export type PanelId = "overview" | "production" | "grid" | "tariffs" | "policy" | "finance";

export const PANEL_IDS = [
  "overview",
  "production",
  "grid",
  "tariffs",
  "policy",
  "finance",
] as const satisfies readonly PanelId[];

const mobileTabs = PANEL_TABS;

export const MobileNav = (): JSX.Element => {
  const [open, setOpen] = createSignal(false);
  const [panel, setPanel] = createSignal<PanelId>("overview");

  const openPanel = (id: PanelId): void => {
    setPanel(id);
    setOpen(true);
  };

  return (
    <>
      <nav class="mobile-nav" aria-label="Bảng điều hành">
        {mobileTabs.map((tab) => (
          <button
            type="button"
            class="mobile-tab"
            data-tutorial={tab.id}
            aria-haspopup="dialog"
            aria-expanded={open() && panel() === tab.id ? "true" : "false"}
            onClick={() => openPanel(tab.id)}
          >
            <Icon icon={tab.icon} size={20} />
            <span>{tab.label}</span>
          </button>
        ))}
      </nav>
      <Drawer open={open()} onOpenChange={setOpen}>
        <DrawerBackdrop class="sheet-backdrop" />
        <DrawerContent class="mobile-sheet">
          <div class="sheet-head">
            <DrawerTitle class="modal-title">Bảng điều hành</DrawerTitle>
            <DrawerClose class="icon-btn" aria-label="Đóng">
              <Icon icon="lucide:x" size={18} />
            </DrawerClose>
          </div>
          <div class="sheet-tabs">
            {mobileTabs.map((tab) => (
              <button
                type="button"
                class="sheet-tab"
                data-active={panel() === tab.id ? "true" : "false"}
                aria-pressed={panel() === tab.id ? "true" : "false"}
                onClick={() => setPanel(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div class="sheet-body">
            <Show when={open()}>
              <PanelView panel={panel()} />
            </Show>
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
};
