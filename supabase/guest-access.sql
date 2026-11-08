-- Apply AFTER schema.sql. Safe to rerun. No existing progress is removed.
begin;
create table if not exists public.chore_guests (
 guest_id uuid primary key references auth.users(id) on delete cascade,
 owner_id uuid not null references public.chore_accounts(user_id) on delete cascade,
 guest_email text not null,
 created_at timestamptz not null default now(),
 check (guest_id <> owner_id)
);
alter table public.chore_guests enable row level security;
revoke all on public.chore_guests from public, anon, authenticated;
grant select on public.chore_guests to authenticated;
drop policy if exists "View own guest membership" on public.chore_guests;
create policy "View own guest membership" on public.chore_guests for select to authenticated
 using (guest_id = (select auth.uid()) or owner_id = (select auth.uid()));

create or replace function public.is_chore_guest() returns boolean
language sql stable security definer set search_path = '' as $$
 select exists(select 1 from public.chore_guests where guest_id = (select auth.uid()));
$$;
revoke all on function public.is_chore_guest() from public, anon;
grant execute on function public.is_chore_guest() to authenticated;

-- Guests may select the owner's document, but no write policy matches them.
drop policy if exists "Read own chores" on public.chore_accounts;
drop policy if exists "Create own chores" on public.chore_accounts;
drop policy if exists "Update own chores" on public.chore_accounts;
drop policy if exists "Guest read chores" on public.chore_accounts;
create policy "Read own chores" on public.chore_accounts for select to authenticated
 using (user_id = (select auth.uid()) and not (select public.is_chore_guest()));
create policy "Guest read chores" on public.chore_accounts for select to authenticated
 using (exists(select 1 from public.chore_guests g where g.guest_id = (select auth.uid()) and g.owner_id = user_id));
create policy "Create own chores" on public.chore_accounts for insert to authenticated
 with check (user_id = (select auth.uid()) and not (select public.is_chore_guest()));
create policy "Update own chores" on public.chore_accounts for update to authenticated
 using (user_id = (select auth.uid()) and not (select public.is_chore_guest()))
 with check (user_id = (select auth.uid()) and not (select public.is_chore_guest()));

create or replace function public.grant_chore_guest(email text) returns void
language plpgsql security definer set search_path = '' as $$
declare target uuid; caller uuid := auth.uid();
begin
 -- Serialize grant/revoke operations to prevent cyclic memberships under concurrency.
 perform pg_advisory_xact_lock(8723441);
 if caller is null or not exists(select 1 from public.chore_accounts where user_id=caller)
 or exists(select 1 from public.chore_guests where guest_id=caller) then
  raise exception 'Only a parent with a chore account can grant guest access';
 end if;
 select id into target from auth.users where lower(auth.users.email)=lower(trim(grant_chore_guest.email)) and email_confirmed_at is not null
 and (raw_user_meta_data->>'account_type'='guest' or lower(auth.users.email)='family@teddy-chores.example');
 if target is null then raise exception 'Ask your guest to choose Create guest account and confirm their email first'; end if;
 if target=caller then raise exception 'Use a separate account for your guest'; end if;
 if exists(select 1 from public.chore_guests where guest_id=target and owner_id<>caller)
 or exists(select 1 from public.chore_guests where owner_id=target) then
  raise exception 'This account is already connected to another family';
 end if;
 insert into public.chore_guests(guest_id,owner_id,guest_email) values(target,caller,lower(trim(email)))
 on conflict (guest_id) do nothing;
end;
$$;
create or replace function public.revoke_chore_guest(guest uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
 perform pg_advisory_xact_lock(8723441);
 delete from public.chore_guests where guest_id=guest and owner_id=(select auth.uid());
end;
$$;
revoke all on function public.grant_chore_guest(text), public.revoke_chore_guest(uuid) from public, anon;
grant execute on function public.grant_chore_guest(text), public.revoke_chore_guest(uuid) to authenticated;
commit;
