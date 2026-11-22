import type { JSX } from "@solidjs/web";
import { For, Show, createSignal, createTrackedEffect, onCleanup } from "solid-js";
import {
  Dialog,
  DialogBackdrop,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@ui-sdk/solid/dialog";
import { ActionButton, Badge } from "../components/base";
import { useGame } from "../game-context";
import { Icon, type IconName } from "../components/icons";

type Step = {
  readonly kicker: string;
  readonly title: string;
  readonly body: string;
  readonly targets: readonly string[];
  readonly icon: IconName;
};

const briefing =
  "Bạn được chủ tịch giao cho công việc quản lý nguồn điện trong khu vực. Bạn điều hành các công ty con trong 3 mảng: sản xuất, truyền tải và phân phối. Bạn có các nhiệm vụ cần đạt được là: (1) Phủ điện đến mọi khu vực, (2) Điều hành thị trường điện hợp lý, (3) Đảm bảo an ninh năng lượng. (Mỗi nhiệm vụ sẽ có task lớn tương ứng trong thời gian dài hạn).";

const steps: readonly Step[] = [
  {
    kicker: "Thư giao nhiệm vụ",
    title: "Chủ tịch giao việc",
    body: briefing,
    targets: [],
    icon: "tabler:building-bank",
  },
  {
    kicker: "Bước 1 · Sản xuất & mua điện cạnh tranh",
    title: "Chọn nguồn nhập điện và nhiên liệu",
    body: "Ba nhà cung cấp IPP, BOT và than chào giá gần như tương đương. Chọn nhà cung cấp, đặt mức nhập khẩu và huy động thủy điện/nhiệt điện để giữ chi phí thấp mà vẫn đủ nguồn.",
    targets: ["production", "scene"],
    icon: "tabler:bolt",
  },
  {
    kicker: "Bước 2 · Truyền tải",
    title: "Cân đối phụ tải và mở rộng lưới",
    body: "Theo dõi MW cung cầu, biên dự phòng và độ tin cậy. Nối các tuyến 500kV/220kV tới đô thị, khu công nghiệp và vùng nông thôn để tiến tới phủ điện 100%.",
    targets: ["grid", "scene"],
    icon: "lucide:utility-pole",
  },
  {
    kicker: "Bước 3 · Phân phối",
    title: "Điều tiết biểu giá và theo dõi báo cáo",
    body: "Sáu bậc giá hộ dân và giá công nghiệp trợ cấp quyết định doanh thu và niềm tin. Tăng trên 5% phải trình Nhà nước. Xem dự đoán trước → sau trước khi xác nhận.",
    targets: ["tariffs", "trust"],
    icon: "tabler:scale",
  },
  {
    kicker: "Sẵn sàng",
    title: "Nhiệm kỳ năm năm bắt đầu",
    body: "Dùng nút Tạm dừng/Tiếp tục, chọn tốc độ 1x, 2x, 3x, hoặc phím Space và 1–3. Sự kiện lớn và hồ sơ Nhà nước sẽ tự động tạm dừng. Giữ hai chỉ số niềm tin trên 0% và nợ dưới 100.000 tỷ.",
    targets: ["pause"],
    icon: "lucide:flag",
  },
];

let cleanupSpotlight: (() => void) | null = null;

const spotlight = (targets: readonly string[]): void => {
  cleanupSpotlight?.();
  const marked: HTMLElement[] = [];

  for (const target of targets) {
    const elements = document.querySelectorAll<HTMLElement>(`[data-tutorial="${target}"]`);

    for (const element of elements) {
      element.setAttribute("data-tutorial-active", "true");
      marked.push(element);
    }
  }

  cleanupSpotlight = () => {
    for (const element of marked) element.removeAttribute("data-tutorial-active");
  };
};

export const TutorialModal = (props: {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly onFinish: () => void;
}): JSX.Element => {
  const { store } = useGame();
  const [step, setStep] = createSignal(0);
  let wasOpen = false;
  const current = () => steps[step()] ?? steps[0];

  createTrackedEffect(() => {
    store.setHold(props.open);

    if (props.open && !wasOpen) setStep(0);
    wasOpen = props.open;

    if (!props.open) {
      cleanupSpotlight?.();
      cleanupSpotlight = null;

      return;
    }

    spotlight(current()?.targets ?? []);
  });

  onCleanup(() => {
    cleanupSpotlight?.();
    store.setHold(false);
  });

  const finish = (): void => {
    props.onFinish();
    props.onClose();
  };

  return (
    <Dialog open={props.open} onOpenChange={(open) => (open ? undefined : finish())}>
      <DialogBackdrop class="modal-backdrop tutorial-backdrop" />
      <DialogContent class="modal tutorial-modal">
        <Show when={current()}>
          {(view) => (
            <>
              <div class="tutorial-head">
                <Badge tone="gold">
                  <Icon icon={view().icon} size={14} />
                  {view().kicker}
                </Badge>
                <DialogTitle class="modal-title">{view().title}</DialogTitle>
                <DialogDescription class="modal-desc">{view().body}</DialogDescription>
              </div>
              <div
                class="tutorial-progress"
                role="progressbar"
                aria-label="Tiến độ hướng dẫn"
                aria-valuemin={1}
                aria-valuemax={steps.length}
                aria-valuenow={step() + 1}
                aria-valuetext={`Bước ${step() + 1} trên ${steps.length}`}
              >
                <For each={steps}>
                  {(_, index) => (
                    <span
                      class="tutorial-dot"
                      aria-hidden="true"
                      data-active={index() === step() ? "true" : "false"}
                      data-done={index() < step() ? "true" : "false"}
                    />
                  )}
                </For>
              </div>
              <div class="tutorial-actions">
                <ActionButton variant="ghost" size="sm" onClick={finish}>
                  Bỏ qua hướng dẫn
                </ActionButton>
                <div class="tutorial-next">
                  <Show
                    when={step() < steps.length - 1}
                    fallback={
                      <ActionButton variant="primary" icon="lucide:circle-play" onClick={finish}>
                        Bắt đầu điều hành
                      </ActionButton>
                    }
                  >
                    <ActionButton
                      variant="primary"
                      icon="lucide:chevron-right"
                      onClick={() => setStep(step() + 1)}
                    >
                      Tiếp tục
                    </ActionButton>
                  </Show>
                </div>
              </div>
            </>
          )}
        </Show>
      </DialogContent>
    </Dialog>
  );
};
