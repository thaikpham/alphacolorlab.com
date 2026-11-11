-- Final site content on the CONTENT project (touiyczjvnuaxfzulgeq). Run once in its SQL editor, then
-- `scripts/push-supabase.ts --apply` fills the tables. The repo JSON stays the source; these tables are its published copy.
-- Additive and safe to re-run: new tables + one new column. Removing old data is in cleanup.sql.

-- 124 Sony products (replaces sony_cameras), specs from sony.jp, photo = sony.jp official image.
create table if not exists public.products (
  slug       text primary key,
  code       text not null unique,
  name       text not null,
  kind       text not null check (kind in ('camera', 'lens', 'accessory')),
  "group"    text not null,
  image      text not null check (image like 'https://www.sony.jp/%'),
  source     text not null,
  specs      jsonb not null,
  updated_at timestamptz not null default now()
);

-- Knowledge notes (menu terms, concepts, spec terms) and the notes merged into blog articles.
create table if not exists public.knowledge_notes (
  slug        text primary key,
  title       text not null,
  home        text,
  "group"     text,
  section     text,
  level       text,
  aliases     text[] not null default '{}',
  summary     text not null default '',
  body        text not null default '',
  merged_into text,
  updated_at  timestamptz not null default now()
);

-- Learning paths; drafts wait for the owner's approval and are not readable with the anon key.
create table if not exists public.learning_paths (
  slug       text primary key,
  title      text not null,
  lead       text not null default '',
  draft      boolean not null default true,
  steps      jsonb not null,
  updated_at timestamptz not null default now()
);

-- Blog articles keep living in lab_articles (same ids); the site groups them by category.
alter table public.lab_articles add column if not exists category text;

alter table public.products enable row level security;
alter table public.knowledge_notes enable row level security;
alter table public.learning_paths enable row level security;

-- Read-only for the public; only the secret key (push script) writes.
revoke all on public.products, public.knowledge_notes, public.learning_paths from anon, authenticated;
grant select on public.products, public.knowledge_notes, public.learning_paths to anon, authenticated;

drop policy if exists products_read on public.products;
create policy products_read on public.products for select using (true);
drop policy if exists knowledge_notes_read on public.knowledge_notes;
create policy knowledge_notes_read on public.knowledge_notes for select using (true);
drop policy if exists learning_paths_read on public.learning_paths;
create policy learning_paths_read on public.learning_paths for select using (not draft);
