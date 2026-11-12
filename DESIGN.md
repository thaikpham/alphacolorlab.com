---
name: Alpha Console
description: Trang tiếng Việt cài máy ảnh Sony, lấy đồ thị kiến thức làm lối đi chính. Giao diện sáng, chấm và khung lấy nét làm ngôn ngữ hình ảnh.
colors:
  bg: "#f3f4f6"
  card: "#ffffff"
  label: "#0b0d12"
  secondary: "#4a5260"
  tertiary: "#7c8594"
  separator: "#e3e6eb"
  fill: "rgb(11 13 18 / 0.05)"
  fill-strong: "rgb(11 13 18 / 0.09)"
  accent: "#f05a14"
  on-accent: "#0b0d12"
  accent-text: "#b43f00"
  app-console: "#f05a14"
  app-colors: "#0789b0"
  app-wiki: "#0b9468"
  app-blog: "#5a55d6"
  warning: "#a84e00"
  success: "#127a3a"
  danger: "#c8261b"
typography:
  family: "Noto Sans (tự host, public/fonts)"
  footnote: "13px / 19px"
  subhead: "15px / 22px"
  callout: "16px / 24px"
  body: "17px / 27px"
  title3: "20px / 28px"
  title: "clamp(28px, 4vw, 40px) / 1.12, -0.03em"
  display: "clamp(40px, 7vw, 76px) / 1.02, -0.045em"
rounded:
  card: "24px"
  control: "14px"
  badge: "8px"
---

# Design System: Alpha Console

> Nguồn token duy nhất: `app/globals.css` (khối `@theme`). File này mô tả token và luật dùng. Hai nơi lệch nhau thì sửa cả hai trong cùng một thay đổi. Kiểm tra tự động: `npm run check:design` (chạy trước mỗi `npm run build`).

## Overview

**Creative North Star: "Kính ngắm trong studio"**

Người dùng mang máy ảnh của họ tới, và trang dựng quanh chính bộ máy đó. Mọi nội dung (bước cài, công thức màu, sản phẩm, bài viết) là một nút trong đồ thị; người dùng đi bằng cách chọn nút, không phải đọc danh sách dài. Hình ảnh mượn từ kính ngắm máy Sony: chấm, khung lấy nét bốn góc, bộ đếm số khung. Nền sáng như bàn studio, chữ gần đen, một màu cam Alpha làm tín hiệu.

Chỉ có giao diện sáng. Không có chế độ tối.

