-- REMISE A ZERO ANAB
-- A executer seul dans Supabase SQL Editor avant schema.sql puis seed.sql.
-- Cette operation supprime toutes les donnees des tables de l'application.
-- Elle ne supprime pas les autres utilisateurs Auth du projet.

begin;

drop table if exists notifications cascade;
drop table if exists status_history cascade;
drop table if exists dossiers cascade;
drop table if exists users cascade;
drop table if exists establishments cascade;
drop table if exists embassies cascade;
drop table if exists academic_years cascade;
drop table if exists countries cascade;

-- Supprime uniquement les trois comptes de demonstration fournis par le seed.
delete from auth.users
where id in (
  '10000000-0000-0000-0000-000000000001',
  '10000000-0000-0000-0000-000000000002',
  '10000000-0000-0000-0000-000000000003'
);

commit;
