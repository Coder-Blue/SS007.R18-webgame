import type { JSX } from "@solidjs/web";
import { PowerCanvas } from "../scene/power-canvas";
import { TopBar } from "../hud/top-bar";
import { MissionRail } from "../hud/mission-rail";
import { OpsRail } from "../hud/ops-rail";
import { BottomDock } from "../hud/bottom-dock";
import { MobileNav, type PanelId } from "../mobile/mobile-nav";
import { WorkspaceDrawer } from "../modals/workspace-drawer";
import { EventModal } from "../modals/event-modal";
import { ApprovalModal } from "../modals/approval-modal";
import { EndingScreen } from "../modals/ending-screen";
import { MonthlyReport, SummaryModal } from "../modals/monthly-report";
import type { SceneSelection } from "~/scene/create-power-scene";
import { Show } from "solid-js";
import { useGame } from "../game-context";
import { Icon } from "../components/icons";

export const GameView = (props: {
  readonly workspaceOpen: boolean;
  readonly workspacePanel: PanelId;
  readonly onOpenPanel: (panel: PanelId) => void;
  readonly onCloseWorkspace: () => void;
  readonly onOpenMenu: () => void;
  readonly onOpenTutorial: () => void;
  readonly onSelect: (selection: SceneSelection) => void;
  readonly onNewGame: () => void;
}): JSX.Element => {
  const { store } = useGame();

  return (
    <>
      <div class="scene-stage" data-tutorial="scene">
        <PowerCanvas onSelect={props.onSelect} />
        <div class="scene-veil" aria-hidden="true" />
        <Show when={!store.running() && store.state().ending === null}>
          <div class="paused-banner" data-tutorial="pause">
            <Icon icon="lucide:pause" size={16} />
            <span>ĐANG TẠM DỪNG</span>
            <span class="paused-hint">Space để tiếp tục · 1–3 đổi tốc độ</span>
          </div>
        </Show>
      </div>
      <h1 class="sr-only">Điều Hành Lưới Điện Quốc Gia</h1>
      <TopBar onOpenMenu={props.onOpenMenu} onOpenTutorial={props.onOpenTutorial} />
      <MissionRail onOpenPanel={props.onOpenPanel} />
      <OpsRail onOpenPanel={props.onOpenPanel} />
      <BottomDock onOpenPanel={props.onOpenPanel} />
      <MobileNav />
      <EventModal />
      <ApprovalModal />
      <EndingScreen onNewGame={props.onNewGame} />
      <MonthlyReport />
      <SummaryModal />
      <WorkspaceDrawer
        open={props.workspaceOpen}
        panel={props.workspacePanel}
        onPanel={props.onOpenPanel}
        onClose={props.onCloseWorkspace}
      />
    </>
  );
};
