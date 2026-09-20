-- A executer une seule fois sur une base deja installee.
-- Les nouvelles inscriptions creeront automatiquement leur profil etudiant.

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

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();