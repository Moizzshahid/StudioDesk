"use client";
import { useEffect, useMemo, useState } from "react";
import { Plus, Search, X, ListTodo, CheckCircle2 } from "lucide-react";
import Header from "@/components/Header";
import { supabase } from "@/lib/supabase";
import { getWorkspaceId } from "@/lib/workspace";
import { recordActivity } from "@/lib/activity";

type Task={id:string;title:string;description:string|null;status:string;priority:string;due_date:string|null;project_id:string|null;created_at:string};
type Project={id:string;name:string};
const taskStatuses=["todo","in_progress","done"];
const priorities=["low","medium","high","urgent"];

export default function Tasks() {
 const [rows,setRows]=useState<Task[]>([]);
 const [projects,setProjects]=useState<Project[]>([]);
 const [query,setQuery]=useState("");
 const [filter,setFilter]=useState("all");
 const [show,setShow]=useState(false);
 const [title,setTitle]=useState("");
 const [description,setDescription]=useState("");
 const [priority,setPriority]=useState("medium");
 const [projectId,setProjectId]=useState("");
 const [dueDate,setDueDate]=useState("");
 const [error,setError]=useState("");
 const [busy,setBusy]=useState(false);
 async function load() {
  try {
   const workspace=await getWorkspaceId();
   const [t,p]=await Promise.all([
    supabase.from("tasks").select("id,title,description,status,priority,due_date,project_id,created_at").eq("workspace_id",workspace).order("created_at",{ascending:false}),
    supabase.from("projects").select("id,name").eq("workspace_id",workspace).order("name")
   ]);
   if(t.error) throw t.error;
   if(p.error) throw p.error;
   setRows((t.data||[]) as Task[]);setProjects((p.data||[]) as Project[]);
  } catch(e) {setError(e instanceof Error?e.message:"Could not load tasks.");}
 }
 useEffect(()=>{void load();},[]);
 async function add(e:React.FormEvent<HTMLFormElement>) {
  e.preventDefault();setBusy(true);setError("");
  try {
   const workspace=await getWorkspaceId();
   const {data:auth}=await supabase.auth.getUser();
   const {error:err}=await supabase.from("tasks").insert({workspace_id:workspace,title,description:description||null,priority,project_id:projectId||null,due_date:dueDate||null,created_by:auth.user?.id});
   if(err) throw err;
   setTitle("");setDescription("");setPriority("medium");setProjectId("");setDueDate("");setShow(false);await load();
  } catch(e) {setError(e instanceof Error?e.message:"Could not save task.");}
  finally {setBusy(false);}
 }
 async function updateStatus(id:string,status:string) {
  setError("");
  try {
   const workspace=await getWorkspaceId();
   const {error:err}=await supabase.from("tasks").update({status}).eq("id",id).eq("workspace_id",workspace);
   if(err) throw err;
   await load();
  } catch(e) {setError(e instanceof Error?e.message:"Could not update task.");}
 }
 async function remove(id:string) {
  if(!window.confirm("Delete this task?")) return;
  setError("");
  try {
   const workspace=await getWorkspaceId();
   const {error:err}=await supabase.from("tasks").delete().eq("id",id).eq("workspace_id",workspace);
   if(err) throw err;
   await load();
  } catch(e) {setError(e instanceof Error?e.message:"Could not delete task.");}
 }
 const filtered=useMemo(()=>rows.filter(t=>(filter==="all"||t.status===filter)&&(t.title+" "+(t.description||"")).toLowerCase().includes(query.toLowerCase())),[rows,filter,query]);
 const projectName=(id:string|null)=>projects.find(p=>p.id===id)?.name||"General";
 return <div className="page">
  <Header tag="SMALL STEPS, REAL MOMENTUM" title="Tasks" desc="Turn the next action into progress. Keep priorities visible." action={<button className="button" onClick={()=>setShow(true)}><Plus size={16}/> Add task</button>}/>
  {error&&<div className="notice">{error}</div>}
  <div className="toolbar"><Search size={16}/><input placeholder="Search tasks…" value={query} onChange={e=>setQuery(e.target.value)}/><select value={filter} onChange={e=>setFilter(e.target.value)}><option value="all">All tasks</option>{taskStatuses.map(s=><option key={s} value={s}>{s.replace("_"," ")}</option>)}</select></div>
  <section className="panel taskpanel"><div className="panelhead"><div><h3>Work queue</h3><p>{filtered.length} tasks shown · {rows.filter(t=>t.status!=="done").length} still open</p></div></div>
   {filtered.map(t=><article className="taskrow" key={t.id}><button className={t.status==="done"?"taskcheck checked":"taskcheck"} onClick={()=>updateStatus(t.id,t.status==="done"?"todo":"done")} aria-label={t.status==="done"?"Reopen task":"Complete task"}><CheckCircle2 size={19}/></button><div className="taskbody"><b className={t.status==="done"?"taskdone":""}>{t.title}</b><small>{projectName(t.project_id)}{t.due_date?" · Due "+new Date(t.due_date+"T00:00:00").toLocaleDateString():""}</small>{t.description&&<p>{t.description}</p>}</div><span className={"priority "+t.priority}>{t.priority}</span><select className="taskstatus" value={t.status} onChange={e=>updateStatus(t.id,e.target.value)} aria-label="Task status">{taskStatuses.map(s=><option key={s} value={s}>{s.replace("_"," ")}</option>)}</select><button className="deleteTask" onClick={()=>remove(t.id)} aria-label="Delete task">×</button></article>)}
   {!filtered.length&&<div className="empty"><ListTodo/><b>{rows.length?"No tasks match this view.":"A clear next step changes everything."}</b><p>{rows.length?"Try a different filter or search.":"Add your first task to create momentum."}</p><button className="button" onClick={()=>setShow(true)}><Plus size={15}/> Add task</button></div>}
  </section>
  {show&&<div className="overlay"><div className="modal"><div className="modalhead"><h2>Add a task</h2><button onClick={()=>setShow(false)} aria-label="Close"><X/></button></div><form onSubmit={add}><label>Task title<input required maxLength={140} value={title} onChange={e=>setTitle(e.target.value)} placeholder="What needs to happen next?"/></label><label>Details<textarea rows={3} value={description} onChange={e=>setDescription(e.target.value)}/></label><label>Project<select value={projectId} onChange={e=>setProjectId(e.target.value)}><option value="">General / unassigned</option>{projects.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></label><label>Priority<select value={priority} onChange={e=>setPriority(e.target.value)}>{priorities.map(p=><option key={p} value={p}>{p}</option>)}</select></label><label>Due date<input type="date" value={dueDate} onChange={e=>setDueDate(e.target.value)}/></label><button className="button" disabled={busy}>{busy?"Saving…":"Save task"}</button></form></div></div>}
 </div>;
}
