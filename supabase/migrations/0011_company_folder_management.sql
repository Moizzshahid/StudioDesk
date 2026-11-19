-- Company, folder and company-level context management.
-- Existing clients and independent projects remain valid.
create table if not exists public.companies (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null check (length(trim(name)) between 1 and 160),
  industry text, website text, email text, phone text, address text,
  description text, notes text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, id)
);
create index if not exists companies_workspace_name_idx on public.companies(workspace_id, name);

create table if not exists public.company_folders (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  company_id uuid not null,
  name text not null check (length(trim(name)) between 1 and 120),
  description text,
  color text not null default 'sage' check (color in ('sage','blue','amber','rose','slate')),
  sort_order integer not null default 0,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, company_id, id),
  constraint company_folders_company_same_workspace foreign key (workspace_id, company_id)
    references public.companies(workspace_id, id) on delete cascade
);
create index if not exists company_folders_company_order_idx
  on public.company_folders(workspace_id, company_id, sort_order, created_at);

alter table public.projects add column if not exists company_id uuid, add column if not exists folder_id uuid;
alter table public.projects
  drop constraint if exists projects_company_same_workspace,
  drop constraint if exists projects_folder_same_company,
  drop constraint if exists projects_folder_requires_company;
alter table public.projects
  add constraint projects_company_same_workspace foreign key (workspace_id, company_id)
    references public.companies(workspace_id, id) on delete set null (company_id),
  add constraint projects_folder_same_company foreign key (workspace_id, company_id, folder_id)
    references public.company_folders(workspace_id, company_id, id) on delete set null (folder_id),
  add constraint projects_folder_requires_company check (folder_id is null or company_id is not null);
create index if not exists projects_workspace_company_idx on public.projects(workspace_id, company_id, folder_id);

create table if not exists public.company_records (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null, company_id uuid not null, folder_id uuid,
  record_type text not null default 'note'
    check (record_type in ('note','brief','decision','meeting','link','update','guideline')),
  title text not null check (length(trim(title)) between 1 and 160),
  content text, url text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  constraint company_records_company_same_workspace foreign key (workspace_id, company_id)
    references public.companies(workspace_id, id) on delete cascade,
  constraint company_records_folder_same_company foreign key (workspace_id, company_id, folder_id)
    references public.company_folders(workspace_id, company_id, id) on delete cascade
);
create index if not exists company_records_company_created_idx
  on public.company_records(workspace_id, company_id, folder_id, created_at desc);

create table if not exists public.company_attachments (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null, company_id uuid not null, folder_id uuid,
  file_name text not null check (length(trim(file_name)) between 1 and 255),
  storage_path text not null unique, mime_type text not null,
  file_size bigint not null check (file_size > 0 and file_size <= 20971520),
  description text, uploaded_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint company_attachments_company_same_workspace foreign key (workspace_id, company_id)
    references public.companies(workspace_id, id) on delete cascade,
  constraint company_attachments_folder_same_company foreign key (workspace_id, company_id, folder_id)
    references public.company_folders(workspace_id, company_id, id) on delete cascade,
  constraint company_attachments_storage_path_matches_company
    check (storage_path like workspace_id::text || '/' || company_id::text || '/company/%')
);
create index if not exists company_attachments_company_created_idx
  on public.company_attachments(workspace_id, company_id, folder_id, created_at desc);

drop trigger if exists set_updated_at on public.companies;
create trigger set_updated_at before update on public.companies
  for each row execute function private.set_updated_at();
drop trigger if exists set_updated_at on public.company_folders;
create trigger set_updated_at before update on public.company_folders
  for each row execute function private.set_updated_at();
drop trigger if exists set_updated_at on public.company_records;
create trigger set_updated_at before update on public.company_records
  for each row execute function private.set_updated_at();

alter table public.companies enable row level security;
alter table public.company_folders enable row level security;
alter table public.company_records enable row level security;
alter table public.company_attachments enable row level security;

create policy "Workspace members manage companies" on public.companies for all to authenticated
  using (private.is_workspace_member(workspace_id))
  with check (private.is_workspace_member(workspace_id));
create policy "Workspace members manage company folders" on public.company_folders for all to authenticated
  using (private.is_workspace_member(workspace_id))
  with check (private.is_workspace_member(workspace_id) and exists (
    select 1 from public.companies c where c.id = company_folders.company_id and c.workspace_id = company_folders.workspace_id
  ));
create policy "Workspace members manage company records" on public.company_records for all to authenticated
  using (private.is_workspace_member(workspace_id))
  with check (
    private.is_workspace_member(workspace_id)
    and exists (select 1 from public.companies c where c.id = company_records.company_id and c.workspace_id = company_records.workspace_id)
    and (folder_id is null or exists (
      select 1 from public.company_folders f where f.id = company_records.folder_id
        and f.company_id = company_records.company_id and f.workspace_id = company_records.workspace_id
    ))
  );
create policy "Workspace members manage company attachments" on public.company_attachments for all to authenticated
  using (private.is_workspace_member(workspace_id))
  with check (
    private.is_workspace_member(workspace_id) and uploaded_by = (select auth.uid())
    and storage_path like workspace_id::text || '/' || company_id::text || '/company/%'
    and exists (select 1 from public.companies c where c.id = company_attachments.company_id and c.workspace_id = company_attachments.workspace_id)
    and (folder_id is null or exists (
      select 1 from public.company_folders f where f.id = company_attachments.folder_id
        and f.company_id = company_attachments.company_id and f.workspace_id = company_attachments.workspace_id
    ))
  );
grant select, insert, update, delete on public.companies, public.company_folders,
  public.company_records, public.company_attachments to authenticated;

-- Extend the private bucket policies while preserving project document access.
drop policy if exists "Workspace members read project documents" on storage.objects;
create policy "Workspace members read project documents" on storage.objects for select to authenticated
using (bucket_id = 'studiodesk-files' and (
  exists (select 1 from public.workspace_members wm join public.projects p on p.workspace_id = wm.workspace_id
    where wm.user_id = (select auth.uid()) and wm.workspace_id::text = (storage.foldername(storage.objects.name))[1]
      and p.id::text = (storage.foldername(storage.objects.name))[2])
  or exists (select 1 from public.workspace_members wm join public.companies c on c.workspace_id = wm.workspace_id
    where wm.user_id = (select auth.uid()) and wm.workspace_id::text = (storage.foldername(storage.objects.name))[1]
      and c.id::text = (storage.foldername(storage.objects.name))[2]
      and (storage.foldername(storage.objects.name))[3] = 'company')
));
drop policy if exists "Workspace members upload project documents" on storage.objects;
create policy "Workspace members upload project documents" on storage.objects for insert to authenticated
with check (bucket_id = 'studiodesk-files' and (
  exists (select 1 from public.workspace_members wm join public.projects p on p.workspace_id = wm.workspace_id
    where wm.user_id = (select auth.uid()) and wm.workspace_id::text = (storage.foldername(storage.objects.name))[1]
      and p.id::text = (storage.foldername(storage.objects.name))[2])
  or exists (select 1 from public.workspace_members wm join public.companies c on c.workspace_id = wm.workspace_id
    where wm.user_id = (select auth.uid()) and wm.workspace_id::text = (storage.foldername(storage.objects.name))[1]
      and c.id::text = (storage.foldername(storage.objects.name))[2]
      and (storage.foldername(storage.objects.name))[3] = 'company')
));
-- Migration 0009's exact-cleanup-queue delete policy remains intentionally unchanged.
