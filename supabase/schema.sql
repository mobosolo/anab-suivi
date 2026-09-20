-- ============================================================
-- Suivi ANAB — schéma de base de données (V1 : renouvellement)
-- ============================================================

create extension if not exists "pgcrypto";

-- ---------- Tables de référence ----------

create table countries (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  iso_code text not null,
  dial_code text not null
);

create table establishments (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  country_id uuid references countries(id)
);

create table academic_years (
  id uuid primary key default gen_random_uuid(),
  label text not null unique -- ex: "2026/2027"
);

create table embassies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  city text not null,
  country_id uuid references countries(id)
);

-- ---------- Utilisateurs ----------
-- Profil applicatif lié à auth.users (Supabase Auth gère mot de passe / session)

create table users (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('student', 'agent_embassy', 'agent_anab')),
  email text unique not null,
  phone_code text,
  phone_number text,
  full_name text not null,
  embassy_id uuid references embassies(id), -- utile pour agent_embassy uniquement
  created_at timestamptz default now()
);

-- Cree automatiquement le profil etudiant apres une inscription Auth.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.users (id, role, email, phone_code, phone_number, full_name)
  values (
    new.id,
    'student',
    new.email,
    new.raw_user_meta_data ->> 'phone_code',
    new.raw_user_meta_data ->> 'phone_number',
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ---------- Dossiers ----------

create table dossiers (
  id uuid primary key default gen_random_uuid(),
  tracking_number text unique not null,
  student_id uuid references users(id) not null,
  type text not null check (type in ('renouvellement', 'nouvelle_demande', 'transfert', 'activation')),
  establishment_id uuid references establishments(id),
  academic_year_id uuid references academic_years(id),
  embassy_id uuid references embassies(id),
  status text not null default 'cree'
    check (status in ('cree', 'recu_ambassade', 'transmis_anab', 'en_examen', 'decision_favorable', 'decision_defavorable')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table status_history (
  id uuid primary key default gen_random_uuid(),
  dossier_id uuid references dossiers(id) not null,
  status text not null,
  changed_by uuid references users(id),
  motif text,
  changed_at timestamptz default now()
);

create table notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) not null,
  dossier_id uuid references dossiers(id),
  message text not null,
  channel text default 'email',
  sent_at timestamptz default now(),
  read_at timestamptz
);

-- ============================================================
-- Row Level Security
-- ============================================================

alter table users enable row level security;
alter table dossiers enable row level security;
alter table status_history enable row level security;
alter table notifications enable row level security;

-- Users : chacun voit / modifie uniquement son propre profil
create policy "users_select_own" on users for select using (auth.uid() = id);
create policy "users_update_own" on users for update using (auth.uid() = id);
create policy "users_insert_own" on users for insert with check (auth.uid() = id);

-- Dossiers : un étudiant ne voit que ses propres dossiers
create policy "dossiers_student_select" on dossiers for select
  using (
    student_id = auth.uid()
    or exists (
      select 1 from users u
      where u.id = auth.uid()
        and u.role in ('agent_embassy', 'agent_anab')
    )
  );

create policy "dossiers_student_insert" on dossiers for insert
  with check (student_id = auth.uid());

-- Seuls les agents peuvent mettre à jour un statut (vérifié aussi côté application)
create policy "dossiers_agent_update" on dossiers for update
  using (
    exists (
      select 1 from users u
      where u.id = auth.uid()
        and u.role in ('agent_embassy', 'agent_anab')
    )
  );

-- Status history : visible par le propriétaire du dossier et les agents
create policy "status_history_select" on status_history for select
  using (
    exists (
      select 1 from dossiers d
      where d.id = status_history.dossier_id
        and (
          d.student_id = auth.uid()
          or exists (select 1 from users u where u.id = auth.uid() and u.role in ('agent_embassy','agent_anab'))
        )
    )
  );

create policy "status_history_agent_insert" on status_history for insert
  with check (
    exists (select 1 from users u where u.id = auth.uid() and u.role in ('agent_embassy','agent_anab'))
  );

-- Notifications : chacun voit les siennes
create policy "notifications_select_own" on notifications for select using (user_id = auth.uid());

create policy "notifications_agent_insert" on notifications for insert
  with check (
    exists (
      select 1 from users u
      where u.id = auth.uid()
        and u.role in ('agent_embassy', 'agent_anab')
    )
  );

-- Tables de référence : lecture publique (authentifié), pas d'écriture via l'app
alter table countries enable row level security;
alter table establishments enable row level security;
alter table academic_years enable row level security;
alter table embassies enable row level security;

create policy "ref_countries_read" on countries for select using (true);
create policy "ref_establishments_read" on establishments for select using (true);
create policy "ref_academic_years_read" on academic_years for select using (true);
create policy "ref_embassies_read" on embassies for select using (true);
