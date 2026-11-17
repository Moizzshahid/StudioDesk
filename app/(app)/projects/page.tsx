"use client";
import { useEffect, useMemo, useState } from "react";
import { Plus, Search, X, FolderKanban, CalendarDays } from "lucide-react";
import Header from "@/components/Header";
import { supabase } from "@/lib/supabase";
import { getWorkspaceId } from "@/lib/workspace";

type Project = { id:string; name:string; description:string|null; status:string; due_date:string|null; created_at:string };
const statuses = ["planning","in_progress","on_hold","completed"];

export default function Projects() {
 const [rows,setRows]=useState<Project[]>([]);
 const [query,setQuery]=useState("");
 const [filter,setFilter]=useState("all");
 const [show,setShow]=useState(false);
 const [name,setName]=useState("");
 const [description,setDescription]=useState("");
 const [status,setStatus]=useState("planning");
 const [dueDate,setDueDate]=useState("");
 const [error,setError]=useState("");
 const [busy,setBusy]=useState(false);
 async function load() {
  try {
   const workspace=await getWorkspaceId();
   const {data,error:err}=await supabase.from("projects").select("id,name,description,status,due_date,created_at").eq("workspace_id",workspace).order("created_at",{ascending:false});
   if(err) throw err;
   setRows((data||[]) as Project[]);
  } catch(e) {setError(e instanceof Error?e.message:"Could not load projects.");}
 }
 useEffect(()=>{void load();},[]);
 async function add(e:React.FormEvent<HTMLFormElement>) {
  e.preventDefault();setBusy(true);setError("");
  try {
   const workspace=await getWorkspaceId();
   const {data:auth}=await supabase.auth.getUser();
   const {error:err}=await supabase.from("projects").insert({workspace_id:workspace,name,description:description||null,status,due_date:dueDate||null,created_by:auth.user?.id});
   if(err) throw err;
   setName("");setDescription("");setStatus("planning");setDueDate("");setShow(false);await load();
  } catch(e) {setError(e instanceof Error?e.message:"Could not save project.");}
  finally {setBusy(false);}
 }
 async function changeStatus(id:string,next:string) {
  const {error:err}=await supabase.from("projects").update({status:next}).eq("id",id);
  if(err) setError(err.message); else await load();
 }
 const filtered=useMemo(()=>rows.filter(p=>(filter==="all"||p.status===filter)&&(p.name+" "+(p.description||"")).toLowerCase().includes(query.toLowerCase())),[rows,filter,query]);
 return <div className="page">
  <Header tag="MAKE THE WORK VISIBLE" title="Projects" desc="A clear view of the work, its momentum, and what comes next." action={<button className="button" onClick={()=>setShow(true)}><Plus size={16}/> New project</button>}/>
  {error&&<div className="notice">{error}</div>}
  <div className="toolbar"><Search size={16}/><input placeholder="Search projects…" value={query} onChange={e=>setQuery(e.target.value)}/><select value={filter} onChange={e=>setFilter(e.target.value)}><option value="all">All statuses</option>{statuses.map(s=><option key={s} value={s}>{s.replace("_"," ")}</option>)}</select></div>
  <div className="cards">{filtered.map(p=><article className="client" key={p.id}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}><b className="letter big">{p.name.slice(0,1).toUpperCase()}</b><span className="statuspill">{p.status.replace("_"," ")}</span></div><h3>{p.name}</h3><p>{p.description||"No project description yet."}</p><div className="projectmeta"><CalendarDays size={13}/>{p.due_date?new Date(p.due_date+"T00:00:00").toLocaleDateString():"No due date"}</div><label className="statuslabel">Update status<select value={p.status} onChange={e=>changeStatus(p.id,e.target.value)}>{statuses.map(s=><option key={s} value={s}>{s.replace("_"," ")}</option>)}</select></label></article>)}</div>
  {!filtered.length&&<div className="empty bigempty"><FolderKanban/><b>{rows.length?"No matching projects.":"Give your next idea a home."}</b><p>{rows.length?"Try another search or status.":"Create a project and keep its context in one place."}</p><button className="button" onClick={()=>setShow(true)}><Plus size={15}/> Create project</button></div>}
  {show&&<div className="overlay"><div className="modal"><div className="modalhead"><h2>Create a project</h2><button onClick={()=>setShow(false)} aria-label="Close"><X/></button></div><form onSubmit={add}><label>Project name<input required maxLength={100} value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. Aurea brand identity"/></label><label>Description<textarea rows={3} value={description} onChange={e=>setDescription(e.target.value)} placeholder="What are you creating?"/></label><label>Status<select value={status} onChange={e=>setStatus(e.target.value)}>{statuses.map(s=><option key={s} value={s}>{s.replace("_"," ")}</option>)}</select></label><label>Target date<input type="date" value={dueDate} onChange={e=>setDueDate(e.target.value)}/></label><button className="button" disabled={busy}>{busy?"Creating…":"Create project"}</button></form></div></div>}
 </div>;
}
