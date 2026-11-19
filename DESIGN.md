---
name: Alpha Console
description: Trang tiếng Việt cài máy ảnh Sony, lấy đồ thị kiến thức làm lối đi chính. Giao diện sáng, chấm và khung lấy nét làm ngôn ngữ hình ảnh.
colors:
  bg: "#f2f2f7"
  card: "#ffffff"
  card-elevated: "#ffffff"
  label: "#0b0d12"
  secondary: "#4a5260"
  tertiary: "#7c8594"
  separator: "#e3e6eb"
  fill: "rgb(11 13 18 / 0.05)"
  fill-strong: "rgb(11 13 18 / 0.09)"
  accent: "#c2410c"
  on-accent: "#ffffff"
  accent-text: "#c2410c"
  app-console: "#c2410c"
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

> Nguồn token duy nhất: `design/tokens/tokens.json`. `npm run tokens` ghi khối `@theme` sáng vào `app/globals.css` (giữa `/* tokens:start */` và `/* tokens:end */`) và ghi `design/tokens/out/`; không sửa tay khối đó. File này mô tả token và luật dùng, không được kiểm tự động: khi đổi token, sửa cả frontmatter và bảng dưới đây. Kiểm tra: `npm run check:design` (chạy trước mỗi `npm run build`, báo lỗi nếu khối trong `globals.css` không khớp kết quả `npm run tokens`).

## Overview

**Creative North Star: "Kính ngắm trong studio"**

Người dùng mang máy ảnh của họ tới, và trang dựng quanh chính bộ máy đó. Mọi nội dung (bước cài, công thức màu, sản phẩm, bài viết) là một nút trong đồ thị; người dùng đi bằng cách chọn nút, không phải đọc danh sách dài. Hình ảnh mượn từ kính ngắm máy Sony: chấm, khung lấy nét bốn góc, bộ đếm số khung. Nền sáng như bàn studio, chữ gần đen, một màu cam Alpha làm tín hiệu.

Chỉ có giao diện sáng. Không có chế độ tối.

