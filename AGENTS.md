<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Luật dự án cho mọi AI agent

File này là nguồn luật duy nhất cho mọi công cụ AI (Claude Code, Codex, Cursor, Copilot, Gemini, Windsurf…). `CLAUDE.md`, `GEMINI.md`, `.github/copilot-instructions.md` và `.cursor/rules/design-system.mdc` chỉ trỏ về đây. Sửa luật ở file này, không sửa ở các file trỏ.

## Dự án

Trang hướng dẫn tiếng Việt cài đặt máy ảnh Sony: ZV-E10 và A6400 (Legacy Menu), A7C II (New-gen Menu), kèm công cụ tạo 4 file Memory Recall (M1–M4) cho ZV-E10. Next.js 16 app router, React 19, Tailwind CSS v4, TypeScript. Không thêm thư viện UI, thư viện icon hay thư viện đồ thị/3D (đồ thị vẽ bằng canvas tự viết).

- `app/content.ts`: toàn bộ nội dung chữ. Sửa chữ ở đây, không viết cứng trong component.
- `app/(console)/*`, `app/layout.tsx`, `app/components/*`: giao diện.
- `app/globals.css`: token thiết kế (khối `@theme`) và toàn bộ CSS của dự án.
- `lib/zve10/*`: codec file `.DAT` của Sony. Xem mục "Codec" bên dưới.
- `lib/a6400/dat.ts`: đọc thử nghiệm file `.DAT` của α6400, chỉ đọc, không tạo file. Không đặt `decoded: true` cho α6400.
- `lib/datImport.ts`: nhận diện file `.DAT` là máy nào rồi giải mã ở chế độ chỉ đọc (`importDat`, `toSlotSettings`). Không ghi file, không ném lỗi.
- `app/components/DatImport.tsx` (client): chọn file `.DAT` trong trình duyệt, hiện kết quả từng file. Dùng ở `/giai-ma` và `PresetBuilder`; ảnh ZV-E10 nạp vào ô đang sửa qua `onUse`.
- `lib/cardWriter.ts`: ghi thẳng file vào thẻ nhớ qua File System Access API (Chrome, Edge trên máy tính). Chỉ dò tên thư mục đã biết, sao lưu bộ cũ trước khi ghi đè, đọc lại so từng byte. Test bằng thư mục giả trong `test/cardWriter.test.ts`.
- Bộ preset M1–M4 cho người mới: `data/preset-sets.json`, kiểm tra bằng `lib/presetSets.ts` (file sai thì build lỗi). Sửa bằng trang `/admin` khi chạy `npm run dev` (bản production trả 404 cho `/admin` và `/admin/api`), lưu xong thì commit và deploy. Bộ có `recommended: true` được nạp sẵn ở bước 2.
- **Landing** (`app/page.tsx`, "/", không có thanh điều hướng), 3 màn: lớp giới thiệu có nút "Mở Alpha Console" (`/console`) phủ trên đồ thị tổng hợp cả 4 app (`allGraph()` trong `lib/appGraphs.ts`) tràn viền; đồ thị tổng hợp hiện trọn (`LandingGraph`: lùi zoom về vừa khung, ô tìm kiếm, chú giải màu bấm để lọc theo app, ít nhãn khi chờ); màn cuối gộp trong một màn hình: trái là thẻ túi đồ (`GearManager`) và đăng nhập Google (`LandingStart`, không bắt buộc, cũng là nơi hoàn tất vòng đăng nhập và bật đồng bộ vì landing không có nút avatar), phải là một thẻ 4 hàng (tên app, mô tả, bấm để mở) kèm nút "Mở Alpha Console"; túi có món thì có nút "Xem túi đồ trên đồ thị". Nút cam (`EnterLink`) đổi chữ và đích theo túi đồ và máy đã chọn (`entryModel` trong `lib/gear.ts`). Không có đồ thị nhỏ của từng app.
- **Điều hướng** (`app/components/AppNav.tsx`): từ lg chỉ có thanh dọc `AppSidebar` bên trái (launcher bung 4 app + avatar, tìm kiếm, rồi index của app đang mở từ `SplitLayout`); dưới lg là thanh trên cùng + thanh tab 4 app ở đáy. Landing không có cả hai.
- **Không có cổng đăng nhập**: mọi trang mở tự do, kể cả Tạo bộ M1–M4 và `/tai-khoan`. Đăng nhập Google (`lib/auth.ts`, khi bản này bật đăng nhập) chỉ để đồng bộ túi đồ, giỏ, danh sách so sánh, hồ sơ, máy đang chọn và bộ đã sưu tầm; đăng nhập nằm ở màn cuối của landing, menu avatar và `/tai-khoan`; đăng xuất nằm trong menu avatar và `/tai-khoan`.
- **Alpha Console** (`/console`, route group `app/(console)`): split view như Color Bank, Blog, Product Wiki. Cột trái `ConsoleIndex`: Máy của bạn (`ModelPicker`, danh sách `sonyBodies`), "Cài tay N bước" (4 chương `sections` + Tóm tắt, số bước theo máy), Công cụ (Tạo bộ M1–M4, Giải mã); máy đã giải mã thấy Công cụ ở trên Cài tay, máy khác ở dưới. Cột phải là một việc, mỗi việc một URL (chưa chọn gì thì hiện danh sách Bộ M1–M4 chia sẻ, md+): `/cai-tay/[chuong]` (id trong `sections` + `tom-tat`), `/tao-m1-m4` (PresetBuilder; chỉ máy có `decoded: true`, máy khác thấy thẻ "Tôi dùng ZV-E10"), `/giai-ma` (tiến độ `lib/decodeProgress.ts` + mini game). Lối vào: giỏ Color Bank → `/tao-m1-m4?cart`, công thức → `/tao-m1-m4?recipe=<id>`, trang máy trong Product Wiki → `/console?model=<id>`. Link cũ `/?model=` và hash cũ (`/#tao-preset`…) được `LegacyHomeLinks` ở landing chuyển sang Alpha Console theo `consoleHashRoutes` trong `app/content.ts`.
- **Bộ M1–M4 chia sẻ** (`/bo-m1-m4` và `/bo-m1-m4/[id]`, mở tự do; dòng trong Công cụ của Alpha Console chỉ hiện cho máy đã giải mã): bộ lấy từ `data/preset-sets.json`; `unlisted: true` (checkbox ở `/admin`) ẩn khỏi danh sách, `/bo-m1-m4/[id]` và `/kol/[handle]` nhưng vẫn ở Tạo bộ M1–M4 và giữ id; có `author` tùy chọn (nhập ở `/admin`, avatar chỉ https). Trang bộ tải ZIP 4 file theo hệ PAL/NTSC bằng `lib/presetDownload.ts` (kèm `HUONG_DAN.txt`); "Dùng bộ này" mở `/tao-m1-m4?set=<id>`. Sưu tầm bộ bằng `lib/savedSets.ts`, hiện ở `/tai-khoan` mục "Bộ đã sưu tầm".
- **KOL** (`/kol/[handle]` mở tự do; `/kol/sua` là trang quản lý, `noindex`, chưa đăng nhập thì mời đăng nhập; mục "Trang KOL của tôi" ở `/tai-khoan` chỉ hiện khi `isKol()` đúng): người có email trong `kol_emails` tự đăng hồ sơ, ảnh mẫu và bộ M1–M4 lên AUTH project qua `lib/kol.ts` (PostgREST và Storage bằng fetch, không SDK). Schema, RLS và bucket `kol` ở `supabase/kol.sql`; chủ dự án chạy tay trong SQL editor, chưa áp dụng tự động. `lib/kol.ts` là ranh giới tin cậy: mọi dữ liệu từ xa đi qua `parseKolProfile` và `parseRemoteSet` (ảnh chỉ từ bucket `kol` của AUTH, id bộ không trùng repo). Đọc từ xa lỗi hoặc chưa có bảng thì trang công khai hiện như khi chỉ có dữ liệu repo, không báo lỗi. `/bo-m1-m4/[id]` nhận bộ từ xa; id không có trong repo thì `noindex`.
- **Hướng dẫn** (`/huong-dan`, mở tự do, vào từ menu avatar): câu hỏi thường gặp trong `help` của `app/content.ts`, kèm FAQPage JSON-LD. Chỉ ghi điều đã có trong dự án; đổi tính năng thì sửa câu trả lời tương ứng.
- PWA: `app/manifest.ts`, icon trong `public/icons/` và `app/apple-icon.png`, service worker `public/sw.js`. Service worker chỉ đăng ký ở bản production. Đổi danh sách precache hoặc chiến lược cache thì tăng `VERSION` trong `sw.js`. Màu trong manifest phải trùng token `bg`.

