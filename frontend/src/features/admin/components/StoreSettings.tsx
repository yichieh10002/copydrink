"use client";
import { useState } from "react";
import type { AdminDocument } from "../types";
import { clone } from "../types";
import { FormField, GrowingTextarea } from "./FormField";

export function StoreSettings({
  document,
  busy,
  onSave,
  onDirtyChange,
}: {
  document: AdminDocument;
  busy: boolean;
  onSave: (next: AdminDocument) => Promise<boolean>;
  onDirtyChange: (dirty: boolean) => void;
}) {
  const [value, setValue] = useState(() => clone(document));
  const [sugarsText, setSugarsText] = useState(
    (document.brand.sugars || []).join("\n"),
  );
  const [icesText, setIcesText] = useState(
    (document.brand.ices || []).join("\n"),
  );
  const [toppingsText, setToppingsText] = useState(
    (document.brand.toppings || [])
      .map((t) => `${t.name},${t.price}`)
      .join("\n"),
  );
  const [error, setError] = useState("");
  const change = (next: AdminDocument) => {
    onDirtyChange(true);
    setValue(next);
  };
  const brand = value.brand;
  const intro =
    typeof brand.introduction === "string"
      ? { title: "品牌介紹", content: brand.introduction, expanded: false }
      : brand.introduction || {
          title: "品牌介紹",
          content: "",
          expanded: false,
        };
  const types = brand.cupTypes || [];
  const setBrand = (key: keyof typeof brand, data: unknown) =>
    change({ ...value, brand: { ...brand, [key]: data } });
  async function importLogo(file?: File) {
    if (!file) return;
    if (
      ![
        /^image\/(png|jpeg|webp)$/.test(file.type),
        file.size <= 5_000_000,
      ].every(Boolean)
    ) {
      setError("Logo 請選擇 5MB 以下的 PNG、JPG 或 WebP。");
      return;
    }
    const image = new Image(),
      url = URL.createObjectURL(file);
    try {
      await new Promise<void>((resolve, reject) => {
        image.onload = () => resolve();
        image.onerror = () => reject(new Error("圖片無法讀取"));
        image.src = url;
      });
      const side = Math.max(image.width, image.height);
      if (!side) throw new Error("圖片尺寸無效");
      const canvas = window.document.createElement("canvas"),
        ratio = Math.min(1, 256 / side);
      canvas.width = Math.max(1, Math.round(image.width * ratio));
      canvas.height = Math.max(1, Math.round(image.height * ratio));
      canvas
        .getContext("2d")
        ?.drawImage(image, 0, 0, canvas.width, canvas.height);
      setBrand("logoUrl", canvas.toDataURL("image/webp", 0.82));
      setError("");
    } catch {
      setError("無法讀取 Logo，請換一張圖片。");
    } finally {
      URL.revokeObjectURL(url);
    }
  }
  const updateCup = (id: string, key: "size" | "capacity", data: string) => {
    change({
      ...value,
      brand: {
        ...brand,
        cupTypes: types.map((t) => (t.id === id ? { ...t, [key]: data } : t)),
      },
    });
  };
  const addRegion = () => {
    const id = `region-${crypto.randomUUID()}`;
    const next = clone(value);
    next.regions.push({ id, name: "", enabled: true });
    for (const item of next.items)
      for (const cup of item.cups)
        cup.prices[id] = { price: null, available: true };
    change(next);
  };
  const removeRegion = (id: string) => {
    if (value.regions.length <= 1) {
      setError("至少保留一份地區菜單。");
      return;
    }
    if (!window.confirm("刪除此地區及所有飲料對應的價格？這只會修改草稿。"))
      return;
    const next = clone(value);
    next.regions = next.regions.filter((r) => r.id !== id);
    for (const item of next.items)
      for (const cup of item.cups) delete cup.prices[id];
    change(next);
  };
  async function save() {
    const names = types.map((t) => t.size.trim());
    if (!brand.name.trim() || brand.name.length > 160) {
      setError("店名不可空白，最多 160 字。");
      return;
    }
    if (
      !types.length ||
      types.length > 10 ||
      names.some((n) => !n || n.length > 60) ||
      new Set(names).size !== names.length
    ) {
      setError("請設定 1～10 種不重複的杯型名稱。");
      return;
    }
    if (
      !value.regions.length ||
      value.regions.length > 20 ||
      !value.regions.some((r) => r.enabled) ||
      value.regions.some((r) => !r.name.trim() || r.name.length > 80) ||
      new Set(value.regions.map((r) => r.name.trim())).size !==
        value.regions.length
    ) {
      setError("請設定 1～20 個不重複的地區，且至少啟用一個。");
      return;
    }
    if (types.some((t) => (t.capacity || "").length > 80)) {
      setError("杯型容量最多 80 字。");
      return;
    }
    for (const key of [
      "website",
      "menuUrl",
      "storesUrl",
      "nutritionUrl",
    ] as const) {
      const url = brand[key];
      if (url && !/^https?:\/\//i.test(url)) {
        setError("網址必須以 http:// 或 https:// 開頭。");
        return;
      }
    }
    if (
      brand.logoUrl &&
      !/^https?:\/\//i.test(brand.logoUrl) &&
      !/^data:image\/webp;base64,/i.test(brand.logoUrl)
    ) {
      setError("Logo 請輸入 http/https 網址，或重新上傳圖片。");
      return;
    }
    const next = clone(value);
    const sugars = sugarsText
      .split("\n")
      .map((x) => x.trim())
      .filter(Boolean);
    const ices = icesText
      .split("\n")
      .map((x) => x.trim())
      .filter(Boolean);
    const toppingLines = toppingsText
      .split("\n")
      .map((x) => x.trim())
      .filter(Boolean);
    const toppings = toppingLines.map((line) => {
      const parts = line.split(/[,，]/);
      return { name: parts[0]?.trim() || "", price: Number(parts[1]) };
    });
    if (
      sugars.length > 50 ||
      ices.length > 50 ||
      toppings.length > 50 ||
      [...sugars, ...ices].some((x) => x.length > 80) ||
      toppings.some(
        (t) =>
          !t.name ||
          t.name.length > 80 ||
          !Number.isInteger(t.price) ||
          t.price < 0,
      )
    ) {
      setError("甜度、冰量或配料格式有誤；配料請以「名稱,加價」每行一筆。");
      return;
    }
    next.brand.sugars = sugars;
    next.brand.ices = ices;
    next.brand.toppings = toppings;
    const defaults = [
      {
        id: "sweetness",
        role: "sweetness" as const,
        name: "甜度",
        kind: "single" as const,
        required: true,
        labels: sugars,
      },
      {
        id: "temperature",
        role: "temperature" as const,
        name: "冰量／溫熱",
        kind: "single" as const,
        required: true,
        labels: ices,
      },
      {
        id: "topping",
        role: "topping" as const,
        name: "配料",
        kind: "multiple" as const,
        required: false,
        labels: toppings.map((t) => t.name),
      },
    ];
    const groups = next.brand.optionGroups || [];
    next.brand.optionGroups = groups
      .filter((g) => !defaults.some((d) => d.id === g.id))
      .concat(
        defaults
          .filter((d) => d.labels.length)
          .map((d) => {
            const old = groups.find((g) => g.id === d.id);
            const used = new Set<string>();
            return {
              ...old,
              id: d.id,
              role: d.role,
              name: old?.name || d.name,
              kind: old?.kind || d.kind,
              required: old?.required ?? d.required,
              choices: d.labels.map((label, i) => {
                const previous =
                  old?.choices.find((c) => c.label === label) ||
                  old?.choices.find((c) => !used.has(c.id));
                const id = previous?.id || `${d.id}-${crypto.randomUUID()}`;
                used.add(id);
                return {
                  ...previous,
                  id,
                  label,
                  price:
                    d.id === "topping"
                      ? toppings[i].price
                      : previous?.price || 0,
                };
              }),
            };
          }),
      );
    const old = document.brand.cupTypes || [];
    for (const item of next.items)
      for (const cup of item.cups) {
        const previous = old.find(
          (t) =>
            (cup as typeof cup & { cupTypeId?: string }).cupTypeId === t.id ||
            cup.size === t.size,
        );
        const current = types.find((t) => t.id === previous?.id);
        if (!current) {
          setError(`杯型「${cup.size}」仍有商品使用，請先到商品移除此杯型。`);
          return;
        }
        Object.assign(cup, {
          cupTypeId: current.id,
          size: current.size,
          capacity: current.capacity || "",
        });
      }
    next.brand.name = brand.name.trim();
    next.brand.cupTypes = types.map((t) => ({
      ...t,
      size: t.size.trim(),
      capacity: t.capacity?.trim() || "",
    }));
    next.regions = value.regions.map((r) => ({ ...r, name: r.name.trim() }));
    next.items = next.items.map((item) => ({
      ...item,
      brand: next.brand.name,
    }));
    if (await onSave(next)) {
      setError("");
      onDirtyChange(false);
    }
  }
  return (
    <div className="grid gap-5">
      <section className="admin-card grid gap-5">
        <div>
          <h2 className="text-xl font-bold">店家基本資料</h2>
          <p className="text-slate-500 text-sm">店家共用的資料與客製選項。</p>
        </div>
        <FormField label="店家名稱" required>
          <input
            className="admin-input"
            value={brand.name}
            maxLength={160}
            onChange={(e) => setBrand("name", e.target.value)}
          />
        </FormField>
        <div className="admin-grid">
          {(
            [
              ["website", "官方網站"],
              ["menuUrl", "菜單網址"],
              ["storesUrl", "門市資訊網址"],
              ["nutritionUrl", "熱量資訊網址"],
            ] as const
          ).map(([key, label]) => (
            <FormField label={label} key={key}>
              <input
                className="admin-input"
                type="url"
                value={brand[key] || ""}
                onChange={(e) => setBrand(key, e.target.value)}
              />
            </FormField>
          ))}
        </div>
        <FormField label="點餐提醒">
          <GrowingTextarea
            value={brand.reminder || ""}
            onChange={(v) => setBrand("reminder", v)}
          />
        </FormField>
        <div className="admin-grid">
          <FormField label="店家 Logo 網址">
            <input
              className="admin-input"
              value={
                brand.logoUrl?.startsWith("data:") ? "" : brand.logoUrl || ""
              }
              onChange={(e) => setBrand("logoUrl", e.target.value)}
              placeholder="https://…"
            />
          </FormField>
          <FormField
            label="或上傳圖片"
            hint="PNG、JPG、WebP；最大 5MB，自動縮至 256px。"
          >
            <input
              type="file"
              className="admin-input"
              accept="image/png,image/jpeg,image/webp"
              onChange={(e) => void importLogo(e.target.files?.[0])}
            />
          </FormField>
        </div>
        {!!brand.logoUrl && (
          <div className="admin-row">
            <img
              src={brand.logoUrl}
              alt="Logo 預覽"
              width={80}
              height={80}
              className="rounded-lg border border-slate-200 object-contain"
            />
            <button
              className="admin-btn admin-btn-danger"
              onClick={() => setBrand("logoUrl", "")}
            >
              移除 Logo
            </button>
          </div>
        )}
        <div className="grid gap-4 rounded-xl border border-slate-200 p-4">
          <h3 className="font-bold">品牌介紹</h3>
          <FormField label="介紹標題">
            <input
              className="admin-input"
              value={intro.title || ""}
              onChange={(e) =>
                setBrand("introduction", { ...intro, title: e.target.value })
              }
            />
          </FormField>
          <FormField label="介紹內容">
            <GrowingTextarea
              value={intro.content || ""}
              onChange={(v) =>
                setBrand("introduction", { ...intro, content: v })
              }
            />
          </FormField>
          <label className="admin-row">
            <input
              type="checkbox"
              checked={!!intro.expanded}
              onChange={(e) =>
                setBrand("introduction", {
                  ...intro,
                  expanded: e.target.checked,
                })
              }
            />
            前台預設展開
          </label>
        </div>
        <div className="admin-grid">
          <FormField label="店家甜度" hint="一行一個，例如：全糖、半糖、無糖">
            <GrowingTextarea
              value={sugarsText}
              onChange={(v) => {
                onDirtyChange(true);
                setSugarsText(v);
              }}
            />
          </FormField>
          <FormField
            label="冰量／溫度"
            hint="一行一個，例如：正常冰、少冰、熱飲"
          >
            <GrowingTextarea
              value={icesText}
              onChange={(v) => {
                onDirtyChange(true);
                setIcesText(v);
              }}
            />
          </FormField>
        </div>
        <FormField
          label="加料與價格"
          hint="一行一筆，格式：珍珠,10。若沒有配料可留空。"
        >
          <GrowingTextarea
            value={toppingsText}
            onChange={(v) => {
              onDirtyChange(true);
              setToppingsText(v);
            }}
          />
        </FormField>
      </section>
      <section className="admin-card grid gap-5">
        <div>
          <h2 className="text-xl font-bold">店家杯型</h2>
          <p className="text-sm text-slate-500">
            杯型與容量會同步更新所有使用它的飲料。
          </p>
        </div>
        {types.map((t) => (
          <div
            key={t.id}
            className="admin-grid items-end rounded-xl border border-slate-200 p-4"
          >
            <FormField label="杯型名稱" required>
              <input
                className="admin-input"
                value={t.size}
                onChange={(e) => updateCup(t.id, "size", e.target.value)}
              />
            </FormField>
            <FormField label="容量">
              <input
                className="admin-input"
                value={t.capacity || ""}
                onChange={(e) => updateCup(t.id, "capacity", e.target.value)}
                placeholder="例如：700ml"
              />
            </FormField>
            <button
              className="admin-btn admin-btn-danger"
              type="button"
              disabled={
                types.length <= 1 ||
                value.items.some((item) =>
                  item.cups.some(
                    (c) =>
                      (c as typeof c & { cupTypeId?: string }).cupTypeId ===
                        t.id || c.size === t.size,
                  ),
                )
              }
              onClick={() =>
                setBrand(
                  "cupTypes",
                  types.filter((x) => x.id !== t.id),
                )
              }
            >
              移除此杯型
            </button>
          </div>
        ))}
        <button
          className="admin-btn w-fit"
          type="button"
          onClick={() =>
            setBrand("cupTypes", [
              ...types,
              { id: `cup-${crypto.randomUUID()}`, size: "", capacity: "" },
            ])
          }
        >
          ＋ 新增杯型
        </button>
      </section>
      <section className="admin-card grid gap-5">
        <div>
          <h2 className="text-xl font-bold">地區菜單</h2>
          <p className="text-sm text-slate-500">
            新增地區後，每杯飲料會有一個待填價格；未提供價格會顯示「價格未提供」。
          </p>
        </div>
        {value.regions.map((r) => (
          <div
            key={r.id}
            className="admin-row rounded-xl border border-slate-200 p-4"
          >
            <input
              className="admin-input max-w-xs"
              aria-label="地區名稱"
              value={r.name}
              onChange={(e) =>
                change({
                  ...value,
                  regions: value.regions.map((x) =>
                    x.id === r.id ? { ...x, name: e.target.value } : x,
                  ),
                })
              }
            />
            <label className="admin-row">
              <input
                type="checkbox"
                checked={r.enabled}
                onChange={(e) =>
                  change({
                    ...value,
                    regions: value.regions.map((x) =>
                      x.id === r.id ? { ...x, enabled: e.target.checked } : x,
                    ),
                  })
                }
              />
              啟用
            </label>
            <button
              type="button"
              className="admin-btn admin-btn-danger"
              onClick={() => removeRegion(r.id)}
            >
              刪除地區
            </button>
          </div>
        ))}
        <button className="admin-btn w-fit" type="button" onClick={addRegion}>
          ＋ 新增地區
        </button>
      </section>
      {error && (
        <p role="alert" className="admin-error">
          {error}
        </p>
      )}
      <button
        className="admin-btn admin-btn-primary w-fit"
        type="button"
        disabled={busy}
        onClick={() => void save()}
      >
        儲存店家設定草稿
      </button>
    </div>
  );
}
