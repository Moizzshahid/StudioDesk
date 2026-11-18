-- Reliable, retryable cleanup for private project documents.
-- Storage files are removed through the Storage API, never by deleting storage.objects rows.

create table if not exists public.storage_cleanup_jobs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  storage_paths text[] not null
    check (
      cardinality(storage_paths) between 1 and 1000
      and array_position(storage_paths, null) is null
    ),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.storage_cleanup_jobs enable row level security;
drop policy if exists "Workspace members manage storage cleanup jobs" on public.storage_cleanup_jobs;
create policy "Workspace members manage storage cleanup jobs"
  on public.storage_cleanup_jobs for all to authenticated
  using (private.is_workspace_member(workspace_id))
  with check (
    private.is_workspace_member(workspace_id)
    and created_by = (select auth.uid())
    and not exists (
      select 1
      from unnest(storage_paths) as candidate(path)
      where candidate.path !~ ('^' || workspace_id::text || '/[0-9a-fA-F-]{36}/.+$')
    )
  );
grant select, insert, delete on public.storage_cleanup_jobs to authenticated;

-- Correct project-folder checks: the folder segments come from storage.objects.name,
-- never from projects.name. Keep read/upload tied to an existing project.
drop policy if exists "Workspace members read project documents" on storage.objects;
create policy "Workspace members read project documents"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'studiodesk-files'
    and exists (
      select 1
      from public.workspace_members wm
      join public.projects p on p.workspace_id = wm.workspace_id
      where wm.user_id = (select auth.uid())
        and wm.workspace_id::text = (storage.foldername(storage.objects.name))[1]
        and p.id::text = (storage.foldername(storage.objects.name))[2]
    )
  );

drop policy if exists "Workspace members upload project documents" on storage.objects;
create policy "Workspace members upload project documents"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'studiodesk-files'
    and exists (
      select 1
      from public.workspace_members wm
      join public.projects p on p.workspace_id = wm.workspace_id
      where wm.user_id = (select auth.uid())
        and wm.workspace_id::text = (storage.foldername(storage.objects.name))[1]
        and p.id::text = (storage.foldername(storage.objects.name))[2]
    )
  );

-- Delete checks membership in the workspace path, not project existence. This
-- deliberately allows queued cleanup to finish after the project row is gone.
drop policy if exists "Workspace members delete project documents" on storage.objects;
create policy "Workspace members delete project documents"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'studiodesk-files'
    and exists (
      select 1
      from public.workspace_members wm
      where wm.user_id = (select auth.uid())
        and wm.workspace_id::text = (storage.foldername(storage.objects.name))[1]
    )
  );

create index if not exists storage_cleanup_jobs_workspace_created_idx
  on public.storage_cleanup_jobs(workspace_id, created_at);
