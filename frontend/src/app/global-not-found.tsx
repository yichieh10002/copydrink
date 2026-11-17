import type { Metadata } from "next";
import Link from "next/link";
import { BrandLogo } from "@/components/BrandLogo";
import { NotFoundPanel } from "@/components/NotFoundPanel";
import "./styles/tokens.css";
import "./styles/not-found.css";

export const metadata: Metadata = {
  title: "找不到頁面｜copydrink",
  robots: { index: false, follow: false },
};

export default function GlobalNotFound() {
  return (
    <html lang="zh-Hant">
      <body className="not-found-standalone">
        <Link className="not-found-brand" href="/" aria-label="copydrink 首頁">
          <BrandLogo />
        </Link>
        <NotFoundPanel />
      </body>
    </html>
  );
}
