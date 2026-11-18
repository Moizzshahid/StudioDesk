-- StudioDesk initial schema
-- Apply once to a fresh Supabase project using the SQL Editor.
create extension if not exists pgcrypto;

create table if not exists public.workspaces (
 id uuid primary key default gen_random_uuid(),
 name text not null default 'My Studio',
 slug text unique,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create table if not exists public.workspace_members (
 workspace_id uuid not null references public.workspaces(id) on delete cascade,
 user_id uuid not null references auth.users(id) on delete cascade,
 role text not null default 'owner' check(role in ('owner','admin','member')),
 created_at timestamptz not null default now(),
 primary key(workspace_id,user_id)
);

create or replace function public.is_workspace_member(target_workspace uuid)
returns boolean language sql stable security definer set search_path=public
as $$
 select exists(select 1 from public.workspace_members wm where wm.workspace_id=target_workspace and wm.user_id=auth.uid());
$$;

create or replace function public.create_workspace_for_new_user()
returns trigger language plpgsql security definer set search_path=public
as $$
declare new_workspace_id uuid; workspace_label text;
begin
 workspace_label:=coalesce(nullif(new.raw_user_meta_data->>'workspace_name',''),'My Studio');
 insert into public.workspaces(name) values(workspace_label) returning id into new_workspace_id;
 insert into public.workspace_members(workspace_id,user_id,role) values(new_workspace_id,new.id,'owner');
 return new;
end;
$$;
drop trigger if exists on_auth_user_created_studiodesk on auth.users;
create trigger on_auth_user_created_studiodesk after insert on auth.users
for each row execute procedure public.create_workspace_for_new_user();

create table if not exists public.clients(
 id uuid primary key default gen_random_uuid(),
 workspace_id uuid not null references public.workspaces(id) on delete cascade,
 name text not null check(length(trim(name))>0),
 company text,email text,notes text,
 created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 unique(workspace_id,id)
);
create table if not exists public.projects(
 id uuid primary key default gen_random_uuid(),
 workspace_id uuid not null references public.workspaces(id) on delete cascade,
 name text not null check(length(trim(name))>0),
 description text,
 status text not null default 'planning' check(status in ('planning','in_progress','on_hold','completed')),
 due_date date,
 client_id uuid,
 created_by uuid references auth.users(id) on delete set null,
 created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 unique(workspace_id,id),
 constraint projects_client_same_workspace foreign key(workspace_id,client_id) references public.clients(workspace_id,id) on delete set null (client_id)
);
create table if not exists public.tasks(
 id uuid primary key default gen_random_uuid(),
 workspace_id uuid not null references public.workspaces(id) on delete cascade,
 project_id uuid,
 title text not null check(length(trim(title))>0),
 description text,
 status text not null default 'todo' check(status in ('todo','in_progress','done')),
 priority text not null default 'medium' check(priority in ('low','medium','high','urgent')),
 due_date date,
 created_by uuid references auth.users(id) on delete set null,
 created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 constraint tasks_project_same_workspace foreign key(workspace_id,project_id) references public.projects(workspace_id,id) on delete set null (project_id)
);
create table if not exists public.memories(
 id uuid primary key default gen_random_uuid(),
 workspace_id uuid not null references public.workspaces(id) on delete cascade,
 title text not null check(length(trim(title))>0),
 content text not null check(length(trim(content))>0),
 category text not null default 'other' check(category in ('client_preference','brand_guideline','decision','feedback','lesson','meeting_note','other')),
 project_id uuid,client_id uuid,
 created_by uuid references auth.users(id) on delete set null,
 created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 constraint memories_project_same_workspace foreign key(workspace_id,project_id) references public.projects(workspace_id,id) on delete set null (project_id),
 constraint memories_client_same_workspace foreign key(workspace_id,client_id) references public.clients(workspace_id,id) on delete set null (client_id)
);
create table if not exists public.activity_events(
 id uuid primary key default gen_random_uuid(),
 workspace_id uuid not null references public.workspaces(id) on delete cascade,
 actor_id uuid references auth.users(id) on delete set null,
 event_type text not null,entity_type text,entity_id uuid,summary text not null,
 created_at timestamptz not null default now()
);

create index if not exists clients_workspace_created_idx on public.clients(workspace_id,created_at desc);
create index if not exists projects_workspace_created_idx on public.projects(workspace_id,created_at desc);
create index if not exists tasks_workspace_status_idx on public.tasks(workspace_id,status,due_date);
create index if not exists memories_workspace_created_idx on public.memories(workspace_id,created_at desc);
create index if not exists memories_search_idx on public.memories using gin(to_tsvector('english',coalesce(title,'')||' '||coalesce(content,'')));
create index if not exists activity_workspace_created_idx on public.activity_events(workspace_id,created_at desc);

alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.clients enable row level security;
alter table public.projects enable row level security;
alter table public.tasks enable row level security;
alter table public.memories enable row level security;
alter table public.activity_events enable row level security;

drop policy if exists "Members can view their workspaces" on public.workspaces;
create policy "Members can view their workspaces" on public.workspaces for select to authenticated using(public.is_workspace_member(id));
drop policy if exists "Members can view workspace membership" on public.workspace_members;
create policy "Members can view workspace membership" on public.workspace_members for select to authenticated using(public.is_workspace_member(workspace_id));
drop policy if exists "Members manage workspace clients" on public.clients;
create policy "Members manage workspace clients" on public.clients for all to authenticated using(public.is_workspace_member(workspace_id)) with check(public.is_workspace_member(workspace_id));
drop policy if exists "Members manage workspace projects" on public.projects;
create policy "Members manage workspace projects" on public.projects for all to authenticated
using(public.is_workspace_member(workspace_id))
with check(public.is_workspace_member(workspace_id) and (client_id is null or exists(select 1 from public.clients c where c.id=client_id and c.workspace_id=projects.workspace_id)));
drop policy if exists "Members manage workspace tasks" on public.tasks;
create policy "Members manage workspace tasks" on public.tasks for all to authenticated
using(public.is_workspace_member(workspace_id))
with check(public.is_workspace_member(workspace_id) and (project_id is null or exists(select 1 from public.projects p where p.id=project_id and p.workspace_id=tasks.workspace_id)));
drop policy if exists "Members manage workspace memories" on public.memories;
create policy "Members manage workspace memories" on public.memories for all to authenticated
using(public.is_workspace_member(workspace_id))
with check(public.is_workspace_member(workspace_id)
 and (project_id is null or exists(select 1 from public.projects p where p.id=project_id and p.workspace_id=memories.workspace_id))
 and (client_id is null or exists(select 1 from public.clients c where c.id=client_id and c.workspace_id=memories.workspace_id)));
drop policy if exists "Members view workspace activity" on public.activity_events;
create policy "Members view workspace activity" on public.activity_events for select to authenticated using(public.is_workspace_member(workspace_id));

grant usage on schema public to authenticated;
grant select on public.workspaces,public.workspace_members to authenticated;
grant select,insert,update,delete on public.clients,public.projects,public.tasks,public.memories to authenticated;
grant select on public.activity_events to authenticated;

-- Browser clients use only the publishable/anon key. Never expose service-role keys.
