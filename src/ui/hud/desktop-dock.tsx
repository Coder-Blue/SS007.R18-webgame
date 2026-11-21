import type { JSX } from "@solidjs/web";
import { For, Show } from "solid-js";
import { useGame } from "../game-context";
import { ActionButton, Badge, Bar, Panel } from "../components/base";
import { Icon, type IconName } from "../components/icons";
import { t } from "../localization";
import { formatBillion, formatPercent, formatTonne } from "~/state/format";
import { averageHouseholdTariff, recoveryOf, type GameState } from "~/domain";
import { projectFinance } from "~/state/selectors";
import type { PanelId } from "../mobile/mobile-nav";

const pillars = (
  state: GameState,
): readonly {
  label: string;
  icon: IconName;
  value: number;
  tone: "good" | "warn" | "bad" | "gold";
  detail: string;
}[] => [
  {
    label: t("pillar.production"),
    icon: "rice",
    value: Math.min(100, (state.metrics.reliability ?? 100) * 0.6 + 20),
    tone: "good",
    detail: formatTonne(state.production.riceInventory),
  },
  {
    label: t("pillar.infrastructure"),
    icon: "road",
    value: state.infrastructure.remoteCoverage,
    tone: state.infrastructure.remoteCoverage >= 80 ? "good" : "warn",
    detail: formatPercent(state.infrastructure.coverage),
  },
  {
    label: t("pillar.retail"),
    icon: "scale",
    value: Math.max(
      0,
      100 -
        state.metrics.inflation * 4 -
        Math.max(0, averageHouseholdTariff(state.tariffs) - 11) * 3,
    ),
    tone: state.metrics.inflation > 8 ? "bad" : "gold",
    detail: formatPercent(state.metrics.inflation),
  },
];

export const LeftDock = (props: {
  readonly onOpenPanel: (panel: PanelId) => void;
  readonly selected: string | null;
  readonly onClearSelected: () => void;
}): JSX.Element => {
  const { store, actions } = useGame();
  const state = store.state;
  const recovery = () => recoveryOf(state());
  return (
    <aside class="dock dock-left desktop-only" aria-label={t("panel.valueChain")}>
      <Panel
        title={t("panel.valueChain")}
        kicker={t("hud.pillars")}
        icon="landmark"
        class="dock-panel"
      >
        <div class="dock-pillars">
          <For each={pillars(state())}>
            {(pillar) => (
              <button
                type="button"
                class="dock-pillar"
                onClick={() =>
                  props.onOpenPanel(
                    pillar.icon === "rice"
                      ? "production"
                      : pillar.icon === "road"
                        ? "infrastructure"
                        : "tariffs",
                  )
                }
              >
                <span class="dock-pillar-icon">
                  <Icon name={pillar.icon} size={17} />
                </span>
                <span class="dock-pillar-copy">
                  <strong>{pillar.label}</strong>
                  <span>{pillar.detail}</span>
                </span>
                <Bar value={pillar.value} tone={pillar.tone} />
              </button>
            )}
          </For>
        </div>
        <div class="quick-actions">
          <ActionButton
            size="sm"
            variant="gold"
            icon="road"
            onClick={() => actions.buildRoad("asphalt")}
          >
            {t("action.buildAsphalt")}
          </ActionButton>
          <ActionButton
            size="sm"
            variant="secondary"
            icon="droplets"
            onClick={() => actions.invest("hydro")}
          >
            {t("action.hydro")}
          </ActionButton>
          <ActionButton
            size="sm"
            variant="secondary"
            icon="warehouse"
            onClick={() => actions.importRice()}
          >
            {t("action.importRice")}
          </ActionButton>
        </div>
        <Show when={props.selected !== null}>
          <div class="selection-card">
            <div>
              <span class="eyebrow">{t("scene.stats")}</span>
              <strong>{t(`scene.${props.selected ?? "road"}`)}</strong>
            </div>
            <button
              type="button"
              class="icon-btn"
              aria-label={t("scene.close")}
              onClick={props.onClearSelected}
            >
              <Icon name="close" size={15} />
            </button>
          </div>
        </Show>
        <Show when={recovery().monthlyCredit > 0}>
          <div class="dock-note">
            <Icon name="coins" size={15} />
            <span>
              N-2 +{formatBillion(recovery().monthlyCredit)}/{t("chart.months", { count: 1 })}
            </span>
          </div>
        </Show>
      </Panel>
    </aside>
  );
};

export const RightDock = (props: {
  readonly onOpenPanel: (panel: PanelId) => void;
}): JSX.Element => {
  const { store, actions } = useGame();
  const state = store.state;
  const last = () => state().finance.monthlyHistory[state().finance.monthlyHistory.length - 1];
  const projection = () => projectFinance(state());
  const average = () => averageHouseholdTariff(state().tariffs);
  return (
    <aside class="dock dock-right desktop-only" aria-label={t("panel.finance")}>
      <Panel title={t("panel.finance")} kicker={t("finance.pnl")} icon="wallet" class="dock-panel">
        <div class="finance-hero">
          <span>{t("hud.cash")}</span>
          <strong>{formatBillion(state().finance.cash)}</strong>
          <Badge tone={(last()?.netResult ?? 0) >= 0 ? "good" : "bad"}>
            {t("finance.net")} {formatBillion(last()?.netResult ?? 0)}
          </Badge>
        </div>
        <div class="dock-meter">
          <div class="meter-row">
            <span>{t("hud.debt")}</span>
            <strong>{formatBillion(state().finance.debt)}</strong>
          </div>
          <Bar
            value={projection().debtRatio * 100}
            tone={projection().isDanger ? "bad" : "warn"}
            label={t("hud.debt")}
          />
        </div>
        <div class="dock-kpis">
          <div>
            <span>{t("tariff.average")}</span>
            <strong>{average().toFixed(2)}</strong>
          </div>
          <div>
            <span>{t("tariff.ceiling")}</span>
            <strong>{state().tariffs.ceiling.toFixed(2)}</strong>
          </div>
          <div>
            <span>{t("hud.inflation")}</span>
            <strong>{formatPercent(state().metrics.inflation)}</strong>
          </div>
        </div>
        <div class="quick-actions">
          <ActionButton
            size="sm"
            variant="secondary"
            icon="scale"
            onClick={() => props.onOpenPanel("tariffs")}
          >
            {t("panel.tariffs")}
          </ActionButton>
          <ActionButton
            size="sm"
            variant="secondary"
            icon="landmark"
            onClick={() => props.onOpenPanel("policy")}
          >
            {t("panel.policy")}
          </ActionButton>
        </div>
        <div class="dock-note">
          <Icon name={state().policy.n2Enabled ? "check" : "clock"} size={15} />
          <span>{state().policy.n2Enabled ? t("hud.recoveryActive") : t("policy.n2")}</span>
        </div>
        <ActionButton
          size="sm"
          variant="gold"
          icon="landmark"
          onClick={() => actions.enactRecovery()}
          disabled={state().clock.year < 2024 || state().policy.n2Enabled}
        >
          {state().policy.n2Enabled ? t("policy.enabled") : t("policy.enact")}
        </ActionButton>
      </Panel>
    </aside>
  );
};
