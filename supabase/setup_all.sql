-- Portfolio Generator — complete database setup
-- Database project: Portfolio Generator
--
-- Paste this WHOLE file into the Supabase SQL Editor (Dashboard -> SQL -> New query)
-- and click Run. It creates the tables, the three templates, row level security,
-- and the profile-pictures storage bucket.
--
-- Safe to run again: existing portfolio rows are kept, policies are replaced,
-- and the bucket settings are updated.
--
-- The same SQL is also split into:
--   supabase/migrations/0001_init.sql
--   supabase/storage.sql
-- Optional sample person (separate paste): supabase/seed.sql
--
-- There is no login in this assignment. The policies let the anon role (the
-- publishable key) read and write portfolio data so the instructor can test
-- the site. Do not use the secret key or the service-role key in the website.

-- Portfolio Generator
-- Database project: Portfolio Generator
-- Run this whole file once in the Supabase SQL Editor (Dashboard -> SQL -> New query).
-- It is safe to run again: tables are created only if they are missing, and policies
-- are dropped and recreated. It does not delete existing portfolio rows.
--
-- The storage bucket is created in the next section of this file.
-- Optional sample row: supabase/seed.sql.
--
-- SECURITY TRADEOFF (please read):
-- This school assignment has no login. The instructor opens the published website
-- and uses it anonymously. The app talks to Supabase with the public anon key.
-- Row Level Security is ENABLED on every table below. The policies then allow the
-- anon role to select, insert, update, and delete portfolio rows (and their child
-- rows). Anyone who has the anon key can read and change every portfolio.
-- That is acceptable for this assignment. It is NOT safe for a real product.
-- A later version should add authentication and limit each policy with auth.uid().
-- The templates table is read-only for anon (select only).

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- templates: the three layouts the website can generate. Fixed ids 1, 2, 3
-- match the app (src/lib/templates.ts).
-- ---------------------------------------------------------------------------

create table if not exists public.templates (
  id smallint primary key,
  slug text not null unique,
  name text not null,
  description text not null,
  constraint templates_slug_ck check (slug in ('simple', 'modern', 'creative')),
  constraint templates_name_ck check (char_length(trim(name)) between 1 and 40),
  constraint templates_description_ck check (char_length(trim(description)) between 1 and 300)
);

comment on table public.templates is
  'The three portfolio layouts. Read-only for the anon role.';

insert into public.templates (id, slug, name, description) values
  (1, 'simple', 'Simple', 'A clean single-column page with a white background and quiet type.'),
  (2, 'modern', 'Modern', 'A card layout with a colored header, skill bars, and a project grid.'),
  (3, 'creative', 'Creative', 'A bold sidebar and timeline with strong color and a different reading order.')
on conflict (id) do update set
  slug = excluded.slug,
  name = excluded.name,
  description = excluded.description;

-- ---------------------------------------------------------------------------
-- portfolios: one row per saved person. Child tables hold the repeatable lists.
-- ---------------------------------------------------------------------------

