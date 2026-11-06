-- Run once in Supabase → SQL editor. Creates the shared guestbook tables with safe public access:
-- anyone can read and add (with length limits); nobody can edit or delete through the public key.
create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  dispatch_id text not null check (char_length(dispatch_id) <= 80),
  name text not null check (char_length(name) between 1 and 40),
  body text not null check (char_length(body) between 1 and 1200),
  likes int not null default 0,
  created_at timestamptz not null default now()
);
create table if not exists public.notes (
  id uuid primary key default gen_random_uuid(),
  text text not null check (char_length(text) between 1 and 140),
  name text not null check (char_length(name) between 1 and 24),
  color text not null default '#ffe58a' check (color ~ '^#[0-9a-fA-F]{6}$'),
  created_at timestamptz not null default now()
);
alter table public.comments enable row level security;
alter table public.notes enable row level security;
create policy "read comments" on public.comments for select using (true);
create policy "add comments" on public.comments for insert with check (likes = 0);
create policy "read notes" on public.notes for select using (true);
create policy "add notes" on public.notes for insert with check (true);
-- Likes go through a function so visitors can only move the count by one.
create or replace function public.like_comment(cid uuid, delta int)
returns int language sql security definer set search_path = public as $$
  update public.comments set likes = greatest(0, likes + sign(delta)::int) where id = cid returning likes;
$$;
grant execute on function public.like_comment(uuid, int) to anon;
-- To remove spam later: Supabase → Table editor → comments / notes → delete the row.
