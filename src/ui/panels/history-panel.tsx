import { createSignal } from "solid-js";
import type { JSX } from "@solidjs/web";
import { useGame } from "../game-context";
import { ActionButton, Divider, Panel, Stat } from "../components/base";
import { t } from "../localization";
import { formatBillion, formatDate, formatPercent, formatPrice } from "~/state/format";

export const HistoryPanel = (): JSX.Element => {
  const { store } = useGame();
  const state = store.state;
  const [expanded, setExpanded] = createSignal(false);

  const rows = () => {
    const history = state().finance.monthlyHistory;

    return expanded() ? history.toReversed() : history.toReversed().slice(0, 10);
  };

  const totalNet = () =>
    state().finance.monthlyHistory.reduce((sum, row) => sum + row.netResult, 0);

  return (
    <div class="stack-lg">
      <Panel title={t("history.title")} kicker={t("panel.historyDesc")} icon="lucide:book-open">
        <div class="stat-grid">
          <Stat
            label={t("finance.revenue")}
            value={formatBillion(
              state().finance.monthlyHistory.reduce((sum, row) => sum + row.revenueTotal, 0),
            )}
            icon="lucide:wallet"
          />
          <Stat
            label={t("finance.net")}
            value={formatBillion(totalNet())}
            tone={totalNet() >= 0 ? "good" : "bad"}
            icon="lucide:chart-column"
          />
          <Stat
            label={t("hud.debt")}
            value={formatBillion(state().finance.debt)}
            icon="lucide:landmark"
          />
          <Stat
            label={t("panel.history")}
            value={t("chart.months", { count: state().finance.monthlyHistory.length })}
            icon="lucide:calendar"
          />
        </div>
        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>{t("history.month")}</th>
                <th>{t("history.revenue")}</th>
                <th>{t("history.net")}</th>
                <th>{t("history.debt")}</th>
                <th>{t("history.tariff")}</th>
                <th>{t("history.rice")}</th>
                <th>{t("history.reliability")}</th>
              </tr>
            </thead>
            <tbody>
              {rows().map((row) => (
                <tr>
                  <td>{formatDate(row.year, row.month)}</td>
                  <td>{formatBillion(row.revenueTotal)}</td>
                  <td class={row.netResult < 0 ? "negative" : undefined}>
                    {formatBillion(row.netResult)}
                  </td>
                  <td>{formatBillion(row.debt)}</td>
                  <td>{formatPrice(row.tariffAverage)}</td>
                  <td>{formatPrice(row.ricePrice)}</td>
                  <td>{formatPercent(row.reliability)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <ActionButton size="sm" variant="ghost" onClick={() => setExpanded(!expanded())}>
          {expanded() ? t("history.showLess") : t("history.showMore")}
        </ActionButton>
      </Panel>

      <Panel
        title={t("panel.history")}
        kicker={t("finance.reportYear", { year: state().clock.year })}
        icon="lucide:calendar"
      >
        {state().finance.annualHistory.length === 0 ? (
          <p class="muted">{t("finance.noHistory")}</p>
        ) : (
          state().finance.annualHistory.map((report) => (
            <div class="annual-card">
              <div class="annual-head">
                <strong>{report.year}</strong>
                <span class={report.netResult < 0 ? "negative" : undefined}>
                  {formatBillion(report.netResult)}
                </span>
              </div>
              <Divider />
              <div class="annual-grid">
                <span>
                  {t("finance.reportRevenue")}: {formatBillion(report.revenue)}
                </span>
                <span>
                  {t("finance.reportDebt")}: {formatBillion(report.debtEnd)}
                </span>
                <span>
                  {t("finance.reportReliability")}: {formatPercent(report.reliability)}
                </span>
                <span>
                  {t("finance.reportInflation")}: {formatPercent(report.inflationAverage)}
                </span>
                <span>
                  {t("finance.reportTrust")}: {formatPercent(report.trustAverage)}
                </span>
                <span>
                  {t("hud.coverage")}: {formatPercent(report.coverage)}
                </span>
              </div>
            </div>
          ))
        )}
      </Panel>
    </div>
  );
};
