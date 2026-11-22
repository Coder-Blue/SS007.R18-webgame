import type { JSX } from "@solidjs/web";
import { ActionButton } from "../components/base";
import { Icon } from "../components/icons";
import { GAME_VERSION } from "~/domain";

const acts = [
  {
    id: "1",
    title: "2022 · Mua điện cạnh tranh",
    body: "IPP, BOT và than chào giá gần như tương đương. Chọn nguồn, huy động công suất và giữ dòng tiền trước cú sốc nhiên liệu toàn cầu.",
  },
  {
    id: "2",
    title: "2023 · Hạn hán và phụ tải đỉnh",
    body: "Hồ chứa cạn, nắng nóng kỷ lục. Cân bằng MW, mở lưới tới vùng khó và quyết định có cắt điện luân phiên hay không.",
  },
  {
    id: "3",
    title: "2024–2025 · Tư nhân hóa hay cải cách",
    body: "Người dân nghi ngờ độc quyền. Một nhánh dựng lưới trùng lặp và giá điện tăng vọt; nhánh còn lại đi vào Luật Điện lực sửa đổi.",
  },
  {
    id: "4",
    title: "2025–2026 · N-2 và phục hồi",
    body: "NSMO, DPPA, VREM và công thức thu hồi chi phí N-2 mở ra. Giữ lưới dưới 100.000 tỷ nợ để bước vào chế độ phục hồi sau năm 5.",
  },
] as const;

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
      <p class="title-kicker">
        <Icon icon="tabler:bolt" size={15} />
        Mô phỏng kinh tế chính trị ngành điện
      </p>
      <h1 class="title-main">Điều Hành Lưới Điện Quốc Gia</h1>
      <p class="title-sub">National Grid Command</p>
      <p class="title-tagline">
        Ba khâu, một lưới, năm năm. Mua điện cạnh tranh ở thượng nguồn, giữ MW ổn định trên truyền
        tải và bán điện dưới trần giá nhà nước.
      </p>
      <div class="title-role">
        <Icon icon="tabler:building-bank" size={16} />
        <span>Tổng giám đốc Tập đoàn Điện lực quốc gia</span>
      </div>
      <p class="title-prompt">Nhiệm kỳ 2022 – 2026 · 60 tháng · Khoảng 5–10 phút</p>
      <div class="title-actions">
        <ActionButton variant="primary" size="lg" icon="lucide:play" onClick={props.onStart}>
          Bắt đầu nhiệm kỳ
        </ActionButton>
        <ActionButton
          variant="secondary"
          size="lg"
          icon="lucide:clock"
          onClick={props.onContinue}
          disabled={!props.hasSave}
        >
          Tiếp tục nhiệm kỳ đang lưu
        </ActionButton>
      </div>
      <div class="title-utilities">
        <ActionButton variant="ghost" size="sm" icon="lucide:save" onClick={props.onOpenLoad}>
          Mở kho lưu
        </ActionButton>
        <ActionButton variant="ghost" size="sm" icon="lucide:book-open" onClick={props.onTutorial}>
          Xem hướng dẫn nhập cuộc
        </ActionButton>
      </div>
      <div class="title-acts">
        {acts.map((act) => (
          <div class="title-act">
            <span>{act.id}</span>
            <strong>{act.title}</strong>
            <p>{act.body}</p>
          </div>
        ))}
      </div>
      <p class="title-footer">Hành trình 2022 – 2026 · Bản mô phỏng chính sách · v{GAME_VERSION}</p>
    </div>
  </div>
);
