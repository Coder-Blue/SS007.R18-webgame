import { For, Show, createSignal, createTrackedEffect } from "solid-js";
import type { JSX } from "@solidjs/web";
import { useGame } from "../game-context";
import { ActionButton, Badge, Bar, Panel, RangeSlider, Stat } from "../components/base";
import { Icon } from "../components/icons";
import { formatBillion, formatPercent } from "~/state/format";
import {
  DECISIONS,
  RECOVERY_RATE_MAX,
  RECOVERY_RATE_MIN,
  missionStatus,
  recoveryOf,
  type DecisionId,
} from "~/domain";

const decisionNames: Readonly<Record<DecisionId, string>> = {
  "keep-fuel": "Tiếp tục nhập nhiên liệu",
  "cut-staff": "Cắt giảm nhân sự, bộ phận",
  "max-hydro": "Tăng sản lượng thủy điện",
  "policy-petition": "Kiến nghị thay đổi chính sách giá",
  "negotiate-fuel": "Đàm phán hợp đồng nhiên liệu",
  "save-power": "Tuyên truyền tiết kiệm điện",
  "shift-industry": "Dịch chuyển giờ công nghiệp",
  "load-shed": "Cắt điện luân phiên",
  "fossil-ramp": "Huy động nguồn hóa thạch",
  "grid-maintenance": "Bảo trì, chống quá tải",
};

const decisionNotes: Readonly<Record<DecisionId, string>> = {
  "keep-fuel": "Giữ nhiệt điện nền, chấp nhận chi phí nhiên liệu cao.",
  "cut-staff": "Giảm chi phí quản lý nhưng mất tín nhiệm thể chế.",
  "max-hydro": "Dùng nước rẻ trước mùa khô, hồ chứa xuống nhanh.",
  "policy-petition": "Mở một điều kiện tiên quyết cho cải cách giá.",
  "negotiate-fuel": "Đàm phán dài hạn để giảm cú sốc nhiên liệu sau này.",
  "save-power": "Giảm phụ tải đỉnh bằng truyền thông tiết kiệm.",
  "shift-industry": "Dời giờ sản xuất ra ngoài cao điểm, ảnh hưởng niềm tin.",
  "load-shed": "Cắt điện luân phiên để giữ lưới, mất niềm tin dân.",
  "fossil-ramp": "Tăng công suất nhiệt, đẩy lạm phát.",
  "grid-maintenance": "Củng cố lưới, giảm rủi ro quá tải.",
};

const reforms = [
  {
    key: "n2",
    name: "N-2 · Thu hồi chi phí kiểm toán",
    detail: "Chỉ sau kiến nghị chính sách và từ 2024.",
  },
  { key: "nsmo", name: "NSMO · Tách điều độ hệ thống", detail: "Trung tâm điều độ độc lập." },
  {
    key: "dppa",
    name: "DPPA · Hợp đồng mua bán trực tiếp",
    detail: "Nối nguồn tái tạo tư nhân vào khu công nghiệp.",
  },
  {
    key: "vrem",
    name: "VREM · Thị trường bán lẻ cạnh tranh",
    detail: "Lộ trình bán lẻ điện cạnh tranh.",
  },
  { key: "twoPart", name: "Biểu giá hai thành phần", detail: "Tách công suất và điện năng." },
] as const;

