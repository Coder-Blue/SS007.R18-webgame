import type { JSX } from "@solidjs/web";
import { For, Show } from "solid-js";
import { useGame } from "../game-context";
import { Bar, Badge, Panel } from "../components/base";
import { Icon, type IconName } from "../components/icons";
import { missionStatus, type MissionId, type PolicyKey } from "~/domain";
import type { PanelId } from "../mobile/mobile-nav";

const icons: Readonly<Record<MissionId, IconName>> = {
  electrification: "lucide:utility-pole",
  market: "lucide:handshake",
  security: "tabler:shield-check",
};

const labels: Readonly<Record<MissionId, string>> = {
  electrification: "Phủ điện toàn quốc",
  market: "Thị trường điện hợp lý",
  security: "An ninh năng lượng",
};

const descriptions: Readonly<Record<MissionId, string>> = {
  electrification: "Đưa cả ba vùng lên 100%.",
  market: "Mua điện cạnh tranh, giữ ổn định và cải cách giá.",
  security: "Giữ biên dự phòng trên 15% đủ 12 tháng.",
};

const reformNames: Readonly<Record<PolicyKey, string>> = {
  n2: "N-2 · Thu hồi chi phí",
  nsmo: "NSMO · Tách điều độ",
  dppa: "DPPA · Mua bán trực tiếp",
  vrem: "VREM · Bán lẻ cạnh tranh",
  twoPart: "Biểu giá hai thành phần",
};

export const MissionRail = (props: {
  readonly onOpenPanel: (panel: PanelId) => void;
}): JSX.Element => {
  const { store } = useGame();
  const state = store.state;
  const missions = () => missionStatus(state());

  return (
    <aside class="dock dock-left desktop-only" aria-label="Nhiệm vụ dài hạn">
      <Show when={state().policy.reformProgress.length > 0}>
        <Panel
          title="Cải cách đang thực thi"
          kicker="Tiến trình 0–100%"
          icon="tabler:gavel"
          class="dock-panel"
        >
          <For each={state().policy.reformProgress}>
            {(project) => {
              const progress =
                ((project.totalMonths - project.monthsLeft) / project.totalMonths) * 100;

              return (
                <div class="reform-mini" data-reform={project.key}>
                  <div class="dispatch-head">
                    <span>{reformNames[project.key]}</span>
                    <strong>{`${Math.round(progress)}%`}</strong>
                  </div>
                  <Bar
                    value={progress}
                    tone="gold"
                    label={`Tiến trình ${reformNames[project.key]}`}
                  />
                  <span class="project-meta">{`Còn ${project.monthsLeft} tháng`}</span>
                </div>
              );
            }}
          </For>
        </Panel>
      </Show>

      <Panel
        title="Nhiệm vụ dài hạn"
        kicker="Ba trụ cột nhiệm kỳ"
        icon="tabler:target"
        class="dock-panel"
        actions={
          <button
            type="button"
            class="text-link"
            onClick={() => props.onOpenPanel("policy")}
            aria-label="Mở bảng chính sách"
          >
            Chi tiết
            <Icon icon="lucide:chevron-right" size={14} />
          </button>
        }
      >
        <ul class="mission-list">
          <For each={missions()}>
            {(mission) => (
              <li class="mission-item" data-done={mission.done ? "true" : "false"}>
                <div class="mission-head">
                  <span class="mission-icon">
                    <Icon icon={icons[mission.id]} size={16} />
                  </span>
                  <div class="mission-copy">
                    <strong>{labels[mission.id]}</strong>
                    <span>{descriptions[mission.id]}</span>
                  </div>
                  <Badge tone={mission.done ? "good" : "neutral"}>
                    {mission.done ? "Đạt" : `${Math.round(mission.progress)}%`}
                  </Badge>
                </div>
                <Bar
                  value={mission.progress}
                  tone={mission.done ? "good" : "electric"}
                  label={labels[mission.id]}
                />
                <span class="mission-detail">{mission.detail}</span>
              </li>
            )}
          </For>
        </ul>
        <p class="rail-note">
          <Icon icon="tabler:activity" size={14} />
          Hoàn thành nhiệm vụ giữ nhịp tín nhiệm trước sức ép truyền thông.
        </p>
      </Panel>

      <Panel
        title="Sức ép truyền thông"
        kicker="Hiệu ứng đang chạy"
        icon="tabler:speakerphone"
        class="dock-panel"
      >
        <div class="media-card" data-active={state().media.activeMonths > 0 ? "true" : "false"}>
          <div class="media-head">
            <Icon icon="tabler:news" size={18} />
            <strong>
              {state().media.activeMonths > 0
                ? `Lỗ EVN được đưa tin · ${state().media.activeMonths} tháng`
                : "Chưa có sóng truyền thông"}
            </strong>
          </div>
          <p>
            {state().media.activeMonths > 0
              ? "Niềm tin người dân đang giảm nhanh hơn mỗi tháng cho đến khi cải cách cơ cấu có hiệu lực."
              : "Lỗ tháng, nợ lớn hoặc tăng giá sẽ kích hoạt sóng truyền thông tiếp theo."}
          </p>
          {state().media.activeMonths > 0 ? (
            <Bar
              value={state().media.activeMonths}
              max={3}
              tone="bad"
              label="Tháng truyền thông còn lại"
              pulse
            />
          ) : null}
        </div>
      </Panel>
    </aside>
  );
};
