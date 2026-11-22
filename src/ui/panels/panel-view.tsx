import type { JSX } from "@solidjs/web";
import { OverviewPanel } from "./overview-panel";
import { ProductionPanel } from "./production-panel";
import { GridPanel } from "./grid-panel";
import { TariffPanel } from "./tariff-panel";
import { PolicyPanel } from "./policy-panel";
import { FinancePanel } from "./finance-panel";
import type { PanelId } from "../mobile/mobile-nav";

export const PanelView = (props: { readonly panel: PanelId }): JSX.Element => {
  if (props.panel === "production") return <ProductionPanel />;

  if (props.panel === "grid") return <GridPanel />;

  if (props.panel === "tariffs") return <TariffPanel />;

  if (props.panel === "policy") return <PolicyPanel />;

  if (props.panel === "finance") return <FinancePanel />;

  return <OverviewPanel />;
};
