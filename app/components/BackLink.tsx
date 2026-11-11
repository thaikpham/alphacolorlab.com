import Link from "next/link";

/** Link quay lại ở đầu trang chi tiết: chữ accent, chevron SVG, vùng chạm 44px. */
export function BackLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="relative inline-flex items-center gap-1 h-9 mb-3 text-subhead font-semibold text-accent-text after:absolute after:inset-x-0 after:-inset-y-1">
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true" className="flex-shrink-0">
        <path d="M10 4l-4 4 4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {children}
    </Link>
  );
}
