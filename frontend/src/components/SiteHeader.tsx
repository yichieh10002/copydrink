import Link from "next/link";
import { ThemeToggle } from "./ThemeToggle";
export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="container nav-inner">
        <Link href="/" className="wordmark" aria-label="copydrink 首頁">
          copydrink
        </Link>
        <div className="nav-right">
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
