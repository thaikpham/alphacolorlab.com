/** Lowercase without diacritics, đ → d: "Khẩu độ" → "khau do". Shared by wikilinks and search (kept data-free for the browser bundle). */
export const fold = (s: string) => s.normalize('NFD').replace(/\p{M}/gu, '').replace(/[đĐ]/g, 'd').toLowerCase().trim()
