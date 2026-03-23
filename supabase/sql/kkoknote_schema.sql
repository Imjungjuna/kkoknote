-- KkokNote MVP schema
-- Assumptions:
-- - projects.domain stores the exact Origin string (e.g. 'https://customer.com')
-- - Widgets run in the browser and send the Origin header automatically

create extension if not exists pgcrypto;

-- =========================
-- projects
-- =========================
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  domain text not null, -- allowed Origin for widget requests
  theme_color text not null default '#111827',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.projects enable row level security;

-- Owner (admin) can manage their projects.
drop policy if exists "projects_select_owner" on public.projects;
create policy "projects_select_owner"
  on public.projects for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "projects_modify_owner" on public.projects;
create policy "projects_modify_owner"
  on public.projects for insert
  to authenticated
  with check (user_id = auth.uid());

drop policy if exists "projects_update_owner" on public.projects;
create policy "projects_update_owner"
  on public.projects for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Widget reads project info by Origin.
drop policy if exists "projects_select_widget_by_origin" on public.projects;
create policy "projects_select_widget_by_origin"
  on public.projects for select
  to anon
  using (
    domain = (current_setting('request.headers', true)::json->>'origin')
  );

-- =========================
-- feedbacks
-- =========================
create type if not exists public.feedback_status as enum ('pending', 'progress', 'done');

create table if not exists public.feedbacks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  content text not null,
  status public.feedback_status not null default 'pending',
  upvotes integer not null default 0,
  user_identifier text, -- widget localStorage ID for analytics / attribution
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.feedbacks enable row level security;

-- Owner reads feedbacks for their projects.
drop policy if exists "feedbacks_select_owner" on public.feedbacks;
create policy "feedbacks_select_owner"
  on public.feedbacks for select
  to authenticated
  using (
    exists (
      select 1 from public.projects p
      where p.id = feedbacks.project_id
        and p.user_id = auth.uid()
    )
  );

-- Widget can read feedbacks by Origin.
drop policy if exists "feedbacks_select_widget_by_origin" on public.feedbacks;
create policy "feedbacks_select_widget_by_origin"
  on public.feedbacks for select
  to anon
  using (
    exists (
      select 1 from public.projects p
      where p.id = feedbacks.project_id
        and p.domain = (current_setting('request.headers', true)::json->>'origin')
    )
  );

-- Widget can insert feedbacks for a project by Origin.
-- Security note: vote/upvote abuse prevention is intentionally MVP-level (client LocalStorage).
drop policy if exists "feedbacks_insert_widget_by_origin" on public.feedbacks;
create policy "feedbacks_insert_widget_by_origin"
  on public.feedbacks for insert
  to anon
  with check (
    exists (
      select 1 from public.projects p
      where p.id = project_id
        and p.domain = (current_setting('request.headers', true)::json->>'origin')
    )
  );

-- Owner can update feedback status.
drop policy if exists "feedbacks_update_owner" on public.feedbacks;
create policy "feedbacks_update_owner"
  on public.feedbacks for update
  to authenticated
  using (
    exists (
      select 1 from public.projects p
      where p.id = feedbacks.project_id
        and p.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.projects p
      where p.id = project_id
        and p.user_id = auth.uid()
    )
  );

-- Widget may update upvotes (MVP: allow any UPDATE by widget origin; UI prevents duplicates client-side).
drop policy if exists "feedbacks_update_widget_by_origin" on public.feedbacks;
create policy "feedbacks_update_widget_by_origin"
  on public.feedbacks for update
  to anon
  using (
    exists (
      select 1 from public.projects p
      where p.id = feedbacks.project_id
        and p.domain = (current_setting('request.headers', true)::json->>'origin')
    )
  )
  with check (
    exists (
      select 1 from public.projects p
      where p.id = project_id
        and p.domain = (current_setting('request.headers', true)::json->>'origin')
    )
  );

-- =========================
-- updates
-- =========================
create table if not exists public.updates (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  title text not null,
  content text not null, -- Markdown
  created_at timestamptz not null default now()
);

alter table public.updates enable row level security;

-- Owner manages updates.
drop policy if exists "updates_select_owner" on public.updates;
create policy "updates_select_owner"
  on public.updates for select
  to authenticated
  using (
    exists (
      select 1 from public.projects p
      where p.id = updates.project_id
        and p.user_id = auth.uid()
    )
  );

drop policy if exists "updates_insert_owner" on public.updates;
create policy "updates_insert_owner"
  on public.updates for insert
  to authenticated
  with check (
    exists (
      select 1 from public.projects p
      where p.id = project_id
        and p.user_id = auth.uid()
    )
  );

-- Widget reads updates by Origin.
drop policy if exists "updates_select_widget_by_origin" on public.updates;
create policy "updates_select_widget_by_origin"
  on public.updates for select
  to anon
  using (
    exists (
      select 1 from public.projects p
      where p.id = updates.project_id
        and p.domain = (current_setting('request.headers', true)::json->>'origin')
    )
  );

-- =========================
-- Indexes (RLS performance)
-- =========================
create index if not exists projects_user_id_idx on public.projects(user_id);
create index if not exists projects_domain_idx on public.projects(domain);
create index if not exists feedbacks_project_id_idx on public.feedbacks(project_id);
create index if not exists feedbacks_status_idx on public.feedbacks(status);
create index if not exists updates_project_id_idx on public.updates(project_id);

-- =========================
-- Realtime: supabase_realtime publication
-- =========================
-- For Postgres Changes, enable the `supabase_realtime` publication
-- and add the tables you want to stream.
--
-- Typical setup in Supabase Dashboard:
--  - Realtime -> Publications -> supabase_realtime -> add `feedbacks`
--
-- SQL convenience:
do $$
begin
  if not exists (select 1 from pg_catalog.pg_publication where pubname = 'supabase_realtime') then
    execute 'create publication supabase_realtime';
  end if;

  execute 'alter publication supabase_realtime add table public.feedbacks';
exception
  when duplicate_object then
    null;
  when undefined_table then
    null;
  when others then
    null;
end $$;

-- If you also want widgets to receive realtime updates for updates table:
-- do $$ begin execute 'alter publication supabase_realtime add table public.updates'; exception when others then null; end $$;

