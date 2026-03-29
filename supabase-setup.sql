-- Run this in your Supabase SQL Editor (Dashboard > SQL Editor > New query)

-- Tasks table
create table if not exists tasks (
  id text primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  description text,
  date text not null,
  start_time text not null,
  end_time text not null,
  completed boolean default false,
  priority text default 'medium' check (priority in ('low', 'medium', 'high')),
  notified boolean default false,
  created_at bigint not null,
  updated_at timestamptz default now()
);

-- Index for fast queries by user and date
create index if not exists idx_tasks_user_date on tasks(user_id, date);

-- Enable Row Level Security
alter table tasks enable row level security;

-- RLS policies: users can only access their own tasks
create policy "Users can read own tasks" on tasks
  for select using (auth.uid() = user_id);

create policy "Users can insert own tasks" on tasks
  for insert with check (auth.uid() = user_id);

create policy "Users can update own tasks" on tasks
  for update using (auth.uid() = user_id);

create policy "Users can delete own tasks" on tasks
  for delete using (auth.uid() = user_id);