create table if not exists public.portfolios (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null,
  contact_number text,
  address text,
  about_me text,
  profile_picture_url text,
  profile_picture_path text,
  template_id smallint references public.templates (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint portfolios_full_name_ck check (char_length(trim(full_name)) between 1 and 120),
  constraint portfolios_email_ck check (
    char_length(email) <= 200
    and email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
  ),
  constraint portfolios_contact_number_ck check (
    contact_number is null or char_length(contact_number) between 3 and 40
  ),
  constraint portfolios_address_ck check (
    address is null or char_length(address) between 1 and 300
  ),
  constraint portfolios_about_me_ck check (
    about_me is null or char_length(about_me) between 1 and 4000
  ),
  constraint portfolios_picture_url_ck check (
    profile_picture_url is null or char_length(profile_picture_url) <= 2000000
  ),
  constraint portfolios_picture_path_ck check (
    profile_picture_path is null or char_length(profile_picture_path) between 1 and 500
  )
);

comment on table public.portfolios is
  'Portfolio header. Anon policies are open because this assignment has no login.';

comment on column public.portfolios.profile_picture_url is
  'Public URL of the photo in Storage, or empty when there is no photo.';

comment on column public.portfolios.profile_picture_path is
  'Object path inside the profile-pictures bucket, used when replacing or deleting the file.';

comment on column public.portfolios.template_id is
  'Null until the user chooses Simple (1), Modern (2), or Creative (3).';

create index if not exists portfolios_template_id_idx
  on public.portfolios (template_id);

create index if not exists portfolios_updated_at_idx
  on public.portfolios (updated_at desc);

-- ---------------------------------------------------------------------------
-- Repeatable child tables. Deleting a portfolio deletes its children.
-- sort_order stores the order the user entered on the form (0, 1, 2, ...).
-- ---------------------------------------------------------------------------

create table if not exists public.education (
  id uuid primary key default gen_random_uuid(),
  portfolio_id uuid not null references public.portfolios (id) on delete cascade,
  sort_order integer not null default 0,
  school text not null,
  degree text,
  field_of_study text,
  start_year integer,
  end_year integer,
  description text,
  created_at timestamptz not null default now(),
  constraint education_school_ck check (char_length(trim(school)) between 1 and 160),
  constraint education_degree_ck check (degree is null or char_length(degree) between 1 and 160),
  constraint education_field_ck check (
    field_of_study is null or char_length(field_of_study) between 1 and 160
  ),
  constraint education_start_year_ck check (
    start_year is null or start_year between 1950 and 2100
  ),
  constraint education_end_year_ck check (
    end_year is null or end_year between 1950 and 2100
  ),
  constraint education_year_order_ck check (
    start_year is null or end_year is null or end_year >= start_year
  ),
  constraint education_description_ck check (
    description is null or char_length(description) between 1 and 2000
  ),
  constraint education_sort_ck check (sort_order >= 0)
);

create table if not exists public.skills (
  id uuid primary key default gen_random_uuid(),
  portfolio_id uuid not null references public.portfolios (id) on delete cascade,
  sort_order integer not null default 0,
  name text not null,
  level smallint,
  created_at timestamptz not null default now(),
  constraint skills_name_ck check (char_length(trim(name)) between 1 and 80),
  constraint skills_level_ck check (level is null or level between 1 and 5),
  constraint skills_sort_ck check (sort_order >= 0)
);

comment on column public.skills.level is
  'Optional 1 (beginner) through 5 (advanced). Null when the user skips the level.';

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  portfolio_id uuid not null references public.portfolios (id) on delete cascade,
  sort_order integer not null default 0,
  title text not null,
  description text,
  project_url text,
  technologies text,
  created_at timestamptz not null default now(),
  constraint projects_title_ck check (char_length(trim(title)) between 1 and 160),
  constraint projects_description_ck check (
    description is null or char_length(description) between 1 and 2000
  ),
  constraint projects_url_ck check (
    project_url is null
    or (
      char_length(project_url) between 1 and 300
      and project_url ~* '^https?://'
    )
  ),
  constraint projects_technologies_ck check (
    technologies is null or char_length(technologies) between 1 and 300
  ),
  constraint projects_sort_ck check (sort_order >= 0)
);

comment on column public.projects.technologies is
  'Comma-separated list, for example: HTML, CSS, JavaScript.';

create table if not exists public.work_experience (
  id uuid primary key default gen_random_uuid(),
  portfolio_id uuid not null references public.portfolios (id) on delete cascade,
  sort_order integer not null default 0,
  company text not null,
  position text not null,
  start_date date,
  end_date date,
  is_current boolean not null default false,
  description text,
  created_at timestamptz not null default now(),
  constraint work_experience_company_ck check (char_length(trim(company)) between 1 and 160),
  constraint work_experience_position_ck check (char_length(trim(position)) between 1 and 160),
  constraint work_experience_description_ck check (
    description is null or char_length(description) between 1 and 2000
  ),
  constraint work_experience_dates_ck check (
    start_date is null or end_date is null or end_date >= start_date
  ),
  constraint work_experience_current_ck check (not is_current or end_date is null),
  constraint work_experience_sort_ck check (sort_order >= 0)
);

create table if not exists public.social_links (
  id uuid primary key default gen_random_uuid(),
  portfolio_id uuid not null references public.portfolios (id) on delete cascade,
  sort_order integer not null default 0,
  platform text not null,
  url text not null,
  created_at timestamptz not null default now(),
  constraint social_links_platform_ck check (char_length(trim(platform)) between 1 and 80),
  constraint social_links_url_ck check (
    char_length(url) between 1 and 300
    and url ~* '^https?://'
  ),
  constraint social_links_sort_ck check (sort_order >= 0)
);

-- Indexes on foreign keys (leftmost column of each index).
create index if not exists education_portfolio_id_idx
  on public.education (portfolio_id, sort_order);

create index if not exists skills_portfolio_id_idx
  on public.skills (portfolio_id, sort_order);

create index if not exists projects_portfolio_id_idx
  on public.projects (portfolio_id, sort_order);

create index if not exists work_experience_portfolio_id_idx
  on public.work_experience (portfolio_id, sort_order);

create index if not exists social_links_portfolio_id_idx
  on public.social_links (portfolio_id, sort_order);

