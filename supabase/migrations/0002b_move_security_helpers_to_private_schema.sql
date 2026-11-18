-- Keep SECURITY DEFINER helpers outside the exposed public API schema.
create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated;

create or replace function private.is_workspace_member(target_workspace uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.workspace_members wm
    where wm.workspace_id = target_workspace
      and wm.user_id = (select auth.uid())
  );
$$;
revoke all on function private.is_workspace_member(uuid) from public, anon;
grant execute on function private.is_workspace_member(uuid) to authenticated;

create or replace function private.create_workspace_for_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  new_workspace_id uuid;
  workspace_label text;
begin
  workspace_label := coalesce(nullif(new.raw_user_meta_data->>'workspace_name', ''), 'My Studio');
  insert into public.workspaces(name)
  values (workspace_label)
  returning id into new_workspace_id;

  insert into public.workspace_members(workspace_id, user_id, role)
  values (new_workspace_id, new.id, 'owner');

  return new;
end;
$$;
revoke all on function private.create_workspace_for_new_user() from public, anon, authenticated;

drop trigger if exists on_auth_user_created_studiodesk on auth.users;
create trigger on_auth_user_created_studiodesk
after insert on auth.users
for each row execute procedure private.create_workspace_for_new_user();

drop policy if exists "Members can view their workspaces" on public.workspaces;
create policy "Members can view their workspaces" on public.workspaces
for select to authenticated using (private.is_workspace_member(id));

drop policy if exists "Members can view workspace membership" on public.workspace_members;
create policy "Members can view workspace membership" on public.workspace_members
for select to authenticated using (private.is_workspace_member(workspace_id));

drop policy if exists "Members manage workspace clients" on public.clients;
create policy "Members manage workspace clients" on public.clients
for all to authenticated
using (private.is_workspace_member(workspace_id))
with check (private.is_workspace_member(workspace_id));

drop policy if exists "Members manage workspace projects" on public.projects;
create policy "Members manage workspace projects" on public.projects
for all to authenticated
using (private.is_workspace_member(workspace_id))
with check (
  private.is_workspace_member(workspace_id)
  and (client_id is null or exists (
    select 1 from public.clients c
    where c.id = client_id and c.workspace_id = projects.workspace_id
  ))
);

drop policy if exists "Members manage workspace tasks" on public.tasks;
create policy "Members manage workspace tasks" on public.tasks
for all to authenticated
using (private.is_workspace_member(workspace_id))
with check (
  private.is_workspace_member(workspace_id)
  and (project_id is null or exists (
    select 1 from public.projects p
    where p.id = project_id and p.workspace_id = tasks.workspace_id
  ))
);

drop policy if exists "Members manage workspace memories" on public.memories;
create policy "Members manage workspace memories" on public.memories
for all to authenticated
using (private.is_workspace_member(workspace_id))
with check (
  private.is_workspace_member(workspace_id)
  and (project_id is null or exists (
    select 1 from public.projects p
    where p.id = project_id and p.workspace_id = memories.workspace_id
  ))
  and (client_id is null or exists (
    select 1 from public.clients c
    where c.id = client_id and c.workspace_id = memories.workspace_id
  ))
);

drop policy if exists "Members view workspace activity" on public.activity_events;
create policy "Members view workspace activity" on public.activity_events
for select to authenticated using (private.is_workspace_member(workspace_id));

drop function if exists public.is_workspace_member(uuid);
drop function if exists public.create_workspace_for_new_user();
