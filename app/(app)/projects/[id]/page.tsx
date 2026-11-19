"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, CalendarDays, CheckCircle2, Download, ExternalLink, FileText, Link2, Plus, Search, Trash2, Upload, X, RefreshCw, AlertTriangle } from "lucide-react";
import Header from "@/components/Header";
import { supabase } from "@/lib/supabase";
import { getWorkspaceId } from "@/lib/workspace";
import { recordActivity } from "@/lib/activity";
import { discardStorageCleanup, enqueueStorageCleanup, processStorageCleanup, type StorageCleanupJob } from "@/lib/storageCleanup";

type Project = { id:string; name:string; description:string|null; status:string; due_date:string|null; client_id:string|null; company_id:string|null; folder_id:string|null; created_at:string; updated_at:string };
type RecordRow = { id:string; record_type:string; title:string; content:string|null; url:string|null; created_at:string };
type Task = { id:string; title:string; status:string; priority:string; due_date:string|null };
type Client = { id:string; name:string; company:string|null };
type Company = { id:string; name:string };
type CompanyFolder = { id:string; company_id:string; name:string };
type Attachment = { id:string; file_name:string; storage_path:string; mime_type:string; file_size:number; description:string|null; created_at:string };
const kinds = ["brief","note","decision","meeting","link","deliverable","update"];
const statuses = ["planning","in_progress","on_hold","completed"];
const labels:Record<string,string> = {brief:"Project brief",note:"Note",decision:"Decision",meeting:"Meeting",link:"Reference link",deliverable:"Deliverable",update:"Progress update"};
function date(value:string|null){return value?new Date(value+"T00:00:00").toLocaleDateString(undefined,{month:"short",day:"numeric",year:"numeric"}):"Not set";}
export default function ProjectDetail(){
 const params=useParams<{id:string}>(); const id=params.id;
 const [project,setProject]=useState<Project|null>(null); const [records,setRecords]=useState<RecordRow[]>([]); const [tasks,setTasks]=useState<Task[]>([]); const [client,setClient]=useState<Client|null>(null); const [company,setCompany]=useState<Company|null>(null); const [folder,setFolder]=useState<CompanyFolder|null>(null);
 const [loading,setLoading]=useState(true); const [error,setError]=useState(""); const [show,setShow]=useState(false); const [editingRecord,setEditingRecord]=useState<RecordRow|null>(null); const [editProjectOpen,setEditProjectOpen]=useState(false); const [projectName,setProjectName]=useState(""); const [projectDescription,setProjectDescription]=useState(""); const [projectDueDate,setProjectDueDate]=useState(""); const [projectClientId,setProjectClientId]=useState(""); const [projectCompanyId,setProjectCompanyId]=useState(""); const [projectFolderId,setProjectFolderId]=useState(""); const [clients,setClients]=useState<Client[]>([]); const [companies,setCompanies]=useState<Company[]>([]); const [folders,setFolders]=useState<CompanyFolder[]>([]); const [kind,setKind]=useState("note"); const [title,setTitle]=useState(""); const [content,setContent]=useState(""); const [url,setUrl]=useState(""); const [busy,setBusy]=useState(false); const [query,setQuery]=useState("");
 const [attachments,setAttachments]=useState<Attachment[]>([]); const [cleanupJobs,setCleanupJobs]=useState<StorageCleanupJob[]>([]); const [retryingCleanup,setRetryingCleanup]=useState<string|null>(null); const [fileDescription,setFileDescription]=useState(""); const [uploading,setUploading]=useState(false); const [fileError,setFileError]=useState("");
 const load=useCallback(async()=>{setError("");try{const workspace=await getWorkspaceId();const [p,r,t,a,j]=await Promise.all([
 supabase.from("projects").select("id,name,description,status,due_date,client_id,company_id,folder_id,created_at,updated_at").eq("id",id).eq("workspace_id",workspace).single(),
 supabase.from("project_records").select("id,record_type,title,content,url,created_at").eq("project_id",id).eq("workspace_id",workspace).order("created_at",{ascending:false}),
 supabase.from("tasks").select("id,title,status,priority,due_date").eq("project_id",id).eq("workspace_id",workspace).order("created_at",{ascending:false}),
 supabase.from("project_attachments").select("id,file_name,storage_path,mime_type,file_size,description,created_at").eq("project_id",id).eq("workspace_id",workspace).order("created_at",{ascending:false}),
 supabase.from("storage_cleanup_jobs").select("id,workspace_id,storage_paths,created_at").eq("workspace_id",workspace).order("created_at",{ascending:true})
 ]);if(p.error)throw p.error;if(r.error)throw r.error;if(t.error)throw t.error;if(a.error)throw a.error;if(j.error)throw j.error;setProject(p.data as Project);setRecords((r.data||[]) as RecordRow[]);setTasks((t.data||[]) as Task[]);setAttachments((a.data||[]) as Attachment[]);setCleanupJobs((j.data||[]) as StorageCleanupJob[]);const clientRows=await supabase.from("clients").select("id,name,company").eq("workspace_id",workspace).order("name");if(clientRows.error)throw clientRows.error;setClients((clientRows.data||[]) as Client[]);const [companyRows,folderRows]=await Promise.all([supabase.from("companies").select("id,name").eq("workspace_id",workspace).order("name"),supabase.from("company_folders").select("id,company_id,name").eq("workspace_id",workspace).order("name")]);if(companyRows.error)throw companyRows.error;if(folderRows.error)throw folderRows.error;setCompanies((companyRows.data||[]) as Company[]);setFolders((folderRows.data||[]) as CompanyFolder[]);if(p.data.company_id){const co=await supabase.from("companies").select("id,name").eq("id",p.data.company_id).eq("workspace_id",workspace).maybeSingle();if(co.error)throw co.error;setCompany(co.data as Company|null)}else setCompany(null);if(p.data.folder_id){const fo=await supabase.from("company_folders").select("id,company_id,name").eq("id",p.data.folder_id).eq("workspace_id",workspace).maybeSingle();if(fo.error)throw fo.error;setFolder(fo.data as CompanyFolder|null)}else setFolder(null);if(p.data.client_id){const c=await supabase.from("clients").select("id,name,company").eq("id",p.data.client_id).eq("workspace_id",workspace).maybeSingle();if(c.error)throw c.error;setClient(c.data as Client|null)}else setClient(null);
 }catch(e){setError(e instanceof Error?e.message:"Could not load this project.");}finally{setLoading(false)}},[id]);
 useEffect(()=>{void load()},[load]);
 async function save(e:React.FormEvent<HTMLFormElement>){e.preventDefault();setBusy(true);setError("");try{const workspace=await getWorkspaceId();const payload={record_type:kind,title:title.trim(),content:content.trim()||null,url:url.trim()||null};const result=editingRecord?await supabase.from("project_records").update(payload).eq("id",editingRecord.id).eq("workspace_id",workspace).eq("project_id",id):await supabase.from("project_records").insert({...payload,workspace_id:workspace,project_id:id,created_by:(await supabase.auth.getUser()).data.user?.id});if(result.error)throw result.error;void recordActivity(editingRecord?"project_record_updated":"project_record_created","project",id,(editingRecord?"Updated project record: ":"Added project record: ")+title.trim());setTitle("");setContent("");setUrl("");setKind("note");setEditingRecord(null);setShow(false);await load()}catch(e){setError(e instanceof Error?e.message:"Could not save record.")}finally{setBusy(false)}}
 async function remove(record:RecordRow){if(!window.confirm("Delete this project record?"))return;try{const workspace=await getWorkspaceId();const {error:e}=await supabase.from("project_records").delete().eq("id",record.id).eq("workspace_id",workspace);if(e)throw e;void recordActivity("project_record_deleted","project",id,"Deleted project record: "+record.title);await load()}catch(e){setError(e instanceof Error?e.message:"Could not delete record.")}}
 async function saveProject(e:React.FormEvent<HTMLFormElement>){e.preventDefault();if(!projectName.trim())return;setBusy(true);setError("");try{const workspace=await getWorkspaceId();const {error:e}=await supabase.from("projects").update({name:projectName.trim(),description:projectDescription.trim()||null,due_date:projectDueDate||null,client_id:projectClientId||null,company_id:projectCompanyId||null,folder_id:projectFolderId||null}).eq("id",id).eq("workspace_id",workspace);if(e)throw e;setEditProjectOpen(false);await load()}catch(e){setError(e instanceof Error?e.message:"Could not update project details.")}finally{setBusy(false)}}
 async function updateStatus(status:string){if(!project)return;try{const workspace=await getWorkspaceId();const {error:e}=await supabase.from("projects").update({status}).eq("id",id).eq("workspace_id",workspace);if(e)throw e;await load()}catch(e){setError(e instanceof Error?e.message:"Could not update status.")}}
 async function uploadAttachment(event:React.ChangeEvent<HTMLInputElement>){
  const file=event.target.files?.[0];event.target.value="";if(!file)return;setFileError("");
  const allowed=["application/pdf","application/msword","application/vnd.openxmlformats-officedocument.wordprocessingml.document","application/vnd.ms-excel","application/vnd.openxmlformats-officedocument.spreadsheetml.sheet","application/vnd.ms-powerpoint","application/vnd.openxmlformats-officedocument.presentationml.presentation","text/plain","text/csv","image/jpeg","image/png","image/webp","image/svg+xml","application/zip"];
  if(!allowed.includes(file.type)){setFileError("This file type is not supported. Use PDF, Office documents, images, CSV, TXT or ZIP.");return}
  if(file.size>20*1024*1024){setFileError("Files must be 20 MB or smaller.");return}
  setUploading(true);
  try{
   const workspace=await getWorkspaceId();
   const safeName=file.name.replace(/[^a-zA-Z0-9._-]/g,"_").slice(-120);
   const path=workspace+"/"+id+"/"+Date.now()+"-"+safeName;
   const {error:uploadError}=await supabase.storage.from("studiodesk-files").upload(path,file,{contentType:file.type,upsert:false});
   if(uploadError)throw uploadError;
   const {data:auth}=await supabase.auth.getUser();
   if(!auth.user)throw new Error("Your session expired. Sign in again before uploading.");
   const {error:insertError}=await supabase.from("project_attachments").insert({workspace_id:workspace,project_id:id,file_name:file.name,storage_path:path,mime_type:file.type,file_size:file.size,description:fileDescription.trim()||null,uploaded_by:auth.user.id});
   if(insertError){
    const cleanupId=await enqueueStorageCleanup(workspace,[path],auth.user.id);
    try{if(cleanupId)await processStorageCleanup(cleanupId,workspace)}
    catch(cleanupError){await load();throw new Error("The document record could not be saved. Its uploaded file is queued for cleanup. "+(cleanupError instanceof Error?cleanupError.message:""))}
    throw insertError;
   }
   setFileDescription("");void recordActivity("attachment_uploaded","project",id,"Uploaded document: "+file.name);await load();
  }catch(e){setFileError(e instanceof Error?e.message:"Could not upload this file.")}finally{setUploading(false)}
 }
 async function openAttachment(file:Attachment){
  setFileError("");try{const {data,error:e}=await supabase.storage.from("studiodesk-files").createSignedUrl(file.storage_path,300,{download:file.file_name});if(e)throw e;if(data?.signedUrl)window.open(data.signedUrl,"_blank","noopener,noreferrer")}catch(e){setFileError(e instanceof Error?e.message:"Could not open this document.")}
 }
 async function deleteAttachment(file:Attachment){
  if(!window.confirm("Delete "+file.file_name+" from this project?"))return;
  setFileError("");let jobId:string|null=null;
  try{
   const workspace=await getWorkspaceId();const {data:auth}=await supabase.auth.getUser();
   jobId=await enqueueStorageCleanup(workspace,[file.storage_path],auth.user!.id);
   const {data:deleted,error:e}=await supabase.from("project_attachments").delete().eq("id",file.id).eq("workspace_id",workspace).eq("project_id",id).select("id");
   if(e)throw e;if(!deleted?.length)throw new Error("Document record was not deleted. Refresh and try again.");
   void recordActivity("attachment_deleted","project",id,"Deleted document: "+file.file_name);
   if(jobId)await processStorageCleanup(jobId,workspace);
   await load();
  }catch(e){
   if(jobId){try{const workspace=await getWorkspaceId();const {data:job}=await supabase.from("storage_cleanup_jobs").select("id").eq("id",jobId).eq("workspace_id",workspace).maybeSingle();if(job){const {data:row}=await supabase.from("project_attachments").select("id").eq("id",file.id).eq("workspace_id",workspace).maybeSingle();if(row)await discardStorageCleanup(jobId,workspace);else await load()}}catch{/* preserve the original message */}}
   setFileError(e instanceof Error?e.message:"Could not delete this document.");
  }
 }
 async function retryProjectCleanup(job:StorageCleanupJob){
  setRetryingCleanup(job.id);setFileError("");
  try{await processStorageCleanup(job.id,job.workspace_id);setCleanupJobs(current=>current.filter(item=>item.id!==job.id))}
  catch(e){setFileError(e instanceof Error?e.message:"Could not finish document cleanup. Retry again.")}
  finally{setRetryingCleanup(null)}
 }
 async function deleteProject(){
  if(!project||!window.confirm("Permanently delete “"+project.name+"”? Its project records and attachments will also be deleted. This cannot be undone."))return;
  setBusy(true);setError("");let jobId:string|null=null;
  try{
   const workspace=await getWorkspaceId();const {data:auth}=await supabase.auth.getUser();
   const {data:files,error:fileError}=await supabase.from("project_attachments").select("storage_path").eq("project_id",id).eq("workspace_id",workspace);
   if(fileError)throw fileError;
   const paths=(files||[]).map(file=>file.storage_path);
   if(paths.length)jobId=await enqueueStorageCleanup(workspace,paths,auth.user!.id);
   const {data:deleted,error:deleteError}=await supabase.from("projects").delete().eq("id",id).eq("workspace_id",workspace).select("id");
   if(deleteError)throw deleteError;if(!deleted?.length)throw new Error("Project was not deleted. Refresh and try again.");
   void recordActivity("project_deleted","project",id,"Deleted project: "+project.name);
   if(jobId){try{await processStorageCleanup(jobId,workspace)}catch(cleanupError){setError(cleanupError instanceof Error?cleanupError.message:"Project deleted. Document cleanup is pending; retry it from Projects.")}}
   window.location.assign("/projects");
  }catch(e){
   if(jobId){try{await discardStorageCleanup(jobId,await getWorkspaceId())}catch{/* preserve original error */}}
   setError(e instanceof Error?e.message:"Could not delete project.");
  }finally{setBusy(false)}
 }

 const visible=useMemo(()=>records.filter(r=>(r.title+" "+(r.content||"")).toLowerCase().includes(query.toLowerCase())),[records,query]);
 if(loading)return <div className="page"><div className="empty bigempty">Loading project workspace…</div></div>;
 if(!project)return <div className="page"><Link className="backlink" href="/projects"><ArrowLeft size={16}/> Back to projects</Link><div className="notice">{error||"Project not found."}</div></div>;
 const completed=tasks.filter(t=>t.status==="done").length;
 return <div className="page">
 <Link className="backlink" href="/projects"><ArrowLeft size={16}/> All projects</Link>
 <Header tag="PROJECT WORKSPACE" title={project.name} desc={project.description||"A dedicated space for the brief, decisions, working notes and next steps."} action={<div className="project-actions"><button className="button button-danger" onClick={()=>void deleteProject()} disabled={busy}><Trash2 size={15}/> Delete project</button><button className="button button-light" onClick={()=>{setProjectName(project.name);setProjectDescription(project.description||"");setProjectDueDate(project.due_date||"");setProjectClientId(project.client_id||"");setProjectCompanyId(project.company_id||"");setProjectFolderId(project.folder_id||"");setEditProjectOpen(true)}}><FileText size={15}/> Edit details</button><button className="button" onClick={()=>{setEditingRecord(null);setKind("note");setTitle("");setContent("");setUrl("");setShow(true)}}><Plus size={16}/> Add record</button></div>}/>
 {error&&<div className="notice" role="alert">{error}</div>}
 <section className="project-overview">
 <div className="project-overview-main"><div className="project-overview-top"><span className="statuspill">{project.status.replace("_"," ")}</span><label className="statuslabel">Status <select value={project.status} onChange={e=>updateStatus(e.target.value)}>{statuses.map(s=><option key={s} value={s}>{s.replace("_"," ")}</option>)}</select></label></div><h2>Project at a glance</h2><p>{project.description||"Add a clear project description to give everyone the context they need."}</p><div className="project-facts"><span><CalendarDays size={15}/> Due {date(project.due_date)}</span><span><FileText size={15}/> {records.length} saved records</span><span><CheckCircle2 size={15}/> {completed}/{tasks.length} tasks complete</span></div></div>
 <aside className="project-side-fact"><small>COMPANY</small><b>{company?.name||"Independent project"}</b><span>{company?<Link href={"/companies/"+company.id}>{company.name} ↗</Link>:"Independent project"}</span>{folder&&<span><Link href={"/companies/"+folder.company_id+"/folders/"+folder.id}>{folder.name} ↗</Link></span>}<small>CLIENT CONTACT</small><b>{client?.name||"Not linked"}</b><span>{client?.company||"Optional contact"}</span><small>CREATED</small><b>{date(project.created_at.slice(0,10))}</b></aside>
 </section>
 <section className="panel project-attachments">
  <div className="panelhead"><div><h3>Documents & attachments</h3><p>Keep briefs, contracts, references and deliverables beside the work.</p></div><span className="attachment-count">{attachments.length} FILES</span></div>
  <div className="attachment-upload-row"><label className="button button-light attachment-upload"><Upload size={15}/>{uploading?"Uploading…":"Upload document"}<input type="file" disabled={uploading} accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.jpg,.jpeg,.png,.webp,.svg,.zip" onChange={uploadAttachment}/></label><input className="attachment-description" value={fileDescription} onChange={e=>setFileDescription(e.target.value)} placeholder="Optional description for next upload"/></div>
  {cleanupJobs.length>0&&<div className="cleanup-inline"><b><AlertTriangle size={14}/> Pending document cleanup</b>{cleanupJobs.map(job=><div key={job.id}><span>{job.storage_paths.length} file(s) awaiting removal</span><button className="button button-light" disabled={retryingCleanup===job.id} onClick={()=>void retryProjectCleanup(job)}><RefreshCw size={13}/>{retryingCleanup===job.id?"Retrying…":"Retry"}</button></div>)}</div>}
  <p className="attachment-guidance">Private to this workspace · 20 MB max per file · PDF, Office, images, CSV, TXT and ZIP</p>
  {fileError&&<div className="notice" role="alert">{fileError}</div>}
  {attachments.length?attachments.map(file=><div className="attachment-row" key={file.id}><span className="attachment-file-icon"><FileText size={17}/></span><span className="attachment-file-copy"><b>{file.file_name}</b><small>{(file.file_size/1024/1024).toFixed(file.file_size<1024*1024?3:1)} MB · {file.description||file.mime_type} · {new Date(file.created_at).toLocaleDateString()}</small></span><button className="attachment-open" onClick={()=>void openAttachment(file)} aria-label={"Download "+file.file_name}><Download size={16}/></button><button className="record-delete" onClick={()=>void deleteAttachment(file)} aria-label={"Delete "+file.file_name}><Trash2 size={15}/></button></div>):<div className="attachment-empty"><FileText size={20}/><b>No documents attached yet</b><span>Upload the brief, a client reference or the final deliverable.</span></div>}
 </section>
 <div className="project-detail-grid">
 <section className="panel project-records"><div className="panelhead"><div><h3>Project records</h3><p>Briefs, notes, decisions, meetings and references — all in context</p></div><button className="button button-light" onClick={()=>{setKind("note");setShow(true)}}><Plus size={15}/> Add</button></div>
 <div className="toolbar"><Search size={15}/><input placeholder="Find a record…" value={query} onChange={e=>setQuery(e.target.value)}/></div>
 {visible.length?visible.map(r=><article className="record-item" key={r.id}><div className="record-icon"><FileText size={17}/></div><div className="record-content"><div className="record-meta"><span>{labels[r.record_type]||"Record"}</span><time>{new Date(r.created_at).toLocaleDateString(undefined,{month:"short",day:"numeric",year:"numeric"})}</time></div><h4>{r.title}</h4>{r.content&&<p>{r.content}</p>}{r.url&&<a href={r.url} target="_blank" rel="noreferrer"><Link2 size={13}/> Open reference <ExternalLink size={12}/></a>}</div><button className="record-edit" onClick={()=>{setEditingRecord(r);setKind(r.record_type);setTitle(r.title);setContent(r.content||"");setUrl(r.url||"");setShow(true)}} aria-label={"Edit "+r.title}><FileText size={14}/></button><button className="record-delete" onClick={()=>void remove(r)} aria-label={"Delete "+r.title}><Trash2 size={15}/></button></article>):<div className="empty"><FileText/><b>{records.length?"No records match.":"The project’s memory starts here."}</b><p>Save the original brief, a client note, an important decision or a useful link.</p><button className="button" onClick={()=>setShow(true)}><Plus size={15}/> Add first record</button></div>}
 </section>
 <aside className="panel project-task-panel"><div className="panelhead"><div><h3>Project tasks</h3><p>{completed} of {tasks.length} completed</p></div><Link href="/tasks">All tasks ↗</Link></div>
 <div className="progress-track"><span style={{width:tasks.length?((completed/tasks.length)*100)+"%":"0%"}}/></div>
 {tasks.slice(0,8).map(t=><div className="project-task-row" key={t.id}><span className={t.status==="done"?"task-dot done":"task-dot"}/><div><b className={t.status==="done"?"taskdone":""}>{t.title}</b><small>{t.priority} priority · {t.due_date?"Due "+date(t.due_date):"No due date"}</small></div></div>)}
 {!tasks.length&&<div className="empty"><CheckCircle2/><b>No tasks linked yet</b><p>Create a task and assign it to this project.</p><Link href="/tasks">Go to tasks ↗</Link></div>}
 </aside></div>
 {editProjectOpen&&<div className="overlay" onMouseDown={e=>{if(e.target===e.currentTarget&&!busy)setEditProjectOpen(false)}}><div className="modal" role="dialog" aria-modal="true"><div className="modalhead"><h2>Edit project details</h2><button onClick={()=>setEditProjectOpen(false)} aria-label="Close"><X/></button></div><form onSubmit={saveProject}><label>Project name<input required maxLength={120} value={projectName} onChange={e=>setProjectName(e.target.value)}/></label><label>Project description<textarea rows={5} maxLength={5000} value={projectDescription} onChange={e=>setProjectDescription(e.target.value)} placeholder="What is this project about?"/></label><label>Client contact (optional)<select value={projectClientId} onChange={e=>setProjectClientId(e.target.value)}><option value="">No contact linked</option>{clients.map(item=><option key={item.id} value={item.id}>{item.name}{item.company?" · "+item.company:""}</option>)}</select></label><label>Company<select value={projectCompanyId} onChange={e=>{setProjectCompanyId(e.target.value);setProjectFolderId("")}}><option value="">Independent project</option>{companies.map(item=><option key={item.id} value={item.id}>{item.name}</option>)}</select></label>{projectCompanyId&&<label>Company folder<select value={projectFolderId} onChange={e=>setProjectFolderId(e.target.value)}><option value="">Company-level project</option>{folders.filter(item=>item.company_id===projectCompanyId).map(item=><option key={item.id} value={item.id}>{item.name}</option>)}</select></label>}<label>Due date<input type="date" value={projectDueDate} onChange={e=>setProjectDueDate(e.target.value)}/></label><p className="privacy">Changes are saved to this workspace project.</p><button className="button" disabled={busy}>{busy?"Saving…":"Save project"}</button></form></div></div>}
 {show&&<div className="overlay" onMouseDown={e=>{if(e.target===e.currentTarget&&!busy)setShow(false)}}><div className="modal" role="dialog" aria-modal="true"><div className="modalhead"><h2>{editingRecord?"Edit project record":"Add to project"}</h2><button onClick={()=>{setShow(false);setEditingRecord(null)}} aria-label="Close"><X/></button></div><form onSubmit={save}><label>Record type<select value={kind} onChange={e=>setKind(e.target.value)}>{kinds.map(k=><option key={k} value={k}>{labels[k]}</option>)}</select></label><label>Title<input required maxLength={160} value={title} onChange={e=>setTitle(e.target.value)} placeholder="e.g. Initial brand direction"/></label><label>Details<textarea rows={5} maxLength={12000} value={content} onChange={e=>setContent(e.target.value)} placeholder="Capture the context, outcome, next steps or key details…"/></label>{kind==="link"&&<label>Reference URL<input type="url" value={url} onChange={e=>setUrl(e.target.value)} placeholder="https://…"/></label>}<p className="privacy">Records are saved to this project and visible to workspace members.</p><button className="button" disabled={busy}>{busy?"Saving…":editingRecord?"Save changes":"Save record"}</button></form></div></div>}
 </div>
}
