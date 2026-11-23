import type { JSX } from "@solidjs/web";
import { For, Show } from "solid-js";
import { useGame } from "../game-context";
import { Bar, Badge, Panel, Stat } from "../components/base";
import { Icon } from "../components/icons";
import { formatBillion, formatEnergy, formatPower, formatSignedBillion } from "~/state/format";
import {
  DECISIONS,
  LINE_PROJECTS,
  PLANT_PROJECTS,
  computeSupply,
  dispatchWithinCaps,
  zoneDemand,
  type Project,
  type ZoneId,
} from "~/domain";
import type { PanelId } from "../mobile/mobile-nav";

const projectName = (project: Project): string => {
  if (project.kind === "line") {
    const zone: ZoneId =
      project.targetId === "urban"
        ? "urban"
        : project.targetId === "industrial"
          ? "industrial"
          : "rural";

    const label =
      zone === "urban" ? "đô thị" : zone === "industrial" ? "khu công nghiệp" : "nông thôn";

    return `Đường dây ${LINE_PROJECTS[zone].coverage}% · ${label}`;
  }

  if (project.kind === "decision") {
    const decision = DECISIONS.find((row) => row.id === project.targetId);

    return decision === undefined ? "Quyết định điều hành" : labelOfDecision(project.targetId);
  }

  if (project.kind === "substation") return "Trạm biến áp mới";
  const plan = PLANT_PROJECTS[project.kind];

  const name =
    project.kind === "hydro" ? "Thủy điện" : project.kind === "thermal" ? "Nhiệt điện" : "Tái tạo";

  return `${name} +${plan.capacityMw} MW`;
};

const labelOfDecision = (id: string): string => {
  switch (id) {
    case "keep-fuel":
      return "Tiếp tục nhập nhiên liệu";
    case "cut-staff":
      return "Cắt giảm nhân sự";
    case "max-hydro":
      return "Tăng sản lượng thủy điện";
    case "policy-petition":
      return "Kiến nghị chính sách giá";
    case "negotiate-fuel":
      return "Đàm phán hợp đồng nhiên liệu";
    case "save-power":
      return "Tuyên truyền tiết kiệm điện";
    case "shift-industry":
      return "Dịch chuyển giờ công nghiệp";
    case "load-shed":
      return "Cắt điện luân phiên";
    case "fossil-ramp":
      return "Huy động nguồn hóa thạch";
    case "grid-maintenance":
      return "Bảo trì lưới điện";
    default:
      return "Quyết định điều hành";
  }
};

export const OpsRail = (props: { readonly onOpenPanel: (panel: PanelId) => void }): JSX.Element => {
  const { store } = useGame();
  const state = store.state;
  const last = () => state().finance.monthlyHistory[state().finance.monthlyHistory.length - 1];
  const activeProjects = () => state().operations.projects;

  const projected = () => {
    const demand = zoneDemand(state().zones, state().market, state().metrics);

    const dispatch = dispatchWithinCaps(
      state().operations.dispatch,
      state().generation,
      state().market,
      state().operations.supplierId,
    );

    const supplier =
      state().market.suppliers.find((row) => row.id === state().operations.supplierId) ??
      state().market.suppliers[0];

    return {
      demand: demand.total,
      supply: computeSupply(
        state().generation,
        dispatch,
        state().market,
        supplier?.priceVndPerKwh ?? 2_450,
        supplier?.capacityMw ?? 0,
      ).supplyMw,
    };
  };

  const supplyMw = () => last()?.supplyMw ?? projected().supply;
  const demandMw = () => last()?.demandMw ?? projected().demand;
  const balance = () => (demandMw() > 0 ? Math.min(100, (supplyMw() / demandMw()) * 100) : 100);

  return (
    <aside class="dock dock-right desktop-only" aria-label="Vận hành tháng">
      <Panel
        title="Cân bằng thời gian thực"
        kicker="MW và dự phòng"
        icon="tabler:activity"
        class="dock-panel"
      >
        <div class="balance-row">
          <Stat label="Phụ tải" value={formatPower(demandMw())} />
          <Stat label="Công suất" value={formatPower(supplyMw())} />
        </div>
        <Bar value={balance()} tone={balance() >= 98 ? "good" : "bad"} label="Cân bằng cung cầu" />
        <div class="balance-meta">
          <span>
            <Icon icon="lucide:activity" size={14} /> Dự phòng{" "}
            {Math.round(state().metrics.reserveMargin)}%
          </span>
          <span>
            <Icon icon="lucide:battery" size={14} /> Điện thương phẩm{" "}
            {formatEnergy(last()?.energySoldMillionKwh ?? 0)}
          </span>
        </div>
        <Show when={last() !== undefined}>
          <div class="mini-report">
            <div>
              <span>Lãi/lỗ tháng</span>
              <strong data-tone={(last()?.netResult ?? 0) >= 0 ? "good" : "bad"}>
                {formatSignedBillion(last()?.netResult ?? 0)}
              </strong>
            </div>
            <div>
              <span>Nợ lũy kế</span>
              <strong>{formatBillion(state().finance.debt)}</strong>
            </div>
            <div>
              <span>Lỗ lũy kế</span>
              <strong data-tone="bad">{formatBillion(state().finance.accumulatedLoss)}</strong>
            </div>
          </div>
        </Show>
        <button type="button" class="text-link" onClick={() => props.onOpenPanel("finance")}>
          Mở báo cáo tài chính
          <Icon icon="lucide:chevron-right" size={14} />
        </button>
      </Panel>

      <Panel
        title="Tiến trình thực thi"
        kicker={`${activeProjects().length}/3 công trình`}
        icon="lucide:hard-hat"
        class="dock-panel"
      >
        <Show
          when={activeProjects().length > 0}
          fallback={
            <p class="rail-note">
              <Icon icon="lucide:clock" size={14} />
              Chưa có công trình. Mở bảng Truyền tải để mở rộng lưới.
            </p>
          }
        >
          <ul class="project-list">
            <For each={activeProjects()}>
              {(project) => {
                const progress = () =>
                  (Math.min(project.totalMonths, project.totalMonths - project.monthsLeft + 1) /
                    Math.max(1, project.totalMonths)) *
                  100;

                return (
                  <li class="project-item">
                    <div class="project-head">
                      <strong>{projectName(project)}</strong>
                      <Badge tone="electric">{Math.round(progress())}%</Badge>
                    </div>
                    <Bar value={progress()} tone="electric" label={projectName(project)} />
                    <span class="project-meta">Còn {project.monthsLeft} tháng</span>
                  </li>
                );
              }}
            </For>
          </ul>
        </Show>
      </Panel>
    </aside>
  );
};
