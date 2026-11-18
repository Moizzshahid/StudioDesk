"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2, LockKeyhole } from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function ResetPasswordPage(){
 const router=useRouter();
 const [password,setPassword]=useState("");
 const [confirm,setConfirm]=useState("");
 const [message,setMessage]=useState("");
 const [busy,setBusy]=useState(false);
 async function submit(event:React.FormEvent<HTMLFormElement>){
  event.preventDefault();setMessage("");
  if(password.length<6){setMessage("Use at least 6 characters for your password.");return}
  if(password!==confirm){setMessage("The passwords do not match.");return}
  setBusy(true);
  try{
   const {error}=await supabase.auth.updateUser({password});
   if(error)throw error;
   setMessage("Your password has been updated. Taking you to your workspace…");
   window.setTimeout(()=>router.replace("/dashboard"),900);
  }catch(error){setMessage(error instanceof Error?error.message:"Could not update your password. Request a new reset email and try again.")}finally{setBusy(false)}
 }
 return <main className="auth auth-premium reset-auth"><section className="auth-panel"><div className="auth-box"><div className="auth-symbol"><LockKeyhole size={20}/></div><div className="auth-kicker">ACCOUNT SECURITY</div><h2>Choose a new password.</h2><p className="auth-subtitle">Set a new password to get back into your StudioDesk workspace.</p><form className="auth-premium-form" onSubmit={submit}><label>New password<div className="auth-input"><LockKeyhole size={16}/><input type="password" required minLength={6} autoComplete="new-password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="At least 6 characters"/></div></label><label>Confirm password<div className="auth-input"><LockKeyhole size={16}/><input type="password" required minLength={6} autoComplete="new-password" value={confirm} onChange={e=>setConfirm(e.target.value)} placeholder="Enter it again"/></div></label><button className="auth-submit" disabled={busy}>{busy?"Updating…":"Update password"} <CheckCircle2 size={16}/></button></form>{message&&<div className="auth-message" role="status">{message}</div>}<Link className="reset-back" href="/login"><ArrowLeft size={14}/> Back to sign in</Link></div><div className="auth-panel-footer">STUDIODESK <span>·</span> A CLEARER WAY TO CREATE</div></section></main>
}
