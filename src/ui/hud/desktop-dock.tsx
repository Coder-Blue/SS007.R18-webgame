import type { JSX } from "@solidjs/web";
import { For, Show } from "solid-js";
import { useGame } from "../game-context";
import { ActionButton, Badge, Bar, Panel } from "../components/base";
import { Icon, type IconName } from "../components/icons";
import { formatBillion, formatPercent, formatTonne } from "~/state/format";
import { averageHouseholdTariff, recoveryOf, type GameState } from "~/domain";
import { projectFinance } from "~/state/selectors";
import type { PanelId } from "../mobile/mobile-nav";

const sceneLabel = (selection: string): string => {
  switch (selection) {
    case "hydro":
      return "Ruộng nước";
    case "mechanized":
      return "Ruộng cơ giới";
    case "hut":
      return "Bản xa";
    case "workshop":
      return "Xưởng làng";
    case "fleet":
      return "Đoàn xe";
    default:
      return "Tuyến đường";
  }
};

const pillars = (
  state: GameState,
): readonly {
  label: string;
  icon: IconName;
  value: number;
  tone: "good" | "warn" | "bad" | "gold";
  detail: string;
}[] => [
  {
    label: "Sản xuất",
    icon: "tabler:wheat",
    value: Math.min(100, (state.metrics.reliability ?? 100) * 0.6 + 20),
    tone: "good",
    detail: formatTonne(state.production.riceInventory),
  },
  {
    label: "Truyền tải",
    icon: "lucide:road",
    value: state.infrastructure.remoteCoverage,
    tone: state.infrastructure.remoteCoverage >= 80 ? "good" : "warn",
    detail: formatPercent(state.infrastructure.coverage),
  },
  {
    label: "Phân phối",
    icon: "lucide:scale",
    value: Math.max(
      0,
      100 -
        state.metrics.inflation * 4 -
        Math.max(0, averageHouseholdTariff(state.tariffs) - 11) * 3,
    ),
    tone: state.metrics.inflation > 8 ? "bad" : "gold",
    detail: formatPercent(state.metrics.inflation),
  },
];

export const LeftDock = (props: {
  readonly onOpenPanel: (panel: PanelId) => void;
  readonly selected: string | null;
  readonly onClearSelected: () => void;
}): JSX.Element => {
  const { store, actions } = useGame();
  const state = store.state;
  const recovery = () => recoveryOf(state());

  return (
    <aside class="dock dock-left desktop-only" aria-label="Chuỗi giá trị">
      <Panel title="Chuỗi giá trị" kicker="Ba trụ cột" icon="lucide:landmark" class="dock-panel">
        <div class="dock-pillars">
          <For each={pillars(state())}>
            {(pillar) => (
              <button
                type="button"
                class="dock-pillar"
                onClick={() =>
                  props.onOpenPanel(
                    pillar.icon === "tabler:wheat"
                      ? "production"
                      : pillar.icon === "lucide:road"
                        ? "infrastructure"
                        : "tariffs",
                  )
                }
              >
                <span class="dock-pillar-icon">
                  <Icon icon={pillar.icon} size={17} />
                </span>
                <span class="dock-pillar-copy">
                  <strong>{pillar.label}</strong>
                  <span>{pillar.detail}</span>
                </span>
                <Bar value={pillar.value} tone={pillar.tone} />
              </button>
            )}
          </For>
        </div>
        <div class="quick-actions">
          <ActionButton
            size="sm"
            variant="gold"
            icon="lucide:road"
            onClick={() => actions.buildRoad("asphalt")}
          >
            Đường nhựa
          </ActionButton>
          <ActionButton
            size="sm"
            variant="secondary"
            icon="lucide:droplets"
            onClick={() => actions.invest("hydro")}
          >
            Mở ruộng nước
          </ActionButton>
          <ActionButton
            size="sm"
            variant="secondary"
            icon="lucide:warehouse"
            onClick={() => actions.importRice()}
          >
            Nhập gạo dự trữ
          </ActionButton>
        </div>
        <Show when={props.selected !== null}>
          <div class="selection-card">
            <div>
              <span class="eyebrow">Thông tin khu vực</span>
              <strong>{sceneLabel(props.selected ?? "road")}</strong>
            </div>
            <button
              type="button"
              class="icon-btn"
              aria-label="Đóng thông tin"
              onClick={props.onClearSelected}
            >
              <Icon icon="lucide:x" size={15} />
            </button>
          </div>
        </Show>
        <Show when={recovery().monthlyCredit > 0}>
          <div class="dock-note">
            <Icon icon="lucide:coins" size={15} />
            <span>N-2 +{formatBillion(recovery().monthlyCredit)}/1 tháng gần nhất</span>
          </div>
        </Show>
      </Panel>
    </aside>
  );
};

export const RightDock = (props: {
  readonly onOpenPanel: (panel: PanelId) => void;
}): JSX.Element => {
  const { store, actions } = useGame();
  const state = store.state;
  const last = () => state().finance.monthlyHistory[state().finance.monthlyHistory.length - 1];
  const projection = () => projectFinance(state());
  const average = () => averageHouseholdTariff(state().tariffs);

  return (
    <aside class="dock dock-right desktop-only" aria-label="Tài chính">
      <Panel
        title="Tài chính"
        kicker="Báo cáo lãi lỗ tháng"
        icon="lucide:wallet"
        class="dock-panel"
      >
        <div class="finance-hero">
          <span>Ngân quỹ</span>
          <strong>{formatBillion(state().finance.cash)}</strong>
          <Badge tone={(last()?.netResult ?? 0) >= 0 ? "good" : "bad"}>
            Kết quả tháng {formatBillion(last()?.netResult ?? 0)}
          </Badge>
        </div>
        <div class="dock-meter">
          <div class="meter-row">
            <span>Dư nợ</span>
            <strong>{formatBillion(state().finance.debt)}</strong>
          </div>
          <Bar
            value={projection().debtRatio * 100}
            tone={projection().isDanger ? "bad" : "warn"}
            label="Dư nợ"
          />
        </div>
        <div class="dock-kpis">
          <div>
            <span>Giá bình quân có trọng số</span>
            <strong>{average().toFixed(2)}</strong>
          </div>
          <div>
            <span>Trần của Chairman</span>
            <strong>{state().tariffs.ceiling.toFixed(2)}</strong>
          </div>
          <div>
            <span>Lạm phát</span>
            <strong>{formatPercent(state().metrics.inflation)}</strong>
          </div>
        </div>
        <div class="quick-actions">
          <ActionButton
            size="sm"
            variant="secondary"
            icon="lucide:scale"
            onClick={() => props.onOpenPanel("tariffs")}
          >
            Bán lẻ & giá
          </ActionButton>
          <ActionButton
            size="sm"
            variant="secondary"
            icon="lucide:landmark"
            onClick={() => props.onOpenPanel("policy")}
          >
            Chính sách
          </ActionButton>
        </div>
        <div class="dock-note">
          <Icon icon={state().policy.n2Enabled ? "lucide:check" : "lucide:clock"} size={15} />
          <span>
            {state().policy.n2Enabled ? "Đang thu hồi chi phí N-2." : "Thu hồi chi phí N-2"}
          </span>
        </div>
        <ActionButton
          size="sm"
          variant="gold"
          icon="lucide:landmark"
          onClick={() => actions.enactRecovery()}
          disabled={state().clock.year < 2024 || state().policy.n2Enabled}
        >
          {state().policy.n2Enabled ? "Đang áp dụng" : "Ban hành"}
        </ActionButton>
      </Panel>
    </aside>
  );
};
