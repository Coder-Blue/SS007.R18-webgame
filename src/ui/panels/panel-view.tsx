import type { JSX } from "@solidjs/web";
import { Match, Switch } from "solid-js";
import { OverviewPanel } from "./overview-panel";
import { ProductionPanel } from "./production-panel";
import { GridPanel } from "./grid-panel";
import { TariffPanel } from "./tariff-panel";
import { PolicyPanel } from "./policy-panel";
import { FinancePanel } from "./finance-panel";
import type { PanelId } from "../mobile/mobile-nav";

export const PanelView = (props: { readonly panel: PanelId }): JSX.Element => (
  <Switch fallback={<OverviewPanel />}>
    <Match when={props.panel === "production"}>
      <ProductionPanel />
    </Match>
    <Match when={props.panel === "grid"}>
      <GridPanel />
    </Match>
    <Match when={props.panel === "tariffs"}>
      <TariffPanel />
    </Match>
    <Match when={props.panel === "policy"}>
      <PolicyPanel />
    </Match>
    <Match when={props.panel === "finance"}>
      <FinancePanel />
    </Match>
  </Switch>
);
