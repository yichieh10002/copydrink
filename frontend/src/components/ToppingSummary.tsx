"use client";

import { useRef } from "react";

type Topping = { name: string; price: number | null };

function priceLabel(price: number | null) {
  return price === null ? "價格未提供" : price === 0 ? "免費" : `+$${price}`;
}

export function ToppingSummary({ toppings }: { toppings: Topping[] }) {
  const dialog = useRef<HTMLDialogElement>(null);
  if (!toppings.length) return <small>依各商品設定</small>;

  if (toppings.length <= 3)
    return (
      <small>
        {toppings.map((t) => `${t.name} ${priceLabel(t.price)}`).join(" · ")}
      </small>
    );

  const prices = toppings.map((t) => t.price).filter((p) => p !== null);
  const range = prices.length
    ? Math.min(...prices) === Math.max(...prices)
      ? `均一價 ${priceLabel(prices[0])}`
      : `${priceLabel(Math.min(...prices))}～${priceLabel(Math.max(...prices))}`
    : "價格以品項為準";

  return (
    <>
      <small className="topping-summary">
        {toppings.length} 項可選 · {range}
        <button type="button" onClick={() => dialog.current?.showModal()}>
          查看全部
        </button>
      </small>
      <dialog
        ref={dialog}
        className="topping-dialog utility-dialog"
        aria-label="全部配料"
        onClick={(event) => {
          const rect = event.currentTarget.getBoundingClientRect();
          if (
            event.target === event.currentTarget &&
            (event.clientX < rect.left ||
              event.clientX > rect.right ||
              event.clientY < rect.top ||
              event.clientY > rect.bottom)
          )
            event.currentTarget.close();
        }}
      >
        <div className="utility-heading">
          <h2>配料一覽</h2>
          <button
            type="button"
            aria-label="關閉配料一覽"
            onClick={() => dialog.current?.close()}
          >
            ×
          </button>
        </div>
        <ul className="topping-list">
          {toppings.map((t, index) => (
            <li key={`${t.name}-${index}`}>
              <span>{t.name}</span>
              <span>{priceLabel(t.price)}</span>
            </li>
          ))}
        </ul>
        <p className="topping-disclaimer">實際可選配料以各飲品設定為準。</p>
      </dialog>
    </>
  );
}
