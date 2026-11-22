import {
  createSignal,
  createTrackedEffect,
  lazy,
  Loading,
  onCleanup,
  onSettled,
  Show,
} from "solid-js";
import type { JSX } from "@solidjs/web";
import { useGame } from "../game-context";
import { TitlePoster } from "../scene/title-poster";
import { TitleScreen } from "../screens/title-screen";
import { Icon } from "../components/icons";
import { hasAnySave, latestSave, readSession, writeSession } from "~/state/persistence";
import type { SceneSelection } from "~/scene/create-power-scene";
import { TutorialModal } from "../modals/tutorial-modal";
import type { PanelId } from "../mobile/mobile-nav";

const GameView = lazy(() => import("./game-view"), { export: "GameView" });
const SaveMenu = lazy(() => import("../modals/save-menu"), { export: "SaveMenu" });

const errorMessages = new Map<string, string>([
  ["finance.insufficient", "Không đủ ngân quỹ hoặc hạn mức nợ."],
  ["action.at-cap", "Hạng mục này đã đạt mức tối đa."],
  ["project.queue-full", "Chỉ được chạy tối đa ba công trình cùng lúc."],
  ["project.pending", "Đã có công trình cùng loại đang chạy."],
  ["tariff.missing-tier", "Thiếu bậc giá."],
  ["tariff.invalid-value", "Có bậc giá không hợp lệ."],
  ["tariff.out-of-band", "Có bậc giá nằm ngoài khung cho phép."],
  ["tariff.not-progressive", "Các bậc phải tăng dần."],
  ["tariff.industrial-out-of-band", "Giá công nghiệp nằm ngoài khung."],
  ["tariff.above-ceiling", "Giá bình quân vượt trần của Nhà nước."],
  ["tariff.no-authority", "Trần giá đã bị bãi bỏ, bạn không còn quyền điều chỉnh."],
  ["policy.too-early", "Chính sách này chưa mở trong giai đoạn hiện tại."],
  ["policy.already-enabled", "Chính sách đã được áp dụng."],
  ["policy.requires-petition", "Cần hoàn tất kiến nghị chính sách giá trước."],
  ["policy.requires-vrem", "Cần mở VREM trước."],
  ["policy.rate-out-of-range", "Tỷ lệ thu hồi phải từ 30% đến 80%."],
  ["policy.no-authority", "Nhánh tư nhân hóa không còn thẩm quyền chính sách."],
  ["decision.unavailable", "Quyết định này chưa được mở khóa."],
  ["decision.completed", "Quyết định đã hoàn tất."],
  ["decision.pending", "Quyết định đang được thực hiện."],
  ["decision.unknown", "Quyết định không hợp lệ."],
  ["supplier.unknown", "Nhà cung cấp không hợp lệ."],
  ["approval.none-pending", "Không có hồ sơ nào đang chờ."],
  ["game.not-playing", "Nhiệm kỳ không ở trạng thái hoạt động."],
  ["game.ended", "Nhiệm kỳ đã kết thúc."],
  ["event.none-active", "Không có sự kiện nào đang chờ."],
  ["event.unknown", "Sự kiện không hợp lệ."],
  ["event.unknown-choice", "Lựa chọn không hợp lệ."],
  ["tick.event-pending", "Hãy xử lý sự kiện đang chờ trước."],
  ["tick.approval-pending", "Hãy xử lý hồ sơ giá đang chờ trước."],
  ["tick.not-playing", "Nhiệm kỳ chưa sẵn sàng."],
  ["save.empty", "Ô lưu này đang trống."],
  ["save.invalid-json", "Tệp không phải JSON hợp lệ."],
  ["save.invalid-format", "Tệp lưu không đúng định dạng."],
  ["save.invalid-state", "Dữ liệu nhiệm kỳ không hợp lệ."],
  ["save.storage-unavailable", "Trình duyệt không cho phép lưu trữ."],
  ["save.write-failed", "Không ghi được vào bộ nhớ trình duyệt."],
]);

const noticeMessages = new Map<string, string>([
  ["notice.shortage", "Thiếu hụt công suất. Độ tin cậy lưới giảm."],
  ["notice.blackout", "Độ tin cậy xuống dưới 90%. Nguy cơ cắt điện luân phiên."],
  ["notice.reserve", "Biên dự phòng dưới 5%. Lưới đang rất mỏng."],
  ["notice.debt", "Dư nợ đã vượt 80% trần. Nguy cơ vỡ nợ."],
  ["notice.media", "Truyền thông đưa tin lỗ EVN. Niềm tin dân giảm nhanh."],
  ["notice.privatization", "Nhánh tư nhân hóa: lưới trùng lặp và giá điện mất trần."],
]);

const errorMessage = (code: string): string =>
  errorMessages.get(code) ?? "Thao tác không thực hiện được.";

const noticeMessage = (code: string): string => {
  if (code.startsWith("notice.event:")) return "Một sự kiện mới cần quyết định.";

  if (code.startsWith("notice.mission:")) return "Hoàn thành một nhiệm vụ dài hạn. Tín nhiệm tăng.";

  if (code.startsWith("notice.project:")) return "Một công trình đã hoàn tất.";

  return noticeMessages.get(code) ?? code;
};

const selectionLabel = (selection: string): string => {
  switch (selection) {
    case "hydro":
      return "Cụm thủy điện";
    case "thermal":
      return "Nhà máy nhiệt điện";
    case "renewable":
      return "Trang trại tái tạo";
    case "substation":
      return "Trạm biến áp";
    case "urban":
      return "Phụ tải đô thị";
    case "industrial":
      return "Khu công nghiệp";
    default:
      return "Phụ tải nông thôn";
  }
};

type Screen = "title" | "game";

type ToastState = {
  readonly kind: "notice" | "error";
  readonly text: string;
};

