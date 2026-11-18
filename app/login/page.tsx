"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight, ArrowUpRight, Eye, EyeOff, Layers3, LockKeyhole,
  Mail, ShieldCheck, Sparkles,
} from "lucide-react";
import { supabase, supabaseConfigured } from "@/lib/supabase";

export default function Login() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      if (!supabaseConfigured) throw new Error("Connect Supabase first. See README.md.");
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { data: {
            full_name: name.trim(),
            workspace_name: name.trim() ? name.trim() + "'s Studio" : undefined,
          }},
        });
        if (error) throw error;
        if (data.session) { router.replace("/dashboard"); return; }
        setMessage("Your workspace is ready. Check your inbox to confirm your email, then sign in.");
        setMode("login");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (error) throw error;
        router.replace("/dashboard");
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Something went wrong. Please try again.");
    } finally { setBusy(false); }
  }

  async function sendReset() {
    setBusy(true); setMessage("");
    try {
      if (!email.trim()) throw new Error("Enter your email address first.");
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: typeof window !== "undefined" ? window.location.origin + "/reset-password" : undefined,
      });
      if (error) throw error;
      setResetSent(true);
      setMessage("If an account exists for this address, a password reset email is on its way.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not send the reset email.");
    } finally { setBusy(false); }
  }

  return (
    <main className="auth auth-premium">
      <section className="auth-story">
        <div className="auth-brand"><span className="auth-brand-mark">S</span><span>StudioDesk</span><small>CREATIVE OPERATIONS</small></div>
        <div className="auth-story-content">
          <div className="auth-eyebrow"><span/> A MORE CONSIDERED WAY TO WORK</div>
          <h1>Make space for<br/><em>the work</em> that<br/>moves you forward.</h1>
          <p>Projects, people, documents and the thinking behind every decision. All connected, all in one calm workspace.</p>
          <div className="auth-feature-stack">
            <div className="auth-feature"><span><Layers3 size={17}/></span><div><b>Everything in context</b><small>Projects, notes and deliverables stay connected.</small></div></div>
            <div className="auth-feature"><span><ShieldCheck size={17}/></span><div><b>Your studio stays yours</b><small>Private workspace data, with access controls.</small></div></div>
          </div>
        </div>
        <div className="auth-story-footer"><span>BUILT FOR INDEPENDENT STUDIOS</span><span>01 — 03</span></div>
        <div className="auth-orb auth-orb-one"/><div className="auth-orb auth-orb-two"/>
      </section>
      <section className="auth-panel">
        <div className="auth-mobile-brand"><span className="auth-brand-mark">S</span> StudioDesk</div>
        <div className="auth-box">
          <div className="auth-symbol"><Layers3 size={20}/></div>
          <div className="auth-kicker">{mode === "login" ? "WELCOME BACK" : "YOUR NEXT CHAPTER"}</div>
          <h2>{mode === "login" ? "Good to have you back." : "Create your studio space."}</h2>
          <p className="auth-subtitle">{mode === "login" ? "Sign in to pick up where your best work happens." : "A thoughtful home for the work you do."}</p>
          <form onSubmit={submit} className="auth-premium-form">
            {mode === "signup" && <label>Your name<div className="auth-input"><input required maxLength={120} autoComplete="name" value={name} onChange={e=>setName(e.target.value)} placeholder="Your name"/></div></label>}
            <label>Email address<div className="auth-input"><Mail size={16}/><input type="email" required maxLength={254} autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@studio.com"/></div></label>
            <label>Password<div className="auth-input"><LockKeyhole size={16}/><input type={showPassword?"text":"password"} minLength={6} required autoComplete={mode==="login"?"current-password":"new-password"} value={password} onChange={e=>setPassword(e.target.value)} placeholder="Enter your password"/><button type="button" onClick={()=>setShowPassword(v=>!v)} aria-label={showPassword?"Hide password":"Show password"}>{showPassword?<EyeOff size={16}/>:<Eye size={16}/>}</button></div></label>
            {mode==="login"&&<div className="auth-forgot"><button type="button" onClick={()=>void sendReset()} disabled={busy||resetSent}>{resetSent?"Reset email requested":"Forgot password?"}</button></div>}
            <button className="auth-submit" disabled={busy}>{busy?"Please wait…":mode==="login"?"Sign in to your workspace":"Create workspace"}<ArrowRight size={16}/></button>
          </form>
          {message&&<div className="auth-message" role="status" aria-live="polite">{message}</div>}
          <div className="auth-switch"><span>{mode==="login"?"New to StudioDesk?":"Already have a workspace?"}</span><button type="button" onClick={()=>{setMessage("");setMode(mode==="login"?"signup":"login")}}>{mode==="login"?"Create an account":"Sign in"} <ArrowUpRight size={13}/></button></div>
          <div className="auth-privacy"><ShieldCheck size={13}/> Your workspace is private and securely connected.</div>
        </div>
        <div className="auth-panel-footer">STUDIODESK <span>·</span> A CLEARER WAY TO CREATE</div>
      </section>
    </main>
  );
}
