import { For, Show } from "solid-js";
import type { JSX } from "@solidjs/web";
import { useGame } from "../game-context";
import { Badge, Bar, Panel, Stat } from "../components/base";
import { Icon } from "../components/icons";
import { EmptyState } from "../components/empty-state";
import { RevenueCostChart } from "../components/charts";
import {
  formatBillion,
  formatEnergy,
  formatPercent,
  formatPrice,
  formatSignedBillion,
} from "~/state/format";
import { recoveryOf } from "~/domain";

export const FinancePanel = (): JSX.Element => {
  const { store } = useGame();
  const state = store.state;
  const rows = () => state().finance.monthlyHistory.slice(-12).toReversed();
  const recovery = () => recoveryOf(state().finance, state().clock.year, state().policy);
  const last = () => state().finance.monthlyHistory[state().finance.monthlyHistory.length - 1];

  return (
    <div class="stack-lg">
      <Panel title="Sổ tài chính" kicker="Doanh thu và chi phí" icon="tabler:report-money">
        <div class="grid grid-cols-2 gap-3 lg:grid-cols-[repeat(auto-fit,minmax(180px,1fr))]">
          <Stat
            label="Ngân quỹ"
            value={formatBillion(state().finance.cash)}
            hint="Thanh khoản cuối tháng"
            tone="gold"
          />
          <Stat
            label="Dư nợ"
            value={formatBillion(state().finance.debt)}
            hint={`Trần ${formatBillion(state().finance.debtLimit)}`}
            tone={state().finance.debt > 80_000 ? "bad" : "warn"}
          />
          <Stat
            label="Lỗ lũy kế"
            value={
              state().finance.accumulatedLoss === 0
                ? "Chưa phát sinh"
                : formatBillion(state().finance.accumulatedLoss)
            }
            hint="Mục tiêu cấu trúc 5 năm"
            tone={state().finance.accumulatedLoss > 0 ? "bad" : "neutral"}
          />
          <Show when={recovery().eligibleLoss > 0}>
            <Stat
              label="Thu hồi N-2 tháng"
              value={formatBillion(recovery().monthlyCredit)}
              hint={`Năm kiểm toán ${recovery().eligibleYear}`}
              tone="good"
            />
          </Show>
        </div>
        <Show
          when={last() !== undefined}
          fallback={
            <EmptyState
              title="Chưa có sổ tháng"
              body="Biểu đồ doanh thu, chi phí và bảng phân rã sẽ có dữ liệu sau tháng đầu tiên."
            />
          }
        >
          <RevenueCostChart rows={state().finance.monthlyHistory} />
          <div class="breakdown-grid">
            <div class="breakdown-card">
              <div class="breakdown-head">
                <span>Doanh thu tháng gần nhất</span>
                <strong>
                  {formatBillion((last()?.revenueElectricity ?? 0) + (last()?.revenueOther ?? 0))}
                </strong>
              </div>
              <div class="breakdown-row">
                <span>Doanh thu điện</span>
                <strong>{formatBillion(last()?.revenueElectricity ?? 0)}</strong>
              </div>
              <div class="breakdown-row">
                <span>Doanh thu khác</span>
                <strong>{formatBillion(last()?.revenueOther ?? 0)}</strong>
              </div>
            </div>
            <div class="breakdown-card">
              <div class="breakdown-head">
                <span>Chi phí tháng gần nhất</span>
                <strong>
                  {formatBillion((last()?.costSupply ?? 0) + (last()?.costManagement ?? 0))}
                </strong>
              </div>
              <div class="breakdown-row">
                <span>Chi phí trong cung ứng điện</span>
                <strong>{formatBillion(last()?.costSupply ?? 0)}</strong>
              </div>
              <div class="breakdown-row">
                <span>Chi phí quản lý</span>
                <strong>{formatBillion(last()?.costManagement ?? 0)}</strong>
              </div>
            </div>
          </div>
        </Show>
      </Panel>

      <Panel title="Báo cáo tháng" kicker="Mười hai tháng gần nhất" icon="tabler:file-analytics">
        <Show
          when={rows().length > 0}
          fallback={
            <EmptyState
              title="Chưa có sổ tháng"
              body="Bảng điện bán, giá bình quân và lãi/lỗ sẽ xuất hiện sau tháng đầu tiên."
            />
          }
        >
          <div class="table-scroll">
            <table class="data-table">
              <thead>
                <tr>
                  <th scope="col">Tháng</th>
                  <th scope="col">Điện bán</th>
                  <th scope="col">Giá bình quân</th>
                  <th scope="col">Doanh thu</th>
                  <th scope="col">Chi phí</th>
                  <th scope="col">Lãi/lỗ</th>
                  <th scope="col">Nợ</th>
                </tr>
              </thead>
              <tbody>
                <For each={rows()}>
                  {(row) => (
                    <tr>
                      <td>{`T${row.month}/${row.year}`}</td>
                      <td>{formatEnergy(row.energySoldMillionKwh)}</td>
                      <td>{formatPrice(row.averageRetailTariff)}</td>
                      <td>{formatBillion(row.revenueTotal)}</td>
                      <td>{formatBillion(row.costTotal)}</td>
                      <td data-tone={row.netResult >= 0 ? "good" : "bad"}>
                        {formatSignedBillion(row.netResult)}
                      </td>
                      <td>{formatBillion(row.debt)}</td>
                    </tr>
                  )}
                </For>
              </tbody>
            </table>
          </div>
        </Show>
      </Panel>

      <Panel title="Kiểm toán năm" kicker="Báo cáo thường niên" icon="tabler:chart-bar">
        <Show
          when={state().finance.annualHistory.length > 0}
          fallback={
            <EmptyState
              title="Chưa có báo cáo năm"
              body="Báo cáo năm đầu tiên được chốt vào tháng 12."
            />
          }
        >
          <div class="table-scroll">
            <table class="data-table">
              <thead>
                <tr>
                  <th scope="col">Năm</th>
                  <th scope="col">Doanh thu</th>
                  <th scope="col">Chi phí</th>
                  <th scope="col">Kết quả</th>
                  <th scope="col">Nợ cuối năm</th>
                  <th scope="col">Phủ điện</th>
                  <th scope="col">Tin cậy</th>
                </tr>
              </thead>
              <tbody>
                <For each={state().finance.annualHistory}>
                  {(row) => (
                    <tr>
                      <td>{row.year}</td>
                      <td>{formatBillion(row.revenue)}</td>
                      <td>{formatBillion(row.costs)}</td>
                      <td data-tone={row.netResult >= 0 ? "good" : "bad"}>
                        {formatSignedBillion(row.netResult)}
                      </td>
                      <td>{formatBillion(row.debtEnd)}</td>
                      <td>{formatPercent(row.coverage)}</td>
                      <td>{formatPercent(row.trustAverage)}</td>
                    </tr>
                  )}
                </For>
              </tbody>
            </table>
          </div>
        </Show>
      </Panel>

      <Panel title="Cấu trúc lỗ 5 năm" kicker="Chẩn đoán nhiệm kỳ" icon="tabler:activity">
        <p class="panel-lead">
          Doanh thu bán lẻ bị giữ bởi trần giá và giá công nghiệp trợ cấp, trong khi chi phí nhiên
          liệu, truyền tải và lãi vay vẫn tăng. Vì vậy nhiệm kỳ được thiết kế để lỗ có kiểm soát,
          không phải để có lãi trước năm 2027.
        </p>
        <Show
          when={state().finance.monthlyHistory.length > 0}
          fallback={
            <EmptyState
              title="Chưa có chẩn đoán lũy kế"
              body="Doanh thu, chi phí và chênh lệch lũy kế sẽ có sau tháng đầu tiên. Tỷ lệ nợ hiện tại vẫn được theo dõi trên thanh bên."
            />
          }
        >
          <div class="stat-grid">
            <Stat
              label="Doanh thu lũy kế"
              value={formatBillion(
                state().finance.monthlyHistory.reduce((sum, row) => sum + row.revenueTotal, 0),
              )}
              tone="gold"
            />
            <Stat
              label="Chi phí lũy kế"
              value={formatBillion(
                state().finance.monthlyHistory.reduce((sum, row) => sum + row.costTotal, 0),
              )}
              tone="warn"
            />
            <Stat
              label="Chênh lệch lũy kế"
              value={formatSignedBillion(
                state().finance.monthlyHistory.reduce((sum, row) => sum + row.netResult, 0),
              )}
              tone="bad"
            />
            <Stat
              label="Tỷ lệ nợ"
              value={formatPercent((state().finance.debt / state().finance.debtLimit) * 100)}
              tone={state().finance.debt > 80_000 ? "bad" : "warn"}
            />
          </div>
          <Bar
            value={state().finance.debt}
            max={state().finance.debtLimit}
            tone="warn"
            label="Tỷ lệ nợ trên trần"
          />
        </Show>
        <div class="callout">
          <Icon icon="tabler:alert-triangle" size={16} />
          <span>
            Nợ vượt 100.000 tỷ hoặc một trong hai chỉ số niềm tin về 0% sẽ kết thúc nhiệm kỳ ngay
            lập tức.
          </span>
        </div>
        <Badge tone="dark">Chế độ phục hồi sau năm 5 mở khi hoàn tất nhiệm kỳ</Badge>
      </Panel>
    </div>
  );
};