const markTutorial = (): void => {
  const prefs = readSession();
  writeSession({ ...prefs, tutorialDone: true });
};

export const GameShell = (): JSX.Element => {
  const { store, actions } = useGame();
  const [screen, setScreen] = createSignal<Screen>("title");
  const [hasSave, setHasSave] = createSignal(false);
  const [menuOpen, setMenuOpen] = createSignal(false);
  const [tutorialOpen, setTutorialOpen] = createSignal(false);
  const [selected, setSelected] = createSignal<SceneSelection | null>(null);
  const [toast, setToast] = createSignal<ToastState | null>(null);
  const [workspaceOpen, setWorkspaceOpen] = createSignal(false);
  const [workspacePanel, setWorkspacePanel] = createSignal<PanelId>("overview");
  let toastTimer: ReturnType<typeof setTimeout> | undefined;

  const showToast = (next: ToastState): void => {
    setToast(next);

    if (toastTimer !== undefined) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => setToast(null), 4_600);
  };

  const openPanel = (panel: PanelId): void => {
    setWorkspacePanel(panel);
    setWorkspaceOpen(true);
  };

  onSettled(() => {
    const prefs = readSession();

    if (typeof document !== "undefined") {
      document.documentElement.dataset.motion = prefs.reducedMotion ? "reduced" : "full";
    }

    setHasSave(hasAnySave());
    store.setSpeed(prefs.speed);

    const onKey = (event: KeyboardEvent): void => {
      if (screen() !== "game") return;
      const target = event.target;

      if (target instanceof HTMLElement) {
        const tag = target.tagName;

        if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || target.isContentEditable) {
          return;
        }
      }

      if (event.code === "Space") {
        event.preventDefault();
        store.togglePause();

        return;
      }

      if (event.key === "1") store.setSpeed(1);

      if (event.key === "2") store.setSpeed(2);

      if (event.key === "3") store.setSpeed(3);
    };

    window.addEventListener("keydown", onKey);
    onCleanup(() => window.removeEventListener("keydown", onKey));
  });

  createTrackedEffect(() => {
    const error = store.lastError();

    if (error !== null) showToast({ kind: "error", text: errorMessage(error) });
  });

  createTrackedEffect(() => {
    const notice = store.notice();

    if (notice !== null) {
      showToast({ kind: "notice", text: noticeMessage(notice) });
      store.clearNotice();
    }
  });

  createTrackedEffect(() => {
    writeSession({ ...readSession(), speed: store.speed(), paused: !store.running() });
  });

  onCleanup(() => {
    if (toastTimer !== undefined) clearTimeout(toastTimer);
  });

  const startGame = (): void => {
    actions.newGame();
    setScreen("game");
    setHasSave(true);
    store.setSpeed(1);
    setTutorialOpen(true);
    showToast({ kind: "notice", text: "Nhiệm kỳ mới bắt đầu. Mô phỏng đang tạm dừng." });
  };

  const continueGame = (): void => {
    const latest = latestSave();

    if (latest !== null) {
      store.setState(latest.state);
      store.setSpeed(readSession().speed);
      setScreen("game");
      showToast({ kind: "notice", text: "Đã tải nhiệm kỳ đang lưu." });

      if (!readSession().tutorialDone) setTutorialOpen(true);
      else
        store.setRunning(latest.state.events.activeId === null && latest.state.approval === null);

      return;
    }

    startGame();
  };

  const onLoaded = (): void => {
    setScreen("game");
    setHasSave(true);
    store.setSpeed(readSession().speed);
  };

  const finishTutorial = (): void => {
    markTutorial();
    setTutorialOpen(false);
    store.setRunning(store.state().events.activeId === null && store.state().approval === null);
  };

  return (
    <main class="game-shell" data-screen={screen()}>
      <Show when={screen() === "title"}>
        <TitlePoster />
      </Show>
      <Show when={screen() === "game"}>
        <Loading
          fallback={
            <div class="scene-loading" role="status" aria-live="polite">
              Đang khởi động trung tâm điều độ…
            </div>
          }
        >
          <GameView
            workspaceOpen={workspaceOpen()}
            workspacePanel={workspacePanel()}
            onOpenPanel={openPanel}
            onCloseWorkspace={() => setWorkspaceOpen(false)}
            onOpenMenu={() => setMenuOpen(true)}
            onOpenTutorial={() => setTutorialOpen(true)}
            onSelect={(selection) => {
              setSelected(selection);
              showToast({ kind: "notice", text: `Đã chọn ${selectionLabel(selection)}` });
            }}
          />
        </Loading>
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
      <Show when={menuOpen()}>
        <Loading fallback={null}>
          <SaveMenu
            open
            onClose={() => setMenuOpen(false)}
            onNotice={(message) => showToast({ kind: "notice", text: message })}
            onLoaded={onLoaded}
          />
        </Loading>
      </Show>
      <TutorialModal
        open={tutorialOpen()}
        onClose={() => setTutorialOpen(false)}
        onFinish={finishTutorial}
        onOpenPanel={openPanel}
      />
      <Show when={toast()}>
        {(current) => (
          <div class="toast" data-kind={current().kind} role="status" aria-live="polite">
            <Icon
              icon={current().kind === "error" ? "tabler:alert-triangle" : "lucide:check"}
              size={17}
            />
            <span>{current().text}</span>
          </div>
        )}
      </Show>
      <Show when={selected() !== null}>
        <div class="scene-selection" role="status">
          <Icon icon="lucide:map-pin" size={16} />
          <span>{selectionLabel(selected() ?? "")}</span>
          <button type="button" class="text-link" onClick={() => setSelected(null)}>
            Bỏ chọn
          </button>
        </div>
      </Show>
    </main>
  );
};
