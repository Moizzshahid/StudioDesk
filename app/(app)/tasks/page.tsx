"use client";
import { useEffect, useMemo, useState } from "react";
import { Plus, Search, X, ListTodo, CheckCircle2, Pencil, CalendarDays, Clock3 } from "lucide-react";
import Header from "@/components/Header";
import { supabase } from "@/lib/supabase";
import { getWorkspaceId } from "@/lib/workspace";
import { recordActivity } from "@/lib/activity";

type Task={id:string;title:string;description:string|null;status:string;priority:string;due_date:string|null;created_at:string};
const taskStatuses=["todo","in_progress","done"];
const priorities=["low","medium","high","urgent"];

export default function Tasks() {
 const [rows,setRows]=useState<Task[]>([]);
 const [query,setQuery]=useState("");
 const [filter,setFilter]=useState("all");
 const [show,setShow]=useState(false);
 const [editingTask,setEditingTask]=useState<Task|null>(null);
 const [title,setTitle]=useState("");
 const [description,setDescription]=useState("");
 const [priority,setPriority]=useState("medium");
 const [dueDate,setDueDate]=useState("");
 const [error,setError]=useState("");
 const [busy,setBusy]=useState(false);
 async function load() {
  try {
   const workspace=await getWorkspaceId();
   const {data,error}=await supabase.from("tasks").select("id,title,description,status,priority,due_date,created_at").eq("workspace_id",workspace).is("project_id",null).order("created_at",{ascending:false});
   if(error) throw error;
   setRows((data||[]) as Task[]);
  } catch(e) {setError(e instanceof Error?e.message:"Could not load tasks.");}
 }
 useEffect(()=>{void load();},[]);
 async function add(e:React.FormEvent<HTMLFormElement>) {
  e.preventDefault();setBusy(true);setError("");
  try {
   const workspace=await getWorkspaceId();
   const {data:auth}=await supabase.auth.getUser();
   const payload={title:title.trim(),description:description.trim()||null,priority,project_id:null,due_date:dueDate||null};
   if(editingTask){
    const {error:err}=await supabase.from("tasks").update(payload).eq("id",editingTask.id).eq("workspace_id",workspace);
    if(err)throw err;
    void recordActivity("task_updated","task",editingTask.id,"Updated task: "+title.trim());
   }else{
    const {data:created,error:err}=await supabase.from("tasks").insert({...payload,workspace_id:workspace,created_by:auth.user?.id}).select("id").single();
    if(err)throw err;
    if(created)void recordActivity("task_created","task",created.id,"Created task: "+title.trim());
   }
   setTitle("");setDescription("");setPriority("medium");setDueDate("");setEditingTask(null);setShow(false);await load();
  } catch(e) {setError(e instanceof Error?e.message:"Could not save task.");}
  finally {setBusy(false);}
 }
 async function updateStatus(id:string,status:string) {
  setError("");
  try {
   const workspace=await getWorkspaceId();
   const {error:err}=await supabase.from("tasks").update({status}).eq("id",id).eq("workspace_id",workspace);
   if(err) throw err;
   const task=rows.find((item)=>item.id===id);
   void recordActivity(status==="done"?"task_completed":"task_updated","task",id,`${status==="done"?"Completed":"Updated"} task: ${task?.title || "Task"}`);
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
   const task=rows.find((item)=>item.id===id);
   void recordActivity("task_deleted","task",id,`Deleted task: ${task?.title || "Task"}`);
   await load();
  } catch(e) {setError(e instanceof Error?e.message:"Could not delete task.");}
 }
 const filtered=useMemo(()=>rows.filter(t=>(filter==="all"||t.status===filter)&&(t.title+" "+(t.description||"")).toLowerCase().includes(query.toLowerCase())),[rows,filter,query]);
 return <div className="page">
  <Header tag="SMALL STEPS, REAL MOMENTUM" title="Tasks" desc="Turn the next action into progress. Keep priorities visible." action={<button className="button" onClick={()=>setShow(true)}><Plus size={16}/> Add task</button>}/>
  {error&&<div className="notice">{error}</div>}
  <div className="toolbar"><Search size={16}/><input placeholder="Search tasks…" value={query} onChange={e=>setQuery(e.target.value)}/><select value={filter} onChange={e=>setFilter(e.target.value)}><option value="all">All tasks</option>{taskStatuses.map(s=><option key={s} value={s}>{s.replace("_"," ")}</option>)}</select></div>
  <section className="panel taskpanel"><div className="panelhead"><div><h3>Work queue</h3><p>{filtered.length} tasks shown · {rows.filter(t=>t.status!=="done").length} still open</p></div></div>
   {filtered.map(t=><article className="taskrow" key={t.id}><button className={t.status==="done"?"taskcheck checked":"taskcheck"} onClick={()=>updateStatus(t.id,t.status==="done"?"todo":"done")} aria-label={t.status==="done"?"Reopen task":"Complete task"}><CheckCircle2 size={19}/></button><div className="taskbody"><b className={t.status==="done"?"taskdone":""}>{t.title}</b><small>Workspace task{t.due_date?" · Due "+new Date(t.due_date+"T00:00:00").toLocaleDateString():""}</small>{t.description&&<p>{t.description}</p>}</div><span className={"priority "+t.priority}>{t.priority}</span><button className="task-edit-button" onClick={()=>{setEditingTask(t);setTitle(t.title);setDescription(t.description||"");setPriority(t.priority);setDueDate(t.due_date||"");setShow(true)}} aria-label={"Edit "+t.title} title="Edit task"><Pencil size={14}/></button><select className="taskstatus" value={t.status} onChange={e=>updateStatus(t.id,e.target.value)} aria-label="Task status">{taskStatuses.map(s=><option key={s} value={s}>{s.replace("_"," ")}</option>)}</select><button className="deleteTask" onClick={()=>remove(t.id)} aria-label="Delete task">×</button></article>)}
   {!filtered.length&&<div className="empty"><ListTodo/><b>{rows.length?"No tasks match this view.":"A clear next step changes everything."}</b><p>{rows.length?"Try a different filter or search.":"Add your first task to create momentum."}</p><button className="button" onClick={()=>setShow(true)}><Plus size={15}/> Add task</button></div>}
  </section>
  {show&&<div className="overlay"><div className="modal"><div className="modalhead"><h2>{editingTask?"Edit task":"Add a task"}</h2><button onClick={()=>{setShow(false);setEditingTask(null)}} aria-label="Close"><X/></button></div><form onSubmit={add}><label>Task title<input required maxLength={140} value={title} onChange={e=>setTitle(e.target.value)} placeholder="What needs to happen next?"/></label><label>Details<textarea rows={3} value={description} onChange={e=>setDescription(e.target.value)}/></label><label>Priority<select value={priority} onChange={e=>setPriority(e.target.value)}>{priorities.map(p=><option key={p} value={p}>{p}</option>)}</select></label><label>Due date<input type="date" value={dueDate} onChange={e=>setDueDate(e.target.value)}/></label><button className="button" disabled={busy}>{busy?"Saving…":editingTask?"Save changes":"Save task"}</button></form></div></div>}
 </div>;
}
