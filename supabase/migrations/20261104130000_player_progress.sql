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
