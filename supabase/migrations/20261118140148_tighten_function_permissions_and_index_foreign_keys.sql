-- Cover foreign keys to keep joins and deletes efficient as workspaces grow.
create index if not exists workspace_members_user_id_idx on public.workspace_members(user_id);
create index if not exists projects_workspace_client_idx on public.projects(workspace_id,client_id);
create index if not exists projects_created_by_idx on public.projects(created_by);
create index if not exists tasks_workspace_project_idx on public.tasks(workspace_id,project_id);
create index if not exists tasks_created_by_idx on public.tasks(created_by);
create index if not exists memories_workspace_project_idx on public.memories(workspace_id,project_id);
create index if not exists memories_workspace_client_idx on public.memories(workspace_id,client_id);
create index if not exists memories_created_by_idx on public.memories(created_by);
create index if not exists activity_events_actor_id_idx on public.activity_events(actor_id);

