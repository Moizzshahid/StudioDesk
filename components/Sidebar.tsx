"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BrainCircuit,
  FolderKanban,
  LayoutDashboard,
  LogOut,
  ListTodo,
  Users,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

const links = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/projects", label: "Projects", icon: FolderKanban },
  { href: "/tasks", label: "Tasks", icon: ListTodo },
  { href: "/clients", label: "Clients", icon: Users },
  { href: "/memory", label: "Studio Memory", icon: BrainCircuit },
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
        <span className="logo">S</span>
        <span>StudioDesk</span>
      </Link>
      <small className="navlabel">WORKSPACE</small>
      <nav>
        {links.map(({ href, label, icon: Icon }) => (
          <Link
            className={pathname === href ? "navlink active" : "navlink"}
            href={href}
            key={href}
          >
            <Icon size={17} />
            {label}
          </Link>
        ))}
      </nav>
      <button className="signout" onClick={signOut}>
        <LogOut size={16} /> Sign out
      </button>
    </aside>
  );
}
