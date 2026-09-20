-- A executer une seule fois sur une base deja installee.

drop policy if exists "notifications_agent_insert" on notifications;

create policy "notifications_agent_insert" on notifications for insert
  with check (
    exists (
      select 1 from users u
      where u.id = auth.uid()
        and u.role in ('agent_embassy', 'agent_anab')
    )
  );