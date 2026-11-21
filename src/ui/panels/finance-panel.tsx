import { For, Show } from "solid-js";
import type { JSX } from "@solidjs/web";
import { useGame } from "../game-context";
import { ActionButton, Badge, Bar, Divider, Panel, Stat } from "../components/base";
import { LineChart, type Series } from "../components/charts";
import { Icon } from "../components/icons";
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
      label: "Doanh thu",
      color: "#2f7d5b",
      values: history().map((row) => row.revenueTotal),
    },
    { label: "Chi phí", color: "#b34833", values: history().map((row) => row.costTotal) },
    { label: "Kết quả tháng", color: "#d8a94b", values: history().map((row) => row.netResult) },
  ];

  const debtSeries = (): readonly Series[] => [
    { label: "Dư nợ cuối tháng", color: "#5b4b8a", values: history().map((row) => row.debt) },
    {
      label: "Giá bình quân",
      color: "#2f7d5b",
      values: history().map((row) => row.tariffAverage * 1000),
    },
  ];

  return (
    <div class="stack-lg">
      <Panel
        title="Báo cáo lãi lỗ tháng"
        kicker={formatDate(state().clock.year, state().clock.month)}
        icon="lucide:wallet"
      >
        <div class="stat-grid">
          <Stat
            label="Doanh thu"
            value={formatBillion(last()?.revenueTotal ?? 0)}
            tone="good"
            icon="lucide:trending-up"
          />
          <Stat
            label="Chi phí"
            value={formatBillion(last()?.costTotal ?? 0)}
            tone="bad"
            icon="lucide:trending-down"
          />
          <Stat
            label="Kết quả tháng"
            value={formatBillion(last()?.netResult ?? 0)}
            tone={(last()?.netResult ?? 0) >= 0 ? "good" : "bad"}
            icon="lucide:chart-column"
          />
          <Stat
            label="Dư nợ cuối tháng"
            value={formatBillion(state().finance.debt)}
            tone={projection().isDanger ? "bad" : "warn"}
            icon="lucide:landmark"
          />
        </div>
        <div class="report-split">
          <div>
            <h4>Doanh thu</h4>
            <div class="report-line">
              <span>Bán lẻ hộ dân</span>
              <strong>{formatBillion(last()?.revenueHousehold ?? 0)}</strong>
            </div>
            <div class="report-line">
              <span>Bán lẻ xưởng</span>
              <strong>{formatBillion(last()?.revenueWorkshop ?? 0)}</strong>
            </div>
            <div class="report-line">
              <span>Thu hồi N-2</span>
              <strong>{formatBillion(last()?.revenueRecovery ?? 0)}</strong>
            </div>
          </div>
          <div>
            <h4>Chi phí</h4>
            <div class="report-line">
              <span>Sản xuất</span>
              <strong>{formatBillion(last()?.costProduction ?? 0)}</strong>
            </div>
            <div class="report-line">
              <span>Mua gạo ngoài</span>
              <strong>{formatBillion(last()?.costProcurement ?? 0)}</strong>
            </div>
            <div class="report-line">
              <span>Bảo trì đường</span>
              <strong>{formatBillion(last()?.costRoads ?? 0)}</strong>
            </div>
            <div class="report-line">
              <span>Vận chuyển</span>
              <strong>{formatBillion(last()?.costFleet ?? 0)}</strong>
            </div>
            <div class="report-line">
              <span>Nhân sự</span>
              <strong>{formatBillion(last()?.costStaff ?? 0)}</strong>
            </div>
            <div class="report-line">
              <span>Lãi vay</span>
              <strong>{formatBillion(last()?.costInterest ?? 0)}</strong>
            </div>
          </div>
        </div>
        <Divider />
        <div class="meter-block">
          <div class="meter-row">
            <span>Tỷ lệ nợ / trần</span>
            <strong>{formatPercent(projection().debtRatio * 100)}</strong>
          </div>
          <Bar
            value={projection().debtRatio * 100}
            tone={projection().isDanger ? "bad" : "warn"}
            label="Tỷ lệ nợ / trần"
          />
        </div>
      </Panel>

      <Panel
        title="Lịch sử tài chính"
        kicker={`${history().length} tháng gần nhất`}
        icon="lucide:chart-column"
      >
        <Show
          when={history().length > 0}
          fallback={
            <div class="empty-state">
              <Icon icon="lucide:chart-column" size={24} />
              <span>Chưa có dữ liệu. Hãy kết thúc tháng đầu tiên.</span>
            </div>
          }
        >
          <LineChart series={series()} ariaLabel="Lịch sử tài chính" />
          <LineChart series={debtSeries()} ariaLabel="Dư nợ" grid={2} />
        </Show>
      </Panel>

      <Panel
        title="Thu hồi chi phí N-2"
        kicker={`Năm kiểm toán ${recovery().eligibleYear}`}
        icon="lucide:landmark"
      >
        <div class="stat-grid">
          <Stat
            label="Lỗ N-2 đủ điều kiện"
            value={formatBillion(recovery().eligibleLoss)}
            tone={recovery().eligibleLoss > 0 ? "warn" : "neutral"}
            icon="lucide:scale"
          />
          <Stat
            label="Thu hồi tháng này"
            value={formatBillion(recovery().monthlyCredit)}
            tone={recovery().monthlyCredit > 0 ? "good" : "neutral"}
            icon="lucide:coins"
          />
          <Stat
            label="Đã thu hồi N-2"
            value={formatBillion(state().finance.recoveredTotal)}
            icon="lucide:check"
          />
          <Stat
            label="Còn lại có thể thu hồi"
            value={formatBillion(recovery().remaining)}
            icon="lucide:clock"
          />
        </div>
        <Badge tone={state().policy.n2Enabled ? "good" : "warn"}>
          {state().policy.n2Enabled ? "Đang áp dụng" : "Chưa áp dụng"}
        </Badge>
        <p class="muted">
          {recovery().eligibleYear >= 2022
            ? `Năm kiểm toán ${recovery().eligibleYear}`
            : "Chưa đủ dữ liệu N-2"}
          {" · "}Tỷ lệ thu hồi: {formatPercent(state().policy.n2Rate * 100)}
        </p>
      </Panel>

      <Panel title="Dự phóng" kicker="Trạng thái làng" icon="lucide:gauge">
        <div class="stat-grid">
          <Stat
            label="Chi phí cố định tháng trước"
            value={formatBillion(projection().monthlyFixed)}
            icon="lucide:coins"
          />
          <Stat
            label="Số tháng còn lại trước trần nợ"
            value={
              projection().runwayMonths >= 99
                ? "—"
                : `${Math.round(projection().runwayMonths)} tháng`
            }
            tone={projection().isDanger ? "bad" : "good"}
            icon="lucide:clock"
          />
          <Stat
            label="Dư nợ cuối tháng"
            value={formatBillion(state().finance.debt)}
            hint={`Trần nợ ${formatBillion(state().finance.debtLimit)}`}
            icon="lucide:landmark"
          />
          <Stat
            label="Lỗ lũy kế"
            value={formatBillion(state().finance.accumulatedLoss)}
            tone="bad"
            icon="lucide:trending-down"
          />
        </div>
        <div class="inline-actions">
          <ActionButton
            variant="danger"
            size="sm"
            icon="lucide:shield"
            disabled={state().policy.bailoutUsed}
            onClick={() => actions.requestBailout()}
          >
            {state().policy.bailoutUsed ? "Đã dùng cứu trợ" : "Xin cứu trợ"}
          </ActionButton>
          <span class="muted">Giảm 8.000 tỷ nợ, đổi lại mất tín nhiệm và hài lòng.</span>
        </div>
      </Panel>

      <Panel title={`Báo cáo năm ${state().clock.year}`} kicker="Lịch sử" icon="lucide:book-open">
        <Show
          when={state().finance.annualHistory.length > 0}
          fallback={
            <div class="empty-state">
              <span>Chưa có dữ liệu. Hãy kết thúc tháng đầu tiên.</span>
            </div>
          }
        >
          <div class="table-wrap">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Năm</th>
                  <th>Doanh thu năm</th>
                  <th>Kết quả năm</th>
                  <th>Nợ cuối năm</th>
                  <th>Độ ổn định TB</th>
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
        <p class="muted">Giá gạo thị trường: {formatPrice(state().market.ricePrice)}</p>
      </Panel>
    </div>
  );
};
