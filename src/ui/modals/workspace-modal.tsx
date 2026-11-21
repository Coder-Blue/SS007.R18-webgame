import type { JSX } from "@solidjs/web";
import {
  Dialog,
  DialogBackdrop,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@ui-sdk/solid/dialog";
import { Tabs, TabsList, TabsPanel, TabsTab } from "@ui-sdk/solid/tabs";
import { IconButton } from "../components/base";
import { t } from "../localization";
import { OverviewPanel } from "../panels/overview-panel";
import { ProductionPanel } from "../panels/production-panel";
import { InfrastructurePanel } from "../panels/infrastructure-panel";
import { TariffPanel } from "../panels/tariff-panel";
import { FinancePanel } from "../panels/finance-panel";
import { PolicyPanel } from "../panels/policy-panel";
import { HistoryPanel } from "../panels/history-panel";
import type { PanelId } from "../mobile/mobile-nav";

const tabs: readonly { readonly id: PanelId; readonly label: string }[] = [
  { id: "overview", label: "panel.overview" },
  { id: "production", label: "panel.production" },
  { id: "infrastructure", label: "panel.infrastructure" },
  { id: "tariffs", label: "panel.tariffs" },
  { id: "finance", label: "panel.finance" },
  { id: "policy", label: "panel.policy" },
  { id: "history", label: "panel.history" },
];

const PanelBody = (props: { readonly panel: PanelId }): JSX.Element => {
  if (props.panel === "production") return <ProductionPanel />;
  if (props.panel === "infrastructure") return <InfrastructurePanel />;
  if (props.panel === "tariffs") return <TariffPanel />;
  if (props.panel === "finance") return <FinancePanel />;
  if (props.panel === "policy") return <PolicyPanel />;
  if (props.panel === "history") return <HistoryPanel />;
  return <OverviewPanel />;
};

export const WorkspaceModal = (props: {
  readonly open: boolean;
  readonly panel: PanelId;
  readonly onPanel: (panel: PanelId) => void;
  readonly onClose: () => void;
}): JSX.Element => (
  <Dialog open={props.open} onOpenChange={(open) => (open ? undefined : props.onClose())}>
    <DialogBackdrop class="modal-backdrop" />
    <DialogContent class="modal workspace-modal">
      <div class="workspace-head">
        <div>
          <p class="eyebrow">{t("mobile.sheetTitle")}</p>
          <DialogTitle class="modal-title">{t("app.title")}</DialogTitle>
          <DialogDescription class="modal-desc">{t("panel.overviewDesc")}</DialogDescription>
        </div>
        <IconButton icon="close" label={t("panel.close")} onClick={props.onClose} />
      </div>
      <Tabs
        value={props.panel}
        onValueChange={(value) => props.onPanel((value ?? "overview") as PanelId)}
      >
        <TabsList class="workspace-tabs" aria-label={t("mobile.sheetTitle")}>
          {tabs.map((tab) => (
            <TabsTab value={tab.id}>{t(tab.label)}</TabsTab>
          ))}
        </TabsList>
        {tabs.map((tab) => (
          <TabsPanel value={tab.id} class="workspace-panel">
            <PanelBody panel={tab.id} />
          </TabsPanel>
        ))}
      </Tabs>
    </DialogContent>
  </Dialog>
);
