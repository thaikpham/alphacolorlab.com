"use client";

import { useId, useState } from "react";
import Link from "next/link";
import { account, community, kolSets, kolStudio, profile as T } from "@/app/content";
import { authReady, signIn, signOut, useSession } from "@/lib/auth";
import { toggleGear, useGear, writeGear, type GearBag } from "@/lib/gear";
import { cleanLink, cleanUsername, encodeShare, LIMITS, useProfile, writeProfile, type Profile } from "@/lib/profile";
import { gearCatalog } from "@/lib/gearCatalog";
import { useIsKol, useRemoteSets } from "@/lib/kol";
import { listedSets, validatePresetSets } from "@/lib/presetSets";
import { readSaved, toggleSaved, useSavedSets, writeSaved } from "@/lib/savedSets";
import presetSetsJson from "@/data/preset-sets.json";
import { GearManager } from "./GearManager";
import { InfoTip } from "./InfoTip";
import { ProfileView } from "./ProfileView";

const field = "h-11 w-full rounded-control border border-separator bg-card px-3 text-callout text-label placeholder:text-secondary focus-visible:outline-2 focus-visible:outline-accent";
const secondary = "inline-flex h-11 items-center gap-2 rounded-full bg-fill px-5 text-subhead font-semibold text-label transition-colors hover:bg-fill-strong";

const SETS = validatePresetSets(presetSetsJson);
const REPO_IDS: ReadonlySet<string> = new Set(SETS.map((s) => s.id));

/** /tai-khoan: hồ sơ của chính người dùng để khoe túi đồ. Sửa username, giới thiệu, liên kết; chia sẻ bằng link /ho-so#… */
export function ProfilePage() {
  const session = useSession();
  const saved = useProfile();
  const bag = useGear();
  const savedIds = useSavedSets();
  const remoteSets = useRemoteSets(REPO_IDS);
  const savedSets = [...listedSets(SETS), ...remoteSets].filter((s) => savedIds.includes(s.id));
  const isKol = useIsKol(session?.user.id);
  const [draft, setDraft] = useState<(Profile & { linkError: boolean }) | null>(null);
  const [copied, setCopied] = useState(false);
  const [undo, setUndo] = useState<{ cat: keyof GearBag; id: string; name: string } | null>(null);
  const uid = useId();

  const name = session?.user.name ?? (saved.username || account.guest);
  const data = { name, avatar: session?.user.avatar ?? null, ...saved, gear: bag };

  const share = async () => {
    const url = `${location.origin}/ho-so#${encodeShare(data)}`;
    if (typeof navigator.share === "function") return navigator.share({ title: T.shareText(name), url }).catch(() => {});
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
      {!draft && (
        <button type="button" onClick={() => setDraft({ ...saved, links: saved.links.length ? saved.links : [""], linkError: false })} className={secondary}>
          {T.edit}
        </button>
      )}
      {isKol && (
        <Link href="/kol/sua" className={secondary}>
          {kolStudio.title}
        </Link>
      )}
      {authReady && (
        <button type="button" onClick={session ? signOut : signIn} className={secondary}>
          {session ? community.account.signOut : community.account.signIn}
        </button>
      )}
      <InfoTip entry={{ term: T.share, lines: [{ t: T.shareInfo }] }} />
      <span aria-live="polite" className="text-footnote font-semibold text-success">
        {copied ? T.shared : ""}
      </span>
    </>
  );

  return (
    <ProfileView data={data} actions={actions} onRemove={draft ? removeGear : undefined}>
      {draft && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            save();
          }}
          aria-label={T.edit}
          className="mt-6 space-y-5 rounded-card bg-card p-6 shadow-card sm:p-8"
        >
          <div>
            <label htmlFor={`${uid}-u`} className="text-subhead font-semibold text-label">
              {T.username}
            </label>
            <div className="relative mt-2 max-w-md">
              <span aria-hidden="true" className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-callout text-secondary">
                @
              </span>
              <input id={`${uid}-u`} value={draft.username} maxLength={LIMITS.username} onChange={(e) => setDraft({ ...draft, username: cleanUsername(e.target.value) })} autoComplete="username" className={`${field} pl-7`} />
            </div>
          </div>
          <div>
            <label htmlFor={`${uid}-b`} className="text-subhead font-semibold text-label">
              {T.bio}
            </label>
            <textarea
              id={`${uid}-b`}
              rows={3}
              value={draft.bio}
              maxLength={LIMITS.bio}
              placeholder={T.bioPlaceholder}
              onChange={(e) => setDraft({ ...draft, bio: e.target.value })}
              className="mt-2 block w-full max-w-2xl rounded-control border border-separator bg-card px-3 py-2.5 text-callout text-label placeholder:text-secondary focus-visible:outline-2 focus-visible:outline-accent"
            />
          </div>
          <fieldset>
            <legend className="text-subhead font-semibold text-label">{T.links}</legend>
            <ul className="mt-2 max-w-2xl space-y-2">
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
      )}
      {undo && (
        <div aria-live="polite" className="mt-6 flex items-center justify-between gap-4 rounded-card bg-fill p-4 shadow-card sm:p-5">
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
      <div className="mt-6">
        <GearManager showList={false} title={T.addTitle} secondary />
      </div>
      {savedSets.length > 0 && (
        <section aria-labelledby={`${uid}-sets`} className="mt-6">
          <h2 id={`${uid}-sets`} className="mb-1.5 px-4 text-footnote font-medium text-secondary">{kolSets.savedTitle}</h2>
          <ul className="overflow-hidden rounded-card bg-card shadow-card divide-y divide-separator">
            {savedSets.map((set) => (
              <li key={set.id} className="flex items-center gap-2 pr-3">
                <Link href={`/bo-m1-m4/${set.id}`} className="flex min-h-11 min-w-0 flex-1 items-center justify-between gap-3 px-4 py-2.5 transition-colors hover:bg-fill">
                  <span className="min-w-0 flex-1 truncate text-body text-label">{set.name}</span>
                  {set.author && <span className="hidden shrink-0 text-footnote text-secondary sm:inline">{set.author.name}</span>}
                </Link>
                <button type="button" onClick={() => writeSaved(toggleSaved(readSaved(), set.id))} className={secondary}>
                  {kolSets.remove}
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </ProfileView>
  );
}
