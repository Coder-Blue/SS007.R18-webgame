import { For, Show } from "solid-js";
import type { JSX } from "@solidjs/web";
import { useGame } from "../game-context";
import { Bar, Panel, Stat } from "../components/base";
import { Icon } from "../components/icons";
import { EmptyState } from "../components/empty-state";
import { GenerationMix, RevenueCostChart, TrustTrendChart } from "../components/charts";
import {
  formatBillion,
  formatEnergy,
  formatPercent,
  formatSignedBillion,
  actLabel,
} from "~/state/format";
import { missionStatus, recoveryOf } from "~/domain";
import { projectFinance, totalCoverage } from "~/state/selectors";

const row = (label: string, value: number, total: number, tone: string): JSX.Element => (
  <div class="breakdown-row">
    <span class="breakdown-label">
      <span class="chart-swatch" style={{ background: tone }} />
      {label}
    </span>
    <span class="breakdown-value">{formatBillion(value)}</span>
    <span class="breakdown-share">
      {total > 0 ? `${Math.round((value / total) * 100)}%` : "0%"}
    </span>
  </div>
);

export const OverviewPanel = (): JSX.Element => {
  const { store } = useGame();
  const state = store.state;
  const last = () => state().finance.monthlyHistory[state().finance.monthlyHistory.length - 1];
  const projection = () => projectFinance(state());
  const recovery = () => recoveryOf(state().finance, state().clock.year, state().policy);
  const missions = () => missionStatus(state());
  const revenueTotal = () => (last()?.revenueElectricity ?? 0) + (last()?.revenueOther ?? 0);
  const costTotal = () => (last()?.costSupply ?? 0) + (last()?.costManagement ?? 0);

  return (
    <div class="stack-lg">
      <Panel title="Bức tranh điều hành" kicker={actLabel(state().act)} icon="lucide:gauge">
        <div class="overview-hero">
          <div class="overview-copy">
            <p class="eyebrow">{`Tháng ${state().clock.month}/${state().clock.year}`}</p>
            <h3>Một lưới điện, ba khâu, một nhiệm kỳ năm năm</h3>
            <p class="muted">
              Mua điện cạnh tranh ở thượng nguồn, giữ cân bằng MW trên lưới truyền tải và bán điện
              theo biểu giá nhà nước. Mọi lựa chọn đều đổi lấy niềm tin hoặc nợ.
            </p>
            <p class="mt-4 text-[11px] text-ink-faint">Sản xuất · Truyền tải · Phân phối</p>
          </div>
          <div class="overview-score">
            <span class="score-label">Lỗ lũy kế</span>
            <strong>{formatBillion(state().finance.accumulatedLoss)}</strong>
            <Bar
              value={state().finance.accumulatedLoss}
              max={45_000}
              tone="bad"
              label="Lỗ lũy kế"
            />
            <span class="score-hint">
              {projection().runwayMonths >= 99
                ? "Dòng tiền tháng đang dương"
                : `Còn ${Math.round(projection().runwayMonths)} tháng trước trần nợ`}
            </span>
          </div>
        </div>
        <Show
          when={last() !== undefined}
          fallback={
            <div class="mt-5 grid gap-5 border-t border-line pt-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
              <div>
                <p class="text-sm font-medium text-ink">Tháng đầu tiên chưa chốt sổ</p>
                <p class="mt-1 max-w-[52ch] text-xs leading-5 text-ink-faint">
                  Bấm Tiếp tục để chạy tháng 1. Báo cáo tháng, biểu đồ sáu tháng và cơ cấu nguồn
                  điện sẽ xuất hiện sau nhịp đầu tiên.
                </p>
              </div>
              <dl class="grid grid-cols-2 gap-x-8 gap-y-3 text-right">
                <div>
                  <dt class="text-[11px] text-ink-faint">Ngân quỹ</dt>
                  <dd class="mt-1 text-sm font-medium tabular-nums text-gold">
                    {formatBillion(state().finance.cash)}
                  </dd>
                </div>
                <div>
                  <dt class="text-[11px] text-ink-faint">Dư nợ</dt>
                  <dd class="mt-1 text-sm font-medium tabular-nums text-amber">
                    {formatBillion(state().finance.debt)}
                  </dd>
                </div>
                <div>
                  <dt class="text-[11px] text-ink-faint">Phủ điện</dt>
                  <dd class="mt-1 text-sm font-medium tabular-nums text-electric">
                    {formatPercent(totalCoverage(state()))}
                  </dd>
                </div>
                <div>
                  <dt class="text-[11px] text-ink-faint">Dự phòng</dt>
                  <dd class="mt-1 text-sm font-medium tabular-nums text-green">
                    {formatPercent(state().metrics.reserveMargin)}
                  </dd>
                </div>
              </dl>
            </div>
          }
        >
          <div class="stat-grid">
            <div class="stat" data-tone="gold">
              <span class="stat-label">Doanh thu tháng</span>
              <span class="stat-value">{formatBillion(revenueTotal())}</span>
              <span class="stat-hint">
                {`Điện: ${formatBillion(last()?.revenueElectricity ?? 0)} · Khác: ${formatBillion(last()?.revenueOther ?? 0)}`}
              </span>
            </div>
            <div class="stat" data-tone="warn">
              <span class="stat-label">Chi phí tháng</span>
              <span class="stat-value">{formatBillion(costTotal())}</span>
              <span class="stat-hint">
                {`Cung ứng: ${formatBillion(last()?.costSupply ?? 0)} · Quản lý: ${formatBillion(last()?.costManagement ?? 0)}`}
              </span>
            </div>
            <div class="stat" data-tone={(last()?.netResult ?? 0) >= 0 ? "good" : "bad"}>
              <span class="stat-label">Kết quả tháng</span>
              <span class="stat-value">{formatSignedBillion(last()?.netResult ?? 0)}</span>
              <span class="stat-hint">{`Nợ: ${formatBillion(state().finance.debt)}`}</span>
            </div>
            <div class="stat" data-tone="good">
              <span class="stat-label">Điện thương phẩm</span>
              <span class="stat-value">{formatEnergy(last()?.energySoldMillionKwh ?? 0)}</span>
              <span class="stat-hint">{`Phủ điện: ${formatPercent(totalCoverage(state()))}`}</span>
            </div>
          </div>
        </Show>
      </Panel>

      <Panel
        title="Cơ cấu doanh thu và chi phí"
        kicker="Sáu tháng gần nhất"
        icon="tabler:chart-bar"
      >
        <Show
          when={last() !== undefined}
          fallback={
            <EmptyState
              title="Chưa có sổ tháng"
              body="Biểu đồ doanh thu, chi phí và cơ cấu nguồn điện sẽ có dữ liệu sau tháng đầu tiên."
            />
          }
        >
          <RevenueCostChart rows={state().finance.monthlyHistory} />
          <div class="breakdown-grid">
            <div class="breakdown-card">
              <div class="breakdown-head">
                <span>Doanh thu</span>
                <strong>{formatBillion(revenueTotal())}</strong>
              </div>
              {row(
                "Doanh thu điện",
                last()?.revenueElectricity ?? 0,
                revenueTotal(),
                "var(--electric)",
              )}
              {row("Doanh thu khác", last()?.revenueOther ?? 0, revenueTotal(), "var(--cyan-soft)")}
            </div>
            <div class="breakdown-card">
              <div class="breakdown-head">
                <span>Chi phí</span>
                <strong>{formatBillion(costTotal())}</strong>
              </div>
              {row("Chi phí cung ứng điện", last()?.costSupply ?? 0, costTotal(), "var(--amber)")}
              {row("Chi phí quản lý", last()?.costManagement ?? 0, costTotal(), "var(--rose)")}
            </div>
          </div>
        </Show>
      </Panel>

      <div class="split-grid">
        <Panel title="Cơ cấu nguồn điện" kicker="Tháng gần nhất" icon="tabler:plug-connected">
          <Show
            when={last() !== undefined}
            fallback={
              <EmptyState
                title="Chưa có cơ cấu nguồn"
                body="Chạy tháng đầu tiên để xem tỷ trọng thủy điện, nhiệt điện, tái tạo và nhập khẩu."
              />
            }
          >
            <GenerationMix rows={state().finance.monthlyHistory} />
          </Show>
          <div class="mini-grid">
            <Stat
              label="Độ tin cậy"
              value={formatPercent(last()?.reliability ?? 100)}
              tone="good"
            />
            <Stat
              label="Dự phòng"
              value={formatPercent(last()?.reserveMargin ?? 0)}
              tone={(last()?.reserveMargin ?? 0) >= 15 ? "good" : "bad"}
            />
          </div>
        </Panel>
        <Panel title="Hai chỉ số niềm tin" kicker="Hai mươi bốn tháng" icon="tabler:users">
          <Show
            when={last() !== undefined}
            fallback={
              <EmptyState
                title="Chưa có đường niềm tin"
                body="Hai chỉ số sẽ được ghi lại sau tháng đầu tiên."
              />
            }
          >
            <TrustTrendChart rows={state().finance.monthlyHistory} />
          </Show>
          <div class="mini-grid">
            <Stat
              label="Người dân"
              value={formatPercent(state().metrics.citizenTrust)}
              tone={state().metrics.citizenTrust >= 45 ? "good" : "bad"}
            />
            <Stat
              label="Thể chế"
              value={formatPercent(state().metrics.institutionalTrust)}
              tone={state().metrics.institutionalTrust >= 45 ? "good" : "bad"}
            />
          </div>
        </Panel>
      </div>

      <Panel title="Nhiệm vụ dài hạn" kicker="Tiến độ nhiệm kỳ" icon="tabler:target">
        <div class="goal-list">
          <For each={missions()}>
            {(mission) => (
              <div class="goal" data-done={mission.done ? "true" : "false"}>
                <span class="goal-check">
                  <Icon icon={mission.done ? "lucide:check" : "lucide:clock"} size={15} />
                </span>
                <div>
                  <strong>
                    {mission.id === "electrification"
                      ? "Phủ điện đến mọi khu vực"
                      : mission.id === "market"
                        ? "Điều hành thị trường điện hợp lý"
                        : "Đảm bảo an ninh năng lượng"}
                  </strong>
                  <span>{mission.detail}</span>
                </div>
                <Bar
                  value={mission.progress}
                  tone={mission.done ? "good" : "electric"}
                  label={mission.id}
                />
              </div>
            )}
          </For>
        </div>
        <Show when={recovery().monthlyCredit > 0}>
          <div class="callout">
            <Icon icon="lucide:info" size={16} />
            <span>
              {`Năm kiểm toán ${recovery().eligibleYear}: ${formatBillion(recovery().eligibleLoss)} · Thu hồi tháng này: ${formatBillion(recovery().monthlyCredit)}`}
            </span>
          </div>
        </Show>
      </Panel>
    </div>
  );
};
