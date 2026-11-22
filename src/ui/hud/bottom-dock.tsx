import type { JSX } from "@solidjs/web";
import { For } from "solid-js";
import { Icon, type IconName } from "../components/icons";
import type { PanelId } from "../mobile/mobile-nav";

export const PANEL_TABS: readonly {
  readonly id: PanelId;
  readonly label: string;
  readonly icon: IconName;
}[] = [
  { id: "overview", label: "Tổng quan", icon: "lucide:gauge" },
  { id: "production", label: "Sản xuất & mua điện", icon: "tabler:bolt" },
  { id: "grid", label: "Truyền tải", icon: "lucide:utility-pole" },
  { id: "tariffs", label: "Phân phối & giá", icon: "tabler:scale" },
  { id: "policy", label: "Chính sách", icon: "tabler:building-bank" },
  { id: "finance", label: "Tài chính", icon: "tabler:report-money" },
];

export const BottomDock = (props: {
  readonly onOpenPanel: (panel: PanelId) => void;
}): JSX.Element => (
  <nav class="bottom-dock desktop-only" aria-label="Bảng điều hành">
    <For each={PANEL_TABS}>
      {(tab) => (
        <button type="button" class="dock-tab" onClick={() => props.onOpenPanel(tab.id)}>
          <Icon icon={tab.icon} size={18} />
          <span>{tab.label}</span>
        </button>
      )}
    </For>
  </nav>
);
