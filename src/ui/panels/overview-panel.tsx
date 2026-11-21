import { For, Show } from "solid-js";
import { useGame } from "../game-context";
import { Panel, Stat, Bar, Badge, cx } from "../components/base";
import { Icon, type IconName } from "../components/icons";
import { t } from "../localization";
import { formatBillion, formatPercent, formatTonne, actLabel } from "~/state/format";
import { ARCHITECT_DEBT_MAX, recoveryOf } from "~/domain";
import { projectFinance } from "~/state/selectors";

interface Goal {
  readonly label: string;
  readonly done: boolean;
  readonly detail: string;
}

const pillar = (
  name: string,
  tag: string,
  icon: IconName,
  value: number,
  detail: string,
  tone: "good" | "warn" | "bad" | "green" | "gold",
) => (
  <div class="pillar-card" data-tone={tone}>
    <div class="pillar-top">
      <span class="pillar-icon">
        <Icon name={icon} size={18} />
      </span>
      <div>
        <strong>{name}</strong>
        <span>{tag}</span>
      </div>
      <Badge tone={tone === "good" || tone === "green" ? "good" : tone === "bad" ? "bad" : "warn"}>
        {Math.round(value)}%
      </Badge>
    </div>
    <Bar value={value} tone={tone} label={name} />
    <p class="pillar-detail">{detail}</p>
  </div>
);

