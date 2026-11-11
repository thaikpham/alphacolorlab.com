import Link from "next/link";

const row = "flex items-center gap-3 min-h-11 px-4 py-3 transition-colors hover:bg-fill active:bg-fill-strong";

/** Hàng điều hướng kiểu Cài đặt iOS, đặt trong thẻ `rounded-card bg-card shadow-card divide-y divide-separator`. external: mở trang ngoài ở tab mới, icon mũi tên chéo thay cho chevron. isActive: hiển thị dạng được chọn (trong split view). */
export function LinkRow({ href, title, detail, trailing, external, isActive }: { href: string; title: React.ReactNode; detail?: React.ReactNode; trailing?: React.ReactNode; external?: boolean; isActive?: boolean }) {
  const body = (
    <>
      <span className="flex-1 min-w-0">
        <span className="block text-subhead font-semibold text-label">{title}</span>
        {detail && <span className="block mt-1 text-footnote text-secondary line-clamp-2">{detail}</span>}
      </span>
      {trailing && <span className="flex-shrink-0 text-footnote text-secondary whitespace-nowrap">{trailing}</span>}
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true" className="flex-shrink-0 text-tertiary">
        <path d={external ? "M5 11l6-6M6 5h5v5" : "M6 4l4 4-4 4"} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </>
  );
  const activeClass = isActive ? "bg-fill" : "";
  return external ? (
    <a href={href} target="_blank" rel="noopener noreferrer" className={`${row} ${activeClass}`}>{body}</a>
  ) : (
    <Link href={href} aria-current={isActive ? "page" : undefined} className={`${row} ${activeClass}`}>{body}</Link>
  );
}
