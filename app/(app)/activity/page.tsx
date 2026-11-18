"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Activity, ArrowUpRight, BrainCircuit, CheckCircle2, FileText, FolderKanban, ListTodo, RefreshCw, Users } from "lucide-react";
import Header from "@/components/Header";
import { supabase } from "@/lib/supabase";
import { getWorkspaceId } from "@/lib/workspace";

type ActivityEvent = {
  id: string;
  event_type: string;
  entity_type: string | null;
  entity_id: string | null;
  summary: string;
  created_at: string;
};

const destinations: Record<string, string> = {
  project: "/projects",
  task: "/tasks",
  client: "/clients",
  memory: "/memory",
};

function formatTime(value: string) {
  return new Date(value).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function ActivityPage() {
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const workspace = await getWorkspaceId();
      const { data, error: queryError } = await supabase
        .from("activity_events")
        .select("id,event_type,entity_type,entity_id,summary,created_at")
        .eq("workspace_id", workspace)
        .order("created_at", { ascending: false })
        .limit(100);
      if (queryError) throw queryError;
      setEvents((data || []) as ActivityEvent[]);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not load studio activity.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  function iconFor(type: string | null) {
    if (type === "project") return FolderKanban;
    if (type === "task") return ListTodo;
    if (type === "client") return Users;
    if (type === "memory") return BrainCircuit;
    return FileText;
  }

  return (
    <div className="page">
      <Header
        tag="THE STUDIO, IN MOTION"
        title="Activity"
        desc="A running history of the work, updates and decisions happening across your workspace."
        action={<button className="button button-light" onClick={() => void load()} disabled={loading}><RefreshCw size={15} /> Refresh</button>}
      />
      {error && <div className="notice" role="alert">{error}</div>}
      <section className="activity-shell">
        <div className="activity-heading">
          <div><span className="activity-live-dot" /><b>Workspace timeline</b><small>Latest 100 events</small></div>
          <span>{events.length} {events.length === 1 ? "EVENT" : "EVENTS"}</span>
        </div>
        {loading ? (
          <div className="activity-empty">Gathering the latest studio updates…</div>
        ) : events.length ? (
          <div className="activity-list">
            {events.map((event) => {
              const Icon = iconFor(event.entity_type);
              const href = destinations[event.entity_type || ""] || "/dashboard";
              return (
                <article className="activity-item" key={event.id}>
                  <span className="activity-icon"><Icon size={17} /></span>
                  <div className="activity-copy">
                    <b>{event.summary}</b>
                    <small>{event.event_type.replaceAll("_", " ")} · {formatTime(event.created_at)}</small>
                  </div>
                  <Link href={href} aria-label="Open related workspace area"><ArrowUpRight size={16} /></Link>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="activity-empty">
            <span className="activity-empty-icon"><Activity size={23} /></span>
            <b>Your studio story starts here.</b>
            <p>When you create projects, move tasks or save memories, the important changes will appear in this timeline.</p>
            <div><Link href="/projects">Explore projects <ArrowUpRight size={14} /></Link><Link href="/tasks">Open tasks <ArrowUpRight size={14} /></Link></div>
          </div>
        )}
      </section>
      <p className="activity-footnote"><CheckCircle2 size={14} /> Activity is workspace-scoped and visible only to members who have access to this workspace.</p>
    </div>
  );
}
