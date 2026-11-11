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
- Landing "/": không có thanh điều hướng, không tiêu đề hiển thị (chỉ `h1` cho trình đọc màn hình). Thứ tự: (1) lớp giới thiệu `#gioi-thieu` phủ trên đồ thị tổng hợp ngay khi mở trang (`-mt-viewport`, token `--spacing-viewport` = 100dvh; `.intro-overlay` trắng 85%, 30% cuối trong dần): tiêu đề "alphacolorlab.app" với chữ "color" tô dải màu Alpha + 4 app chạy và đổi sắc (`.hue-text`), 2 câu giới thiệu chung cho mọi máy Sony Alpha (`landing.intro.lines`, xuống hàng cố định từ md, không nêu tên mẫu máy), nút cam "Mở Alpha Console" (tới `/console`) ngay dưới 2 câu để vào thẳng không cần cuộn, quầng trắng `.intro-glow` và viền chữ `.over-graph`; mũi tên màu `label` có quầng trắng (đổi từ trắng sang đậm cho dễ thấy), nhún nhảy ở cạnh dưới (`ScrollHint`, `.scroll-hint`). (2) Mốc `#do-thi`: đồ thị tổng hợp (`LandingGraph`: sticky, `h-dvh`, không nút zoom) hiện trọn. Dưới lớp giới thiệu nó zoom gần làm nền (`1.3 ** 3`), cuộn quá nửa màn thì lùi mềm về vừa khung (`zoom` 1; màn dọc cao hơn 1.3 lần bề rộng thì 1.3 để đồ thị lấp khung) để thấy cả hình. Ở mốc này mới hiện (`data-graph-view` + `.graph-hint`/`.graph-legend`): chỉ dẫn lần đầu, ô tìm kiếm ở trên giữa (`SearchField`, ô tìm duy nhất của landing) và chú giải màu ở đáy. Khi chờ, mỗi app chỉ hiện nhãn 4 nút chính nhiều liên kết nhất (2 ở màn hẹp hơn 640px; `quietLabels`). (3) Màn cuối `#bat-dau` (gộp túi đồ và 4 app, gọn trong một màn hình): section nền `bg` cao một màn hình trượt lên che đồ thị, không tiêu đề hiển thị (`h2` cho trình đọc màn hình); `max-w-5xl`, từ lg 2 cột bằng nhau, dưới lg xếp dọc. Cột trái: thẻ túi đồ `GearManager` (tiêu đề "Bắt đầu với bộ máy của bạn", nút "Thêm" nền xám; `compact`: món đã thêm gói trong một dòng "Trong túi: …" cắt gọn để màn luôn vừa một màn hình, bỏ món thì sang `/tai-khoan`), dưới là đăng nhập (`LandingStart`): nút xám "Đăng nhập bằng Google" + nút "i" (`landing.start.syncTip`, nói rõ không bắt buộc); đã đăng nhập thì hiện tên và nút xám "Hồ sơ và túi đồ" (`/tai-khoan`); bản chưa bật đăng nhập thì ẩn. Cột phải: một thẻ `rounded-card bg-card shadow-card divide-y divide-separator` gồm 4 hàng `LinkRow` (chấm màu app + tên app, mô tả `landing.apps` luôn hiện, chevron; bấm hàng mở app), dưới là nút cam "Mở Alpha Console", nút cam duy nhất của màn. Túi có món thì cạnh nút đăng nhập có nút xám "Xem túi đồ trên đồ thị" (`BagOnGraph`): lướt lên mốc đồ thị và chọn sẵn một món trong túi (ưu tiên máy ảnh), không mở trang. Landing không còn đồ thị nhỏ của từng app. Mốc dừng khi cuộn: đầu trang, `#do-thi`, `#bat-dau`, cuối trang (`lib/scrollStops.ts`): lăn một nấc ở mốc thì lướt tới mốc kề, cuộn/vuốt dừng lưng chừng thì đi nốt theo hướng vừa cuộn, đoạn cao hơn 1.15 màn hình cuộn tự do; lướt bằng rAF easeInOutCubic 550–950ms, đặt vị trí `behavior: "instant"` từng khung (html có `scroll-behavior: smooth`); không dùng CSS scroll-snap. Glow, gradient chữ và lớp phủ trong suốt ở đây là ngoại lệ người dùng yêu cầu (2026-11-10), chỉ ở landing; mọi chuyển động tắt khi `prefers-reduced-motion`.
- Nút cam của landing (`EnterLink`, ở lớp giới thiệu và dưới danh sách 4 app) đổi theo người dùng (`entryModel` trong `lib/gear.ts`): người mới "Mở Alpha Console" (`/console`); túi đồ có máy được hướng dẫn thì "Cài <máy>" và vào thẳng máy đó (`/console?model=<id>`, ưu tiên máy đang chọn nếu nó nằm trong túi, không thì máy thêm sau cùng); người đã chọn máy từ lần trước thì "Tiếp tục với <máy>".
- Không có cổng đăng nhập: mọi trang mở tự do. Đăng nhập Google chỉ đồng bộ dữ liệu theo tài khoản (`lib/userState.ts`).
- Mỗi app mặc định là danh sách 2 cột: index bên trái, nội dung chi tiết bên phải (`SplitLayout`). Alpha Console ở `/console`.
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
- Trang danh sách của app khi chưa chọn mục nào: cột phải để trống (chỉ có `h1` cho trình đọc màn hình), không lời nhắc "Chọn một…". Riêng Alpha Console (`/console`) cột phải là danh sách Bộ M1–M4 chia sẻ (md+).
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
- Đồ thị luôn tràn viền: không thẻ, không bo góc, không bóng, không khung bao quanh. Bố cục 3D trải đều các nút trong khối cầu (`lib/layout3d.ts`) để thoáng mắt.
- Chú giải màu (`legend`, chỉ đồ thị tổng hợp ở landing): một viên `bg-card shadow-thumb` ở đáy giữa, 4 nút chấm màu + tên app (hàng ngang từ sm, lưới 2×2 dưới sm, cao 44px, `aria-pressed`). Bấm một app thì nút và cạnh ngoài app đó mờ còn 12%/8%, nhãn chỉ còn của app đó; bấm lại để bỏ. Không làm dừng trạng thái chờ. App đang lọc nằm trong URL (`?app=wiki`), mở link là thấy đúng trạng thái.
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
- Tìm nút bằng thanh tìm kiếm chung trên thanh điều hướng (nhóm gợi ý "Trên đồ thị").
- Bàn phím: canvas nhận Tab, mũi tên đi qua các nút kề, Enter chọn rồi mở, Esc về toàn cảnh. Có vùng `aria-live` đọc nút đang chọn.
- Màu đọc từ biến CSS `--color-*`, không viết cứng trong component.

