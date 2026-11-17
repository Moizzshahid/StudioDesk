import type { ReactNode } from "react";

export default function Header({
  tag,
  title,
  desc,
  action,
}: {
  tag: string;
  title: string;
  desc: string;
  action?: ReactNode;
}) {
  return (
    <header className="pageheader">
      <div>
        <small>{tag}</small>
        <h1>{title}</h1>
        <p>{desc}</p>
      </div>
      {action}
    </header>
  );
}
