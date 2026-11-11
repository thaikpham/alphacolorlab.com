-- Comments, replies and hearts on every product, recipe, blog post, learning path and knowledge note.
-- AUTH project (nqeedlgzaewccqztqvik, "web system"), where Google sign-in lives. Applied 2026-11-09 as migrations
-- community_comments_likes_user_state + community_harden_functions.
-- The browser calls PostgREST directly with the reader's own session, so RLS + grants below are the whole security boundary.
-- Safe to re-run. Touches nothing that ColorLab 2.0 uses.

create table if not exists public.comments (
  id            uuid primary key default gen_random_uuid(),
  -- '<kind>/<slug>', e.g. 'product/a7-iv', 'recipe/pp-001', 'post/bo-cuc', 'path/tuan-dau-voi-may-anh', 'note/iso'
  page          text not null check (page ~ '^(product|recipe|post|path|note)/[a-z0-9]+(-[a-z0-9]+)*$'),
  parent_id     uuid references public.comments (id) on delete cascade,
  user_id       uuid not null references auth.users (id) on delete cascade,
  -- Copied from the Google profile by the trigger below; never taken from the request.
  author_name   text,
  author_avatar text,
  body          text not null check (length(btrim(body)) between 1 and 2000),
  like_count    integer not null default 0,
  created_at    timestamptz not null default now()
);
create index if not exists comments_page_idx on public.comments (page, created_at);
create index if not exists comments_parent_idx on public.comments (parent_id);
create index if not exists comments_user_idx on public.comments (user_id);

create table if not exists public.comment_likes (
  comment_id uuid not null references public.comments (id) on delete cascade,
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (comment_id, user_id)
);
create index if not exists comment_likes_user_idx on public.comment_likes (user_id);

-- Author, time and count come from the server. A reply must belong to the same page as its parent.
create or replace function public.comments_before_insert() returns trigger
language plpgsql security definer set search_path = '' as $$
declare meta jsonb;
begin
  -- SQL-editor inserts (auth.uid() is null) keep what they set, so old comments can be imported.
  if auth.uid() is not null then
    select raw_user_meta_data into meta from auth.users where id = auth.uid();
    new.user_id       := auth.uid();
    new.author_name   := coalesce(nullif(btrim(meta ->> 'full_name'), ''), nullif(btrim(meta ->> 'name'), ''));
    new.author_avatar := coalesce(nullif(meta ->> 'avatar_url', ''), nullif(meta ->> 'picture', ''));
    new.like_count    := 0;
    new.created_at    := now();
  end if;
  if new.parent_id is not null and not exists (
    select 1 from public.comments where id = new.parent_id and page = new.page
  ) then
    raise exception 'reply must be on the same page as its parent';
  end if;
  return new;
end $$;
drop trigger if exists comments_before_insert on public.comments;
create trigger comments_before_insert before insert on public.comments
  for each row execute function public.comments_before_insert();

create or replace function public.comment_likes_count() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  update public.comments
     set like_count = like_count + (case when tg_op = 'INSERT' then 1 else -1 end)
   where id = coalesce(new.comment_id, old.comment_id);
  return null;
end $$;
drop trigger if exists comment_likes_count on public.comment_likes;
create trigger comment_likes_count after insert or delete on public.comment_likes
  for each row execute function public.comment_likes_count();

-- Moderators = the existing admin_emails list (ColorLab owner and editors).
create or replace function public.is_comment_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.admin_emails where lower(email) = lower(auth.jwt() ->> 'email'));
$$;
revoke all on function public.is_comment_admin() from public;
grant execute on function public.is_comment_admin() to authenticated;

alter table public.comments enable row level security;
alter table public.comment_likes enable row level security;

-- Readers see comments (no email is stored anywhere in them). Signed-in users write only page, parent and body.
revoke all on public.comments, public.comment_likes from anon, authenticated;
grant select on public.comments to anon, authenticated;
grant insert (page, parent_id, body) on public.comments to authenticated;
grant delete on public.comments to authenticated;
-- anon gets select so `comments?select=*,comment_likes(user_id)` works signed out; the policy returns it nothing.
grant select on public.comment_likes to anon, authenticated;
grant insert (comment_id), delete on public.comment_likes to authenticated;

drop policy if exists comments_read on public.comments;
create policy comments_read on public.comments for select using (true);
drop policy if exists comments_insert on public.comments;
create policy comments_insert on public.comments for insert to authenticated with check (user_id = (select auth.uid()));
drop policy if exists comments_delete on public.comments;
create policy comments_delete on public.comments for delete to authenticated
  using (user_id = (select auth.uid()) or (select public.is_comment_admin()));

-- Who liked what stays private: you only ever see your own hearts.
drop policy if exists likes_read_own on public.comment_likes;
create policy likes_read_own on public.comment_likes for select using (user_id = (select auth.uid()));
drop policy if exists likes_insert_own on public.comment_likes;
create policy likes_insert_own on public.comment_likes for insert to authenticated with check (user_id = (select auth.uid()));
drop policy if exists likes_delete_own on public.comment_likes;
create policy likes_delete_own on public.comment_likes for delete to authenticated using (user_id = (select auth.uid()));

-- Per-account memory of what the reader did (M1–M4 cart, compare pick, chosen camera): lib/userState.ts.
-- One row per user, readable and writable only by that user. data = raw localStorage strings, capped at 64 KB.
create table if not exists public.user_state (
  user_id    uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  data       jsonb not null default '{}' check (octet_length(data::text) < 65536),
  updated_at timestamptz not null default now()
);
alter table public.user_state enable row level security;
revoke all on public.user_state from anon, authenticated;
grant select, insert (data, updated_at), update (data, updated_at) on public.user_state to authenticated;
drop policy if exists user_state_own on public.user_state;
create policy user_state_own on public.user_state for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- Trigger functions are not RPC endpoints; only signed-in users need the moderator check (inside the delete policy).
revoke execute on function public.comments_before_insert() from public, anon, authenticated;
revoke execute on function public.comment_likes_count() from public, anon, authenticated;
revoke execute on function public.is_comment_admin() from public, anon;
grant execute on function public.is_comment_admin() to authenticated;
-- ColorLab's helper flagged by the Supabase linter (mutable search_path); its body only calls now().
alter function public.touch_updated_at() set search_path = '';
