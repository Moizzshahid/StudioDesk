-- Private project document attachments.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'studiodesk-files',
  'studiodesk-files',
  false,
  20971520,
  array[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'text/csv',
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/svg+xml',
    'application/zip'
  ]
)
on conflict (id) do update set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create table if not exists public.project_attachments (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  project_id uuid not null,
  file_name text not null check (length(trim(file_name)) > 0),
  storage_path text not null unique,
  mime_type text not null,
  file_size bigint not null check (file_size > 0 and file_size <= 20971520),
  description text,
  uploaded_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint project_attachments_project_same_workspace
    foreign key (workspace_id, project_id)
    references public.projects(workspace_id, id) on delete cascade
);

create index if not exists project_attachments_workspace_project_created_idx
  on public.project_attachments(workspace_id, project_id, created_at desc);

alter table public.project_attachments enable row level security;
drop policy if exists "Members manage workspace project attachments" on public.project_attachments;
create policy "Members manage workspace project attachments"
  on public.project_attachments for all to authenticated
  using (private.is_workspace_member(workspace_id))
  with check (
    private.is_workspace_member(workspace_id)
    and exists (
      select 1 from public.projects p
      where p.id = project_attachments.project_id
        and p.workspace_id = project_attachments.workspace_id
    )
  );
grant select, insert, update, delete on public.project_attachments to authenticated;

drop policy if exists "Workspace members read project documents" on storage.objects;
create policy "Workspace members read project documents"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'studiodesk-files'
    and exists (
      select 1 from public.workspace_members wm
      where wm.workspace_id::text = (storage.foldername(name))[1]
        and wm.user_id = (select auth.uid())
    )
  );

drop policy if exists "Workspace members upload project documents" on storage.objects;
create policy "Workspace members upload project documents"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'studiodesk-files'
    and exists (
      select 1 from public.workspace_members wm
      where wm.workspace_id::text = (storage.foldername(name))[1]
        and wm.user_id = (select auth.uid())
    )
  );

drop policy if exists "Workspace members delete project documents" on storage.objects;
create policy "Workspace members delete project documents"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'studiodesk-files'
    and exists (
      select 1 from public.workspace_members wm
      where wm.workspace_id::text = (storage.foldername(name))[1]
        and wm.user_id = (select auth.uid())
    )
  );
