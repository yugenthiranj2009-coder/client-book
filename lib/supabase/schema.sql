create table if not exists profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  stripe_customer_id text,
  subscription_status text default 'free',
  created_at timestamptz default now()
);

create table if not exists clients (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  name text not null,
  problem text not null,
  appt_date date not null,
  email text not null,
  reminder_sent_for date,
  created_at timestamptz default now()
);

alter table profiles enable row level security;
alter table clients enable row level security;

create policy "Users can view own profile" on profiles
  for select using (auth.uid() = id);

create policy "Users can update own profile" on profiles
  for update using (auth.uid() = id);

create policy "Users can view own clients" on clients
  for select using (auth.uid() = user_id);

create policy "Users can insert own clients" on clients
  for insert with check (auth.uid() = user_id);

create policy "Users can update own clients" on clients
  for update using (auth.uid() = user_id);

create policy "Users can delete own clients" on clients
  for delete using (auth.uid() = user_id);

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