-- ---------------------------------------------------------------------------
-- Keep portfolios.updated_at current whenever the header row changes.
-- Child-row edits also touch the header, so the Manage page stays in order.
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists portfolios_set_updated_at on public.portfolios;

create trigger portfolios_set_updated_at
  before update on public.portfolios
  for each row
  execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Row Level Security. Enabled on every table. Policies follow.
-- ---------------------------------------------------------------------------

alter table public.templates enable row level security;
alter table public.portfolios enable row level security;
alter table public.education enable row level security;
alter table public.skills enable row level security;
alter table public.projects enable row level security;
alter table public.work_experience enable row level security;
alter table public.social_links enable row level security;

drop policy if exists templates_anon_select on public.templates;
create policy templates_anon_select
  on public.templates
  for select
  to anon
  using (true);

drop policy if exists portfolios_anon_select on public.portfolios;
create policy portfolios_anon_select
  on public.portfolios
  for select
  to anon
  using (true);

drop policy if exists portfolios_anon_insert on public.portfolios;
create policy portfolios_anon_insert
  on public.portfolios
  for insert
  to anon
  with check (true);

drop policy if exists portfolios_anon_update on public.portfolios;
create policy portfolios_anon_update
  on public.portfolios
  for update
  to anon
  using (true)
  with check (true);

drop policy if exists portfolios_anon_delete on public.portfolios;
create policy portfolios_anon_delete
  on public.portfolios
  for delete
  to anon
  using (true);

-- Same open anon policies on each child table. There is no per-user owner yet.
drop policy if exists education_anon_select on public.education;
create policy education_anon_select on public.education for select to anon using (true);
drop policy if exists education_anon_insert on public.education;
create policy education_anon_insert on public.education for insert to anon with check (true);
drop policy if exists education_anon_update on public.education;
create policy education_anon_update on public.education for update to anon using (true) with check (true);
drop policy if exists education_anon_delete on public.education;
create policy education_anon_delete on public.education for delete to anon using (true);

drop policy if exists skills_anon_select on public.skills;
create policy skills_anon_select on public.skills for select to anon using (true);
drop policy if exists skills_anon_insert on public.skills;
create policy skills_anon_insert on public.skills for insert to anon with check (true);
drop policy if exists skills_anon_update on public.skills;
create policy skills_anon_update on public.skills for update to anon using (true) with check (true);
drop policy if exists skills_anon_delete on public.skills;
create policy skills_anon_delete on public.skills for delete to anon using (true);

drop policy if exists projects_anon_select on public.projects;
create policy projects_anon_select on public.projects for select to anon using (true);
drop policy if exists projects_anon_insert on public.projects;
create policy projects_anon_insert on public.projects for insert to anon with check (true);
drop policy if exists projects_anon_update on public.projects;
create policy projects_anon_update on public.projects for update to anon using (true) with check (true);
drop policy if exists projects_anon_delete on public.projects;
create policy projects_anon_delete on public.projects for delete to anon using (true);

drop policy if exists work_experience_anon_select on public.work_experience;
create policy work_experience_anon_select on public.work_experience for select to anon using (true);
drop policy if exists work_experience_anon_insert on public.work_experience;
create policy work_experience_anon_insert on public.work_experience for insert to anon with check (true);
drop policy if exists work_experience_anon_update on public.work_experience;
create policy work_experience_anon_update on public.work_experience for update to anon using (true) with check (true);
drop policy if exists work_experience_anon_delete on public.work_experience;
create policy work_experience_anon_delete on public.work_experience for delete to anon using (true);

drop policy if exists social_links_anon_select on public.social_links;
create policy social_links_anon_select on public.social_links for select to anon using (true);
drop policy if exists social_links_anon_insert on public.social_links;
create policy social_links_anon_insert on public.social_links for insert to anon with check (true);
drop policy if exists social_links_anon_update on public.social_links;
create policy social_links_anon_update on public.social_links for update to anon using (true) with check (true);
drop policy if exists social_links_anon_delete on public.social_links;
create policy social_links_anon_delete on public.social_links for delete to anon using (true);

-- Table privileges. Policies alone do not grant access.
grant select on public.templates to anon;

grant select, insert, update, delete on public.portfolios to anon;
grant select, insert, update, delete on public.education to anon;
grant select, insert, update, delete on public.skills to anon;
grant select, insert, update, delete on public.projects to anon;
grant select, insert, update, delete on public.work_experience to anon;
grant select, insert, update, delete on public.social_links to anon;

revoke insert, update, delete on public.templates from anon;

-- Profile picture storage for Portfolio Generator.
-- Included automatically when you run supabase/setup_all.sql.
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

-- Policies do not grant table privileges by themselves.
grant select on storage.buckets to anon;
grant select, insert, update, delete on storage.objects to anon;
