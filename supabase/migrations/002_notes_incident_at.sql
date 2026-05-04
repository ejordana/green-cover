-- Migració 002: notes internes i data/hora del sinistre
alter table claims add column if not exists notes text;
alter table claims add column if not exists incident_at timestamptz;
