"use client";
import { useDialogBackdrop } from "@/lib/useDialogBackdrop";

import { useEffect, useRef } from "react";
import { XIcon } from "@phosphor-icons/react/dist/csr/X";
import { BrandLogo } from "./BrandLogo";

type Source = { name: string; url: string; updated: string };

export function SiteFooter({ sources }: { sources: Source[] }) {
  const backdrop = useDialogBackdrop();
  const footer = useRef<HTMLElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const element = footer.current;
    if (
      !element ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    )
      return;
    if (!("IntersectionObserver" in window)) return;
    element.dataset.revealed = "false";
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        element.dataset.revealed = "true";
        observer.disconnect();
      },
      { threshold: 0.12 },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <footer className="site-footer" ref={footer}>
      <svg
        className="footer-wave"
        viewBox="0 0 1440 120"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path d="M0 82C125 23 257 5 385 28c166 30 233 68 393 38 147-27 232-54 360-30 137 25 229 44 302 4v80H0Z" />
      </svg>
      <div className="footer-scene" aria-hidden="true">
        <div className="footer-notebook footer-reveal">
          <div className="footer-notebook-cover" />
          <div className="footer-notebook-pages">
            {[0, 1].map((page) => (
              <div className="footer-notebook-page" key={page}>
                {Array.from({ length: 7 }, (_, line) => (
                  <i key={line} />
                ))}
              </div>
            ))}
          </div>
          <span className="footer-notebook-ribbon" />
          <span className="footer-stamp">
            <BrandLogo />
          </span>
        </div>
        <img
          className="footer-characters footer-reveal"
          src="/assets/footer-cheers-blue-v2.webp"
          alt=""
          width={1312}
          height={1199}
          loading="lazy"
          decoding="async"
        />
      </div>
      <div className="container footer-brand footer-reveal">
        <p className="footer-tagline">
          <span className="sr-only">今天這杯，照你的口味。</span>
          <span className="footer-handwriting" aria-hidden="true" />
        </p>
        <p className="footer-caption">找菜單、選口味，複製貼回群組。</p>
      </div>
      <div className="container footer-bottom footer-reveal">
        <div className="footer-disclaimer">
          <p>
            本站提供飲品資訊查詢與文字複製，不代為送出訂單。價格、品項與供應以各門市公告為準。
          </p>
          <p>
            copydrink
            為獨立開發工具，非各品牌官方網站。品牌名稱及商標屬各權利人所有。
          </p>
        </div>
        <nav className="footer-links" aria-label="網站資訊">
          <button type="button" onClick={() => dialog.current?.showModal()}>
            資料來源與權利說明
          </button>
          <a
            href="https://github.com/yichieh10002/copydrink/issues/new?title=copydrink%20%E5%95%8F%E9%A1%8C%E5%9B%9E%E5%A0%B1"
            target="_blank"
            rel="noopener noreferrer"
          >
            問題回報 ↗
          </a>
        </nav>
      </div>
      <dialog
        ref={dialog}
        className="utility-dialog footer-source-dialog"
        aria-labelledby="footer-source-title"
        {...backdrop}
      >
        <div className="utility-heading">
          <h2 id="footer-source-title">資料來源與權利說明</h2>
          <button
            type="button"
            aria-label="關閉資料來源"
            onClick={() => dialog.current?.close()}
          >
            <XIcon size={20} aria-hidden="true" />
          </button>
        </div>
        <div className="footer-source-body">
          <p>
            以下提供各店家資料中登錄的官方網站或菜單連結，方便核對資訊；本站顯示內容不代表品牌合作或授權。
          </p>
          <ul>
            {sources.map((source) => (
              <li key={source.name}>
                <a href={source.url} target="_blank" rel="noopener noreferrer">
                  {source.name} ↗
                </a>
                <small>資料發布：{source.updated}</small>
              </li>
            ))}
          </ul>
          <p>
            品牌名稱、商標與相關素材之權利屬各權利人所有。如有資料錯誤或權利疑慮，請透過問題回報聯繫，並提供涉及的頁面與內容。
          </p>
          <p className="footer-report-note">
            問題回報使用 GitHub Issues，需登入
            GitHub；請勿提交個人訂單、電話或其他私人資訊。
          </p>
        </div>
      </dialog>
    </footer>
  );
}
