# Night build 2026-11-06 — 24 bài nền tảng + 3 bài live viết lại theo cây alphaskill

Nhánh `claude/blog-knowledge-tree`. Hai pack: `nen-tang-2026-11` (24 bài mới) và `thay-bai-live-2026-11` (3 bài đang live viết lại). Mỗi bài: 11–15 block, ≥ 3 `[[wikilink]]` vào note alphaskill, một ảnh dẫn Wikimedia Commons ≤ 300 KB kèm manifest, nguồn Sony Help Guide đọc trong ngày.

## Đã viết

### nen-tang-2026-11 (bản nháp, `push:lab` không `--replace`)
af-c-tracking-eye-af · article · Ba cài đặt để máy tự bám mắt người
af-s-af-c-dmf-chon-mot · article · Focus Mode: chọn AF-S, AF-C hay DMF cho tình huống nào
anh-mo-vi-rung-tay · article · Ảnh mờ vì rung tay: tốc độ tối thiểu theo tiêu cự
anh-toi-anh-chay-bu-sang · article · Ảnh tối hay cháy sáng? Xoay bù sáng và đọc biểu đồ
bat-luoi-1-3-va-bon-bo-cuc · article · Bật Grid Line và bốn ô bố cục: cách dùng lưới 1/3
che-do-a-cho-ngay-dau · article · Chế độ A cho ngày đầu: xoay rồi chụp ngay
che-do-m-ba-buoc · article · Chế độ M: ba bước lập khẩu, tốc, ISO theo thanh đo sáng
chon-metering-mode · article · Multi, Center, Spot: chọn metering mode khi nào
chup-dem-cam-tay-iso-cao · article · Chụp đêm cầm tay: ISO lên bao nhiêu, tốc độ tối thiểu, Creative Look nào
chup-silhouette-tren-sony · article · Chụp silhouette trên Sony: đo sáng điểm và bù sáng âm
creative-look-cho-ngay-dau · article · Creative Look cho ngày đầu: chọn cái nào, chỉnh gì
dong-bo-man-sau-voi-flash · article · Đồng bộ màn sau với flash: khi nào, cài ở đâu
khi-nao-roi-awb · article · Khi nào AWB sai, và cách chọn White Balance đúng
khung-doc-hay-ngang · article · Khung dọc hay ngang: quyết định trước khi bấm
khung-trong-khung-tien-canh · article · Khung trong khung: tiền cảnh, lấy nét vào đâu, khẩu nào
loc-anh-sau-buoi-chup · article · Lọc ảnh sau buổi chụp: Rating, thư mục, sao lưu
mot-chu-the-ba-goc-may · article · Một chủ thể, ba góc máy: ngang mắt, cao, thấp
panning-tren-sony · article · Panning trên Sony: lia máy, chế độ S và AF-C
phoi-sang-dai-tren-sony · article · Phơi sáng dài trên Sony: chế độ M, BULB, ISO 100
raw-hay-jpeg-cho-nguoi-moi · article · Người mới nên chụp RAW, JPEG hay cả hai?
san-mau-va-lop-canh-30-phut · article · Đi bộ 30 phút: săn một màu và xếp ba lớp cảnh
so-f-tren-ong-kit · article · f/3.5–5.6 trên ống kit: tại sao khẩu hẹp, có được mở hết không
xoa-phong-voi-ong-kit · article · Ba cách xóa phông không mua ống mới
xoay-1-3-stop-tren-sony · article · Xoay một nấc bánh = 1/3 stop: đọc EV trên Sony

### thay-bai-live-2026-11 (ghi đè dòng chưa ai sửa, `--replace <id>`)
back-button-af · article · Lấy nét bằng ngón tay cái: bỏ nửa cò, dùng AF-ON
body-ev-vs-flash-ev-sony-flash-ttl · article · Body EV chỉnh background, Flash EV chỉnh chủ thể
iso-auto-min-ss · article · ISO Auto và Min. SS: mục bị bỏ qua nhiều nhất trong menu Sony

## Đã sửa từ tài liệu
- Năm nguồn Help Guide do writer đặt id (TP1000640830/640840/640841/641011 `_01_01`, TP1000649067) trả 404 → thay bằng trang thật đọc 2026-11-06: Aperture Priority (TP1000640137), Focus Mode (TP1000649113), Focus Area (TP1000640179), Face/Eye Prior. in AF (TP1000657951), Face/Eye Subject (TP1000657934), File Format still image (TP1000659396). Mục Eye AF của `af-c-tracking-eye-af` viết lại theo trang: bỏ câu "Subject Recognition trên a7 IV" và "phím điều hướng chọn mắt" (không có trong trang); callout mới là gán Face/Eye Priority Select vào nút Custom (Hint của trang). Cả 29 URL nguồn trên hai pack trả 200.
- Hai ảnh Commons không tồn tại (File:Focus_Ring.jpg, File:Frame_composition.jpg, tác giả "Wikimedia") → AF Micro-Nikkor parts (Phiarc) cho `af-s-af-c-dmf-chon-mot`, Landscape framed by an archway (Jules Verne Times Two) cho `khung-trong-khung-tien-canh`. Ba ảnh lệch chủ đề thay (anh-toi-anh-chay-bu-sang, so-f-tren-ong-kit, xoay-1-3-stop). Cả 27 `sourceUrl` trong manifest trả 200.
- `creative-look-cho-ngay-dau` nêu đủ tám thông số Creative Look theo `constants.ts`; `raw-hay-jpeg-cho-nguoi-moi` bỏ số MB không nguồn; `khi-nao-roi-awb` bỏ Kelvin nguồn sáng không nguồn; `san-mau-va-lop-canh-30-phut` thêm nguồn Aperture Priority; `chup-silhouette-tren-sony` tách Spot và Spot: Standard.
- Ba bài live: `related` trỏ vào cây (back-button-af → lay-net, chu-the-chinh, bo-cuc; iso-auto-min-ss → iso, toc-do-man-trap, tam-giac-phoi-sang; body-ev → iso, bu-sang, dong-bo-man-sau, tam-giac-phoi-sang), thêm ảnh dẫn (mặt sau a7R IV · Franz van Duns; South Olive Street · Dietmar Rabich; Rembrandt Lighting · Jacopo188). body-ev giữ nguyên mục Flash EV (tiêu đề nói hai thanh) nên 15 block.
- Wikilink giữa câu dùng alias chữ thường (`[[Bố cục|bố cục]]`) để không ngắt câu bằng chữ hoa.

