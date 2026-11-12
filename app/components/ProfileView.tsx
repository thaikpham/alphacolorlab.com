"use client";

import { useId, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { gearManager, kolSets, profile as T } from "@/app/content";
import type { GearBag } from "@/lib/gear";
import { gearCatalog, type Item } from "@/lib/gearCatalog";
import { IntroCard, ProfileShell } from "./ProfileShell";
import { ProfileTabPanel, ProfileTabs, useActiveTab, type TabItem } from "./ProfileTabs";

const CATS = ["body", "lens", "acc"] as const;

export interface ProfileData {
  name: string;
  avatar: string | null;
  username: string;
  bio: string;
  links: string[];
  gear: GearBag;
}

/** Tab thêm của trang (KOL: Ảnh mẫu), đặt sau các tab gốc. */
export type ProfileExtraTab = { id: string; label: string; count?: number | string; body: ReactNode };

/** Hồ sơ người dùng kiểu trang mạng xã hội (khung ở ProfileShell). Tab "Túi đồ" và, khi có bộ đã sưu tầm, "Bộ đã sưu tầm" nằm ở đáy thẻ tiêu đề; extra thêm tab sau đó.
 * Cột trái: thẻ Giới thiệu (chủ hồ sơ: luôn hiện, intro thay phần đọc khi sửa; introFooter: hàng cuối thẻ khi đang đọc, vd. link xem trang công khai của KOL) và account. Cột phải: panel của tab đang mở; túi đồ gồm gearTop (ô thêm đồ, thông báo hoàn tác) rồi các nhóm món.
 * Dùng cho /tai-khoan (owner) và /ho-so (chỉ xem: không tab, thẻ Giới thiệu chỉ hiện khi có dữ liệu).
 * cover và coverAction (nút đổi ảnh bìa) đặt trên ProfileShell.
 * wall (chỉ owner KOL) nằm trên cùng cột phải, ngoài tab. Khi wallEditing (đang soạn bộ trên tường) thì ẩn tab, nút đổi ảnh bìa và các panel, giữ mounted. */
export function ProfileView({ data, owner = false, actions, intro, introFooter, account, gearTop, onRemove, saved, wall, wallEditing = false, cover, coverAction, extra = [] }: { data: ProfileData; owner?: boolean; actions?: ReactNode; intro?: ReactNode; introFooter?: ReactNode; account?: ReactNode; gearTop?: ReactNode; onRemove?: (cat: keyof GearBag, id: string) => void; saved?: { count: number; list: ReactNode }; wall?: ReactNode; wallEditing?: boolean; cover?: string; coverAction?: ReactNode; extra?: ProfileExtraTab[] }) {
  const base = useId();
  const catalog = gearCatalog();
  const items = (cat: keyof GearBag) => data.gear[cat].flatMap((id) => catalog[cat].filter((i) => i.id === id));
  const total = data.gear.body.length + data.gear.lens.length + data.gear.acc.length;
  const stats = T.stats(data.gear.body.length, data.gear.lens.length, data.gear.acc.length);
  const tabs: TabItem[] = [{ id: "gear", label: gearManager.title, count: total }, ...(saved ? [{ id: "saved", label: kolSets.savedTitle, count: saved.count }] : []), ...extra.map((e) => ({ id: e.id, label: e.label, count: e.count }))];
  const [active, select] = useActiveTab(tabs.map((t) => t.id));
  const tabbed = !!saved || extra.length > 0;
  const showIntro = owner || !!data.bio || data.links.length > 0;
  const aside = showIntro ? (
    <IntroCard bio={data.bio} links={data.links} empty={T.noIntro} footer={introFooter}>
      {intro}
    </IntroCard>
  ) : undefined;
  // Ảnh trang trí cho bìa khi chưa có ảnh bìa: thân máy trước, rồi ống kính, phụ kiện; trùng thì bỏ, tối đa 4.
  const kit = [...new Set(CATS.flatMap((cat) => items(cat).map((i) => i.image)))].filter((src): src is string => !!src).slice(0, 4);

  const gear = (
    <div className="flex flex-col gap-6">
      {gearTop}
      {total === 0 ? (
        <p role="status" className="py-8 text-center text-callout text-label">
          {T.empty}
        </p>
      ) : (
        CATS.filter((cat) => data.gear[cat].length).map((cat) => (
          <section key={cat} aria-labelledby={`${base}-bag-${cat}`}>
            <h3 id={`${base}-bag-${cat}`} className="text-subhead font-semibold">
              {gearManager.groups[cat]} <span className="font-normal text-secondary tabular-nums">{data.gear[cat].length}</span>
            </h3>
            <ul className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-3">
              {items(cat).map((item) => (
                <GearCard key={item.id} item={item} cat={cat} onRemove={onRemove} />
              ))}
            </ul>
          </section>
        ))
      )}
    </div>
  );

  return (
    <ProfileShell
      name={data.name}
      handle={data.username}
      avatar={data.avatar}
      cover={cover}
      coverAction={wallEditing ? undefined : coverAction}
      kit={kit}
      stats={stats}
      actions={actions}
      tabs={tabbed && !wallEditing ? <ProfileTabs base={base} label={T.title} tabs={tabs} active={active} onSelect={select} /> : undefined}
      aside={aside}
      asideBottom={account}
    >
      <div className="flex flex-col gap-6">
        {wall}
        <div hidden={wallEditing}>
          <ProfileTabPanel base={base} id="gear" tabbed={tabbed} active={active === "gear"}>
            {gear}
          </ProfileTabPanel>
          {saved && (
            <ProfileTabPanel base={base} id="saved" tabbed active={active === "saved"}>
              {saved.list}
            </ProfileTabPanel>
          )}
          {extra.map((e) => (
            <ProfileTabPanel key={e.id} base={base} id={e.id} tabbed active={active === e.id}>
              {e.body}
            </ProfileTabPanel>
          ))}
        </div>
      </div>
    </ProfileShell>
  );
}

function GearCard({ item, cat, onRemove }: { item: Item; cat: keyof GearBag; onRemove?: (cat: keyof GearBag, id: string) => void }) {
  // Món có trang trong Product Wiki (máy, ống kính, phụ kiện) thì có ảnh và link; phụ kiện thêm tay chỉ có tên
  const body = (
    <>
      <div className="relative aspect-[4/3] bg-card">
        {item.image ? (
          <Image src={item.image} alt="" fill sizes="(min-width: 1024px) 22vw, (min-width: 640px) 30vw, 45vw" className="object-contain p-4" />
        ) : (
          <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true" className="absolute inset-0 m-auto size-12 text-tertiary">
            <rect x="8" y="14" width="32" height="22" rx="4" />
            <circle cx="24" cy="25" r="6" />
          </svg>
        )}
      </div>
      <div className="border-t border-separator px-4 py-3">
        <p className="truncate text-subhead font-semibold text-label">{item.name}</p>
        <p className="truncate text-footnote text-secondary">{item.code}</p>
      </div>
    </>
  );
  return (
    <li className="relative overflow-hidden rounded-card bg-card shadow-card">
      {item.image ? (
        <Link href={`/wiki/san-pham/${item.id}`} aria-label={T.view(item.name)} className="block transition-colors hover:bg-fill">
          {body}
        </Link>
      ) : (
        body
      )}
      {onRemove && (
        <button
          type="button"
          onClick={() => onRemove(cat, item.id)}
          aria-label={T.remove(item.name)}
          className="absolute top-2 right-2 grid size-11 place-items-center rounded-full bg-card text-label shadow-thumb transition-colors hover:bg-fill"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
            <path d="M3.5 3.5l7 7M10.5 3.5l-7 7" />
          </svg>
        </button>
      )}
    </li>
  );
}
