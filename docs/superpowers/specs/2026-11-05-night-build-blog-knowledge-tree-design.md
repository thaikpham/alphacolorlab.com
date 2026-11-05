# Night build: blog theo cây kiến thức alphaskill

Ngày: 2026-11-05. Trạng thái: duyệt, đang thực hiện.

## Mục tiêu

Một đêm chạy tự động cho ra một PR: bài `/blog` mới cho người mới cầm Sony, bám
cây kiến thức alphaskill đang live ở `/learn`, liên kết nhau theo mô hình graph
của Obsidian, mỗi bài có ảnh minh họa; bài cũ được viết lại tốt hơn; bản nháp
pilot được dọn. Chủ sở hữu chỉ còn ba việc: merge, chạy `push:lab`, bấm
xuất bản từng bài trong Sửa.

## Mô hình nội dung

- **Pillar** là 24 note kiến thức của alphaskill (`data/alphaskill-knowledge.seed.json`,
  6 thư mục: Phơi sáng · Lấy nét và xóa phông · Màu sắc · Bố cục và góc nhìn ·
  Kỹ thuật sáng tạo · Quy trình làm việc). Không viết lại, không chép; bài blog
  nói *làm thế nào trên máy Sony*, note nói *khái niệm là gì*.
- **Cluster** là bài `/blog` (`kind: 'article'`), mỗi bài trả lời một câu hỏi
  người mới hay hỏi, có đường menu thật từ Sony Help Guide, giá trị máy từ
  `src/lib/camera/constants.ts`.
- **Cạnh graph**, hai lớp:
  1. `meta.prerequisites` = note pillar; `meta.related` = 2–3 note hoặc bài
     cùng cụm (đây là "đọc tiếp" của FeestFinder, hiển thị qua `RelatedLinks`
     và ngược lại qua `reverse-links`).
  2. `[[Tên note]]` inline trong `p` và `callout`, render thành link
     `/learn/<slug>` như trong note. Mọi `[[…]]` phải resolve được và đích
     phải có mặt trong `related`, để lớp 1 và lớp 2 không lệch nhau.

## Cấu trúc một bài (ánh xạ FeestFinder sang 10 block)

| FeestFinder | ColorLab |
|---|---|
| title ≤ 60 ký tự, excerpt 140–170 | `title`, `dek` ≤ 220 |
| TL;DR | `tldr` 3 dòng |
| định nghĩa 40–60 từ, in đậm | `p` đầu, "X là …", có `[[pillar]]` |
| cover + credit | `figure` đầu tiên sau `p` định nghĩa, caption kết thúc bằng "Ảnh: Tác giả · Giấy phép · Wikimedia Commons" |
| các mục, bước | `h` + `p`/`menu`/`callout` |
| facts 5–6 dòng | `table` "Thông số nhanh", head 3 ô, 3–6 dòng |
| FAQ | 2–3 cặp `h` câu hỏi + `p` 40–70 từ |
| sources ≥ 4 | `meta.sources` ≥ 2, có `checkedAt`, ít nhất một trang Sony Help Guide |
| read next ×3 | `meta.related` 3 mục |
| tracks | `embed` YouTube kênh Sony khi có, kiểm `youtube.ts` |
| | đóng bằng `checklist` 3–6 mục |

Ngân sách 10–14 block (giới hạn 16, `validateArticleShape`). Mọi quy tắc
nhà (`houseRules`) giữ nguyên; không thêm block type.

## Danh sách bài (24 bài, quyết định của chủ sở hữu 2026-11-05)

Tiêu đề là đề xuất; người viết chỉnh khi nguồn Sony nói khác. Tên Creative
Look, chế độ SteadyShot, giá trị ISO chỉ lấy từ `constants.ts` và Help Guide.

