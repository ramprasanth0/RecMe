-- RecMe initial schema

-- Users table
create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text unique,
  spotify_id text unique,
  spotify_access_token text,
  spotify_refresh_token text,
  display_name text,
  avatar_url text,
  preferences jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

-- Chat sessions
create table if not exists chat_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  type text check (type in ('music', 'movie')),
  messages jsonb default '[]'::jsonb,
  created_at timestamptz default now()
);

-- Saved recommendations
create table if not exists recommendations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  type text check (type in ('music', 'movie')),
  item_data jsonb,
  saved_at timestamptz default now()
);

-- Indexes
create index if not exists idx_users_spotify_id on users(spotify_id);
create index if not exists idx_chat_sessions_user_id on chat_sessions(user_id);
create index if not exists idx_recommendations_user_id on recommendations(user_id);

-- Row Level Security
alter table users enable row level security;
alter table chat_sessions enable row level security;
alter table recommendations enable row level security;

-- Users: read/update own row only
create policy "Users can read own profile"
  on users for select
  using (id = auth.uid());

create policy "Users can update own profile"
  on users for update
  using (id = auth.uid());

-- Chat sessions: CRUD own sessions only
create policy "Users can read own chat sessions"
  on chat_sessions for select
  using (user_id = auth.uid());

create policy "Users can create own chat sessions"
  on chat_sessions for insert
  with check (user_id = auth.uid());

create policy "Users can update own chat sessions"
  on chat_sessions for update
  using (user_id = auth.uid());

create policy "Users can delete own chat sessions"
  on chat_sessions for delete
  using (user_id = auth.uid());

-- Recommendations: CRUD own recs only
create policy "Users can read own recommendations"
  on recommendations for select
  using (user_id = auth.uid());

create policy "Users can save recommendations"
  on recommendations for insert
  with check (user_id = auth.uid());

create policy "Users can delete own recommendations"
  on recommendations for delete
  using (user_id = auth.uid());
