"use client";

import { useEffect, useId, useRef, useState } from "react";
import { account, community, kolSets, kolStudio, profile as T } from "@/app/content";
import { authReady, signIn, signOut, useSession } from "@/lib/auth";
import { toggleGear, useGear, writeGear, type GearBag } from "@/lib/gear";
import { cleanLink, cleanUsername, encodeShare, LIMITS, useProfile, writeProfile, type Profile } from "@/lib/profile";
import { gearCatalog } from "@/lib/gearCatalog";
import { displayIdentity, KOL_LIMITS, useIsKol, useRemoteSets } from "@/lib/kol";
import { listedSets, validatePresetSets } from "@/lib/presetSets";
import { readSaved, toggleSaved, useSavedSets, writeSaved } from "@/lib/savedSets";
import presetSetsJson from "@/data/preset-sets.json";
import { GearManager } from "./GearManager";
import { InfoTip } from "./InfoTip";
import { KolCoverButton } from "./KolCoverButton";
import { KolLoadState, KolProvider, useKol } from "./KolContext";
import { KolPhotos } from "./KolPhotos";
import { KolIdentityForm } from "./KolIdentityForm";
import { KolWall } from "./KolSetModule";
import { SetRow } from "./PresetSets";
import { ProfileView, type ProfileExtraTab } from "./ProfileView";

const field = "h-11 w-full rounded-control border border-separator bg-card px-3 text-callout text-label placeholder:text-secondary focus-visible:outline-2 focus-visible:outline-accent";
const secondary = "inline-flex h-11 items-center gap-2 rounded-full bg-fill px-5 text-subhead font-semibold text-label transition-colors hover:bg-fill-strong";

const SETS = validatePresetSets(presetSetsJson);
const REPO_IDS: ReadonlySet<string> = new Set(SETS.map((s) => s.id));

/** /tai-khoan: hồ sơ của chính người dùng để khoe túi đồ. Sửa username, giới thiệu, liên kết; chia sẻ bằng link /ho-so#…
 * Khung ProfileView (kiểu trang mạng xã hội): thẻ tiêu đề có Chia sẻ, Sửa và, với KOL có hồ sơ, Xem trang công khai; KOL thêm nút Đổi ảnh bìa ở góc bìa. Cột trái là thẻ Giới thiệu (form sửa thay phần đọc) và tài khoản;
 * cột phải có tường bộ M1–M4 (KOL, ngoài tab) rồi các tab: Túi đồ, Bộ đã sưu tầm (khi có bộ), và với KOL thêm Ảnh mẫu. KOL sửa cả hồ sơ trong một form ở thẻ Giới thiệu (KolIdentityForm), lưu vào hồ sơ KOL rồi mới ghi máy.
 * KolProvider tải hồ sơ KOL một lần, chỉ khi is_kol đúng; người không phải KOL hoặc chưa đăng nhập không gọi hồ sơ hay bộ KOL. */
export function ProfilePage() {
  const session = useSession();
  const isKol = useIsKol(session?.user.id);
  return (
    <KolProvider userId={isKol && session ? session.user.id : undefined}>
      <ProfileBody isKol={isKol === true} />
    </KolProvider>
  );
}