**Key Characteristics:**
- Landing "/": không có thanh điều hướng, không tiêu đề hiển thị (chỉ `h1` cho trình đọc màn hình). Thứ tự: (1) lớp giới thiệu `#gioi-thieu` phủ trên đồ thị tổng hợp ngay khi mở trang (`-mt-viewport`, token `--spacing-viewport` = 100dvh; `.intro-overlay` trắng 85%, 30% cuối trong dần): tiêu đề "alphacolorlab.com" với chữ "color" tô dải màu Alpha + 4 app chạy và đổi sắc (`.hue-text`), 2 câu giới thiệu chung cho mọi máy Sony Alpha (`landing.intro.lines`, xuống hàng cố định từ md, không nêu tên mẫu máy), không có nút hành động (nội dung nằm giữa màn), quầng trắng `.intro-glow` và viền chữ `.over-graph`; mũi tên màu `label` có quầng trắng (đổi từ trắng sang đậm cho dễ thấy), nhún nhảy ở cạnh dưới (`ScrollHint`, `.scroll-hint`). (2) Mốc `#do-thi`: đồ thị tổng hợp (`LandingGraph`: sticky, `h-dvh`, không nút zoom) hiện trọn. Dưới lớp giới thiệu nó zoom gần làm nền (`1.3 ** 3`), cuộn quá nửa màn thì lùi mềm về vừa khung (`zoom` 1, cả màn dọc) để thấy cả hình. Ở mốc này mới hiện (`data-graph-view` + `.graph-hint`/`.graph-legend`): chỉ dẫn lần đầu, chú giải màu ở góc trên trái (để không che đồ thị) và hai nút ở góc dưới phải: nút kính lúp bật/tắt ô tìm kiếm ở trên phải (dưới lg nằm ngay dưới chú giải) (`SearchField`, ô tìm duy nhất của landing; mở là con trỏ vào luôn, Esc để đóng) và nút chế độ xem (icon khung bốn góc + dot meter 3 chấm), bấm để xoay vòng 3 chế độ: (1) toàn bộ đồ thị vừa khung, (2) phóng to 1.6 lần, (3) chỉ một app vừa khung (app xem gần nhất, chưa xem app nào thì Alpha Console). Chế độ 3 chính là lọc theo app của chú giải: bấm một app ở chú giải cũng vào chế độ 3, bấm lại app đó thì về chế độ 1. Đang chọn nút hoặc đã zoom tay thì lần bấm đầu chỉ đưa về chế độ xem hiện tại. Mặt nút cao 32px `bg-card shadow-thumb`, vùng chạm 44px. Khi chờ, mỗi app chỉ hiện nhãn 4 nút chính nhiều liên kết nhất (2 ở màn hẹp hơn 640px; `quietLabels`). (3) Màn cuối `#bat-dau` (gộp túi đồ và 4 app, gọn trong một màn hình): section nền `bg` cao một màn hình trượt lên che đồ thị, không tiêu đề hiển thị (`h2` cho trình đọc màn hình); `max-w-5xl`, từ lg 2 cột bằng nhau, dưới lg xếp dọc. Cột trái: thẻ túi đồ `GearManager` (tiêu đề "Bắt đầu với bộ máy của bạn", nút "Thêm" nền xám; `compact`: món đã thêm gói trong một dòng "Trong túi: …" cắt gọn để màn luôn vừa một màn hình, bỏ món thì sang `/tai-khoan`), dưới là đăng nhập (`LandingStart`): nút xám "Đăng nhập bằng Google" + nút "i" (`landing.start.syncTip`, nói rõ không bắt buộc); đã đăng nhập thì hiện tên và nút xám "Hồ sơ và túi đồ" (`/tai-khoan`); bản chưa bật đăng nhập thì ẩn. Cột phải: một thẻ `rounded-card bg-card shadow-card divide-y divide-separator` gồm 4 hàng `LinkRow` (chấm màu app + tên app, mô tả `landing.apps` luôn hiện, chevron; bấm hàng mở app), dưới là nút cam "Mở Alpha Console", nút cam duy nhất của màn. Túi có món thì cạnh nút đăng nhập có nút xám "Xem túi đồ trên đồ thị" (`BagOnGraph`): lướt lên mốc đồ thị và chọn sẵn một món trong túi (ưu tiên máy ảnh), không mở trang. Landing không còn đồ thị nhỏ của từng app. Mốc dừng khi cuộn: đầu trang, `#do-thi`, `#bat-dau`, cuối trang (`lib/scrollStops.ts`): lăn một nấc ở mốc thì lướt tới mốc kề, cuộn/vuốt dừng lưng chừng thì đi nốt theo hướng vừa cuộn, đoạn cao hơn 1.15 màn hình cuộn tự do; lướt bằng rAF easeInOutCubic 550–950ms, đặt vị trí `behavior: "instant"` từng khung (html có `scroll-behavior: smooth`); không dùng CSS scroll-snap. Glow, gradient chữ và lớp phủ trong suốt ở đây là ngoại lệ người dùng yêu cầu (2026-11-10), chỉ ở landing; mọi chuyển động tắt khi `prefers-reduced-motion`.
- Landing là flow 3 bước, không cuộn (đổi 2026-11-12; thay cho mọi mô tả cuộn, mốc dừng, `ScrollHint`, `#do-thi`, `data-graph-view` ở các mục trên và dưới): cả trang cao đúng `h-dvh`, `LandingFlow` giữ bước đang đứng (`data-step`). Bước 1 giới thiệu phủ trên đồ thị (zoom gần làm nền); bước 2 nền `bg` che đồ thị, một cột giữa `max-w-2xl` (thẻ túi đồ, đăng nhập Google, ghi chú xám kèm dòng in đậm "Để tiếp tục, bạn cần …" khi còn thiếu), nội dung cao hơn màn thì cuộn trong khung; bước 3 đồ thị vừa khung đã lọc theo túi đồ. Chuyển bước chỉ bằng nút: dưới phải là nút cam của bước ("Bắt đầu", "Tiếp tục" bị khóa `bg-fill-strong text-secondary` tới khi đã lưu túi đồ và đăng nhập, bước 3 là `EnterLink`); dưới trái là nút quay lại (mặt 32px `bg-card shadow-thumb`) và viên đếm bước (dot meter 3 chấm + "2/3", ẩn dưới sm). Ở bước 3: chú giải 4 app trên trái; nút avatar (viên tròn `bg-card shadow-thumb`, mở menu người dùng như ở các app) sát góc trên phải, bên trái nó là kính lúp và nút chế độ xem (dưới sm hai nút này xuống hàng thứ hai vì chú giải 2×2 chiếm bề ngang, avatar vẫn ở hàng đầu); ô tìm mở ra ngay dưới hai nút đó. Các nút của đồ thị ẩn ở bước 1 và 2 (`.landing-flow:not([data-step="3"]) .graph-legend`).
- Thứ tự màn của landing (đổi 2026-11-12, thay cho thứ tự ghi trong mục trên): (1) lớp giới thiệu, (2) màn túi đồ `#bat-dau`, (3) mốc đồ thị `#do-thi` ở cuối trang. Đồ thị dính nền suốt trang, màn túi đồ (nền `bg`) che nó ở giữa; dưới lớp giới thiệu và trước mốc đồ thị nửa màn thì đồ thị zoom gần làm nền. Mốc dừng khi cuộn: đầu trang, `#bat-dau`, `#do-thi`. Mũi tên ở lớp giới thiệu lướt tới `#bat-dau`.
- Bố cục hai màn sau của landing (đổi 2026-11-12, thay cho mô tả 2 cột và danh sách 4 app ở mục trên): màn túi đồ `#bat-dau` là một cột giữa `max-w-2xl`: thẻ túi đồ, hàng đăng nhập Google, rồi một ghi chú xám (`rounded-control bg-fill`, `landing.start.note`) nói nội dung sẽ được tối ưu theo sản phẩm đang sở hữu; không còn danh sách 4 app và nút "Xem túi đồ trên đồ thị". Nút cam `EnterLink` chuyển sang màn đồ thị, đứng ngay cạnh chú giải 4 app ở góc trên trái (dưới xl xuống hàng dưới chú giải): đích là app đang chọn ở chú giải, chưa chọn thì Alpha Console. Đây là nút cam duy nhất của màn đồ thị. Ô tìm kiếm mở ra ở trên phải từ xl, dưới xl nằm dưới chú giải và nút cam.
- Thẻ túi đồ ở landing (`GearManager compact`): món nhập vào nằm trong bản nháp và hiện thành lưới ảnh nhỏ theo phân loại (4 cột, 6 cột từ sm; ô `rounded-control` viền `separator`, ảnh `aspect-[4/3]`, tên `text-footnote`, dấu bỏ ở góc; vùng lưới cao tối đa `max-h-72` rồi cuộn). Bấm một ô để bỏ món. Nút xám "Lưu túi đồ" chỉ bật khi bản nháp khác túi đã lưu; lưu xong đổi thành "Đã lưu túi đồ".
- Cá nhân hóa theo túi đồ: nút cam của landing khi túi đã lưu có món là "Tối ưu nội dung và Truy cập". Segmented "Của tôi / Tất cả" (`PersonalToggle`): ở đầu danh sách Blog và Color Bank (Product Wiki không lọc, luôn hiện đủ sản phẩm) là rãnh `bg-fill` núm `bg-card shadow-thumb` kèm nút "i". Trên đồ thị không có nút riêng: bật tắt bằng hàng "Nội dung" trong menu avatar. Bước 3 của landing luôn mở ở "Của tôi" (sang bước 3 thì bỏ lựa chọn "Tất cả" đã lưu). Menu avatar có thêm một hàng "Nội dung hiển thị" cùng kiểu hàng Danh sách/Lưới (nhãn trái, hai núm chữ `rounded-badge` trong rãnh `bg-fill rounded-control`), hiện khi túi có món kể cả khi chưa từng bật.
- Nút cam của landing (`EnterLink`, chỉ ở màn cuối, dưới danh sách 4 app) đổi theo người dùng (`entryModel` trong `lib/gear.ts`): người mới "Mở Alpha Console" (`/console`); túi đồ có máy được hướng dẫn thì "Cài <máy>" và vào thẳng máy đó (`/console?model=<id>`, ưu tiên máy đang chọn nếu nó nằm trong túi, không thì máy thêm sau cùng); người đã chọn máy từ lần trước thì "Tiếp tục với <máy>".
- Không có cổng đăng nhập: mọi trang mở tự do. Đăng nhập Google chỉ đồng bộ dữ liệu theo tài khoản (`lib/userState.ts`). Ngoại lệ: `/admin/decode` chỉ hiện bảng khi phiên Google có email trong `ADMIN_EMAILS` (kiểm trên máy chủ, `/admin/decode/data`).
- Mỗi app là danh sách 2 cột: index bên trái, nội dung chi tiết bên phải (`SplitLayout`), trừ `/wiki` và `/blog` khi ở Lưới (mặc định, xem "Lưới index"). Alpha Console ở `/console`.
- Cột trái Alpha Console (`ConsoleIndex`): `ModelPicker` không có nhãn trạng thái, chỉ có chữ. Tên máy và dòng phụ mỗi thứ một dòng, cắt bằng `truncate`. Máy đã giải mã có nút phụ "Tạo bộ M1–M4" (`h-11 rounded-full bg-fill text-accent-text`) cạnh `details`, là anh em chứ không lồng trong `summary`; hàng hẹp thì nút xuống dòng riêng dưới hàng (`flex-wrap`, `details` `min-w-48`). Mục Công cụ chỉ hiện cho máy đã giải mã (`data-model-only`); máy khác không thấy mục này.
- Đồ thị của từng app còn là trang riêng `/do-thi/[app]`, mở từ menu avatar ("Xem đồ thị"). Mọi đồ thị cùng kiểu, cùng chức năng (một component `Constellation`).
- Nền `bg` trắng lạnh, thẻ `card` trắng có viền tóc. Không gradient, không phát sáng.
- Một màu nhấn `accent` (cam Alpha) cho hành động chính, trạng thái chọn và focus. Chữ trên nền cam là `on-accent` (gần đen), không dùng chữ trắng.
- Mỗi app một màu nhận diện (`app-*`), chỉ dùng cho nút đồ thị và chấm nhận diện. Không làm nền nút.
- Noto Sans là font duy nhất, tự host, chạy offline.
- Chuyển động mềm, chậm, tắt hết khi `prefers-reduced-motion`.

