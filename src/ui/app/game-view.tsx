import { createSignal } from "solid-js";
import type { JSX } from "@solidjs/web";
import { VillageCanvas } from "../scene/village-canvas";
import { TopBar } from "../hud/top-bar";
import { LeftDock, RightDock } from "../hud/desktop-dock";
import { BottomDock } from "../hud/desktop-bottom";
import { MobileNav, type PanelId } from "../mobile/mobile-nav";
import { WorkspaceModal } from "../modals/workspace-modal";
import { EventModal } from "../modals/event-modal";
import { EndingScreen } from "../modals/ending-screen";
import type { SceneSelection } from "~/scene/create-village-scene";

const GameView = (props: {
  readonly selected: SceneSelection | null;
  readonly onSelect: (selection: SceneSelection) => void;
  readonly onClearSelected: () => void;
  readonly onOpenMenu: () => void;
  readonly onOpenTutorial: () => void;
}): JSX.Element => {
  const [workspaceOpen, setWorkspaceOpen] = createSignal(false);
  const [workspacePanel, setWorkspacePanel] = createSignal<PanelId>("overview");

  const openPanel = (panel: PanelId): void => {
    setWorkspacePanel(panel);
    setWorkspaceOpen(true);
  };

  return (
    <>
      <VillageCanvas onSelect={props.onSelect} />
      <h1 class="sr-only">Độc Quyền Kinh Tế</h1>
      <TopBar onOpenMenu={props.onOpenMenu} onOpenTutorial={props.onOpenTutorial} />
      <LeftDock
        selected={props.selected}
        onClearSelected={props.onClearSelected}
        onOpenPanel={openPanel}
      />
      <RightDock onOpenPanel={openPanel} />
      <BottomDock onOpenPanel={openPanel} />
      <MobileNav />
      <EventModal />
      <EndingScreen />
      <WorkspaceModal
        open={workspaceOpen()}
        panel={workspacePanel()}
        onPanel={(panel) => setWorkspacePanel(panel)}
        onClose={() => setWorkspaceOpen(false)}
      />
    </>
  );
};

export default GameView;
