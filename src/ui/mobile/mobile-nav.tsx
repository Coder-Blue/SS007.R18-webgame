import { createSignal, Show } from "solid-js";
import type { JSX } from "@solidjs/web";
import {
  Drawer,
  DrawerBackdrop,
  DrawerClose,
  DrawerContent,
  DrawerTitle,
} from "@ui-sdk/solid/drawer";
import { Icon, type IconName } from "../components/icons";
import { OverviewPanel } from "../panels/overview-panel";
import { ProductionPanel } from "../panels/production-panel";
import { InfrastructurePanel } from "../panels/infrastructure-panel";
import { TariffPanel } from "../panels/tariff-panel";
import { PolicyPanel } from "../panels/policy-panel";
import { FinancePanel } from "../panels/finance-panel";
import { HistoryPanel } from "../panels/history-panel";

export type PanelId =
  | "overview"
  | "production"
  | "infrastructure"
  | "tariffs"
  | "finance"
  | "policy"
  | "history";

export const PANEL_IDS = [
  "overview",
  "production",
  "infrastructure",
  "tariffs",
  "finance",
  "policy",
  "history",
] as const satisfies readonly PanelId[];

const tabs: readonly { readonly id: PanelId; readonly label: string; readonly icon: IconName }[] = [
  { id: "overview", label: "Tổng quan", icon: "lucide:gauge" },
  { id: "production", label: "Sản xuất", icon: "tabler:wheat" },
  { id: "infrastructure", label: "Đường", icon: "lucide:road" },
  { id: "tariffs", label: "Giá", icon: "lucide:scale" },
  { id: "policy", label: "Chính sách", icon: "lucide:landmark" },
];

const PanelView = (props: { readonly panel: PanelId }): JSX.Element => {
  if (props.panel === "production") return <ProductionPanel />;

  if (props.panel === "infrastructure") return <InfrastructurePanel />;

  if (props.panel === "tariffs") return <TariffPanel />;

  if (props.panel === "finance") return <FinancePanel />;

  if (props.panel === "policy") return <PolicyPanel />;

  if (props.panel === "history") return <HistoryPanel />;

  return <OverviewPanel />;
};

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
        {tabs.map((tab) => (
          <button type="button" class="mobile-tab" onClick={() => openPanel(tab.id)}>
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
            {tabs.map((tab) => (
              <button
                type="button"
                class="sheet-tab"
                data-active={panel() === tab.id}
                onClick={() => setPanel(tab.id)}
              >
                {tab.label}
              </button>
            ))}
            <button
              type="button"
              class="sheet-tab"
              data-active={panel() === "history"}
              onClick={() => setPanel("history")}
            >
              Lịch sử
            </button>
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