function ProfileBody({ isKol }: { isKol: boolean }) {
  const session = useSession();
  const saved = useProfile();
  const bag = useGear();
  const savedIds = useSavedSets();
  const remoteSets = useRemoteSets(REPO_IDS);
  const savedSets = [...listedSets(SETS), ...remoteSets].filter((s) => savedIds.includes(s.id));
  const { status, profile: kolProfile } = useKol();
  const kolId = isKol ? session?.user.id : undefined;
  const kolTabs: ProfileExtraTab[] = kolId
    ? [{ id: "photos", label: kolStudio.photoList, count: kolProfile ? `${kolProfile.photos.length}/${KOL_LIMITS.photos}` : undefined, body: <KolPhotos /> }]
    : [];
  const [draft, setDraft] = useState<(Profile & { linkError: boolean }) | null>(null);
  // KOL sửa cả hồ sơ trong một form (KolIdentityForm ở thẻ Giới thiệu); draft chỉ dùng cho người không phải KOL.
  const [kolEdit, setKolEdit] = useState(false);
  const [copied, setCopied] = useState(false);
  const [undo, setUndo] = useState<{ cat: keyof GearBag; id: string; name: string } | null>(null);
  const [wallEditing, setWallEditing] = useState(false);
  const uid = useId();
  const editing = draft !== null || kolEdit;
  const editRef = useRef<HTMLButtonElement>(null);
  const firstRef = useRef<HTMLInputElement>(null);
  const wasEditing = useRef(false);

  // Mở form thì đưa con trỏ vào ô tên; đóng form thì trả về nút Sửa (nút này ẩn lúc đang sửa)
  useEffect(() => {
    if (editing) firstRef.current?.focus();
    else if (wasEditing.current) editRef.current?.focus();
    wasEditing.current = editing;
  }, [editing]);

  // Tường KOL (KolWall) bị gỡ khi hết là KOL hoặc đăng xuất: không để trạng thái soạn bộ còn sót lại
  useEffect(() => {
    if (!(isKol && session)) {
      setWallEditing(false);
      setKolEdit(false);
    }
  }, [isKol, session]);

  // Hồ sơ hiển thị: KOL có hồ sơ KOL thì lấy từ đó (displayIdentity); chưa có thì như hồ sơ trên máy.
  const shown = displayIdentity(saved, kolId ? kolProfile : null, { name: session?.user.name ?? (saved.username || account.guest), avatar: session?.user.avatar ?? null });
  const data = { ...shown, gear: bag };

  const share = async () => {
    const url = `${location.origin}/ho-so#${encodeShare(data)}`;
    if (typeof navigator.share === "function") return navigator.share({ title: T.shareText(data.name), url }).catch(() => {});
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const removeGear = (cat: keyof GearBag, id: string) => {
    const catalog = gearCatalog();
    const item = catalog[cat].find((i) => i.id === id);
    const itemName = item?.name || id;
    writeGear(toggleGear(bag, cat, id));
    setUndo({ cat, id, name: itemName });
    setTimeout(() => setUndo(null), 5000);
  };

  const restoreGear = () => {
    if (!undo) return;
    writeGear(toggleGear(bag, undo.cat, undo.id));
    setUndo(null);
  };

  const save = () => {
    if (!draft) return;
    const links = draft.links.map((l) => l.trim()).filter(Boolean);
    if (links.some((l) => !cleanLink(l))) return setDraft({ ...draft, linkError: true });
    writeProfile({ username: draft.username, bio: draft.bio, links });
    setDraft(null);
  };

  const actions = (
    <>
      <button type="button" onClick={share} className="inline-flex h-11 items-center gap-2 rounded-full bg-accent px-5 text-subhead font-semibold text-on-accent transition-colors hover:bg-accent/90">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M8 10V2.5M5 5.5l3-3 3 3M3.5 8.5v4.5h9V8.5" />
        </svg>
        {T.share}
      </button>
      {!editing && (
        <button ref={editRef} type="button" onClick={() => (kolId ? setKolEdit(true) : setDraft({ ...saved, links: saved.links.length ? saved.links : [""], linkError: false }))} className={secondary}>
          {T.edit}
        </button>
      )}
      <InfoTip entry={{ term: T.share, lines: [{ t: T.shareInfo }] }} />
      <span aria-live="polite" className="text-footnote font-semibold text-success">
        {copied ? T.shared : ""}
      </span>
    </>
  );

  const editForm = draft && (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        save();
      }}
      aria-label={T.edit}
      className="mt-4 space-y-5"
    >
      <div>
        <label htmlFor={`${uid}-u`} className="block text-subhead font-semibold text-label">
          {T.username}
        </label>
        <div className="relative mt-2">
          <span aria-hidden="true" className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-callout text-secondary">
            @
          </span>
          <input
            ref={firstRef}
            id={`${uid}-u`}
            value={draft.username}
            maxLength={LIMITS.username}
            onChange={(e) => setDraft({ ...draft, username: cleanUsername(e.target.value) })}
            autoComplete="username"
            className={`${field} pl-7`}
          />
        </div>
      </div>
      <div>
        <label htmlFor={`${uid}-b`} className="block text-subhead font-semibold text-label">
          {T.bio}
        </label>
        <textarea
          id={`${uid}-b`}
          rows={3}
          value={draft.bio}
          maxLength={LIMITS.bio}
          placeholder={T.bioPlaceholder}
          onChange={(e) => setDraft({ ...draft, bio: e.target.value })}
          className="mt-2 block w-full rounded-control border border-separator bg-card px-3 py-2.5 text-callout text-label placeholder:text-secondary focus-visible:outline-2 focus-visible:outline-accent"
        />
      </div>
      <fieldset>
        <legend className="text-subhead font-semibold text-label">{T.links}</legend>
        <ul className="mt-2 space-y-2">
          {draft.links.map((l, i) => (
            <li key={i} className="flex gap-2">
              <input
                type="url"
                inputMode="url"
                aria-label={`${T.links} ${i + 1}`}
                aria-invalid={draft.linkError && !!l.trim() && !cleanLink(l)}
                value={l}
                placeholder={T.linkPlaceholder}
                onChange={(e) => setDraft({ ...draft, linkError: false, links: draft.links.map((x, j) => (j === i ? e.target.value : x)) })}
                className={field}
              />
              <button type="button" aria-label={T.removeLink} onClick={() => setDraft({ ...draft, links: draft.links.filter((_, j) => j !== i) })} className="grid size-11 shrink-0 place-items-center rounded-full text-label transition-colors hover:bg-fill">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
                  <path d="M3.5 3.5l7 7M10.5 3.5l-7 7" />
                </svg>
              </button>
            </li>
          ))}
        </ul>
        {draft.linkError && <p className="mt-2 text-footnote font-medium text-danger">{T.badLink}</p>}
        {draft.links.length < LIMITS.links && (
          <button type="button" onClick={() => setDraft({ ...draft, links: [...draft.links, ""] })} className={`${secondary} mt-3`}>
            {T.addLink}
          </button>
        )}
      </fieldset>
      <div className="flex gap-3 border-t border-separator pt-5">
        <button type="submit" className={secondary}>
          {T.save}
        </button>
        <button type="button" onClick={() => setDraft(null)} className="inline-flex h-11 items-center rounded-full px-5 text-subhead font-semibold text-label transition-colors hover:bg-fill">
          {T.cancel}
        </button>
      </div>
    </form>
  );

  // Form Giới thiệu của KOL. Chưa tải xong hồ sơ thì chỉ hiện khung chờ hoặc Thử lại, không mở form rỗng.
  const kolForm =
    kolId && kolEdit ? (
      status === "ready" ? (
        <KolIdentityForm userId={kolId} onDone={() => setKolEdit(false)} onCancel={() => setKolEdit(false)} />
      ) : (
        <div className="mt-4 space-y-5">
          <KolLoadState />
          <div className="border-t border-separator pt-5">
            <button type="button" onClick={() => setKolEdit(false)} className="inline-flex h-11 items-center rounded-full px-5 text-subhead font-semibold text-label transition-colors hover:bg-fill">
              {T.cancel}
            </button>
          </div>
        </div>
      )
    ) : undefined;

  // Tab Bộ đã sưu tầm: KOL luôn có (kể cả khi trống), người khác chỉ thấy khi có bộ.
  const savedTab =
    savedSets.length > 0 || kolId
      ? {
          count: savedSets.length,
          list:
            savedSets.length === 0 ? (
              <p className="text-body text-secondary">{kolSets.savedEmpty}</p>
            ) : (
              <ul className="overflow-hidden rounded-card bg-card shadow-card divide-y divide-separator">
                {savedSets.map((set) => (
                  <SetRow
                    key={set.id}
                    id={set.id}
                    name={set.name}
                    byline={set.author?.name}
                    action={
                      <button type="button" onClick={() => writeSaved(toggleSaved(readSaved(), set.id))} className={`${secondary} shrink-0`}>
                        {kolSets.remove}
                      </button>
                    }
                  />
                ))}
              </ul>
            ),
        }
      : undefined;

  const accountCard = authReady ? (
    <section aria-labelledby={`${uid}-account`} className="rounded-card bg-card p-5 shadow-card sm:p-6">
      <div className="flex items-center gap-2">
        <h2 id={`${uid}-account`} className="text-title3 font-medium">
          {community.account.menu}
        </h2>
        <InfoTip entry={{ term: T.syncTerm, lines: [{ t: community.account.synced }] }} />
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        {session && <p className="min-w-0 truncate text-callout text-label">{session.user.name}</p>}
        <button type="button" onClick={session ? signOut : signIn} className={secondary}>
          {session ? community.account.signOut : community.account.signIn}
        </button>
      </div>
    </section>
  ) : undefined;

  return (
    <ProfileView
      data={data}
      owner
      actions={wallEditing ? undefined : actions}
      cover={kolProfile?.cover}
      coverAction={kolProfile ? <KolCoverButton /> : undefined}
      wall={kolId ? <KolWall userId={kolId} onEditingChange={setWallEditing} /> : undefined}
      wallEditing={wallEditing}
      intro={kolId ? kolForm : editForm}
      introFooter={
        kolId && kolProfile ? (
          <a href={`/kol/${kolProfile.handle}`} target="_blank" rel="noopener noreferrer" className={secondary}>
            {kolStudio.viewPublic}
          </a>
        ) : undefined
      }
      account={accountCard}
      onRemove={editing ? removeGear : undefined}
      saved={savedTab}
      extra={kolTabs}
      gearTop={
        <>
          <GearManager showList={false} title={T.addTitle} secondary />
          {undo && (
            <div aria-live="polite" className="flex items-center justify-between gap-4 rounded-card bg-fill p-4 shadow-card sm:p-5">
              <span className="text-body text-label">{T.removed(undo.name)}</span>
              <button
                type="button"
                onClick={restoreGear}
                className="inline-flex h-11 shrink-0 items-center rounded-full bg-fill px-5 text-subhead font-semibold text-label transition-colors hover:bg-fill-strong"
              >
                {T.undo}
              </button>
            </div>
          )}
        </>
      }
    />
  );
}
