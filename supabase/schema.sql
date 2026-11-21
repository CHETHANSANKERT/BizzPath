-- ============================================================================
-- BizPath — Supabase backend
-- Tables, triggers, RLS and the timed-preview / subscription access rules.
-- Apply in Supabase → SQL Editor → paste → Run. Safe to re-run.
-- ============================================================================

create extension if not exists pgcrypto;

-- ============================================================================
-- 1. TABLES
-- ============================================================================

create table if not exists public.profiles (
  id            uuid primary key default gen_random_uuid(),
  auth_user_id  uuid unique,
  email         text unique,
  full_name     text,
  role          text not null default 'user' check (role in ('user', 'admin')),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create table if not exists public.categories (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text not null unique,
  icon        text,
  blurb       text,
  description text,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now()
);

create table if not exists public.creators (
  id                    uuid primary key default gen_random_uuid(),
  owner_id              uuid references public.profiles(id) on delete set null,
  name                  text not null,
  slug                  text not null unique,
  headline              text,
  bio                   text,
  city                  text,
  expertise             text[] not null default '{}',
  verified              boolean not null default false,
  years_experience      integer,
  businesses_built      integer,
  rating                numeric(3,2) not null default 0,
  review_count          integer not null default 0,
  consultation_fee      numeric(12,2),
  consultation_duration integer,
  response_time         text,
  followers             integer not null default 0,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create table if not exists public.blueprints (
  id                        uuid primary key default gen_random_uuid(),
  owner_id                  uuid references public.profiles(id) on delete set null,
  creator_id                uuid references public.creators(id) on delete set null,
  creator_name              text,
  creator_slug              text,
  slug                      text not null unique,
  title                     text not null,
  tagline                   text,
  category                  text,
  summary                   text,
  difficulty                text not null default 'Beginner'
                              check (difficulty in ('Beginner', 'Intermediate', 'Advanced')),
  status                    text not null default 'draft'
                              check (status in ('draft', 'pending', 'published')),
  setup_cost_min            numeric(12,2),
  setup_cost_max            numeric(12,2),
  working_capital           numeric(12,2),
  payback_months            numeric(6,1),
  gross_margin              numeric(6,1),
  monthly_revenue_potential numeric(12,2),
  space_requirement         text,
  city                      text,
  price                     numeric(12,2) not null default 0,
  is_free                   boolean not null default false,
  featured                  boolean not null default false,
  version                   integer not null default 1,
  -- content shown during the timed preview
  overview                  text,
  market_demand             text,
  target_customer           text,
  -- content unlocked by a subscription or a purchase
  investment_breakdown      jsonb not null default '[]',
  equipment                 text[] not null default '{}',
  infrastructure            text,
  staff_roles               jsonb not null default '[]',
  licenses                  text[] not null default '{}',
  roadmap                   jsonb not null default '[]',
  revenue_model             text,
  revenue_streams           text[] not null default '{}',
  marketing_plan            text,
  risks                     jsonb not null default '[]',
  expansion_strategy        text,
  tags                      text[] not null default '{}',
  -- paywall
  preview_seconds           integer not null default 600 check (preview_seconds between 60 and 86400),
  rating                    numeric(3,2) not null default 0,
  review_count              integer not null default 0,
  buyer_count               integer not null default 0,
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now()
);

create table if not exists public.saved_blueprints (
  id            uuid primary key default gen_random_uuid(),
  owner_id      uuid not null references public.profiles(id) on delete cascade,
  blueprint_id  uuid not null references public.blueprints(id) on delete cascade,
  note          text,
  created_at    timestamptz not null default now(),
  unique (owner_id, blueprint_id)
);

create table if not exists public.purchases (
  id              uuid primary key default gen_random_uuid(),
  owner_id        uuid not null references public.profiles(id) on delete cascade,
  blueprint_id    uuid references public.blueprints(id) on delete set null,
  blueprint_title text,
  blueprint_slug  text,
  category        text,
  creator_id      uuid references public.creators(id) on delete set null,
  creator_name    text,
  amount          numeric(12,2) not null default 0,
  status          text not null default 'pending'
                    check (status in ('paid', 'pending', 'refunded')),
  invoice_number  text unique,
  payment_method  text,
  provider_ref    text,
  purchased_at    timestamptz,
  created_at      timestamptz not null default now()
);

create table if not exists public.projects (
  id              uuid primary key default gen_random_uuid(),
  owner_id        uuid not null references public.profiles(id) on delete cascade,
  blueprint_id    uuid references public.blueprints(id) on delete set null,
  blueprint_title text not null,
  blueprint_slug  text,
  category        text,
  status          text not null default 'planning'
                    check (status in ('planning', 'active', 'paused', 'completed')),
  start_date      date,
  target_date     date,
  notes           text,
  milestones      jsonb not null default '[]',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create table if not exists public.enquiries (
  id              uuid primary key default gen_random_uuid(),
  owner_id        uuid references public.profiles(id) on delete set null,
  name            text not null,
  email           text not null,
  phone           text,
  message         text,
  type            text not null default 'blueprint-access'
                    check (type in ('blueprint-access', 'consultation', 'creator-application', 'support')),
  blueprint_id    uuid references public.blueprints(id) on delete set null,
  blueprint_title text,
  creator_slug    text,
  creator_name    text,
  scheduled_at    timestamptz,
  meeting_link    text,
  status          text not null default 'new' check (status in ('new', 'contacted', 'closed')),
  created_at      timestamptz not null default now()
);

create table if not exists public.payout_accounts (
  id             uuid primary key default gen_random_uuid(),
  creator_id     uuid not null unique references public.creators(id) on delete cascade,
  method         text not null default 'upi' check (method in ('upi', 'bank')),
  upi_id         text,
  account_name   text,
  account_number text,
  ifsc           text,
  status         text not null default 'pending' check (status in ('pending', 'verified')),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create table if not exists public.payouts (
  id          uuid primary key default gen_random_uuid(),
  creator_id  uuid references public.creators(id) on delete cascade,
  amount      numeric(12,2) not null,
  period      text,
  status      text not null default 'pending'
                check (status in ('pending', 'processing', 'paid', 'failed')),
  method      text,
  reference   text,
  paid_date   date,
  note        text,
  created_at  timestamptz not null default now()
);

create table if not exists public.subscription_plans (
  id          uuid primary key default gen_random_uuid(),
  code        text not null unique,
  name        text not null,
  description text,
  price_month numeric(12,2) not null default 0,
  price_year  numeric(12,2) not null default 0,
  currency    text not null default 'INR',
  features    text[] not null default '{}',
  active      boolean not null default true,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now()
);

create table if not exists public.subscriptions (
  id                   uuid primary key default gen_random_uuid(),
  owner_id             uuid not null references public.profiles(id) on delete cascade,
  plan_code            text not null references public.subscription_plans(code),
  status               text not null default 'incomplete'
                         check (status in ('incomplete', 'trialing', 'active', 'past_due', 'canceled', 'expired')),
  trial_ends_at        timestamptz,
  current_period_start timestamptz not null default now(),
  current_period_end   timestamptz,
  cancel_at_period_end boolean not null default false,
  provider             text,
  provider_ref         text,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

create unique index if not exists subscriptions_one_live_per_user
  on public.subscriptions (owner_id)
  where status in ('trialing', 'active', 'past_due');

create table if not exists public.blueprint_previews (
  id           uuid primary key default gen_random_uuid(),
  owner_id     uuid not null references public.profiles(id) on delete cascade,
  blueprint_id uuid not null references public.blueprints(id) on delete cascade,
  started_at   timestamptz not null default now(),
  expires_at   timestamptz not null,
  ended_at     timestamptz,
  unique (owner_id, blueprint_id)
);

-- ============================================================================
-- 2. INDEXES
-- ============================================================================

create index if not exists blueprints_status_idx    on public.blueprints (status);
create index if not exists blueprints_category_idx  on public.blueprints (category);
create index if not exists blueprints_owner_idx     on public.blueprints (owner_id);
create index if not exists creators_owner_idx       on public.creators (owner_id);
create index if not exists purchases_owner_idx      on public.purchases (owner_id);
create index if not exists purchases_creator_idx    on public.purchases (creator_id);
create index if not exists projects_owner_idx       on public.projects (owner_id);
create index if not exists enquiries_owner_idx      on public.enquiries (owner_id);
create index if not exists subscriptions_owner_idx  on public.subscriptions (owner_id);
create index if not exists previews_owner_idx       on public.blueprint_previews (owner_id);

create sequence if not exists public.invoice_number_seq start 1;

-- ============================================================================
-- 3. HELPERS
-- ============================================================================

-- The owning app user: a Supabase auth user, or the id the API layer sets with
-- `set local app.user_id = '<profile id>'` for sign-in handled elsewhere.
create or replace function public.app_user_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select p.id from public.profiles p where p.auth_user_id = auth.uid()),
    nullif(current_setting('app.user_id', true), '')::uuid
  );
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select p.role = 'admin' from public.profiles p where p.id = public.app_user_id()),
    false
  );
$$;

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- Create-or-read a profile for a sign-in handled outside Supabase Auth.
create or replace function public.ensure_profile(
  p_email text,
  p_full_name text default null,
  p_auth_user_id uuid default null
)
returns public.profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.profiles;
begin
  if p_email is null or length(trim(p_email)) = 0 then
    raise exception 'email_required';
  end if;

  select * into v_row from public.profiles where lower(email) = lower(p_email) limit 1;

  if v_row.id is null then
    insert into public.profiles (email, full_name, auth_user_id)
    values (lower(trim(p_email)), p_full_name, p_auth_user_id)
    returning * into v_row;
  elsif p_auth_user_id is not null and v_row.auth_user_id is null then
    update public.profiles set auth_user_id = p_auth_user_id, updated_at = now()
     where id = v_row.id
    returning * into v_row;
  end if;

  return v_row;
end;
$$;

-- ============================================================================
-- 4. ACCESS RULES (timed preview -> subscription)
-- ============================================================================

create or replace function public.has_active_subscription(p_user uuid default null)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
      from public.subscriptions s
     where s.owner_id = coalesce(p_user, public.app_user_id())
       and s.status in ('trialing', 'active')
       and (s.current_period_end is null or s.current_period_end > now())
  );
