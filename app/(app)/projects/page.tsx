"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Plus, Search, X, FolderKanban, CalendarDays, ArrowUpRight, FileText, Trash2, RefreshCw, AlertTriangle } from "lucide-react";
import Header from "@/components/Header";
import { supabase } from "@/lib/supabase";
import { getWorkspaceId } from "@/lib/workspace";
import { recordActivity } from "@/lib/activity";
import { discardStorageCleanup, enqueueStorageCleanup, processStorageCleanup, type StorageCleanupJob } from "@/lib/storageCleanup";
type Project={id:string;name:string;description:string|null;status:string;due_date:string|null;created_at:string;client_id:string|null;company_id:string|null;folder_id:string|null};
type Client={id:string;name:string};
type Company={id:string;name:string};
type CompanyFolder={id:string;company_id:string;name:string};
const statuses=["planning","in_progress","on_hold","completed"];
export default function Projects(){
 const [rows,setRows]=useState<Project[]>([]);const [clients,setClients]=useState<Client[]>([]);const [companies,setCompanies]=useState<Company[]>([]);const [folders,setFolders]=useState<CompanyFolder[]>([]);const [companyId,setCompanyId]=useState("");const [folderId,setFolderId]=useState("");const [query,setQuery]=useState("");const [filter,setFilter]=useState("all");const [show,setShow]=useState(false);const [name,setName]=useState("");const [description,setDescription]=useState("");const [status,setStatus]=useState("planning");const [dueDate,setDueDate]=useState("");const [clientId,setClientId]=useState("");const [error,setError]=useState("");const [busy,setBusy]=useState(false);const [cleanupJobs,setCleanupJobs]=useState<StorageCleanupJob[]>([]);const [retrying,setRetrying]=useState<string|null>(null);
 async function load(){try{const workspace=await getWorkspaceId();const [p,c,j,companiesResult,foldersResult]=await Promise.all([supabase.from("projects").select("id,name,description,status,due_date,created_at,client_id,company_id,folder_id").eq("workspace_id",workspace).order("created_at",{ascending:false}),supabase.from("clients").select("id,name").eq("workspace_id",workspace).order("name"),supabase.from("storage_cleanup_jobs").select("id,workspace_id,storage_paths,created_at").eq("workspace_id",workspace).order("created_at",{ascending:true}),supabase.from("companies").select("id,name").eq("workspace_id",workspace).order("name"),supabase.from("company_folders").select("id,company_id,name").eq("workspace_id",workspace).order("name")]);if(p.error)throw p.error;if(c.error)throw c.error;if(j.error)throw j.error;if(companiesResult.error)throw companiesResult.error;if(foldersResult.error)throw foldersResult.error;setRows((p.data||[]) as Project[]);setClients((c.data||[]) as Client[]);setCleanupJobs((j.data||[]) as StorageCleanupJob[]);setCompanies((companiesResult.data||[]) as Company[]);setFolders((foldersResult.data||[]) as CompanyFolder[]);const params=new URLSearchParams(window.location.search);const companyParam=params.get("companyId")||"";const folderParam=params.get("folderId")||"";if(companyParam){setCompanyId(companyParam);setFolderId(folderParam)}}catch(e){setError(e instanceof Error?e.message:"Could not load projects.")}}
 useEffect(()=>{void load()},[]);
 async function add(e:React.FormEvent<HTMLFormElement>){e.preventDefault();setBusy(true);setError("");try{const workspace=await getWorkspaceId();const {data:auth}=await supabase.auth.getUser();const {data:created,error:e2}=await supabase.from("projects").insert({workspace_id:workspace,name:name.trim(),description:description.trim()||null,status,due_date:dueDate||null,client_id:clientId||null,company_id:companyId||null,folder_id:folderId||null,created_by:auth.user?.id}).select("id").single();if(e2)throw e2;if(created)void recordActivity("project_created","project",created.id,`Created project: ${name.trim()}`);setName("");setDescription("");setStatus("planning");setDueDate("");setClientId("");setCompanyId("");setFolderId("");setShow(false);await load()}catch(e){setError(e instanceof Error?e.message:"Could not save project.")}finally{setBusy(false)}}
 async function changeStatus(id:string,next:string){try{const workspace=await getWorkspaceId();const {error:e}=await supabase.from("projects").update({status:next}).eq("id",id).eq("workspace_id",workspace);if(e)throw e;void recordActivity("project_status_changed","project",id,`Updated project status to ${next.replace("_"," ")}`);await load()}catch(e){setError(e instanceof Error?e.message:"Could not update project.")}}
 async function removeProject(project:Project){
  if(!window.confirm("Permanently delete “"+project.name+"”? Its notes, tasks and attachments will also be removed. This cannot be undone."))return;
  setBusy(true);setError("");
  let jobId:string|null=null;
  try{
   const workspace=await getWorkspaceId();
   const {data:auth}=await supabase.auth.getUser();
   const {data:files,error:fileError}=await supabase.from("project_attachments").select("storage_path").eq("project_id",project.id).eq("workspace_id",workspace);
   if(fileError)throw fileError;
   const paths=(files||[]).map(file=>file.storage_path);
   if(paths.length)jobId=await enqueueStorageCleanup(workspace,paths,auth.user!.id);
   const {data:deleted,error:deleteError}=await supabase.from("projects").delete().eq("id",project.id).eq("workspace_id",workspace).select("id");
   if(deleteError)throw deleteError;
   if(!deleted?.length)throw new Error("Project was not deleted. Refresh and try again.");
   setRows(current=>current.filter(row=>row.id!==project.id));
   void recordActivity("project_deleted","project",project.id,"Deleted project: "+project.name);
   if(jobId){
    try{await processStorageCleanup(jobId,workspace);setCleanupJobs(current=>current.filter(job=>job.id!==jobId))}
    catch(cleanupError){setError(cleanupError instanceof Error?cleanupError.message:"Project deleted. Document cleanup is pending; retry it below.");await load()}
   }
  }catch(e){
   if(jobId){try{await discardStorageCleanup(jobId,await getWorkspaceId())}catch{/* keep the original failure visible */}}
   setError(e instanceof Error?e.message:"Could not delete project.");
  }finally{setBusy(false)}
 }
 async function retryCleanup(job:StorageCleanupJob){
  setRetrying(job.id);setError("");
  try{await processStorageCleanup(job.id,job.workspace_id);setCleanupJobs(current=>current.filter(item=>item.id!==job.id))}
  catch(e){setError(e instanceof Error?e.message:"Could not finish document cleanup. Retry again.")}
  finally{setRetrying(null)}
 }

 const filtered=useMemo(()=>rows.filter(p=>(filter==="all"||p.status===filter)&&(p.name+" "+(p.description||"")).toLowerCase().includes(query.toLowerCase())),[rows,filter,query]);
 const active=rows.filter(p=>p.status!=="completed").length;
 return <div className="page"><Header tag="MAKE THE WORK VISIBLE" title="Projects" desc="Every project has its own home for the brief, decisions and day-to-day work." action={<button className="button" onClick={()=>setShow(true)}><Plus size={16}/> New project</button>}/>{error&&<div className="notice" role="alert">{error}</div>}
 {cleanupJobs.length>0&&<section className="panel cleanup-panel"><div className="panelhead"><div><h3><AlertTriangle size={15}/> Document cleanup needs attention</h3><p>Projects were deleted safely. These private files still need removal.</p></div><span className="attachment-count">{cleanupJobs.length} PENDING</span></div>{cleanupJobs.map(job=><div className="cleanup-job" key={job.id}><span>{job.storage_paths.length} file{job.storage_paths.length===1?"":"s"} · queued {new Date(job.created_at).toLocaleString()}</span><button className="button button-light" disabled={retrying===job.id} onClick={()=>void retryCleanup(job)}><RefreshCw size={14}/>{retrying===job.id?"Retrying…":"Retry cleanup"}</button></div>)}</section>}
 <div className="stats project-stats"><div className="stat"><span><FolderKanban size={17}/></span><small>All projects</small><b>{rows.length}</b><i>Across your studio</i></div><div className="stat"><span><ArrowUpRight size={17}/></span><small>In motion</small><b>{active}</b><i>Not yet completed</i></div><div className="stat"><span><CheckCircle2Icon/></span><small>Completed</small><b>{rows.filter(p=>p.status==="completed").length}</b><i>Work delivered</i></div></div>
 <div className="toolbar"><Search size={16}/><input placeholder="Search projects…" value={query} onChange={e=>setQuery(e.target.value)}/><select value={filter} onChange={e=>setFilter(e.target.value)}><option value="all">All statuses</option>{statuses.map(s=><option key={s} value={s}>{s.replace("_"," ")}</option>)}</select></div>
 <div className="cards">{filtered.map(p=><article className="client project-card" key={p.id}><div className="project-card-top"><b className="letter big">{p.name.slice(0,1).toUpperCase()}</b><div className="project-card-actions"><span className="statuspill">{p.status.replace("_"," ")}</span><button type="button" className="project-card-delete" disabled={busy} onClick={()=>void removeProject(p)} aria-label={"Delete "+p.name} title="Delete project"><Trash2 size={14}/></button></div></div><h3>{p.name}</h3><p>{p.description||"No project description yet."}</p><div className="projectmeta"><CalendarDays size={13}/>{p.due_date?new Date(p.due_date+"T00:00:00").toLocaleDateString():"No due date"}<span className="project-client">{p.company_id?companies.find(c=>c.id===p.company_id)?.name||"Company":clients.find(c=>c.id===p.client_id)?.name||"Independent"}{p.folder_id?" · "+(folders.find(f=>f.id===p.folder_id)?.name||"Folder"):""}</span></div><label className="statuslabel">Update status<select value={p.status} onChange={e=>changeStatus(p.id,e.target.value)}>{statuses.map(s=><option key={s} value={s}>{s.replace("_"," ")}</option>)}</select></label><Link className="project-open-link" href={"/projects/"+p.id}>Open project workspace <ArrowUpRight size={15}/></Link></article>)}</div>
 {!filtered.length&&<div className="empty bigempty"><FolderKanban/><b>{rows.length?"No matching projects.":"Give your next idea a home."}</b><p>{rows.length?"Try another search or status.":"Create a project and keep its context in one place."}</p><button className="button" onClick={()=>setShow(true)}><Plus size={15}/> Create project</button></div>}
 {show&&<div className="overlay"><div className="modal"><div className="modalhead"><h2>Create a project</h2><button onClick={()=>setShow(false)} aria-label="Close"><X/></button></div><form onSubmit={add}><label>Project name<input required maxLength={100} value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. Aurea brand identity"/></label><label>Project brief<textarea rows={4} value={description} onChange={e=>setDescription(e.target.value)} placeholder="What are you creating? Include goals, scope and intended outcome."/></label><label>Client contact (optional)<select value={clientId} onChange={e=>setClientId(e.target.value)}><option value="">No contact linked</option>{clients.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label><label>Company<select value={companyId} onChange={e=>{setCompanyId(e.target.value);setFolderId("")}}><option value="">Independent project</option>{companies.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label>{companyId&&<label>Company folder<select value={folderId} onChange={e=>setFolderId(e.target.value)}><option value="">Company-level project (no folder)</option>{folders.filter(f=>f.company_id===companyId).map(f=><option key={f.id} value={f.id}>{f.name}</option>)}</select></label>}<label>Status<select value={status} onChange={e=>setStatus(e.target.value)}>{statuses.map(s=><option key={s} value={s}>{s.replace("_"," ")}</option>)}</select></label><label>Target date<input type="date" value={dueDate} onChange={e=>setDueDate(e.target.value)}/></label><button className="button" disabled={busy}>{busy?"Creating…":"Create project"}</button></form></div></div>}</div>;
}
function CheckCircle2Icon(){return <FileText size={17}/>}