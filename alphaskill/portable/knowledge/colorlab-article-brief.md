# Brief viết bài cho Alpha ColorLab

Áp dụng cho bài kind `article` (`/blog/<id>`). Bài `knowledge` (`/learn/<id>`) không qua cổng bài viết. Cách xuất bài và công cụ: [colorlab-vi.md](colorlab-vi.md).

## a. Luật cứng và khối

- Số liệu và danh sách cấm lấy từ `data/article-rules.json` của repo site. Nếu brief này lệch với file, file thắng.
- Front matter: `title`, `dek` (120 đến 155 ký tự), `slug`, `read` (dạng "7 phút đọc"), `topic` (af, exposure, composition, gear, color, video), `level` (newbie, mid, pro), `author`, `updated` (ngày kiểm nguồn).
- Khối được phép (`blockTypes`): `tldr`, `h`, `p`, `menu`, `table`, `callout`, `compare`, `checklist`, `figure`, `embed`, `faq`. Trường chính: `tldr.items`, `h.text`, `p.text`, `callout.label` và `text`, `checklist.label` và `items`, `table.head`, `rows`, `caption`, `faq.items` (mỗi mục có `q` và `a`).
- `tldr` là khối đầu tiên: đúng 3 ý, tổng 40 đến 70 từ.
- `faq` là khối cuối cùng: 4 đến 6 câu, mỗi câu trả lời 40 đến 70 từ. Không viết `h` mở bằng FAQ, Câu hỏi thường gặp hay Hỏi đáp (`headingBanned`), vì khối `faq` tự có tiêu đề.
- Đường dẫn menu viết trong blockquote, bắt đầu bằng `MENU →`. Đối chiếu với Help Guide chính thức của từng model (ZV-E10: ilc/2070, ILCE-6400: ilc/1810, ILCE-7CM2: ilc/2360) và ghi khác biệt giữa các model. Tên mục menu giữ tiếng Anh in trên máy (ADR 0004).
- Cấm: emoji, dấu `!`, gạch dài, `[cần xác minh]`, `[CẦN BỔ SUNG`.
- Cấm mở mục bằng "Trong phần này", "Hãy cùng", "Ở phần này", "Bài viết này" (`sectionLeadBanned`).
- Cấm câu trả lời FAQ kiểu "xem ở trên", "như đã nói", "đã đề cập" (`faqAnswerBanned`).
- Bài không bắt buộc kết bằng KANDO hay checklist. Nếu có checklist, đặt trước mục FAQ.

## b. Cổng kiểm của trang

Chạy trong repo site:

```bash
node --experimental-strip-types scripts/article-check.ts <id>
```

`<id>` là id bài hoặc đường dẫn file `.json`. Lệnh phải không in lỗi nào. `test/articles-aio.test.ts` bắt mọi bài trong `data/articles.json` qua cổng này. `colorlab_article` của alphaskill trả cùng mã lỗi với cổng, nhưng cổng của trang là chuẩn cuối cùng.

## c. SEO và AIO

- Đoạn đầu dưới mỗi `h` trả lời thẳng tiêu đề. Mỗi `h` phải có `p` đứng ngay sau (`headingNotParagraph`).
- Định nghĩa viết thành một câu, dạng "X là …".
- Câu trả lời FAQ tự đứng: đọc riêng vẫn hiểu, không trỏ về phần trên.
- Tiêu đề mục là một câu có động từ.
- Wikilink `[[Tên note]]` phải trỏ tới note có thật. Cổng hiện chưa kiểm được việc này, người viết tự kiểm trước khi báo xong.

## d. Chuẩn SVG

- File: `public/blog/<id>-dN.svg`, N là số thứ tự hình minh họa (d1, d2, …).
- `viewBox="0 0 720 480"`, nền trắng.
- Chỉ dùng các màu sau:
  - Chữ và nền phụ: `#0b0d12`, `#4a5260`, `#7c8594`, `#e3e6eb`, `#f3f4f6`.
  - Nhấn: `#f05a14` (một màu nhấn duy nhất), `#b43f00` (nhấn đậm).
  - Trạng thái: `#127a3a` (đúng), `#c8261b` (sai).
- Không gradient, không filter, không emoji, không dùng ký tự mũi tên (→, ›, ▶) làm hình. Vẽ mũi tên bằng `path`.
- Chữ trong SVG cỡ ít nhất 24 đơn vị viewBox.
- Ảnh chụp thật luôn là `figure` đầu tiên của bài. SVG đứng sau ảnh.

## e. Bỏ rào đón

- Điều đã kiểm chứng viết thẳng, không rào bằng "có vẻ", "có lẽ", "theo tôi".
- "Help Guide" nhắc trong thân bài tối đa 2 lần mỗi bài (trang cho tối đa 3, `help-guide-nhac`). Cụm "Help Guide không nêu" tối đa 1 lần (`help-guide-khong-neu`). Nguồn đầy đủ nằm ở mục "Nguồn tham khảo".
- Tính năng không có thì viết "không có". Không viết "chưa thấy" hay "không rõ".
- Suy đoán không kiểm chứng được thì xóa, không đưa vào bài.
- Trạng thái kiểm chứng (đã đọc trang nào, còn thiếu gì, mức chắc chắn) chỉ ghi trong báo cáo, không có trong câu chữ người đọc. Loại `research_hedge` của `style_lint` bắt các cụm như "đã kiểm tra trang", "đã đọc sâu trang", "suy đoán", "đây là suy luận", "theo nguyên lý".

## f. Khi giao việc cho sub-agent

- Nêu định dạng bằng ví dụ cụ thể, không dùng regex kiểu `A|B|C` trong brief. Ví dụ: menu viết như `MENU → Camera Settings2 → Custom Key (Shoot) → AEL Button → AF ON`.
- Brief có ba phần: file được sửa, mục cần đạt, lệnh kiểm ở mục b.

## g. Báo cáo

- Mỗi thay đổi một dòng: `đường/dẫn/file:dòng` kèm việc đã làm.
- Kết quả cổng: lệnh đã chạy và kết quả. Chỉ dán dòng lỗi, không dán cả log.
- Ảnh cần tải lên (`figure`), mục chưa xong và trạng thái kiểm chứng (mục e) ghi ở đây.
