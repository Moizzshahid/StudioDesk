"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowUpRight, Command, FileText, FolderKanban, Search, Users, X, ListTodo } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { getWorkspaceId } from "@/lib/workspace";

type SearchResult = {
  id: string;
  title: string;
  detail: string;
  href: string;
  kind: "Project" | "Task" | "Client" | "Memory";
};

export default function CommandMenu() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const close = useCallback(() => {
    setOpen(false);
    setQuery("");
    setResults([]);
    setError("");
  }, []);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen(true);
      }
      if (event.key === "Escape") close();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [close]);

  useEffect(() => {
    const term = query.trim();
    if (term.length < 2) {
      setResults([]);
      setError("");
      setLoading(false);
      return;
    }

    let cancelled = false;
    const timer = window.setTimeout(async () => {
      setLoading(true);
      setError("");
      try {
        const workspace = await getWorkspaceId();
        const pattern = `%${term.replace(/[%_]/g, "\\$&")}%`;
        const [projects, tasks, clients, memories] = await Promise.all([
          supabase.from("projects").select("id,name,description,status").eq("workspace_id", workspace).ilike("name", pattern).limit(5),
          supabase.from("tasks").select("id,title,description,status").eq("workspace_id", workspace).ilike("title", pattern).limit(5),
          supabase.from("clients").select("id,name,company").eq("workspace_id", workspace).ilike("name", pattern).limit(5),
          supabase.from("memories").select("id,title,category").eq("workspace_id", workspace).ilike("title", pattern).limit(5),
        ]);
        const failure = projects.error || tasks.error || clients.error || memories.error;
        if (failure) throw failure;
        if (cancelled) return;
        setResults([
          ...(projects.data || []).map((item) => ({ id: item.id, title: item.name, detail: item.description || item.status.replace("_", " "), href: `/projects/${item.id}`, kind: "Project" as const })),
          ...(tasks.data || []).map((item) => ({ id: item.id, title: item.title, detail: item.description || item.status.replace("_", " "), href: "/tasks", kind: "Task" as const })),
          ...(clients.data || []).map((item) => ({ id: item.id, title: item.name, detail: item.company || "Client record", href: "/clients", kind: "Client" as const })),
          ...(memories.data || []).map((item) => ({ id: item.id, title: item.title, detail: item.category.replace("_", " "), href: "/memory", kind: "Memory" as const })),
        ]);
      } catch (reason) {
        if (!cancelled) setError(reason instanceof Error ? reason.message : "Search could not be completed.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 240);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [query]);

  const grouped = useMemo(() => {
    const order: SearchResult["kind"][] = ["Project", "Task", "Client", "Memory"];
    return order.map((kind) => ({ kind, items: results.filter((item) => item.kind === kind) })).filter((group) => group.items.length);
  }, [results]);

  const icons = { Project: FolderKanban, Task: ListTodo, Client: Users, Memory: FileText };

  function go(href: string) {
    close();
    router.push(href);
  }

  return (
    <>
      <button className="command-trigger" onClick={() => setOpen(true)} aria-label="Search your workspace">
        <Search size={16} />
        <span>Search anything in your workspace</span>
        <kbd><Command size={11} /> K</kbd>
      </button>
      {open && (
        <div className="command-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) close(); }}>
          <section className="command-dialog" role="dialog" aria-modal="true" aria-label="Search workspace">
            <div className="command-input-wrap">
              <Search size={19} />
              <input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search projects, tasks, clients and memories…" />
              <button onClick={close} aria-label="Close search"><X size={17} /></button>
            </div>
            <div className="command-results">
              {query.trim().length < 2 ? (
                <div className="command-hint">
                  <span>SEARCH YOUR STUDIO</span>
                  <p>Find a project, a client, a task or a piece of saved context.</p>
                  <div className="command-shortcuts"><span><kbd>Ctrl</kbd> + <kbd>K</kbd> to open</span><span><kbd>Esc</kbd> to close</span></div>
                </div>
              ) : loading ? (
                <div className="command-state">Searching your workspace…</div>
              ) : error ? (
                <div className="command-state command-error">{error}</div>
              ) : grouped.length ? (
                grouped.map((group) => (
                  <div className="command-group" key={group.kind}>
                    <small>{group.kind}s</small>
                    {group.items.map((item) => {
                      const Icon = icons[item.kind];
                      return (
                        <button className="command-result" key={item.kind + item.id} onClick={() => go(item.href)}>
                          <span className="command-result-icon"><Icon size={16} /></span>
                          <span className="command-result-copy"><b>{item.title}</b><small>{item.detail}</small></span>
                          <span className="command-result-kind">{item.kind}</span>
                          <ArrowUpRight size={15} />
                        </button>
                      );
                    })}
                  </div>
                ))
              ) : (
                <div className="command-state">No results for “{query.trim()}”. Try another keyword.</div>
              )}
            </div>
            <footer className="command-footer">
              <span>STUDIODESK GLOBAL SEARCH</span>
              <Link href="/projects" onClick={close}>Browse projects <ArrowUpRight size={13} /></Link>
            </footer>
          </section>
        </div>
      )}
    </>
  );
}
