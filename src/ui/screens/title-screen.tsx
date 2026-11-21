import type { JSX } from "@solidjs/web";
import { ActionButton } from "../components/base";
import { Icon } from "../components/icons";
import { GAME_VERSION } from "~/domain";

export const TitleScreen = (props: {
  readonly hasSave: boolean;
  readonly onStart: () => void;
  readonly onContinue: () => void;
  readonly onOpenLoad: () => void;
  readonly onTutorial: () => void;
}): JSX.Element => (
  <div class="title-screen">
    <div class="title-vignette" />
    <div class="title-content">
      <h1 class="title-main">Độc Quyền Kinh Tế</h1>
      <p class="title-sub">The Rice Monopoly</p>
      <p class="title-tagline">
        Một làng, một mạng đường, một giỏ gạo. Giữ cho dân no, xưởng chạy và ngân sách không sụp.
      </p>
      <div class="title-role">
        <Icon icon="lucide:landmark" size={16} />
        <span>Chủ tịch Tổng công ty Gạo làng</span>
      </div>
      <p class="title-prompt">Nhấn Bắt đầu nhiệm kỳ để vào làng</p>
      <div class="title-actions">
        <ActionButton variant="gold" size="lg" icon="lucide:play" onClick={props.onStart}>
          Bắt đầu nhiệm kỳ
        </ActionButton>
        <ActionButton
          variant="primary"
          size="lg"
          icon="lucide:clock"
          onClick={props.onContinue}
          disabled={!props.hasSave}
        >
          Tiếp tục ván đang lưu
        </ActionButton>
      </div>
      <div class="title-utilities">
        <ActionButton variant="ghost" size="sm" icon="lucide:save" onClick={props.onOpenLoad}>
          Mở kho lưu
        </ActionButton>
        <ActionButton variant="ghost" size="sm" icon="lucide:book-open" onClick={props.onTutorial}>
          Luật chơi
        </ActionButton>
      </div>
      <div class="title-acts">
        <div class="title-act">
          <span>I</span>
          <strong>Hồi I · Bao phủ phổ quát</strong>
          <p>
            Sản xuất tạo gạo, truyền tải đưa gạo đến mọi hộ, bán lẻ thu tiền dưới trần giá. Bạn phải
            giữ cả ba cùng chạy.
          </p>
        </div>
        <div class="title-act">
          <span>II</span>
          <strong>Hồi II · Tranh luận tư nhân hóa</strong>
          <p>
            Bấm Kết thúc tháng để chạy mô phỏng. Bạn có thể mở đường, đầu tư ruộng, nhập gạo và đổi
            giá trước khi kết thúc.
          </p>
        </div>
        <div class="title-act">
          <span>III</span>
          <strong>Hồi III · Phục hồi và hiện đại hóa</strong>
          <p>
            Từ 2024, Decision 05/2024 cho phép đưa lỗ kiểm toán N-2 vào trần giá. Hãy chọn tỷ lệ thu
            hồi đủ để trả nợ mà không làm lạm phát bùng nổ.
          </p>
        </div>
      </div>
      <p class="title-footer">
        Hành trình 2022 – 2026 · Bản mô phỏng kinh tế chính trị · v{GAME_VERSION}
      </p>
    </div>
  </div>
);
