-- Profiles table (display names for users)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  display_name text not null,
  created_at timestamptz default now() not null
);

alter table public.profiles enable row level security;

create policy "Users can read all profiles"
  on public.profiles for select
  using (auth.uid() is not null);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users can insert their own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Auto-create a profile when a new user signs up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, split_part(new.email, '@', 1));
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Backfill profiles for any users created before this migration
insert into public.profiles (id, display_name)
select id, split_part(email, '@', 1) from auth.users
on conflict (id) do nothing;

-- Inbox items table
create table public.inbox_items (
  id uuid default gen_random_uuid() primary key,
  content text not null,
  url text,
  added_by uuid references public.profiles(id) on delete cascade not null default auth.uid(),
  status text not null default 'unsorted' check (status in ('unsorted', 'tagged', 'promoted')),
  created_at timestamptz default now() not null
);

alter table public.inbox_items enable row level security;

create policy "Authenticated users can read all inbox items"
  on public.inbox_items for select
  using (auth.uid() is not null);

create policy "Authenticated users can insert inbox items"
  on public.inbox_items for insert
  with check (auth.uid() is not null);

create policy "Authenticated users can update inbox items"
  on public.inbox_items for update
  using (auth.uid() is not null);

create policy "Authenticated users can delete inbox items"
  on public.inbox_items for delete
  using (auth.uid() is not null);

-- Enable real-time for inbox_items
alter publication supabase_realtime add table public.inbox_items;
