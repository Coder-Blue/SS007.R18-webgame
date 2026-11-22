import type { JSX } from "@solidjs/web";
import { For, Show } from "solid-js";
import {
  Dialog,
  DialogBackdrop,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@ui-sdk/solid/dialog";
import { useGame } from "../game-context";
import { Badge, ActionButton } from "../components/base";
import { Icon } from "../components/icons";
import type { EventId } from "~/domain";

type Copy = {
  readonly kicker: string;
  readonly title: string;
  readonly body: string;
  readonly choices: Readonly<
    Record<
      string,
      {
        readonly label: string;
        readonly body: string;
        readonly tone: "good" | "warn" | "bad" | "gold";
      }
    >
  >;
};

const copy: Readonly<Record<EventId, Copy>> = {
  "fuel-crisis": {
    kicker: "Sự kiện lớn 1 · 2022",
    title: "Khủng hoảng nhiên liệu toàn cầu",
    body: "Giá than, khí và dầu thế giới tăng vọt cùng tỷ giá. Nhiệt điện và các hợp đồng BOT đội chi phí, trong khi giá bán lẻ vẫn bị giữ trần.",
    choices: {
      "hedge-crisis": {
        label: "Chốt hợp đồng phòng ngừa",
        body: "Chi thêm tiền mặt ngay để giảm một phần cú sốc nhiên liệu và mở toàn bộ quyết định hậu sự kiện.",
        tone: "gold",
      },
      "ride-out-crisis": {
        label: "Chịu cú sốc và xoay nguồn",
        body: "Giữ tiền mặt, để giá nhiên liệu tăng mạnh hơn và niềm tin dân giảm. Đổi lại mở toàn bộ quyết định hậu sự kiện.",
        tone: "warn",
      },
    },
  },
  "summer-drought": {
    kicker: "Sự kiện lớn 2 · Hè 2023",
    title: "Hạn hán và mùa hè cực đoan",
    body: "El Niño kéo hồ chứa xuống gần mực nước chết đúng lúc nắng nóng kỷ lục đẩy phụ tải điều hòa lên đỉnh.",
    choices: {
      "protect-reservoir": {
        label: "Giữ nước cho cuối mùa",
        body: "Hạn chế xả hồ, chấp nhận thiếu hụt ngắn hạn và mất niềm tin. Mở các quyết định ứng phó hạn hán.",
        tone: "warn",
      },
      "maximize-hydro": {
        label: "Xả tối đa thủy điện",
        body: "Dùng nước rẻ để cứu phụ tải, thu thêm tiền mặt nhưng hồ chứa cạn nhanh trước mùa khô.",
        tone: "gold",
      },
    },
  },
  "public-skepticism": {
    kicker: "Sự kiện lớn 3 · 2025",
    title: "Người dân nghi ngờ",
    body: "Báo chí chất vấn hiệu quả của độc quyền nhà nước. Hai con đường mở ra: tư nhân hóa toàn bộ ngành điện hoặc tiếp tục cải cách có kiểm soát.",
    choices: {
      "privatize-grid": {
        label: "Tư nhân hóa toàn bộ",
        body: "Nhánh giả định: nhiều công ty tư nhân chen vào, lưới trùng lặp, giá điện mất trần và vùng khó có thể bị cắt điện.",
        tone: "bad",
      },
      "reform-path": {
        label: "Thay đổi chính sách",
        body: "Tiếp tục nhánh nhà nước, mở đường cho Luật Điện lực sửa đổi, DPPA và VREM.",
        tone: "good",
      },
    },
  },
  "revised-law": {
    kicker: "Sự kiện lớn 4 · 2025–2026",
    title: "Luật Điện lực sửa đổi có hiệu lực",
    body: "Quốc hội thông qua luật mới: tách điều độ sang NSMO, mở DPPA, lộ trình VREM và công thức thu hồi chi phí N-2.",
    choices: {
      "enact-law": {
        label: "Ban hành ngay",
        body: "Kích hoạt N-2, NSMO, DPPA và VREM. Niềm tin thể chế tăng, lỗ lũy kế có cơ hội được thu hồi.",
        tone: "good",
      },
      "delay-law": {
        label: "Trì hoãn để ổn định",
        body: "Giữ nguyên cơ chế cũ, mất tín nhiệm thể chế và để lạm phát trôi.",
        tone: "bad",
      },
    },
  },
  "media-losses": {
    kicker: "Sự kiện truyền thông",
    title: "Truyền thông đưa tin về lỗ của EVN",
    body: "Báo chí đồng loạt đưa tin về khoản lỗ và nợ của tập đoàn. Một hiệu ứng duy nhất được kích hoạt: niềm tin người dân giảm nhanh hơn mỗi tháng.",
    choices: {
      "acknowledge-media": {
        label: "Ghi nhận sức ép",
        body: "Mở đợt suy giảm niềm tin tăng tốc trong ba tháng. Không có hình phạt phụ nào khác.",
        tone: "warn",
      },
    },
  },
};

const choiceTone = (tone: "good" | "warn" | "bad" | "gold"): "good" | "warn" | "bad" | "gold" =>
  tone;

export const EventModal = (): JSX.Element => {
  const { store, actions } = useGame();
  const activeId = () => store.state().events.activeId;

  const event = () => {
    const id = activeId();

    return id === null ? null : copy[id];
  };

  return (
    <Dialog open={activeId() !== null}>
      <DialogBackdrop class="modal-backdrop" />
      <DialogContent class="modal event-modal">
        <Show when={event()}>
          {(current) => (
            <>
              <div class="event-head">
                <Badge tone="bad" pulse>
                  <Icon icon="tabler:alert-triangle" size={14} />
                  {current().kicker}
                </Badge>
                <DialogTitle class="modal-title">{current().title}</DialogTitle>
                <DialogDescription class="modal-desc">{current().body}</DialogDescription>
              </div>
              <div class="event-choices">
                <For each={Object.entries(current().choices)}>
                  {([id, choice]) => (
                    <div class="event-choice" data-tone={choiceTone(choice.tone)}>
                      <div class="event-choice-copy">
                        <strong>{choice.label}</strong>
                        <span>{choice.body}</span>
                      </div>
                      <ActionButton
                        variant={
                          choice.tone === "bad"
                            ? "danger"
                            : choice.tone === "gold"
                              ? "gold"
                              : "primary"
                        }
                        icon="lucide:arrow-right"
                        onClick={() => actions.resolve(id)}
                      >
                        Chọn
                      </ActionButton>
                    </div>
                  )}
                </For>
              </div>
              <p class="modal-footnote">
                <Icon icon="tabler:clock-pause" size={14} />
                Mô phỏng đang tạm dừng. Tốc độ trước đó sẽ được khôi phục sau khi bạn quyết định.
              </p>
            </>
          )}
        </Show>
      </DialogContent>
    </Dialog>
  );
};
