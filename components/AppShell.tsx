"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { getWorkspaceId } from "@/lib/workspace";
import Sidebar from "@/components/Sidebar";
import CommandMenu from "@/components/CommandMenu";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ok, setOk] = useState(false);
  const [email, setEmail] = useState("");
  const [workspaceName, setWorkspaceName] = useState("Your workspace");

  useEffect(() => {
    let alive = true;
    supabase.auth.getUser().then(async ({ data }) => {
      if (!alive) return;
      if (data.user) {
        setEmail(data.user.email || "Workspace member");
        setOk(true);
        try {
          const workspaceId = await getWorkspaceId();
          const { data: workspace } = await supabase
            .from("workspaces")
            .select("name")
            .eq("id", workspaceId)
            .maybeSingle();
          if (alive && workspace?.name) setWorkspaceName(workspace.name);
        } catch {
          // Keep the stable fallback label when workspace metadata is unavailable.
        }
      } else router.replace("/login");
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) router.replace("/login");
      else if (session.user?.email) setEmail(session.user.email);
    });

    return () => {
      alive = false;
      subscription.unsubscribe();
    };
  }, [router]);

  if (!ok) return <div className="loading">Preparing your studio…</div>;

  const initials = email.split("@")[0].slice(0, 2).toUpperCase() || "SD";

  return (
    <div className="app">
      <Sidebar />
      <main>
        <div className="workspace-topbar">
          <div className="workspace-breadcrumb">WORKSPACE <span>/ {workspaceName}</span></div>
          <CommandMenu />
          <div className="topbar-profile">
            <span className="topbar-avatar">{initials}</span>
            <div><b>{email.split("@")[0]}</b><small>Studio member</small></div>
          </div>
        </div>
        {children}
      </main>
    </div>
  );
}