## Colors

| Token | Giá trị | Dùng cho |
|---|---|---|
| `bg` | #f3f4f6 | Nền trang, sân khấu đồ thị |
| `card` | #ffffff | Thẻ, thanh điều hướng, hộp thoại |
| `label` | #0b0d12 | Chữ chính, nhãn trên đồ thị |
| `secondary` | #4a5260 | Chữ phụ (7.9:1 trên card) |
| `tertiary` | #7c8594 | Chỉ trang trí: nút lá trên đồ thị, chấm trống, icon mờ. Không dùng cho chữ |
| `separator` | #e3e6eb | Đường kẻ, viền ô |
| `fill` / `fill-strong` | đen 5% / 9% | Chip, rãnh segmented, nền nút phụ / hover |
| `accent` | #f05a14 | Nền nút chính, chấm tín hiệu, khung chọn, vòng focus |
| `on-accent` | #0b0d12 | Chữ và icon trên nền `accent` (5.7:1) |
| `accent-text` | #b43f00 | Chữ và link màu nhấn trên nền sáng (5.8:1) |
| `app-console` / `app-colors` / `app-wiki` / `app-blog` | cam / xanh lục lam / xanh lá / chàm | Nút chính trên đồ thị của app, chấm cạnh tên app. ≥3:1 trên bg |
| `warning`, `success`, `danger` (+ `-fill`) | | Ghi chú cảnh báo, trạng thái, lỗi |

### Named Rules
- **Một nút cam mỗi màn.** Hành động chính duy nhất dùng `bg-accent text-on-accent`. Nút phụ dùng `bg-fill text-label`.
- **Màu app không phải màu nút.** `app-*` chỉ vẽ chấm và nút đồ thị.
- **Không chữ xám nhạt.** Chữ đọc được tối thiểu là `secondary`. Người dùng đã phản ánh chữ xám nhạt khó đọc.

## Typography

Noto Sans biến thiên 100–900 (SIL OFL), file ở `public/fonts`, `@font-face` trong `app/globals.css`, preload bản Latin và tiếng Việt trong `app/layout.tsx`.

| Vai trò | Utility | Độ đậm |
|---|---|---|
| Tiêu đề lớn | `text-display` | `font-light` (300), tracking âm sẵn trong token |
| Tiêu đề trang | `text-title` | `font-normal` |
| Tiêu đề nhóm | `text-title3` | `font-medium` |
| Nội dung | `text-body` | `font-normal` |
| Nhãn, nút | `text-subhead`, `text-callout` | `font-semibold` |
| Chú thích | `text-footnote` | `font-medium` |

### Named Rules
- Tiêu đề lớn nét mảnh, nội dung nét thường. Không dùng nét 200 trở xuống cho chữ đọc.
- Số đếm (3/6, bước 04) dùng `tabular-nums`.
- Không viết hoa toàn bộ, không eyebrow trên tiêu đề.

## Layout

- Từ `lg`: chỉ có thanh điều hướng dọc bên trái (`w-sidebar`): logo + avatar, tìm kiếm, 4 app, rồi index của app đang mở. Không có thanh trên cùng. Dưới `lg` (điện thoại, máy gập, tablet dọc): thanh trên cùng `h-14` và thanh tab 4 app ở dưới.
- Mỗi app: master–detail (`SplitLayout`) ở md+; điện thoại thấy danh sách, chọn mục thì sang trang chi tiết.
- Trang đồ thị `/do-thi/[app]`: sân khấu full chiều rộng, cao `h-stage` ở lg+, `h-stage-phone` dưới lg (trừ thêm thanh tab dưới). Mở từ trang chi tiết thì đồ thị chọn sẵn đúng nút của trang đó (`?n=<id>`, id = đoạn cuối URL).
- Trang danh sách của app khi chưa chọn mục nào: cột phải để trống (chỉ có `h1` cho trình đọc màn hình), không lời nhắc "Chọn một…". Khi Lưới ở `/wiki` và `/blog` (xem "Lưới index") không có cột phải: header và lưới thẻ nằm trong luồng trang. Riêng Alpha Console (`/console`) cột phải là danh sách Bộ M1–M4 chia sẻ (md+).
- Bài viết và ghi chú kiến thức trải hết cột phải, lề trong `px-4 sm:px-6 md:px-8 xl:px-12`; không giới hạn `max-w-2xl`. Mục lục và liên kết liên quan chiếm cột 18rem bên phải từ xl.
- Trang sản phẩm (Product Wiki): một cột duy nhất trải hết cột phải: tên, tóm tắt, ảnh (khung `aspect-[21/9]` từ sm), thông số, bài nhắc đến, bình luận.
- Xem ở 390px, 840px, 1440px.

## Elevation & Depth

Hai mức: `shadow-card` (viền tóc + bóng 1–2px) cho thẻ; `shadow-thumb` cho núm segmented và lớp nổi (popover, gợi ý tìm kiếm). Không bóng màu, không glow. Thanh điều hướng là lớp kính mờ duy nhất.

## Shapes

`rounded-card` 24px cho thẻ và sân khấu; `rounded-control` 14px cho ô nhập; `rounded-full` cho nút, chip, segmented; `rounded-badge` 8px cho nhãn nhỏ.

## Components

