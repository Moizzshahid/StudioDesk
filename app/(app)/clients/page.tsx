"use client";

import { useEffect, useMemo, useState } from "react";
import { Mail, Pencil, Plus, Search, Trash2, X } from "lucide-react";
import Header from "@/components/Header";
import { supabase } from "@/lib/supabase";
import { getWorkspaceId } from "@/lib/workspace";

type Client = {
  id: string;
  name: string;
  company: string | null;
  email: string | null;
  notes: string | null;
  created_at: string;
};
type ClientForm = { name: string; company: string; email: string; notes: string };
const emptyForm: ClientForm = { name: "", company: "", email: "", notes: "" };

export default function Clients() {
  const [rows, setRows] = useState<Client[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [show, setShow] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ClientForm>(emptyForm);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    setError("");
    try {
      const workspace = await getWorkspaceId();
      const { data, error: queryError } = await supabase
        .from("clients")
        .select("id,name,company,email,notes,created_at")
        .eq("workspace_id", workspace)
        .order("created_at", { ascending: false });
      if (queryError) throw queryError;
      setRows((data ?? []) as Client[]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load clients.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return rows;
    return rows.filter((client) =>
      [client.name, client.company, client.email, client.notes]
        .some((value) => value?.toLowerCase().includes(term))
    );
  }, [rows, query]);

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setError("");
    setShow(true);
  }

  function openEdit(client: Client) {
    setEditingId(client.id);
    setForm({
      name: client.name,
      company: client.company ?? "",
      email: client.email ?? "",
      notes: client.notes ?? "",
    });
    setError("");
    setShow(true);
  }

  function closeForm() {
    if (busy) return;
    setShow(false);
    setEditingId(null);
    setForm(emptyForm);
  }

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = form.name.trim();
    if (!name) {
      setError("Client name is required.");
      return;
    }

    setBusy(true);
    setError("");
    try {
      const workspace = await getWorkspaceId();
      const values = {
        name,
        company: form.company.trim() || null,
        email: form.email.trim() || null,
        notes: form.notes.trim() || null,
      };
      const result = editingId
        ? await supabase.from("clients").update(values)
            .eq("id", editingId).eq("workspace_id", workspace)
        : await supabase.from("clients").insert({ ...values, workspace_id: workspace });
      if (result.error) throw result.error;
      closeForm();
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save client.");
    } finally {
      setBusy(false);
    }
  }

  async function remove(client: Client) {
    if (!window.confirm(`Delete "${client.name}"? Related project and memory links may be cleared.`)) return;
    setError("");
    try {
      const workspace = await getWorkspaceId();
      const { error: deleteError } = await supabase.from("clients")
        .delete().eq("id", client.id).eq("workspace_id", workspace);
      if (deleteError) throw deleteError;
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not delete client.");
    }
  }

  return (
    <div className="page">
      <Header
        tag="RELATIONSHIPS"
        title="Clients"
        desc="The people behind the work deserve a thoughtful experience."
        action={<button className="button" onClick={openCreate}><Plus size={16} /> Add client</button>}
      />
      {error && <div className="notice" role="alert">{error}</div>}
      <div className="toolbar">
        <Search size={16} />
        <input aria-label="Search clients" placeholder="Search name, company, email, or notes…" value={query} onChange={(event) => setQuery(event.target.value)} />
      </div>

      {loading ? (
        <div className="empty bigempty"><p>Loading your clients…</p></div>
      ) : filtered.length ? (
        <div className="cards">
          {filtered.map((client) => (
            <article className="client" key={client.id}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <b className="letter big">{client.name.slice(0, 1).toUpperCase()}</b>
                <div className="memorytop">
                  <button onClick={() => openEdit(client)} aria-label={`Edit ${client.name}`} title="Edit client"><Pencil size={15} /></button>
                  <button onClick={() => void remove(client)} aria-label={`Delete ${client.name}`} title="Delete client"><Trash2 size={15} /></button>
                </div>
              </div>
              <h3>{client.name}</h3>
              <p>{client.company || "Independent client"}</p>
              {client.email && <a href={`mailto:${client.email}`}><Mail size={14} />{client.email}</a>}
              {client.notes && <blockquote>{client.notes}</blockquote>}
            </article>
          ))}
        </div>
      ) : (
        <div className="empty bigempty">
          <b>{rows.length ? "No clients match this search." : "Relationships start here."}</b>
          <p>{rows.length ? "Try another name, company, or email." : "Add a client to connect people with your work."}</p>
          {!rows.length && <button className="button" onClick={openCreate}><Plus size={15} /> Add client</button>}
        </div>
      )}

      {show && (
        <div className="overlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) closeForm(); }}>
          <div className="modal" role="dialog" aria-modal="true" aria-labelledby="client-form-title">
            <div className="modalhead">
              <h2 id="client-form-title">{editingId ? "Edit client" : "Add a client"}</h2>
              <button onClick={closeForm} aria-label="Close" disabled={busy}><X /></button>
            </div>
            <form onSubmit={save}>
              <label>Client name<input required maxLength={120} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></label>
              <label>Company<input maxLength={160} value={form.company} onChange={(event) => setForm({ ...form, company: event.target.value })} /></label>
              <label>Email<input type="email" maxLength={254} value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></label>
              <label>Internal notes<textarea rows={4} maxLength={5000} value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} /></label>
              <p className="privacy">Keep sensitive personal and payment information out of internal notes.</p>
              <button className="button" disabled={busy}>{busy ? "Saving…" : editingId ? "Save changes" : "Save client"}</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
