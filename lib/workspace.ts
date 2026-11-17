import { supabase } from "@/lib/supabase";

export async function getWorkspaceId(): Promise<string> {
  const { data: auth } = await supabase.auth.getUser();

  if (!auth.user) {
    throw new Error("Please sign in.");
  }

  const { data, error } = await supabase
    .from("workspace_members")
    .select("workspace_id")
    .eq("user_id", auth.user.id)
    .limit(1)
    .single();

  if (error || !data) {
    throw new Error("Workspace not ready. Sign out and in again.");
  }

  return data.workspace_id as string;
}