### Constellation (signature)
`app/components/Constellation.tsx`. Đồ thị 3D vẽ trên canvas, dữ liệu từ `lib/appGraphs.ts`, kiểu ở `lib/constellation.ts`.
- Đồ thị luôn tràn viền: không thẻ, không bo góc, không bóng, không khung bao quanh. Bố cục 3D trải đều các nút trong khối cầu (`lib/layout3d.ts`) để thoáng mắt: lực hút về tâm đủ mạnh (`CENTER` 0.1) để mật độ đều khắp khối, không lõi dày rìa thưa; `test/layout3d.test.ts` giữ mức đều này cho đồ thị tổng hợp.
- Chú giải màu (`legend`, chỉ đồ thị tổng hợp ở landing): một viên `bg-card shadow-thumb` ở góc trên trái, 4 nút chấm màu + tên app (hàng ngang từ sm, lưới 2×2 dưới sm, cao 44px, `aria-pressed`). Bấm một app thì nút và cạnh ngoài app đó mờ còn 12%/8%, nhãn chỉ còn của app đó, camera bay tới tâm cụm nút của app và zoom vừa khung riêng cụm đó (phần mờ có thể tràn ra ngoài khung); bấm lại để bỏ và về toàn cảnh. Không làm dừng trạng thái chờ. App đang lọc nằm trong URL (`?app=wiki`), mở link là thấy đúng trạng thái.
- Tâm của chế độ xem: camera lúc chờ luôn đặt ở tâm các nút màu (nút chính), đang lọc theo app thì tâm nút màu của app đó; đồ thị xoay và zoom quanh tâm này ở mọi mức. Áp cho mọi đồ thị.
- Nút là chấm. Nút chính mang màu app; nút lá màu `tertiary`; nút trong túi đồ của người dùng có vòng chấm ngoài.
- Cạnh là đường chấm cong nhẹ, màu `tertiary` (độ đậm 55%); cạnh của nút đang chọn mang màu app.
- Tín hiệu: chấm sáng có đuôi chạy dọc liên kết giữa hai nút như xung thần kinh, chiều và màu ngẫu nhiên trong bảng màu (`accent`, `app-*`). Đang chọn nút thì phần lớn tín hiệu chạy trên liên kết của nút đó.
- Phối cảnh thật: chấm, nét cạnh và cỡ chữ tỉ lệ với độ sâu (`depthScale`, `depthFog`, `depthFont` trong `lib/constellationView.ts`). Khi xoay, nút tới gần to và đậm lên, đi xa nhỏ và nhạt dần (chấm, cạnh và chữ cùng một độ đậm theo độ sâu: mặt sau khối ~30%, giữa ~60%, mặt trước 100%; người dùng chọn chữ xa nhạt dần cho giống thật; nút đang chọn và nút kề luôn đậm 100%). Vẽ từ xa tới gần.
- Nhãn chữ thường, nét thường (400): 13px ở độ sâu giữa, 11–17px theo độ sâu (làm tròn 0.5px); nút đang chọn cố định 15px. Nhãn chồng nhau thì chỉ vẽ nhãn ưu tiên hơn (nút chọn, nút kề, nút chính, túi đồ, rồi nút gần camera; `selectLabelsToRender` trong `lib/constellationView.ts`).
- Trạng thái chờ: mới mở, đồ thị tự xoay chậm quanh trục đứng như trái đất và luôn vừa khung. Hết khi người dùng chạm, kéo, lăn để zoom, bấm phím, tìm hay chọn nút. Góc dưới phải chỉ có hai nút zoom nhỏ (mặt 32px, vùng chạm 44px), không có nút Toàn cảnh. Đồ thị tổng hợp ở landing tắt hai nút này (`controls={false}`). Bố cục đã được cho lực dàn lại một nhịp lúc build nên mở ra là cân. Không tự chọn nút nào, trừ khi URL có `?n=`. Bỏ chọn (bấm nền, Esc) thì về toàn cảnh và xoay lại.
- Chỉ dẫn lần đầu: đồ thị lớn hiện một viên chỉ dẫn ở đáy ("Bấm một nút để chọn, bấm lần nữa để mở", bản cảm ứng dùng "Chạm"), tắt ở lần tương tác đầu và nhớ trong `localStorage` (`graph-hint-seen-<app>`).
- Chọn nút: nút bay về giữa, khung lấy nét bốn góc khóa vào nút, các nút nối với nó xếp thành vòng đều, phần còn lại lùi ra và mờ còn 12%.
- Bấm (hoặc chạm) lần hai vào nút đang chọn thì mở trang. Rê chuột lên nút đang chọn hiện chỉ dẫn "Bấm lần nữa để mở"; trên màn cảm ứng chỉ dẫn hiện ngay sau lần chạm đầu.
- Kéo nền để xoay, kéo nút để dời, lăn chuột hoặc hai ngón để zoom. Bấm nền để về toàn cảnh.
- Trang cuộn được (landing): lăn chuột để cuộn trang, Ctrl/⌘ + lăn hoặc chụm trackpad để zoom; trên cảm ứng vuốt dọc cuộn trang, vuốt ngang xoay.
- Các nút đung đưa rất nhẹ; tắt khi `prefers-reduced-motion`, dừng vẽ khi khuất màn hình.
- Máy chậm (lần vẽ đầu hoặc trung bình trượt quá 12 ms, `SLOW_MS`): không bật tự xoay, đung đưa, tín hiệu và không đặt hẹn nào sau khi vẽ. Đồ thị đứng yên, chỉ vẽ lại khi chạm, lăn, tìm, lọc hoặc đổi cỡ. Máy nhanh giữ chuyển động.
- Tìm nút bằng thanh tìm kiếm chung trên thanh điều hướng (nhóm gợi ý "Trên đồ thị").
- Bàn phím: canvas nhận Tab, mũi tên đi qua các nút kề, Enter chọn rồi mở, Esc về toàn cảnh. Có vùng `aria-live` đọc nút đang chọn.
- Màu đọc từ biến CSS `--color-*`, không viết cứng trong component.

### AF bracket (khung lấy nét)
Bốn góc vuông mảnh, như khung theo dõi lấy nét trên máy Sony. Chỉ dùng cho nút đang chọn trên đồ thị. Avatar trên khung hồ sơ (`ProfileShell`) là hình tròn, không có khung này. Không bao quanh cả đồ thị, không dùng như trang trí ở chỗ khác.

### Dot meter
Hàng chấm đếm theo bước hoặc tiến độ, chấm đầy màu `accent`, chấm trống `separator`, kèm số dạng `tabular-nums`. Túi đồ không dùng (không giới hạn số món).

### Gear bag (túi đồ)
`GearManager`: một ô nhập tên hoặc mã (có gợi ý) và nút Thêm; không liệt kê catalog, không giới hạn số món. Món không có trong dự án thì hộp thoại "Sản phẩm này chưa được hỗ trợ". Đặt trong trang hồ sơ `/tai-khoan`. Chạy cả khi chưa đăng nhập.

