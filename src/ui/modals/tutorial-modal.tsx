import { createSignal, For, Show } from "solid-js";
import type { JSX } from "@solidjs/web";
import {
  Dialog,
  DialogBackdrop,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@ui-sdk/solid/dialog";
import { ActionButton, IconButton } from "../components/base";
import { Icon, type IconName } from "../components/icons";

const steps: readonly { readonly title: string; readonly body: string; readonly icon: IconName }[] =
  [
    {
      title: "Ba trụ cột của làng",
      body: "Sản xuất tạo gạo, truyền tải đưa gạo đến mọi hộ, bán lẻ thu tiền dưới trần giá. Bạn phải giữ cả ba cùng chạy.",
      icon: "tabler:wheat",
    },
    {
      title: "Mỗi tháng là một quyết định",
      body: "Bấm Kết thúc tháng để chạy mô phỏng. Bạn có thể mở đường, đầu tư ruộng, nhập gạo và đổi giá trước khi kết thúc.",
      icon: "lucide:calendar",
    },
    {
      title: "Giá thấp hơn chi phí",
      body: "Bạn mua gạo tư nhân theo giá thị trường nhưng bán dưới trần. Lỗ có thể là cố ý, nhưng đừng để nợ vượt trần.",
      icon: "lucide:scale",
    },
    {
      title: "N-2 là phao cứu sinh",
      body: "Từ 2024, Decision 05/2024 cho phép đưa lỗ kiểm toán N-2 vào trần giá. Hãy chọn tỷ lệ thu hồi đủ để trả nợ mà không làm lạm phát bùng nổ.",
      icon: "lucide:landmark",
    },
    {
      title: "Đừng bỏ quên bản xa",
      body: "Bao phủ 100% là nhiệm vụ an sinh và là điều kiện để đạt kết thúc Kiến trúc sư an ninh quốc gia.",
      icon: "lucide:map-pin",
    },
  ];

export const TutorialModal = (props: {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly onFinish: () => void;
}): JSX.Element => {
  const [index, setIndex] = createSignal(0);
  const current = () => steps[index()] ?? steps[0]!;

  const close = (): void => {
    props.onFinish();
    props.onClose();
  };

  return (
    <Dialog open={props.open} onOpenChange={(open) => (open ? undefined : props.onClose())}>
      <DialogBackdrop class="modal-backdrop" />
      <DialogContent class="modal tutorial-modal">
        <div class="tutorial-head">
          <span class="tutorial-icon">
            <Icon icon={current().icon} size={24} />
          </span>
          <div>
            <p class="eyebrow">Sổ tay Chủ tịch</p>
            <DialogTitle class="modal-title">{current().title}</DialogTitle>
          </div>
          <IconButton icon="lucide:x" label="Bỏ qua hướng dẫn" onClick={close} />
        </div>
        <DialogDescription class="modal-desc">{current().body}</DialogDescription>
        <div class="tutorial-progress">
          <For each={steps}>
            {(_step, stepIndex) => (
              <span class="tutorial-dot" data-active={stepIndex() === index()} />
            )}
          </For>
        </div>
        <div class="modal-actions">
          <Show when={index() > 0}>
            <ActionButton variant="ghost" onClick={() => setIndex(index() - 1)}>
              Quay lại
            </ActionButton>
          </Show>
          <ActionButton
            variant="gold"
            onClick={() => {
              if (index() >= steps.length - 1) close();
              else setIndex(index() + 1);
            }}
          >
            {index() >= steps.length - 1 ? "Vào điều hành" : "Tiếp tục"}
          </ActionButton>
        </div>
        <p class="modal-hint">{`Bước ${index() + 1}/${steps.length}`}</p>
      </DialogContent>
    </Dialog>
  );
};
