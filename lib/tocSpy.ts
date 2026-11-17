// Theo dõi vị trí đọc cho mục lục bài viết (ArticleToc). Thuần, không đọc DOM: nhận vị trí đỉnh các đề mục.

/** Chỉ số đề mục đang đọc: đề mục cuối cùng có đỉnh đã tới hoặc qua `line` (px từ mép trên khung nhìn). -1 khi chưa đề mục nào. Đề mục thiếu thì truyền Infinity. */
export function activeIndex(tops: number[], line: number): number {
  let active = -1;
  tops.forEach((top, i) => {
    if (top <= line) active = i;
  });
  return active;
}

/** Mức xa của một dòng so với dòng đang đọc: 0 là dòng đang đọc, 1 và 2 là hai dòng cạnh, 3 là phần còn lại (cũng là mọi dòng khi chưa có dòng đang đọc). */
export function nearOf(index: number, active: number): number {
  if (active < 0) return 3;
  return Math.min(3, Math.abs(index - active));
}
