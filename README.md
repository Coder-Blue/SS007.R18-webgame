# Độc Quyền Kinh Tế

**The Rice Monopoly** là một trò chơi quản lý trên trình duyệt về một tập đoàn
gạo nhà nước trong ngôi làng Việt Nam đang công nghiệp hóa. Ngôi làng là ẩn dụ
cho hệ thống điện Việt Nam: trồng lúa là sản xuất, mạng đường độc quyền là
truyền tải, và giá gạo bán lẻ có trần là phân phối. Người chơi điều hành tập
đoàn qua năm năm, giữ ánh sáng cho mọi nhà, kiềm chế lạm phát và đưa bảng cân
đối thoát khỏi thâm hụt cấu trúc.

![lint](https://github.com/Coder-Blue/SS007.R18-webgame/actions/workflows/lint.yml/badge.svg)
![test](https://github.com/Coder-Blue/SS007.R18-webgame/actions/workflows/test.yml/badge.svg)

## Ba trụ cột

- **Sản xuất**: ruộng nước, ruộng cơ giới, nông hộ tư nhân, hạn hán và phân bón
  nhập khẩu.
- **Truyền tải**: mạng đường độc quyền phải phủ tới từng hộ, kể cả những căn
  nhà trên núi xa nhất.
- **Phân phối**: bốn bậc giá hộ dân lũy tiến, giá xưởng được trợ cấp sâu và
  trần giá bán lẻ do Chủ tịch áp đặt.

Người chơi phải giữ đủ gạo, giữ lạm phát trong tầm kiểm soát, làm hài lòng hộ
dân và xưởng, duy trì tín nhiệm của Chủ tịch và thoát khỏi khoản lỗ cấu trúc
ngày càng sâu trong hai năm đầu. Cải cách 2024 cho phép khoản lỗ N-2 đã kiểm
toán quay lại qua trần giá mà không gây sốc giá.

## Cách chơi

1. Bắt đầu nhiệm kỳ và đọc hướng dẫn năm bước.
2. Mở dự án đường ở thanh bên trái hoặc trong bảng Giao thông. Đường nhựa phủ
   tới nhà xa nhanh nhất.
3. Đầu tư ruộng nước và ruộng cơ giới trước các năm hạn hán; tự sản xuất rẻ
   hơn mua toàn bộ gạo từ nông hộ tư nhân.
4. Giữ giá hộ dân bình quân trong trần của Chủ tịch. Dùng bốn thanh trượt bậc
   giá và giá xưởng một cách có chủ đích.
5. Năm 2024, ban hành Quyết định 05/2024, sau đó bổ sung DPPA và VREM. Phí
   truyền tải và khoản thu hồi N-2 là đòn bẩy phục hồi.
6. Dùng nút kết thúc tháng. Kho lưu, tự động lưu và xuất JSON nằm trong menu
   lưu. Camera kéo bằng chuột hoặc một ngón tay; thu phóng bằng cuộn chuột hoặc
   hai ngón tay.

## Vòng lặp mỗi tháng

1. Giá thị trường và thời tiết thay đổi.
2. Hộ dân và xưởng phát sinh nhu cầu gạo.
3. Ruộng của tập đoàn sản xuất; nông hộ tư nhân chào bán nguồn cung bên ngoài.
4. Người chơi mua, bán dưới trần giá và ghi nhận kết quả.
5. Độ hài lòng, tín nhiệm, lạm phát và dư nợ thay đổi.
6. Sự kiện buộc người chơi ra quyết định; cải cách 2024 mở khóa thu hồi N-2.

Xây đường, mở rộng sản xuất, đặt giá cẩn thận và chọn hướng đi trong cuộc tranh
luận tư nhân hóa. Kết thúc phụ thuộc vào thứ người chơi bảo vệ.

## Kết thúc

- **Kiến trúc sư**: dư nợ không quá 25.000 tỷ, phủ đường toàn bộ, có cải cách
  N-2, DPPA và VREM, tín nhiệm và độ hài lòng đủ cao.
- **Kẻ săn mồi**: ngân quỹ lớn trong khi hộ dân và xưởng trì trệ.
- **Sụp đổ**: mất khả năng thanh toán, bất ổn, bị miễn nhiệm hoặc tư nhân hóa
  sớm dẫn tới khủng hoảng nguồn cung kiểu California/Texas.

## Công nghệ

SolidJS 2 với `@solidjs/web`, TanStack Start (Solid), TanStack Solid Query 6,
UI SDK cho Solid, Tailwind CSS 4 với `@apply` và bảng màu oklch, Be Vietnam Pro,
Three.js, GSAP, Valibot, Vitest, Playwright, oxlint, oxfmt, Lefthook, Nix flakes
và Vercel.

Biểu tượng lấy từ Lucide và Tabler qua `@iconify-icon/solid`, dùng tên chuẩn như
`icon="lucide:circle-exclamation-point"`. Một module ảo của Vite đọc
`@iconify-json/lucide` và `@iconify-json/tabler` lúc build và chỉ đăng ký những
biểu tượng trò chơi dùng, nên mã nguồn không chứa SVG thủ công và trang không
gọi API Iconify.

## Bắt đầu

Yêu cầu: Node.js 24, pnpm 12 và một môi trường Nix có direnv.

```bash
direnv allow
pnpm install
pnpm dev
```

Mở `http://localhost:3000`. `pnpm install` cũng cài hook Lefthook. Kiểm tra
trình duyệt cần `nix develop .#playwright` để có Chromium và thư viện hệ thống.

## Lệnh

| Lệnh | Mục đích |
| --- | --- |
| `pnpm build` | Build production và kiểm tra TypeScript |
| `pnpm test` | Chạy Vitest |
| `pnpm coverage` | Cổng độ phủ miền nghiệp vụ |
| `pnpm lint` | oxlint cùng bộ luật anti-slop |
| `pnpm format` | Định dạng bằng oxfmt |
| `pnpm check:lines` | Giới hạn 500 dòng mỗi tệp nguồn |
| `pnpm check:emoji` | Chặn emoji trong mã, giao diện và tài liệu |
| `pnpm check:domain` | Kiểm tra ranh giới lớp thuần |
| `pnpm quality` | Toàn bộ cổng tĩnh, độ phủ và build |
| `pnpm exec playwright test` | Kiểm tra trình duyệt ở bốn kích thước |

## Kiến trúc

```text
src/
  domain/   kiểu, kinh tế, sự kiện, hành động, kết thúc; thuần, không DOM
  state/    signal, điều phối TanStack Query, bộ lưu trữ
  scene/    renderer isometric Three.js và timeline GSAP
  ui/       thành phần Solid, hook, từ điển tiếng Việt, biểu tượng
  routes/   file route TanStack Start và khung tài liệu
```

Hướng phụ thuộc một chiều: `routes -> ui -> state -> domain` và
`scene -> domain`. `domain/` không bao giờ nhập `ui/`, `scene/`, `state/`, biến
toàn cục trình duyệt hay Three.js. `scene/` chỉ nhận ảnh chụp bất biến và không
sở hữu luật chơi. Lưu trữ là adapter trong `state/` và kiểm tra JSON nhập bằng
Valibot.

## Chất lượng và đóng góp

Mọi thay đổi phải để lại bằng chứng tái lập được: đầu ra kiểm thử, bảng độ phủ,
kết quả build, trạng thái lint/format, kiểm tra viewport hoặc ảnh chụp màn hình.

- `lint` và `test` là hai workflow GitHub bắt buộc; trạng thái của chúng hiện
  trong mục Deployments qua môi trường `Lint` và `Test`.
- Hook `pre-commit` chạy lint, kiểm tra định dạng, giới hạn dòng, emoji, ranh
  giới lớp và Vitest. `pre-push` chạy toàn bộ `pnpm quality`.
- Một agent khác với tác giả phải review và gắn nhãn
  `approved-by-thermo-nuclear-review` trước khi auto-merge.
- Quy ước chi tiết nằm trong [.github/CONTRIBUTING.md](.github/CONTRIBUTING.md).

## Tài liệu

- `AGENTS.md`: luật cho mọi runtime agent.
- `CODEBASE.md`: kiến trúc và mô hình kinh tế đã triển khai.
- `AGENT_DIRECTORY.md`: danh sách vai trò, kỹ năng và quy trình Herdr.
- `docs/GAME_DESIGN.md`: cơ chế và cân bằng chi tiết.
- `docs/DEVELOPMENT.md`: quy trình địa phương, bản lưu và kiểm chứng.
- `docs/VERIFICATION.md`: bằng chứng cổng và rủi ro còn lại.
- `docs/adr/0001-solid2-tanstack-start.md`: lý do tồn tại bản vá Solid 2.
- `SKILL.md`: ma trận kỹ năng, Graphify và ghi chú ui-sdk.
- `CODING_CONVENTION.md`, `CI_CD_PIPELINE.md`.
