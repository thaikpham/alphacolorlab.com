delete from sony_cameras where category = 'audio';
alter table sony_cameras drop constraint if exists sony_cameras_category_check;
alter table sony_cameras add constraint sony_cameras_category_check check (category in ('camera', 'lens', 'accessory'));