## Design system: bắt buộc

Đọc `DESIGN.md` trước khi viết hoặc sửa bất kỳ giao diện nào. North Star: **"Kính ngắm trong studio"**: chỉ giao diện sáng, nền `bg` trắng lạnh, thẻ `card`, một màu nhấn cam Alpha `accent`, font Noto Sans tự host. Mỗi app mặc định là danh sách 2 cột (`SplitLayout`: index trái, chi tiết phải). Đồ thị (`Constellation`) có ở landing (chỉ đồ thị tổng hợp) và trang riêng `/do-thi/[app]` mở từ menu avatar; mọi đồ thị dùng cùng một component, cùng chức năng. Túi đồ nằm trong trang hồ sơ `/tai-khoan` (avatar, bio, liên kết, lưới món có ảnh, chia sẻ qua link `/ho-so#…`, `lib/profile.ts`).

1. **Chỉ dùng token.** Màu, cỡ chữ, bo góc, bóng, độ rộng trang lấy từ utility sinh ra bởi `@theme`:
   - Màu: `bg`, `card`, `label`, `secondary`, `tertiary` (chỉ trang trí), `separator`, `fill`, `fill-strong`, `accent`, `on-accent` (chữ trên nền accent), `accent-text`, `app-console`, `app-colors`, `app-wiki`, `app-blog` (chỉ nút đồ thị và chấm nhận diện), `warning(-fill)`, `success(-fill)`, `danger(-fill)`.
   - Chữ: `text-footnote` 13, `text-subhead` 15, `text-callout` 16, `text-body` 17, `text-title3` 20, `text-title`, `text-display`.
   - Bo góc: `rounded-card`, `rounded-control`, `rounded-badge`, `rounded-full`.
   - Bóng: `shadow-card`, `shadow-thumb`. Easing: `ease-ios`. Container: `max-w-page`. Chiều cao: `h-split`, `h-stage`.
   - Canvas (đồ thị) đọc màu bằng `getComputedStyle(...).getPropertyValue("--color-…")`, không viết hex trong `.tsx`.
