create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users (id) on delete cascade,
  xp integer not null default 0,
  level integer not null default 1,
  streak integer not null default 0,
  gem_currency integer not null default 0,
  gender text,
  target_gender text,
  created_at timestamptz not null default now()
);

create table if not exists public.quest_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  node_id text not null,
  status text not null default 'locked',
  score integer not null default 0,
  updated_at timestamptz not null default now(),
  unique (user_id, node_id)
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_quest_progress_updated_at on public.quest_progress;
create trigger set_quest_progress_updated_at
  before insert or update on public.quest_progress
  for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.quest_progress enable row level security;

revoke all on public.profiles from public, anon, authenticated;
revoke all on public.quest_progress from public, anon, authenticated;

grant select, insert, update, delete on public.profiles to authenticated;
grant select, insert, update, delete on public.quest_progress to authenticated;

drop policy if exists "Users can read their own profile" on public.profiles;
create policy "Users can read their own profile"
  on public.profiles for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can insert their own profile" on public.profiles;
create policy "Users can insert their own profile"
  on public.profiles for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own profile" on public.profiles;
create policy "Users can delete their own profile"
  on public.profiles for delete
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can read their own quest progress" on public.quest_progress;
create policy "Users can read their own quest progress"
  on public.quest_progress for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can insert their own quest progress" on public.quest_progress;
create policy "Users can insert their own quest progress"
  on public.quest_progress for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their own quest progress" on public.quest_progress;
create policy "Users can update their own quest progress"
  on public.quest_progress for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own quest progress" on public.quest_progress;
create policy "Users can delete their own quest progress"
  on public.quest_progress for delete
  to authenticated
  using (auth.uid() = user_id);

create table if not exists public.player_progress (
  user_id uuid primary key references auth.users (id) on delete cascade,
  progress jsonb not null,
  updated_at timestamptz not null default now(),
  constraint player_progress_object check (jsonb_typeof(progress) = 'object'),
  constraint player_progress_size check (octet_length(progress::text) <= 32768)
);

create or replace function public.set_player_progress_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_player_progress_updated_at on public.player_progress;
create trigger set_player_progress_updated_at
  before insert or update on public.player_progress
  for each row execute function public.set_player_progress_updated_at();

alter table public.player_progress enable row level security;
revoke all on public.player_progress from public, anon, authenticated;
grant select, insert, update, delete on public.player_progress to authenticated;

drop policy if exists "Users can read their own progress" on public.player_progress;
create policy "Users can read their own progress"
  on public.player_progress for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can create their own progress" on public.player_progress;
create policy "Users can create their own progress"
  on public.player_progress for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update their own progress" on public.player_progress;
create policy "Users can update their own progress"
  on public.player_progress for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete their own progress" on public.player_progress;
create policy "Users can delete their own progress"
  on public.player_progress for delete
  to authenticated
  using ((select auth.uid()) = user_id);