### Profile (hồ sơ)
`/tai-khoan` (menu avatar › Hồ sơ và túi đồ): chỗ người dùng khoe túi đồ, dựng trên `ProfileShell` và `ProfileView` như `/ho-so` và `/kol/[handle]`, theo kiểu trang mạng xã hội. Thẻ tiêu đề: ảnh bìa (hoặc dải xám), avatar Google đè lên bìa, tên, @username, dòng đếm máy/ống kính/phụ kiện, hàng nút: Chia sẻ hồ sơ (nút cam duy nhất), Sửa hồ sơ (xám); thanh tab ở đáy thẻ. Thân trang: cột trái (từ lg, rộng `w-sidebar`) là thẻ Giới thiệu (tiểu sử và liên kết chỉ http/https, tối đa 5, dạng viên; khi sửa, form thay phần đọc trong thẻ, không có thẻ riêng; KOL có hồ sơ thì form đó là `KolIdentityForm`, xem KOL) và thẻ Tài khoản (đồng bộ, Đăng nhập/Đăng xuất); dưới lg cột trái đứng trước. KOL có hồ sơ thì cuối thẻ Giới thiệu (khi đang đọc) có link xám Xem trang công khai (`h-11`, mở `/kol/<handle>` ở tab mới), ngăn bằng đường kẻ; không đặt ở hàng nút đầu thẻ vì chật tên. Cột phải là panel của tab đang mở. KOL đăng nhập thì đầu cột phải có ô bộ M1–M4 (`KolWall`, ngoài tab, dùng `KolSetModule`); người khác không mount ô này nên không gọi `getMyKol` hay `listMySets`, và không thấy gì mới. Khi đang soạn bộ trên tường, hàng nút đầu thẻ (Chia sẻ, Sửa hồ sơ) ẩn, nút "Đổi ảnh bìa" ẩn, thanh tab và các panel ẩn bằng `hidden` (vẫn mounted), trình soạn thay cột phải; đóng hoặc lưu thì focus trả về nút đã mở. Các trình soạn mở cùng lúc được, không khóa theo form hồ sơ. Tab "Túi đồ" (đếm món): thông báo hoàn tác (khi vừa bỏ món), ô Thêm đồ (nút xám), rồi lưới thẻ món: ảnh sản phẩm (`aspect-[4/3]`, `object-contain`), tên, mã; bấm vào mở Product Wiki; nút bỏ chỉ hiện khi đang sửa. Tab "Bộ đã sưu tầm" (chỉ hiện khi có bộ; KOL luôn thấy tab, kể cả khi trống, với dòng `kolSets.savedEmpty`): mỗi hàng là `SetRow` với tên tác giả ở cuối hàng và nút "Bỏ sưu tầm" xám thay nút sưu tầm. Thanh tab chỉ hiện khi có từ hai tab. `/ho-so` (chỉ xem) dùng cùng khung, không có thanh tab và không có thẻ Tài khoản; nút cam duy nhất là "Tạo túi đồ của bạn". Chia sẻ tạo link `/ho-so#<dữ liệu>` (hồ sơ + túi đồ nén trong phần #, không cần server); `/ho-so` chỉ xem và kiểm tra lại mọi trường (`lib/profile.ts`). Hồ sơ lưu `localStorage` (`user-profile`), đồng bộ theo tài khoản. Túi đồ lưu trong `localStorage` (`gear-bag`), đồng bộ theo tài khoản qua `lib/userState.ts`.

### Profile tabs
`ProfileTabs.tsx` (`ProfileTabs`, `ProfileTabPanel`, `useActiveTab`): thanh tab gạch chân ở đáy thẻ tiêu đề hồ sơ (`/tai-khoan`, `/kol/[handle]`), role `tablist`/`tab`, `aria-selected`, roving tabindex, Trái/Phải/Home/End. Chỉ hiện khi có từ hai tab. KOL trên `/tai-khoan` có ba tab theo thứ tự Túi đồ, Bộ đã sưu tầm, Ảnh mẫu (đếm `n/12`); không có tab riêng cho hồ sơ KOL, hồ sơ sửa ở thẻ Giới thiệu; thanh tab cuộn ngang khi hết chỗ (390px) và tab đang mở được cuộn vào khung. Tab đang mở có gạch chân `accent` và chữ `label`, tab khác chữ `secondary`. Gạch chân là chỉ báo, không phải nút cam. Panel không mở vẫn được mount, chỉ ẩn bằng `hidden`. Khi đang soạn bộ trên tường KOL của `/tai-khoan`, cả thanh tab lẫn panel ẩn. Lựa chọn loại trừ dùng segmented control, không dùng thanh tab.

### Bộ M1–M4 chia sẻ
`app/components/PresetSetList.tsx` (`PresetSetList`), `PresetSets.tsx` (`KolSetGroups`, `SetRow`, `SaveSetButton`), `PresetSetActions.tsx`, trang `/bo-m1-m4` (máy chưa giải mã thấy thẻ "Công cụ này dùng cho ZV-E10" và nút "Tôi dùng ZV-E10", không thấy danh sách), `/bo-m1-m4/[id]` và cột phải `/console` (chỉ khi máy đang chọn đã giải mã; mặc định ZV-E10). Đầu danh sách là mục "Bộ từ KOL" (`kolSets.fromKol`): một danh sách phẳng, bộ KOL mới nhất trước, không nhóm theo tác giả, tải sau khi trang mở (đang tải thì một hàng xám); không có bộ KOL thì ẩn cả mục. Dưới đó là mục "Bộ có sẵn" (`kolSets.fromSite`): các bộ trong repo, một thẻ. Mỗi hàng: tên bộ, tên tác giả ở cuối hàng (`secondary`), nút "Sưu tầm" xám (đổi thành "Đã sưu tầm" khi đã sưu tầm). Bộ `unlisted: true` (checkbox ở `/admin`) không vào danh sách, không mở được `/bo-m1-m4/[id]` và không lên `/kol/[handle]`, nhưng id vẫn bị chiếm và bộ vẫn có ở Tạo bộ M1–M4; khi không còn bộ nào hiện sau khi tải thì chỉ hiện dòng "Chưa có bộ nào được chia sẻ." (không thẻ trống). Trang bộ: thẻ đầu gồm mô tả bộ, hàng tác giả (avatar hoặc chữ cái đầu, tên, @handle, liên kết) và nút sưu tầm; thẻ "Cài đặt từng ô": mỗi ô là mục `<details>` có tên M1–M4 kèm nhãn ô, M1 mở sẵn, bên trong là ghi chú (khối xám, rule 7) và các dòng cài đặt (`summaryRows` trong `lib/presetSummary.ts`); chọn hệ PAL/NTSC (segmented, nút "i" cạnh nhãn); nút cam "Tải ZIP 4 file" là nút chính duy nhất của màn; nút xám "Dùng bộ này" mở `/tao-m1-m4?set=<id>`. Máy chưa giải mã không thấy phần tải, chỉ có dòng "Bộ này gồm file cho ZV-E10…" và nút "Tôi dùng ZV-E10".

### Builder M1–M4 (dashboard)
`app/components/PresetBuilder.tsx` (`/tao-m1-m4`) và `SlotCard.tsx`. Thanh bước là một hàng 4 cột ở mọi độ rộng, không sidebar: vạch `h-1.5` (cam khi đã xong, cam 40% khi đang mở, xám khi chưa) và nhãn `text-footnote` bên dưới. Bước 2 là bảng điều khiển: chọn bộ là chip `role="radio"` `h-11` (badge "Khuyên dùng" nằm trong chip; mô tả bộ nằm trong nút "i"); bốn ô M1–M4 luôn hiện thành thẻ `aria-pressed` (1 cột, 2 cột từ sm, 4 cột từ xl), mỗi thẻ một dòng tóm tắt và chấm cam khi đã chỉnh. Ô đang chọn được sửa ngay bên dưới, không cần mở: segmented chia nhóm Phơi sáng / Lấy nét / Màu / Máy, lưới 2 cột từ sm; các nhóm ẩn bằng `hidden` để giữ nháp form màu. Hành động của ô (Về mặc định của bộ, Chép từ ô khác, đọc file máy) là nút `bg-fill`. Màn chỉ một nút cam ở chân trang. Đổi ô thì `SlotCard` dựng lại (`key` theo ô).

### Bảng tham số giải mã
Bảng nằm ở `app/components/decode/DecodeTable.tsx`, chỉ trên `/admin/decode` (sau cổng `AdminGate.tsx`), không có trên `/giai-ma`. Trạng thái cổng: đang kiểm tra, chưa đăng nhập (nút cam "Đăng nhập bằng Google"), không đủ quyền (nút xám "Đăng xuất"), 404, lỗi (nút xám "Thử lại"), mỗi trạng thái là một thẻ với một câu; chỉ 200 mới hiện bảng. Trang admin gồm nhóm chọn máy (segmented `h-11`, ghi máy đang chọn), bảng, rồi `NextRound` có nút "Lưu lượt này vào dự án". `/giai-ma` (chỉ khi npm run dev; bản production trả 404) chỉ có `NextRound` (`app/components/decode/NextRound.tsx`: "Lượt giải mã tiếp theo" và mini game) và đọc file đã lưu trên máy. Tiến độ theo máy, chip trạng thái và phần trăm chỉ hiện khi `showDecodeStatus` (`lib/decodeProgress.ts`, tức npm run dev); bản production không có chữ hay số tiến độ. Bảng gồm dòng tóm tắt từng máy, bộ lọc, bảng. Bảng có cột Mục và ba máy; cột máy đang chọn in đậm và có `aria-current`. Ô là huy hiệu `confirmed/total` (giá trị đã xác nhận trên tổng giá trị có trong danh mục): đủ thì `bg-success-fill text-success`, có một phần hoặc đã định vị thì `bg-warning-fill text-warning`, chưa có gì thì `bg-fill text-secondary`; máy không có mục là "—" kèm chữ ẩn cho trình đọc màn hình. Bộ lọc "Tất cả" và "Còn thiếu" là segmented `h-11`. Bấm tên mục để mở chi tiết (`aria-expanded`): với mỗi máy là vị trí, từng giá trị kèm huy hiệu trạng thái, mã và file máy thật (`text-footnote`, `break-all`).
Bốn trạng thái giá trị, cùng màu ở bảng và ở chú giải dưới bảng: đã xác nhận `bg-success-fill text-success`; có mã, chưa thấy `bg-accent/10 text-accent-text`; đã định vị, chưa có mã `bg-warning-fill text-warning`; chưa định vị `bg-fill text-secondary`. Nút "Ưu tiên ở lượt tới" là pill `bg-fill`; khi bật thì `bg-accent/10 text-accent-text` và `aria-pressed`. Bảng không có nút cam.
Thẻ "Lượt giải mã tiếp theo": bốn ô M1–M4 là `rounded-control bg-fill`, 4 cột từ md, xếp dọc dưới md; mỗi ô có nhóm "Cần giải mã" và "Giữ để kiểm tra". Máy chưa giải mã chỉ có một dòng ghi chú. Nút "Lập lượt khác" là pill `bg-fill`. Nút mở mini game là `bg-accent/10` (`GameDialog`), nút cam đặc chỉ hiện trong hộp thoại.

### KOL
`KolView.tsx` (`/kol/[handle]`, KOL có trong repo), `RemoteKolView.tsx` (trang KOL: hiện dữ liệu repo trước, rồi gộp hồ sơ và bộ từ xa khi tải xong), `PhotoGrid.tsx` (lưới ảnh mẫu, hộp xem ảnh và `NotePanel` thông tin ảnh), `KolContext.tsx` (`KolProvider`, `useKol`, `KolLoadState`: hồ sơ KOL tải một lần ở `/tai-khoan`, lỗi có nút Thử lại xám), `KolCoverButton.tsx` (nút "Đổi ảnh bìa"), `KolIdentityForm.tsx` (form gộp ở thẻ Giới thiệu), `KolPhotos.tsx` (tab Ảnh mẫu), `PhotoNoteEditor.tsx` (ô soạn ghi chú một ảnh, đặt ngay dưới lưới ảnh trong `KolPhotos.tsx`), `KolSetEditor.tsx` (trình soạn bộ trong `<dialog>`), `SlotDashboard.tsx` (`SlotDashboard`: bốn ô M1–M4, dùng chung với `/admin`), `KolSetModule.tsx` (`KolSetModule`, `KolWall`): module bộ M1–M4 trên tường `/tai-khoan` của KOL; `KolWall` chờ hồ sơ KOL (`useKol`) rồi mới hiện module. Trang KOL dựng trên `ProfileShell` và `KolView` như `/tai-khoan`, không có nút: nút quay lại (`BackLink`) là dòng đầu trang, phía trên thẻ tiêu đề. Thẻ tiêu đề: ảnh bìa `aspect-[3/1]` (nếu có, không thì dải xám), avatar đè lên bìa (không có ảnh thì ô chữ cái đầu xám), tên `text-title`, @handle `text-footnote` màu `secondary`, dòng đếm bộ và ảnh mẫu, thanh tab ở đáy (chỉ khi có ảnh mẫu). Cột trái: thẻ Giới thiệu (tiểu sử và liên kết dạng viên), chỉ hiện khi có một trong hai. Cột phải: tab "Bộ M1–M4" là các bài đăng, mỗi bộ một thẻ: đầu là tên KOL, giữa là tên bộ, mô tả và bốn ô M1–M4, chân có nút sưu tầm và nút "Xem bộ" xám. Tab "Ảnh mẫu" (chỉ khi có ảnh) là lưới 3 cột (4 cột từ sm) ô `aspect-square`. Trang công khai không có nút cam. Bấm ảnh mở hộp xem ảnh (`dialog`: mũi tên trái phải, Esc, nút đóng; các nút là chữ, không dùng ký tự làm icon). Ô có ghi chú có nhãn `Có ghi chú` (`kol.noteBadge`) ở góc dưới trái. Thông tin ảnh là `NotePanel`, một `aside` có tiêu đề `Thông tin ảnh` (`text-title3 font-medium`): từ lg đứng cạnh ảnh (`lg:w-80`, viền trái `border-separator`), dưới sm nằm dưới ảnh và cuộn trong `max-h-64`. Mỗi trường là dòng nhãn `text-footnote` màu `secondary` với giá trị `text-body font-semibold`, chỉ hiện trường có giá trị; không có gì thì hiện `Ảnh này chưa có ghi chú.`. Ô M1–M4 ghi tên ô kèm nhãn trong bộ đầu tiên của KOL; công thức chỉ hiện khi còn trong Color Bank; mod PP ghi tên mod, `gốc <công thức>`, rồi từng thông số khác gốc; lời ghi xuống dòng như đã nhập.
KOL không có trang quản lý riêng: mọi việc nằm ở `/tai-khoan`, ba tab (xem Profile tabs). Đang tải hồ sơ hoặc lỗi thì hiện `KolLoadState` (khung chờ xám; lỗi có thông báo và nút `Thử lại` xám), không hiện form trống. Chưa có hồ sơ thì form Giới thiệu vẫn mở để tạo lần đầu; tab Ảnh mẫu và ô bộ trên tường chưa có hồ sơ thì chỉ hiện một dòng chỉ dẫn lên mục Giới thiệu, không có nút. Form gộp `KolIdentityForm` ở thẻ Giới thiệu, không có ảnh bìa (đổi bằng "Đổi ảnh bìa" trên ảnh bìa): tên đường dẫn (`h-11`, chữ thường, số, dấu gạch ngang, tối đa 30, nút "i" `handleTip`; `sua` bị giữ) | tên hiển thị; giới thiệu và liên kết (tối đa 5); ảnh đại diện chọn bằng nút xám `Chọn ảnh`, bỏ bằng `Bỏ ảnh`. Lưu một lần: `saveProfile` ghi hồ sơ KOL trước, chỉ khi thành công mới `writeProfile` ghi máy; tên đường dẫn trùng báo `handleTaken`. Hồ sơ hiển thị (tên, avatar, giới thiệu, liên kết) lấy từ `displayIdentity`. Tab Ảnh mẫu (`KolPhotos`): lưới 3 cột (4 cột từ sm), tiêu đề có đếm `n/12`; dưới lưới là ô `Link ảnh` (`type="url"`, `h-11`) cạnh nút xám `Thêm ảnh`, và nút xám `Chọn ảnh` tải file từ máy, xếp dọc dưới sm; Enter trong ô là thêm ảnh, không gửi form; đủ 12 thì nút thêm tắt và báo đủ. Ảnh mẫu là link https bất kỳ, tải thử trước khi nhận; mỗi lần thêm, xóa hoặc lưu ghi chú được lưu ngay, không cần nút lưu, và chờ xong mới thao tác tiếp. Mỗi ảnh có hai nút xám trong ô: `Ghi chú` (`aria-label` `Ghi chú ảnh n`) và xóa. Bấm `Ghi chú` mở `PhotoNoteEditor` ngay dưới lưới, mỗi lúc chỉ một ô; đổi sang ảnh khác thì ô được dựng lại cho ảnh đó và focus vào ô khẩu độ. Form: khẩu độ, tốc độ, ISO, ống kính là ô `h-11 text-callout` (tối đa 40 ký tự); ô M1–M4 là segmented có lựa chọn `Không`; công thức Color Bank và mod PP là select (`Không chọn`, `Không dùng`), mod là bản chụp lúc bấm lưu và có `InfoTip` giải thích; lời ghi là textarea tối đa 140 ký tự, đếm `n/140`. Nút `Lưu ghi chú`, `Xóa ghi chú` (chỉ khi ảnh đã có ghi chú) và nút hủy đều xám (`bg-fill`). Chưa có hồ sơ thì ảnh chỉ giữ trong form đến lần lưu đầu. Ảnh đại diện và ảnh bìa vẫn chỉ nhận bucket `kol` của AUTH (ảnh đại diện thêm được ảnh Google). Chân form: trạng thái trong vùng `aria-live`, rồi nút xám `Lưu` (khóa khi tên đường dẫn sai, thiếu tên hiển thị hoặc đang ghi) và `Hủy` chữ (hover xám). Đang tải hồ sơ thì form không mở: chỉ có `KolLoadState` và `Hủy`. Ô bộ M1–M4 trên tường `/tai-khoan`: mỗi KOL có một bộ. Chưa có thì câu chữ và nút xám `Tạo bộ M1–M4`; có bộ thì một thẻ gồm tên (`text-title3 font-medium`, xuống dòng được), huy hiệu Nháp/Công khai, nút xám Sửa và Xóa, thêm `Xem bộ` khi công khai; ô này không có nút cam. Dữ liệu cũ có nhiều bộ vẫn hiện đủ từng hàng trong một thẻ, không có nút tạo. Xóa bộ qua hộp thoại xác nhận, nút xác nhận `bg-danger-fill text-danger` (không phải nút cam). Trình soạn bộ (`KolSetEditor`) mở trong `<dialog>` toàn màn hình (`h-dvh`, `showModal()`), phủ kín tường và thanh tab. Đầu sticky có `Hủy` (xám) và `Lưu bộ` (nút cam của trình soạn); Esc là Hủy, đóng xong focus về chỗ đã mở. Thân là thẻ thông tin (tên, đường dẫn, mô tả, Nháp/Công khai là segmented) rồi `SlotDashboard`: 4 ô M1–M4 là lưới chọn (`aria-pressed`), cài đặt ô đang chọn dùng `SlotCard`. Ô đường dẫn lấy từ tên bằng `toSlug` (`lib/slug.ts`) cho đến khi sửa tay, sau khi lưu lần đầu thì khóa (chỉ đọc, nền `bg-fill`); tên tối đa 60 ký tự, mô tả 240; lỗi vượt một bộ hiện `setLimit`. Mỗi màn chỉ một nút cam: trên `/tai-khoan` của KOL là `Chia sẻ hồ sơ`; khi đang soạn bộ, dialog phủ kín nên chỉ còn `Lưu bộ`. Các nút còn lại (`Lưu`, `Hủy`, `Xem trang công khai`, `Tạo bộ M1–M4`, `Thử lại`, `Thêm ảnh`, `Ghi chú`) đều xám.

### Mod PP (Color Bank)
Bản mod là bản chỉnh PP riêng của người dùng, lưu trên máy (khóa `pp-mods`) và đồng bộ qua `lib/userState.ts` khi đăng nhập. Không có bảng server, không chia sẻ công khai.
- Nơi dùng: `RecipeDetailContent` (`/colors/[slug]`: tạo, sửa, xóa, dùng cho M1–M4); `ColorsIndex` (nhóm "Bản mod của tôi" đầu Color Bank); `PresetBuilder` (`/tao-m1-m4?mod=<id>`, nạp PP vào ô trống đầu tiên). Giá trị đi qua `lib/ppMods.ts`.
- Trình soạn thảo mở ngay trong trang (inline), không dùng modal.
- Một nút cam mỗi màn: khi đang mở trình soạn thảo, liên kết cam của trang công thức bị ẩn; nút Lưu là nút cam duy nhất.
- Công thức bị chặn (`blocked`) không tạo được bản mod.

### Buttons
Nút chính: `h-11 rounded-full bg-accent px-5 text-subhead font-semibold text-on-accent`. Nút phụ: `bg-fill text-label`, hover `bg-fill-strong`. Vùng chạm tối thiểu 44px.

### Segmented control
Rãnh `bg-fill rounded-full p-1`, núm `bg-card shadow-thumb`. Dùng cho lựa chọn loại trừ.

### Inputs
`h-11 rounded-control bg-card text-callout` với viền `separator`; focus vòng `accent`. Không nhỏ hơn 16px chữ (iOS tự zoom).

### Cards / grouped lists
Một thẻ `rounded-card bg-card shadow-card divide-y divide-separator`. Không thẻ trong thẻ.

### Lưới index
Mặc định là lưới. Hai núm "Danh sách / Lưới" (`IndexViewSwitch`, mỗi app một hàng gọn trong menu avatar: tên app, hai nút icon 36px có vùng chạm cao 44px, không đóng menu) nằm trong menu avatar (`AccountButton`), không còn ở cột index của Product Wiki (`/wiki`) và `/blog`. Lưu trên máy này (`lib/indexView.ts`, khóa `index-view-blog` và `index-view-wiki`; khóa cũ `index-view` chỉ đọc khi chưa có khóa riêng), không đồng bộ tài khoản. Lưới ở `/wiki` và `/blog` (`SplitLayout` prop `browse`) không có cột index trái ở mọi kích thước: header rồi index là lưới thẻ trong luồng trang, 2 cột dưới md, 3 md, 4 xl, 5 2xl (wiki `aspect-[4/3]`, bài `aspect-[3/2]`); chọn mục thì chỉ hiện chi tiết, index ẩn bằng `hidden` nhưng vẫn mount. Từ lg, Lưới cũng bỏ thanh dọc: thanh trên cùng (`site-nav-wide`, cùng hàng `h-14`) có logo trái đúng chỗ launcher của thanh dọc, tìm kiếm giữa, avatar phải. Ở `/blog/kien-thuc` ghi chú xếp 2 cột md, 3 xl. Núm loại và núm phần (`md:max-w-md`), bộ lọc và lộ trình (`md:max-w-2xl`) không kéo hết trang. Danh sách giữ 2 cột như cũ. Mỗi thẻ là một link; hai ảnh đầu của nhóm đầu tải sớm (`preload`), còn lại lazy. Lộ trình học chỉ có danh sách.

### Navigation
Từ lg (mọi trang trừ landing): thanh dọc `AppSidebar` cố định bên trái, rộng `w-sidebar` (20rem), nền `bg`, viền phải `separator`, không có thanh trên cùng (trừ `/wiki` và `/blog` ở Lưới, xem dưới). Phần đầu cao đúng `h-sidebar-head` (7rem): nút launcher bên trái (logo chấm 3×3, chấm giữa cam, + tên app đang dùng, chưa ở app nào thì "alphacolorlab.com"; bấm bung popover `.app-launcher` gồm 4 app, chấm màu + tên, mục đang mở `bg-fill`), nút avatar bên phải; ô tìm kiếm. Ngay dưới là index của app đang mở: cột index của `SplitLayout` rời lưới, cố định `top-sidebar-head` tới đáy, cuộn riêng; trang split chỉ còn cột chi tiết; `/wiki` và `/blog` ở Lưới không có thanh dọc, thay bằng thanh trên cùng `site-nav-wide` (xem "Lưới index"). `/admin` và `/admin/decode` luôn như vậy (`wideBrowseOf` trong `lib/indexView.ts`), không có cột index. Nội dung lùi trái đúng `--spacing-sidebar` (globals.css, `body:has(> .app-sidebar)`); `h-split`, `h-stage` thành 100dvh (`:root:has(.site-nav-wide)` trừ thêm 3.5rem); thanh cố định ở đáy (giỏ màu, so sánh) dùng `lg:left-sidebar`, trừ khay so sánh ở Blog và Wiki Lưới. Tìm kiếm và avatar chỉ mount ở một nơi (`useLg` trong `AppNav.tsx`). Dưới lg: thanh trên cùng gồm logo trái, tìm kiếm + avatar phải. Nút avatar mở menu: Túi đồ (`/tai-khoan`), Xem đồ thị (của app đang mở, chọn sẵn nút của trang đang xem), Danh sách/Lưới của Blog và Product Wiki (`IndexViewSwitch`), Đăng nhập/Đăng xuất. Dưới lg: thanh tab 4 app ở đáy, cao `--spacing-tabbar` (4rem cộng safe-area, `globals.css`); thanh lưu của `/admin` đặt `bottom-tabbar` dưới lg và `lg:bottom-0` từ lg.

### Search
Cả trang chỉ có **một** ô tìm kiếm: `SearchField` trên thanh điều hướng; landing không có thanh điều hướng nên ô đó nằm trên đồ thị tổng hợp, mở bằng nút kính lúp ở góc dưới phải, chỉ có ở mốc đồ thị. Không đặt ô tìm thứ hai trong trang hay trên đồ thị. Trang cần tìm riêng thì đăng ký nguồn qua `lib/pageSearch.ts`: đồ thị thêm nút của nó lên đầu gợi ý (chọn thì bay tới nút), Ngoại lệ: ô nhập thêm đồ của `GearManager` (nhập để thêm, không phải tìm trang) và hộp thoại modal (thanh điều hướng bị che).

### InfoTip
Nút "i" cạnh nhãn, nội dung trong `app/content.ts`. Thay cho mọi dòng chữ phụ dưới tiêu đề.

### Sơ đồ bài viết
Sơ đồ SVG trong bài (`figure` với `src` là `/blog/<id>-dN.svg`), đặt trong `public/blog/`. Figure đầu tiên của bài nên là ảnh chụp: og:image lấy ảnh chụp đầu tiên và bỏ qua SVG (`lib/jsonld.ts`).
- Khung `viewBox="0 0 720 480"`, nền trắng `card`, khung hiển thị tỉ lệ 3:2.
- Chỉ dùng màu token. Hex dưới đây được phép vì file nằm trong `public/` và phải khớp `app/globals.css`: chữ `label` #0b0d12, `secondary` #4a5260, `tertiary` #7c8594 (chỉ nét trang trí), `separator` #e3e6eb, `bg` #f3f4f6, `accent` #f05a14 (một điểm nhấn mỗi sơ đồ), `accent-text` #b43f00. `success` và `danger` chỉ cho đúng và sai.
- Không gradient, bóng, emoji, mũi tên là ký tự. Mũi tên vẽ bằng nét SVG.
- Chữ cỡ tối thiểu 24 đơn vị, font `'Noto Sans', system-ui, sans-serif`. SVG qua `<img>` không tải được font tự host, nên chữ phải đọc được cả khi rơi về font hệ thống.
- Tối đa khoảng 8 nhãn mỗi sơ đồ.

### Motion
`ease-ios` cho chuyển trạng thái giao diện (0.2–0.4s). Đồ thị dùng nội suy riêng theo khung hình. Mọi chuyển động tắt khi `prefers-reduced-motion`.

## Do's and Don'ts

### Do:
- Túi đồ của người dùng hiện rõ trên đồ thị (vòng chấm), đồ thị console/wiki mở ở máy của họ.
- Đường đi liền mạch: trang → menu avatar → đồ thị ở đúng nút của trang (`?n=`) → nút khác → trang.
- Dùng token cho mọi màu, cỡ chữ, bo góc, bóng.
- Viết tiếng Việt ngắn, đúng tên menu trên máy.

### Don't (dấu vết "AI làm"):
- Không gradient, không glow, không kính mờ ngoài thanh điều hướng, không blob trang trí.
- Không hero căn giữa với badge, không lưới 3 thẻ tính năng có icon trong vòng tròn, không số liệu khoe.
- Không emoji, không ký tự làm icon (›, ✓, →, •). Icon là SVG nét 1.5px.
- Không chữ kiểu "Khám phá ngay", "Mở khóa", "Trải nghiệm vượt trội".
- Không dòng chữ phụ màu xám dưới tiêu đề, nút hay ô chọn (dùng InfoTip).
- Không thẻ trong thẻ, không viết hoa toàn bộ, không file CSS mới, không `style={{ color }}`.
- Không màu palette Tailwind, không giá trị tùy ý trong className (ngoại lệ: `grid-cols-[…]`, `grid-rows-[…]`, `aspect-[…]`).