2. **Cấm giá trị tùy ý** trong className: `text-[13px]`, `rounded-[10px]`, `shadow-[…]`, `bg-[#…]`, `bg-(--x)`. Ngoại lệ duy nhất: `grid-cols-[…]`, `grid-rows-[…]`, `aspect-[…]`.
3. **Cấm thang mặc định của Tailwind:** màu palette (`blue-500`, `gray-100`), `bg-white`, `text-white`, `text-black`, `text-sm`, `rounded-lg`, `shadow-md`. Chúng đã bị xóa khỏi theme nên sẽ không có style.
4. **Cần giá trị mới?** Thêm token vào `@theme` trong `app/globals.css` và mô tả trong `DESIGN.md` trong cùng một thay đổi. Không thêm ngoại lệ vào script kiểm tra.
5. **Mẫu thành phần:** một thẻ `rounded-card bg-card shadow-card divide-y divide-separator`, không thẻ trong thẻ. Một nút cam (`bg-accent text-on-accent`) mỗi màn; nút phụ `bg-fill`. Lựa chọn loại trừ dùng segmented control. Input và select dùng `h-11 text-callout`. Vùng chạm tối thiểu 44px.
6. **Cấm:** nhãn eyebrow trên tiêu đề, nhãn viết hoa toàn bộ, ký tự làm icon (›, ✓, →, •), emoji, gradient, glow, bóng màu, kính mờ ngoài thanh điều hướng, giao diện tối, file CSS mới, `style={{ color: … }}`, câu chữ quảng cáo ("Khám phá ngay", "Mở khóa").
7. **Ghi chú:** xám (`bg-fill`) mặc định. Cam (`bg-warning-fill`) chỉ khi bước có `noteTone: "warning"` trong `app/content.ts`.
8. **Không dòng chữ phụ:** không đặt dòng gợi ý, lead hay tag màu `secondary` dưới tiêu đề, ô chọn hay nút. Cần giải thích thì đặt nút "i" (`InfoTip`, nhận `{ term, lines }`) cạnh nhãn; chữ vẫn nằm trong `app/content.ts`. Chữ đọc được tối thiểu màu `secondary`.

