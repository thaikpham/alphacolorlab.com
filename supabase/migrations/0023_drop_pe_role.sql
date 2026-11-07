delete from admin_emails where role = 'pe';
alter table admin_emails drop constraint if exists admin_emails_role_check;
alter table admin_emails add constraint admin_emails_role_check check (role in ('super', 'di'));
