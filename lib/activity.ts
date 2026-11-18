import { supabase } from "@/lib/supabase";
import { getWorkspaceId } from "@/lib/workspace";

export async function recordActivity(
  eventType: string,
  entityType: string,
  entityId: string | null,
  summary: string,
) {
  try {
    const [workspaceId, { data: auth }] = await Promise.all([
      getWorkspaceId(),
      supabase.auth.getUser(),
    ]);

    const { error } = await supabase.from("activity_events").insert({
      workspace_id: workspaceId,
      actor_id: auth.user?.id ?? null,
      event_type: eventType,
      entity_type: entityType,
      entity_id: entityId,
      summary,
    });

    if (error) console.warn("StudioDesk activity log:", error.message);
  } catch (error) {
    console.warn("StudioDesk activity log unavailable:", error);
  }
}