## Nội dung

- Viết tiếng Việt, câu ngắn, giọng hướng dẫn. Tên menu theo đúng chữ trên máy; tên tiếng Anh ở dòng phụ.
- Đối chiếu đường dẫn menu với Help Guide chính thức của Sony (ZV-E10: helpguide.sony.net/ilc/2070, ILCE-6400: helpguide.sony.net/ilc/1810, ILCE-7CM2: helpguide.sony.net/ilc/2360). Ghi rõ khác biệt giữa các model. Máy menu mới dùng tên tab Chụp, Phơi sáng/màu, Lấy nét, Cài đặt; đường dẫn của nó nằm trong `pathBy.a7c2` của từng bước.
- Máy bán ở Việt Nam mặc định PAL: file là `CAMPR0xP.DAT`. Gọi lại bằng MENU › Cài đặt máy ảnh1 › Chế độ chụp › MR (không phải "MR Memory", là mục lưu và sẽ ghi đè).

## Codec

`lib/zve10/dat.ts` là bản port từ ứng dụng Python SonyRecallColor và phải khớp từng byte. Sau mọi thay đổi trong `lib/zve10/`:

```bash
python3 scripts/parity.py && node --experimental-strip-types scripts/parity.ts
npm test
```

Không đổi offset, checksum hay header khi chưa có bằng chứng từ file máy thật.

A7C II (New-gen Menu) dùng định dạng khác, ở `lib/a7c2/dat.ts`: header 0x00–0x37, checksum header ở 0x39, số bản ghi ở 0x3C, 1061 bản ghi `[mã][kiểu][cỡ][số phần tử][giá trị]`, u32 tổng byte ở cuối. Mã cài đặt đã giải nằm ở `lib/a7c2/settings.ts` (giá trị nào đã thấy trong file máy thì ghi `confirmed`); giải tiếp bằng file mẫu đổi từng cài đặt (`scripts/a7c2-diff.ts`), test bằng file máy thật trong `test/fixtures/a7c2/`. Sau mọi thay đổi trong `lib/a7c2/` chạy `npm test`.

Header 0x00–0x37 (ngày, tên ô, byte 0x35 chưa giải mã) phải lấy nguyên từ file do máy lưu cho đúng ô: `buildSet(..., headers)` với `public/dat/zve10-{pal,ntsc}-m{1..4}.dat`. Đổi ngày hoặc tên trong header thì máy báo File Error ở mọi ô.

## Trước khi báo xong

```bash
npm run check:design
npm test
npm run build
```

`npm run build` tự chạy `check:design` trước. Xem trang ở 390px, 840px (điện thoại gập) và 1440px.
