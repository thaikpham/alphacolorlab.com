# Bàn giao phiên làm việc 2026-11-09: Redesign "Kính ngắm trong studio"

Dự án **không phải git repo**. Bản sao lưu trước khi làm lại giao diện: `~/backups/alpha-console-before-redesign-20261109-1816.tgz`.

Trạng thái lần chạy cuối:
- `npm test`: 520/520 pass.
- `npm run check:design`: sạch.
- `npm run build`: thành công.

Luật thiết kế: `DESIGN.md`. Luật dự án: `AGENTS.md`. Cả hai đã cập nhật theo mọi thay đổi bên dưới.

## 1. Nền tảng thiết kế
- **Chỉ giao diện sáng.** Token trong `app/globals.css` (`@theme`):
  - Màu nền và chữ: `bg` #f3f4f6, `card` #fff, `label` #0b0d12, `secondary` #4a5260.
  - `tertiary` #7c8594, chỉ dùng trang trí.
  - Màu nhấn: `accent` #f05a14 (cam Alpha); `on-accent` gần đen (chữ trên nền cam); `accent-text` #b43f00.
  - Màu từng app: `app-console`, `app-colors`, `app-wiki`, `app-blog`.
  - Chiều cao: `h-stage`, `h-stage-phone`.
- **Font Noto Sans tự host:** `public/fonts/*.woff2` và `OFL.txt`. Preload trong `app/layout.tsx`, đã thêm vào precache của `public/sw.js`.
- **Service worker:** `sw.js` VERSION 1.2.0.
- **Kiểm tra thiết kế:** `scripts/check-design.mjs` cấm `text-white`. Mọi `text-white` đã đổi thành `text-on-accent`.
- **Luật người dùng nhấn mạnh** (đã lưu trong memory):
  - Không chữ xám nhạt.
  - **Không bao giờ thêm dòng giải thích/gợi ý màu xám** dưới nút, bước, tiêu đề, ô nhập hay module. Cần giải thích thì dùng nút "i" (`InfoTip`).
  - Không "dấu vết AI": không gradient, glow, emoji, ký tự làm icon, câu chữ quảng cáo.

## 2. Cấu trúc trang hiện tại
| Route | Nội dung |
|---|---|
| `/` | **Landing**, không có thanh điều hướng. Thứ tự: h1 ẩn (sr-only); "Một bản đồ, bốn ứng dụng"; đồ thị tổng hợp tràn viền; 4 app, mỗi app có đồ thị riêng ở trên, tên và mô tả ở dưới, không nút zoom; cuối trang khối **Bắt đầu** (`#bat-dau`) chỉ có nút cam "Truy cập dự án" → `/console`. |
| `/console` | Alpha Console, danh sách 2 cột (`SplitLayout`, `lists={["console"]}`). Trước đây ở `/`. |
| `/cai-tay/[chuong]`, `/tao-m1-m4`, `/giai-ma` | Như cũ, nút quay lại trỏ về `/console`. |
| `/colors`, `/wiki`, `/blog` | Danh sách 2 cột, trang chủ lấy lại từ bản sao lưu. |
| `/do-thi/[app]` | Đồ thị riêng của từng app, mở từ menu avatar ("Xem đồ thị" hoặc "Xem trang này trên đồ thị" kèm `?n=<id>`). |
| `/tai-khoan` | **Hồ sơ**: avatar Google trong khung lấy nét, tên, @username, bio, tối đa 5 link, đếm túi đồ, Chia sẻ hồ sơ (nút cam), Sửa hồ sơ, Đăng nhập/xuất, ô Thêm đồ, lưới thẻ món có ảnh. |
| `/ho-so#<dữ liệu>` | Hồ sơ người khác chia sẻ, chỉ xem. Dữ liệu nén trong phần `#`, không cần server. |

**Thanh điều hướng** (`AppNav`, `SiteHeader`):
- Logo chấm 3×3.
- 4 tab app có chấm màu, chỉ hiện từ `lg`. Dưới `lg` có thanh tab ở đáy (`AppTabBar`, đặt ngoài header).
- Một ô tìm kiếm duy nhất (`SearchField`).
- Nút avatar mở menu: Hồ sơ và túi đồ, Xem đồ thị, Đăng nhập/Đăng xuất.

