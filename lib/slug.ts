/** Chuyển chữ thành đường dẫn: bỏ dấu, chữ thường, ký tự ngoài a–z, 0–9, "-" thành "-". Không cắt đầu cuối để gõ tiếp được. */
export function toSlug(s: string, max: number): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[Đđ]/g, "d")
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .slice(0, max);
}
