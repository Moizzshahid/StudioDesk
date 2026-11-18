"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight, BrainCircuit, CalendarClock, CheckCircle2, FolderKanban,
  Plus, Sparkles, Users, Activity as ActivityIcon, ListTodo,
} from "lucide-react";
import Header from "@/components/Header";
import { supabase } from "@/lib/supabase";
import { getWorkspaceId } from "@/lib/workspace";

type Project = { id: string; name: string; status: string; description: string | null; due_date?: string | null };
type Task = { id: string; title: string; status: string; due_date: string | null; priority?: string };
type Event = { id: string; summary: string; entity_type: string | null; created_at: string };

export default function Dashboard() {
  const [stats, setStats] = useState([0, 0, 0, 0]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setError("");
    try {
      const workspace = await getWorkspaceId();
      const [p, t, pCount, tCount, c, m, a] = await Promise.all([
        supabase.from("projects").select("id,name,status,description,due_date").eq("workspace_id", workspace).order("created_at", { ascending: false }).limit(5),
        supabase.from("tasks").select("id,title,status,due_date,priority").eq("workspace_id", workspace).neq("status", "done").order("due_date", { ascending: true, nullsFirst: false }).limit(6),
        supabase.from("projects").select("id", { count: "exact", head: true }).eq("workspace_id", workspace).neq("status", "completed"),
        supabase.from("tasks").select("id", { count: "exact", head: true }).eq("workspace_id", workspace).neq("status", "done"),
        supabase.from("clients").select("id", { count: "exact", head: true }).eq("workspace_id", workspace),
        supabase.from("memories").select("id", { count: "exact", head: true }).eq("workspace_id", workspace),
        supabase.from("activity_events").select("id,summary,entity_type,created_at").eq("workspace_id", workspace).order("created_at", { ascending: false }).limit(5),
      ]);
      if (p.error) throw p.error;
      if (t.error) throw t.error;
      if (pCount.error) throw pCount.error;
      if (tCount.error) throw tCount.error;
      if (c.error) throw c.error;
      if (m.error) throw m.error;
      if (a.error) throw a.error;
      setProjects((p.data || []) as Project[]);
      setTasks((t.data || []) as Task[]);
      setEvents((a.data || []) as Event[]);
      setStats([
        pCount.count || 0,
        tCount.count || 0,
        c.count || 0,
        m.count || 0,
      ]);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not load your workspace.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const tiles = [
    ["Active projects", stats[0], FolderKanban, "Currently in motion"],
    ["Open tasks", stats[1], CheckCircle2, "Across your studio"],
    ["Client relationships", stats[2], Users, "People behind the work"],
    ["Saved memories", stats[3], BrainCircuit, "Context worth keeping"],
  ] as const;

  const destination = (type: string | null) =>
    type === "project" ? "/projects" : type === "task" ? "/tasks" : type === "client" ? "/clients" : type === "memory" ? "/memory" : "/activity";

  return (
    <div className="page dashboard-page">
      <div className="dashboard-welcome">
        <div>
          <div className="dashboard-eyebrow"><Sparkles size={13} /> YOUR STUDIO, IN FOCUS</div>
          <h1>Make room for<br /><em>great work.</em></h1>
          <p>A clear view of what is moving, what needs attention, and what your studio has learned.</p>
        </div>
        <div className="dashboard-welcome-actions">
          <Link className="button" href="/projects"><Plus size={15} /> New project</Link>
          <Link className="button button-light" href="/tasks"><ListTodo size={15} /> Add a task</Link>
        </div>
      </div>

      {error && <div className="notice" role="alert">{error}</div>}

      <div className="stats dashboard-stats">
        {tiles.map(([label, value, Icon, note]) => (
          <div className="stat" key={label}>
            <div className="stat-topline"><span><Icon size={17} /></span><small>{note}</small></div>
            <b>{loading ? "—" : value}</b>
            <small className="stat-label">{label}</small>
          </div>
        ))}
      </div>

      <div className="dashboard-grid">
        <section className="panel dashboard-projects">
          <div className="panelhead">
            <div><span className="section-kicker">THE BIG PICTURE</span><h3>Projects in motion</h3><p>Recent work and the next milestones.</p></div>
            <Link href="/projects">All projects <ArrowUpRight size={14} /></Link>
          </div>
          {projects.length ? projects.map((project) => (
            <Link className="dashboard-project-row" href={"/projects/" + project.id} key={project.id}>
              <span className="dashboard-project-mark">{project.name.slice(0, 1).toUpperCase()}</span>
              <span className="dashboard-project-copy"><b>{project.name}</b><small>{project.description || "Project workspace"}</small></span>
              <span className={"project-status status-" + project.status}>{project.status.replaceAll("_", " ")}</span>
              <ArrowUpRight size={15} className="dashboard-row-arrow" />
            </Link>
          )) : <div className="dashboard-empty"><FolderKanban size={22} /><b>{loading ? "Loading projects…" : "Your next project starts here."}</b><p>Create a home for the brief, people and decisions.</p><Link href="/projects">Explore projects <ArrowUpRight size={14} /></Link></div>}
        </section>

        <section className="panel dashboard-tasks">
          <div className="panelhead">
            <div><span className="section-kicker">THE NEXT MOVE</span><h3>On your radar</h3><p>Open tasks, ordered by due date.</p></div>
            <Link href="/tasks">Task list <ArrowUpRight size={14} /></Link>
          </div>
          {tasks.length ? tasks.map((task) => (
            <div className="dashboard-task-row" key={task.id}>
              <span className={"task-priority-dot priority-dot-" + (task.priority || "medium")} />
              <span><b>{task.title}</b><small>{task.due_date ? <><CalendarClock size={12} /> Due {new Date(task.due_date + "T00:00:00").toLocaleDateString(undefined, { month: "short", day: "numeric" })}</> : "No deadline set"}</small></span>
              <span className="dashboard-task-status">{task.status.replaceAll("_", " ")}</span>
            </div>
          )) : <div className="dashboard-empty compact"><CheckCircle2 size={22} /><b>{loading ? "Loading tasks…" : "Nothing waiting on you."}</b><p>Your open tasks will appear here.</p><Link href="/tasks">Open task manager <ArrowUpRight size={14} /></Link></div>}
        </section>

        <section className="panel dashboard-activity">
          <div className="panelhead">
            <div><span className="section-kicker">THE LATEST</span><h3>Studio activity</h3><p>A living record of work moving forward.</p></div>
            <Link href="/activity">Full history <ArrowUpRight size={14} /></Link>
          </div>
          {events.length ? events.map((event) => (
            <Link className="dashboard-event-row" href={destination(event.entity_type)} key={event.id}>
              <span className="dashboard-event-icon"><ActivityIcon size={15} /></span>
              <span><b>{event.summary}</b><small>{new Date(event.created_at).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</small></span>
              <ArrowUpRight size={14} />
            </Link>
          )) : <div className="dashboard-empty compact"><ActivityIcon size={22} /><b>{loading ? "Loading activity…" : "Your studio story begins here."}</b><p>Project and task updates will build your timeline.</p><Link href="/activity">View activity <ArrowUpRight size={14} /></Link></div>}
        </section>

        <section className="dashboard-memory">
          <div className="dashboard-memory-icon"><BrainCircuit size={22} /></div>
          <span className="section-kicker">THE STUDIO MEMORY ADVANTAGE</span>
          <h3>Good work gets better<br />when context stays.</h3>
          <p>Client preferences, creative decisions and lessons learned—connected to the work they belong to.</p>
          <Link href="/memory">Explore Studio Memory <ArrowUpRight size={15} /></Link>
          <div className="memory-orbit memory-orbit-one" /><div className="memory-orbit memory-orbit-two" />
        </section>
      </div>
    </div>
  );
}
