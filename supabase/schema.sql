-- GreenCover · Esquema de base de dades v1.0
-- Executa aquest fitxer a l'editor SQL de Supabase

-- Managers (gestors Green Cover)
create table if not exists managers (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  photo_url   text,
  phone       text,
  available   boolean not null default true,
  created_at  timestamptz not null default now()
);

-- Clients (camps de golf)
create table if not exists clients (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  location      text,
  manager_name  text,
  email         text,
  phone         text,
  policy_number text unique,
  status        text not null default 'Actiu',
  manager_id    uuid references managers(id),
  created_at    timestamptz not null default now(),
  constraint clients_status_check check (status in ('Actiu', 'Inactiu', 'Pendent'))
);

-- Perits externs
create table if not exists experts (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  specialty     text,
  zone          text,
  phone         text,
  email         text,
  rating        numeric(3,1) not null default 0,
  active_claims integer not null default 0,
  created_at    timestamptz not null default now()
);

-- Sinistres
create table if not exists claims (
  id                  uuid primary key default gen_random_uuid(),
  number              text unique,
  type                text not null,
  status              text not null default 'Declarat',
  description         text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  estimated_cost      numeric(10,2),
  location_lat        numeric,
  location_lng        numeric,
  photos              text[] not null default '{}',
  client_id           uuid references clients(id),
  assigned_expert_id  uuid references experts(id),
  assigned_manager_id uuid references managers(id),
  constraint claims_type_check check (
    type in ('RC', 'meteorològic', 'maquinària', 'accident personal', 'ciberincident', 'altres')
  ),
  constraint claims_status_check check (
    status in ('Declarat', 'Gestor assignat', 'Perit designat', 'Informe rebut', 'Aprovat', 'Pagat', 'Tancat')
  )
);

-- Missatges del xat per sinistre
create table if not exists chat_messages (
  id         uuid primary key default gen_random_uuid(),
  claim_id   uuid not null references claims(id) on delete cascade,
  sender     text not null,
  text       text not null,
  created_at timestamptz not null default now(),
  constraint chat_messages_sender_check check (sender in ('user', 'manager'))
);

-- Trigger: genera número de sinistre automàticament (GC-YYYY-NNN)
create or replace function set_claim_number()
returns trigger language plpgsql as $$
declare
  yr  text := to_char(now(), 'YYYY');
  seq int;
begin
  select coalesce(
    max(cast(split_part(number, '-', 3) as int)), 0
  ) + 1
  into seq
  from claims
  where number like 'GC-' || yr || '-%';

  new.number := 'GC-' || yr || '-' || lpad(seq::text, 3, '0');
  return new;
end;
$$;

create or replace trigger before_insert_claim_set_number
  before insert on claims
  for each row
  when (new.number is null or new.number = '')
  execute function set_claim_number();

-- Trigger: actualitza updated_at en cada canvi
create or replace function touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create or replace trigger claims_touch_updated_at
  before update on claims
  for each row
  execute function touch_updated_at();

-- Vista: clients amb recompte de sinistres actius
create or replace view clients_with_stats as
select
  c.*,
  count(cl.id) filter (where cl.status != 'Tancat') as active_claims_count
from clients c
left join claims cl on cl.client_id = c.id
group by c.id;

-- Permisos per a la clau anònima (prototip sense RLS)
grant select, insert, update, delete on managers, clients, experts, claims, chat_messages to anon, authenticated;
grant select on clients_with_stats to anon, authenticated;
