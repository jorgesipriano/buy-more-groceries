-- Create profiles table for republica-style users
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  phone text not null,
  approved boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (phone)
);

alter table public.profiles enable row level security;

-- RLS policies for profiles
create policy "Users can view own profile"
  on public.profiles
  for select
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles
  for insert
  with check (auth.uid() = id);

create policy "Admins can view all profiles"
  on public.profiles
  for select
  using (has_role(auth.uid(), 'admin'));

create policy "Admins can update profiles"
  on public.profiles
  for update
  using (has_role(auth.uid(), 'admin'));

-- Trigger to auto-create profile when a new auth user is created
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, phone)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', 'Usuário'),
    coalesce(new.raw_user_meta_data->>'phone', '')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Tighten orders RLS so only approved users (or admins) can create orders
alter table public.orders enable row level security;

drop policy if exists "Qualquer pessoa pode criar pedidos" on public.orders;
drop policy if exists "Qualquer pessoa pode ver pedidos" on public.orders;

create policy "Qualquer pessoa pode ver pedidos"
  on public.orders
  for select
  using (true);

create policy "Apenas usuarios aprovados podem criar pedidos"
  on public.orders
  for insert
  with check (
    auth.role() = 'authenticated'
    and (
      exists (
        select 1 from public.profiles p
        where p.id = auth.uid()
          and p.approved = true
      )
      or has_role(auth.uid(), 'admin')
    )
  );