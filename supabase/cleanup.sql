-- Removes old ColorLab 2.0 data the site does not use. DESTRUCTIVE, no undo. The owner runs this by hand
-- in the SQL editor, one part per project. Approved by the owner on 2026-11-12.
-- ColorLab 2.0 is retired: sonycolorlab.app redirects to www.alphacolorlab.com.
-- Backup of every table dropped here: ~/arena-wikiblog/backup/supabase-2026-11-08/{content,auth}/*.json
-- (outside this repo). Before running a part, run its "check" query and compare the counts with the
-- numbers in the comment. If a count is higher than the backup, export that table again first.
-- Storage files are not touched here.
-- Not covered (not approved yet): CONTENT products, knowledge_notes, learning_paths, lab_articles.

------------------------------------------------------------------------------------------------
-- Part A: CONTENT project (touiyczjvnuaxfzulgeq)
------------------------------------------------------------------------------------------------
-- Check (read only). Backup has: recipes 81, recipe_translations 162, recipe_images 34, sony_cameras 94, lab_assets 30.
select 'recipes' as t, count(*) from public.recipes
union all select 'recipe_translations', count(*) from public.recipe_translations
union all select 'recipe_images', count(*) from public.recipe_images
union all select 'sony_cameras', count(*) from public.sony_cameras
union all select 'lab_assets', count(*) from public.lab_assets;

begin;
-- Color Bank reads lib/zve10/presets.json; nothing reads these tables.
drop table if exists public.recipe_images, public.recipe_translations, public.recipes cascade;
-- Replaced by data/products.json.
drop table if exists public.sony_cameras;
-- Uploads for ColorLab's article editor.
drop table if exists public.lab_assets;
-- Enums used only by recipes. No cascade: this fails, and the whole part rolls back, if anything else still uses them.
drop type if exists public.recipe_format, public.wb_mode;
commit;

------------------------------------------------------------------------------------------------
-- Part B: AUTH project (nqeedlgzaewccqztqvik)
------------------------------------------------------------------------------------------------
-- Check (read only). Backup has: recipes 46, recipe_translations 92, recipe_images 34, lab_articles 3, lab_assets 0,
-- sony_cameras 94, proposal_votes 0, recipe_proposals 0, community_photos 0, recipe_comments 1.
select 'recipes' as t, count(*) from public.recipes
union all select 'recipe_translations', count(*) from public.recipe_translations
union all select 'recipe_images', count(*) from public.recipe_images
union all select 'lab_articles', count(*) from public.lab_articles
union all select 'lab_assets', count(*) from public.lab_assets
union all select 'sony_cameras', count(*) from public.sony_cameras
union all select 'proposal_votes', count(*) from public.proposal_votes
union all select 'recipe_proposals', count(*) from public.recipe_proposals
union all select 'community_photos', count(*) from public.community_photos
union all select 'recipe_comments', count(*) from public.recipe_comments;

begin;
-- Keep the one old recipe comment: move it into the comments table under its author's account.
insert into public.comments (page, user_id, author_name, author_avatar, body, created_at)
select 'recipe/' || rc.recipe_slug, u.id, rc.author_name, rc.author_avatar, rc.content, rc.created_at
  from public.recipe_comments rc
  join auth.users u on lower(u.email) = lower(rc.author_email)
 where not exists (select 1 from public.comments c where c.page = 'recipe/' || rc.recipe_slug and c.body = rc.content);
-- Stale copies of content tables from before the content/auth split.
drop table if exists public.recipe_images, public.recipe_translations, public.recipes cascade;
drop table if exists public.sony_cameras, public.lab_assets, public.lab_articles cascade;
-- ColorLab community features the site does not have, and the old comment table.
drop table if exists public.proposal_votes, public.recipe_proposals, public.community_photos, public.recipe_comments cascade;
drop type if exists public.recipe_format, public.wb_mode;
commit;
-- Stays: admin_emails (comment moderators, KOL), comments, comment_likes, user_state, kol_emails, kol_profiles, kol_sets.

-- After part B (read only): the tables that must remain.
select tablename from pg_tables where schemaname = 'public' order by 1;
