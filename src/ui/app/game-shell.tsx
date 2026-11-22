import { createSignal, createTrackedEffect, lazy, Loading, onSettled, Show } from "solid-js";
import type { JSX } from "@solidjs/web";
import { useGame } from "../game-context";
import { TitlePoster } from "../scene/title-poster";
import { TitleScreen } from "../screens/title-screen";
import { Icon } from "../components/icons";
import { hasAnySave, latestSave, readSession, writeSession } from "~/state/persistence";
import type { SceneSelection } from "~/scene/create-village-scene";

const GameView = lazy(() => import("./game-view"));
const SaveMenu = lazy(() => import("../modals/save-menu"), { export: "SaveMenu" });
const TutorialModal = lazy(() => import("../modals/tutorial-modal"), { export: "TutorialModal" });

interface CopyDictionary {
  readonly [key: string]: string;
}

const errorMessages: CopyDictionary = {
  "finance.insufficient": "Không đủ ngân quỹ hoặc hạn mức nợ.",
  "action.at-cap": "Hạng mục này đã đạt mức tối đa.",
  "action.stock-full": "Kho gạo đã đầy.",
  "tariff.missing-tier": "Thiếu bậc giá.",
  "tariff.out-of-band": "Có bậc giá nằm ngoài khung cho phép.",
  "tariff.not-progressive": "Các bậc phải tăng dần.",
  "tariff.workshop-out-of-band": "Giá xưởng nằm ngoài khung.",
  "tariff.above-ceiling": "Giá bình quân vượt trần của Chairman.",
  "policy.too-early": "Chính sách này chỉ mở từ năm 2024.",
  "policy.already-enabled": "Chính sách đã được áp dụng.",
  "policy.not-enabled": "Cần ban hành N-2 trước.",
  "policy.rate-out-of-range": "Tỷ lệ thu hồi phải từ 30% đến 80%.",
  "policy.requires-vrem": "Cần mở VREM trước.",
  "policy.bailout-used": "Bạn chỉ được xin cứu trợ một lần.",
  "game.not-playing": "Ván chơi không ở trạng thái hoạt động.",
  "game.ended": "Ván chơi đã kết thúc.",
  "event.none-active": "Không có sự kiện nào đang chờ.",
  "event.unknown-choice": "Lựa chọn không hợp lệ.",
  "save.empty": "Ô lưu này đang trống.",
  "save.invalid-json": "Tệp không phải JSON hợp lệ.",
  "save.invalid-format": "Tệp lưu không đúng định dạng.",
  "save.invalid-state": "Dữ liệu ván chơi không hợp lệ.",
  "save.storage-unavailable": "Trình duyệt không cho phép lưu trữ.",
  "save.write-failed": "Không ghi được vào bộ nhớ trình duyệt.",
  "tick.event-pending": "Hãy xử lý sự kiện đang chờ trước.",
  "tick.not-playing": "Ván chơi chưa sẵn sàng.",
};

const noticeMessages: CopyDictionary = {
  "notice.shortage": "Thiếu gạo cục bộ. Hài lòng dân làng giảm.",
  "notice.debt": "Dư nợ đã vượt 80% trần. Nguy cơ vỡ nợ.",
  "notice.inflation": "Lạm phát vượt 8%. Chairman đang theo dõi.",
  "notice.coverage": "Mạng đường đã phủ 100% hộ dân.",
  "notice.recovery": "Khoản thu hồi N-2 đã được ghi nhận.",
  "notice.unrest": "Bất ổn gia tăng. Cần ổn định giá và nguồn cung.",
};

const errorMessage = (code: string): string =>
  errorMessages[code] ?? "Thao tác không thực hiện được.";

const noticeMessage = (code: string): string => {
  if (code.startsWith("notice.event:")) return "Một sự kiện mới cần quyết định.";

  return noticeMessages[code] ?? code;
};

const selectionLabel = (selection: string): string => {
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

    setHasSave(hasAnySave());

    if (!prefs.tutorialDone) {
      setTutorialOpen(false);
    }

    return () => {
      if (toastTimer !== undefined) clearTimeout(toastTimer);
    };
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

  const startGame = (): void => {
    actions.newGame();
    setScreen("game");
    setHasSave(true);
    setTutorialOpen(true);
    showToast({ kind: "notice", text: "Nhiệm kỳ mới bắt đầu." });
  };

  const continueGame = (): void => {
    const latest = latestSave();

    if (latest !== null) {
      store.setState(latest.state);
      setScreen("game");
      showToast({ kind: "notice", text: "Đã tải ván chơi." });

      return;
    }

    startGame();
  };

  const onLoaded = (): void => {
    setScreen("game");
    setHasSave(true);
  };

  const sceneSelect = (selection: SceneSelection): void => {
    setSelected(selection);
    showToast({ kind: "notice", text: `Đã chọn ${selectionLabel(selection)}` });
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
              Đang mở bàn điều hành…
            </div>
          }
        >
          <GameView
            selected={selected()}
            onSelect={sceneSelect}
            onClearSelected={() => setSelected(null)}
            onOpenMenu={() => setMenuOpen(true)}
            onOpenTutorial={() => setTutorialOpen(true)}
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
      <Show when={tutorialOpen()}>
        <Loading fallback={null}>
          <TutorialModal open onClose={() => setTutorialOpen(false)} onFinish={markTutorial} />
        </Loading>
      </Show>
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
    </main>
  );
};
