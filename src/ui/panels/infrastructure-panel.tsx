import { For } from "solid-js";
import type { JSX } from "@solidjs/web";
import { useGame } from "../game-context";
import { ActionButton, Badge, Bar, Panel, ProgressRing, Stat } from "../components/base";
import { Icon } from "../components/icons";
import { formatBillion, formatPercent } from "~/state/format";
import { FLEET_MAX, ROAD_PROJECTS, investmentCost, type RoadGrade } from "~/domain";
import { fleetCost } from "~/domain";

const grades: readonly RoadGrade[] = ["dirt", "cobble", "asphalt"];

const gradeLabels: Readonly<Record<RoadGrade, string>> = {
  dirt: "Đường đất",
  cobble: "Đường đá",
  asphalt: "Đường nhựa",
};

const gradeDescs: Readonly<Record<RoadGrade, string>> = {
  dirt: "+8 km, +3% bao phủ, +8% bản xa",
  cobble: "+6 km, +5% bao phủ, +12% bản xa",
  asphalt: "+4 km, +7% bao phủ, +16% bản xa",
};

export const InfrastructurePanel = (): JSX.Element => {
  const { store, actions } = useGame();
  const state = store.state;
  const infra = () => state().infrastructure;

  return (
    <div class="stack-lg">
      <Panel title="Truyền tải" kicker="Truyền tải · Đường độc quyền" icon="lucide:road">
        <div class="coverage-row">
          <ProgressRing
            value={infra().coverage}
            label="Bao phủ hộ dân"
            tone={infra().coverage >= 90 ? "good" : "warn"}
          />
          <div class="coverage-copy">
            <strong>Bao phủ hộ dân</strong>
            <span>{formatPercent(infra().coverage)}</span>
            <Bar
              value={infra().coverage}
              tone={infra().coverage >= 90 ? "good" : "warn"}
              label="Bao phủ hộ dân"
            />
          </div>
          <ProgressRing
            value={infra().remoteCoverage}
            label="Bao phủ bản xa"
            tone={infra().remoteCoverage >= 90 ? "good" : "warn"}
          />
          <div class="coverage-copy">
            <strong>Bao phủ bản xa</strong>
            <span>{formatPercent(infra().remoteCoverage)}</span>
            <Bar
              value={infra().remoteCoverage}
              tone={infra().remoteCoverage >= 90 ? "good" : "warn"}
              label="Bao phủ bản xa"
            />
          </div>
        </div>
        <div class="stat-grid">
          <Stat label="Đường đất" value={`${Math.round(infra().dirtKm)} km`} icon="lucide:road" />
          <Stat label="Đường đá" value={`${Math.round(infra().cobbleKm)} km`} icon="lucide:road" />
          <Stat
            label="Đường nhựa"
            value={`${Math.round(infra().asphaltKm)} km`}
            icon="lucide:road"
          />
          <Stat
            label="Đội xe tải"
            value={`${infra().fleet} xe`}
            hint={formatBillion(fleetCost(infra().fleet, state().market))}
            icon="lucide:truck"
          />
        </div>
        <div class="callout">
          <Icon icon="lucide:map-pin" size={16} />
          <span>
            Mọi hộ dân, kể cả bản xa, phải được nối vào mạng gạo chung. Đây là điều kiện để có kết
            thúc tốt nhất.
          </span>
        </div>
      </Panel>

      <Panel title="Mở rộng mạng đường" kicker="Mở đường" icon="lucide:road">
        <p class="muted">
          Đường nhựa nhanh hơn nhưng đắt. Bản xa cần đường kiên cố để đạt 100% bao phủ.
        </p>
        <div class="build-list">
          <For each={grades}>
            {(grade) => {
              const project = ROAD_PROJECTS[grade];

              return (
                <div class="build-card">
                  <div class="build-main">
                    <span class="build-icon" data-grade={grade}>
                      <Icon icon="lucide:road" size={20} />
                    </span>
                    <div>
                      <strong>{gradeLabels[grade]}</strong>
                      <p>{gradeDescs[grade]}</p>
                    </div>
                  </div>
                  <div class="build-side">
                    <span>{formatBillion(project.cost)}</span>
                    <ActionButton
                      size="sm"
                      variant={grade === "asphalt" ? "gold" : "secondary"}
                      onClick={() => actions.buildRoad(grade)}
                    >
                      Mở đường
                    </ActionButton>
                  </div>
                </div>
              );
            }}
          </For>
        </div>
      </Panel>

      <Panel title="Đội xe tải" kicker="Truyền tải · Đường độc quyền" icon="lucide:truck">
        <div class="fleet-row">
          <div>
            <strong>{`${infra().fleet} xe`}</strong>
            <p class="muted">
              Đội xe giúp vận chuyển gạo đến các bản xa và giảm chi phí logistics.
            </p>
          </div>
          <Badge tone="gold">Đội xe</Badge>
        </div>
        <Bar
          value={Math.min(100, (infra().fleet / FLEET_MAX) * 100)}
          tone="gold"
          label="Đội xe tải"
        />
        <div class="inline-actions">
          <ActionButton
            size="sm"
            variant="gold"
            icon="lucide:truck"
            onClick={() => actions.invest("fleet")}
          >
            Mua thêm xe
          </ActionButton>
          <span class="muted">{formatBillion(investmentCost(state(), "fleet"))}</span>
        </div>
      </Panel>
    </div>
  );
};
