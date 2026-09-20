-- Donnees de test.
-- 1. Creez un compte avec une adresse e-mail reelle via /signup.
-- 2. Executez ce fichier dans Supabase SQL Editor.
-- 3. Connectez-vous avec ce compte pour voir les trois dossiers.

delete from status_history
where dossier_id in (
  select id from dossiers
  where tracking_number in ('ANAB-TEST-000001', 'ANAB-TEST-000002', 'ANAB-TEST-000003')
);

delete from dossiers
where tracking_number in ('ANAB-TEST-000001', 'ANAB-TEST-000002', 'ANAB-TEST-000003');

insert into dossiers (
  tracking_number,
  student_id,
  type,
  establishment_id,
  academic_year_id,
  embassy_id,
  status
)
select
  test_data.tracking_number,
  student.id,
  'renouvellement',
  establishment.id,
  academic_year.id,
  embassy.id,
  test_data.status
from (
  values
    ('ANAB-TEST-000001', 'cree', 'Université de Lomé', '2026/2027', 'Ambassade du Niger — Lomé'),
    ('ANAB-TEST-000002', 'transmis_anab', 'Université de Kara', '2026/2027', 'Ambassade du Niger — Lomé'),
    ('ANAB-TEST-000003', 'decision_defavorable', 'IAI Togo', '2025/2026', 'Ambassade du Niger — Lomé')
) as test_data(tracking_number, status, establishment_name, academic_year_label, embassy_name)
cross join (
  select id from users
  where role = 'student'
  order by created_at desc
  limit 1
) as student
join establishments establishment on establishment.name = test_data.establishment_name
join academic_years academic_year on academic_year.label = test_data.academic_year_label
join embassies embassy on embassy.name = test_data.embassy_name;

insert into status_history (dossier_id, status, changed_by, motif, changed_at)
select dossier.id, history.status, null::uuid, history.motif, now() - history.age
from dossiers dossier
join (
  values
    ('ANAB-TEST-000001', 'cree', null::text, interval '3 days'),
    ('ANAB-TEST-000002', 'cree', null::text, interval '12 days'),
    ('ANAB-TEST-000002', 'recu_ambassade', null::text, interval '9 days'),
    ('ANAB-TEST-000002', 'transmis_anab', null::text, interval '6 days'),
    ('ANAB-TEST-000003', 'cree', null::text, interval '20 days'),
    ('ANAB-TEST-000003', 'recu_ambassade', null::text, interval '17 days'),
    ('ANAB-TEST-000003', 'transmis_anab', null::text, interval '14 days'),
    ('ANAB-TEST-000003', 'en_examen', null::text, interval '10 days'),
    ('ANAB-TEST-000003', 'decision_defavorable', 'Dossier de test refuse', interval '2 days')
) as history(tracking_number, status, motif, age)
  on history.tracking_number = dossier.tracking_number;