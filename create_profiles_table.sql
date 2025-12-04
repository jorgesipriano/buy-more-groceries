-- Create a table for public user profiles
create table public.profiles (
  id uuid references auth.users not null primary key,
  full_name text,
  phone text,
  house text,
  room text,
  approved boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Set up Row Level Security (RLS)
alter table public.profiles enable row level security;

-- Allow users to view their own profile
create policy "Users can view own profile" on public.profiles
  for select using (auth.uid() = id);

-- Allow users to insert their own profile
create policy "Users can insert own profile" on public.profiles
  for insert with check (auth.uid() = id);

-- Allow users to update their own profile
create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);

-- Allow admins to view all profiles
create policy "Admins can view all profiles" on public.profiles
  for select using (
    exists (
      select 1 from public.user_roles
      where user_id = auth.uid() and role = 'admin'
    )
  );

-- Allow admins to update all profiles (to approve users)
create policy "Admins can update all profiles" on public.profiles
  for update using (
    exists (
      select 1 from public.user_roles
      where user_id = auth.uid() and role = 'admin'
    )
  );
