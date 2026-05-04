-- Link application users with Supabase auth.users

-- Add auth_id and email columns to managers
alter table if exists managers
add column if not exists auth_id uuid unique references auth.users(id) on delete cascade,
add column if not exists email text unique;

-- Add auth_id and email columns to clients
alter table if exists clients
add column if not exists auth_id uuid unique references auth.users(id) on delete cascade,
add column if not exists email text unique;

-- Add auth_id and email columns to experts
alter table if exists experts
add column if not exists auth_id uuid unique references auth.users(id) on delete cascade,
add column if not exists email text unique;

-- Add auth_id column to admins
alter table if exists admins
add column if not exists auth_id uuid unique references auth.users(id) on delete cascade;
