-- GreenCover · Dades inicials de prova
-- Executa aquest fitxer DESPRÉS de schema.sql

-- Gestor
insert into managers (name, photo_url, phone, available) values
  ('Roger Jordana', 'https://picsum.photos/seed/manager/150/150', '+34 600 000 000', true);

-- Perits
insert into experts (name, specialty, zone, phone, email, rating, active_claims) values
  ('Carles Agrònom',  'Agronomia i Gespa',     'Catalunya Central',    '611 222 333', 'carles.perit@expertgolf.cat',   4.8, 2),
  ('Laura Mecànica',  'Maquinària Industrial', 'Barcelona / Maresme',  '622 333 444', 'laura.m@peritatges.cat',         4.9, 1),
  ('Jordi Civil',     'Resp. Civil i Danys',   'Tarragona / Lleida',   '633 444 555', 'jordi.civil@assegurances.cat',   4.5, 0);

-- Clients (camps de golf)
insert into clients (name, location, manager_name, email, phone, policy_number, status) values
  ('Real Club de Golf El Prat',        'Terrassa, Barcelona',                      'Joan Vila',   'j.vila@rcgelprat.com',      '937 28 10 00', 'GC-992283-26', 'Actiu'),
  ('PGA Catalunya Golf and Wellness',  'Caldes de Malavella, Girona',             'Marta Soler', 'm.soler@pgacatalunya.com',  '972 47 22 49', 'GC-881122-25', 'Actiu'),
  ('Golf Montanyà',                    'El Brull, Barcelona',                      'Pere Roura',  'p.roura@golfmontanya.com',  '938 84 01 70', 'GC-773344-24', 'Actiu'),
  ('Club de Golf Llavaneres',          'Sant Andreu de Llavaneres, Barcelona',    'Carla Bosch', 'c.bosch@golfllavaneres.com','937 92 60 50', 'GC-664455-25', 'Pendent');

-- Sinistres (associats al primer client)
insert into claims (number, type, status, description, created_at, updated_at, estimated_cost, photos, client_id)
select
  'GC-2026-001',
  'maquinària',
  'Informe rebut',
  'Avararia a la segadora principal del Green 14. Possible sobreescalfament del motor.',
  '2026-05-10 10:30:00+02',
  '2026-05-12 16:00:00+02',
  1200,
  array['https://picsum.photos/seed/mach1/800/600'],
  id
from clients where policy_number = 'GC-992283-26';

insert into claims (number, type, status, description, created_at, updated_at, photos, client_id)
select
  'GC-2026-002',
  'meteorològic',
  'Declarat',
  'Caiguda d''arbre sobre el camí del forat 5 a causa de la tempesta de la passada nit.',
  '2026-05-14 08:15:00+02',
  '2026-05-14 08:15:00+02',
  array['https://picsum.photos/seed/tree1/800/600'],
  id
from clients where policy_number = 'GC-992283-26';

-- Missatges del xat
insert into chat_messages (claim_id, sender, text, created_at)
select id, 'user',    'Hem tingut una avaria a la segadora.',                             '2026-05-10 10:30:00+02' from claims where number = 'GC-2026-001'
union all
select id, 'manager', 'D''acord, ja hem assignat un perit per revisar-la demà.',          '2026-05-10 11:45:00+02' from claims where number = 'GC-2026-001';
