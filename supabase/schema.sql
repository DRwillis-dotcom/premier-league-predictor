-- Premier League Predictor schema
-- Run this in the Supabase SQL Editor

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text unique not null,
  display_name text,
  created_at timestamptz not null default now(),
  constraint username_length check (char_length(username) >= 3)
);

create table if not exists public.fixtures (
  id bigint primary key,
  season int not null,
  matchday int,
  home_team text not null,
  away_team text not null,
  home_team_crest text,
  away_team_crest text,
  kickoff timestamptz not null,
  status text not null default 'SCHEDULED',
  home_score int,
  away_score int,
  updated_at timestamptz not null default now()
);

create index if not exists fixtures_season_matchday_idx on public.fixtures (season, matchday);
create index if not exists fixtures_kickoff_idx on public.fixtures (kickoff);

create table if not exists public.predictions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  fixture_id bigint not null references public.fixtures (id) on delete cascade,
  home_score int not null check (home_score >= 0 and home_score <= 20),
  away_score int not null check (away_score >= 0 and away_score <= 20),
  points int,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, fixture_id)
);

create index if not exists predictions_user_idx on public.predictions (user_id);
create index if not exists predictions_fixture_idx on public.predictions (fixture_id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, username, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- League table
create or replace function public.get_league_table(p_season int)
returns table (
  user_id uuid,
  username text,
  display_name text,
  total_points bigint,
  exact_scores bigint,
  correct_results bigint,
  predictions_scored bigint
)
language sql
stable
security definer
set search_path = public
as $$
  select
    pr.id as user_id,
    pr.username,
    pr.display_name,
    coalesce(sum(p.points), 0)::bigint as total_points,
    count(*) filter (where p.points = 3)::bigint as exact_scores,
    count(*) filter (where p.points = 1)::bigint as correct_results,
    count(*) filter (where p.points is not null)::bigint as predictions_scored
  from public.profiles pr
  inner join public.predictions p on p.user_id = pr.id
  inner join public.fixtures f on f.id = p.fixture_id and f.season = p_season
  group by pr.id, pr.username, pr.display_name
  order by total_points desc, exact_scores desc, correct_results desc, pr.username asc;
$$;

-- RLS
alter table public.profiles enable row level security;
alter table public.fixtures enable row level security;
alter table public.predictions enable row level security;

create policy "Profiles are viewable by everyone"
  on public.profiles for select using (true);

create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);

create policy "Fixtures are viewable by everyone"
  on public.fixtures for select using (true);

create policy "Predictions are viewable by everyone"
  on public.predictions for select using (true);

create policy "Users can insert own predictions"
  on public.predictions for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.fixtures f
      where f.id = fixture_id
        and f.status = 'SCHEDULED'
        and f.kickoff > now()
    )
  );

create policy "Users can update own predictions before kickoff"
  on public.predictions for update
  using (
    auth.uid() = user_id
    and exists (
      select 1 from public.fixtures f
      where f.id = fixture_id
        and f.status = 'SCHEDULED'
        and f.kickoff > now()
    )
  );

-- Resolve username -> email for login (Supabase Auth still requires email)
create or replace function public.get_email_by_username(p_username text)
returns text
language sql
stable
security definer
set search_path = public, auth
as $$
  select u.email
  from public.profiles p
  join auth.users u on u.id = p.id
  where p.username = lower(trim(p_username))
  limit 1;
$$;

grant usage on schema public to anon, authenticated;
grant select on public.profiles to anon, authenticated;
grant select on public.fixtures to anon, authenticated;
grant select on public.predictions to anon, authenticated;
grant insert, update on public.profiles to authenticated;
grant insert, update on public.predictions to authenticated;
grant execute on function public.get_league_table(int) to anon, authenticated;
grant execute on function public.get_email_by_username(text) to anon, authenticated;
