"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, MailWarning } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function EmailConfirmedPage() {
  const [status, setStatus] = useState<"checking" | "success" | "error">("checking");
  const [detail, setDetail] = useState("");

  useEffect(() => {
    let active = true;

    async function confirmPageState() {
      const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
      const errorDescription = hash.get("error_description");
      const errorCode = hash.get("error_code");

      if (errorDescription || errorCode) {
        if (active) {
          setStatus("error");
          setDetail(errorDescription || "This confirmation link is invalid or has expired. Request a fresh email and try again.");
        }
        return;
      }

      // The Supabase browser client detects and stores the session from the
      // confirmation URL fragment. Reading the session lets that processing finish.
      const { error } = await supabase.auth.getSession();
      if (!active) return;

      if (error) {
        setStatus("error");
        setDetail("We couldn't verify this link. It may have expired or already been used.");
        return;
      }

      window.history.replaceState({}, document.title, window.location.pathname);
      setStatus("success");
    }

    void confirmPageState();
    return () => { active = false; };
  }, []);

  const isError = status === "error";

  return (
    <main className="auth auth-premium reset-auth">
      <section className="auth-panel">
        <div className="auth-box">
          <div className="auth-symbol">
            {isError ? <MailWarning size={20}/> : <CheckCircle2 size={20}/>}
          </div>
          <div className="auth-kicker">STUDIODESK ACCOUNT</div>
          <h2>{status === "checking" ? "Confirming your email…" : isError ? "This link needs attention." : "All set. You're confirmed."}</h2>
          <p className="auth-subtitle">
            {status === "checking"
              ? "We're finishing your email confirmation. This should only take a moment."
              : isError
                ? detail
                : "Your email address has been confirmed. You can now return to StudioDesk and sign in to your workspace."}
          </p>
          {status !== "checking" && (
            <Link className="auth-submit" href="/login">
              {isError ? "Return to sign in" : "Continue to StudioDesk"}
              <ArrowRight size={16}/>
            </Link>
          )}
        </div>
        <div className="auth-panel-footer">STUDIODESK <span>·</span> A CLEARER WAY TO CREATE</div>
      </section>
    </main>
  );
}
