"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowUpRight, Layers3 } from "lucide-react";
import { supabase, supabaseConfigured } from "@/lib/supabase";

export default function Login() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      if (!supabaseConfigured) throw new Error("Connect Supabase first. See README.md.");
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: name, workspace_name: name ? name + "'s Studio" : undefined } },
        });
        if (error) throw error;
        setMessage("Account created. Confirm your email if confirmation is enabled, then sign in.");
        setMode("login");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.push("/dashboard");
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth">
      <section className="story">
        <div className="brand"><span className="logo">S</span> StudioDesk</div>
        <div>
          <small>THE CREATIVE OPERATIONS WORKSPACE</small>
          <h1>Make great work.<br /><em>Keep everything</em><br />that makes it great.</h1>
          <p>Projects, people, and the context behind every decision — in one focused place.</p>
        </div>
        <small>BUILT FOR INDEPENDENT STUDIOS</small>
      </section>
      <section className="authform">
        <div className="authbox">
          <div className="icon"><Layers3 /></div>
          <small>{mode === "login" ? "WELCOME BACK" : "GET STARTED"}</small>
          <h2>{mode === "login" ? "Sign in to StudioDesk" : "Create your workspace"}</h2>
          <p>A little more clarity for the work that matters.</p>
          <form onSubmit={submit}>
            {mode === "signup" && <label>Your name<input required value={name} onChange={e => setName(e.target.value)} /></label>}
            <label>Email address<input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="you@studio.com" /></label>
            <label>Password<input type="password" minLength={6} required value={password} onChange={e => setPassword(e.target.value)} placeholder="At least 6 characters" /></label>
            <button disabled={busy}>{busy ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"} <ArrowUpRight size={16} /></button>
          </form>
          {message && <div className="notice">{message}</div>}
          <div className="switch">{mode === "login" ? "New to StudioDesk?" : "Already have an account?"} <button onClick={() => setMode(mode === "login" ? "signup" : "login")}>{mode === "login" ? "Create account" : "Sign in"}</button></div>
        </div>
      </section>
    </main>
  );
}
