import { supabase } from "@/lib/supabase";

export type StorageCleanupJob = {
  id: string;
  workspace_id: string;
  storage_paths: string[];
  created_at: string;
};

export async function enqueueStorageCleanup(
  workspaceId: string,
  paths: string[],
  userId: string,
): Promise<string | null> {
  const uniquePaths = [...new Set(paths)].filter(Boolean);
  if (!uniquePaths.length) return null;
  const { data, error } = await supabase
    .from("storage_cleanup_jobs")
    .insert({ workspace_id: workspaceId, storage_paths: uniquePaths, created_by: userId })
    .select("id")
    .single();
  if (error) throw error;
  return data.id as string;
}

export async function processStorageCleanup(jobId: string, workspaceId: string): Promise<void> {
  const { data: job, error: readError } = await supabase
    .from("storage_cleanup_jobs")
    .select("id,storage_paths")
    .eq("id", jobId)
    .eq("workspace_id", workspaceId)
    .single();
  if (readError) throw readError;

  const { error: storageError } = await supabase.storage
    .from("studiodesk-files")
    .remove(job.storage_paths);
  if (storageError) throw new Error("Database changes were saved, but document cleanup is pending. Retry it from Projects. " + storageError.message);

  const { error: finishError } = await supabase
    .from("storage_cleanup_jobs")
    .delete()
    .eq("id", jobId)
    .eq("workspace_id", workspaceId);
  if (finishError) throw new Error("Files were removed, but the cleanup receipt could not be cleared. Refresh and retry.");
}

export async function discardStorageCleanup(jobId: string, workspaceId: string): Promise<void> {
  const { error } = await supabase
    .from("storage_cleanup_jobs")
    .delete()
    .eq("id", jobId)
    .eq("workspace_id", workspaceId);
  if (error) throw error;
}
