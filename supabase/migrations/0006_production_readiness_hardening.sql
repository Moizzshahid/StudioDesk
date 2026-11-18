-- Reconstructed production hardening migration.
-- This is the exact migration already applied to the linked production database
-- as version 20261118155158. Kept here so fresh installs can reproduce production.
-- Production database migration history is not modified by this file.

create or replace function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;
revoke all on function private.set_updated_at() from public, anon, authenticated;

do $$
declare
  target_table text;
begin
  foreach target_table in array array['workspaces','clients','projects','tasks','memories','project_records'] loop
    execute format('drop trigger if exists set_updated_at on public.%I', target_table);
    execute format('create trigger set_updated_at before update on public.%I for each row execute function private.set_updated_at()', target_table);
  end loop;
end;
$$;

create index if not exists project_records_created_by_idx
  on public.project_records(created_by);
create index if not exists project_attachments_uploaded_by_idx
  on public.project_attachments(uploaded_by);

drop index if exists public.activity_workspace_created_idx;
create index if not exists activity_events_workspace_created_idx
  on public.activity_events(workspace_id, created_at desc);

drop policy if exists "Workspace members read project documents" on storage.objects;
create policy "Workspace members read project documents"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'studiodesk-files'
    and exists (
      select 1 from public.workspace_members wm
      join public.projects p on p.workspace_id = wm.workspace_id
      where wm.user_id = (select auth.uid())
        and wm.workspace_id::text = (storage.foldername(name))[1]
        and p.id::text = (storage.foldername(name))[2]
    )
  );

drop policy if exists "Workspace members upload project documents" on storage.objects;
create policy "Workspace members upload project documents"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'studiodesk-files'
    and exists (
      select 1 from public.workspace_members wm
      join public.projects p on p.workspace_id = wm.workspace_id
      where wm.user_id = (select auth.uid())
        and wm.workspace_id::text = (storage.foldername(name))[1]
        and p.id::text = (storage.foldername(name))[2]
    )
  );

drop policy if exists "Workspace members delete project documents" on storage.objects;
create policy "Workspace members delete project documents"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'studiodesk-files'
    and exists (
      select 1 from public.workspace_members wm
      join public.projects p on p.workspace_id = wm.workspace_id
      where wm.user_id = (select auth.uid())
        and wm.workspace_id::text = (storage.foldername(name))[1]
        and p.id::text = (storage.foldername(name))[2]
    )
  );

update storage.buckets
set allowed_mime_types = array[
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain', 'text/csv', 'image/jpeg', 'image/png', 'image/webp', 'application/zip'
]
where id = 'studiodesk-files';
