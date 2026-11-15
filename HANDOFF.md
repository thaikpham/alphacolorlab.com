# Bàn giao 2026-11-16

File này ghi trạng thái và việc còn mở cho AI làm tiếp. Luật dự án nằm ở `AGENTS.md`, luật giao diện ở `DESIGN.md`. Hai file đó là nguồn đúng: đọc trước khi sửa bất cứ gì, và khi file này lệch với chúng thì tin chúng.

## 1. Trạng thái

- Repo git, nhánh `main`, remote `origin` = github.com/thaikpham/alphacolorlab.com (public).
- **Push lên `main` là phát hành production**: Vercel project `sonyalphacolorlab` tự deploy. Tên miền chính `www.alphacolorlab.com`. `sonycolorlab.app` là tên miền cũ của ColorLab 2.0, giữ lại để chuyển hướng người dùng cũ. Không bao giờ viết "alphacolorlab.app".
- Mỗi lần push cần chủ dự án đồng ý rõ ràng. Việc dọn dẹp trong repo (xóa code chết, đặt tên, commit cục bộ) thì tự quyết rồi báo lại một dòng.
- Lần chạy cuối (2026-11-16): `npm test` 747/747 pass, `npm run check:design` sạch, `npm run build` thành công.
- Lighthouse (bản build production, mobile và desktop): mọi trang đo được đạt 100 ở Performance, Accessibility, Best Practices và SEO, kể cả `/tai-khoan`, `/ho-so`, `/do-thi/*` sau khi bỏ `noindex` (mục 3).
- Các nhánh `chore/dead-code-cleanup`, `chore/ui-audit-no-tab-bar`, `fix/landing-step2-missing` đã nằm trọn trong `main`, xóa được.

## 2. Lịch sử gần đây

| Ngày | Commit | Nội dung |
|---|---|---|
| 11-11 | `438fa04` | Next.js 16 thay codebase ColorLab 2.0. |
| 11-12 | `da8a2fc` … `d2269f9` | Bàn giải mã (chỉ admin), bộ M1–M4 của KOL, Lưới/Danh sách cho Blog và Wiki, `supabase/cleanup.sql`. |
| 11-12 | `d913436`, `b8cf68e` | Landing 3 bước, cá nhân hóa theo túi đồ, bước 2 báo rõ còn thiếu gì. |
| 11-16 | `3ba541e` | Rà UI: bỏ thanh tab ở đáy điện thoại, sửa route, xóa code chết. |
| 11-16 | `2058019` | Lighthouse 100 (mục 3). |
| 11-16 | commit sau `2058019` | Mở chỉ mục `/tai-khoan`, `/ho-so`, `/do-thi/*`; sửa dữ liệu phụ kiện (mục 3, cuối). |

## 3. Phiên 2026-11-16: Lighthouse 100

Luật để giữ điểm đã ghi trong `AGENTS.md`, mục "Hiệu năng (Lighthouse 100)". Tóm tắt những gì đã đổi:

- **Font:** `unicode-range` của bản latin-ext từng chồng lên bản tiếng Việt, nên trang nào cũng tải thêm 168 KB trước LCP. Đã tách hẳn, `test/fontRanges.test.ts` chặn tái phát.
- **JS chung:** `AccountButton` và `LandingStart` bật đồng bộ qua `lib/useAccountSync.ts` (`import()` khi đã đăng nhập). `GearManager` ở landing tải bằng `next/dynamic`. Bảng preset, codec `.DAT` và danh mục sản phẩm không còn trong JS tải ngay; `test/clientBundle.test.ts` kiểm.
- **LCP là chữ có sẵn trong HTML.** Lighthouse mô phỏng cộng cả thời gian JS vào LCP khi LCP là ảnh hoặc chữ hiện sau hydrate (khoảng 3 giây trên điện thoại). Vì vậy:
  - Lưới `/wiki`, `/blog` dưới sm là thẻ ngang một cột, ảnh 80px bên trái.
  - Trang sản phẩm dưới sm: tóm tắt và ảnh 112px đứng cạnh nhau. Dòng mã ẩn khi trùng tên.
  - `/ho-so` và danh sách "Bộ từ KOL" render dòng chờ trong HTML rồi chỉ đổi chữ trong cùng phần tử.