$$;

create or replace function public.blueprint_access(p_blueprint_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_user    uuid := public.app_user_id();
  v_bp      public.blueprints;
  v_preview public.blueprint_previews;
begin
  select * into v_bp from public.blueprints where id = p_blueprint_id;
  if v_bp.id is null then
    return jsonb_build_object('access', 'missing', 'can_view_full', false);
  end if;

  if v_bp.is_free or coalesce(v_bp.price, 0) = 0 then
    return jsonb_build_object('access', 'free', 'can_view_full', true);
  end if;

  if v_user is null then
    return jsonb_build_object('access', 'anonymous', 'can_view_full', false,
                              'preview_seconds', v_bp.preview_seconds);
  end if;

  if public.has_active_subscription(v_user) then
    return jsonb_build_object('access', 'subscriber', 'can_view_full', true);
  end if;

  if exists (select 1 from public.purchases p
              where p.owner_id = v_user
                and p.blueprint_id = p_blueprint_id
                and p.status = 'paid') then
    return jsonb_build_object('access', 'purchased', 'can_view_full', true);
  end if;

  select * into v_preview from public.blueprint_previews
   where owner_id = v_user and blueprint_id = p_blueprint_id;

  if v_preview.id is null then
    return jsonb_build_object('access', 'not_started', 'can_view_full', false,
                              'preview_seconds', v_bp.preview_seconds);
  end if;

  if v_preview.expires_at > now() and v_preview.ended_at is null then
    return jsonb_build_object('access', 'preview', 'can_view_full', true,
                              'expires_at', v_preview.expires_at);
  end if;

  return jsonb_build_object('access', 'expired', 'can_view_full', false,
                            'expired_at', v_preview.expires_at);
end;
$$;

-- Starts the one-time preview window for this user + blueprint.
create or replace function public.start_blueprint_preview(p_blueprint_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user    uuid := public.app_user_id();
  v_seconds integer;
  v_row     public.blueprint_previews;
begin
  if v_user is null then
    raise exception 'sign_in_required';
  end if;

  if public.has_active_subscription(v_user) then
    return jsonb_build_object('started', false, 'reason', 'subscriber');
  end if;

  select preview_seconds into v_seconds from public.blueprints where id = p_blueprint_id;
  if v_seconds is null then
    raise exception 'blueprint_not_found';
  end if;

  insert into public.blueprint_previews (owner_id, blueprint_id, started_at, expires_at)
  values (v_user, p_blueprint_id, now(), now() + make_interval(secs => v_seconds))
  on conflict (owner_id, blueprint_id) do nothing;

  select * into v_row from public.blueprint_previews
   where owner_id = v_user and blueprint_id = p_blueprint_id;

  return jsonb_build_object('started', true, 'started_at', v_row.started_at,
                            'expires_at', v_row.expires_at, 'seconds', v_seconds);
end;
$$;

create or replace function public.end_blueprint_preview(p_blueprint_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.blueprint_previews
     set ended_at = now()
   where owner_id = public.app_user_id()
     and blueprint_id = p_blueprint_id
     and ended_at is null;
end;
$$;

-- Returns the full rows only when access has been granted.
create or replace function public.get_blueprint_full(p_blueprint_id uuid)
returns public.blueprints
language plpgsql
security definer
set search_path = public
as $$
declare
  v_access jsonb;
  v_row    public.blueprints;
begin
  v_access := public.blueprint_access(p_blueprint_id);

  if not coalesce((v_access ->> 'can_view_full')::boolean, false) then
    raise exception 'access_denied:%', coalesce(v_access ->> 'access', 'unknown');
  end if;

  select * into v_row from public.blueprints where id = p_blueprint_id;
  return v_row;
end;
$$;

create or replace function public.expire_subscriptions()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
begin
  update public.subscriptions
     set status = 'expired', updated_at = now()
   where status in ('trialing', 'active', 'past_due')
     and current_period_end is not null
     and current_period_end < now();

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

-- ============================================================================
-- 5. TRIGGERS
-- ============================================================================

create or replace function public.set_invoice_number()
returns trigger
language plpgsql
as $$
begin
  if new.invoice_number is null then
    new.invoice_number := 'BP-' || to_char(now(), 'YYYY') || '-' ||
      lpad(nextval('public.invoice_number_seq')::text, 5, '0');
  end if;

  if new.status = 'paid' and new.purchased_at is null then
    new.purchased_at := now();
  end if;

  return new;
end;
$$;

create or replace function public.apply_paid_purchase()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_bp public.blueprints;
begin
  if new.status = 'paid' and (tg_op = 'INSERT' or old.status is distinct from 'paid') then
    update public.blueprints b
       set buyer_count = b.buyer_count + 1, updated_at = now()
     where b.id = new.blueprint_id;

    select * into v_bp from public.blueprints where id = new.blueprint_id;

    -- a paid blueprint immediately gets a project tracker for the buyer
    if v_bp.id is not null and not exists (
      select 1 from public.projects p
       where p.owner_id = new.owner_id and p.blueprint_id = new.blueprint_id
    ) then
      insert into public.projects
        (owner_id, blueprint_id, blueprint_title, blueprint_slug, category, status)
      values
        (new.owner_id, new.blueprint_id, v_bp.title, v_bp.slug, v_bp.category, 'planning');
    end if;
  end if;

  return new;
end;
$$;

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.email is null then
    return new;
  end if;

  insert into public.profiles (auth_user_id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data ->> 'full_name', new.email))
  on conflict (email) do update
    set auth_user_id = excluded.auth_user_id, updated_at = now();

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.touch_updated_at();

drop trigger if exists creators_updated_at on public.creators;
create trigger creators_updated_at before update on public.creators
  for each row execute function public.touch_updated_at();

drop trigger if exists blueprints_updated_at on public.blueprints;
create trigger blueprints_updated_at before update on public.blueprints
  for each row execute function public.touch_updated_at();

drop trigger if exists projects_updated_at on public.projects;
create trigger projects_updated_at before update on public.projects
  for each row execute function public.touch_updated_at();

drop trigger if exists payout_accounts_updated_at on public.payout_accounts;
create trigger payout_accounts_updated_at before update on public.payout_accounts
  for each row execute function public.touch_updated_at();

drop trigger if exists subscriptions_updated_at on public.subscriptions;
create trigger subscriptions_updated_at before update on public.subscriptions
  for each row execute function public.touch_updated_at();

drop trigger if exists purchases_invoice_number on public.purchases;
create trigger purchases_invoice_number before insert on public.purchases
  for each row execute function public.set_invoice_number();

drop trigger if exists purchases_paid on public.purchases;
create trigger purchases_paid after insert or update of status on public.purchases
  for each row execute function public.apply_paid_purchase();

-- ============================================================================
-- 6. ROW LEVEL SECURITY
-- ============================================================================

alter table public.profiles            enable row level security;
alter table public.categories          enable row level security;
alter table public.creators            enable row level security;
alter table public.blueprints          enable row level security;
alter table public.saved_blueprints    enable row level security;
alter table public.purchases           enable row level security;
alter table public.projects            enable row level security;
alter table public.enquiries           enable row level security;
alter table public.payout_accounts     enable row level security;
alter table public.payouts             enable row level security;
alter table public.subscription_plans  enable row level security;
alter table public.subscriptions       enable row level security;
alter table public.blueprint_previews  enable row level security;

-- profiles -------------------------------------------------------------------
drop policy if exists profiles_read on public.profiles;
create policy profiles_read on public.profiles for select
  using (id = public.app_user_id() or public.is_admin());

drop policy if exists profiles_update on public.profiles;
create policy profiles_update on public.profiles for update
  using (id = public.app_user_id() or public.is_admin())
  with check (id = public.app_user_id() or public.is_admin());

-- categories -----------------------------------------------------------------
drop policy if exists categories_read on public.categories;
create policy categories_read on public.categories for select using (true);

drop policy if exists categories_write on public.categories;
create policy categories_write on public.categories for all
  using (public.is_admin()) with check (public.is_admin());

-- creators -------------------------------------------------------------------
drop policy if exists creators_read on public.creators;
create policy creators_read on public.creators for select using (true);

drop policy if exists creators_insert on public.creators;
create policy creators_insert on public.creators for insert
  with check (owner_id = public.app_user_id());

drop policy if exists creators_update on public.creators;
create policy creators_update on public.creators for update
  using (owner_id = public.app_user_id() or public.is_admin())
  with check (owner_id = public.app_user_id() or public.is_admin());

drop policy if exists creators_delete on public.creators;
create policy creators_delete on public.creators for delete using (public.is_admin());

-- blueprints -----------------------------------------------------------------
drop policy if exists blueprints_read on public.blueprints;
create policy blueprints_read on public.blueprints for select
  using (status = 'published' or owner_id = public.app_user_id() or public.is_admin());

drop policy if exists blueprints_insert on public.blueprints;
create policy blueprints_insert on public.blueprints for insert
  with check (owner_id = public.app_user_id());

drop policy if exists blueprints_update on public.blueprints;
create policy blueprints_update on public.blueprints for update
  using (owner_id = public.app_user_id() or public.is_admin())
  with check (owner_id = public.app_user_id() or public.is_admin());

drop policy if exists blueprints_delete on public.blueprints;
create policy blueprints_delete on public.blueprints for delete
  using (owner_id = public.app_user_id() or public.is_admin());

-- saved_blueprints -----------------------------------------------------------
drop policy if exists saved_blueprints_owner on public.saved_blueprints;
create policy saved_blueprints_owner on public.saved_blueprints for all
  using (owner_id = public.app_user_id()) with check (owner_id = public.app_user_id());

-- purchases ------------------------------------------------------------------
drop policy if exists purchases_read on public.purchases;
create policy purchases_read on public.purchases for select
  using (owner_id = public.app_user_id()
         or public.is_admin()
         or creator_id in (select c.id from public.creators c where c.owner_id = public.app_user_id()));

drop policy if exists purchases_insert on public.purchases;
create policy purchases_insert on public.purchases for insert
  with check (owner_id = public.app_user_id());

drop policy if exists purchases_update on public.purchases;
create policy purchases_update on public.purchases for update
  using (public.is_admin()) with check (public.is_admin());

-- projects -------------------------------------------------------------------
drop policy if exists projects_owner on public.projects;
create policy projects_owner on public.projects for all
  using (owner_id = public.app_user_id() or public.is_admin())
  with check (owner_id = public.app_user_id() or public.is_admin());

-- enquiries ------------------------------------------------------------------
drop policy if exists enquiries_insert on public.enquiries;
create policy enquiries_insert on public.enquiries for insert with check (true);

drop policy if exists enquiries_read on public.enquiries;
create policy enquiries_read on public.enquiries for select
  using (owner_id = public.app_user_id()
         or public.is_admin()
         or creator_slug in (select c.slug from public.creators c where c.owner_id = public.app_user_id()));

drop policy if exists enquiries_update on public.enquiries;
create policy enquiries_update on public.enquiries for update
  using (public.is_admin()) with check (public.is_admin());

-- payout_accounts ------------------------------------------------------------
drop policy if exists payout_accounts_owner on public.payout_accounts;
create policy payout_accounts_owner on public.payout_accounts for all
  using (public.is_admin()
         or creator_id in (select c.id from public.creators c where c.owner_id = public.app_user_id()))
  with check (public.is_admin()
         or creator_id in (select c.id from public.creators c where c.owner_id = public.app_user_id()));

-- payouts --------------------------------------------------------------------
drop policy if exists payouts_read on public.payouts;
create policy payouts_read on public.payouts for select
  using (public.is_admin()
         or creator_id in (select c.id from public.creators c where c.owner_id = public.app_user_id()));

drop policy if exists payouts_write on public.payouts;
create policy payouts_write on public.payouts for all
  using (public.is_admin()) with check (public.is_admin());

-- subscription_plans ---------------------------------------------------------
drop policy if exists subscription_plans_read on public.subscription_plans;
create policy subscription_plans_read on public.subscription_plans for select using (true);

drop policy if exists subscription_plans_write on public.subscription_plans;
create policy subscription_plans_write on public.subscription_plans for all
  using (public.is_admin()) with check (public.is_admin());

-- subscriptions --------------------------------------------------------------
drop policy if exists subscriptions_read on public.subscriptions;
create policy subscriptions_read on public.subscriptions for select
  using (owner_id = public.app_user_id() or public.is_admin());

drop policy if exists subscriptions_write on public.subscriptions;
create policy subscriptions_write on public.subscriptions for all
  using (public.is_admin()) with check (public.is_admin());

-- blueprint_previews ---------------------------------------------------------
drop policy if exists previews_read on public.blueprint_previews;
create policy previews_read on public.blueprint_previews for select
  using (owner_id = public.app_user_id() or public.is_admin());

drop policy if exists previews_write on public.blueprint_previews;
create policy previews_write on public.blueprint_previews for all
  using (owner_id = public.app_user_id() or public.is_admin())
  with check (owner_id = public.app_user_id() or public.is_admin());

-- ============================================================================
-- 7. GRANTS
-- ============================================================================

grant usage on schema public to anon, authenticated;
grant select on public.categories, public.creators, public.subscription_plans to anon, authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant execute on function
  public.blueprint_access(uuid),
  public.start_blueprint_preview(uuid),
  public.end_blueprint_preview(uuid),
  public.get_blueprint_full(uuid),
  public.has_active_subscription(uuid),
  public.ensure_profile(text, text, uuid),
  public.app_user_id()
to anon, authenticated;

-- ============================================================================
-- 8. SEED — plans (edit prices before going live) and the launch categories
-- ============================================================================

insert into public.subscription_plans (code, name, description, price_month, price_year, features, sort_order)
values
  ('pro-monthly', 'BizPath Pro — Monthly', 'Every published blueprint, unlocked, for one month.',
    1499, 0,
    array['All blueprints unlocked', 'Full cost sheets & roadmaps', 'Unlimited project trackers', 'Creator Q&A'],
    1),
  ('pro-annual', 'BizPath Pro — Annual', 'Everything in Pro, billed yearly at a two-month discount.',
    0, 14990,
    array['All blueprints unlocked', 'Full cost sheets & roadmaps', 'Unlimited project trackers', 'Priority creator consultations'],
    2)
on conflict (code) do nothing;

insert into public.categories (name, slug, icon, sort_order)
values
  ('Food & Beverage',        'food-beverage',          'UtensilsCrossed', 1),
  ('Fitness & Wellness',     'fitness-wellness',       'Dumbbell',        2),
  ('Retail',                 'retail',                 'ShoppingBag',     3),
  ('Beauty & Personal Care', 'beauty-personal-care',   'Scissors',        4),
  ('Education',              'education',              'GraduationCap',   5),
  ('Services',               'services',               'Wrench',          6),
  ('Logistics',              'logistics',              'Truck',           7),
  ('Technology',             'technology',             'Laptop',          8)
on conflict (slug) do nothing;

-- Optional: schedule expiry every hour (needs the pg_cron extension).
-- select cron.schedule('bizpath-expire-subscriptions', '0 * * * *',
--   $$ select public.expire_subscriptions(); $$);