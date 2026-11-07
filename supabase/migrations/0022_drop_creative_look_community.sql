-- Creative Look recipes were removed on 2026-11-07 (owner). Control keeps the
-- dormant legacy `recipes` table from before the content split, so its schema
-- stays as history; only the rows go, with their translations and images
-- (on delete cascade), and the community rows on any `cl-` slug spelling.
delete from community_photos where recipe_slug ~ '^cl-[0-9]{3}(-|$)';
delete from recipe_comments where recipe_slug ~ '^cl-[0-9]{3}(-|$)';
delete from recipe_proposals where recipe_slug ~ '^cl-[0-9]{3}(-|$)';
delete from recipes where format = 'cl';
