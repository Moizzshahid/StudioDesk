-- Project-level records: briefs, notes, decisions, meetings, links and deliverables.
create table if not exists public.project_records (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  project_id uuid not null,
  record_type text not null default 'note' check (record_type in ('brief','note','decision','meeting','link','deliverable','update')),
  title text not null check (length(trim(title)) > 0),
  content text,
  url text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint project_records_project_same_workspace
    foreign key (workspace_id, project_id)
    references public.projects(workspace_id, id) on delete cascade
);
create index if not exists project_records_workspace_project_created_idx
  on public.project_records(workspace_id, project_id, created_at desc);
alter table public.project_records enable row level security;
drop policy if exists "Members manage workspace project records" on public.project_records;
create policy "Members manage workspace project records"
  on public.project_records for all to authenticated
  using (private.is_workspace_member(workspace_id))
  with check (
    private.is_workspace_member(workspace_id)
    and exists (
      select 1 from public.projects p
      where p.id = project_records.project_id
        and p.workspace_id = project_records.workspace_id
    )
  );
grant select, insert, update, delete on public.project_records to authenticated;
