"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, CalendarDays, CheckCircle2, ExternalLink, FileText, Link2, Plus, Search, Trash2, X } from "lucide-react";
import Header from "@/components/Header";
import { supabase } from "@/lib/supabase";
import { getWorkspaceId } from "@/lib/workspace";

type Project = { id:string; name:string; description:string|null; status:string; due_date:string|null; client_id:string|null; created_at:string; updated_at:string };
type RecordRow = { id:string; record_type:string; title:string; content:string|null; url:string|null; created_at:string };
type Task = { id:string; title:string; status:string; priority:string; due_date:string|null };
type Client = { id:string; name:string; company:string|null };
const kinds = ["brief","note","decision","meeting","link","deliverable","update"];
const statuses = ["planning","in_progress","on_hold","completed"];
const labels:Record<string,string> = {brief:"Project brief",note:"Note",decision:"Decision",meeting:"Meeting",link:"Reference link",deliverable:"Deliverable",update:"Progress update"};
function date(value:string|null){return value?new Date(value+"T00:00:00").toLocaleDateString(undefined,{month:"short",day:"numeric",year:"numeric"}):"Not set";}
export default function ProjectDetail(){
 const params=useParams<{id:string}>(); const id=params.id;
 const [project,setProject]=useState<Project|null>(null); const [records,setRecords]=useState<RecordRow[]>([]); const [tasks,setTasks]=useState<Task[]>([]); const [client,setClient]=useState<Client|null>(null);
 const [loading,setLoading]=useState(true); const [error,setError]=useState(""); const [show,setShow]=useState(false); const [kind,setKind]=useState("note"); const [title,setTitle]=useState(""); const [content,setContent]=useState(""); const [url,setUrl]=useState(""); const [busy,setBusy]=useState(false); const [query,setQuery]=useState("");
 const load=useCallback(async()=>{setError("");try{const workspace=await getWorkspaceId();const [p,r,t]=await Promise.all([
 supabase.from("projects").select("id,name,description,status,due_date,client_id,created_at,updated_at").eq("id",id).eq("workspace_id",workspace).single(),
 supabase.from("project_records").select("id,record_type,title,content,url,created_at").eq("project_id",id).eq("workspace_id",workspace).order("created_at",{ascending:false}),
 supabase.from("tasks").select("id,title,status,priority,due_date").eq("project_id",id).eq("workspace_id",workspace).order("created_at",{ascending:false})
 ]);if(p.error)throw p.error;if(r.error)throw r.error;if(t.error)throw t.error;setProject(p.data as Project);setRecords((r.data||[]) as RecordRow[]);setTasks((t.data||[]) as Task[]);if(p.data.client_id){const c=await supabase.from("clients").select("id,name,company").eq("id",p.data.client_id).eq("workspace_id",workspace).maybeSingle();if(c.error)throw c.error;setClient(c.data as Client|null)}else setClient(null);
 }catch(e){setError(e instanceof Error?e.message:"Could not load this project.");}finally{setLoading(false)}},[id]);
 useEffect(()=>{void load()},[load]);
 async function save(e:React.FormEvent<HTMLFormElement>){e.preventDefault();setBusy(true);setError("");try{const workspace=await getWorkspaceId();const auth=await supabase.auth.getUser();const {error:e2}=await supabase.from("project_records").insert({workspace_id:workspace,project_id:id,record_type:kind,title:title.trim(),content:content.trim()||null,url:url.trim()||null,created_by:auth.data.user?.id});if(e2)throw e2;setTitle("");setContent("");setUrl("");setKind("note");setShow(false);await load()}catch(e){setError(e instanceof Error?e.message:"Could not save record.")}finally{setBusy(false)}}
 async function remove(record:RecordRow){if(!window.confirm("Delete this project record?"))return;try{const workspace=await getWorkspaceId();const {error:e}=await supabase.from("project_records").delete().eq("id",record.id).eq("workspace_id",workspace);if(e)throw e;await load()}catch(e){setError(e instanceof Error?e.message:"Could not delete record.")}}
 async function updateStatus(status:string){if(!project)return;try{const workspace=await getWorkspaceId();const {error:e}=await supabase.from("projects").update({status}).eq("id",id).eq("workspace_id",workspace);if(e)throw e;await load()}catch(e){setError(e instanceof Error?e.message:"Could not update status.")}}
 const visible=useMemo(()=>records.filter(r=>(r.title+" "+(r.content||"")).toLowerCase().includes(query.toLowerCase())),[records,query]);
 if(loading)return <div className="page"><div className="empty bigempty">Loading project workspace…</div></div>;
 if(!project)return <div className="page"><Link className="backlink" href="/projects"><ArrowLeft size={16}/> Back to projects</Link><div className="notice">{error||"Project not found."}</div></div>;
 const completed=tasks.filter(t=>t.status==="done").length;
 return <div className="page">
 <Link className="backlink" href="/projects"><ArrowLeft size={16}/> All projects</Link>
 <Header tag="PROJECT WORKSPACE" title={project.name} desc={project.description||"A dedicated space for the brief, decisions, working notes and next steps."} action={<button className="button" onClick={()=>setShow(true)}><Plus size={16}/> Add record</button>}/>
 {error&&<div className="notice" role="alert">{error}</div>}
 <section className="project-overview">
 <div className="project-overview-main"><div className="project-overview-top"><span className="statuspill">{project.status.replace("_"," ")}</span><label className="statuslabel">Status <select value={project.status} onChange={e=>updateStatus(e.target.value)}>{statuses.map(s=><option key={s} value={s}>{s.replace("_"," ")}</option>)}</select></label></div><h2>Project at a glance</h2><p>{project.description||"Add a clear project description to give everyone the context they need."}</p><div className="project-facts"><span><CalendarDays size={15}/> Due {date(project.due_date)}</span><span><FileText size={15}/> {records.length} saved records</span><span><CheckCircle2 size={15}/> {completed}/{tasks.length} tasks complete</span></div></div>
 <aside className="project-side-fact"><small>CLIENT</small><b>{client?.name||"Independent project"}</b><span>{client?.company||"No client linked"}</span><small>CREATED</small><b>{date(project.created_at.slice(0,10))}</b></aside>
 </section>
 <div className="project-detail-grid">
 <section className="panel project-records"><div className="panelhead"><div><h3>Project records</h3><p>Briefs, notes, decisions, meetings and references — all in context</p></div><button className="button button-light" onClick={()=>{setKind("note");setShow(true)}}><Plus size={15}/> Add</button></div>
 <div className="toolbar"><Search size={15}/><input placeholder="Find a record…" value={query} onChange={e=>setQuery(e.target.value)}/></div>
 {visible.length?visible.map(r=><article className="record-item" key={r.id}><div className="record-icon"><FileText size={17}/></div><div className="record-content"><div className="record-meta"><span>{labels[r.record_type]||"Record"}</span><time>{new Date(r.created_at).toLocaleDateString(undefined,{month:"short",day:"numeric",year:"numeric"})}</time></div><h4>{r.title}</h4>{r.content&&<p>{r.content}</p>}{r.url&&<a href={r.url} target="_blank" rel="noreferrer"><Link2 size={13}/> Open reference <ExternalLink size={12}/></a>}</div><button className="record-delete" onClick={()=>void remove(r)} aria-label={"Delete "+r.title}><Trash2 size={15}/></button></article>):<div className="empty"><FileText/><b>{records.length?"No records match.":"The project’s memory starts here."}</b><p>Save the original brief, a client note, an important decision or a useful link.</p><button className="button" onClick={()=>setShow(true)}><Plus size={15}/> Add first record</button></div>}
 </section>
 <aside className="panel project-task-panel"><div className="panelhead"><div><h3>Project tasks</h3><p>{completed} of {tasks.length} completed</p></div><Link href="/tasks">All tasks ↗</Link></div>
 <div className="progress-track"><span style={{width:tasks.length?((completed/tasks.length)*100)+"%":"0%"}}/></div>
 {tasks.slice(0,8).map(t=><div className="project-task-row" key={t.id}><span className={t.status==="done"?"task-dot done":"task-dot"}/><div><b className={t.status==="done"?"taskdone":""}>{t.title}</b><small>{t.priority} priority · {t.due_date?"Due "+date(t.due_date):"No due date"}</small></div></div>)}
 {!tasks.length&&<div className="empty"><CheckCircle2/><b>No tasks linked yet</b><p>Create a task and assign it to this project.</p><Link href="/tasks">Go to tasks ↗</Link></div>}
 </aside></div>
 {show&&<div className="overlay" onMouseDown={e=>{if(e.target===e.currentTarget&&!busy)setShow(false)}}><div className="modal" role="dialog" aria-modal="true"><div className="modalhead"><h2>Add to project</h2><button onClick={()=>setShow(false)} aria-label="Close"><X/></button></div><form onSubmit={save}><label>Record type<select value={kind} onChange={e=>setKind(e.target.value)}>{kinds.map(k=><option key={k} value={k}>{labels[k]}</option>)}</select></label><label>Title<input required maxLength={160} value={title} onChange={e=>setTitle(e.target.value)} placeholder="e.g. Initial brand direction"/></label><label>Details<textarea rows={5} maxLength={12000} value={content} onChange={e=>setContent(e.target.value)} placeholder="Capture the context, outcome, next steps or key details…"/></label>{kind==="link"&&<label>Reference URL<input type="url" value={url} onChange={e=>setUrl(e.target.value)} placeholder="https://…"/></label>}<p className="privacy">Records are saved to this project and visible to workspace members.</p><button className="button" disabled={busy}>{busy?"Saving…":"Save record"}</button></form></div></div>}
 </div>
}
