import { createSignal } from "solid-js";
import type { JSX } from "@solidjs/web";
import { useGame } from "../game-context";
import { ActionButton, Divider, Panel, Stat } from "../components/base";
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
      <Panel
        title="Nhật ký điều hành"
        kicker="Nhật ký các tháng và báo cáo năm."
        icon="lucide:book-open"
      >
        <div class="stat-grid">
          <Stat
            label="Doanh thu"
            value={formatBillion(
              state().finance.monthlyHistory.reduce((sum, row) => sum + row.revenueTotal, 0),
            )}
            icon="lucide:wallet"
          />
          <Stat
            label="Kết quả tháng"
            value={formatBillion(totalNet())}
            tone={totalNet() >= 0 ? "good" : "bad"}
            icon="lucide:chart-column"
          />
          <Stat label="Dư nợ" value={formatBillion(state().finance.debt)} icon="lucide:landmark" />
          <Stat
            label="Lịch sử"
            value={`${state().finance.monthlyHistory.length} tháng gần nhất`}
            icon="lucide:calendar"
          />
        </div>
        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>Tháng</th>
                <th>Doanh thu</th>
                <th>Kết quả</th>
                <th>Dư nợ</th>
                <th>Giá BQ</th>
                <th>Giá gạo</th>
                <th>Ổn định</th>
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
          {expanded() ? "Thu gọn" : "Xem thêm"}
        </ActionButton>
      </Panel>

      <Panel title="Lịch sử" kicker={`Báo cáo năm ${state().clock.year}`} icon="lucide:calendar">
        {state().finance.annualHistory.length === 0 ? (
          <p class="muted">Chưa có dữ liệu. Hãy kết thúc tháng đầu tiên.</p>
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
                <span>Doanh thu năm: {formatBillion(report.revenue)}</span>
                <span>Nợ cuối năm: {formatBillion(report.debtEnd)}</span>
                <span>Độ ổn định TB: {formatPercent(report.reliability)}</span>
                <span>Lạm phát TB: {formatPercent(report.inflationAverage)}</span>
                <span>Tín nhiệm TB: {formatPercent(report.trustAverage)}</span>
                <span>Bao phủ đường: {formatPercent(report.coverage)}</span>
              </div>
            </div>
          ))
        )}
      </Panel>
    </div>
  );
};
