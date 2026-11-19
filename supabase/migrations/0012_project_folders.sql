-- Replace company-specific grouping with workspace-wide project folders.
-- Existing projects remain intact; folder deletion unfiles projects rather than deleting them.
alter table public.projects
  drop constraint if exists projects_folder_same_company,
  drop constraint if exists projects_company_same_workspace,
  drop constraint if exists projects_folder_requires_company;
alter table public.projects drop column if exists company_id;
alter table public.projects drop column if exists folder_id;
drop table if exists public.company_attachments cascade;
drop table if exists public.company_records cascade;
drop table if exists public.company_folders cascade;
drop table if exists public.companies cascade;
create table if not exists public.project_folders (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null check (length(trim(name)) between 1 and 120),
  description text,
  color text not null default 'sage' check (color in ('sage','blue','amber','rose','slate')),
  sort_order integer not null default 0,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, id)
);
create index if not exists project_folders_workspace_order_idx on public.project_folders(workspace_id, sort_order, name);
alter table public.projects add column folder_id uuid;
alter table public.projects add constraint projects_folder_same_workspace foreign key (workspace_id, folder_id)
  references public.project_folders(workspace_id, id) on delete set null (folder_id);
create index if not exists projects_workspace_folder_idx on public.projects(workspace_id, folder_id, created_at desc);
create trigger set_updated_at before update on public.project_folders for each row execute function private.set_updated_at();
alter table public.project_folders enable row level security;
create policy "Workspace members manage project folders" on public.project_folders for all to authenticated
  using (private.is_workspace_member(workspace_id)) with check (private.is_workspace_member(workspace_id));
grant select, insert, update, delete on public.project_folders to authenticated;
drop policy if exists "Workspace members read project documents" on storage.objects;
create policy "Workspace members read project documents" on storage.objects for select to authenticated using (
 bucket_id='studiodesk-files' and exists (select 1 from public.workspace_members wm join public.projects p on p.workspace_id=wm.workspace_id
 where wm.user_id=(select auth.uid()) and wm.workspace_id::text=(storage.foldername(storage.objects.name))[1] and p.id::text=(storage.foldername(storage.objects.name))[2]));
drop policy if exists "Workspace members upload project documents" on storage.objects;
create policy "Workspace members upload project documents" on storage.objects for insert to authenticated with check (
 bucket_id='studiodesk-files' and exists (select 1 from public.workspace_members wm join public.projects p on p.workspace_id=wm.workspace_id
 where wm.user_id=(select auth.uid()) and wm.workspace_id::text=(storage.foldername(storage.objects.name))[1] and p.id::text=(storage.foldername(storage.objects.name))[2]));
