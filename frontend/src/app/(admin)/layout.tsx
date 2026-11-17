import type { Metadata } from "next";
import "./admin.css";

export const metadata: Metadata = {
  title: "菜單工作室｜copydrink",
  robots: { index: false, follow: false },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-Hant">
      <body>{children}</body>
    </html>
  );
}
