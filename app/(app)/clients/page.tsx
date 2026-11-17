"use client";

import { useEffect, useState } from "react";
import { Plus, X, Mail } from "lucide-react";
import Header from "@/components/Header";
import { supabase } from "@/lib/supabase";
import { getWorkspaceId } from "@/lib/workspace";

type Client = { id: string; name: string; company: string | null; email: string | null; notes: string | null };

export default function Clients() {
  const [rows, setRows] = useState<Client[]>([]);
  const [show, setShow] = useState(false);
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");

  async function load() {
    try {
      const workspace = await getWorkspaceId();
      const { data, error: queryError } = await supabase.from("clients").select("*").eq("workspace_id", workspace).order("created_at", { ascending: false });
      if (queryError) throw queryError;
      setRows(data || []);
    } catch (e) { setError(e instanceof Error ? e.message : "Could not load clients."); }
  }
  useEffect(() => { load(); }, []);

  async function add(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      const workspace = await getWorkspaceId();
      const { error: insertError } = await supabase.from("clients").insert({ workspace_id: workspace, name, company: company || null, email: email || null, notes: notes || null });
      if (insertError) throw insertError;
      setName(""); setCompany(""); setEmail(""); setNotes(""); setShow(false); await load();
    } catch (e) { setError(e instanceof Error ? e.message : "Could not save client."); }
  }

  return <div className="page">
    <Header tag="RELATIONSHIPS" title="Clients" desc="The people behind the work deserve a thoughtful experience." action={<button className="button" onClick={() => setShow(true)}><Plus size={16} /> Add client</button>} />
    {error && <div className="notice">{error}</div>}
    <div className="cards">{rows.map(client => <article className="client" key={client.id}><b className="letter big">{client.name[0]}</b><h3>{client.name}</h3><p>{client.company || "Independent client"}</p>{client.email && <a href={`mailto:${client.email}`}><Mail size={14} />{client.email}</a>}{client.notes && <blockquote>{client.notes}</blockquote>}</article>)}</div>
    {!rows.length && <div className="empty bigempty"><b>Relationships start here.</b><p>Add a client to connect people with your work.</p><button className="button" onClick={() => setShow(true)}><Plus size={15} /> Add client</button></div>}
    {show && <div className="overlay"><div className="modal"><div className="modalhead"><h2>Add a client</h2><button onClick={() => setShow(false)} aria-label="Close"><X /></button></div><form onSubmit={add}><label>Client name<input required value={name} onChange={e => setName(e.target.value)} /></label><label>Company<input value={company} onChange={e => setCompany(e.target.value)} /></label><label>Email<input type="email" value={email} onChange={e => setEmail(e.target.value)} /></label><label>Internal notes<textarea value={notes} onChange={e => setNotes(e.target.value)} /></label><button className="button">Save client</button></form></div></div>}
  </div>;
}