export const OverviewPanel = (): import("@solidjs/web").JSX.Element => {
  const { store } = useGame();
  const state = store.state;
  const last = () => state().finance.monthlyHistory[state().finance.monthlyHistory.length - 1];
  const projection = () => projectFinance(state());
  const recovery = () => recoveryOf(state());
  const goals = (): readonly Goal[] => {
    const current = state();
    return [
      {
        label: t("overview.goalCoverage"),
        done:
          current.infrastructure.coverage >= 100 && current.infrastructure.remoteCoverage >= 100,
        detail: `${formatPercent(current.infrastructure.coverage)} / ${formatPercent(current.infrastructure.remoteCoverage)}`,
      },
      {
        label: t("overview.goalDebt"),
        done: current.finance.debt <= ARCHITECT_DEBT_MAX,
        detail: formatBillion(current.finance.debt),
      },
      {
        label: t("overview.goalReform"),
        done: current.policy.n2Enabled && current.policy.dppa && current.policy.vrem,
        detail: `${current.policy.n2Enabled ? t("policy.enabled") : t("policy.notEnabled")} · ${current.policy.vrem ? "VREM" : "—"}`,
      },
      {
        label: t("overview.goalTrust"),
        done: current.metrics.trust >= 55 && current.metrics.satisfaction >= 55,
        detail: `${formatPercent(current.metrics.trust)} / ${formatPercent(current.metrics.satisfaction)}`,
      },
    ];
  };
  return (
    <div class="stack-lg">
      <Panel title={t("overview.situation")} kicker={actLabel(state().act)} icon="chart">
        <div class="overview-hero">
          <div class="overview-copy">
            <p class="eyebrow">
              {t("hud.date", { month: state().clock.month, year: state().clock.year })}
            </p>
            <h3>{t("overview.supplyChain")}</h3>
            <p class="muted">
              {t("app.tagline")} {t("overview.guide1")}
            </p>
            <div class="hero-chips">
              <Badge tone="gold">{t("pillar.production")}</Badge>
              <Badge tone="dark">{t("pillar.infrastructure")}</Badge>
              <Badge tone="good">{t("pillar.retail")}</Badge>
            </div>
          </div>
          <div class="overview-score">
            <span class="score-label">{t("policy.debateScore")}</span>
            <strong>{Math.round(state().metrics.debateScore)}</strong>
            <Bar value={state().metrics.debateScore} tone="gold" label={t("policy.debateScore")} />
          </div>
        </div>
        <div class="stat-grid">
          <Stat
            label={t("overview.demand")}
            value={formatTonne(last()?.totalDemand ?? 0)}
            hint={t("overview.shortage")}
            icon="rice"
          />
          <Stat
            label={t("overview.reliability")}
            value={formatPercent(state().metrics.reliability)}
            tone={
              state().metrics.reliability >= 95
                ? "good"
                : state().metrics.reliability >= 80
                  ? "warn"
                  : "bad"
            }
            icon="shield"
          />
          <Stat
            label={t("overview.profit")}
            value={last() === undefined ? "—" : formatBillion(last()?.netResult ?? 0)}
            tone={(last()?.netResult ?? 0) >= 0 ? "good" : "bad"}
            icon="wallet"
          />
          <Stat
            label={t("finance.runway")}
            value={
              projection().runwayMonths >= 99
                ? "—"
                : t("finance.runwayValue", { months: Math.round(projection().runwayMonths) })
            }
            tone={
              projection().runwayMonths >= 12
                ? "good"
                : projection().runwayMonths >= 6
                  ? "warn"
                  : "bad"
            }
            icon="clock"
          />
        </div>
      </Panel>

      <Panel title={t("overview.pillars")} kicker={t("hud.status")} icon="landmark">
        <div class="pillar-grid">
          {pillar(
            t("pillar.production"),
            t("pillar.productionTag"),
            "rice",
            Math.min(
              100,
              (last()?.reliability ?? 100) * 0.55 +
                Math.min(100, state().production.riceInventory) * 0.1,
            ),
            `${formatTonne(last()?.ownProduction ?? 0)} · ${t("pillar.stock")}: ${formatTonne(state().production.riceInventory)}`,
            "good",
          )}
          {pillar(
            t("pillar.infrastructure"),
            t("pillar.infrastructureTag"),
            "road",
            state().infrastructure.coverage,
            `${t("infra.remote")}: ${formatPercent(state().infrastructure.remoteCoverage)} · ${t("pillar.fleet")}: ${state().infrastructure.fleet}`,
            state().infrastructure.coverage >= 90
              ? "good"
              : state().infrastructure.coverage >= 70
                ? "warn"
                : "bad",
          )}
          {pillar(
            t("pillar.retail"),
            t("pillar.retailTag"),
            "scale",
            Math.max(
              0,
              100 -
                Math.abs(recovery().monthlyCredit > 0 ? 20 : 35) -
                state().metrics.inflation * 2,
            ),
            `${t("pillar.tariff")}: ${state()
              .tariffs.tiers.reduce(
                (sum, value, index) => sum + value * [0.45, 0.28, 0.18, 0.09][index]!,
                0,
              )
              .toFixed(2)} · ${t("pillar.ceiling")}: ${state().tariffs.ceiling}`,
            "gold",
          )}
        </div>
      </Panel>

      <Panel title={t("overview.goals")} kicker={t("hud.status")} icon="shield">
        <div class="goal-list">
          <For each={goals()}>
            {(goal) => (
              <div class="goal" data-done={goal.done}>
                <span class={cx("goal-check", goal.done && "is-done")}>
                  <Icon name={goal.done ? "check" : "clock"} size={15} />
                </span>
                <div>
                  <strong>{goal.label}</strong>
                  <span>{goal.detail}</span>
                </div>
              </div>
            )}
          </For>
        </div>
      </Panel>

      <Panel title={t("overview.guide")} kicker={t("hud.tutorial")} icon="book">
        <ul class="guide-list">
          <li>{t("overview.guide1")}</li>
          <li>{t("overview.guide2")}</li>
          <li>{t("overview.guide3")}</li>
          <li>{t("overview.guide4")}</li>
        </ul>
        <Show when={recovery().eligibleLoss > 0}>
          <div class="callout">
            <Icon name="info" size={16} />
            <span>
              {t("finance.auditYear", { year: recovery().eligibleYear })}:{" "}
              {formatBillion(recovery().eligibleLoss)} · {t("finance.monthlyCredit")}:{" "}
              {formatBillion(recovery().monthlyCredit)}
            </span>
          </div>
        </Show>
      </Panel>
    </div>
  );
};
