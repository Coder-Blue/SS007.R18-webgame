import { createSignal, createTrackedEffect, onSettled, Show } from "solid-js";
import type { JSX } from "@solidjs/web";
import { useGame } from "../game-context";
import { VillageCanvas } from "../scene/village-canvas";
import { TopBar } from "../hud/top-bar";
import { LeftDock, RightDock } from "../hud/desktop-dock";
import { BottomDock } from "../hud/desktop-bottom";
import { MobileNav, type PanelId } from "../mobile/mobile-nav";
import { WorkspaceModal } from "../modals/workspace-modal";
import { SaveMenu } from "../modals/save-menu";
import { TutorialModal } from "../modals/tutorial-modal";
import { EventModal } from "../modals/event-modal";
import { EndingScreen } from "../modals/ending-screen";
import { TitleScreen } from "../screens/title-screen";
import { Icon } from "../components/icons";
import { errorText, noticeText, t } from "../localization";
import { latestSave, readSession, writeSession } from "~/state/persistence";
import type { SceneSelection } from "~/scene/create-village-scene";

type Screen = "title" | "game";

interface ToastState {
  readonly kind: "notice" | "error";
  readonly text: string;
}

const markTutorial = (): void => {
  const prefs = readSession();
  writeSession({ ...prefs, tutorialDone: true });
};

export const GameShell = (): JSX.Element => {
  const { store, actions } = useGame();
  const [screen, setScreen] = createSignal<Screen>("title");
  const [hasSave, setHasSave] = createSignal(false);
  const [menuOpen, setMenuOpen] = createSignal(false);
  const [workspaceOpen, setWorkspaceOpen] = createSignal(false);
  const [workspacePanel, setWorkspacePanel] = createSignal<PanelId>("overview");
  const [tutorialOpen, setTutorialOpen] = createSignal(false);
  const [selected, setSelected] = createSignal<SceneSelection | null>(null);
  const [toast, setToast] = createSignal<ToastState | null>(null);
  let toastTimer: ReturnType<typeof setTimeout> | undefined;

  const showToast = (next: ToastState): void => {
    setToast(next);

    if (toastTimer !== undefined) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => setToast(null), 4_200);
  };

  onSettled(() => {
    const prefs = readSession();

    if (typeof document !== "undefined") {
      document.documentElement.dataset.motion = prefs.reducedMotion ? "reduced" : "full";
    }

    setHasSave(latestSave() !== null);

    if (!prefs.tutorialDone) {
      setTutorialOpen(false);
    }

    return () => {
      if (toastTimer !== undefined) clearTimeout(toastTimer);
    };
  });

  createTrackedEffect(() => {
    const error = store.lastError();

    if (error !== null) showToast({ kind: "error", text: errorText(error) });
  });
  createTrackedEffect(() => {
    const notice = store.notice();

    if (notice !== null) {
      showToast({ kind: "notice", text: noticeText(notice) });
      store.clearNotice();
    }
  });

  const startGame = (): void => {
    actions.newGame();
    setScreen("game");
    setHasSave(true);
    setTutorialOpen(true);
    showToast({ kind: "notice", text: t("notice.newGame") });
  };

  const continueGame = (): void => {
    const latest = latestSave();

    if (latest !== null) {
      store.setState(latest.state);
      setScreen("game");
      showToast({ kind: "notice", text: t("notice.loaded") });

      return;
    }

    startGame();
  };

  const onLoaded = (): void => {
    setScreen("game");
    setHasSave(true);
  };

  const openPanel = (panel: PanelId): void => {
    setWorkspacePanel(panel);
    setWorkspaceOpen(true);
  };

  const sceneSelect = (selection: SceneSelection): void => {
    setSelected(selection);
    showToast({ kind: "notice", text: t("scene.select", { name: t(`scene.${selection}`) }) });
  };

  return (
    <div class="game-shell" data-screen={screen()}>
      <VillageCanvas onSelect={sceneSelect} />
      <Show when={screen() === "game"}>
        <TopBar onOpenMenu={() => setMenuOpen(true)} onOpenTutorial={() => setTutorialOpen(true)} />
        <LeftDock
          selected={selected()}
          onClearSelected={() => setSelected(null)}
          onOpenPanel={openPanel}
        />
        <RightDock onOpenPanel={openPanel} />
        <BottomDock onOpenPanel={openPanel} />
        <MobileNav />
        <EventModal />
        <EndingScreen />
      </Show>
      <Show when={screen() === "title"}>
        <TitleScreen
          hasSave={hasSave()}
          onStart={startGame}
          onContinue={continueGame}
          onOpenLoad={() => setMenuOpen(true)}
          onTutorial={() => setTutorialOpen(true)}
        />
      </Show>
      <WorkspaceModal
        open={workspaceOpen()}
        panel={workspacePanel()}
        onPanel={(panel) => setWorkspacePanel(panel)}
        onClose={() => setWorkspaceOpen(false)}
      />
      <SaveMenu
        open={menuOpen()}
        onClose={() => setMenuOpen(false)}
        onNotice={(message) => showToast({ kind: "notice", text: message })}
        onLoaded={onLoaded}
      />
      <TutorialModal
        open={tutorialOpen()}
        onClose={() => setTutorialOpen(false)}
        onFinish={markTutorial}
      />
      <Show when={toast()}>
        {(current) => (
          <div class="toast" data-kind={current().kind} role="status" aria-live="polite">
            <Icon name={current().kind === "error" ? "alert" : "check"} size={17} />
            <span>{current().text}</span>
          </div>
        )}
      </Show>
    </div>
  );
};
