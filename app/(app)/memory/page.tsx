"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BrainCircuit,
  Filter,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import Header from "@/components/Header";
import { supabase } from "@/lib/supabase";
import { getWorkspaceId } from "@/lib/workspace";
import { recordActivity } from "@/lib/activity";

const categories = [
  { value: "client_preference", label: "Client preference" },
  { value: "brand_guideline", label: "Brand guideline" },
  { value: "decision", label: "Creative decision" },
  { value: "feedback", label: "Feedback" },
  { value: "lesson", label: "Lesson learned" },
  { value: "meeting_note", label: "Meeting note" },
  { value: "other", label: "Other" },
] as const;

type Category = (typeof categories)[number]["value"];
type Memory = {
  id: string;
  title: string;
  content: string;
  category: Category;
  project_id: string | null;
  client_id: string | null;
  folder_id: string | null;
  created_at: string;
  updated_at: string;
};
type RelatedOption = { id: string; name: string };
type MemoryForm = {
  title: string;
  content: string;
  category: Category;
  project_id: string;
  client_id: string;
  folder_id: string;
};

const emptyForm: MemoryForm = {
  title: "",
  content: "",
  category: "other",
  project_id: "",
  client_id: "",
  folder_id: "",
};

function categoryLabel(value: Category) {
  return categories.find((item) => item.value === value)?.label ?? "Other";
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function StudioMemory() {
  const [rows, setRows] = useState<Memory[]>([]);
  const [projects, setProjects] = useState<RelatedOption[]>([]);
  const [clients, setClients] = useState<RelatedOption[]>([]);
  const [folders, setFolders] = useState<RelatedOption[]>([]);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<MemoryForm>(emptyForm);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setError("");
    try {
      const workspace = await getWorkspaceId();
      const [memoryResult, projectResult, clientResult, folderResult] = await Promise.all([
        supabase
          .from("memories")
          .select("id,title,content,category,project_id,client_id,folder_id,created_at,updated_at")
          .eq("workspace_id", workspace)
          .order("updated_at", { ascending: false }),
        supabase
          .from("projects")
          .select("id,name")
          .eq("workspace_id", workspace)
          .order("name"),
        supabase
          .from("clients")
          .select("id,name")
          .eq("workspace_id", workspace)
          .order("name"),
        supabase.from("folders").select("id,name").eq("workspace_id", workspace).order("name"),
      ]);

      if (memoryResult.error) throw memoryResult.error;
      if (projectResult.error) throw projectResult.error;
      if (clientResult.error) throw clientResult.error;
      if (folderResult.error) throw folderResult.error;

      setRows((memoryResult.data ?? []) as Memory[]);
      setProjects((projectResult.data ?? []) as RelatedOption[]);
      setClients((clientResult.data ?? []) as RelatedOption[]);
      setFolders((folderResult.data ?? []) as RelatedOption[]);
      const folderParam = new URLSearchParams(window.location.search).get("folderId");
      if (folderParam) setForm((current) => ({ ...current, folder_id: folderParam }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load Studio Memory.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return rows.filter((memory) => {
      const matchesCategory = filter === "all" || memory.category === filter;
      const matchesSearch =
        !term ||
        memory.title.toLowerCase().includes(term) ||
        memory.content.toLowerCase().includes(term);
      return matchesCategory && matchesSearch;
    });
  }, [rows, query, filter]);

  function openCreate() {
    setEditingId(null);
    const folderId = new URLSearchParams(window.location.search).get("folderId") || "";
    setForm({ ...emptyForm, folder_id: folders.some((folder) => folder.id === folderId) ? folderId : "" });
    setError("");
    setShowForm(true);
  }

  function openEdit(memory: Memory) {
    setEditingId(memory.id);
    setForm({
      title: memory.title,
      content: memory.content,
      category: memory.category,
      project_id: memory.project_id ?? "",
      client_id: memory.client_id ?? "",
      folder_id: memory.folder_id ?? "",
    });
    setError("");
    setShowForm(true);
  }

  function closeForm() {
    if (busy) return;
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
  }

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const title = form.title.trim();
    const content = form.content.trim();

    if (!title || !content) {
      setError("Title aur memory details dono required hain.");
      return;
    }

    setBusy(true);
    setError("");
    try {
      const workspace = await getWorkspaceId();
      const values = {
        title,
        content,
        category: form.category,
        project_id: form.project_id || null,
        client_id: form.client_id || null,
        folder_id: form.folder_id || null,
      };

      const result = editingId
        ? await supabase
            .from("memories")
            .update(values)
            .eq("id", editingId)
            .eq("workspace_id", workspace)
        : await supabase.from("memories").insert({
            ...values,
            workspace_id: workspace,
          });

      if (result.error) throw result.error;
      void recordActivity(editingId ? "memory_updated" : "memory_created", "memory", editingId, `${editingId ? "Updated" : "Saved"} memory: ${title}`);

      setShowForm(false);
      setEditingId(null);
      setForm(emptyForm);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save this memory.");
    } finally {
      setBusy(false);
    }
  }

  async function remove(memory: Memory) {
    if (!window.confirm(`Delete “${memory.title}”? This cannot be undone.`)) return;

    setError("");
    try {
      const workspace = await getWorkspaceId();
      const { error: deleteError } = await supabase
        .from("memories")
        .delete()
        .eq("id", memory.id)
        .eq("workspace_id", workspace);
      if (deleteError) throw deleteError;
      void recordActivity("memory_deleted", "memory", memory.id, `Deleted memory: ${memory.title}`);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not delete this memory.");
    }
  }

  const projectName = (id: string | null) =>
    projects.find((project) => project.id === id)?.name;
  const clientName = (id: string | null) =>
    clients.find((client) => client.id === id)?.name;

  return (
    <div className="page">
      <Header
        tag="KEEP THE THINKING"
        title="Studio Memory"
        desc="Keep the preferences, decisions, and lessons that make your work better."
        action={
          <button className="button" onClick={openCreate}>
            <Plus size={16} /> Save a memory
          </button>
        }
      />

      <section className="memoryintro">
        <BrainCircuit />
        <div>
          <b>Your studio’s shared context, in one place.</b>
          <p>
            Write down what matters. Memories are created and managed by your
            team — nothing is captured automatically.
          </p>
        </div>
        <span>{rows.length} {rows.length === 1 ? "MEMORY" : "MEMORIES"}</span>
      </section>

      {error && <div className="notice" role="alert">{error}</div>}

      <div className="toolbar">
        <Search size={16} />
        <input
          aria-label="Search memories"
          placeholder="Search titles and details…"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <Filter size={15} />
        <select
          aria-label="Filter by category"
          value={filter}
          onChange={(event) => setFilter(event.target.value)}
        >
          <option value="all">All categories</option>
          {categories.map((category) => (
            <option key={category.value} value={category.value}>
              {category.label}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="empty bigempty"><p>Loading your memories…</p></div>
      ) : filtered.length ? (
        <div className="cards">
          {filtered.map((memory) => {
            const project = projectName(memory.project_id);
            const client = clientName(memory.client_id);
            const folder = folders.find((item) => item.id === memory.folder_id)?.name;
            return (
              <article className="memory" key={memory.id}>
                <div className="memorytop">
                  <span>{categoryLabel(memory.category)}</span>
                  <div>
                    <button onClick={() => openEdit(memory)} aria-label={`Edit ${memory.title}`} title="Edit memory">
                      <Pencil size={15} />
                    </button>
                    <button onClick={() => void remove(memory)} aria-label={`Delete ${memory.title}`} title="Delete memory">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
                <h3>{memory.title}</h3>
                <p>{memory.content}</p>
                {(project || client || folder) && (
                  <div className="memoryrelations">
                    {project && <span>Project: {project}</span>}
                    {client && <span>Client: {client}</span>}
                    {folder && <span>Folder: {folder}</span>}
                  </div>
                )}
                <small>Updated {formatDate(memory.updated_at || memory.created_at)}</small>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="empty bigempty">
          <BrainCircuit />
          <b>{rows.length ? "No memories match this view." : "Give important context a home."}</b>
          <p>
            {rows.length
              ? "Try another search or category."
              : "Save a client preference, creative decision, or lesson learned."}
          </p>
          {rows.length === 0 && (
            <button className="button" onClick={openCreate}>
              <Plus size={15} /> Save your first memory
            </button>
          )}
        </div>
      )}

      {showForm && (
        <div className="overlay" role="presentation" onMouseDown={(event) => {
          if (event.target === event.currentTarget) closeForm();
        }}>
          <div className="modal" role="dialog" aria-modal="true" aria-labelledby="memory-form-title">
            <div className="modalhead">
              <h2 id="memory-form-title">{editingId ? "Edit memory" : "Save a memory"}</h2>
              <button onClick={closeForm} aria-label="Close" disabled={busy}><X /></button>
            </div>
            <form onSubmit={save}>
              <label>
                Title
                <input
                  required
                  maxLength={120}
                  value={form.title}
                  onChange={(event) => setForm({ ...form, title: event.target.value })}
                  placeholder="e.g. Client prefers minimal layouts"
                />
              </label>
              <label>
                Details
                <textarea
                  required
                  rows={5}
                  maxLength={10000}
                  value={form.content}
                  onChange={(event) => setForm({ ...form, content: event.target.value })}
                  placeholder="Write the context you want your studio to remember…"
                />
              </label>
              <label>
                Category
                <select
                  value={form.category}
                  onChange={(event) => setForm({ ...form, category: event.target.value as Category })}
                >
                  {categories.map((category) => (
                    <option key={category.value} value={category.value}>{category.label}</option>
                  ))}
                </select>
              </label>
              <label>
                Related project <span className="privacy">Optional</span>
                <select
                  value={form.project_id}
                  onChange={(event) => setForm({ ...form, project_id: event.target.value })}
                >
                  <option value="">No project</option>
                  {projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
                </select>
              </label>
              <label>
                Related client <span className="privacy">Optional</span>
                <select
                  value={form.client_id}
                  onChange={(event) => setForm({ ...form, client_id: event.target.value })}
                >
                  <option value="">No client</option>
                  {clients.map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}
                </select>
              </label>
              <label>Related company folder <span className="privacy">Optional</span><select value={form.folder_id} onChange={(event) => setForm({ ...form, folder_id: event.target.value })}><option value="">No folder</option>{folders.map((folder) => <option key={folder.id} value={folder.id}>{folder.name}</option>)}</select></label>
              <p className="privacy">Studio Memory is human-curated. Do not save passwords, payment details, or highly sensitive personal information.</p>
              <button className="button" disabled={busy}>
                {busy ? "Saving…" : editingId ? "Save changes" : "Save memory"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
