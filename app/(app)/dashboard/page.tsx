"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, FolderKanban, CheckCircle2, Users, BrainCircuit, ArrowUpRight } from "lucide-react";
import Header from "@/components/Header";
import { supabase } from "@/lib/supabase";
import { getWorkspaceId } from "@/lib/workspace";

type Project = { id: string; name: string; status: string; description: string | null };
type Task = { id: string; title: string; status: string; due_date: string | null };

export default function Dashboard() {
  const [stats, setStats] = useState([0, 0, 0, 0]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const workspace = await getWorkspaceId();
        const [p, t, c, m] = await Promise.all([
          supabase.from("projects").select("id,name,status,description").eq("workspace_id", workspace).order("created_at", { ascending: false }).limit(5),
          supabase.from("tasks").select("id,title,status,due_date").eq("workspace_id", workspace).neq("status", "done").limit(5),
          supabase.from("clients").select("id", { count: "exact", head: true }).eq("workspace_id", workspace),
          supabase.from("memories").select("id", { count: "exact", head: true }).eq("workspace_id", workspace),
        ]);
        if (p.error) throw p.error;
        if (t.error) throw t.error;
        setProjects(p.data || []);
        setTasks(t.data || []);
        setStats([(p.data || []).filter(x => x.status !== "completed").length, t.data?.length || 0, c.count || 0, m.count || 0]);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not load workspace.");
      }
    }
    load();
  }, []);

  const tiles = [
    ["Active projects", stats[0], FolderKanban],
    ["Open tasks", stats[1], CheckCircle2],
    ["Clients", stats[2], Users],
    ["Saved memories", stats[3], BrainCircuit],
  ] as const;

  return <div className="page">
    <Header tag="YOUR WORKSPACE" title="Good work starts with clarity." desc="Here’s what’s moving across your studio today." action={<Link className="button" href="/projects"><Plus size={16} /> New project</Link>} />
    {error && <div className="notice">{error}</div>}
    <div className="stats">{tiles.map(([label, value, Icon]) => <div className="stat" key={label}><span><Icon size={17} /></span><small>{label}</small><b>{value}</b><i>Across your workspace</i></div>)}</div>
    <div className="columns">
      <section className="panel"><div className="panelhead"><div><h3>Recent projects</h3><p>The latest work in your studio</p></div><Link href="/projects">All projects ↗</Link></div>
        {projects.length ? projects.map(p => <div className="row" key={p.id}><b className="letter">{p.name[0]}</b><span><strong>{p.name}</strong><small>{p.description || "No description"}</small></span><em>{p.status.replace("_", " ")}</em></div>) : <div className="empty"><FolderKanban /><b>Your first project starts here.</b><p>Create a project to bring the work into focus.</p><Link href="/projects">Create a project ↗</Link></div>}
      </section>
      <section className="panel"><div className="panelhead"><div><h3>Needs attention</h3><p>Open tasks</p></div><Link href="/tasks">View tasks ↗</Link></div>
        {tasks.length ? tasks.map(t => <div className="row" key={t.id}><span className="dot" /><span><strong>{t.title}</strong><small>{t.due_date ? `Due ${t.due_date}` : "No due date"}</small></span><em>{t.status.replace("_", " ")}</em></div>) : <div className="empty"><CheckCircle2 /><b>Nothing pressing.</b><p>Your open tasks will appear here.</p></div>}
      </section>
    </div>
    <section className="memorybanner"><BrainCircuit /><div><small>THE STUDIO MEMORY ADVANTAGE</small><h3>Your best decisions shouldn’t disappear into old conversations.</h3><p>Capture client preferences, creative decisions and project context.</p></div><Link href="/memory">Explore Studio Memory <ArrowUpRight size={15} /></Link></section>
  </div>;
}
