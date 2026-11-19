"use client";
import { useCallback,useEffect,useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft,FolderKanban,Plus,ArrowUpRight } from "lucide-react";
import Header from "@/components/Header";
import { supabase } from "@/lib/supabase";
import { getWorkspaceId } from "@/lib/workspace";
type Folder={id:string;name:string;description:string|null;color:string};
type Project={id:string;name:string;status:string;due_date:string|null;description:string|null};
export default function FolderDetail(){
 const {id}=useParams<{id:string}>();const [folder,setFolder]=useState<Folder|null>(null);const [projects,setProjects]=useState<Project[]>([]);const [loading,setLoading]=useState(true);const [error,setError]=useState("");
 const load=useCallback(async()=>{try{const w=await getWorkspaceId();const [f,p]=await Promise.all([supabase.from("project_folders").select("id,name,description,color").eq("id",id).eq("workspace_id",w).single(),supabase.from("projects").select("id,name,status,due_date,description").eq("folder_id",id).eq("workspace_id",w).order("created_at",{ascending:false})]);if(f.error)throw f.error;if(p.error)throw p.error;setFolder(f.data as Folder);setProjects((p.data||[]) as Project[])}catch(e){setError(e instanceof Error?e.message:"Could not load this folder.")}finally{setLoading(false)}},[id]);
 useEffect(()=>{void load()},[load]);
 if(loading)return <div className="page"><div className="empty bigempty">Opening folder…</div></div>;
 if(!folder)return <div className="page"><Link className="backlink" href="/folders"><ArrowLeft size={15}/> All folders</Link><div className="notice">{error||"Folder not found."}</div></div>;
 return <div className="page"><Link className="backlink" href="/folders"><ArrowLeft size={15}/> All folders</Link><Header tag="PROJECT CATEGORY" title={folder.name} desc={folder.description||"Projects grouped in this folder."} action={<Link className="button" href={"/projects?folderId="+id}><Plus size={15}/> Add project</Link>}/>{error&&<div className="notice" role="alert">{error}</div>}<section className={"folder-hero folder-"+folder.color}><span><FolderKanban size={22}/></span><div><small>PROJECT FOLDER</small><h2>{folder.name}</h2><p>{projects.length} projects in this category</p></div></section><div className="company-project-list">{projects.map(p=><Link key={p.id} href={"/projects/"+p.id}><span><b>{p.name}</b><small>{p.description||"No description"} · {p.due_date||"No due date"}</small></span><em>{p.status.replace("_"," ")}</em><ArrowUpRight size={15}/></Link>)}</div>{!projects.length&&<div className="company-empty"><FolderKanban size={20}/><b>No projects in this folder yet</b><p>Create a project and assign it to this category.</p><Link className="button" href={"/projects?folderId="+id}><Plus size={14}/> Create project</Link></div>}</div>
}
