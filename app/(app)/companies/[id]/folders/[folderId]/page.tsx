"use client";
import { useCallback,useEffect,useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft,FolderKanban,Pencil,Trash2,X,ArrowUpRight,Plus } from "lucide-react";
import Header from "@/components/Header";
import CompanyContextPanel from "@/components/CompanyContextPanel";
import { supabase } from "@/lib/supabase";
import { getWorkspaceId } from "@/lib/workspace";
import { enqueueStorageCleanup,processStorageCleanup } from "@/lib/storageCleanup";
type Company={id:string;name:string};
type Folder={id:string;company_id:string;name:string;description:string|null;color:string};
type Project={id:string;name:string;status:string;due_date:string|null};
export default function CompanyFolder(){
 const params=useParams<{id:string;folderId:string}>();const companyId=params.id;const folderId=params.folderId;
 const [company,setCompany]=useState<Company|null>(null);const [folder,setFolder]=useState<Folder|null>(null);const [projects,setProjects]=useState<Project[]>([]);const [workspace,setWorkspace]=useState("");const [loading,setLoading]=useState(true);const [error,setError]=useState("");const [editing,setEditing]=useState(false);const [name,setName]=useState("");const [description,setDescription]=useState("");const [color,setColor]=useState("sage");const [busy,setBusy]=useState(false);
 const load=useCallback(async()=>{try{const w=await getWorkspaceId();setWorkspace(w);const [c,f,p]=await Promise.all([supabase.from("companies").select("id,name").eq("id",companyId).eq("workspace_id",w).single(),supabase.from("company_folders").select("id,company_id,name,description,color").eq("id",folderId).eq("company_id",companyId).eq("workspace_id",w).single(),supabase.from("projects").select("id,name,status,due_date").eq("folder_id",folderId).eq("company_id",companyId).eq("workspace_id",w).order("created_at",{ascending:false})]);if(c.error)throw c.error;if(f.error)throw f.error;if(p.error)throw p.error;setCompany(c.data as Company);setFolder(f.data as Folder);setName(f.data.name);setDescription(f.data.description||"");setColor(f.data.color);setProjects((p.data||[]) as Project[])}catch(e){setError(e instanceof Error?e.message:"Could not load folder.")}finally{setLoading(false)}},[companyId,folderId]);
 useEffect(()=>{void load()},[load]);
 async function save(e:React.FormEvent<HTMLFormElement>){e.preventDefault();setBusy(true);try{const {error}=await supabase.from("company_folders").update({name:name.trim(),description:description.trim()||null,color}).eq("id",folderId).eq("workspace_id",workspace);if(error)throw error;setEditing(false);await load()}catch(e){setError(e instanceof Error?e.message:"Could not save folder.")}finally{setBusy(false)}}
 async function remove(){
  if(!folder||!window.confirm("Delete folder "+folder.name+"? Projects will remain under the company; folder notes and documents will be removed."))return;
  setBusy(true);setError("");let jobId:string|null=null;
  try{
   const {data:files,error:readError}=await supabase.from("company_attachments").select("storage_path").eq("folder_id",folderId).eq("workspace_id",workspace);
   if(readError)throw readError;
   const paths=(files||[]).map(f=>f.storage_path);
   const user=(await supabase.auth.getUser()).data.user;
   if(paths.length){if(!user)throw new Error("Please sign in again.");jobId=await enqueueStorageCleanup(workspace,paths,user.id)}
   const {error:deleteError}=await supabase.from("company_folders").delete().eq("id",folderId).eq("workspace_id",workspace);
   if(deleteError){if(jobId)await supabase.from("storage_cleanup_jobs").delete().eq("id",jobId).eq("workspace_id",workspace);throw deleteError}
   if(jobId)await processStorageCleanup(jobId,workspace);
   window.location.assign("/companies/"+companyId);
  }catch(e){setError(e instanceof Error?e.message:"Could not delete folder. If file cleanup is pending, retry it from Projects.")}finally{setBusy(false)}
 }
 if(loading)return <div className="page"><div className="empty bigempty">Opening folder…</div></div>;
 if(!folder||!company)return <div className="page"><Link className="backlink" href={"/companies/"+companyId}><ArrowLeft size={15}/> Company</Link><div className="notice">{error||"Folder not found."}</div></div>;
 return <div className="page"><Link className="backlink" href={"/companies/"+companyId}><ArrowLeft size={15}/> {company.name}</Link><Header tag="COMPANY FOLDER" title={folder.name} desc={folder.description||"A focused space for related projects, notes and documents."} action={<div className="project-actions"><button className="button button-light" onClick={()=>setEditing(true)}><Pencil size={14}/> Edit folder</button><button className="button" onClick={()=>window.location.assign("/projects?companyId="+companyId+"&folderId="+folderId)}><Plus size={14}/> New project</button></div>}/>{error&&<div className="notice" role="alert">{error}</div>}
 <section className={"folder-hero folder-"+folder.color}><span><FolderKanban size={22}/></span><div><small>PART OF {company.name.toUpperCase()}</small><h2>{folder.name}</h2><p>{projects.length} projects in this folder</p></div></section>
 <div className="company-section-heading"><div><small>FOLDER WORK</small><h2>Projects</h2><p>Each project keeps its own brief, tasks, records and private files.</p></div><button className="button button-light" onClick={()=>window.location.assign("/projects?companyId="+companyId+"&folderId="+folderId)}>Create project <Plus size={14}/></button></div>
 <div className="company-project-list">{projects.map(p=><Link key={p.id} href={"/projects/"+p.id}><span><b>{p.name}</b><small>{p.due_date||"No due date"}</small></span><em>{p.status.replace("_"," ")}</em><ArrowUpRight size={15}/></Link>)}</div>{!projects.length&&<div className="company-empty"><FolderKanban size={20}/><b>No projects in this folder yet</b><p>Create the first project and it will appear here.</p></div>}
 <CompanyContextPanel workspaceId={workspace} companyId={companyId} folderId={folderId} heading="Folder notes & documents"/>
 <div className="company-danger-zone"><div><b>Folder settings</b><small>Deleting this folder keeps its projects under the company and removes folder-level notes and files.</small></div><button className="button button-danger" disabled={busy} onClick={()=>void remove()}><Trash2 size={14}/> Delete folder</button></div>
 {editing&&<div className="overlay" onMouseDown={e=>{if(e.target===e.currentTarget&&!busy)setEditing(false)}}><div className="modal" role="dialog" aria-modal="true"><div className="modalhead"><h2>Edit folder</h2><button onClick={()=>setEditing(false)} aria-label="Close"><X/></button></div><form onSubmit={save}><label>Folder name<input required maxLength={120} value={name} onChange={e=>setName(e.target.value)}/></label><label>Description<textarea rows={4} value={description} onChange={e=>setDescription(e.target.value)}/></label><label>Accent<select value={color} onChange={e=>setColor(e.target.value)}><option value="sage">Sage</option><option value="blue">Blue</option><option value="amber">Amber</option><option value="rose">Rose</option><option value="slate">Slate</option></select></label><button className="button" disabled={busy}>Save folder</button></form></div></div>}
 </div>
}