**Key Characteristics:**
- Landing "/": không có thanh điều hướng, không tiêu đề trang hiển thị (chỉ `h1` cho trình đọc màn hình). Avatar luôn ở góc trên phải mọi màn, kể cả landing (cùng vị trí ở cả ba bước). Flow 3 bước trong đúng một màn hình, không cuộn trang: cả trang cao `h-dvh`, `LandingFlow` giữ bước đang đứng (`data-step`). Đồ thị tổng hợp (`LandingGraph`, `allGraph()`, `controls={false}`) nằm nền suốt flow: bước 1 và 2 zoom gần làm nền (`1.3 ** 3`), bước 3 lùi về vừa khung.
- Bước 1, giới thiệu: lớp `.intro-overlay` (trắng 85%, 30% cuối trong dần) phủ trên đồ thị, nội dung nằm giữa màn: tiêu đề "alphacolorlab.com" với chữ "color" tô dải màu Alpha + 4 app chạy và đổi sắc (`.hue-text`), 2 câu giới thiệu chung cho mọi máy Sony Alpha (`landing.intro.lines`, xuống hàng cố định từ md, không nêu tên mẫu máy), quầng trắng `.intro-glow` và viền chữ `.over-graph`. Glow, gradient chữ và lớp phủ trong suốt ở đây là ngoại lệ người dùng yêu cầu (2026-11-10), chỉ ở landing; mọi chuyển động tắt khi `prefers-reduced-motion`. Viền 2px bốn màu Google của thẻ Tài khoản bước 2 (`.google-ring`, dưới đây) là ngoại lệ "không gradient" khác người dùng yêu cầu (2026-11-17), chỉ thẻ đó, không có bóng hay phát sáng.
- Bước 2, túi đồ và đăng nhập: nền `bg` che đồ thị. Bảng điều khiển trong khung `max-w-dashboard` (64rem, token `--container-dashboard`, căn giữa ngang và dọc trong khung), tiêu đề bước là `h2` `text-title` (`landing.flow.steps[1]`). Dưới md một cột theo thứ tự: tiêu đề, thẻ túi đồ (`GearManager compact`), thẻ tài khoản (`LandingStart`, `google-ring rounded-card bg-card` với viền 2px bốn màu Google, không bóng: tiêu đề `community.account.menu` "Tài khoản" `text-title3 font-medium`; chưa đăng nhập thì nút xám có logo G 20px (`GoogleG`) "Đăng nhập bằng Google" + nút "i" `landing.start.syncTip`; đã đăng nhập thì avatar Google tròn 56px (`size-14 rounded-full bg-fill`, có ảnh mới hiện) cạnh tên có logo G 16px đứng trước, không có nút sang hồ sơ (vào hồ sơ bằng menu avatar ở góc trên phải); bản chưa bật đăng nhập thì ẩn cả thẻ), thẻ tiến độ. Từ md hai cột `grid-cols-[minmax(0,1fr)_20rem]` (`md:grid`): túi đồ bên trái, cột phải gồm tài khoản, tiến độ; hai cột cao bằng nhau (thẻ tiến độ giãn để đáy thẳng hàng với thẻ túi đồ), không có ghi chú (bỏ 2026-11-17). Thẻ tiến độ là `rounded-card bg-card shadow-card p-5 sm:p-6`: tiêu đề `landing.flow.needs.label`, đếm "n/2" (`landing.flow.count`, `text-callout font-semibold text-secondary tabular-nums`); mỗi điều kiện một dòng `min-h-11` kèm icon tròn (trống `text-tertiary`, có dấu tích `text-success`) và badge `bg-warning-fill text-warning` "Còn thiếu" hoặc `bg-success-fill text-success` "Đã xong". Khung cuộn `overflow-y-auto` trong `h-dvh`, đỉnh `pt-16` và lề phải (`pr-14`, `md:pr-avatar-gutter`) chừa chỗ cho nút avatar, đáy `pb-24` chừa chỗ cho viên đếm bước và nút cam ở góc dưới. Nội dung cao hơn màn thì cuộn trong khung.
- Bước 3, đồ thị: vừa khung, đã lọc theo túi đồ. Chú giải 4 app ở trên trái; nút avatar (viên tròn `bg-card shadow-thumb`, cùng menu như ở các app, `LandingFlow` đặt ở mọi bước) sát góc trên phải, bên trái nó là kính lúp và nút chế độ xem (dưới sm hai nút này xuống hàng thứ hai vì chú giải 2×2 chiếm bề ngang, avatar vẫn ở hàng đầu); ô tìm (`SearchField`, ô tìm duy nhất của landing; mở là con trỏ vào luôn, Esc để đóng) mở ra ngay dưới hai nút đó. Nút chế độ xem (icon khung bốn góc + dot meter 3 chấm) xoay vòng 3 chế độ: (1) toàn bộ đồ thị vừa khung, (2) phóng to 1.6 lần, (3) chỉ một app vừa khung (app xem gần nhất, chưa xem app nào thì Alpha Console). Chế độ 3 chính là lọc theo app của chú giải: bấm một app ở chú giải cũng vào chế độ 3, bấm lại app đó thì về chế độ 1. Đang chọn nút hoặc đã zoom tay thì lần bấm đầu chỉ đưa về chế độ xem hiện tại. Mặt nút cao 32px `bg-card shadow-thumb`, vùng chạm 44px. Khi chờ, mỗi app chỉ hiện nhãn 4 nút chính nhiều liên kết nhất (2 ở màn hẹp hơn 640px; `quietLabels`). Các nút của đồ thị ẩn ở bước 1 và 2 (`.landing-flow:not([data-step="3"]) .graph-legend`).
- Chuyển bước chỉ bằng nút. Dưới phải là nút cam của bước: "Bắt đầu" ở bước 1; "Tiếp tục" ở bước 2, màu `bg-fill-strong text-secondary` tới khi đã lưu túi đồ và đăng nhập nhưng vẫn bấm được (`aria-disabled`): bấm khi còn thiếu thì hiện cảnh báo `role="alert"` ngay trên nút (`bg-card shadow-thumb text-warning`, câu "Để tiếp tục, bạn cần …", tự ẩn sau 6 giây) và cuộn thẻ tiến độ vào khung; bước 3 là `EnterLink`. Dưới trái là nút quay lại (mặt 32px `bg-card shadow-thumb`) và viên đếm bước (dot meter 3 chấm + "2/3", ẩn dưới sm). Bước đang đứng và bản nháp túi đồ lưu trong sessionStorage để vòng đăng nhập Google quay về đúng chỗ.
- Thẻ túi đồ ở landing (`GearManager compact`): món nhập vào nằm trong bản nháp và hiện thành lưới ảnh nhỏ theo phân loại (4 cột, 6 cột từ lg; ô `rounded-control` viền `separator`, ảnh `aspect-[4/3]`, tên `text-footnote`, dấu bỏ ở góc; vùng lưới cao tối đa `max-h-72` rồi cuộn). Bấm một ô để bỏ món. Nút xám "Lưu túi đồ" chỉ bật khi bản nháp khác túi đã lưu; lưu xong đổi thành "Đã lưu túi đồ".
- Cá nhân hóa theo túi đồ: nút cam của landing khi túi đã lưu có món là "Tối ưu nội dung và Truy cập". Segmented "Của tôi / Tất cả" (`PersonalToggle`): ở đầu danh sách Blog và Color Bank (Product Wiki không lọc, luôn hiện đủ sản phẩm) là rãnh `bg-fill` núm `bg-card shadow-thumb` kèm nút "i". Trên đồ thị không có nút riêng: bật tắt bằng hàng "Nội dung" trong menu avatar. Bước 3 của landing luôn mở ở "Của tôi" (sang bước 3 thì bỏ lựa chọn "Tất cả" đã lưu). Menu avatar có thêm một hàng "Nội dung hiển thị" cùng kiểu hàng Danh sách/Lưới (nhãn trái, hai núm chữ `rounded-badge` trong rãnh `bg-fill rounded-control`), hiện khi túi có món kể cả khi chưa từng bật.
- Nút cam của landing (`EnterLink`, nút cam duy nhất của bước 3, góc dưới phải): đích là app đang chọn ở chú giải, chưa chọn thì Alpha Console (túi có máy được hướng dẫn thì vào thẳng máy đó, `/console?model=<id>`; `entryModel` trong `lib/gear.ts`). Chữ đổi theo người dùng: túi đã lưu có món thì "Tối ưu nội dung và Truy cập" (bấm thì bật cá nhân hóa); túi trống thì "Mở <app>" khi đang chọn app ở chú giải, "Tiếp tục với <máy>" cho người đã chọn máy từ lần trước, "Mở Alpha Console" cho người mới.
- Ngoài landing không có cổng đăng nhập: mọi trang mở tự do bằng đường dẫn trực tiếp. Flow ở landing cần lưu túi đồ và đăng nhập Google mới tới bước 3 (bản chưa bật đăng nhập thì chỉ cần túi đồ). Đăng nhập Google đồng bộ dữ liệu theo tài khoản (`lib/userState.ts`). Ngoại lệ: `/admin/decode` chỉ hiện bảng khi phiên Google có email trong `ADMIN_EMAILS` (kiểm trên máy chủ, `/admin/decode/data`).
- Mỗi app là danh sách 2 cột: index bên trái, nội dung chi tiết bên phải (`SplitLayout`), trừ `/wiki` và `/blog` khi ở Lưới (mặc định, xem "Lưới index"). Alpha Console ở `/console`.
- Cột trái Alpha Console (`ConsoleIndex`): `ModelPicker` không có nhãn trạng thái, chỉ có chữ. Tên máy và dòng phụ mỗi thứ một dòng, cắt bằng `truncate`. Máy đã giải mã có nút phụ "Tạo bộ M1–M4" (`h-11 rounded-full bg-fill text-accent-text`) cạnh `details`, là anh em chứ không lồng trong `summary`; hàng hẹp thì nút xuống dòng riêng dưới hàng (`flex-wrap`, `details` `min-w-48`). Mục Công cụ chỉ hiện cho máy đã giải mã (`data-model-only`); máy khác không thấy mục này.
- Đồ thị của từng app còn là trang riêng `/do-thi/[app]`, mở từ menu avatar ("Xem đồ thị"). Mọi đồ thị cùng kiểu, cùng chức năng (một component `Constellation`).
- Nền `bg` trắng lạnh, thẻ `card` trắng có viền tóc. Không gradient, không phát sáng. Ngoại lệ: viền bốn màu Google của thẻ Tài khoản bước 2 landing (xem bước 1 ở trên).
- Một màu nhấn `accent` (cam Alpha) cho hành động chính, trạng thái chọn và focus. Chữ trên nền cam là `on-accent` (trắng, 5.2:1 trên `accent`).
- Mỗi app một màu nhận diện (`app-*`), chỉ dùng cho nút đồ thị và chấm nhận diện. Không làm nền nút.
- Noto Sans là font duy nhất, tự host, chạy offline.
- Chuyển động mềm, chậm, tắt hết khi `prefers-reduced-motion`.

