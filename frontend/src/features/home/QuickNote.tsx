"use client";
import Link from "next/link";
import { useState } from "react";
import { copyDrinkText } from "@/lib/copy";
import { normalizeSearch } from "@/lib/search";
import type { QuickStore } from "./HomeTools";

type Part = "signature" | "brand" | "drink";
const initialOrder: Part[] = ["signature", "brand", "drink"];
const partLabels: Record<Part, string> = {
  signature: "署名",
  brand: "店家",
  drink: "飲料與客製",
};
const defaultSizes = ["大杯", "中杯", "小杯", "瓶裝"];
const defaultSugars = ["全糖", "少糖", "半糖", "微糖", "一分糖", "無糖"];
const defaultIces = ["正常冰", "少冰", "微冰", "去冰", "常溫", "溫飲", "熱飲"];

export function QuickNote({ stores }: { stores: QuickStore[] }) {
  const [library, setLibrary] = useState(true);
  const [storeName, setStoreName] = useState("");
  const [drink, setDrink] = useState("");
  const [size, setSize] = useState("");
  const [sugar, setSugar] = useState("");
  const [ice, setIce] = useState("");
  const [milk, setMilk] = useState("");
  const [toppings, setToppings] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [signature, setSignature] = useState("");
  const [note, setNote] = useState("");
  const [price, setPrice] = useState("");
  const [withPrice, setWithPrice] = useState(false);
  const [includeBrand, setIncludeBrand] = useState(false);
  const [includeSignature, setIncludeSignature] = useState(false);
  const [order, setOrder] = useState(initialOrder);
  const [separator, setSeparator] = useState<"｜" | " " | "•">("｜");
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState("");
  const selectedStore = library
    ? stores.find((s) => normalizeSearch(s.name) === normalizeSearch(storeName))
    : undefined;
  const selectedDrink = selectedStore?.items.find(
    (item) => normalizeSearch(item.name) === normalizeSearch(drink),
  );
  const visibleOrder = order.filter(
    (part) =>
      part === "drink" ||
      (part === "brand" && includeBrand) ||
      (part === "signature" && includeSignature),
  );
  const text = copyDrinkText({
    item: { name: drink.trim() || "【飲料】" },
    brand: storeName.trim(),
    size: size.trim(),
    selections: [
      {
        role: "sweetness",
        name: "甜度",
        choices: sugar ? [{ id: "sugar", label: sugar }] : [],
      },
      {
        role: "temperature",
        name: "冰量／溫熱",
        choices: ice ? [{ id: "ice", label: ice }] : [],
      },
      {
        role: "custom",
        name: "換奶",
        choices: milk ? [{ id: "milk", label: milk }] : [],
      },
      {
        role: "custom",
        name: "加料",
        choices: toppings ? [{ id: "topping", label: toppings }] : [],
      },
    ],
    quantity,
    signature: includeSignature ? signature : "",
    includeBrand,
    note,
    price: price === "" ? null : Number(price),
    includePrice: withPrice,
    order,
    separator,
  });
  const ready =
    !!drink.trim() &&
    (!library || !!storeName.trim()) &&
    Number.isInteger(quantity) &&
    quantity >= 1 &&
    quantity <= 99 &&
    (!withPrice ||
      (price !== "" &&
        Number.isInteger(Number(price)) &&
        Number(price) >= 0)) &&
    (!includeSignature || !!signature.trim());
  function reset() {
    setLibrary(true);
    setStoreName("");
    setDrink("");
    setSize("");
    setSugar("");
    setIce("");
    setMilk("");
    setToppings("");
    setQuantity(1);
    setSignature("");
    setNote("");
    setPrice("");
    setWithPrice(false);
    setIncludeBrand(false);
    setIncludeSignature(false);
    setOrder(initialOrder);
    setSeparator("｜");
    setCopied(false);
    setCopyError("");
  }
  function move(key: Part, delta: number) {
    setOrder((old) => {
      const next = [...old],
        visible = visibleOrder;
      const target = visible[visible.indexOf(key) + delta];
      if (!target) return old;
      const at = next.indexOf(key),
        to = next.indexOf(target);
      [next[at], next[to]] = [next[to], next[at]];
      return next;
    });
  }
  async function copy() {
    if (!ready) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setCopyError("");
    } catch {
      setCopyError("無法自動複製，請選取上方文字手動複製。");
    }
  }
  return (
    <div className="quick-note">
      <div className="copy-preview quick-copy-preview">
        <strong>複製後的文字</strong>
        <output>{text}</output>
        <button
          type="button"
          className="primary copy-button"
          disabled={!ready}
          onClick={copy}
        >
          {ready
            ? "複製跟團文字"
            : library && !storeName.trim()
              ? "請填寫店家名稱"
              : "請填寫必填欄位"}
        </button>
        <button type="button" className="copy-reset" onClick={reset}>
          ↺ 重設
        </button>
        {copied && <p role="status">✓ 已複製</p>}
        {copyError && <p role="alert">{copyError}</p>}
      </div>
      <div className="quick-note-fields">
        <fieldset className="quick-mode">
          <legend>填寫方式</legend>
          <label className="pill">
            <input
              type="radio"
              name="quick-mode"
              checked={library}
              onChange={() => setLibrary(true)}
            />
            使用 copydrink 飲料
          </label>
          <label className="pill">
            <input
              type="radio"
              name="quick-mode"
              checked={!library}
              onChange={() => setLibrary(false)}
            />
            一般填寫
          </label>
        </fieldset>
        <label className="field">
          {library ? "搜尋或輸入店家" : "店家名稱（選填）"}
          <input
            list={library ? "quick-stores" : undefined}
            value={storeName}
            onChange={(e) => {
              setStoreName(e.target.value);
              setDrink("");
              setSize("");
              setSugar("");
              setIce("");
              setMilk("");
              setToppings("");
            }}
            placeholder={library ? "搜尋現有店家，或自行輸入" : "可以留白"}
          />
          {library && (
            <datalist id="quick-stores">
              {stores.map((s) => (
                <option key={s.slug} value={s.name} />
              ))}
            </datalist>
          )}
        </label>
        {selectedStore && (
          <p className="quick-tip">
            已找到 {selectedStore.name}：可選店內飲料，也可以自己輸入品名。
          </p>
        )}
        <label className="field">
          {selectedStore ? "搜尋或輸入飲料" : "飲料名稱"}
          <input
            list={selectedStore ? "quick-drinks" : undefined}
            value={drink}
            onChange={(e) => {
              setDrink(e.target.value);
              setSize("");
              setSugar("");
              setIce("");
              setMilk("");
              setToppings("");
            }}
            placeholder="例如：春烏龍"
          />
          {selectedStore && (
            <datalist id="quick-drinks">
              {selectedStore.items.map((i) => (
                <option key={i.id} value={i.name} />
              ))}
            </datalist>
          )}
        </label>
        {selectedDrink && (
          <div className="quick-catalog">
            <p>
              找到這杯飲料。下方仍可自行填寫；若要依照店家規則選擇，可開啟菜單。
            </p>
            <Link
              className="quick-link"
              href={
                "/stores/" +
                selectedStore!.slug +
                "?drink=" +
                encodeURIComponent(selectedDrink.id)
              }
            >
              設定這杯的口味與複製 →
            </Link>
          </div>
        )}
        <label className="field">
          杯型／容量（選填）
          <input
            list="quick-sizes"
            value={size}
            onChange={(e) => setSize(e.target.value)}
            placeholder="例如：大杯"
          />
          <datalist id="quick-sizes">
            {(selectedDrink?.sizes.length
              ? selectedDrink.sizes
              : defaultSizes
            ).map((x) => (
              <option key={x} value={x} />
            ))}
          </datalist>
        </label>
        <label className="field">
          甜度（可自行輸入）
          <input
            list="quick-sugars"
            value={sugar}
            onChange={(e) => setSugar(e.target.value)}
            placeholder="例如：微糖"
          />
          <datalist id="quick-sugars">
            {(selectedDrink?.sugars.length
              ? selectedDrink.sugars
              : selectedStore?.sugars.length
                ? selectedStore.sugars
                : defaultSugars
            ).map((x) => (
              <option key={x} value={x} />
            ))}
          </datalist>
        </label>
        <label className="field">
          冰量／溫熱（可自行輸入）
          <input
            list="quick-ices"
            value={ice}
            onChange={(e) => setIce(e.target.value)}
            placeholder="例如：少冰、熱飲"
          />
          <datalist id="quick-ices">
            {(selectedDrink?.ices.length
              ? selectedDrink.ices
              : selectedStore?.ices.length
                ? selectedStore.ices
                : defaultIces
            ).map((x) => (
              <option key={x} value={x} />
            ))}
          </datalist>
        </label>
        <label className="field">
          換奶／配方（選填）
          <input
            value={milk}
            onChange={(e) => setMilk(e.target.value)}
            placeholder="例如：換燕麥奶"
          />
        </label>
        <label className="field">
          配料（選填）
          <input
            list="quick-toppings"
            value={toppings}
            onChange={(e) => setToppings(e.target.value)}
            placeholder="例如：珍珠、椰果"
          />
          <datalist id="quick-toppings">
            {(selectedDrink?.toppings.length
              ? selectedDrink.toppings
              : selectedStore?.toppings || []
            ).map((x) => (
              <option key={x} value={x} />
            ))}
          </datalist>
        </label>
        <label className="field">
          數量
          <input
            type="number"
            min="1"
            max="99"
            step="1"
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
          />
        </label>
        <label className="inline-check">
          <input
            type="checkbox"
            checked={includeSignature}
            onChange={(e) => setIncludeSignature(e.target.checked)}
          />
          加入署名
        </label>
        {includeSignature && (
          <label className="field">
            署名
            <input
              value={signature}
              onChange={(e) => setSignature(e.target.value)}
              placeholder="例如：小潔"
            />
          </label>
        )}
        <label className="inline-check">
          <input
            type="checkbox"
            checked={includeBrand}
            onChange={(e) => setIncludeBrand(e.target.checked)}
          />
          複製文字顯示店家
        </label>
        {(includeSignature || includeBrand) && (
          <fieldset className="quick-order">
            <legend>文字順序</legend>
            <p>按箭頭調整，手機也能操作。</p>
            {visibleOrder.map((part) => (
              <div key={part} className="quick-order-row">
                <span>{partLabels[part]}</span>
                <button
                  type="button"
                  aria-label={"將" + partLabels[part] + "上移"}
                  onClick={() => move(part, -1)}
                  disabled={visibleOrder.indexOf(part) === 0}
                >
                  ↑
                </button>
                <button
                  type="button"
                  aria-label={"將" + partLabels[part] + "下移"}
                  onClick={() => move(part, 1)}
                  disabled={
                    visibleOrder.indexOf(part) === visibleOrder.length - 1
                  }
                >
                  ↓
                </button>
              </div>
            ))}
          </fieldset>
        )}
        <label className="inline-check">
          <input
            type="checkbox"
            checked={withPrice}
            onChange={(e) => setWithPrice(e.target.checked)}
          />
          加入價格
        </label>
        {withPrice && (
          <label className="field">
            價格
            <input
              type="number"
              min="0"
              step="1"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
          </label>
        )}
        <label className="field">
          備註（選填）
          <textarea value={note} onChange={(e) => setNote(e.target.value)} />
        </label>
        <fieldset className="quick-separator">
          <legend>文字分隔</legend>
          {(
            [
              ["｜", "直線"],
              [" ", "空格"],
              ["•", "圓點"],
            ] as const
          ).map(([value, label]) => (
            <label key={label}>
              <input
                type="radio"
                name="quick-separator"
                checked={separator === value}
                onChange={() => setSeparator(value)}
              />{" "}
              {label}
            </label>
          ))}
        </fieldset>
      </div>
    </div>
  );
}
