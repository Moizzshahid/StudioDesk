"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Activity, BrainCircuit, FolderKanban, LayoutDashboard, LogOut, ListTodo, Users,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

const links = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/projects", label: "Projects", icon: FolderKanban },
  { href: "/folders", label: "Folders", icon: FolderKanban },
  { href: "/tasks", label: "Tasks", icon: ListTodo },
  { href: "/clients", label: "Clients", icon: Users },
  { href: "/memory", label: "Studio Memory", icon: BrainCircuit },
  { href: "/activity", label: "Activity", icon: Activity },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  async function signOut() {
    await supabase.auth.signOut();
    router.replace("/login");
  }

  return (
    <aside className="sidebar">
      <Link className="brand" href="/dashboard">
        <span className="logo"><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 5.5h5.5v5.5H5zM13.5 5.5H19v5.5h-5.5zM5 13h5.5v5.5H5z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M13.5 13h2.8a2.7 2.7 0 0 1 2.7 2.7v2.8h-5.5z" fill="currentColor" opacity=".9"/></svg></span>
        <span>StudioDesk</span>
      </Link>
      <small className="navlabel">YOUR STUDIO</small>
      <nav>
        {links.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href + "/"));
          return (
            <Link className={active ? "navlink active" : "navlink"} href={href} key={href}>
              <Icon size={17} strokeWidth={1.8} />
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="sidebar-note">
        <span className="sidebar-note-mark" />
        <div><b>Studio Memory</b><small>Keep the thinking behind the work.</small></div>
      </div>
      <button className="signout" onClick={signOut}>
        <LogOut size={16} /> Sign out
      </button>
    </aside>
  );
}
