-- Dashboard personale · schema Supabase (Postgres)
-- Single-user-per-row model with row level security; every table is scoped by auth.uid().

create extension if not exists "pgcrypto";

-- events -------------------------------------------------------------------
create type event_cat as enum ('lavoro', 'scuola', 'personale');

create table public.events (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  date        date not null,
  time        time not null default '09:00',
  title       text not null check (char_length(title) between 1 and 200),
  note        text,
  cat         event_cat not null default 'personale',
  created_at  timestamptz not null default now()
);
create index events_user_date_idx on public.events (user_id, date);

-- reminders ----------------------------------------------------------------
create table public.reminders (
  id        uuid primary key default gen_random_uuid(),
  user_id   uuid not null references auth.users (id) on delete cascade,
  text      text not null check (char_length(text) between 1 and 300),
  due       date,
  done      boolean not null default false,
  done_at   timestamptz,
  created_at timestamptz not null default now()
);
create index reminders_user_open_idx on public.reminders (user_id, done, due);

-- notes --------------------------------------------------------------------
create table public.notes (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  text       text not null,
  created_at timestamptz not null default now()
);
create index notes_user_created_idx on public.notes (user_id, created_at desc);

-- transactions -------------------------------------------------------------
create table public.transactions (
  id      uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  date    date not null,
  descr   text not null,
  amount  numeric(12,2) not null,          -- positive = income, negative = expense
  cat     text default '',
  pending boolean not null default false,  -- saldo sospeso: non conteggiato nel saldo finché non saldato
  created_at timestamptz not null default now()
);
create index transactions_user_date_idx on public.transactions (user_id, date desc);
create index transactions_user_pending_idx on public.transactions (user_id, pending) where pending;

-- routine ------------------------------------------------------------------
create table public.habits (
  id       uuid primary key default gen_random_uuid(),
  user_id  uuid not null references auth.users (id) on delete cascade,
  text     text not null,
  position smallint not null default 0,
  archived boolean not null default false
);

-- one row per completed day: the streak is a window query, not a stored value
create table public.habit_log (
  habit_id uuid not null references public.habits (id) on delete cascade,
  user_id  uuid not null references auth.users (id) on delete cascade,
  day      date not null,
  primary key (habit_id, day)
);
create index habit_log_user_day_idx on public.habit_log (user_id, day desc);

-- gym ----------------------------------------------------------------------
create table public.exercises (
  id       uuid primary key default gen_random_uuid(),
  user_id  uuid not null references auth.users (id) on delete cascade,
  text     text not null,
  detail   text not null default '3×12',   -- series × reps, display string
  position smallint not null default 0,
  archived boolean not null default false
);

create table public.exercise_log (
  exercise_id uuid not null references public.exercises (id) on delete cascade,
  user_id     uuid not null references auth.users (id) on delete cascade,
  day         date not null,
  primary key (exercise_id, day)
);

create type gym_day_state as enum ('done', 'rest');

create table public.gym_days (
  user_id uuid not null references auth.users (id) on delete cascade,
  day     date not null,
  state   gym_day_state not null,
  primary key (user_id, day)
);

-- settings (one row per user) ---------------------------------------------
create table public.settings (
  user_id   uuid primary key references auth.users (id) on delete cascade,
  goal      numeric(12,2) not null default 10000,
  goal_date date not null default '2027-01-30',
  location  text not null default 'Noale · VE',
  push_subscription jsonb                   -- Web Push endpoint for reminders
);

-- row level security -------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array['events','reminders','notes','transactions','habits','habit_log','exercises','exercise_log','gym_days','settings']
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format($f$create policy "own rows" on public.%I
      for all using (user_id = auth.uid()) with check (user_id = auth.uid())$f$, t);
  end loop;
end $$;

-- helper: current streak for one habit ------------------------------------
create or replace function public.habit_streak(p_habit uuid, p_today date)
returns integer language sql stable as $$
  with days as (
    select day from public.habit_log
    where habit_id = p_habit and day <= p_today
    order by day desc
  ), numbered as (
    select day, row_number() over (order by day desc) as rn from days
  )
  select coalesce(count(*), 0)::int
  from numbered
  where day = p_today - (rn - 1)
     or day = p_today - rn;   -- tolerates "not yet done today"
$$;