## Colors

| Token | Giá trị | Dùng cho |
|---|---|---|
| `bg` | #f2f2f7 | Nền trang, sân khấu đồ thị |
| `card` | #ffffff | Thẻ, thanh điều hướng, hộp thoại |
| `label` | #0b0d12 | Chữ chính, nhãn trên đồ thị |
| `secondary` | #4a5260 | Chữ phụ (7.9:1 trên card) |
| `tertiary` | #7c8594 | Chỉ trang trí: nút lá trên đồ thị, chấm trống, icon mờ. Không dùng cho chữ |
| `separator` | #e3e6eb | Đường kẻ, viền ô |
| `fill` / `fill-strong` | đen 5% / 9% | Chip, rãnh segmented, nền nút phụ / hover |
| `accent` | #c2410c | Nền nút chính, chấm tín hiệu, khung chọn, vòng focus |
| `on-accent` | #ffffff | Chữ và icon trên nền `accent` (5.2:1) |
| `accent-text` | #c2410c | Chữ và link màu nhấn trên nền sáng (5.2:1 trên card, 4.6:1 trên bg) |
| `app-console` / `app-colors` / `app-wiki` / `app-blog` | cam / xanh lục lam / xanh lá / chàm | Nút chính trên đồ thị của app, chấm cạnh tên app. ≥3:1 trên bg |
| `warning`, `success`, `danger` (+ `-fill`) | | Ghi chú cảnh báo, trạng thái, lỗi |
| `google-blue` / `google-red` / `google-yellow` / `google-green` | #4285f4 / #ea4335 / #fbbc05 / #34a853 | Chỉ logo G của Google (`GoogleG`) và viền thẻ Tài khoản bước 2 landing (`.google-ring`). Thương hiệu Google, không dùng cho nút, chữ hay trạng thái |

