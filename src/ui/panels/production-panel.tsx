import { For } from "solid-js";
import type { JSX } from "@solidjs/web";
import { useGame } from "../game-context";
import { ActionButton, Badge, Bar, Panel, SectionHeading, Stat } from "../components/base";
import { Icon } from "../components/icons";
import { t } from "../localization";
import { formatBillion, formatPercent, formatPrice, formatTonne } from "~/state/format";
import { investmentCost, productionCostPerTonne, type InvestmentKind } from "~/domain";

interface InvestmentCard {
  readonly kind: InvestmentKind;
  readonly label: string;
  readonly desc: string;
  readonly icon: "droplets" | "factory" | "rain" | "spark" | "truck";
}

const investments: readonly InvestmentCard[] = [
  { kind: "hydro", label: "action.hydro", desc: "action.hydroDesc", icon: "droplets" },
  {
    kind: "mechanized",
    label: "action.mechanized",
    desc: "action.mechanizedDesc",
    icon: "factory",
  },
  { kind: "irrigation", label: "action.irrigation", desc: "action.irrigationDesc", icon: "rain" },
  { kind: "rnd", label: "action.rnd", desc: "action.rndDesc", icon: "spark" },
  { kind: "fleet", label: "action.fleet", desc: "action.fleetDesc", icon: "truck" },
];

export const ProductionPanel = (): JSX.Element => {
  const { store, actions } = useGame();
  const state = store.state;
  const last = () => state().finance.monthlyHistory[state().finance.monthlyHistory.length - 1];
  const production = () => state().production;
  const market = () => state().market;
  const own = () => last()?.ownProduction ?? 0;
  const external = () => last()?.externalPurchase ?? 0;
  const selfSufficiency = () => {
    const total = own() + external();
    return total <= 0 ? 0 : (own() / total) * 100;
  };
  return (
    <div class="stack-lg">
      <Panel title={t("panel.production")} kicker={t("pillar.productionTag")} icon="rice">
        <div class="stat-grid">
          <Stat
            label={t("prod.harvest")}
            value={formatTonne(own())}
            hint={t("prod.external")}
            icon="rice"
          />
          <Stat
            label={t("prod.selfSufficiency")}
            value={formatPercent(selfSufficiency())}
            tone={selfSufficiency() >= 40 ? "good" : "warn"}
            icon="gauge"
          />
          <Stat
            label={t("prod.stock")}
            value={formatTonne(production().riceInventory)}
            tone={production().riceInventory > 60 ? "good" : "warn"}
            icon="warehouse"
          />
          <Stat
            label={t("prod.demand")}
            value={formatTonne(last()?.totalDemand ?? 0)}
            icon="users"
          />
        </div>
        <div class="supply-mix">
          <span class="muted">{t("pillar.supplyMix")}</span>
          <div class="supply-mix-bar">
            <span class="mix-self" style={{ width: `${selfSufficiency()}%` }} />
            <span class="mix-private" style={{ width: `${100 - selfSufficiency()}%` }} />
          </div>
          <div class="supply-mix-legend">
            <span>
              <i class="dot dot-self" /> {t("pillar.state")} {Math.round(selfSufficiency())}%
            </span>
            <span>
              <i class="dot dot-private" /> {t("pillar.private")}{" "}
              {Math.round(100 - selfSufficiency())}%
            </span>
          </div>
        </div>
      </Panel>

      <Panel title={t("pillar.production")} kicker={t("action.invest")} icon="factory">
        <SectionHeading title={t("prod.hydro")} hint={t("prod.droughtHelp")} />
        <div class="line-stats">
          <span>{t("prod.unitsValue", { count: production().hydroPaddies })}</span>
          <Badge tone={market().drought > 0.6 ? "bad" : "good"}>
            {t("prod.drought")}: {formatPercent(market().drought * 100)}
          </Badge>
        </div>
        <div class="line-stats">
          <span>{t("prod.unitsValue", { count: production().mechanizedPaddies })}</span>
          <Badge tone="gold">
            {t("prod.irrigation")}: {production().irrigationLevel}
          </Badge>
        </div>
        <div class="market-grid">
          <Stat
            label={t("prod.fertilizer")}
            value={formatPrice(market().fertilizerPrice)}
            icon="leaf"
          />
          <Stat label={t("prod.fuel")} value={formatPrice(market().fuelPrice)} icon="truck" />
          <Stat label={t("prod.exchange")} value={market().exchangeRate.toFixed(2)} icon="scale" />
          <Stat
            label={t("prod.costPerTonne")}
            value={formatPrice(productionCostPerTonne(market(), production().rndLevel))}
            icon="coins"
          />
        </div>
      </Panel>

      <Panel title={t("action.invest")} kicker={t("panel.productionDesc")} icon="spark">
        <div class="action-list">
          <For each={investments}>
            {(item) => (
              <div class="action-card">
                <div class="action-card-main">
                  <span class="action-icon">
                    <Icon name={item.icon} size={18} />
                  </span>
                  <div>
                    <strong>{t(item.label)}</strong>
                    <p>{t(item.desc)}</p>
                  </div>
                </div>
                <div class="action-cost">
                  <span>{formatBillion(investmentCost(state(), item.kind))}</span>
                  <ActionButton size="sm" variant="gold" onClick={() => actions.invest(item.kind)}>
                    {t("action.invest")}
                  </ActionButton>
                </div>
              </div>
            )}
          </For>
          <div class="action-card">
            <div class="action-card-main">
              <span class="action-icon">
                <Icon name="warehouse" size={18} />
              </span>
              <div>
                <strong>{t("action.importRice")}</strong>
                <p>{t("action.importRiceDesc")}</p>
              </div>
            </div>
            <div class="action-cost">
              <span>{formatBillion(100 * market().ricePrice * 1.03)}</span>
              <ActionButton size="sm" variant="primary" onClick={() => actions.importRice()}>
                {t("action.import")}
              </ActionButton>
            </div>
          </div>
        </div>
      </Panel>

      <Panel title={t("prod.demand")} kicker={t("overview.situation")} icon="users">
        <div class="meter-block">
          <div class="meter-row">
            <span>{t("hud.reliability")}</span>
            <strong>{formatPercent(state().metrics.reliability)}</strong>
          </div>
          <Bar
            value={state().metrics.reliability}
            tone={state().metrics.reliability >= 95 ? "good" : "warn"}
          />
        </div>
        <div class="meter-block">
          <div class="meter-row">
            <span>{t("pillar.deficit")}</span>
            <strong>
              {last()?.shortage && last()!.shortage > 0.5
                ? formatTonne(last()!.shortage)
                : t("pillar.zero")}
            </strong>
          </div>
          <Bar value={Math.min(100, (last()?.shortage ?? 0) * 2)} tone="bad" />
        </div>
      </Panel>
    </div>
  );
};