| id | thư mục | archetype · level | pillar |
|---|---|---|---|
| `che-do-a-cho-ngay-dau` | Phơi sáng | setup-guide · newbie | Chế độ chụp P-A-S-M |
| `anh-toi-anh-chay-bu-sang` | Phơi sáng | fix · newbie | Bù sáng |
| `che-do-m-ba-buoc` | Phơi sáng | technique · newbie | Tam giác phơi sáng |
| `xoay-1-3-stop-tren-sony` | Phơi sáng | explainer · mid | Stop và EV |
| `anh-mo-vi-rung-tay` | Phơi sáng | fix · newbie | Tốc độ màn trập |
| `so-f-tren-ong-kit` | Phơi sáng | explainer · newbie | Khẩu độ |
| `chon-metering-mode` | Phơi sáng | setup-guide · newbie | Đo sáng |
| `chup-dem-cam-tay-iso-cao` | Phơi sáng | technique · newbie | ISO |
| `af-c-tracking-eye-af` | Lấy nét | setup-guide · newbie | Lấy nét |
| `af-s-af-c-dmf-chon-mot` | Lấy nét | explainer · newbie | Lấy nét |
| `xoa-phong-voi-ong-kit` | Lấy nét | technique · newbie | Độ sâu trường ảnh và xóa phông |
| `khung-trong-khung-tien-canh` | Kỹ thuật | technique · newbie | Khung trong khung |
| `creative-look-cho-ngay-dau` | Màu sắc | setup-guide · newbie | Creative Look |
| `khi-nao-roi-awb` | Màu sắc | fix · newbie | Cân bằng trắng và nhiệt độ màu |
| `raw-hay-jpeg-cho-nguoi-moi` | Màu sắc | versus · newbie | RAW, JPEG và HEIF |
| `loc-anh-sau-buoi-chup` | Quy trình | setup-guide · newbie | Đặt tên và lọc ảnh |
| `bat-luoi-1-3-va-bon-bo-cuc` | Bố cục | technique · newbie | Bố cục |
| `mot-chu-the-ba-goc-may` | Bố cục | technique · newbie | Chủ thể chính |
| `khung-doc-hay-ngang` | Bố cục | explainer · newbie | Góc máy và khung hình |
| `san-mau-va-lop-canh-30-phut` | Kỹ thuật | technique · newbie | Săn màu, phối màu và lớp cảnh |
| `chup-silhouette-tren-sony` | Kỹ thuật | technique · newbie | Silhouette |
| `panning-tren-sony` | Kỹ thuật | technique · mid | Panning |
| `phoi-sang-dai-tren-sony` | Kỹ thuật | technique · mid | Phơi sáng dài |
| `dong-bo-man-sau-voi-flash` | Kỹ thuật | technique · mid | Đồng bộ màn sau |

Mỗi note kiến thức có ít nhất một bài, trừ Chồng ảnh (viết khi Help Guide
xác nhận body còn Multi Exposure).

Bài không tìm được trang Sony xác nhận đường menu thì **bỏ và ghi vào báo
cáo**, không viết từ trí nhớ (AGENTS.md Rule 1).

## Bài cũ

