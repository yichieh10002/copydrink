"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowUpIcon } from "@phosphor-icons/react/dist/csr/ArrowUp";
import { ArrowLeftIcon } from "@phosphor-icons/react/dist/csr/ArrowLeft";

export function BackToTop() {
  const [visible, setVisible] = useState(false);
  const pathname = usePathname();
  const isStorePage = pathname.startsWith("/stores/");

  useEffect(() => {
    const update = () => setVisible(window.scrollY > 480);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);

  if (!visible) return null;

  return (
    <nav className="floating-nav" aria-label="快速導覽">
      <button
        className="back-to-top"
        type="button"
        aria-label="回到頁面頂部"
        onClick={() =>
          window.scrollTo({
            top: 0,
            behavior: window.matchMedia("(prefers-reduced-motion: reduce)")
              .matches
              ? "auto"
              : "smooth",
          })
        }
      >
        <ArrowUpIcon size={22} weight="regular" aria-hidden="true" />
        <small>回頂部</small>
      </button>
      {isStorePage && (
        <Link className="back-to-stores" href="/" aria-label="返回全部店家">
          <ArrowLeftIcon size={22} weight="regular" aria-hidden="true" />
          <small>回全部</small>
        </Link>
      )}
    </nav>
  );
}
