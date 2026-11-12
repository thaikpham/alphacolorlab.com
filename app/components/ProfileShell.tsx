import type { ReactNode } from "react";
import { profile as T } from "@/app/content";

const host = (url: string) => {
  const u = new URL(url);
  return (u.hostname.replace(/^www\./, "") + u.pathname).replace(/\/$/, "");
};

/** Khung chung của ba trang hồ sơ (/tai-khoan, /ho-so, /kol/[handle]), kiểu trang mạng xã hội: thẻ tiêu đề (ảnh bìa, avatar đè lên bìa, tên, dòng đếm, nút, thanh tab ở đáy),
 * rồi thân trang: cột trái (aside: thẻ giới thiệu, tài khoản) và cột phải (children: nội dung tab đang mở). Dưới lg một cột, cột trái đứng trước.
 * lead: dòng đầu trang (nút quay lại). name chưa có (đang tải, không tìm thấy, link hỏng): chỉ hiện khung tiêu đề xám giữ đúng chiều cao.
 * Không có ảnh bìa thì khung xám hiện kit (tối đa 4 ảnh máy/món, md trở lên, chỉ trang trí). coverAction (nút đổi ảnh bìa) đè ở góc dưới phải bìa, có ảnh hay không.
 * asideBottom nằm trong cùng cột trái, sau aside. */
export function ProfileShell({ lead, name, handle, cover, coverAction, avatar = null, kit, stats, actions, tabs, aside, asideBottom, children }: { lead?: ReactNode; name?: string; handle?: string; cover?: string; coverAction?: ReactNode; avatar?: string | null; kit?: string[]; stats?: string[]; actions?: ReactNode; tabs?: ReactNode; aside?: ReactNode; asideBottom?: ReactNode; children?: ReactNode }) {
  return (
    <main className="mx-auto max-w-5xl px-4 pt-8 pb-16 sm:px-6 lg:pt-12">
      {lead && <div className="mb-6">{lead}</div>}
      <div className="overflow-hidden rounded-card bg-card shadow-card">
        <div className="relative">
          {cover ? (
            <img src={cover} alt="" className="aspect-[3/1] w-full bg-fill object-cover" />
          ) : (
            <div className="relative h-24 overflow-hidden bg-fill-strong sm:h-32 md:h-36">
              {kit && kit.length > 0 && (
                <div aria-hidden="true" className="absolute inset-0 hidden items-center justify-end gap-6 px-8 md:flex">
                  {kit.slice(0, 4).map((src) => (
                    <img key={src} src={src} alt="" className="h-full max-h-28 w-auto object-contain py-3 mix-blend-multiply" />
                  ))}
                </div>
              )}
            </div>
          )}
          {coverAction && <div className="absolute right-3 bottom-3">{coverAction}</div>}
        </div>
        <div className="px-4 pb-4 sm:px-6 sm:pb-6">
          <div className="flex flex-col items-start gap-4 md:flex-row md:items-end md:justify-between md:gap-6">
            <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-start sm:gap-6">
              <Avatar name={name ?? ""} src={avatar} className="-mt-12 size-28 shrink-0 ring-4 ring-card sm:-mt-16 sm:size-36" />
              {name !== undefined && (
                <div className="min-w-0 pb-1 sm:pt-4">
                  <h1 className="text-title font-normal text-balance">{name}</h1>
                  {handle && <p className="mt-1 text-footnote text-secondary">@{handle}</p>}
                  {stats && stats.length > 0 && (
                    <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-subhead text-secondary tabular-nums">
                      {stats.map((s) => (
                        <span key={s} className="whitespace-nowrap">{s}</span>
                      ))}
                    </p>
                  )}
                </div>
              )}
            </div>
            {actions && <div className="flex flex-wrap items-center gap-3 md:shrink-0">{actions}</div>}
          </div>
        </div>
        {tabs && <div className="border-t border-separator">{tabs}</div>}
      </div>
      {/* Thứ tự DOM: Giới thiệu, nội dung, rồi asideBottom. Dưới lg xếp dọc theo đúng thứ tự đó; từ lg hai thẻ phụ nằm cột trái, nội dung cột phải. */}
      <div className={`mt-6 grid gap-6 lg:items-start ${aside || asideBottom ? "lg:grid-cols-[20rem_1fr] lg:grid-rows-[auto_1fr]" : ""}`}>
        {aside && <aside className="min-w-0 lg:col-start-1 lg:row-start-1">{aside}</aside>}
        <div className={`min-w-0 ${aside || asideBottom ? "lg:col-start-2 lg:row-span-2 lg:row-start-1" : ""}`}>{children}</div>
        {asideBottom && <aside className={`min-w-0 lg:col-start-1 ${aside ? "lg:row-start-2" : "lg:row-start-1"}`}>{asideBottom}</aside>}
      </div>
    </main>
  );
}

/** Thẻ Giới thiệu (cột trái): tiểu sử và liên kết dạng viên. children (form sửa của chủ hồ sơ) thay phần đọc. Không có tiểu sử lẫn liên kết thì hiện câu empty. footer: hàng cuối thẻ, chỉ khi đang đọc. */
export function IntroCard({ bio, links, empty, footer, children }: { bio?: string; links: string[]; empty?: string; footer?: ReactNode; children?: ReactNode }) {
  return (
    <section aria-labelledby="intro-title" className="rounded-card bg-card p-5 shadow-card sm:p-6">
      <h2 id="intro-title" className="text-title3 font-medium">
        {T.bio}
      </h2>
      {children ?? (
        <>
          {bio && <p className="mt-3 text-body text-label">{bio}</p>}
          {links.length > 0 && (
            <ul className="mt-4 flex flex-wrap gap-2">
              {links.map((url) => (
                <li key={url}>
                  <a href={url} target="_blank" rel="noopener noreferrer nofollow ugc" className="inline-flex h-11 items-center gap-2 rounded-full bg-fill px-4 text-subhead font-semibold text-label transition-colors hover:bg-fill-strong">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
                      <path d="M6.5 9.5l3-3M7 4.5l1-1a2.8 2.8 0 014 4l-1 1M9 11.5l-1 1a2.8 2.8 0 01-4-4l1-1" />
                    </svg>
                    {host(url)}
                  </a>
                </li>
              ))}
            </ul>
          )}
          {!bio && links.length === 0 && empty && <p className="mt-3 text-body text-secondary">{empty}</p>}
          {footer && <div className="mt-4 border-t border-separator pt-4">{footer}</div>}
        </>
      )}
    </section>
  );
}

/** Avatar tròn: ảnh nếu có, không thì chữ cái đầu của tên trên nền xám (tên rỗng: khung xám chờ). className: cỡ và vị trí. */
export function Avatar({ name, src, className }: { name: string; src: string | null; className: string }) {
  if (src) return <img src={src} alt="" referrerPolicy="no-referrer" className={`rounded-full bg-fill object-cover ${className}`} />;
  return (
    <span aria-hidden="true" className={`grid place-items-center rounded-full bg-fill text-title font-normal text-label ${className}`}>
      {name.slice(0, 1).toUpperCase()}
    </span>
  );
}
