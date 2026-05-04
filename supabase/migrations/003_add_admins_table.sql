-- Add admins table for application-level administrator users

create table if not exists admins (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  email       text unique,
  phone       text,
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);

grant select, insert, update, delete on admins to anon, authenticated;
