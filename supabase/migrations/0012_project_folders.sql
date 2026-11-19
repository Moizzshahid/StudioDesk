-- Convert the company profile into the single folder/workspace concept.
-- A folder is the company/client home; projects can belong to one folder or remain independent.
begin;

-- Remove the throwaway company-linked sample project and its dependent records.
delete from public.project_records where project_id in (select id from public.projects where company_id is not null);
delete from public.tasks where project_id in (select id from public.projects where company_id is not null);
delete from public.project_attachments where project_id in (select id from public.projects where company_id is not null);
delete from public.projects where company_id is not null;

-- The existing company/folder demo content was test data, not production client context.
delete from public.company_records;
delete from public.company_attachments;
delete from public.companies;

-- Remove the nested-folder model. The company itself becomes the folder/workspace.
drop policy if exists "Workspace members manage company records" on public.company_records;
drop policy if exists "Workspace members manage company attachments" on public.company_attachments;
drop policy if exists "Workspace members manage company folders" on public.company_folders;
drop policy if exists "Workspace members manage companies" on public.companies;

alter table public.projects
  drop constraint if exists projects_folder_same_company,
  drop constraint if exists projects_company_same_workspace,
  drop constraint if exists projects_folder_requires_company;
alter table public.projects drop column if exists folder_id;
alter table public.projects rename column company_id to folder_id;

alter table public.company_records drop constraint if exists company_records_folder_same_company;
alter table public.company_records drop column if exists folder_id;
alter table public.company_records rename column company_id to folder_id;
alter table public.company_attachments drop constraint if exists company_attachments_folder_same_company;
alter table public.company_attachments drop constraint if exists company_attachments_storage_path_matches_company;
alter table public.company_attachments drop column if exists folder_id;
alter table public.company_attachments rename column company_id to folder_id;

drop table public.company_folders;
alter table public.companies rename to folders;
alter table public.company_records rename to folder_records;
alter table public.company_attachments rename to folder_attachments;

alter table public.projects
  add constraint projects_folder_same_workspace foreign key (workspace_id, folder_id)
    references public.folders(workspace_id, id) on delete set null (folder_id);
create index if not exists projects_workspace_folder_idx on public.projects(workspace_id, folder_id, created_at desc);
create index if not exists folders_workspace_name_idx on public.folders(workspace_id, name);

alter table public.memories add column folder_id uuid;
alter table public.memories
  add constraint memories_folder_same_workspace foreign key (workspace_id, folder_id)
    references public.folders(workspace_id, id) on delete set null (folder_id);
create index if not exists memories_workspace_folder_idx on public.memories(workspace_id, folder_id, updated_at desc);

-- Rename the old company-scoped policies and recreate them against the folder model.
create policy "Workspace members manage folders" on public.folders for all to authenticated
  using (private.is_workspace_member(workspace_id))
  with check (private.is_workspace_member(workspace_id));
create policy "Workspace members manage folder records" on public.folder_records for all to authenticated
  using (private.is_workspace_member(workspace_id))
  with check (private.is_workspace_member(workspace_id) and exists (
    select 1 from public.folders f where f.id = folder_records.folder_id and f.workspace_id = folder_records.workspace_id
  ));
create policy "Workspace members manage folder attachments" on public.folder_attachments for all to authenticated
  using (private.is_workspace_member(workspace_id))
  with check (
    private.is_workspace_member(workspace_id)
    and uploaded_by = (select auth.uid())
    and storage_path like workspace_id::text || '/' || folder_id::text || '/folder/%'
    and exists (select 1 from public.folders f where f.id = folder_attachments.folder_id and f.workspace_id = folder_attachments.workspace_id)
  );

-- Project and memory links must remain workspace-scoped.
drop policy if exists "Members manage workspace projects" on public.projects;
create policy "Members manage workspace projects" on public.projects for all to authenticated
  using (private.is_workspace_member(workspace_id))
  with check (
    private.is_workspace_member(workspace_id)
    and (client_id is null or exists (select 1 from public.clients c where c.id = projects.client_id and c.workspace_id = projects.workspace_id))
    and (folder_id is null or exists (select 1 from public.folders f where f.id = projects.folder_id and f.workspace_id = projects.workspace_id))
  );
drop policy if exists "Members manage workspace memories" on public.memories;
create policy "Members manage workspace memories" on public.memories for all to authenticated
  using (private.is_workspace_member(workspace_id))
  with check (
    private.is_workspace_member(workspace_id)
    and (project_id is null or exists (select 1 from public.projects p where p.id = memories.project_id and p.workspace_id = memories.workspace_id))
    and (client_id is null or exists (select 1 from public.clients c where c.id = memories.client_id and c.workspace_id = memories.workspace_id))
    and (folder_id is null or exists (select 1 from public.folders f where f.id = memories.folder_id and f.workspace_id = memories.workspace_id))
  );

grant select, insert, update, delete on public.folders, public.folder_records, public.folder_attachments to authenticated;

-- Private Storage paths: workspace_id/project_id/... or workspace_id/folder_id/folder/...
drop policy if exists "Workspace members read project documents" on storage.objects;
create policy "Workspace members read project documents" on storage.objects for select to authenticated
using (bucket_id = 'studiodesk-files' and (
  exists (select 1 from public.workspace_members wm join public.projects p on p.workspace_id = wm.workspace_id
    where wm.user_id = (select auth.uid()) and wm.workspace_id::text = (storage.foldername(storage.objects.name))[1]
      and p.id::text = (storage.foldername(storage.objects.name))[2])
  or exists (select 1 from public.workspace_members wm join public.folders f on f.workspace_id = wm.workspace_id
    where wm.user_id = (select auth.uid()) and wm.workspace_id::text = (storage.foldername(storage.objects.name))[1]
      and f.id::text = (storage.foldername(storage.objects.name))[2]
      and (storage.foldername(storage.objects.name))[3] = 'folder')
));
drop policy if exists "Workspace members upload project documents" on storage.objects;
create policy "Workspace members upload project documents" on storage.objects for insert to authenticated
with check (bucket_id = 'studiodesk-files' and (
  exists (select 1 from public.workspace_members wm join public.projects p on p.workspace_id = wm.workspace_id
    where wm.user_id = (select auth.uid()) and wm.workspace_id::text = (storage.foldername(storage.objects.name))[1]
      and p.id::text = (storage.foldername(storage.objects.name))[2])
  or exists (select 1 from public.workspace_members wm join public.folders f on f.workspace_id = wm.workspace_id
    where wm.user_id = (select auth.uid()) and wm.workspace_id::text = (storage.foldername(storage.objects.name))[1]
      and f.id::text = (storage.foldername(storage.objects.name))[2]
      and (storage.foldername(storage.objects.name))[3] = 'folder')
));

commit;
