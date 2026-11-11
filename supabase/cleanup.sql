-- Removes old data the new site does not use. DESTRUCTIVE: run only after the owner confirms the list below,
-- and only once ColorLab 2.0 (www.sonycolorlab.app) is retired: its camera wiki, comments, proposals and
-- article images read these tables. Backup of every row: arena-wikiblog/backup/supabase-2026-11-08/.
-- Storage files (recipe images, lab assets, community photos) are not touched here.

------------------------------------------------------------------------------------------------
-- Part A: CONTENT project (touiyczjvnuaxfzulgeq)
------------------------------------------------------------------------------------------------
-- 36 recipes that were never published (their translations and images go with them: on delete cascade).
delete from public.recipes where not published;
-- Published on ColorLab but excluded from the new site (EXCLUDE_ARTICLES in scripts/import-colorlab.ts).
delete from public.lab_articles where id in ('chup-dem-cam-tay-iso-cao', 'creative-look-cho-ngay-dau');
-- Replaced by public.products (content.sql); prices and B&H photos are not used.
drop table if exists public.sony_cameras;
-- Uploads for ColorLab's article editor; no article on the site uses them.
drop table if exists public.lab_assets;

------------------------------------------------------------------------------------------------
-- Part B: AUTH project (nqeedlgzaewccqztqvik). Run community.sql there first.
------------------------------------------------------------------------------------------------
-- Keep the one old recipe comment: move it into the new comments table under its author's account.
insert into public.comments (page, user_id, author_name, author_avatar, body, created_at)
select 'recipe/' || rc.recipe_slug, u.id, rc.author_name, rc.author_avatar, rc.content, rc.created_at
  from public.recipe_comments rc
  join auth.users u on lower(u.email) = lower(rc.author_email)
 where not exists (select 1 from public.comments c where c.page = 'recipe/' || rc.recipe_slug and c.body = rc.content);
-- Stale copies of content tables from before the content/auth split (the live copies are on CONTENT).
drop table if exists public.recipe_images, public.recipe_translations, public.recipes cascade;
drop table if exists public.sony_cameras, public.lab_assets, public.lab_articles cascade;
-- ColorLab community features the new site does not have (0 rows each), and the old comment table.
drop table if exists public.proposal_votes, public.recipe_proposals, public.community_photos, public.recipe_comments cascade;
-- admin_emails stays: it names the comment moderators.
