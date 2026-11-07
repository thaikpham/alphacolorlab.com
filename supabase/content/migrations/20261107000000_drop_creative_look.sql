-- Drop Creative Look format from content plane
delete from recipes where format = 'cl';
alter table recipes drop constraint if exists recipes_look_matches_format;
drop index if exists recipes_look_idx;
alter table recipes drop column if exists look;
drop type if exists creative_look;
alter table recipes drop constraint if exists recipes_id_check;
alter table recipes add constraint recipes_id_check check (id ~ '^PP-[0-9]{3}$');
alter type recipe_format rename to recipe_format_old;
create type recipe_format as enum ('pp');
alter table recipes alter column format type recipe_format using format::text::recipe_format;
drop type recipe_format_old;
