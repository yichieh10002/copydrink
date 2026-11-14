"use client";
import { useEffect, useRef, useState } from "react";
import { NotePencilIcon } from "@phosphor-icons/react/dist/csr/NotePencil";
import { CoffeeIcon } from "@phosphor-icons/react/dist/csr/Coffee";
import { ListIcon } from "@phosphor-icons/react/dist/csr/List";
import { XIcon } from "@phosphor-icons/react/dist/csr/X";
import { QuickNote } from "./QuickNote";

export type QuickStore = {
  name: string;
  slug: string;
  items: Array<{
    id: string;
    name: string;
    sizes: string[];
    sugars: string[];
    ices: string[];
    toppings: string[];
    customGroups: Array<{
      id: string;
      name: string;
      kind: "single" | "multiple";
      required: boolean;
      maxChoices?: number | null;
      mode?: string;
      fixedChoiceId?: string;
      choices: Array<{ id: string; label: string; price?: number | null }>;
    }>;
  }>;
  sugars: string[];
  ices: string[];
  toppings: string[];
};
type Notice = { brand: string; note: string };
export function HomeTools({
  stores,
  notices,
}: {
  stores: QuickStore[];
  notices: Notice[];
}) {
  const quick = useRef<HTMLDialogElement>(null),
    warm = useRef<HTMLDialogElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!menuOpen) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setMenuOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setMenuOpen(false);
      menuButtonRef.current?.focus();
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [menuOpen]);

  return (
    <div className="home-tools" ref={menuRef}>
      <button
        className="home-menu-trigger"
        type="button"
        ref={menuButtonRef}
        aria-label="快捷功能選單"
        aria-expanded={menuOpen}
        aria-controls="home-tool-list"
        onClick={() => setMenuOpen((open) => !open)}
      >
        <ListIcon size={22} weight="regular" aria-hidden="true" />
      </button>
      <div className="home-tool-list" id="home-tool-list" data-open={menuOpen}>
        <button
          className="home-tool"
          type="button"
          onClick={() => {
            setMenuOpen(false);
            quick.current?.showModal();
          }}
        >
          <NotePencilIcon size={22} weight="regular" aria-hidden="true" />
          <strong>自填飲料小抄</strong>
          <small>沒有菜單，也能自己寫好複製。</small>
        </button>
        {notices.length > 0 && (
          <button
            className="home-tool"
            type="button"
            onClick={() => {
              setMenuOpen(false);
              warm.current?.showModal();
            }}
          >
            <CoffeeIcon size={22} weight="regular" aria-hidden="true" />
            <strong>溫熱飲店家注意</strong>
            <small>喝熱飲前先看杯型與規定。</small>
          </button>
        )}
      </div>
      <dialog
        className="utility-dialog quick-dialog"
        ref={quick}
        aria-label="自填飲料小抄"
        onClick={(e) => {
          if (e.target === e.currentTarget) quick.current?.close();
        }}
      >
        <div className="utility-heading">
          <h2>自填飲料小抄</h2>
          <button
            aria-label="關閉自填飲料小抄"
            onClick={() => quick.current?.close()}
          >
            <XIcon size={22} weight="regular" aria-hidden="true" />
          </button>
        </div>
        <QuickNote stores={stores} />
      </dialog>
      <dialog
        className="utility-dialog"
        ref={warm}
        aria-label="溫熱飲店家注意"
        onClick={(e) => {
          if (e.target === e.currentTarget) warm.current?.close();
        }}
      >
        <div className="utility-heading">
          <h2>溫熱飲店家注意</h2>
          <button
            aria-label="關閉溫熱飲注意"
            onClick={() => warm.current?.close()}
          >
            <XIcon size={22} weight="regular" aria-hidden="true" />
          </button>
        </div>
        <ul className="warm-notices">
          {notices.map((item) => (
            <li key={item.brand}>
              <strong>{item.brand}</strong>
              <p>{item.note}</p>
            </li>
          ))}
        </ul>
      </dialog>
    </div>
  );
}
