-- Drop Creative Look community data from control plane
delete from community_photos where recipe_slug ~ '^cl-[0-9]{3}(-|$)';
delete from recipe_comments where recipe_slug ~ '^cl-[0-9]{3}(-|$)';
delete from recipe_proposals where recipe_slug ~ '^cl-[0-9]{3}(-|$)';
