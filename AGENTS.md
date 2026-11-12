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
- `lib/decode/*`: bảng giải mã, chỉ đọc. `status.ts` (`ValueStatus`, `LocalFindings`), `table.ts` (`decodeTable`), `matrix.ts` (`modelSummary`, `ROUNDS_CAP`), `observed.ts`, `adapters.ts`; `scanFs.ts` chỉ dùng Node (`writeScan`), không import vào bundle client. Nguồn: `test/fixtures/camera-saved.json` (manifest file máy thật) và `test/fixtures/rounds/<model>/<id>/` (`mission.json` và 4 file `CAMPR0x[PN].DAT`). Quét lại bằng `npm run decode:scan`, ghi `data/decode-observed.json` và `data/decode-summary.json`. Luật: giá trị chỉ thành `confirmed` qua file máy thật đã lưu (manifest hoặc `rounds/`).
- `lib/game/plan.ts` (`planMission`, `yieldTargets`, `planYield`) và `lib/game/analyze.ts` (`analyzeRound`, `localFindings`, `mergeLocal`): lượt giải mã tiếp theo lập từ phát hiện trên máy. `GameDialog` nhận `mission` (lượt đã lập cho đúng máy) và `onRoundDone` (báo khi lượt đạt).
- `app/components/decode/NextRound.tsx` (client, `/giai-ma` và `/admin/decode`): lượt tiếp theo và mini game, tự giữ seed và đọc phát hiện trên máy. `app/components/decode/DecodeTable.tsx` (client, chỉ `/admin/decode`): bảng tham số, không import từ `/giai-ma`. `app/components/decode/localStore.ts` giữ phát hiện trên máy (localStorage `decode-findings`, sự kiện `LOCAL_EVENT`), chỉ ghi khi lượt đạt; không đưa vào repo.
- `app/admin/decode/api/route.ts`: lưu một lượt vào `test/fixtures/rounds/<model>/<id>/` rồi quét lại. Chỉ chạy khi `npm run dev` (production 404), chỉ nhận Origin localhost, trả 409 nếu thư mục đã có. `app/admin/decode/page.tsx` (server, production 404, noindex; `app/robots.ts` đã chặn `/admin`, gồm cả `/admin/decode`) gồm bảng tham số và `NextRound` với prop `showDevSave`: nút "Lưu lượt này vào dự án" (`DevSaveRound`) chỉ hiện ở trang này. Nhóm chọn máy trên trang này gọi `setModel`, nên đổi cả "Máy của bạn".
- Quy trình giải mã: `lib/game/plan.ts` (`planMission`) lập lượt chỉ nhắm giá trị chưa thấy trong file máy; `lib/game/analyze.ts` (`analyzeRound`) đọc 4 file của lượt và trả phát hiện. Lưu lượt ở `/admin/decode` thì file vào `test/fixtures/rounds/`, được quét như file máy lưu (`npm run decode:scan` ghi `data/decode-observed.json` và `data/decode-summary.json`), nên bảng và phần trăm tiến độ tự cập nhật, không nhập tay. `app/admin/decode/Candidates.tsx` liệt kê mã và vị trí ứng viên từ các lượt đã lưu; ứng viên chỉ thành kết luận khi đã đưa vào codec. Một giá trị chỉ được tính "đã xác nhận" khi đọc lại được từ file máy lưu nằm trong manifest hoặc trong một lượt đã lưu. Trang `/admin/decode` không có cổng đăng nhập hay kiểm email: nó chỉ tồn tại khi `npm run dev`.
- `lib/cardWriter.ts`: ghi thẳng file vào thẻ nhớ qua File System Access API (Chrome, Edge trên máy tính). Chỉ dò tên thư mục đã biết, sao lưu bộ cũ trước khi ghi đè, đọc lại so từng byte. Test bằng thư mục giả trong `test/cardWriter.test.ts`.
- Bộ preset M1–M4 cho người mới: `data/preset-sets.json`, kiểm tra bằng `lib/presetSets.ts` (file sai thì build lỗi). Sửa bằng trang `/admin` khi chạy `npm run dev` (bản production trả 404 cho `/admin` và `/admin/api`), lưu xong thì commit và deploy. Bộ có `recommended: true` được nạp sẵn ở bước 2.
- **Landing** (`app/page.tsx`, "/", không có thanh điều hướng), 3 màn: lớp giới thiệu có nút "Mở Alpha Console" (`/console`) phủ trên đồ thị tổng hợp cả 4 app (`allGraph()` trong `lib/appGraphs.ts`) tràn viền; đồ thị tổng hợp hiện trọn (`LandingGraph`: lùi zoom về vừa khung, ô tìm kiếm, chú giải màu bấm để lọc theo app, ít nhãn khi chờ); màn cuối gộp trong một màn hình: trái là thẻ túi đồ (`GearManager`) và đăng nhập Google (`LandingStart`, không bắt buộc, cũng là nơi hoàn tất vòng đăng nhập và bật đồng bộ vì landing không có nút avatar), phải là một thẻ 4 hàng (tên app, mô tả, bấm để mở) kèm nút "Mở Alpha Console"; túi có món thì có nút "Xem túi đồ trên đồ thị". Nút cam (`EnterLink`) đổi chữ và đích theo túi đồ và máy đã chọn (`entryModel` trong `lib/gear.ts`). Không có đồ thị nhỏ của từng app.
- **Điều hướng** (`app/components/AppNav.tsx`): từ lg chỉ có thanh dọc `AppSidebar` bên trái (launcher bung 4 app + avatar, tìm kiếm, rồi index của app đang mở từ `SplitLayout`); dưới lg là thanh trên cùng + thanh tab 4 app ở đáy. Landing không có cả hai.
- **Không có cổng đăng nhập**: mọi trang mở tự do, kể cả Tạo bộ M1–M4 và `/tai-khoan`. Đăng nhập Google (`lib/auth.ts`, khi bản này bật đăng nhập) chỉ để đồng bộ túi đồ, giỏ, danh sách so sánh, hồ sơ, máy đang chọn và bộ đã sưu tầm; đăng nhập nằm ở màn cuối của landing, menu avatar và `/tai-khoan`; đăng xuất nằm trong menu avatar và `/tai-khoan`.
- **Alpha Console** (`/console`, route group `app/(console)`): split view như Color Bank, Blog, Product Wiki. Cột trái `ConsoleIndex`: Máy của bạn (`ModelPicker`, danh sách `sonyBodies`; chip trạng thái giải mã chỉ khi `showDecodeStatus`), "Cài tay N bước" (4 chương `sections` + Tóm tắt, số bước theo máy), Công cụ (Tạo bộ M1–M4, Giải mã); máy đã giải mã thấy Công cụ ở trên Cài tay, máy khác ở dưới. Cột phải là một việc, mỗi việc một URL (chưa chọn gì thì hiện danh sách Bộ M1–M4 chia sẻ, md+): `/cai-tay/[chuong]` (id trong `sections` + `tom-tat`), `/tao-m1-m4` (PresetBuilder; chỉ máy có `decoded: true`, máy khác thấy thẻ "Tôi dùng ZV-E10"), `/giai-ma` (tiến độ `lib/decodeProgress.ts` chỉ khi `showDecodeStatus`, tức npm run dev; rồi `NextRound`: lượt tiếp theo, mini game; `DatImport` cuối trang; không có bảng tham số, bảng ở `/admin/decode`, chỉ dev). Lối vào: giỏ Color Bank → `/tao-m1-m4?cart`, công thức → `/tao-m1-m4?recipe=<id>`, trang máy trong Product Wiki → `/console?model=<id>`. Link cũ `/?model=` và hash cũ (`/#tao-preset`…) được `LegacyHomeLinks` ở landing chuyển sang Alpha Console theo `consoleHashRoutes` trong `app/content.ts`.
- **Bộ M1–M4 chia sẻ** (`/bo-m1-m4` và `/bo-m1-m4/[id]`, mở tự do; dòng trong Công cụ của Alpha Console chỉ hiện cho máy đã giải mã): bộ lấy từ `data/preset-sets.json`; `unlisted: true` (checkbox ở `/admin`) ẩn khỏi danh sách, `/bo-m1-m4/[id]` và `/kol/[handle]` nhưng vẫn ở Tạo bộ M1–M4 và giữ id; có `author` tùy chọn (nhập ở `/admin`, avatar chỉ https). Trang bộ tải ZIP 4 file theo hệ PAL/NTSC bằng `lib/presetDownload.ts` (kèm `HUONG_DAN.txt`); "Dùng bộ này" mở `/tao-m1-m4?set=<id>`. Sưu tầm bộ bằng `lib/savedSets.ts`, hiện ở `/tai-khoan` tab "Bộ đã sưu tầm".
- **Mod PP** (Color Bank, `/colors/[slug]`): bản chỉnh PP riêng của người dùng, lưu trên máy ở khóa `pp-mods` và đồng bộ qua `lib/userState.ts` (mục `pp-mods`). `lib/ppMods.ts` là ranh giới tin cậy (`parseMods`, `cleanPatch`); giá trị kiểm bằng `ppValue` của `lib/presetSets.ts`. Không có bảng server, không chia sẻ công khai. Vào Tạo bộ M1–M4 bằng `/tao-m1-m4?mod=<id>`; danh sách ở `ColorsIndex`, sửa ở `RecipeDetailContent`.
- **KOL** (`/kol/[handle]` mở tự do; KOL quản lý ngay ở `/tai-khoan` khi `isKol()` đúng, gồm ba tab Túi đồ, Bộ đã sưu tầm, Ảnh mẫu; một form gộp ở thẻ Giới thiệu (`KolIdentityForm`: tên đường dẫn, tên hiển thị, giới thiệu, liên kết, ảnh đại diện, lưu một lần: hồ sơ KOL trước, máy sau); nút "Đổi ảnh bìa" và tường có ô bộ M1–M4 (`KolWall`, `KolSetModule`); không có trang quản lý riêng): người có email trong `kol_emails` tự đăng hồ sơ, ảnh mẫu và bộ M1–M4 lên AUTH project qua `lib/kol.ts` (PostgREST và Storage bằng fetch, không SDK). Schema, RLS và bucket `kol` ở `supabase/kol.sql`; chủ dự án chạy tay trong SQL editor, chưa áp dụng tự động. Mỗi KOL một bộ: `saveSet` từ chối tạo bộ thứ hai (`canCreateSet`, lỗi `set-limit`), DB chặn bằng index duy nhất `kol_sets_one_per_user`; đường dẫn bộ khóa sau khi tạo. `lib/kol.ts` là ranh giới tin cậy: mọi dữ liệu từ xa đi qua `parseKolProfile` và `parseRemoteSet` (ảnh mẫu là link https bất kỳ, tối đa 300 ký tự, qua `photoUrl`, có thể kèm ghi chú (`{url, ...note}`: khẩu độ, tốc độ, ISO, ống kính tối đa 40 ký tự; ô M1–M4; công thức Color Bank; mod PP tùy chọn; lời ghi tối đa 140 ký tự; mỗi trường làm sạch riêng qua `photoNote`). Mod chỉ kiểm hình dạng ở `cleanMod` (khóa PP `^[A-Za-z0-9_]{1,40}$`, sai là bỏ cả mod); giá trị kiểm bằng `cleanPatch` của `lib/ppMods.ts` trước khi hiện. Lưu ngay khi thêm, xóa hoặc ghi chú bằng `savePhotos`; quá 16000 byte thì `note-too-long` ném trước khi gọi mạng; `kol_photos_ok` giới hạn tổng 16384 byte, không giới hạn riêng từng ảnh; ảnh đại diện và ảnh bìa chỉ từ bucket `kol` của AUTH, ảnh đại diện thêm được ảnh Google; id bộ không trùng repo). Đọc từ xa lỗi hoặc chưa có bảng thì trang công khai hiện như khi chỉ có dữ liệu repo, không báo lỗi. `/bo-m1-m4/[id]` nhận bộ từ xa; id không có trong repo thì `noindex`.
- **Danh sách / Lưới** (Product Wiki `/wiki`, `/blog`): mặc định là lưới, chỉ giá trị `list` đã lưu mới ra danh sách. `lib/indexView.ts` (localStorage `index-view`, không đồng bộ tài khoản) và núm `IndexViewSwitch` nằm trong thẻ "Cài đặt" của `/tai-khoan` (ProfilePage, luôn hiện, kể cả KOL), không còn ở cột index. Wiki giữ loại và bộ lọc chung cho cột index và lưới cột phải qua `ProductBrowseProvider` (`app/components/ProductIndex.tsx`); `/blog` dùng `ArticleIndex.tsx` và `articleGroups()` (`BlogIndex.tsx`). Ảnh bài lấy từ khối figure đầu tiên (`thumbOf` trong `lib/blog.ts`). Test: `test/indexView.test.ts`, `test/blogThumb.test.ts`.
- **Hướng dẫn** (`/huong-dan`, mở tự do, vào từ menu avatar): câu hỏi thường gặp trong `help` của `app/content.ts`, kèm FAQPage JSON-LD. Chỉ ghi điều đã có trong dự án; đổi tính năng thì sửa câu trả lời tương ứng.
- PWA: `app/manifest.ts`, icon trong `public/icons/` và `app/apple-icon.png`, service worker `public/sw.js`. Service worker chỉ đăng ký ở bản production. Đổi danh sách precache hoặc chiến lược cache thì tăng `VERSION` trong `sw.js`. Màu trong manifest phải trùng token `bg`.
- `data/article-rules.json`: luật kiểm tra bài viết dùng chung (câu cấm, giới hạn số lần, chủ đề, cấp độ, loại khối). `scripts/article-check.ts` đọc từ đây; sửa luật ở file này, không chép vào code.
- `data/knowledge.lock.json`: hash của vault tri thức (`ALPHASKILL_DIR`, mặc định `../alphaskill`), ghi bởi `node --experimental-strip-types scripts/import-knowledge.ts`. Vault đổi mà chưa import thì test drift báo lỗi. Link nguồn kiểm bằng `npm run check:sources`, lệnh này chỉ báo cáo, không tự sửa link.

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
