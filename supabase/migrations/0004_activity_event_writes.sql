-- Allow authenticated workspace members to append their own activity events.
-- Keep reads governed by the existing workspace SELECT policy.
create policy "Members append workspace activity"
on public.activity_events
for insert
to authenticated
with check (
  private.is_workspace_member(workspace_id)
  and (actor_id is null or actor_id = (select auth.uid()))
);

create index if not exists activity_events_workspace_created_idx
on public.activity_events(workspace_id, created_at desc);
