import { For } from "solid-js";
import type { JSX } from "@solidjs/web";
import { useGame } from "../game-context";
import { ActionButton, Badge, Bar, Panel, Stat } from "../components/base";
import { Icon } from "../components/icons";
import { formatBillion, formatPercent } from "~/state/format";
import { LINE_PROJECTS, averageHouseholdTariff, buildLineAction, type ZoneId } from "~/domain";

const zoneCopy: Readonly<Record<ZoneId, { readonly name: string; readonly detail: string }>> = {
  urban: { name: "Đô thị", detail: "Phụ tải dân dụng và thương mại" },
  industrial: { name: "Khu công nghiệp", detail: "Phụ tải FDI, sản xuất liên tục" },
  rural: { name: "Nông thôn và đảo", detail: "Hộ xa, biên giới, hải đảo" },
};

export const GridPanel = (): JSX.Element => {
  const { store } = useGame();
  const state = store.state;
  const zones: readonly ZoneId[] = ["urban", "industrial", "rural"];

  return (
    <div class="stack-lg" data-tutorial="grid-panel">
      <Panel title="Bản đồ phủ điện" kicker="Bước 2 · Truyền tải" icon="lucide:utility-pole">
        <p class="panel-lead">
          Mỗi tuyến 500kV/220kV đưa một vùng tiến gần hơn tới 100% phủ điện. Công trình chạy theo
          tiến độ tháng và hiện trên bản đồ 3D.
        </p>
        <div class="zone-grid">
          <For each={zones}>
            {(zoneId) => {
              const zone = () => state().zones[zoneId];
              const plan = LINE_PROJECTS[zoneId];

              const pending = () =>
                state().operations.projects.some(
                  (project) => project.kind === "line" && project.targetId === zoneId,
                );

              const complete = () => zone().coverage >= 100;

              const revenueLift = () => {
                const added = Math.min(100, zone().coverage + plan.coverage) - zone().coverage;
                const energy = (zone().baseDemandMw * (added / 100) * 720) / 1_000;

                return (energy * averageHouseholdTariff(state().tariffs)) / 1_000;
              };

              return (
                <div class="zone-card" data-complete={complete() ? "true" : "false"}>
                  <div class="zone-head">
                    <span class="zone-icon">
                      <Icon
                        icon={
                          zoneId === "urban"
                            ? "lucide:building"
                            : zoneId === "industrial"
                              ? "tabler:building-factory-2"
                              : "lucide:house"
                        }
                        size={18}
                      />
                    </span>
                    <div>
                      <strong>{zoneCopy[zoneId].name}</strong>
                      <span>{zoneCopy[zoneId].detail}</span>
                    </div>
                    <Badge tone={complete() ? "good" : "warn"}>
                      {formatPercent(zone().coverage)}
                    </Badge>
                  </div>
                  <Bar
                    value={zone().coverage}
                    tone={complete() ? "good" : "electric"}
                    label={`Phủ điện ${zoneCopy[zoneId].name}`}
                  />
                  <div class="zone-meta">
                    <span>
                      <Icon icon="lucide:cable" size={14} />+{plan.coverage}% mỗi tuyến
                    </span>
                    <span>
                      <Icon icon="lucide:timer" size={14} />
                      {plan.months} tháng
                    </span>
                    <span>
                      <Icon icon="lucide:coins" size={14} />
                      {formatBillion(plan.cost)}
                    </span>
                  </div>
                  <div class="zone-preview">
                    <span>Dự kiến sau khi nối</span>
                    <strong>
                      {formatPercent(zone().coverage)} →{" "}
                      {formatPercent(Math.min(100, zone().coverage + plan.coverage))}
                    </strong>
                    <span>Doanh thu ước tính +{formatBillion(revenueLift())}/tháng</span>
                  </div>
                  <ActionButton
                    size="sm"
                    variant={complete() ? "ghost" : "secondary"}
                    icon={complete() ? "lucide:check" : "lucide:plus"}
                    disabled={complete() || pending() || state().operations.projects.length >= 3}
                    onClick={() => store.dispatch(buildLineAction(state(), zoneId))}
                  >
                    {complete()
                      ? "Đã phủ 100%"
                      : pending()
                        ? "Đang thi công"
                        : `Nối lưới ${plan.coverage}%`}
                  </ActionButton>
                </div>
              );
            }}
          </For>
        </div>
      </Panel>

      <Panel title="Hạ tầng truyền tải" kicker="Tài sản lưới" icon="lucide:network">
        <div class="stat-grid">
          <Stat
            label="Đường dây 500kV"
            value={`${Math.round(state().infrastructure.lineKm500)} km`}
          />
          <Stat
            label="Đường dây 220kV"
            value={`${Math.round(state().infrastructure.lineKm220)} km`}
          />
          <Stat label="Trạm biến áp" value={`${state().infrastructure.substations}`} />
          <Stat
            label="Độ mạnh lưới"
            value={formatPercent(state().infrastructure.gridStrength)}
            tone={state().infrastructure.gridStrength >= 75 ? "good" : "warn"}
          />
        </div>
        <div class="callout">
          <Icon icon="lucide:info" size={16} />
          <span>
            Tổn thất truyền tải hiện tại khoảng{" "}
            {formatPercent(Math.max(4, 9 - state().infrastructure.gridStrength * 0.05))}. Trạm biến
            áp mới giúp giảm tổn thất và tăng dự phòng.
          </span>
        </div>
      </Panel>

      <Panel title="Công trình đang chạy" kicker="Tiến độ tháng" icon="lucide:hard-hat">
        <For each={state().operations.projects}>
          {(project) => {
            const progress = () =>
              (Math.min(project.totalMonths, project.totalMonths - project.monthsLeft + 1) /
                Math.max(1, project.totalMonths)) *
              100;

            const name =
              project.kind === "line"
                ? `Tuyến ${zoneCopy[project.targetId === "urban" ? "urban" : project.targetId === "industrial" ? "industrial" : "rural"].name}`
                : project.kind === "decision"
                  ? "Quyết định điều hành"
                  : project.kind === "substation"
                    ? "Trạm biến áp"
                    : `Nhà máy ${project.kind}`;

            return (
              <div class="project-row">
                <div class="project-head">
                  <strong>{name}</strong>
                  <span>{Math.round(progress())}%</span>
                </div>
                <Bar value={progress()} tone="electric" label={name} />
                <span class="project-meta">Còn {project.monthsLeft} tháng</span>
              </div>
            );
          }}
        </For>
        <p class="rail-note">
          <Icon icon="lucide:clock" size={14} />
          Tối đa ba công trình cùng lúc. Công trình hoàn tất vào đầu tháng kế tiếp.
        </p>
      </Panel>
    </div>
  );
};