### Named Rules
- **Một nút cam mỗi màn.** Hành động chính duy nhất dùng `bg-accent text-on-accent`. Nút phụ dùng `bg-fill text-label`.
- **Màu app không phải màu nút.** `app-*` chỉ vẽ chấm và nút đồ thị.
- **Không chữ xám nhạt.** Chữ đọc được tối thiểu là `secondary`. Người dùng đã phản ánh chữ xám nhạt khó đọc.
- **Màu Google chỉ cho thương hiệu Google.** `google-*` chỉ vẽ logo G và viền thẻ Tài khoản bước 2 landing, ngoại lệ người dùng yêu cầu 2026-11-17 (xem Overview).

## Typography

Noto Sans biến thiên 100–900 (SIL OFL), file ở `public/fonts`, `@font-face` trong `app/globals.css`, preload bản Latin và tiếng Việt trong `app/layout.tsx`. `unicode-range` của bản latin-ext không được chồng lên bản tiếng Việt (ă đ ĩ ũ ơ ư, U+1EA0–1EF9, ₫): bản khai báo sau được thử trước, chồng lên thì mọi trang tải thêm 168 KB (`test/fontRanges.test.ts`).

| Vai trò | Utility | Độ đậm |
|---|---|---|
| Tiêu đề lớn | `text-display` | `font-light` (300), tracking âm sẵn trong token |
| Tiêu đề trang | `text-title` | `font-normal` |
| Tiêu đề nhóm | `text-title3` | `font-medium` |
| Đề mục bài viết | `text-title2` | `font-semibold` |
| Nội dung | `text-body` | `font-normal` |
| Nhãn, nút | `text-subhead`, `text-callout` | `font-semibold` |
| Chú thích | `text-footnote` | `font-medium` |

### Named Rules
- Tiêu đề lớn nét mảnh, nội dung nét thường. Không dùng nét 200 trở xuống cho chữ đọc.
- Số đếm (3/6, bước 04) dùng `tabular-nums`.
- Không viết hoa toàn bộ, không eyebrow trên tiêu đề.

## Layout

