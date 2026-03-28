-- beta_registrations: collect early-access email signups for beta recruitment

create table if not exists public.beta_registrations (
  id         uuid        primary key default gen_random_uuid(),
  email      text        not null,
  created_at timestamptz not null default now(),

  constraint beta_registrations_email_unique unique (email)
);

alter table public.beta_registrations enable row level security;

-- Anyone (unauthenticated visitor) can submit their email.
drop policy if exists "beta_registrations_insert_anon" on public.beta_registrations;
create policy "beta_registrations_insert_anon"
  on public.beta_registrations for insert
  with check (
    email is not null
    and length(trim(email)) > 0
  );

-- Only authenticated admins can read the list.
drop policy if exists "beta_registrations_select_authenticated" on public.beta_registrations;
create policy "beta_registrations_select_authenticated"
  on public.beta_registrations for select
  to authenticated
  using (true);

-- Index for unique constraint performance and admin queries.
create index if not exists beta_registrations_email_idx
  on public.beta_registrations (email);
