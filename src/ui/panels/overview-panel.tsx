import { For, Show } from "solid-js";
import { useGame } from "../game-context";
import { Panel, Stat, Bar, Badge, cx } from "../components/base";
import { Icon, type IconName } from "../components/icons";
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
        <Icon icon={icon} size={18} />
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
        label: "Phủ 100% đường đến hộ dân và bản xa",
        done:
          current.infrastructure.coverage >= 100 && current.infrastructure.remoteCoverage >= 100,
        detail: `${formatPercent(current.infrastructure.coverage)} / ${formatPercent(current.infrastructure.remoteCoverage)}`,
      },
      {
        label: "Đưa dư nợ về dưới 25.000 tỷ",
        done: current.finance.debt <= ARCHITECT_DEBT_MAX,
        detail: formatBillion(current.finance.debt),
      },
      {
        label: "Ban hành N-2, DPPA và VREM",
        done: current.policy.n2Enabled && current.policy.dppa && current.policy.vrem,
        detail: `${current.policy.n2Enabled ? "Đang áp dụng" : "Chưa áp dụng"} · ${current.policy.vrem ? "VREM" : "—"}`,
      },
      {
        label: "Giữ tín nhiệm và hài lòng trên 55%",
        done: current.metrics.trust >= 55 && current.metrics.satisfaction >= 55,
        detail: `${formatPercent(current.metrics.trust)} / ${formatPercent(current.metrics.satisfaction)}`,
      },
    ];
  };

  return (
    <div class="stack-lg">
      <Panel title="Tình hình tháng này" kicker={actLabel(state().act)} icon="lucide:chart-column">
        <div class="overview-hero">
          <div class="overview-copy">
            <p class="eyebrow">{`Tháng ${state().clock.month}/${state().clock.year}`}</p>
            <h3>Chuỗi giá trị của làng</h3>
            <p class="muted">
              Một làng, một mạng đường, một giỏ gạo. Giữ cho dân no, xưởng chạy và ngân sách không
              sụp. Mở đường và giữ giá xưởng thấp để xưởng mở rộng.
            </p>
            <div class="hero-chips">
              <Badge tone="gold">Sản xuất</Badge>
              <Badge tone="dark">Truyền tải</Badge>
              <Badge tone="good">Phân phối</Badge>
            </div>
          </div>
          <div class="overview-score">
            <span class="score-label">Điểm tranh luận công khai</span>
            <strong>{Math.round(state().metrics.debateScore)}</strong>
            <Bar
              value={state().metrics.debateScore}
              tone="gold"
              label="Điểm tranh luận công khai"
            />
          </div>
        </div>
        <div class="stat-grid">
          <Stat
            label="Nhu cầu"
            value={formatTonne(last()?.totalDemand ?? 0)}
            hint="Thiếu hụt"
            icon="tabler:wheat"
          />
          <Stat
            label="Độ ổn định"
            value={formatPercent(state().metrics.reliability)}
            tone={
              state().metrics.reliability >= 95
                ? "good"
                : state().metrics.reliability >= 80
                  ? "warn"
                  : "bad"
            }
            icon="lucide:shield"
          />
          <Stat
            label="Kết quả tháng trước"
            value={last() === undefined ? "—" : formatBillion(last()?.netResult ?? 0)}
            tone={(last()?.netResult ?? 0) >= 0 ? "good" : "bad"}
            icon="lucide:wallet"
          />
          <Stat
            label="Số tháng còn lại trước trần nợ"
            value={
              projection().runwayMonths >= 99
                ? "—"
                : `${Math.round(projection().runwayMonths)} tháng`
            }
            tone={
              projection().runwayMonths >= 12
                ? "good"
                : projection().runwayMonths >= 6
                  ? "warn"
                  : "bad"
            }
            icon="lucide:clock"
          />
        </div>
      </Panel>

      <Panel title="Sức khỏe ba trụ cột" kicker="Trạng thái làng" icon="lucide:landmark">
        <div class="pillar-grid">
          {pillar(
            "Sản xuất",
            "Phát điện · Ruộng và nông trại",
            "tabler:wheat",
            Math.min(
              100,
              (last()?.reliability ?? 100) * 0.55 +
                Math.min(100, state().production.riceInventory) * 0.1,
            ),
            `${formatTonne(last()?.ownProduction ?? 0)} · Tồn kho gạo: ${formatTonne(state().production.riceInventory)}`,
            "good",
          )}
          {pillar(
            "Truyền tải",
            "Truyền tải · Đường độc quyền",
            "lucide:road",
            state().infrastructure.coverage,
            `Bao phủ bản xa: ${formatPercent(state().infrastructure.remoteCoverage)} · Đội xe: ${state().infrastructure.fleet}`,
            state().infrastructure.coverage >= 90
              ? "good"
              : state().infrastructure.coverage >= 70
                ? "warn"
                : "bad",
          )}
          {pillar(
            "Phân phối",
            "Bán lẻ · Giá trần và trợ giá",
            "lucide:scale",
            Math.max(
              0,
              100 -
                Math.abs(recovery().monthlyCredit > 0 ? 20 : 35) -
                state().metrics.inflation * 2,
            ),
            `Giá bình quân: ${state()
              .tariffs.tiers.reduce(
                (sum, value, index) => sum + value * [0.45, 0.28, 0.18, 0.09][index]!,
                0,
              )
              .toFixed(2)} · Trần giá: ${state().tariffs.ceiling}`,
            "gold",
          )}
        </div>
      </Panel>

      <Panel title="Mục tiêu nhiệm kỳ" kicker="Trạng thái làng" icon="lucide:shield">
        <div class="goal-list">
          <For each={goals()}>
            {(goal) => (
              <div class="goal" data-done={goal.done}>
                <span class={cx("goal-check", goal.done && "is-done")}>
                  <Icon icon={goal.done ? "lucide:check" : "lucide:clock"} size={15} />
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

      <Panel title="Gợi ý điều hành" kicker="Hướng dẫn" icon="lucide:book-open">
        <ul class="guide-list">
          <li>Mở đường và giữ giá xưởng thấp để xưởng mở rộng.</li>
          <li>Dùng kho gạo khi hạn hán đẩy giá mua ngoài lên cao.</li>
          <li>Đừng để nợ vượt 80% trần trước năm 2024.</li>
          <li>Sau 2024, ban hành N-2 và chọn tỷ lệ thu hồi vừa phải.</li>
        </ul>
        <Show when={recovery().eligibleLoss > 0}>
          <div class="callout">
            <Icon icon="lucide:info" size={16} />
            <span>
              {`Năm kiểm toán ${recovery().eligibleYear}`}: {formatBillion(recovery().eligibleLoss)}{" "}
              {"· Thu hồi tháng này: "}
              {formatBillion(recovery().monthlyCredit)}
            </span>
          </div>
        </Show>
      </Panel>
    </div>
  );
};