- Từ `lg`: chỉ có thanh điều hướng dọc bên trái (`w-sidebar`): logo, tìm kiếm, 4 app, rồi index của app đang mở. Không có thanh trên cùng. Avatar luôn ở góc trên phải mọi màn; có thanh dọc thì nó là nút cố định `fixed top-4 right-4` (z-50, cùng menu), không nằm trong thanh, và lề phải `--spacing-avatar-gutter` (4.5rem) của `#main-content` giữ chỗ cho nó. Dưới `lg` (điện thoại, máy gập, tablet dọc): chỉ có thanh trên cùng `h-14`; đổi app bằng nút launcher, không có thanh tab ở đáy (bỏ 2026-11-16).
- Mỗi app: master–detail (`SplitLayout`) ở md+; điện thoại thấy danh sách, chọn mục thì sang trang chi tiết.
- Trang đồ thị `/do-thi/[app]`: sân khấu full chiều rộng, cao `h-stage` ở lg+, `h-stage-phone` dưới lg (trừ thanh trên cùng và vùng an toàn đáy). Mở từ trang chi tiết thì đồ thị chọn sẵn đúng nút của trang đó (`?n=<id>`, id = đoạn cuối URL).
- Trang danh sách của app khi chưa chọn mục nào: cột phải để trống (chỉ có `h1` cho trình đọc màn hình), không lời nhắc "Chọn một…". Khi Lưới ở `/wiki` và `/blog` (xem "Lưới index") không có cột phải: header và lưới thẻ nằm trong luồng trang. Riêng Alpha Console (`/console`) cột phải là danh sách Bộ M1–M4 chia sẻ (md+).
- Ghi chú kiến thức trải hết cột phải, lề trong `px-4 sm:px-6 md:px-8 xl:px-12`; không giới hạn `max-w-2xl`. Bài viết (`/blog/[id]`, cùng lề trong) có biên an toàn bên phải (chủ trang, 2026-11-16): cột đọc gồm thân bài, liên kết liên quan, nguồn và bình luận rộng tối đa `max-w-article` (52rem, token `--container-article`), căn trái sát mục lục; phần còn lại bên phải để trống, không đặt gì vào đó. Trang bài viết rộng tối đa `max-w-article-page` (90rem, token `--container-article-page`) và căn giữa khi màn rộng hơn: ở 1440px (Lưới) biên phải bằng đúng cột mục lục cộng khoảng cách (16rem), bài nằm cân giữa hai bên; hẹp hơn thì biên phải thu dần về 0, cột đọc không hẹp lại trước khi biên hết. Tiêu đề, mô tả và nhãn đầu trang không bị giới hạn bởi cột đọc. Bài blog có mục lục: khung `@container` đủ `@3xl` (48rem) thì mục lục là cột trái `14rem`, dính (`@3xl:sticky`, `top-navbar` từ token `--spacing-navbar`: 3.5rem dưới thanh h-14, 0 ở lg+ khi không có thanh; cao `max-h-split`, tự cuộn). Dưới `@3xl` mục lục ẩn; liên kết liên quan đặt sau bài, trước nguồn. Mục lục là danh sách liên kết thuần: không nền, không viền, không bóng. Nhãn `Trong bài` là `text-footnote font-medium text-label`; mỗi dòng là `text-subhead` thu về cỡ footnote bằng `.toc-row` (`app/globals.css`, scale 13/15) màu `secondary`. Mục lục theo vị trí đọc như bánh xe chọn của iPhone: dòng đang đọc (`ArticleToc`; chỉ số từ `activeIndex` trong `lib/tocSpy.ts`, tức đề mục cuối cùng đã qua vạch 30% chiều cao khung nhìn, tối thiểu 120px) hiện `text-subhead` màu `label`, đậm 500, có `aria-current="location"`; hai dòng cạnh (`data-near` 1 và 2) co nhẹ và nhạt dần về `secondary`; các dòng xa là `data-near="3"`; trước đề mục đầu không dòng nào sáng. Khung mục lục cuộn để giữ dòng đang đọc ở giữa; cỡ, màu và độ đậm chuyển trong 0.35s `ease-ios`, tắt khi `prefers-reduced-motion`. Dòng xa nhất dừng ở `secondary`, không nhạt hơn (chữ đọc được). Hover và focus bàn phím chuyển `text-label`, `min-h-9` (36px), chạm `pointer-coarse:min-h-11` (44px), thẳng hàng với nhãn. Nhãn dòng lấy từ `toc` của khối `h` (tối đa `tocMax` ký tự, không kết thúc bằng dấu câu); không có `toc` thì dùng tiêu đề đầy đủ, dài tối đa hai dòng. Cột trái hiện từ khoảng 832px viewport ở Lưới (có thanh trên cùng), khoảng 1200px ở Danh sách (có thanh dọc, lg; `main` còn `md:px-6`). Đề mục `scroll-mt-20`; `prefers-reduced-motion` tắt cuộn mượt. Đề mục bài viết là `text-title2 font-semibold`, cách trên `pt-10`; khối `h` có thể kèm `icon` (tên trong `headingIcons`), vẽ bởi `ArticleIcon` (SVG 24px nét 1.5px, `text-accent-text`, đặt trước chữ, không nền, không khung). Nhãn câu hỏi thường gặp dùng cùng kiểu, với icon `question`. Khối `steps` là một thẻ `rounded-card bg-card shadow-card divide-y divide-separator` gồm `ol`: cột số `w-6` `text-footnote font-semibold text-secondary`, nội dung `text-body text-label`, dòng «Kiểm:» `text-footnote` (nhãn `font-medium text-label`, nội dung `text-secondary`); chú thích dưới thẻ như bảng, không cuộn ngang.
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
- Trang chứa đồ thị mà cuộn được: lăn chuột để cuộn trang, Ctrl/⌘ + lăn hoặc chụm trackpad để zoom; trên cảm ứng vuốt dọc cuộn trang, vuốt ngang xoay. Landing và `/do-thi/[app]` không cuộn nên lăn chuột là zoom.
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
Công tắc bản của bài (`ArticleVariants.tsx`, `role="group"`, nhãn đọc màn hình là `blog.detail.variants`): đặt dưới tiêu đề và mô tả, trên thân bài, trong cột đọc `max-w-article`. Rãnh `mb-6 flex gap-1 rounded-full bg-fill p-1`; mỗi nút `flex-1 min-h-11 rounded-full px-3 py-2 text-subhead text-label`; nút đang chọn `bg-card shadow-thumb font-semibold` với `aria-pressed="true"`, nút còn lại `font-medium`, hover `bg-fill-strong`. Nhãn là `label` của bản. Không nhãn phía trên, không màu cam (công tắc không phải nút chính).

