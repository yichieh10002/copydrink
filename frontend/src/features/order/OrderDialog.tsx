"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import type { MenuItem, OptionGroup, Store } from "@/lib/types";
import {
  allTemperatureChoices,
  availableCups,
  effectiveGroups,
  formatPrice,
  priceFor,
  visibleCups,
} from "@/lib/menu";
import { copyDrinkText } from "@/lib/copy";
import { track } from "@/lib/analytics";
import { ChoiceFieldset, CupChoices } from "./ChoiceFieldset";

type CopyPart = "signature" | "brand" | "drink";
const defaultOrder: CopyPart[] = ["signature", "brand", "drink"];
const labels: Record<CopyPart, string> = {
  signature: "署名",
  brand: "店家",
  drink: "飲料與客製",
};
const orderKey = "copydrink-copy-order";

export function OrderDialog({
  store,
  item,
  regionId,
  onClose,
}: {
  store: Store;
  item: MenuItem;
  regionId: string;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const [cupSize, setCupSize] = useState(
    () =>
      visibleCups(store.document, item, regionId)[0]?.size ||
      availableCups(item, regionId)[0]?.size ||
      "",
  );
  const [selected, setSelected] = useState<Record<string, string[]>>({});
  const [quantity, setQuantity] = useState(1),
    [signature, setSignature] = useState(""),
    [includeBrand, setIncludeBrand] = useState(false);
  const [includeSignature, setIncludeSignature] = useState(false),
    [includePrice, setIncludePrice] = useState(false),
    [price, setPrice] = useState(""),
    [note, setNote] = useState("");
  const [order, setOrder] = useState<CopyPart[]>(defaultOrder);
  const [separator, setSeparator] = useState<"｜" | " " | "•">("｜");
  const opening = useRef<{ order: CopyPart[]; separator: "｜" | " " | "•" }>({
    order: defaultOrder,
    separator: "｜",
  });
  const [copied, setCopied] = useState(false),
    [error, setError] = useState("");
  useEffect(() => {
    const dialog = dialogRef.current;
    dialog?.showModal();
    try {
      const stored = JSON.parse(localStorage.getItem(orderKey) || "null");
      if (
        Array.isArray(stored) &&
        stored.length === 3 &&
        defaultOrder.every((part) => stored.includes(part))
      ) {
        opening.current.order = stored;
        setOrder(stored);
      }
    } catch {
      /* The default order remains available if browser storage is disabled. */
    }
    return () => dialog?.close();
  }, []);
  const tempChoices = useMemo(
    () => allTemperatureChoices(store.document, item, regionId),
    [store, item, regionId],
  );
  const selectedTemp = selected.temperature?.[0] || "";
  const cups = visibleCups(store.document, item, regionId, selectedTemp);
  const cup =
    cups.find((c) => c.size === cupSize) ||
    cups[0] ||
    availableCups(item, regionId)[0];
  const groups = useMemo(() => {
    if (!cup) return [];
    const own = effectiveGroups(store.document, item, cup);
    const temperatureGroup =
      own.find((g) => g.role === "temperature") ||
      item.optionGroups?.find((g) => g.role === "temperature") ||
      store.document.brand.optionGroups?.find((g) => g.role === "temperature");
    if (!temperatureGroup || !tempChoices.length) return own;
    const merged = { ...temperatureGroup, choices: tempChoices };
    return own.some((g) => g.role === "temperature")
      ? own.map((g) => (g.role === "temperature" ? merged : g))
      : [...own, merged];
  }, [store, item, cup, tempChoices]);
  const choices = groups.map((group) => {
    const ids =
      group.mode === "fixed"
        ? [group.fixedChoiceId!]
        : selected[group.id] || [];
    return { group, selected: group.choices.filter((c) => ids.includes(c.id)) };
  });
  const ready =
    !!cup &&
    quantity >= 1 &&
    quantity <= 20 &&
    Number.isInteger(quantity) &&
    (!includeSignature || !!signature.trim()) &&
    (!includePrice ||
      (price !== "" &&
        Number.isInteger(Number(price)) &&
        Number(price) >= 0)) &&
    choices.every(
      ({ group, selected }) => !group.required || selected.length > 0,
    );
  const extra = choices
    .flatMap((x) => x.selected.map((c) => Number(c.price) || 0))
    .reduce((a, b) => a + b, 0);
  const base = priceFor(cup, regionId),
    total = base === null ? null : base + extra;
  const text = copyDrinkText({
    item,
    brand: store.document.brand.name,
    size: cup?.size || "",
    selections: choices.map((x) => ({
      role: x.group.role,
      name: x.group.name,
      choices: x.selected,
    })),
    quantity,
    signature: includeSignature ? signature : "",
    includeBrand,
    note,
    price: price === "" ? null : Number(price),
    includePrice,
    order,
    separator,
  });
  const visibleOrder = order.filter(
    (part) =>
      part === "drink" ||
      (part === "brand" && includeBrand) ||
      (part === "signature" && includeSignature),
  );
  function move(part: CopyPart, direction: number) {
    const other = visibleOrder[visibleOrder.indexOf(part) + direction];
    if (!other) return;
    setOrder((old) => {
      const next = [...old],
        from = next.indexOf(part),
        to = next.indexOf(other);
      [next[from], next[to]] = [next[to], next[from]];
      try {
        localStorage.setItem(orderKey, JSON.stringify(next));
      } catch {
        /* Still works without storage. */
      }
      return next;
    });
  }
  function reset() {
    setCupSize(
      visibleCups(store.document, item, regionId)[0]?.size ||
        availableCups(item, regionId)[0]?.size ||
        "",
    );
    setSelected({});
    setQuantity(1);
    setSignature("");
    setIncludeSignature(false);
    setIncludeBrand(false);
    setNote("");
    setIncludePrice(false);
    setPrice("");
    setOrder([...opening.current.order]);
    setSeparator(opening.current.separator);
    try {
      localStorage.setItem(orderKey, JSON.stringify(opening.current.order));
    } catch {
      /* Still works without storage. */
    }
    setCopied(false);
    setError("");
    bodyRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }
  function choose(group: OptionGroup, id: string) {
    setCopied(false);
    setError("");
    if (group.kind === "single") {
      if (group.role === "temperature") {
        const options = visibleCups(store.document, item, regionId, id);
        if (!options.length) return;
        if (!options.some((c) => c.size === cupSize))
          setCupSize(options[0].size);
      }
      setSelected((old) => ({ ...old, [group.id]: [id] }));
      return;
    }
    setSelected((old) => {
      const prior = old[group.id] || [];
      return {
        ...old,
        [group.id]: prior.includes(id)
          ? prior.filter((x) => x !== id)
          : group.maxChoices && prior.length >= group.maxChoices
            ? prior
            : [...prior, id],
      };
    });
  }
  async function copy() {
    if (!ready) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      track({ type: "drink_copy", store: store.key, drink: item.id });
    } catch {
      setError("無法自動複製，請選取下方文字手動複製。");
    }
  }
  return (
    <dialog
      ref={dialogRef}
      className="order-dialog"
      aria-labelledby="order-title"
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        const rect = event.currentTarget.getBoundingClientRect();
        if (
          event.target === event.currentTarget &&
          (event.clientX < rect.left ||
            event.clientX > rect.right ||
            event.clientY < rect.top ||
            event.clientY > rect.bottom)
        )
          onClose();
      }}
    >
      <div className="dialog-head">
        <div>
          <h2 id="order-title">{item.name}</h2>
          {item.note && <p>{item.note}</p>}
          {item.reminder && (
            <span className="dialog-reminder">{item.reminder}</span>
          )}
        </div>
        <button
          type="button"
          className="close-button"
          aria-label="關閉飲料設定"
          onClick={onClose}
        >
          ×
        </button>
      </div>
      <div className="copy-preview order-copy-preview">
        <strong>複製後的文字</strong>
        <output>{text}</output>
        <button
          type="button"
          className="primary copy-button"
          disabled={!ready}
          onClick={copy}
        >
          {ready ? "複製跟團文字" : "請完成必選項目"}
        </button>
        <button type="button" className="copy-reset" onClick={reset}>
          ↺ 重設
        </button>
        {copied && <p role="status">✓ 已複製，可以貼到群組囉！</p>}
        {error && <p role="alert">{error}</p>}
      </div>
      <div className="dialog-body" ref={bodyRef}>
        <CupChoices cups={cups} size={cup?.size || ""} onChange={setCupSize} />
        {groups.map((group) => (
          <ChoiceFieldset
            key={group.id}
            group={group}
            selected={selected[group.id] || []}
            onChoose={(choice) => choose(group, choice.id)}
          />
        ))}
        <label className="field">
          數量
          <input
            type="number"
            min="1"
            max="20"
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
          />
        </label>
        <label className="inline-check">
          <input
            type="checkbox"
            checked={includePrice}
            onChange={(e) => setIncludePrice(e.target.checked)}
          />
          在跟團文字顯示價格
        </label>
        {includePrice && (
          <label className="field">
            填寫價格
            <input
              type="number"
              min="0"
              step="1"
              inputMode="numeric"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="輸入金額"
            />
          </label>
        )}
        <p className="reference-price">
          菜單參考價 {formatPrice(total)}／杯；實際價格與供應以門市為準。
        </p>
        <label className="field">
          備註（選填）
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="例如：奶蓋另分裝"
          />
        </label>
        <fieldset className="copy-order-builder">
          <legend>跟團文字內容與順序</legend>
          <p>勾選要顯示的內容，再按箭頭調整順序。</p>
          <div className="copy-order-list">
            {order.map((part) => (
              <div className="copy-order-row" key={part}>
                {part === "drink" ? (
                  <span className="copy-part-label">飲料與客製</span>
                ) : (
                  <label className="inline-check">
                    <input
                      type="checkbox"
                      checked={
                        part === "signature" ? includeSignature : includeBrand
                      }
                      onChange={(e) =>
                        part === "signature"
                          ? setIncludeSignature(e.target.checked)
                          : setIncludeBrand(e.target.checked)
                      }
                    />
                    {labels[part]}
                  </label>
                )}
                {part === "signature" && includeSignature && (
                  <input
                    className="copy-signature"
                    value={signature}
                    onChange={(e) => setSignature(e.target.value)}
                    placeholder="填寫署名"
                    maxLength={40}
                    aria-label="署名"
                  />
                )}
                {part === "brand" && includeBrand && (
                  <span className="copy-part-value">
                    {store.document.brand.name}
                  </span>
                )}
                {part === "drink" && (
                  <span className="copy-part-value">{item.name}</span>
                )}
                <div className="copy-order-arrows">
                  <button
                    type="button"
                    aria-label={`將${labels[part]}上移`}
                    disabled={
                      !visibleOrder.includes(part) || visibleOrder[0] === part
                    }
                    onClick={() => move(part, -1)}
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    aria-label={`將${labels[part]}下移`}
                    disabled={
                      !visibleOrder.includes(part) ||
                      visibleOrder.at(-1) === part
                    }
                    onClick={() => move(part, 1)}
                  >
                    ↓
                  </button>
                </div>
              </div>
            ))}
          </div>
        </fieldset>
        <fieldset className="copy-separator">
          <legend>文字分隔</legend>
          {(
            [
              ["｜", "｜ 直線"],
              [" ", "空格"],
              ["•", "• 圓點"],
            ] as const
          ).map(([value, label]) => (
            <label key={value} className="pill">
              <input
                type="radio"
                name="order-separator"
                checked={separator === value}
                onChange={() => setSeparator(value)}
              />
              {label}
            </label>
          ))}
        </fieldset>
      </div>
    </dialog>
  );
}