- **Lưới ẩn:** mở thẳng trang chi tiết `/wiki/*`, `/blog/*` thì `SplitLayout` không dựng lưới index ẩn (trang phụ kiện giảm từ 443 KB xuống 114 KB HTML). Đã mở trang danh sách thì lưới vẫn giữ mount như cũ để giữ bộ lọc. Index ẩn không còn preload ảnh.
- **Đồ thị landing:** prop `backdrop` của `Constellation` dùng ở bước 1–2 (dpr 1, mọi cạnh một nét liền nhạt). Lần vẽ đầu đã tính sẵn zoom vừa khung, nên mở trang chỉ vẽ một khung. Bước 3 vẽ lại đủ nét chấm. Trong Lighthouse canvas rasterize bằng CPU; nét chấm ở dpr thiết bị từng làm một khung dài hơn 100 ms.
- **Sửa nhỏ:** `PresetBuilder` bỏ kết quả tải file mẫu cũ khi đổi PAL/NTSC nhanh; id menu avatar lấy từ `useId`; chữ nút So sánh khi khóa dùng `secondary`.
- **SEO (chủ dự án yêu cầu):** `/tai-khoan`, `/ho-so`, `/do-thi/[app]` bỏ `noindex`, có mô tả riêng (`profile.description`, `profile.sharedDescription`, `appHome[app].graph`) và canonical của chính trang. `/do-thi/*` vào sitemap; `/tai-khoan`, `/ho-so` không vào vì khách chưa đăng nhập chỉ thấy hồ sơ trống. `/ho-so` mở không kèm `#` thì hiện `profile.noShare` (giới thiệu trang) thay vì báo link hỏng. Layout gốc đặt canonical là trang chủ, nên trang nào quên đặt `alternates.canonical` sẽ bị Google gộp vào trang chủ: `/search` từng bị vậy, đã sửa.
- **Dữ liệu phụ kiện (đối chiếu sony.jp 2026-11-16):** "積載カメラ質量" là tải trọng, không phải khối lượng. GP-VPT1 nặng 116 g (tải 1 kg), VCT-MP1 nặng 935 g (tải 2 kg, khối lượng chỉ có ở `feature_1.html`, ghi trong `FEATURE_WEIGHT`). ADP-AMA và ADP-MAA là シューアダプター, sang nhóm mới `shoe-adapter` ("Bộ chuyển đế đèn"). Sửa ở `scripts/product-specs.ts` (`MASS`, `CATEGORY_GROUP`) rồi chạy lại từ cache; `test/products.test.ts` chốt các giá trị này.

Cách đo lại:

```bash
npm run build
npm run start -- -p 3200
npm run lighthouse -- http://localhost:3200 --all
```

`LH_ROUTES='/a /b'` để đo vài trang, `--every` để đo mọi trang prerender (rất lâu). Báo cáo JSON ở `/tmp/lh`. Khi điểm tụt: xem `network-requests` trước LCP quan sát, `lcp-breakdown-insight` và `metrics` (so `observedFirstContentfulPaintTs` với `observedLargestContentfulPaintTs`) trong JSON. Quy tắc Lantern nằm ở `node_modules/@paulirish/trace_engine/models/trace/lantern/metrics/LargestContentfulPaint.js`. Đôi khi một lượt ra 98–99 vì FCP và LCP rơi vào hai khung vẽ khác nhau; đo lại vài lần trước khi sửa.

## 4. Môi trường

- `.claude/launch.json`: `web` (`npm run dev`, cổng 3000) và `prod` (`npm run start`, cổng 3200).
- Biến môi trường (giá trị trong `.env.local`, không đưa vào repo): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (project nội dung), `NEXT_PUBLIC_AUTH_SUPABASE_URL`, `NEXT_PUBLIC_AUTH_SUPABASE_ANON_KEY` (project AUTH: đăng nhập, đồng bộ, KOL), `NEXT_PUBLIC_SITE_URL`, `ADMIN_EMAILS` (chỉ server, đặt trên máy deploy; trống thì `/admin/decode` trả 404).
- `scripts/push-supabase.ts --apply` cần file env ở `~/Desktop/ColorLab 2.0/.env.local` (chạy từ gốc repo với `--env-file="../../ColorLab 2.0/.env.local"`); `.env.local` của repo không có khóa ghi nội dung.
- **SQL Supabase do chủ dự án chạy tay** trong SQL editor. AI chỉ viết file `.sql` và hỏi, không bao giờ tự áp dụng.
  - `supabase/kol.sql`: chủ dự án đã chạy (2026-11-11). Chưa rõ đã chạy lại phần `kol_photos_ok` (ảnh mẫu là link https) chưa.
  - `supabase/cleanup.sql`: xóa bảng cũ của ColorLab 2.0, không hoàn tác được, đã được duyệt 2026-11-12. Chưa rõ đã chạy chưa.

## 5. Việc còn mở và rủi ro