export const PolicyPanel = (): JSX.Element => {
  const { store, actions } = useGame();
  const state = store.state;
  const [rate, setRate] = createSignal(state().policy.n2Rate);
  const recovery = () => recoveryOf(state().finance, state().clock.year, state().policy);

  createTrackedEffect(() => {
    setRate(state().policy.n2Rate);
  });

  const reformProgress = (key: (typeof reforms)[number]["key"]) =>
    state().policy.reformProgress.find((project) => project.key === key);

  const isActive = (id: DecisionId): boolean =>
    state().operations.projects.some(
      (project) => project.kind === "decision" && project.targetId === id,
    );

  return (
    <div class="stack-lg">
      <Panel title="Nhiệm vụ dài hạn" kicker="Tín nhiệm là phần thưởng" icon="tabler:target">
        <div class="goal-list">
          <For each={missionStatus(state())}>
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
      </Panel>

      <Panel
        title="Quyết định sau sự kiện"
        kicker={`${state().events.decisions.length} quyết định đã mở`}
        icon="tabler:checklist"
      >
        <Show
          when={state().events.decisions.length > 0}
          fallback={
            <p class="rail-note">
              <Icon icon="lucide:clock" size={14} />
              Các quyết định mở khóa sau sự kiện nhiên liệu 2022 và hạn hán 2023.
            </p>
          }
        >
          <div class="decision-list">
            <For each={state().events.decisions}>
              {(id) => {
                const definition = DECISIONS.find((row) => row.id === id);
                const completed = state().events.completedDecisions.includes(id);

                return (
                  <div class="decision-card" data-completed={completed ? "true" : "false"}>
                    <div class="decision-head">
                      <strong>{decisionNames[id]}</strong>
                      <Badge tone={completed ? "good" : isActive(id) ? "electric" : "neutral"}>
                        {completed ? "Hoàn tất" : isActive(id) ? "Đang chạy" : "Sẵn sàng"}
                      </Badge>
                    </div>
                    <p>{decisionNotes[id]}</p>
                    <div class="decision-meta">
                      <span>
                        <Icon icon="lucide:timer" size={14} />
                        {definition?.months ?? 0} tháng
                      </span>
                      <span>
                        <Icon icon="lucide:coins" size={14} />
                        {formatBillion(definition?.cost ?? 0)}
                      </span>
                    </div>
                    <ActionButton
                      size="sm"
                      variant="secondary"
                      icon={completed ? "lucide:check" : "lucide:play"}
                      disabled={
                        completed || isActive(id) || state().operations.projects.length >= 3
                      }
                      onClick={() => actions.startDecision(id)}
                    >
                      {completed ? "Đã thực hiện" : isActive(id) ? "Đang thực hiện" : "Bắt đầu"}
                    </ActionButton>
                  </div>
                );
              }}
            </For>
          </div>
        </Show>
      </Panel>

      <Panel title="Cải cách cơ cấu" kicker="Luật Điện lực sửa đổi" icon="tabler:gavel">
        <div class="reform-list">
          <For each={reforms}>
            {(reform) => {
              const enabled =
                reform.key === "n2"
                  ? state().policy.n2Enabled
                  : reform.key === "nsmo"
                    ? state().policy.nsmo
                    : reform.key === "dppa"
                      ? state().policy.dppa
                      : reform.key === "vrem"
                        ? state().policy.vrem
                        : state().policy.twoPartTariff;

              const pending = reformProgress(reform.key);

              const progress =
                pending === undefined
                  ? 0
                  : ((pending.totalMonths - pending.monthsLeft) / pending.totalMonths) * 100;

              return (
                <div
                  class="reform-row"
                  data-enabled={enabled ? "true" : "false"}
                  data-pending={pending === undefined ? "false" : "true"}
                >
                  <div class="reform-copy">
                    <div class="reform-head">
                      <strong>{reform.name}</strong>
                      <Badge
                        tone={enabled ? "good" : pending === undefined ? "neutral" : "electric"}
                      >
                        {enabled
                          ? "Đang áp dụng"
                          : pending === undefined
                            ? "Chưa áp dụng"
                            : `${Math.round(progress)}%`}
                      </Badge>
                    </div>
                    <span>{reform.detail}</span>
                    {pending === undefined ? null : (
                      <>
                        <Bar value={progress} tone="electric" label={`Tiến trình ${reform.name}`} />
                        <span class="project-meta">
                          {`Đang thực thi · còn ${pending.monthsLeft} tháng`}
                        </span>
                      </>
                    )}
                  </div>
                  <div class="reform-actions">
                    {reform.key === "n2" ? (
                      <ActionButton
                        size="sm"
                        variant="gold"
                        disabled={enabled || pending !== undefined}
                        icon="tabler:report-money"
                        onClick={actions.enableN2}
                      >
                        {pending === undefined ? "Ban hành N-2" : "Đang thực hiện"}
                      </ActionButton>
                    ) : (
                      <ActionButton
                        size="sm"
                        variant="secondary"
                        disabled={enabled || pending !== undefined}
                        icon="tabler:gavel"
                        onClick={() => actions.enablePolicy(reform.key)}
                      >
                        {pending === undefined ? "Áp dụng" : "Đang thực hiện"}
                      </ActionButton>
                    )}
                  </div>
                </div>
              );
            }}
          </For>
        </div>
        <div class="rate-row">
          <div class="dispatch-head">
            <span>Tỷ lệ thu hồi N-2</span>
            <strong>{formatPercent(rate() * 100)}</strong>
          </div>
          <RangeSlider
            value={rate()}
            min={RECOVERY_RATE_MIN}
            max={RECOVERY_RATE_MAX}
            step={0.05}
            label="Tỷ lệ thu hồi N-2"
            onInput={(value) => setRate(value)}
          />
          <div class="action-row">
            <ActionButton
              size="sm"
              variant="secondary"
              icon="lucide:check"
              onClick={() => actions.setRecoveryRate(rate())}
            >
              Lưu tỷ lệ
            </ActionButton>
            <span class="tier-meta">
              Thu hồi tháng này: {formatBillion(recovery().monthlyCredit)}
            </span>
          </div>
        </div>
        <Show when={state().policy.branch === "private"}>
          <div class="callout" data-tone="bad">
            <Icon icon="tabler:alert-triangle" size={16} />
            <span>
              Nhánh tư nhân hóa đã mở. Giá điện mất trần, lưới trùng lặp và niềm tin đang lao dốc.
              Đây là nhánh giả định dẫn tới thất bại.
            </span>
          </div>
        </Show>
      </Panel>

      <Panel title="Điều kiện cải cách giá" kicker="Tiền đề chính trị" icon="tabler:file-analytics">
        <div class="stat-grid">
          <Stat
            label="Kiến nghị chính sách"
            value={state().policy.petitionDone ? "Đã hoàn tất" : "Chưa có"}
            tone={state().policy.petitionDone ? "good" : "warn"}
            icon="lucide:file-text"
          />
          <Stat
            label="Năm hiện tại"
            value={`${state().clock.year}`}
            hint="N-2 mở từ 2024"
            icon="lucide:calendar"
          />
          <Stat
            label="Nhánh"
            value={state().policy.branch === "state" ? "Nhà nước" : "Tư nhân hóa"}
            tone={state().policy.branch === "state" ? "good" : "bad"}
            icon="tabler:route"
          />
          <Stat
            label="Giá trần"
            value={formatPercent(state().policy.priceCap ? 100 : 0)}
            hint={state().policy.priceCap ? "Đang giữ trần bán lẻ" : "Trần đã bị bãi bỏ"}
            tone={state().policy.priceCap ? "good" : "bad"}
            icon="tabler:shield-check"
          />
        </div>
      </Panel>
    </div>
  );
};