### AF bracket (khung lấy nét)
Bốn góc vuông mảnh, như khung theo dõi lấy nét trên máy Sony. Dùng cho nút đang chọn trên đồ thị và avatar trang hồ sơ. Không bao quanh cả đồ thị, không dùng như trang trí ở chỗ khác.

### Dot meter
Hàng chấm đếm theo bước hoặc tiến độ, chấm đầy màu `accent`, chấm trống `separator`, kèm số dạng `tabular-nums`. Túi đồ không dùng (không giới hạn số món).

### Gear bag (túi đồ)
`GearManager`: một ô nhập tên hoặc mã (có gợi ý) và nút Thêm; không liệt kê catalog, không giới hạn số món. Món không có trong dự án thì hộp thoại "Sản phẩm này chưa được hỗ trợ". Đặt trong trang hồ sơ `/tai-khoan`. Chạy cả khi chưa đăng nhập.

### Profile (hồ sơ)
`/tai-khoan` (menu avatar › Hồ sơ và túi đồ): chỗ người dùng khoe túi đồ. Thẻ đầu: avatar Google trong khung lấy nét bốn góc, tên, @username, giới thiệu, liên kết (chỉ http/https, tối đa 5), đếm máy/ống kính/phụ kiện, nút Chia sẻ hồ sơ (nút cam duy nhất), Sửa hồ sơ, Đăng nhập/Đăng xuất. Dưới là ô Thêm đồ (nút xám) và lưới thẻ món: ảnh sản phẩm (`aspect-[4/3]`, `object-contain`), tên, mã; bấm vào mở Product Wiki; nút bỏ chỉ hiện khi đang sửa. Sau ô Thêm đồ là mục "Bộ đã sưu tầm" (chỉ hiện khi có bộ; hàng gồm tên bộ, tên tác giả ở cuối hàng và nút "Bỏ sưu tầm" xám). Chia sẻ tạo link `/ho-so#<dữ liệu>` (hồ sơ + túi đồ nén trong phần #, không cần server); `/ho-so` chỉ xem và kiểm tra lại mọi trường (`lib/profile.ts`). Hồ sơ lưu `localStorage` (`user-profile`), đồng bộ theo tài khoản. Túi đồ lưu trong `localStorage` (`gear-bag`), đồng bộ theo tài khoản qua `lib/userState.ts`.

### Bộ M1–M4 chia sẻ
`app/components/PresetSets.tsx` (`PresetSetList`, `PresetSetActions`, `SaveSetButton`), trang `/bo-m1-m4`, `/bo-m1-m4/[id]` và cột phải `/console` khi chưa chọn gì. Danh sách là một thẻ, mỗi hàng: tên bộ, tên tác giả ở cuối hàng (`secondary`), nút "Sưu tầm" xám (đổi thành "Đã sưu tầm" khi đã sưu tầm). Bộ `unlisted: true` (checkbox ở `/admin`) không vào danh sách, không mở được `/bo-m1-m4/[id]` và không lên `/kol/[handle]`, nhưng id vẫn bị chiếm và bộ vẫn có ở Tạo bộ M1–M4; khi không còn bộ nào hiện sau khi tải thì chỉ hiện dòng "Chưa có bộ nào được chia sẻ." (không thẻ trống). Trang bộ: thẻ đầu gồm mô tả bộ, hàng tác giả (avatar hoặc chữ cái đầu, tên, @handle, liên kết) và nút sưu tầm; thẻ "Cài đặt từng ô": mỗi ô là mục `<details>` có tên M1–M4 kèm nhãn ô, M1 mở sẵn, bên trong là ghi chú (khối xám, rule 7) và các dòng cài đặt (`summaryRows` trong `lib/presetSummary.ts`); chọn hệ PAL/NTSC (segmented, nút "i" cạnh nhãn); nút cam "Tải ZIP 4 file" là nút chính duy nhất của màn; nút xám "Dùng bộ này" mở `/tao-m1-m4?set=<id>`. Máy chưa giải mã không thấy phần tải, chỉ có dòng "Bộ này gồm file cho ZV-E10…" và nút "Tôi dùng ZV-E10".

### Builder M1–M4 (dashboard)
`app/components/PresetBuilder.tsx` (`/tao-m1-m4`) và `SlotCard.tsx`. Thanh bước là một hàng 4 cột ở mọi độ rộng, không sidebar: vạch `h-1.5` (cam khi đã xong, cam 40% khi đang mở, xám khi chưa) và nhãn `text-footnote` bên dưới. Bước 2 là bảng điều khiển: chọn bộ là chip `role="radio"` `h-11` (badge "Khuyên dùng" nằm trong chip; mô tả bộ nằm trong nút "i"); bốn ô M1–M4 luôn hiện thành thẻ `aria-pressed` (1 cột, 2 cột từ sm, 4 cột từ xl), mỗi thẻ một dòng tóm tắt và chấm cam khi đã chỉnh. Ô đang chọn được sửa ngay bên dưới, không cần mở: segmented chia nhóm Phơi sáng / Lấy nét / Màu / Máy, lưới 2 cột từ sm; các nhóm ẩn bằng `hidden` để giữ nháp form màu. Hành động của ô (Về mặc định của bộ, Chép từ ô khác, đọc file máy) là nút `bg-fill`. Màn chỉ một nút cam ở chân trang. Đổi ô thì `SlotCard` dựng lại (`key` theo ô).

### KOL
`KolView.tsx` (`/kol/[handle]`, KOL có trong repo), `RemoteKolView.tsx` (trang KOL: hiện dữ liệu repo trước, rồi gộp hồ sơ và bộ từ xa khi tải xong), `PhotoGrid.tsx` (lưới ảnh mẫu và hộp xem ảnh), `KolStudio.tsx` và `KolSetEditor.tsx` (`/kol/sua`). Trang KOL: ảnh bìa `aspect-[3/1]`, ảnh đại diện tròn `size-16` (không có thì ô chữ cái đầu xám), tên `text-title`, @handle `text-footnote` màu `secondary` (như hồ sơ), giới thiệu, liên kết chữ `accent-text` gạch chân; dưới là danh sách bộ trong một thẻ, rồi lưới ảnh mẫu 3 cột (4 cột từ sm) ô `aspect-square`. Bấm ảnh mở hộp xem ảnh (`dialog`: mũi tên trái phải, Esc, nút đóng; các nút là chữ, không dùng ký tự làm icon).
Trang quản lý một cột. Chưa có hồ sơ thì chỉ hiện form hồ sơ; lưu được lần đầu thì hiện danh sách bộ ngay. Lỗi tải hồ sơ hiện `loadFailed` kèm nút `Thử lại` (nút cam), không hiện form. Hồ sơ là một thẻ đệm `p-6 sm:p-8`; ảnh đại diện và ảnh bìa chọn bằng nút xám, ảnh đại diện mặc định là ảnh tài khoản Google khi chưa tải ảnh lên; ảnh mẫu tối đa 12, mỗi ảnh có nút xóa. Danh sách bộ có segmented Tất cả / Nháp / Công khai; xóa bộ qua hộp thoại xác nhận, nút xác nhận `bg-danger-fill text-danger` (không phải nút cam). Trình soạn bộ thay hồ sơ khi mở: ô đường dẫn tự lấy từ tên, trạng thái Nháp/Công khai là segmented, 4 ô M1–M4 là segmented, cài đặt từng ô dùng `SlotCard`. Mỗi màn chỉ một nút cam (Lưu của hồ sơ hoặc của trình soạn bộ).

### Buttons
Nút chính: `h-11 rounded-full bg-accent px-5 text-subhead font-semibold text-on-accent`. Nút phụ: `bg-fill text-label`, hover `bg-fill-strong`. Vùng chạm tối thiểu 44px.

### Segmented control
Rãnh `bg-fill rounded-full p-1`, núm `bg-card shadow-thumb`. Dùng cho lựa chọn loại trừ.

### Inputs
`h-11 rounded-control bg-card text-callout` với viền `separator`; focus vòng `accent`. Không nhỏ hơn 16px chữ (iOS tự zoom).

### Cards / grouped lists
Một thẻ `rounded-card bg-card shadow-card divide-y divide-separator`. Không thẻ trong thẻ.

### Navigation
Từ lg (mọi trang trừ landing): thanh dọc `AppSidebar` cố định bên trái, rộng `w-sidebar` (20rem), nền `bg`, viền phải `separator`, không có thanh trên cùng. Phần đầu cao đúng `h-sidebar-head` (7rem): nút launcher bên trái (logo chấm 3×3, chấm giữa cam, + tên app đang dùng, chưa ở app nào thì "alphacolorlab.app"; bấm bung popover `.app-launcher` gồm 4 app, chấm màu + tên, mục đang mở `bg-fill`), nút avatar bên phải; ô tìm kiếm. Ngay dưới là index của app đang mở: cột index của `SplitLayout` rời lưới, cố định `top-sidebar-head` tới đáy, cuộn riêng; trang split chỉ còn cột chi tiết. Nội dung lùi trái đúng `--spacing-sidebar` (globals.css, `body:has(> .app-sidebar)`); `h-split`, `h-stage` thành 100dvh; thanh cố định ở đáy (giỏ màu, so sánh) dùng `lg:left-sidebar`. Tìm kiếm và avatar chỉ mount ở một nơi (`useLg` trong `AppNav.tsx`). Dưới lg: thanh trên cùng gồm logo trái, tìm kiếm + avatar phải. Nút avatar mở menu: Túi đồ (`/tai-khoan`), Xem đồ thị (của app đang mở, chọn sẵn nút của trang đang xem), Đăng nhập/Đăng xuất. Dưới lg: thanh tab 4 app ở đáy, tôn trọng safe-area.

### Search
Cả trang chỉ có **một** ô tìm kiếm: `SearchField` trên thanh điều hướng; landing không có thanh điều hướng nên ô đó nằm trên đồ thị tổng hợp, chỉ hiện ở mốc đồ thị. Không đặt ô tìm thứ hai trong trang hay trên đồ thị. Trang cần tìm riêng thì đăng ký nguồn qua `lib/pageSearch.ts`: đồ thị thêm nút của nó lên đầu gợi ý (chọn thì bay tới nút), Ngoại lệ: ô nhập thêm đồ của `GearManager` (nhập để thêm, không phải tìm trang) và hộp thoại modal (thanh điều hướng bị che).

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