## Bỏ ra và lý do
- `brand_voice_checker` của MCP `sony-alpha-viet` đòi thêm câu quảng bá (sensor số 1, ngàm E hơn 200 ống, kết bài KANDO); trái quy tắc "không dòng giải thích" của CLAUDE.md nên không áp dụng. `aio_audit`, `citation_checker` không chạy (bài không có link ngoài nào ngoài Help Guide đã quét).
- Không nhúng video nào.
- Ba bài 15 block (gate cho phép ≤ 16): dong-bo-man-sau-voi-flash, af-c-tracking-eye-af, body-ev-vs-flash-ev-sony-flash-ttl.
- Mọi URL Commons, Help Guide đều 200 lúc kiểm; tiêu đề nguồn lấy nguyên văn từ trang.

## Ảnh cần thêm
Mỗi bài đã có một ảnh dẫn sau đoạn định nghĩa. Không bắt buộc thêm; nếu muốn ảnh thứ hai: che-do-m-ba-buoc — thanh đo sáng trên màn hình, sau "ba bước"; panning-tren-sony — ảnh lia có vệt nền, sau mục kỹ thuật; chup-silhouette-tren-sony — một silhouette hoàng hôn, trước FAQ.

## Đã soát lại 2026-11-06 (sau khi mở PR)
- Cả 22 block `menu` đối chiếu với trang Help Guide a6400 (`ilc/1810`), ZV-E10 (`ilc/2070`) và a7 IV (`ilc/2110`): 15 đường sai (writer ghi theo trí nhớ: Shoot, Setup → Screen Display Setting, Camera Settings2 cho Flash Mode, File Format → Aspect Ratio, Playback Settings → Rating, AF Mode…) sửa theo đúng chữ trang in; ba block không phải mục menu (Shutter Speed, Aperture, Exposure Mode) thay bằng ISO AUTO Min. SS, SteadyShot + Long Exposure NR, hoặc bỏ. `creative-look-cho-ngay-dau`: thế hệ cũ chỉ có Creative Style, bài nói rõ.
- Đọc lại 27 bài: bỏ số bịa (lux, MB/thẻ, % vùng đo sáng, giá ống, Kelvin đèn), câu sai (DMF là AF-C, gương lật trên mirrorless, Aspect Ratio không cắt ảnh, flash gắn sẵn không có Rear Sync., EV tuyệt đối trên màn hình → M.M. theo trang Manual Exposure), caption tiếng Anh và caption tả sai ảnh, ống kit 18–55 → 16–50/28–70. Flash sync 1/160 (ZV-E10, a6400) và Flash Comp. ±3.0 EV đối chiếu trang Specifications và Flash Comp.
- `style_lint` chạy cho 27 bài: còn lại 0 lỗi sau khi tách 17 câu dài hơn 35 từ; hai cảnh báo "từ từ", "song song" là từ láy hợp lệ.

## Kiểm tra
`npm test` 3528 passed · `npm run typecheck` 0 · `npm run lint` 0 lỗi (2 cảnh báo có sẵn trên main, `mark.test.ts`) · bảy lệnh `rg` của CLAUDE.md không có hit mới · `npm run test:screens` 12 passed, 27 skipped (visual snapshots) · gate pack `npx vitest run src/lib/lab/packs` 15 passed · review mã toàn nhánh: duyệt, 0 critical, 0 important.

## Lệnh đẩy bài
```
npm run push:lab -- --target content --pack nen-tang-2026-11 --dry-run
npm run push:lab -- --target content --pack nen-tang-2026-11
npm run push:lab -- --target content --pack thay-bai-live-2026-11 --replace back-button-af --replace iso-auto-min-ss --replace body-ev-vs-flash-ev-sony-flash-ttl --dry-run
npm run push:lab -- --target content --pack thay-bai-live-2026-11 --replace back-button-af --replace iso-auto-min-ss --replace body-ev-vs-flash-ev-sony-flash-ttl
```

Bài đến dưới "Bản nháp"; chủ xuất bản từng bài từ nút Sửa của nó. `--replace` chỉ ghi đè dòng chưa ai sửa trong admin; dòng đã sửa bị bỏ qua và in ra.

Sau khi merge PR #31 (AIO): bản `.md` và JSON-LD phải đi qua `stripWiki` để `[[…]]` không lọt ra ngoài.
