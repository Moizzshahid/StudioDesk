-- Add covering indexes for folder workspace foreign keys and remove the duplicate name index.
create index if not exists folder_records_workspace_folder_idx on public.folder_records(workspace_id, folder_id);
create index if not exists folder_records_created_by_idx on public.folder_records(created_by);
create index if not exists folder_attachments_workspace_folder_idx on public.folder_attachments(workspace_id, folder_id);
create index if not exists folder_attachments_uploaded_by_idx on public.folder_attachments(uploaded_by);
create index if not exists folders_created_by_idx on public.folders(created_by);
drop index if exists public.folders_workspace_name_idx;
