-- KOL: người được duyệt tự đăng trang KOL và bộ M1–M4 (/kol/[handle], /tai-khoan, /bo-m1-m4).
-- AUTH project (nqeedlgzaewccqztqvik), cùng project với community.sql. Chạy tay trong SQL editor, CHƯA áp dụng.
-- Phụ thuộc: public.admin_emails, public.is_comment_admin() từ supabase/community.sql (chạy community.sql trước).
-- Trình duyệt gọi PostgREST và Storage bằng session của chính người dùng, nên RLS + grant dưới đây là toàn bộ ranh giới bảo mật.
-- Mọi dòng đọc về đều đi qua parser trong lib/kol.ts và validatePresetSets (lib/presetSets.ts); CHECK dưới đây là lớp thứ hai.
-- Chạy lại được (idempotent).

-- Danh sách KOL được duyệt (email, chữ thường). Không ai đọc được từ trình duyệt; chỉ is_kol() đọc.
create table if not exists public.kol_emails (
  email text primary key check (email = lower(btrim(email)) and length(email) between 3 and 254)
);
alter table public.kol_emails enable row level security;
revoke all on public.kol_emails from anon, authenticated;

create or replace function public.is_kol() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.kol_emails where email = lower(auth.jwt() ->> 'email'));
$$;
revoke all on function public.is_kol() from public, anon;
grant execute on function public.is_kol() to authenticated;

