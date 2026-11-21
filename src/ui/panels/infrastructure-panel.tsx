import { For } from "solid-js";
import type { JSX } from "@solidjs/web";
import { useGame } from "../game-context";
import { ActionButton, Badge, Bar, Panel, ProgressRing, Stat } from "../components/base";
import { Icon } from "../components/icons";
import { t } from "../localization";
import { formatBillion, formatPercent } from "~/state/format";
import { FLEET_MAX, ROAD_PROJECTS, investmentCost, type RoadGrade } from "~/domain";
import { fleetCost } from "~/domain";

const grades: readonly RoadGrade[] = ["dirt", "cobble", "asphalt"];

const gradeLabels: Readonly<Record<RoadGrade, string>> = {
  dirt: "action.buildDirt",
  cobble: "action.buildCobble",
  asphalt: "action.buildAsphalt",
};

const gradeDescs: Readonly<Record<RoadGrade, string>> = {
  dirt: "action.buildDirtDesc",
  cobble: "action.buildCobbleDesc",
  asphalt: "action.buildAsphaltDesc",
};

export const InfrastructurePanel = (): JSX.Element => {
  const { store, actions } = useGame();
  const state = store.state;
  const infra = () => state().infrastructure;

  return (
    <div class="stack-lg">
      <Panel
        title={t("panel.infrastructure")}
        kicker={t("pillar.infrastructureTag")}
        icon="lucide:road"
      >
        <div class="coverage-row">
          <ProgressRing
            value={infra().coverage}
            label={t("infra.coverage")}
            tone={infra().coverage >= 90 ? "good" : "warn"}
          />
          <div class="coverage-copy">
            <strong>{t("infra.coverage")}</strong>
            <span>{formatPercent(infra().coverage)}</span>
            <Bar value={infra().coverage} tone={infra().coverage >= 90 ? "good" : "warn"} />
          </div>
          <ProgressRing
            value={infra().remoteCoverage}
            label={t("infra.remote")}
            tone={infra().remoteCoverage >= 90 ? "good" : "warn"}
          />
          <div class="coverage-copy">
            <strong>{t("infra.remote")}</strong>
            <span>{formatPercent(infra().remoteCoverage)}</span>
            <Bar
              value={infra().remoteCoverage}
              tone={infra().remoteCoverage >= 90 ? "good" : "warn"}
            />
          </div>
        </div>
        <div class="stat-grid">
          <Stat
            label={t("infra.dirt")}
            value={`${Math.round(infra().dirtKm)} km`}
            icon="lucide:road"
          />
          <Stat
            label={t("infra.cobble")}
            value={`${Math.round(infra().cobbleKm)} km`}
            icon="lucide:road"
          />
          <Stat
            label={t("infra.asphalt")}
            value={`${Math.round(infra().asphaltKm)} km`}
            icon="lucide:road"
          />
          <Stat
            label={t("infra.fleet")}
            value={t("pillar.trucksValue", { count: infra().fleet })}
            hint={formatBillion(fleetCost(infra().fleet, state().market))}
            icon="lucide:truck"
          />
        </div>
        <div class="callout">
          <Icon icon="lucide:map-pin" size={16} />
          <span>{t("infra.universalDesc")}</span>
        </div>
      </Panel>

      <Panel title={t("infra.buildTitle")} kicker={t("action.build")} icon="lucide:road">
        <p class="muted">{t("infra.buildHelp")}</p>
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
                      <strong>{t(gradeLabels[grade])}</strong>
                      <p>{t(gradeDescs[grade])}</p>
                    </div>
                  </div>
                  <div class="build-side">
                    <span>{formatBillion(project.cost)}</span>
                    <ActionButton
                      size="sm"
                      variant={grade === "asphalt" ? "gold" : "secondary"}
                      onClick={() => actions.buildRoad(grade)}
                    >
                      {t("action.build")}
                    </ActionButton>
                  </div>
                </div>
              );
            }}
          </For>
        </div>
      </Panel>

      <Panel title={t("infra.fleet")} kicker={t("pillar.infrastructureTag")} icon="lucide:truck">
        <div class="fleet-row">
          <div>
            <strong>{t("pillar.trucksValue", { count: infra().fleet })}</strong>
            <p class="muted">{t("infra.fleetHelp")}</p>
          </div>
          <Badge tone="gold">{t("pillar.fleet")}</Badge>
        </div>
        <Bar
          value={Math.min(100, (infra().fleet / FLEET_MAX) * 100)}
          tone="gold"
          label={t("infra.fleet")}
        />
        <div class="inline-actions">
          <ActionButton
            size="sm"
            variant="gold"
            icon="lucide:truck"
            onClick={() => actions.invest("fleet")}
          >
            {t("action.fleet")}
          </ActionButton>
          <span class="muted">{formatBillion(investmentCost(state(), "fleet"))}</span>
        </div>
      </Panel>
    </div>
  );
};
