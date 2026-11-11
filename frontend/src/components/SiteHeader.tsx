import Link from "next/link";
import { ThemeToggle } from "./ThemeToggle";
import { HomeTools, type QuickStore } from "@/features/home/HomeTools";
export function SiteHeader({
  stores,
  notices,
}: {
  stores: QuickStore[];
  notices: { brand: string; note: string }[];
}) {
  return (
    <header className="site-header">
      <div className="container nav-inner">
        <Link href="/" className="wordmark" aria-label="copydrink 首頁">
          copydrink
        </Link>
        <HomeTools stores={stores} notices={notices} />
        <div className="nav-right">
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