- **Bài live** (`back-button-af`, `iso-auto-min-ss`; cộng
  `body-ev-vs-flash-ev-sony-flash-ttl` nếu `/vi/blog/<id>` trả 200): đọc
  bản trong `ARTICLES` làm gốc, so với chữ trên trang live (`.md` twin của
  PR #31 chưa merge), viết lại trong pack `thay-bai-live-2026-11` với cùng
  id: thêm `[[…]]` về note, ảnh dẫn, FAQ, `related` về cụm mới.
  `push:lab --replace <id>` chỉ ghi đè dòng có `updated_by IS NULL` (chưa ai
  sửa trong Sửa); dòng đã sửa thì in ra và bỏ qua, chủ sở hữu sửa tay.
- **6 nháp kiến thức pilot** (`pilot-drafts.ts`, chưa từng đẩy): sửa tại chỗ,
  thêm `[[…]]` và `related` về note alphaskill, vẫn là nháp. 3 nháp thử
  nghiệm cần ảnh chủ sở hữu tự chụp: không động.
- **`/blog/setup`** không động: `SetupGuide` là client component có gate
  màn đầu đếm control; bài mới đã wikilink về note "Cài đặt nhanh trước buổi chụp".

## Ảnh

- Nguồn duy nhất: Wikimedia Commons, giấy phép CC0 · Public domain · CC BY ·
  CC BY-SA (đọc `extmetadata.LicenseShortName`, `Artist`), tìm qua API
  Commons bằng `scripts/research/commons.ts` (chuyển từ `design-kit/blog-kit/scripts/commons.py`).
  Không Unsplash, không ảnh Sony, không ảnh chụp màn hình Help Guide.
- Mỗi bài: 1 ảnh dẫn bắt buộc, tối đa 2 ảnh minh họa thêm. Tải về bản
  rộng 1024px (bậc lớn nhất của `assets.ts`), JPEG, ≤ 300 KB.
- Lưu trong pack: `src/lib/lab/packs/<pack>.images/<page-id>/<n>.jpg` và
  `src/lib/lab/packs/<pack>.images/<page-id>/manifest.json`
  (`[{ blockIndex, file, title, author, licence, sourceUrl }]`, một file mỗi
  trang để bốn writer không đụng nhau). Caption của `figure` đã chứa dòng
  credit; manifest là bằng chứng và được test đối chiếu với `PACK_LICENCES`.
- `push:lab --pack` upload từng ảnh qua `asset-store` (bucket `lab-drafts`,
  3 bậc WebP như upload từ Sửa), điền `assetId` vào block rồi mới insert.
- Gate pack: `figure` không `assetId` chỉ hợp lệ khi manifest có dòng cho nó
  và file tồn tại; ngược lại vẫn là `figureNeedsUpload`.

## Thay đổi mã (nhỏ, có test)

1. `Paragraph`/`Callout` (`src/components/lab/blocks.tsx`): tách `[[…]]`
   bằng `splitWiki` mới trong `src/lib/alphaskill/markdown.ts` (chỉ wikilink,
   không markdown khác); `ArticleView` resolve qua `findNoteByTitle` trên
   `listNotes()` thành map `title → href` truyền xuống, nên client không kéo
   zod. Link có gạch chân (gate axe link-in-text-block). Đích không có thì chữ thường.
2. `stripWiki()` dùng ở `buildOutline`, search doc, `.md` twin, JSON-LD,
   `dek`/description: chỉ còn chữ hiển thị.
3. `packProblems`: `refIds.knowledge` gồm slug note từ seed; mỗi `[[…]]`
   phải resolve và đích phải nằm trong `related`; figure theo manifest.
4. `push-lab-articles.ts`: upload ảnh sidecar sau khi dòng đã có, `--replace <id>`
   chỉ ghi đè dòng `updated_by IS NULL`.
5. `scripts/research/commons.ts`.

Không đổi giao diện trang blog, không thêm block type, không đổi
`validateForPublish`.

## Alphaskill trong vòng lặp viết

Mỗi bài, qua MCP `sony-alpha-viet`: `get_knowledge?note=` đọc note pillar
(để không chép lại) · `lookup_prose_term` cho thuật ngữ · `paa_generator`
chọn FAQ · `style_lint` · `brand_voice_checker` · `aio_audit` · `citation_checker`.
Bài không qua `style_lint`/`brand_voice_checker` thì sửa đến khi qua.

## Chạy đêm

1. 22:00 — Mã (1 agent developer, worktree): mục "Thay đổi mã", test xanh.
2. 00:00 — Viết (6 agent song song, worktree riêng, mỗi agent 4 bài, theo
   skill `colorlab-blog-content`): nghiên cứu → viết → audit MCP → ảnh → manifest.
3. 00:00 — Bài cũ (1 agent): 3 bài live, 6 nháp pilot.
4. 04:00 — Gộp vào một pack `nen-tang-2026-11`, chạy
   `npx vitest run src/lib/lab/packs` · `npm test` · `npm run typecheck` ·
   `npm run lint; echo $?` · `npm run test:screens` một lần. Sửa đến xanh.
5. 05:30 — PR nhánh `claude/blog-knowledge-tree` theo template, báo cáo tiếng
   Việt theo §6 của skill, kèm hai lệnh `push:lab` (dry-run rồi thật).

Agent nào cũng `isolation: 'worktree'`; main session kiểm `git status` khi
nhận kết quả. Không ai chạy `push:*`, không ai đụng `.env.local`.

## Tiêu chí xong

- `packProblems` rỗng; mọi gate xanh.
- Mỗi bài: ≥ 1 trang Sony Help Guide có `checkedAt`, ≥ 1 ảnh có credit,
  ≥ 3 `[[…]]` resolve, `related` 3 mục, FAQ 2–3.
- Báo cáo liệt kê: bài đã viết, bài bỏ và lý do, nguồn bị loại, ảnh từng bài,
  bài live bị từ chối `--replace` (nếu có).

## Quyết định của chủ sở hữu (2026-11-05)

1. Ảnh đi kèm pack, `push:lab` tự upload và nối `assetId`.
2. Bài live ghi đè bằng `--replace` cho dòng chưa ai sửa tay.
3. 24 bài trong một đêm.
4. `[[wikilink]]` inline trong đoạn văn.
5. Sau nội dung: Phase D thiết kế lại layout `/blog` và trang bài bằng skill `impeccable`, trong sáu quy tắc của DESIGN.md, PR riêng.
