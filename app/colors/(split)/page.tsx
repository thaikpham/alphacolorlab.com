import { colorBank } from "@/app/content";
import presets from "@/lib/zve10/presets";
import { SITE_URL } from "@/lib/site";

export const metadata = {
  title: "Color Bank · Thư viện công thức",
  description: colorBank.list.lead(presets.length),
  alternates: {
    canonical: `${SITE_URL}/colors`,
  },
};

// Chưa chọn gì: cột phải để trống (h1 chỉ cho trình đọc màn hình). Điện thoại thấy header + index của layout.
export default function ColorsPage() {
  return <h1 className="sr-only">{colorBank.list.title}</h1>;
}
