# Copilot

Luật dự án nằm ở `AGENTS.md`; design system ở `DESIGN.md`, token ở `app/globals.css`. Tóm tắt bắt buộc:

- Chỉ dùng token Tailwind sinh từ `@theme` (bg-accent, text-footnote, rounded-card, shadow-card, max-w-page…).
- Không giá trị tùy ý (`text-[13px]`, `bg-[#…]`), không màu palette Tailwind, không `text-sm`/`rounded-lg`/`shadow-md`.
- Mẫu iOS Settings: tiêu đề trên nền xám, thẻ trắng không lồng nhau, segmented control, input `h-11 text-callout`.
- Nội dung tiếng Việt nằm trong `app/content.ts`.
- Chạy `npm run check:design` trước khi xong.
