-- Allow predictions on TIMED fixtures (confirmed kickoff) until kickoff.
-- Run in Supabase SQL Editor if your project was created before this change.

drop policy if exists "Users can insert own predictions" on public.predictions;
create policy "Users can insert own predictions"
  on public.predictions for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.fixtures f
      where f.id = fixture_id
        and f.status in ('SCHEDULED', 'TIMED')
        and f.kickoff > now()
    )
  );

drop policy if exists "Users can update own predictions before kickoff" on public.predictions;
create policy "Users can update own predictions before kickoff"
  on public.predictions for update
  using (
    auth.uid() = user_id
    and exists (
      select 1 from public.fixtures f
      where f.id = fixture_id
        and f.status in ('SCHEDULED', 'TIMED')
        and f.kickoff > now()
    )
  );
