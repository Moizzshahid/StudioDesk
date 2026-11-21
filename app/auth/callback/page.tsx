"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [message, setMessage] = useState("Completing secure sign-in…");

  useEffect(() => {
    let active = true;

    async function finishSignIn() {
      // Supabase JS processes the OAuth tokens from the URL fragment and
      // persists the resulting session in the browser.
      const { data, error } = await supabase.auth.getSession();
      if (!active) return;

      if (error || !data.session) {
        setMessage("We couldn't complete sign-in. Please return to StudioDesk and try again.");
        return;
      }

      window.history.replaceState({}, document.title, window.location.pathname);
      router.replace("/dashboard");
    }

    void finishSignIn();
    return () => { active = false; };
  }, [router]);

  return (
    <main className="auth auth-premium reset-auth">
      <section className="auth-panel">
        <div className="auth-box">
          <div className="auth-symbol">✦</div>
          <div className="auth-kicker">STUDIODESK ACCOUNT</div>
          <h2>Welcome to your workspace.</h2>
          <p className="auth-subtitle">{message}</p>
          {message.startsWith("We couldn't") && (
            <a className="auth-submit" href="/login">Return to sign in</a>
          )}
        </div>
        <div className="auth-panel-footer">STUDIODESK <span>·</span> A CLEARER WAY TO CREATE</div>
      </section>
    </main>
  );
}
