-- Run once in the Supabase SQL editor. No service-role key is used by the app.
create table if not exists public.chore_accounts (
 user_id uuid primary key references auth.users(id) on delete cascade,
 data jsonb not null check (jsonb_typeof(data) = 'object' and data->>'version' = '1'),
 revision integer not null default 0 check (revision >= 0)
);
alter table public.chore_accounts enable row level security;
revoke all on public.chore_accounts from anon;
grant select, insert, update on public.chore_accounts to authenticated;
create policy "Read own chores" on public.chore_accounts for select to authenticated using ((select auth.uid()) = user_id);
create policy "Create own chores" on public.chore_accounts for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Update own chores" on public.chore_accounts for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
