-- Only permit Storage deletion for exact object paths recorded in a
-- workspace member's cleanup queue. This supports retry after project cascade
-- deletion without granting blanket delete access to every workspace object.
drop policy if exists "Workspace members delete project documents" on storage.objects;
create policy "Workspace members delete project documents"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'studiodesk-files'
    and exists (
      select 1
      from public.workspace_members wm
      join public.storage_cleanup_jobs cleanup
        on cleanup.workspace_id = wm.workspace_id
      where wm.user_id = (select auth.uid())
        and wm.workspace_id::text = (storage.foldername(storage.objects.name))[1]
        and storage.objects.name = any(cleanup.storage_paths)
    )
  );