**Trang chi tiết:**
- Bài viết, ghi chú kiến thức, bài đăng: trải hết cột phải (bỏ `max-w-2xl`, lề `xl:px-12`).
- Trang sản phẩm Wiki: một cột duy nhất, ảnh khung `aspect-[21/9]`.

## 3. Không có cổng đăng nhập
- Mọi trang mở tự do, kể cả `/tao-m1-m4` và `/tai-khoan`. Đã xóa `lib/access.ts`, `AccessGate`, `AccessPanel`, `SignInModule`, `test/access.test.ts`.
- Đăng nhập Google là tùy chọn, chỉ để đồng bộ theo tài khoản (mục 5). Chỗ đăng nhập: menu avatar (`AccountButton`) và `/tai-khoan`.
- Túi đồ chỉ thêm ở `/tai-khoan`.

## 4. Đồ thị (`app/components/Constellation.tsx`): engine canvas tự viết
Tôi viết lại engine từ mockup đã duyệt; hai lần giao cho agent đều hỏng. Logic như sau:
- **Cấu trúc:** một object engine trong `useEffect([graph, router])` và một vòng `requestAnimationFrame`. React chỉ giữ phần giao diện phủ lên, không render lại mỗi khung hình.
- **Toán:** chiếu 3D, kéo nút, xếp vòng nút kề ở `lib/constellationView.ts` (có test).
- **Bố cục:** `lib/layout3d.ts` tính sẵn lúc build, theo các bước:
  1. Chạy mô phỏng lực.
  2. Trải đều các nút trong khối cầu theo thứ hạng khoảng cách.
  3. Cho lực dàn lại thêm một nhịp (`RELAX` 0.35).
  4. Co về bán kính 170.
- **Tương tác:**
  - Chọn nút: camera bay tới, khung lấy nét 4 góc thu dần vào nút, nút kề xếp thành vòng, phần còn lại mờ đi.
  - Bấm hoặc chạm lần hai thì mở trang, kèm hiệu ứng gợn; chỉ dẫn "Bấm lần nữa để mở".
  - Kéo nền để xoay, kéo nút để dời, chụm hai ngón hoặc lăn chuột để zoom.
  - Bàn phím: mũi tên đi qua nút kề, Enter chọn rồi mở, Esc bỏ chọn.
  - Đồng bộ `?n=` trên URL.
- **Hình ảnh:**
  - Nhãn chữ thường, nét 400.
  - Cạnh là đường chấm cong, độ đậm 55%.
  - **Tín hiệu kiểu xung thần kinh** chạy ngẫu nhiên trên cạnh, màu ngẫu nhiên trong bảng màu.
  - Nút trong túi đồ có vòng chấm ngoài.
  - Nút đung đưa nhẹ.
- **Trạng thái chờ:**
  - Tự xoay quanh trục đứng (`SPIN` 0.12 rad/s) và luôn vừa khung.
  - Dừng khi người dùng tương tác. Không còn nút Toàn cảnh, nên sau khi dừng chỉ tải lại trang mới xoay lại.
  - Không tự chọn nút nào, trừ khi URL có `?n=`.
- **Trang cuộn được** (landing):
  - Lăn chuột để cuộn trang, zoom bằng Ctrl/⌘ + lăn.
  - Trên cảm ứng: vuốt dọc cuộn trang, vuốt ngang xoay.
- **Prop:**
  - `graph`, `title`, `mine`, `autoFocus` (hiện không ai dùng), `header`, `className`.
  - `controls` (tắt 2 nút zoom; nút zoom mặt 32px, vùng chạm 44px).
  - Wrapper `MineConstellation` tự lấy `mine` từ túi đồ và giỏ màu.
- **Tìm nút:** qua thanh tìm kiếm chung (`lib/pageSearch.ts`, nhóm gợi ý "Trên đồ thị").
- Mọi đồ thị **tràn viền, không khung**.

