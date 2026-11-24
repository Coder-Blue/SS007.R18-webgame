import { Link } from "@tanstack/solid-router";
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
    <div class="relative z-10">
      <div class="mx-auto grid w-full max-w-[1240px] items-center gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(360px,0.95fr)]">
        <section class="max-w-[640px]">
          <p class="text-[11px] font-medium text-ink-faint">
            Mô phỏng kinh tế chính trị ngành điện
          </p>
          <h1 class="mt-4 max-w-[15ch] text-balance text-[clamp(36px,5vw,68px)] font-semibold leading-[0.95] tracking-[-0.035em] text-ink">
            Điều Hành Lưới Điện Quốc Gia
          </h1>
          <p class="mt-3 text-sm font-medium text-electric">National Grid Command</p>
          <p class="mt-6 max-w-[56ch] text-[15px] leading-7 text-ink-soft">
            Ba khâu, một lưới, năm năm. Mua điện cạnh tranh ở thượng nguồn, giữ MW ổn định trên
            truyền tải và bán điện dưới trần giá nhà nước.
          </p>
          <div class="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs">
            <span class="title-role inline-flex items-center gap-2 font-medium text-gold">
              <Icon icon="tabler:building-bank" size={15} />
              Tổng giám đốc Tập đoàn Điện lực quốc gia
            </span>
            <span class="text-ink-faint">60 tháng · 5–10 phút</span>
          </div>
          <div class="mt-8 flex flex-col gap-3 sm:flex-row">
            <ActionButton
              variant="primary"
              size="lg"
              icon="lucide:play"
              class="w-full sm:w-auto"
              onClick={props.onStart}
            >
              Bắt đầu nhiệm kỳ
            </ActionButton>
            <ActionButton
              variant="secondary"
              size="lg"
              icon="lucide:clock"
              class="w-full sm:w-auto"
              onClick={props.onContinue}
              disabled={!props.hasSave}
            >
              Tiếp tục nhiệm kỳ đang lưu
            </ActionButton>
          </div>
          <div class="mt-4 flex flex-wrap items-center gap-4">
            <button
              type="button"
              class="min-h-11 text-xs text-ink-faint underline decoration-ink-faint/50 underline-offset-4 transition-colors hover:text-ink"
              onClick={props.onOpenLoad}
            >
              Mở kho lưu
            </button>
            <button
              type="button"
              class="min-h-11 text-xs text-ink-faint underline decoration-ink-faint/50 underline-offset-4 transition-colors hover:text-ink"
              onClick={props.onTutorial}
            >
              Xem hướng dẫn nhập cuộc
            </button>
            <Link
              to="/questions"
              class="inline-flex min-h-11 items-center gap-1.5 text-xs font-medium text-ink-faint underline decoration-ink-faint/50 underline-offset-4 transition-colors hover:text-ink"
            >
              <Icon icon="lucide:book-open" size={15} />
              Câu hỏi trắc nghiệm
            </Link>
          </div>
        </section>

        <aside class="rounded-panel border border-line bg-panel/80 p-5">
          <div class="flex items-baseline justify-between gap-3 border-b border-line pb-3">
            <p class="text-[11px] font-medium text-ink-faint">Lộ trình nhiệm kỳ</p>
            <span class="inline-flex items-center gap-2 text-[11px] text-ink-faint">
              <span class="h-2 w-2 rounded-full bg-green" aria-hidden="true" />
              60 tháng
            </span>
          </div>
          <ol class="divide-y divide-line">
            {acts.map((act) => (
              <li class="grid grid-cols-[40px_minmax(0,1fr)] gap-3 py-3">
                <span class="pt-0.5 font-mono text-[11px] tabular-nums text-electric">
                  {act.id}
                </span>
                <div>
                  <strong class="text-sm font-medium text-ink">{act.title}</strong>
                  <p class="mt-1 text-xs leading-5 text-ink-soft">{act.body}</p>
                </div>
              </li>
            ))}
          </ol>
          <p class="mt-4 text-[11px] text-ink-faint">
            {`Bản mô phỏng chính sách · v${GAME_VERSION}`}
          </p>
        </aside>
      </div>
    </div>
  </div>
);
