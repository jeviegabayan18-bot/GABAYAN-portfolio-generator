-- Profile picture storage for Portfolio Generator.
-- Run this in the Supabase SQL Editor AFTER supabase/migrations/0001_init.sql.
-- Safe to run more than once.
--
-- The website uploads images to the public bucket "profile-pictures"
-- (override the name with VITE_SUPABASE_BUCKET only if you change it here too).
-- Files are stored at {portfolio_id}/{random-id}.{ext}.
-- The portfolio row keeps the public URL and this path.
--
-- Same security tradeoff as the tables: there is no login, so the anon role
-- may read, upload, replace, and delete files in this bucket only.
-- Do not use these policies on a bucket that holds private files.

do $$
begin
  if not exists (select 1 from pg_namespace where nspname = 'storage') then
    raise exception 'storage schema not found. Run this script in the Supabase SQL Editor.';
  end if;
end $$;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'profile-pictures',
  'profile-pictures',
  true,
  2097152,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update set
  name = excluded.name,
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists profile_pictures_bucket_read on storage.buckets;
create policy profile_pictures_bucket_read
  on storage.buckets
  for select
  to anon
  using (id = 'profile-pictures');

drop policy if exists profile_pictures_anon_select on storage.objects;
create policy profile_pictures_anon_select
  on storage.objects
  for select
  to anon
  using (bucket_id = 'profile-pictures');

drop policy if exists profile_pictures_anon_insert on storage.objects;
create policy profile_pictures_anon_insert
  on storage.objects
  for insert
  to anon
  with check (bucket_id = 'profile-pictures');

drop policy if exists profile_pictures_anon_update on storage.objects;
create policy profile_pictures_anon_update
  on storage.objects
  for update
  to anon
  using (bucket_id = 'profile-pictures')
  with check (bucket_id = 'profile-pictures');

drop policy if exists profile_pictures_anon_delete on storage.objects;
create policy profile_pictures_anon_delete
  on storage.objects
  for delete
  to anon
  using (bucket_id = 'profile-pictures');
