-- Seed complet de demonstration ANAB.
-- A executer apres schema.sql dans Supabase SQL Editor.
--
-- Comptes prets a utiliser :
--   etudiant.demo@anab-suivi.com  / Demo1234!
--   ambassade.demo@anab-suivi.com / Demo1234!
--   anab.demo@anab-suivi.com      / Demo1234!
--
-- Les comptes sont marques comme confirmes pour permettre la connexion
-- immediatement. Changez ces mots de passe apres un deploiement public.

-- ---------- Donnees de reference ----------

insert into countries (name, iso_code, dial_code)
select source.name, source.iso_code, source.dial_code
from (values
  ('Togo', 'TG', '+228'),
  ('Niger', 'NE', '+227'),
  ('France', 'FR', '+33'),
  ('Cote d''Ivoire', 'CI', '+225'),
  ('Senegal', 'SN', '+221'),
  ('Maroc', 'MA', '+212'),
  ('Benin', 'BJ', '+229'),
  ('Ghana', 'GH', '+233')
) as source(name, iso_code, dial_code)
where not exists (
  select 1 from countries existing where existing.iso_code = source.iso_code
);

insert into academic_years (label)
select source.label
from (values ('2024/2025'), ('2025/2026'), ('2026/2027')) as source(label)
where not exists (
  select 1 from academic_years existing where existing.label = source.label
);

insert into embassies (name, city, country_id)
select source.name, source.city, country.id
from (values
  ('Ambassade du Niger - Lome', 'Lome', 'TG'),
  ('Ambassade du Niger - Rabat', 'Rabat', 'MA'),
  ('Ambassade du Niger - Dakar', 'Dakar', 'SN'),
  ('Ambassade du Niger - Paris', 'Paris', 'FR')
) as source(name, city, iso_code)
join countries country on country.iso_code = source.iso_code
where not exists (
  select 1 from embassies existing where existing.name = source.name
);

insert into establishments (name, country_id)
select source.name, country.id
from (values
  ('Universite de Lome', 'TG'),
  ('Universite de Kara', 'TG'),
  ('IAI Togo', 'TG'),
  ('Universite Abdou Moumouni', 'NE'),
  ('Universite de Niamey', 'NE')
) as source(name, iso_code)
join countries country on country.iso_code = source.iso_code
where not exists (
  select 1 from establishments existing where existing.name = source.name
);

-- ---------- Comptes Auth de demonstration ----------
-- Supabase SQL Editor autorise l'insertion dans auth.users.

insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at
)
select
  source.id,
  '00000000-0000-0000-0000-000000000000'::uuid,
  'authenticated',
  'authenticated',
  source.email,
  crypt('Demo1234!', gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  jsonb_build_object('full_name', source.full_name),
  now(),
  now()
from (values
  ('10000000-0000-0000-0000-000000000001'::uuid, 'etudiant.demo@anab-suivi.com', 'Amina Etudiante'),
  ('10000000-0000-0000-0000-000000000002'::uuid, 'ambassade.demo@anab-suivi.com', 'Agent Ambassade Lome'),
  ('10000000-0000-0000-0000-000000000003'::uuid, 'anab.demo@anab-suivi.com', 'Agent ANAB Demo')
) as source(id, email, full_name)
where not exists (
  select 1 from auth.users existing where existing.id = source.id
);

insert into users (id, role, email, phone_code, phone_number, full_name, embassy_id)
select
  source.id,
  source.role,
  source.email,
  source.phone_code,
  source.phone_number,
  source.full_name,
  embassy.id
from (values
  ('10000000-0000-0000-0000-000000000001'::uuid, 'student', 'etudiant.demo@anab-suivi.com', '+227', '90123456', 'Amina Etudiante', null::text),
  ('10000000-0000-0000-0000-000000000002'::uuid, 'agent_embassy', 'ambassade.demo@anab-suivi.com', '+228', '91234567', 'Agent Ambassade Lome', 'Ambassade du Niger - Lome'),
  ('10000000-0000-0000-0000-000000000003'::uuid, 'agent_anab', 'anab.demo@anab-suivi.com', '+227', '92345678', 'Agent ANAB Demo', null::text)
) as source(id, role, email, phone_code, phone_number, full_name, embassy_name)
left join embassies embassy on embassy.name = source.embassy_name
where not exists (
  select 1 from users existing where existing.id = source.id
);

-- ---------- Dossiers couvrant tous les etats ----------

insert into dossiers (
  tracking_number, student_id, type, establishment_id,
  academic_year_id, embassy_id, status, created_at, updated_at
)
select
  source.tracking_number,
  student.id,
  source.type,
  establishment.id,
  academic_year.id,
  embassy.id,
  source.status,
  now() - source.age,
  now() - source.updated_age
from (values
  ('ANAB-DEMO-000001', 'renouvellement', 'Universite de Lome', '2026/2027', 'Ambassade du Niger - Lome', 'cree', interval '2 days', interval '2 days'),
  ('ANAB-DEMO-000002', 'renouvellement', 'Universite de Kara', '2026/2027', 'Ambassade du Niger - Lome', 'recu_ambassade', interval '8 days', interval '5 days'),
  ('ANAB-DEMO-000003', 'renouvellement', 'IAI Togo', '2026/2027', 'Ambassade du Niger - Lome', 'transmis_anab', interval '12 days', interval '4 days'),
  ('ANAB-DEMO-000004', 'renouvellement', 'Universite Abdou Moumouni', '2025/2026', 'Ambassade du Niger - Lome', 'en_examen', interval '18 days', interval '2 days'),
  ('ANAB-DEMO-000005', 'renouvellement', 'Universite de Niamey', '2025/2026', 'Ambassade du Niger - Lome', 'decision_favorable', interval '25 days', interval '1 day'),
  ('ANAB-DEMO-000006', 'renouvellement', 'Universite de Lome', '2024/2025', 'Ambassade du Niger - Lome', 'decision_defavorable', interval '30 days', interval '3 days')
) as source(tracking_number, type, establishment_name, academic_year_label, embassy_name, status, age, updated_age)
cross join (select id from users where email = 'etudiant.demo@anab-suivi.com') as student
join establishments establishment on establishment.name = source.establishment_name
join academic_years academic_year on academic_year.label = source.academic_year_label
join embassies embassy on embassy.name = source.embassy_name
where not exists (
  select 1 from dossiers existing where existing.tracking_number = source.tracking_number
);

-- ---------- Historique de progression ----------

insert into status_history (dossier_id, status, changed_by, motif, changed_at)
select dossier.id, history.status, history.changed_by, history.motif, now() - history.age
from dossiers dossier
join (
  values
    ('ANAB-DEMO-000001', 'cree', '10000000-0000-0000-0000-000000000001'::uuid, null::text, interval '2 days'),
    ('ANAB-DEMO-000002', 'cree', '10000000-0000-0000-0000-000000000001'::uuid, null::text, interval '8 days'),
    ('ANAB-DEMO-000002', 'recu_ambassade', '10000000-0000-0000-0000-000000000002'::uuid, null::text, interval '5 days'),
    ('ANAB-DEMO-000003', 'cree', '10000000-0000-0000-0000-000000000001'::uuid, null::text, interval '12 days'),
    ('ANAB-DEMO-000003', 'recu_ambassade', '10000000-0000-0000-0000-000000000002'::uuid, null::text, interval '9 days'),
    ('ANAB-DEMO-000003', 'transmis_anab', '10000000-0000-0000-0000-000000000002'::uuid, null::text, interval '4 days'),
    ('ANAB-DEMO-000004', 'cree', '10000000-0000-0000-0000-000000000001'::uuid, null::text, interval '18 days'),
    ('ANAB-DEMO-000004', 'recu_ambassade', '10000000-0000-0000-0000-000000000002'::uuid, null::text, interval '14 days'),
    ('ANAB-DEMO-000004', 'transmis_anab', '10000000-0000-0000-0000-000000000002'::uuid, null::text, interval '8 days'),
    ('ANAB-DEMO-000004', 'en_examen', '10000000-0000-0000-0000-000000000003'::uuid, null::text, interval '2 days'),
    ('ANAB-DEMO-000005', 'cree', '10000000-0000-0000-0000-000000000001'::uuid, null::text, interval '25 days'),
    ('ANAB-DEMO-000005', 'recu_ambassade', '10000000-0000-0000-0000-000000000002'::uuid, null::text, interval '21 days'),
    ('ANAB-DEMO-000005', 'transmis_anab', '10000000-0000-0000-0000-000000000002'::uuid, null::text, interval '14 days'),
    ('ANAB-DEMO-000005', 'en_examen', '10000000-0000-0000-0000-000000000003'::uuid, null::text, interval '7 days'),
    ('ANAB-DEMO-000005', 'decision_favorable', '10000000-0000-0000-0000-000000000003'::uuid, null::text, interval '1 day'),
    ('ANAB-DEMO-000006', 'cree', '10000000-0000-0000-0000-000000000001'::uuid, null::text, interval '30 days'),
    ('ANAB-DEMO-000006', 'recu_ambassade', '10000000-0000-0000-0000-000000000002'::uuid, null::text, interval '25 days'),
    ('ANAB-DEMO-000006', 'transmis_anab', '10000000-0000-0000-0000-000000000002'::uuid, null::text, interval '18 days'),
    ('ANAB-DEMO-000006', 'en_examen', '10000000-0000-0000-0000-000000000003'::uuid, null::text, interval '10 days'),
    ('ANAB-DEMO-000006', 'decision_defavorable', '10000000-0000-0000-0000-000000000003'::uuid, 'Pieces justificatives insuffisantes pour le renouvellement.', interval '3 days')
) as history(tracking_number, status, changed_by, motif, age)
on history.tracking_number = dossier.tracking_number
where not exists (
  select 1 from status_history existing
  where existing.dossier_id = dossier.id and existing.status = history.status
);

-- ---------- Notifications visibles dans le dashboard ----------

insert into notifications (user_id, dossier_id, message, channel, sent_at)
select
  student.id,
  dossier.id,
  notification.message,
  'email',
  now() - notification.age
from users student
join dossiers dossier on dossier.student_id = student.id
join (
  values
    ('ANAB-DEMO-000003', 'Votre dossier ANAB-DEMO-000003 a ete transmis a l''ANAB.', interval '4 days'),
    ('ANAB-DEMO-000004', 'Votre dossier ANAB-DEMO-000004 est en cours d''examen.', interval '2 days'),
    ('ANAB-DEMO-000005', 'La decision pour votre dossier ANAB-DEMO-000005 est favorable.', interval '1 day'),
    ('ANAB-DEMO-000006', 'La decision pour votre dossier ANAB-DEMO-000006 est defavorable : pieces justificatives insuffisantes.', interval '3 days')
) as notification(tracking_number, message, age)
  on notification.tracking_number = dossier.tracking_number
where student.email = 'etudiant.demo@anab-suivi.com'
  and not exists (
    select 1 from notifications existing
    where existing.dossier_id = dossier.id and existing.message = notification.message
  );
