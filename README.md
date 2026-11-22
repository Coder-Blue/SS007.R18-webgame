# Điều Hành Lưới Điện Quốc Gia

**National Grid Command** là trò chơi mô phỏng kinh tế chính trị trên trình
duyệt về một tập đoàn điện lực nhà nước Việt Nam. Người chơi điều hành ba khâu
của hệ thống điện trong 60 tháng (2022–2026): mua điện cạnh tranh ở thượng
nguồn, cân bằng MW trên lưới 500kV/220kV, và bán điện theo biểu giá sáu bậc có
trần của Nhà nước. Hai chỉ số niềm tin và dư nợ 100.000 tỷ đồng là giới hạn
sống còn.

![lint](https://github.com/Coder-Blue/SS007.R18-webgame/actions/workflows/lint.yml/badge.svg)
![test](https://github.com/Coder-Blue/SS007.R18-webgame/actions/workflows/test.yml/badge.svg)

## Ba khâu

- **Sản xuất & mua điện**: ba nhà cung cấp IPP, BOT và than chào giá gần như
  tương đương; thủy điện, nhiệt điện và tái tạo phải khớp phụ tải đỉnh.
- **Truyền tải**: nối 500kV/220kV tới đô thị, khu công nghiệp và vùng nông
  thôn/hải đảo; giữ biên dự phòng trên 15% và độ tin cậy trên 95%.
- **Phân phối**: sáu bậc giá hộ dân lũy tiến, giá công nghiệp trợ cấp và trần
  giá bình quân do Nhà nước thẩm định.

## Cách chơi

1. Bắt đầu nhiệm kỳ và hoàn thành hoặc bỏ qua hướng dẫn nhập cuộc.
2. Chọn nhà cung cấp, điều chỉnh công suất huy động và áp dụng điều độ.
3. Mở tuyến mới tới vùng chưa phủ điện; theo dõi tiến độ trong HUD và trên bản
   đồ 3D.
4. Điều chỉnh biểu giá trong khung cho phép. Tăng đến 5% được thực hiện ngay;
   vượt 5% phải trình Nhà nước và có thể bị từ chối.
5. Dùng Tạm dừng/Tiếp tục, tốc độ 1x/2x/3x, phím `Space` và `1`–`3`.
6. Sau các sự kiện lớn, chọn quyết định hậu sự kiện và theo dõi tiến trình
   thực thi. Hoàn thành ba nhiệm vụ dài hạn để giữ tín nhiệm trước báo chí.

## Vòng lặp mỗi tháng

1. Giá nhiên liệu, hạn hán, nắng nóng và nguồn tái tạo thay đổi.
2. Phụ tải ba vùng và công suất khả dụng quyết định cân bằng MW.
3. Doanh thu điện, doanh thu khác, chi phí cung ứng và chi phí quản lý được ghi
   sổ; nợ và lỗ lũy kế cập nhật.
4. Hai chỉ số niềm tin phản ánh độ tin cậy, giá điện, lạm phát, lỗ và báo chí.
5. Công trình, quyết định và hồ sơ giá chạy theo tiến độ tháng.
6. Sự kiện theo lịch hoặc truyền thông mở ra quyết định tiếp theo.

## Kết thúc

- **Thất bại**: niềm tin người dân về 0%, tín nhiệm thể chế về 0%, dư nợ vượt
  100.000 tỷ, sụp đổ lưới hoặc nhánh tư nhân hóa kéo dài.
- **Hoàn tất nhiệm kỳ**: phủ điện 100%, cải cách N-2/DPPA/VREM và hai chỉ số
  niềm tin đủ cao mở chế độ phục hồi sau năm 5. Nhiệm kỳ được thiết kế để vẫn
  lỗ cấu trúc có kiểm soát, không có lãi trước 2027.

## Công nghệ

SolidJS 2 với `@solidjs/web`, TanStack Start (Solid), TanStack Solid Query 6,
UI SDK cho Solid, Tailwind CSS 4, Be Vietnam Pro, Three.js, GSAP, Valibot,
Vitest, Playwright, oxlint, oxfmt, Lefthook, Nix flakes và Vercel.

Biểu tượng lấy từ Lucide và Tabler qua `@iconify-icon/solid`. Một module ảo của
Vite chỉ đăng ký những biểu tượng trong `icon-names.ts`, nên mã nguồn không có
SVG thủ công và trang không gọi API Iconify.

## Bắt đầu

Yêu cầu: Node.js 24 và pnpm 12. Trên Linux, Nix cùng direnv là đường được hỗ
trợ:

```bash
direnv allow
direnv exec . bash
pnpm install
pnpm dev
```

Mở `http://localhost:3000`.

## Lệnh

| Việc | Lệnh |
| --- | --- |
| Cài đặt | `pnpm install` |
| Dev server | `pnpm dev` |
| Build và typecheck | `pnpm build` |
| Unit test | `pnpm test` |
| Độ phủ domain | `pnpm coverage` |
| Lint | `pnpm lint` |
| Format | `pnpm format` / `pnpm format:check` |
| Ngân sách file | `pnpm check:lines` |
| Ngân sách chunk | `pnpm check:bundle` |
| Kiểm tra emoji | `pnpm check:emoji` |
| Ranh giới layer | `pnpm check:domain` |
| Cổng chất lượng đầy đủ | `pnpm quality` |
| Kiểm tra trình duyệt | `pnpm exec playwright test` |

## Kiến trúc

```
src/
  domain/   kinh tế điện, sự kiện, quyết định, kết thúc; thuần và không DOM
  state/    signal, TanStack Query, lưu trữ, định dạng
  scene/    bản đồ lưới điện Three.js và timeline GSAP
  ui/       component Solid, copy tiếng Việt, icon
  routes/   file route TanStack Start và document shell
```

Hướng phụ thuộc một chiều: `routes -> ui -> state -> domain` và
`scene -> domain`. `domain/` không import `ui/`, `scene/`, `state/`, DOM hay
Three.js. `scene/` nhận snapshot bất biến và không sở hữu luật chơi.

## Chất lượng và đóng góp

Mọi thay đổi phải để lại bằng chứng tái lập được: đầu ra test, coverage, build,
lint/format, kiểm tra viewport hoặc ảnh chụp. Đọc `AGENTS.md`,
`CI_CD_PIPELINE.md` và `CODING_CONVENTION.md` trước khi gửi thay đổi.

## Tài liệu

- `AGENTS.md`: quy tắc vận hành và stack.
- `CODEBASE.md`: bản đồ code và mô hình kinh tế.
- `CODING_CONVENTION.md`: quy ước functional, tiếng Việt và test.
- `CI_CD_PIPELINE.md`: sáu cổng chất lượng và quy trình review.
- `docs/DESIGN.md`: hướng thiết kế, token và quy tắc responsive.
- `AGENT_DIRECTORY.md`: vai trò, skill và quy trình đa agent.