1. **Dữ liệu chưa đối chiếu nguồn:** `data/accessories.json` (7 món chọn tay) và mã màu cam Sony (ước lượng). 44/146 phụ kiện trong `data/products.json` không có khối lượng vì sony.jp không in ở trang sản phẩm hoặc trang thông số.
2. **Nội dung đổi sau hydrate:** snapshot phía server của máy đang chọn (`lib/model.ts`, luôn ZV-E10), Lưới/Danh sách (`lib/indexView.ts`, luôn Lưới) và cá nhân hóa (`lib/usePersonal.ts`, luôn tắt). Người dùng A6400/A7C II hoặc chọn Danh sách thấy giao diện đổi sau khi tải. Sửa bằng cookie sẽ làm trang thành động và mất prerender, nên cần cân nhắc với điểm Lighthouse.
3. **Chữ viết cứng trong component:** `PresetBuilder.tsx` còn vài câu tiếng Việt chưa chuyển vào `app/content.ts`.
4. **Đăng nhập Google và KOL:** đã thử đăng nhập, lưu hồ sơ, lưu bộ nháp. Chưa thử tải ảnh, công khai bộ, xóa bộ.
5. **Luật bài viết:** `colorlab_article` phía alphaskill (`src/sony_alpha_viet/server.py`) chưa đọc `data/article-rules.json`.
6. **Đồ thị dày** (Color Bank, đồ thị tổng hợp): vài nhãn vẫn sát nhau khi xoay.

## 6. Quyết định của chủ dự án cần giữ

- Không chữ xám nhạt, không dòng gợi ý màu xám dưới tiêu đề, nút hay ô nhập; cần giải thích thì dùng `InfoTip`. Không gradient, glow, emoji, ký tự làm icon, câu quảng cáo (trừ chữ "color" chạy màu và quầng trắng sau tiêu đề ở landing, chủ dự án yêu cầu).
- Lưu một bộ M1–M4 gọi là "sưu tầm", không phải "lưu".
- Mỗi tài khoản KOL có đúng một bộ M1–M4. Bộ KOL công khai được đưa lên đầu danh sách ở `/console` và `/bo-m1-m4`, không ở landing.
- KOL quản lý mọi thứ ngay trên `/tai-khoan` (một form hồ sơ gộp). Không làm lại trang quản lý KOL riêng; `/kol/sua` chỉ chuyển về `/tai-khoan`.
- Trang hồ sơ (người dùng và KOL) theo kiểu Facebook: ảnh bìa, avatar tròn đè lên bìa, thanh tab, cột "Giới thiệu" bên trái.
- Ảnh mẫu của KOL là link https dán vào và lưu ngay; ảnh đại diện và ảnh bìa vẫn chỉ từ bucket `kol`.
- "Mod PP" là bản chỉnh riêng của người dùng, lưu theo tài khoản, không chia sẻ công khai. Ghi chú ảnh mẫu do KOL tự gõ, không đọc EXIF.

## 7. Tri thức và skill

- `npm run sync:skill`: chép `skills/sony-alpha-viet` và `portable/` từ repo alphaskill (`ALPHASKILL_DIR`, mặc định `../alphaskill`) vào `alphaskill/` của dự án, sinh `san-pham-sony.md` từ `data/products.json`. Không sửa tay `alphaskill/`; quên chạy thì `test/knowledge-drift.test.ts` báo lệch.
- `node --experimental-strip-types scripts/import-knowledge.ts`: chỉ đọc `<alphaskill>/data/knowledge/1 Kiến thức`, ghi `data/knowledge.json` và `data/knowledge.lock.json`. Hai nguồn sửa trong repo (`KNOWLEDGE_EDITS` trong script, `scripts/knowledge-link-edits.json`) nằm ngoài hash: sửa mà không import lại thì test drift không báo. Ghi chú tri thức sửa ở repo `../alphaskill/data` (remote `alphaskill-data`).
- `data/article-rules.json`: luật kiểm bài, đọc bởi `scripts/article-check.ts`, kiểm bởi `test/article-rules.test.ts`.
- `npm run check:sources`: kiểm link nguồn của bài và sản phẩm (cần mạng, chỉ báo cáo). `.github/workflows/sources.yml` chạy thứ Hai 03:00 UTC.

## 8. Bố cục

- `app/`: route và component; `app/content.ts` chứa toàn bộ chữ; `app/globals.css` chứa token `@theme` và mọi CSS.
- `lib/`: logic thuần, codec `.DAT` (`lib/zve10`, `lib/a7c2`, `lib/a6400`), đồ thị, đồng bộ, KOL.
- `data/`: 272 sản phẩm, 39 bài, 39 ghi chú tri thức, bộ preset M1–M4, luật bài.
- `scripts/`: chạy bằng `node --experimental-strip-types`. `test/`: `node:test`, chạy bằng `npm test`.
- `supabase/`: file SQL chạy tay (mục 4).

## 9. Trước khi báo xong

```bash
npm run check:design
npm test
npm run build
```

Xem trang ở 390px, 840px và 1440px. Đổi giao diện hoặc dữ liệu lớn thì đo lại Lighthouse theo mục 3.
