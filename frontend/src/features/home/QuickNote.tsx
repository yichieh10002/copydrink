"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { CaretDownIcon } from "@phosphor-icons/react/dist/csr/CaretDown";
import { ArrowCounterClockwiseIcon } from "@phosphor-icons/react/dist/csr/ArrowCounterClockwise";
import { ArrowRightIcon } from "@phosphor-icons/react/dist/csr/ArrowRight";
import { ArrowUpIcon } from "@phosphor-icons/react/dist/csr/ArrowUp";
import { ArrowDownIcon } from "@phosphor-icons/react/dist/csr/ArrowDown";
import { CopyToast } from "@/components/CopyToast";
import { copyDrinkText } from "@/lib/copy";
import { normalizeSearch } from "@/lib/search";
import type { QuickStore } from "./HomeTools";
import { RequiredMark } from "@/components/RequiredMark";

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

function PickerInput({
  id,
  label,
  value,
  options,
  placeholder,
  onChange,
  disabled = false,
  required = false,
}: {
  id: string;
  label: string;
  value: string;
  options: string[];
  placeholder: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  required?: boolean;
}) {
  const root = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const filteredOptions = options.filter(
    (option) =>
      !value || normalizeSearch(option).includes(normalizeSearch(value)),
  );

  useEffect(() => {
    function close(event: PointerEvent) {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, []);

  function openOptions() {
    if (disabled || options.length === 0) return;
    const nextOpen = !open;
    input.current?.focus();
    setOpen(nextOpen);
  }
  return (
    <div className="field quick-picker-field" ref={root}>
      <label htmlFor={id}>
        {label}
        {required && <RequiredMark />}
      </label>
      <div className="quick-picker-control">
        <input
          ref={input}
          id={id}
          value={value}
          onChange={(event) => {
            onChange(event.target.value);
            setOpen(true);
          }}
          onFocus={() => {
            if (!disabled && options.length > 0) setOpen(true);
          }}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete="off"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={open}
          aria-controls={`${id}-options`}
        />
        <button
          type="button"
          onClick={openOptions}
          disabled={disabled || options.length === 0}
          aria-label={`展開${label}選項`}
          aria-expanded={open}
          aria-controls={`${id}-options`}
        >
          <CaretDownIcon
            size={18}
            weight="bold"
            className={open ? "picker-caret-open" : undefined}
            aria-hidden="true"
          />
        </button>
      </div>
      <small className="quick-picker-hint">
        {disabled ? "請先選擇店家" : "可輸入搜尋，或點右側箭頭查看選項"}
      </small>
      {open && (
        <div className="quick-picker-menu" id={`${id}-options`} role="listbox">
          {filteredOptions.length ? (
            filteredOptions.map((option) => (
              <button
                type="button"
                role="option"
                aria-selected={option === value}
                key={option}
                onClick={() => {
                  onChange(option);
                  setOpen(false);
                }}
              >
                {option}
              </button>
            ))
          ) : (
            <p>沒有符合的選項，仍可繼續自行輸入。</p>
          )}
        </div>
      )}
    </div>
  );
}

export function QuickNote({ stores }: { stores: QuickStore[] }) {
  const [library, setLibrary] = useState(true);
  const [storeName, setStoreName] = useState("");
  const [drink, setDrink] = useState("");
  const [size, setSize] = useState("");
  const [sugar, setSugar] = useState("");
  const [ice, setIce] = useState("");
  const [toppings, setToppings] = useState("");
  const [customSelections, setCustomSelections] = useState<
    Record<string, string[]>
  >({});
  const [quantity, setQuantity] = useState(1);
  const [signature, setSignature] = useState("");
  const [note, setNote] = useState("");
  const [price, setPrice] = useState("");
  const [withPrice, setWithPrice] = useState(false);
  const [includeBrand, setIncludeBrand] = useState(false);
  const [includeSignature, setIncludeSignature] = useState(false);
  const [order, setOrder] = useState(initialOrder);
  const [separator, setSeparator] = useState<"｜" | " " | "•">("｜");
  const [copyNotice, setCopyNotice] = useState(0);
  const [copyError, setCopyError] = useState("");
  const selectedStore = library
    ? stores.find((s) => normalizeSearch(s.name) === normalizeSearch(storeName))
    : undefined;
  const selectedDrink = selectedStore?.items.find(
    (item) => normalizeSearch(item.name) === normalizeSearch(drink),
  );
  useEffect(() => {
    const fixed = Object.fromEntries(
      (selectedDrink?.customGroups || [])
        .filter((group) => group.mode === "fixed" && group.fixedChoiceId)
        .map((group) => [group.id, [group.fixedChoiceId!]]),
    );
    setCustomSelections(fixed);
  }, [selectedDrink?.id]);
  useEffect(() => {
    if (!copyNotice) return;
    const timeout = window.setTimeout(() => setCopyNotice(0), 2000);
    return () => window.clearTimeout(timeout);
  }, [copyNotice]);
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
        role: "topping",
        name: "加料",
        choices: toppings ? [{ id: "topping", label: toppings }] : [],
      },
      ...(selectedDrink?.customGroups || []).map((group) => ({
        role: "custom",
        name: group.name,
        choices: group.choices.filter((choice) =>
          (customSelections[group.id] || []).includes(choice.id),
        ),
      })),
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
    (!library || (!!selectedStore && !!selectedDrink)) &&
    Number.isInteger(quantity) &&
    quantity >= 1 &&
    quantity <= 99 &&
    (!withPrice ||
      (price !== "" &&
        Number.isInteger(Number(price)) &&
        Number(price) >= 0)) &&
    (!includeSignature || !!signature.trim()) &&
    (selectedDrink?.customGroups || []).every(
      (group) =>
        !group.required || (customSelections[group.id] || []).length > 0,
    );
  function reset() {
    setLibrary(true);
    setStoreName("");
    setDrink("");
    setSize("");
    setSugar("");
    setIce("");
    setToppings("");
    setCustomSelections({});
    setQuantity(1);
    setSignature("");
    setNote("");
    setPrice("");
    setWithPrice(false);
    setIncludeBrand(false);
    setIncludeSignature(false);
    setOrder(initialOrder);
    setSeparator("｜");
    setCopyNotice(0);
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
      setCopyNotice((value) => value + 1);
      setCopyError("");
    } catch {
      setCopyError("無法自動複製，請選取上方文字手動複製。");
    }
  }
  return (
    <div className="quick-note">
      <div className="copy-preview quick-copy-preview">
        <div className="copy-preview-heading">
          <strong>複製後的文字</strong>
          <button type="button" className="copy-reset" onClick={reset}>
            <ArrowCounterClockwiseIcon size={16} aria-hidden="true" /> 重設
          </button>
        </div>
        <output>{text}</output>
        <button
          type="button"
          className="primary copy-button"
          disabled={!ready}
          onClick={copy}
        >
          {ready
            ? "複製跟團文字"
            : library && !selectedStore
              ? "請選擇資料庫店家"
              : library && !selectedDrink
                ? "請選擇資料庫飲料"
                : "請填寫必填欄位"}
        </button>
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
              onChange={() => {
                setLibrary(true);
                setStoreName("");
                setDrink("");
                setSize("");
                setSugar("");
                setIce("");
                setToppings("");
                setCustomSelections({});
              }}
            />
            使用 copydrink 飲料
          </label>
          <label className="pill">
            <input
              type="radio"
              name="quick-mode"
              checked={!library}
              onChange={() => {
                setLibrary(false);
                setStoreName("");
                setDrink("");
                setSize("");
                setSugar("");
                setIce("");
                setToppings("");
                setCustomSelections({});
              }}
            />
            一般填寫
          </label>
        </fieldset>
        {library ? (
          <PickerInput
            id="quick-store"
            label="選擇店家"
            required
            value={storeName}
            options={stores.map((store) => store.name)}
            placeholder="輸入店家名稱或點右側箭頭"
            onChange={(value) => {
              setStoreName(value);
              setDrink("");
              setSize("");
              setSugar("");
              setIce("");
              setToppings("");
              setCustomSelections({});
            }}
          />
        ) : (
          <label className="field">
            店家名稱（選填）
            <input
              value={storeName}
              onChange={(event) => setStoreName(event.target.value)}
              placeholder="可以留白"
            />
          </label>
        )}
        {selectedStore && (
          <p className="quick-tip">
            已選擇 {selectedStore.name}
            。下一步請從資料庫選擇飲料；若要自行輸入，請切換「一般填寫」。
          </p>
        )}
        {library ? (
          <PickerInput
            id="quick-drink"
            label="選擇飲料"
            required
            value={drink}
            options={selectedStore?.items.map((item) => item.name) || []}
            placeholder={
              selectedStore ? "輸入飲料名稱或點右側箭頭" : "請先選擇店家"
            }
            disabled={!selectedStore}
            onChange={(value) => {
              setDrink(value);
              setSize("");
              setSugar("");
              setIce("");
              setToppings("");
              setCustomSelections({});
            }}
          />
        ) : (
          <label className="field">
            飲料名稱
            <RequiredMark />
            <input
              value={drink}
              onChange={(event) => setDrink(event.target.value)}
              placeholder="例如：春烏龍"
            />
          </label>
        )}
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
              設定這杯的口味與複製{" "}
              <ArrowRightIcon size={16} aria-hidden="true" />
            </Link>
          </div>
        )}
        <PickerInput
          id="quick-size"
          label="杯型／容量（選填）"
          value={size}
          onChange={setSize}
          placeholder="例如：大杯"
          options={
            selectedDrink?.sizes.length ? selectedDrink.sizes : defaultSizes
          }
        />
        <PickerInput
          id="quick-sugar"
          label="甜度（可自行輸入）"
          value={sugar}
          onChange={setSugar}
          placeholder="例如：微糖"
          options={
            selectedDrink?.sugars.length
              ? selectedDrink.sugars
              : selectedStore?.sugars.length
                ? selectedStore.sugars
                : defaultSugars
          }
        />
        <PickerInput
          id="quick-ice"
          label="冰量／溫熱（可自行輸入）"
          value={ice}
          onChange={setIce}
          placeholder="例如：少冰、熱飲"
          options={
            selectedDrink?.ices.length
              ? selectedDrink.ices
              : selectedStore?.ices.length
                ? selectedStore.ices
                : defaultIces
          }
        />
        {(selectedDrink?.customGroups || []).map((group) => (
          <fieldset className="choice-group quick-custom-group" key={group.id}>
            <legend>
              {group.name}
              {group.required ? (
                <>
                  （必選）
                  <RequiredMark />
                </>
              ) : (
                "（選填）"
              )}
            </legend>
            {group.mode === "fixed" ? (
              <p className="fixed-choice">
                {
                  group.choices.find(
                    (choice) => choice.id === group.fixedChoiceId,
                  )?.label
                }
              </p>
            ) : group.kind === "single" ? (
              <select
                value={customSelections[group.id]?.[0] || ""}
                onChange={(event) =>
                  setCustomSelections((current) => ({
                    ...current,
                    [group.id]: event.target.value ? [event.target.value] : [],
                  }))
                }
              >
                <option value="">請選擇</option>
                {group.choices.map((choice) => (
                  <option value={choice.id} key={choice.id}>
                    {choice.label}
                  </option>
                ))}
              </select>
            ) : (
              <div className="choice-list">
                {group.choices.map((choice) => {
                  const checked = (customSelections[group.id] || []).includes(
                    choice.id,
                  );
                  return (
                    <label className="pill" key={choice.id}>
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() =>
                          setCustomSelections((current) => {
                            const previous = current[group.id] || [];
                            const next = checked
                              ? previous.filter((id) => id !== choice.id)
                              : group.maxChoices &&
                                  previous.length >= group.maxChoices
                                ? previous
                                : [...previous, choice.id];
                            return { ...current, [group.id]: next };
                          })
                        }
                      />
                      {choice.label}
                    </label>
                  );
                })}
              </div>
            )}
          </fieldset>
        ))}
        <PickerInput
          id="quick-toppings"
          label="配料（選填）"
          value={toppings}
          onChange={setToppings}
          placeholder="例如：珍珠、椰果"
          options={
            selectedDrink?.toppings.length
              ? selectedDrink.toppings
              : selectedStore?.toppings || []
          }
        />
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
                  <ArrowUpIcon size={18} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  aria-label={"將" + partLabels[part] + "下移"}
                  onClick={() => move(part, 1)}
                  disabled={
                    visibleOrder.indexOf(part) === visibleOrder.length - 1
                  }
                >
                  <ArrowDownIcon size={18} aria-hidden="true" />
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
      <CopyToast show={copyNotice > 0} />
    </div>
  );
}