-- Ảnh mẫu trong jsonb: mỗi phần tử là chuỗi https tối đa 300 ký tự (có thể là link tới bất kỳ đâu), hoặc đối tượng {url, ...ghi chú}
-- với url như vậy. Ghi chú không giới hạn riêng từng ảnh; tổng dưới 16384 byte là giới hạn. Kiểm tra chi tiết ghi chú nằm ở lib/kol.ts (cleanNote, cleanMod); lệnh này chỉ là lớp thứ hai (CHECK không chứa subquery nên dùng hàm).
-- Ảnh đại diện và ảnh bìa vẫn chỉ nhận bucket kol. Chủ dự án chạy lại lệnh này bằng tay trong SQL editor, không tự áp dụng.
create or replace function public.kol_photos_ok(p jsonb) returns boolean
language sql immutable set search_path = '' as $$
  select jsonb_typeof(p) = 'array'
    and jsonb_array_length(p) <= 12
    and octet_length(p::text) < 16384
    and not exists (
      select 1 from jsonb_array_elements(p) e
      where not (
        (jsonb_typeof(e) = 'string' and (e #>> '{}') ~ '^https://' and char_length(e #>> '{}') <= 300)
        or (
          jsonb_typeof(e) = 'object'
          and jsonb_typeof(e -> 'url') = 'string'
          and (e ->> 'url') ~ '^https://'
          and char_length(e ->> 'url') <= 300
        )
      )
    );
$$;

-- Trang công khai của KOL. handle là địa chỉ /kol/<handle>; user_id là chủ tài khoản Google.
-- Admin nên tự chèn hồ sơ (handle) của mình trước khi duyệt người khác. Handle trùng tác giả trong repo không bị chặn ở đây.
create table if not exists public.kol_profiles (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  handle     text not null unique check (handle ~ '^[a-z0-9-]{1,30}$'),
  name       text not null check (char_length(btrim(name)) between 1 and 60),
  bio        text not null default '' check (char_length(bio) <= 160),
  link       text check (link is null or (link ~ '^https?://' and char_length(link) <= 200)),
  avatar_url text check (avatar_url is null or avatar_url ~ '^https://[a-z0-9.-]+/storage/v1/object/public/kol/' or avatar_url ~ '^https://lh3\.googleusercontent\.com/'),
  cover_url  text check (cover_url is null or cover_url ~ '^https://[a-z0-9.-]+/storage/v1/object/public/kol/'),
  photos     jsonb not null default '[]' check (public.kol_photos_ok(photos)),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
-- Bảng đã có trong project thật: CHECK ảnh đại diện nhận thêm ảnh tài khoản Google (chạy lại được).
alter table public.kol_profiles drop constraint if exists kol_profiles_avatar_url_check;
alter table public.kol_profiles add constraint kol_profiles_avatar_url_check check (avatar_url is null or avatar_url ~ '^https://[a-z0-9.-]+/storage/v1/object/public/kol/' or avatar_url ~ '^https://lh3\.googleusercontent\.com/');

-- Bộ M1–M4 của KOL. Cùng dạng với data/preset-sets.json: 4 ô, slots là jsonb. published = false là bản nháp.
create table if not exists public.kol_sets (
  id          text primary key check (id ~ '^[a-z0-9-]{1,40}$'),
  user_id     uuid not null references public.kol_profiles (user_id) on delete cascade,
  name        text not null check (char_length(btrim(name)) between 1 and 60),
  description text not null check (char_length(btrim(description)) between 1 and 240),
  slots       jsonb not null check (jsonb_typeof(slots) = 'array' and jsonb_array_length(slots) = 4 and octet_length(slots::text) < 32768),
  published   boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists kol_sets_user_idx on public.kol_sets (user_id);
-- Mỗi KOL một bộ: chặn ở DB, nên hai lần tạo đồng thời vẫn chỉ có một bộ. Bảng đã có user nhiều bộ thì lệnh này báo lỗi, xóa bớt trước.
create unique index if not exists kol_sets_one_per_user on public.kol_sets (user_id);

alter table public.kol_profiles enable row level security;
alter table public.kol_sets enable row level security;

-- Quyền cột: chỉ các cột người dùng được sửa. Không ai ghi user_id của người khác.
revoke all on public.kol_profiles, public.kol_sets from anon, authenticated;
grant select on public.kol_profiles, public.kol_sets to anon, authenticated;
grant insert (user_id, handle, name, bio, link, avatar_url, cover_url, photos, updated_at) on public.kol_profiles to authenticated;
grant update (handle, name, bio, link, avatar_url, cover_url, photos, updated_at) on public.kol_profiles to authenticated;
grant insert (id, user_id, name, description, slots, published, updated_at) on public.kol_sets to authenticated;
grant update (name, description, slots, published, updated_at) on public.kol_sets to authenticated;
grant delete on public.kol_sets to authenticated;

drop policy if exists kol_profiles_read on public.kol_profiles;
create policy kol_profiles_read on public.kol_profiles for select using (true);
drop policy if exists kol_profiles_insert on public.kol_profiles;
create policy kol_profiles_insert on public.kol_profiles for insert to authenticated
  with check (user_id = (select auth.uid()) and (select public.is_kol()));
drop policy if exists kol_profiles_update on public.kol_profiles;
create policy kol_profiles_update on public.kol_profiles for update to authenticated
  using (user_id = (select auth.uid()) and (select public.is_kol()))
  with check (user_id = (select auth.uid()) and (select public.is_kol()));

-- Người xem thấy bộ đã công khai; chủ bộ thấy cả bản nháp của mình.
drop policy if exists kol_sets_read on public.kol_sets;
create policy kol_sets_read on public.kol_sets for select using (published or user_id = (select auth.uid()));
drop policy if exists kol_sets_insert on public.kol_sets;
create policy kol_sets_insert on public.kol_sets for insert to authenticated
  with check (user_id = (select auth.uid()) and (select public.is_kol()));
drop policy if exists kol_sets_update on public.kol_sets;
create policy kol_sets_update on public.kol_sets for update to authenticated
  using (user_id = (select auth.uid()) and (select public.is_kol()))
  with check (user_id = (select auth.uid()) and (select public.is_kol()));
drop policy if exists kol_sets_delete on public.kol_sets;
create policy kol_sets_delete on public.kol_sets for delete to authenticated
  using (user_id = (select auth.uid()) or (select public.is_comment_admin()));

-- Ảnh đăng lên bucket public "kol" (5 MB; jpeg, png, webp). Đường dẫn: <user_id>/<ngẫu nhiên>.<đuôi>.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('kol', 'kol', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

drop policy if exists kol_storage_insert on storage.objects;
create policy kol_storage_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'kol' and (storage.foldername(name))[1] = (select auth.uid())::text and (select public.is_kol()));
drop policy if exists kol_storage_update on storage.objects;
create policy kol_storage_update on storage.objects for update to authenticated
  using (bucket_id = 'kol' and (storage.foldername(name))[1] = (select auth.uid())::text and (select public.is_kol()))
  with check (bucket_id = 'kol' and (storage.foldername(name))[1] = (select auth.uid())::text and (select public.is_kol()));
drop policy if exists kol_storage_delete on storage.objects;
create policy kol_storage_delete on storage.objects for delete to authenticated
  using (bucket_id = 'kol' and (storage.foldername(name))[1] = (select auth.uid())::text and (select public.is_kol()));

-- Hàm chỉ dùng trong CHECK và policy, không phải endpoint RPC cho người lạ.
-- kol_photos_ok không phải security definer: CHECK chạy bằng quyền người ghi, nên authenticated phải có EXECUTE.
revoke execute on function public.kol_photos_ok(jsonb) from public, anon;
grant execute on function public.kol_photos_ok(jsonb) to authenticated;
-- authenticated phải giữ EXECUTE trên public.is_comment_admin() (định nghĩa trong community.sql, không định nghĩa lại ở đây) cho policy kol_sets_delete.
