import type { Metadata } from "next";
import "./globals.css";
import "./premium.css";

export const metadata: Metadata = {
  title: "StudioDesk — Creative operations",
  description: "A considered workspace for creative projects, clients and the context behind great work.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
