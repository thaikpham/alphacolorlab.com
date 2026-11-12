"use client";

import { useId, type ReactNode } from "react";
import Link from "next/link";
import { kol, kolSets } from "@/app/content";
import type { KolPhoto } from "@/lib/kol";
import type { PresetSet } from "@/lib/presetSets";
import { PhotoGrid } from "./PhotoGrid";
import { SaveSetButton } from "./PresetSets";
import { Avatar, IntroCard, ProfileShell } from "./ProfileShell";
import { ProfileTabPanel, ProfileTabs, useActiveTab } from "./ProfileTabs";

/** Thông tin KOL để hiển thị. Chỉ có trường nào thì hiện trường đó: bộ trong repo không có tiểu sử, ảnh bìa hay ảnh mẫu. */
export type KolLike = { handle: string; name: string; bio?: string; link?: string; avatar?: string; cover?: string; photos?: KolPhoto[] };

/** Trang KOL kiểu trang mạng xã hội (khung ở ProfileShell, không có nút). Tab "Bộ M1–M4" (đếm bộ) và "Ảnh mẫu" (chỉ khi có ảnh) ở đáy thẻ tiêu đề.
 * Cột trái: thẻ Giới thiệu (chỉ khi có tiểu sử hoặc liên kết). Cột phải: mỗi bộ là một bài đăng sưu tầm được, hoặc lưới ảnh mẫu. lead: dòng đầu trang (nút quay lại).
 * Dùng state của tab nên là component client. */
export function KolView({ profile, sets, lead }: { profile: KolLike; sets: PresetSet[]; lead?: ReactNode }) {
  const base = useId();
  const { handle, name, bio, link, avatar, cover, photos = [] } = profile;
  const tabbed = photos.length > 0;
  const tabs = [{ id: "sets", label: kol.sets, count: sets.length }, ...(tabbed ? [{ id: "photos", label: kol.photos, count: photos.length }] : [])];
  const [active, setActive] = useActiveTab(tabs.map((t) => t.id));
  const links = link ? [link] : [];
  return (
    <ProfileShell
      lead={lead}
      name={name}
      handle={handle}
      cover={cover}
      avatar={avatar ?? null}
      stats={sets.length + photos.length > 0 ? kol.stats(sets.length, photos.length) : undefined}
      tabs={tabbed ? <ProfileTabs base={base} label={name} tabs={tabs} active={active} onSelect={setActive} /> : undefined}
      aside={bio || links.length > 0 ? <IntroCard bio={bio} links={links} /> : undefined}
    >
      <ProfileTabPanel base={base} id="sets" tabbed={tabbed} active={active === "sets"}>
        {sets.length > 0 ? (
          <div className="flex flex-col gap-6">
            {sets.map((s) => (
              <SetPost key={s.id} set={s} profile={profile} />
            ))}
          </div>
        ) : (
          <p className="text-body text-secondary">{kol.noSets}</p>
        )}
      </ProfileTabPanel>
      {tabbed && (
        <ProfileTabPanel base={base} id="photos" tabbed active={active === "photos"}>
          <PhotoGrid photos={photos} name={name} set={sets[0]} />
        </ProfileTabPanel>
      )}
    </ProfileShell>
  );
}

/** Một bộ dạng bài đăng: đầu là KOL, giữa là tên bộ, mô tả và bốn ô M1–M4, chân có sưu tầm và xem bộ (nút xám). */
function SetPost({ set, profile }: { set: PresetSet; profile: KolLike }) {
  return (
    <article className="overflow-hidden rounded-card bg-card shadow-card">
      <header className="flex items-center gap-3 px-5 pt-5 sm:px-6">
        <Avatar name={profile.name} src={profile.avatar ?? null} className="size-11 shrink-0" />
        <p className="text-subhead font-semibold text-label">{profile.name}</p>
      </header>
      <div className="px-5 pt-4 pb-5 sm:px-6">
        <h3 className="text-title3 font-medium">
          <Link href={`/bo-m1-m4/${set.id}`} className="hover:underline">
            {set.name}
          </Link>
        </h3>
        {set.description && <p className="mt-2 text-body text-label">{set.description}</p>}
        <dl className="mt-4 divide-y divide-separator">
          {set.slots.map((slot, i) => (
            <div key={i} className="flex items-baseline gap-4 py-2.5">
              <dt className="w-10 shrink-0 text-footnote font-medium text-secondary tabular-nums">{kolSets.slotName(i + 1)}</dt>
              <dd className="min-w-0 text-body font-semibold text-label">{slot.label}</dd>
            </div>
          ))}
        </dl>
      </div>
      <footer className="flex items-center justify-between gap-3 border-t border-separator px-5 py-3 sm:px-6">
        <SaveSetButton id={set.id} />
        <Link href={`/bo-m1-m4/${set.id}`} className="inline-flex h-11 shrink-0 items-center rounded-full bg-fill px-5 text-subhead font-semibold text-label transition-colors hover:bg-fill-strong">
          {kolSets.viewSet}
        </Link>
      </footer>
    </article>
  );
}
