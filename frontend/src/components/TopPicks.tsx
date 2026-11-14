"use client";
import { useRef } from "react";
import { StarIcon } from "@phosphor-icons/react/dist/csr/Star";
import { XIcon } from "@phosphor-icons/react/dist/csr/X";
import { ArrowRightIcon } from "@phosphor-icons/react/dist/csr/ArrowRight";
import type { MenuItem } from "@/lib/types";
import { useStoreSelection } from "@/features/menu/StoreSelection";
import { track } from "@/lib/analytics";
export function TopPicks({
  title,
  description,
  items,
  storeKey,
}: {
  title: string;
  description: string;
  items: Array<{ item: MenuItem; note: string }>;
  storeKey: string;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const { setSelected } = useStoreSelection();
  if (!items.length) return null;
  return (
    <>
      <button
        className="top-button"
        type="button"
        onClick={() => dialog.current?.showModal()}
      >
        <StarIcon size={18} weight="fill" aria-hidden="true" />
        {title} · {items.length} 款
      </button>
      <dialog
        className="top-dialog utility-dialog"
        ref={dialog}
        aria-label={title}
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
        <div className="top-dialog-heading utility-heading">
          <h2>{title}</h2>
          <button
            type="button"
            className="close-button"
            aria-label="關閉必喝榜單"
            onClick={() => dialog.current?.close()}
          >
            <XIcon size={20} weight="regular" aria-hidden="true" />
          </button>
        </div>
        {description && <p>{description}</p>}
        <ol>
          {items.map((item, index) => (
            <li key={item.item.id}>
              <button
                type="button"
                className="top-item-action"
                onClick={() => {
                  dialog.current?.close();
                  setSelected(item.item);
                  track({
                    type: "drink_open",
                    store: storeKey,
                    drink: item.item.id,
                  });
                }}
                aria-label={`設定並複製${item.item.name}`}
              >
                <span className="top-item-rank">TOP {index + 1}</span>
                <span className="top-item-copy">
                  <strong>{item.item.name}</strong>
                  {item.note && <small>{item.note}</small>}
                </span>
                <span className="top-item-cta">
                  設定與複製 <ArrowRightIcon size={18} aria-hidden="true" />
                </span>
              </button>
            </li>
          ))}
        </ol>
      </dialog>
    </>
  );
}