**Dữ liệu** (`lib/appGraphs.ts`):
- `consoleGraph`, `colorsGraph`, `wikiGraph`, `blogGraph`.
- `allGraph()`: 286 nút, 700 cạnh. Các id dùng chung giữa app được gộp làm một nút; nút `lay-net` bị trùng nghĩa giữa console và blog được đổi thành `blog/lay-net`.
- Id nút = đoạn cuối của URL.
- Test: `test/appGraphs.test.ts`.

## 5. Túi đồ và hồ sơ
- **Lưu trữ túi đồ:** `lib/gear.ts`, localStorage `gear-bag`.
  - **Không giới hạn số món.**
  - `toggleGear` trả về `GearBag`.
  - `pickModel` tự chọn máy có hướng dẫn.
- **Catalog:** `lib/gearCatalog.ts`.
  - 36 body và 82 lens có ảnh.
  - Phụ kiện gồm 6 món từ Wiki (có ảnh) và 7 món nhập tay trong `data/accessories.json` (chưa đối chiếu nguồn).
  - `findGear` khớp lỏng theo tên hoặc mã.
  - `suggestGear` cho gợi ý khi gõ.
- **`GearManager`:** ô nhập kèm gợi ý và nút Thêm. Món không có thì hiện hộp thoại "Sản phẩm này chưa được hỗ trợ". Prop `showList`, `title`, `secondary`.
- **Hồ sơ** (`lib/profile.ts`, localStorage `user-profile`):
  - Lưu username, bio, link.
  - `cleanLink` chỉ nhận http/https.
  - `encodeShare`/`decodeShare` cho link `/ho-so#…`; mọi trường được kiểm lại khi đọc.
- **Đồng bộ theo tài khoản:** `lib/userState.ts`, `SYNCED` gồm `color-bank-cart`, `wiki-compare`, `gear-bag`, `user-profile`, `camera-model`.
- **Component:** `ProfilePage`, `ProfileView`, `SharedProfile`.

## 6. File đã xóa hoặc thay
- **Đã xóa:**
  - Trang cũ `app/graph`, `app/colors/graph`.
  - Component `GraphClient`, `GearLanding`, `GearButton`, `GearPicker`, `AccountPage`, `AppHome`.
  - Đồ thị 2D cũ trong `lib/graph.ts` (chỉ giữ `generateSiteGraph`, `hubIdFromValue`).
  - Ô lọc riêng của Color Bank.
- **Redirect:** `/graph` → `/do-thi/blog`; `/colors/graph` → `/do-thi/colors` (`lib/legacyRedirects.ts`).
- **Link cũ** `/?model=` và `/#tao-preset` được `LegacyHomeLinks` chuyển sang `/console`.

## 7. Việc còn mở và rủi ro
1. **Chưa thử đăng nhập Google thật từ đầu đến cuối.** Mới thử bằng một phiên giả trong localStorage.
2. **Chưa xem kỹ ở 390px và 840px:** landing mới, khối Bắt đầu, trang hồ sơ, trang sản phẩm một cột.
3. **Công cụ chụp màn hình** của khung trình duyệt trả ảnh trắng khi trang đã cuộn. Phần dưới landing mới được xác nhận bằng cách đọc DOM và kiểm tra điểm ảnh canvas.
4. **Hiệu năng:** landing chạy 5 canvas cùng lúc (đồ thị nào khuất màn hình thì ngừng vẽ). Chưa đo trên điện thoại thật.
5. **Đồ thị dày** (Color Bank, đồ thị tổng hợp): vài nhãn vẫn nằm sát nhau khi xoay.
6. **Giao diện chưa đồng nhất:** trang chủ 4 app (danh sách 2 cột) vẫn kiểu cũ (`text-display font-bold`), khác với landing, hồ sơ và trang đồ thị.
7. **Dữ liệu chưa xác minh:** mã màu cam Sony là ước lượng; `data/accessories.json` chưa đối chiếu nguồn.
8. **Hai server đang chạy trong thư mục dự án:**
    - Bản production `npm run start` ở cổng 3200 (cấu hình `prod`, autoPort, trong `.claude/launch.json`).
    - Một `next dev` cổng 3000 của phiên khác.
    - Cổng 3100 là dự án khác (`~/lhbuild`).

## 8. Lệnh kiểm tra
```bash
npm run check:design
npm test
npm run build
```
