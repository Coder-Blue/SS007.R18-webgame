import { For, Show } from "solid-js";
import type { JSX } from "@solidjs/web";
import { useGame } from "../game-context";
import { ActionButton, Badge, Bar, Divider, Panel, Stat } from "../components/base";
import { LineChart, type Series } from "../components/charts";
import { Icon } from "../components/icons";
import { t } from "../localization";
import { formatBillion, formatDate, formatPercent, formatPrice } from "~/state/format";
import { recoveryOf } from "~/domain";
import { projectFinance } from "~/state/selectors";

export const FinancePanel = (): JSX.Element => {
  const { store, actions } = useGame();
  const state = store.state;
  const history = () => state().finance.monthlyHistory.slice(-18);
  const last = () => state().finance.monthlyHistory[state().finance.monthlyHistory.length - 1];
  const recovery = () => recoveryOf(state());
  const projection = () => projectFinance(state());

  const series = (): readonly Series[] => [
    {
      label: t("finance.revenue"),
      color: "#2f7d5b",
      values: history().map((row) => row.revenueTotal),
    },
    { label: t("finance.costs"), color: "#b34833", values: history().map((row) => row.costTotal) },
    { label: t("finance.net"), color: "#d8a94b", values: history().map((row) => row.netResult) },
  ];

  const debtSeries = (): readonly Series[] => [
    { label: t("finance.debt"), color: "#5b4b8a", values: history().map((row) => row.debt) },
    {
      label: t("finance.legendTariff"),
      color: "#2f7d5b",
      values: history().map((row) => row.tariffAverage * 1000),
    },
  ];

  return (
    <div class="stack-lg">
      <Panel
        title={t("finance.pnl")}
        kicker={formatDate(state().clock.year, state().clock.month)}
        icon="wallet"
      >
        <div class="stat-grid">
          <Stat
            label={t("finance.revenue")}
            value={formatBillion(last()?.revenueTotal ?? 0)}
            tone="good"
            icon="trend-up"
          />
          <Stat
            label={t("finance.costs")}
            value={formatBillion(last()?.costTotal ?? 0)}
            tone="bad"
            icon="trend-down"
          />
          <Stat
            label={t("finance.net")}
            value={formatBillion(last()?.netResult ?? 0)}
            tone={(last()?.netResult ?? 0) >= 0 ? "good" : "bad"}
            icon="chart"
          />
          <Stat
            label={t("finance.debt")}
            value={formatBillion(state().finance.debt)}
            tone={projection().isDanger ? "bad" : "warn"}
            icon="landmark"
          />
        </div>
        <div class="report-split">
          <div>
            <h4>{t("finance.revenue")}</h4>
            <div class="report-line">
              <span>{t("finance.revenueHousehold")}</span>
              <strong>{formatBillion(last()?.revenueHousehold ?? 0)}</strong>
            </div>
            <div class="report-line">
              <span>{t("finance.revenueWorkshop")}</span>
              <strong>{formatBillion(last()?.revenueWorkshop ?? 0)}</strong>
            </div>
            <div class="report-line">
              <span>{t("finance.revenueRecovery")}</span>
              <strong>{formatBillion(last()?.revenueRecovery ?? 0)}</strong>
            </div>
          </div>
          <div>
            <h4>{t("finance.costs")}</h4>
            <div class="report-line">
              <span>{t("finance.costProduction")}</span>
              <strong>{formatBillion(last()?.costProduction ?? 0)}</strong>
            </div>
            <div class="report-line">
              <span>{t("finance.costProcurement")}</span>
              <strong>{formatBillion(last()?.costProcurement ?? 0)}</strong>
            </div>
            <div class="report-line">
              <span>{t("finance.costRoads")}</span>
              <strong>{formatBillion(last()?.costRoads ?? 0)}</strong>
            </div>
            <div class="report-line">
              <span>{t("finance.costFleet")}</span>
              <strong>{formatBillion(last()?.costFleet ?? 0)}</strong>
            </div>
            <div class="report-line">
              <span>{t("finance.costStaff")}</span>
              <strong>{formatBillion(last()?.costStaff ?? 0)}</strong>
            </div>
            <div class="report-line">
              <span>{t("finance.costInterest")}</span>
              <strong>{formatBillion(last()?.costInterest ?? 0)}</strong>
            </div>
          </div>
        </div>
        <Divider />
        <div class="meter-block">
          <div class="meter-row">
            <span>{t("finance.debtRatio")}</span>
            <strong>{formatPercent(projection().debtRatio * 100)}</strong>
          </div>
          <Bar
            value={projection().debtRatio * 100}
            tone={projection().isDanger ? "bad" : "warn"}
            label={t("finance.debtRatio")}
          />
        </div>
      </Panel>

      <Panel
        title={t("finance.chart")}
        kicker={t("chart.months", { count: history().length })}
        icon="chart"
      >
        <Show
          when={history().length > 0}
          fallback={
            <div class="empty-state">
              <Icon name="chart" size={24} />
              <span>{t("finance.noHistory")}</span>
            </div>
          }
        >
          <LineChart series={series()} ariaLabel={t("finance.chart")} />
          <LineChart series={debtSeries()} ariaLabel={t("finance.legendDebt")} grid={2} />
        </Show>
      </Panel>

      <Panel
        title={t("policy.n2")}
        kicker={t("finance.auditYear", { year: recovery().eligibleYear })}
        icon="landmark"
      >
        <div class="stat-grid">
          <Stat
            label={t("finance.eligible")}
            value={formatBillion(recovery().eligibleLoss)}
            tone={recovery().eligibleLoss > 0 ? "warn" : "neutral"}
            icon="scale"
          />
          <Stat
            label={t("finance.monthlyCredit")}
            value={formatBillion(recovery().monthlyCredit)}
            tone={recovery().monthlyCredit > 0 ? "good" : "neutral"}
            icon="coins"
          />
          <Stat
            label={t("finance.recovered")}
            value={formatBillion(state().finance.recoveredTotal)}
            icon="check"
          />
          <Stat
            label={t("finance.remaining")}
            value={formatBillion(recovery().remaining)}
            icon="clock"
          />
        </div>
        <Badge tone={state().policy.n2Enabled ? "good" : "warn"}>
          {state().policy.n2Enabled ? t("policy.enabled") : t("policy.notEnabled")}
        </Badge>
        <p class="muted">
          {recovery().eligibleYear >= 2022
            ? t("finance.auditYear", { year: recovery().eligibleYear })
            : t("finance.auditPending")}{" "}
          · {t("policy.n2Rate")}: {formatPercent(state().policy.n2Rate * 100)}
        </p>
      </Panel>

      <Panel title={t("finance.projection")} kicker={t("hud.status")} icon="gauge">
        <div class="stat-grid">
          <Stat
            label={t("finance.fixedCost")}
            value={formatBillion(projection().monthlyFixed)}
            icon="coins"
          />
          <Stat
            label={t("finance.runway")}
            value={
              projection().runwayMonths >= 99
                ? "—"
                : t("finance.runwayValue", { months: Math.round(projection().runwayMonths) })
            }
            tone={projection().isDanger ? "bad" : "good"}
            icon="clock"
          />
          <Stat
            label={t("finance.debt")}
            value={formatBillion(state().finance.debt)}
            hint={`${t("hud.debtLimit")} ${formatBillion(state().finance.debtLimit)}`}
            icon="landmark"
          />
          <Stat
            label={t("finance.accumulated")}
            value={formatBillion(state().finance.accumulatedLoss)}
            tone="bad"
            icon="trend-down"
          />
        </div>
        <div class="inline-actions">
          <ActionButton
            variant="danger"
            size="sm"
            icon="shield"
            disabled={state().policy.bailoutUsed}
            onClick={() => actions.requestBailout()}
          >
            {state().policy.bailoutUsed ? t("policy.bailoutUsed") : t("action.bailout")}
          </ActionButton>
          <span class="muted">{t("action.bailoutDesc")}</span>
        </div>
      </Panel>

      <Panel
        title={t("finance.reportYear", { year: state().clock.year })}
        kicker={t("panel.history")}
        icon="book"
      >
        <Show
          when={state().finance.annualHistory.length > 0}
          fallback={
            <div class="empty-state">
              <span>{t("finance.noHistory")}</span>
            </div>
          }
        >
          <div class="table-wrap">
            <table class="data-table">
              <thead>
                <tr>
                  <th>{t("finance.year")}</th>
                  <th>{t("finance.reportRevenue")}</th>
                  <th>{t("finance.reportNet")}</th>
                  <th>{t("finance.reportDebt")}</th>
                  <th>{t("finance.reportReliability")}</th>
                </tr>
              </thead>
              <tbody>
                <For each={state().finance.annualHistory}>
                  {(report) => (
                    <tr>
                      <td>{report.year}</td>
                      <td>{formatBillion(report.revenue)}</td>
                      <td class={report.netResult < 0 ? "negative" : undefined}>
                        {formatBillion(report.netResult)}
                      </td>
                      <td>{formatBillion(report.debtEnd)}</td>
                      <td>{formatPercent(report.reliability)}</td>
                    </tr>
                  )}
                </For>
              </tbody>
            </table>
          </div>
        </Show>
        <p class="muted">
          {t("finance.legendRice")}: {formatPrice(state().market.ricePrice)}
        </p>
      </Panel>
    </div>
  );
};