### Inputs
`h-11 rounded-control bg-card text-callout` với viền `separator`; focus vòng `accent`. Không nhỏ hơn 16px chữ (iOS tự zoom).

### Cards / grouped lists
Một thẻ `rounded-card bg-card shadow-card divide-y divide-separator`. Không thẻ trong thẻ.

### Lưới index
Mặc định là lưới. Hai núm "Danh sách / Lưới" (`IndexViewSwitch`, mỗi app một hàng gọn trong menu avatar: tên app, hai nút icon 36px có vùng chạm cao 44px, không đóng menu) nằm trong menu avatar (`AccountButton`), không còn ở cột index của Product Wiki (`/wiki`) và `/blog`. Lưu trên máy này (`lib/indexView.ts`, khóa `index-view-blog` và `index-view-wiki`; khóa cũ `index-view` chỉ đọc khi chưa có khóa riêng), không đồng bộ tài khoản. Lưới ở `/wiki` và `/blog` (`SplitLayout` prop `browse`) không có cột index trái ở mọi kích thước: header rồi index là lưới thẻ trong luồng trang, 2 cột dưới md, 3 md, 4 xl, 5 2xl (wiki `aspect-[4/3]`, bài `aspect-[3/2]`); chọn mục thì chỉ hiện chi tiết, index ẩn bằng `hidden` nhưng vẫn mount. Từ lg, Lưới cũng bỏ thanh dọc: thanh trên cùng (`site-nav-wide`, cùng hàng `h-14`) có logo trái đúng chỗ launcher của thanh dọc, tìm kiếm giữa, avatar phải. Ở `/blog/kien-thuc` ghi chú xếp 2 cột md, 3 xl. Núm loại và núm phần (`md:max-w-md`), bộ lọc và lộ trình (`md:max-w-2xl`) không kéo hết trang. Danh sách giữ 2 cột như cũ. Mỗi thẻ là một link; hai ảnh đầu của nhóm đầu tải sớm (`preload`), còn lại lazy. Lộ trình học chỉ có danh sách.

