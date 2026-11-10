"use client";
import { useRef } from "react";
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
  return (
    <div className="home-tools">
      <button className="home-tool" onClick={() => quick.current?.showModal()}>
        <span aria-hidden="true">✎</span>
        <strong>自填飲料小抄</strong>
        <small>沒有菜單，也能自己寫好複製。</small>
      </button>
      {notices.length > 0 && (
        <button className="home-tool" onClick={() => warm.current?.showModal()}>
          <span aria-hidden="true">♨</span>
          <strong>溫熱飲店家注意</strong>
          <small>喝熱飲前先看杯型與規定。</small>
        </button>
      )}
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
            ×
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
            ×
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
