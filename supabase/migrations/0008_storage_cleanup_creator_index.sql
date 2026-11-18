-- Cover the creator foreign key for pending storage cleanup jobs.
create index if not exists storage_cleanup_jobs_created_by_idx
  on public.storage_cleanup_jobs(created_by);