### Navigation
Từ lg (mọi trang trừ landing): thanh dọc `AppSidebar` cố định bên trái, rộng `w-sidebar` (20rem), nền `bg`, viền phải `separator`, không có thanh trên cùng (trừ `/wiki` và `/blog` ở Lưới, xem dưới). Phần đầu cao đúng `h-sidebar-head` (7rem): nút launcher bên trái (logo chấm 3×3, chấm giữa cam, + tên app đang dùng, chưa ở app nào thì "alphacolorlab.com"; bấm bung popover `.app-launcher` gồm 4 app, chấm màu + tên, mục đang mở `bg-fill`); ô tìm kiếm. Avatar luôn ở góc trên phải mọi màn, không nằm trong thanh (nút cố định, xem Layout). Ngay dưới là index của app đang mở: cột index của `SplitLayout` rời lưới, cố định `top-sidebar-head` tới đáy, cuộn riêng; trang split chỉ còn cột chi tiết; `/wiki` và `/blog` ở Lưới không có thanh dọc, thay bằng thanh trên cùng `site-nav-wide` (xem "Lưới index"). `/admin` và `/admin/decode` luôn như vậy (`wideBrowseOf` trong `lib/indexView.ts`), không có cột index. Nội dung lùi trái đúng `--spacing-sidebar` và lùi phải đúng `--spacing-avatar-gutter` (globals.css, `body:has(> .app-sidebar)`); `h-split`, `h-stage` thành 100dvh (`:root:has(.site-nav-wide)` trừ thêm 3.5rem); thanh cố định ở đáy (giỏ màu, so sánh) dùng `lg:left-sidebar`, trừ khay so sánh ở Blog và Wiki Lưới. Tìm kiếm và avatar chỉ mount ở một nơi (`useLg` trong `AppNav.tsx`: thanh trên cùng dưới lg hoặc khi wide, avatar cố định của `AppSidebar` từ lg). Dưới lg: thanh trên cùng gồm launcher trái (logo chấm + tên app đang mở, cắt gọn ở `max-w-28` dưới sm; chưa ở app nào thì dưới sm chỉ có logo chấm), tìm kiếm + avatar phải. Nút avatar mở menu: Túi đồ (`/tai-khoan`), Xem đồ thị (của app đang mở, chọn sẵn nút của trang đang xem), Danh sách/Lưới của Blog và Product Wiki (`IndexViewSwitch`), Đăng nhập/Đăng xuất. Dưới lg không có thanh tab ở đáy: launcher là lối đổi app duy nhất; các thanh cố định ở đáy (giỏ màu, so sánh, thanh lưu của `/admin`) dính `bottom-0` kèm `pb-safe`.

### Search
Cả trang chỉ có **một** ô tìm kiếm: `SearchField` trên thanh điều hướng; landing không có thanh điều hướng nên ô đó nằm trên đồ thị tổng hợp, mở bằng nút kính lúp ở góc trên phải, chỉ có ở bước 3. Không đặt ô tìm thứ hai trong trang hay trên đồ thị. Trang cần tìm riêng thì đăng ký nguồn qua `lib/pageSearch.ts`: đồ thị thêm nút của nó lên đầu gợi ý (chọn thì bay tới nút), Ngoại lệ: ô nhập thêm đồ của `GearManager` (nhập để thêm, không phải tìm trang) và hộp thoại modal (thanh điều hướng bị che).

### InfoTip
Nút "i" cạnh nhãn, nội dung trong `app/content.ts`. Thay cho mọi dòng chữ phụ dưới tiêu đề.

### Sơ đồ bài viết
Sơ đồ SVG trong bài (`figure` với `src` là `/blog/<id>-dN.svg`), đặt trong `public/blog/`. Figure đầu tiên của bài nên là ảnh chụp: og:image lấy ảnh chụp đầu tiên và bỏ qua SVG (`lib/jsonld.ts`).
- Khung `viewBox="0 0 720 480"`, nền trắng `card`, khung hiển thị tỉ lệ 3:2.
- Chỉ dùng màu token. Hex dưới đây được phép vì file nằm trong `public/` và phải khớp `app/globals.css`: chữ `label` #0b0d12, `secondary` #4a5260, `tertiary` #7c8594 (chỉ nét trang trí), `separator` #e3e6eb, `bg` #f2f2f7, `accent` #c2410c (một điểm nhấn mỗi sơ đồ), `accent-text` #c2410c. `success` và `danger` chỉ cho đúng và sai.
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
