"use client";
import { useState } from "react";
import { X } from "lucide-react";
import type { AdminDocument, AdminItem } from "../types";
import { clone } from "../types";
import { validateItem } from "../model";
import { FormField, GrowingTextarea } from "./FormField";
import { ItemOptions } from "./ItemOptions";

type Props = {
  document: AdminDocument;
  initial: AdminItem;
  busy: boolean;
  onClose: () => void;
  onSave: (item: AdminItem, addNext: boolean) => Promise<boolean>;
};

export function ItemEditor({
  document,
  initial,
  busy,
  onClose,
  onSave,
}: Props) {
  const [item, setItem] = useState(() => clone(initial));
  const [tagsText, setTagsText] = useState((initial.tags || []).join("\n"));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [dirty, setDirty] = useState(false);
  const types =
    document.brand.cupTypes ||
    [...new Set(document.items.flatMap((i) => i.cups.map((c) => c.size)))].map(
      (size) => ({ id: size, size, capacity: "" }),
    );
  const update = (next: AdminItem) => {
    setItem(next);
    setDirty(true);
  };
  const change = (key: keyof AdminItem, value: string | boolean | string[]) =>
    update({ ...item, [key]: value });
  const close = () => {
    if (dirty && !window.confirm("尚未儲存這杯飲料，確定離開？")) return;
    onClose();
  };
  const cupFor = (id: string, size: string) =>
    item.cups.find(
      (c) =>
        (c as typeof c & { cupTypeId?: string }).cupTypeId === id ||
        c.size === size,
    );
  const temperatureChoices =
    (
      item.optionGroups?.find(
        (g) => g.role === "temperature" && g.inheritDefault === false,
      ) || document.brand.optionGroups?.find((g) => g.role === "temperature")
    )?.choices ||
    (document.brand.ices || []).map((label, i) => ({
      id: `temperature-${i}`,
      label,
    }));
  const temperatureGroupId =
    document.brand.optionGroups?.find((group) => group.role === "temperature")
      ?.id || "temperature";
  const allTemperatureChoices = [
    ...temperatureChoices,
    ...(item.optionOverrides?.[temperatureGroupId]?.additionalChoices || []),
  ];
  const setCupCondition = (size: string, ids: string[]) =>
    update({
      ...item,
      cups: item.cups.map((c) => {
        if (c.size !== size) return c;
        const optionChoiceIds = { ...c.optionChoiceIds };
        if (ids.length) optionChoiceIds.temperature = ids;
        else delete optionChoiceIds.temperature;
        return { ...c, optionChoiceIds, showWhenChoiceIds: ids };
      }),
    });
  const toggleCup = (id: string, size: string, capacity = "") => {
    const cup = cupFor(id, size);
    update({
      ...item,
      cups: cup
        ? item.cups.filter((c) => c !== cup)
        : ([
            ...item.cups,
            {
              cupTypeId: id,
              size,
              capacity,
              cal: null,
              prices: Object.fromEntries(
                document.regions.map((r) => [
                  r.id,
                  { price: null, available: true },
                ]),
              ),
            },
          ] as AdminItem["cups"]),
    });
  };
  const price = (size: string, region: string, value: string) =>
    update({
      ...item,
      cups: item.cups.map((c) =>
        c.size !== size
          ? c
          : {
              ...c,
              prices: {
                ...c.prices,
                [region]: {
                  ...c.prices[region],
                  price: value === "" ? null : Number(value),
                },
              },
            },
      ),
    });
  const availability = (size: string, region: string, available: boolean) =>
    update({
      ...item,
      cups: item.cups.map((c) =>
        c.size !== size
          ? c
          : {
              ...c,
              prices: {
                ...c.prices,
                [region]: { ...c.prices[region], available },
              },
            },
      ),
    });
  async function submit(addNext: boolean) {
    const tags = tagsText
      .split("\n")
      .map((x) => x.trim())
      .filter(Boolean);
    const updated = { ...item, tags, recommended: tags.includes("推薦") };
    const found = validateItem(updated, document);
    setErrors(found);
    if (Object.keys(found).length) {
      window.document
        .getElementById("admin-editor-error")
        ?.scrollIntoView({ block: "center", behavior: "smooth" });
      return;
    }
    const saved = await onSave(updated, addNext);
    if (saved) setDirty(false);
  }
  return (
    <div
      className="admin-overlay"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <div
        className="admin-drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-editor-heading"
        onKeyDown={(e) => {
          if (e.key === "Escape") close();
        }}
      >
        <div className="admin-row justify-between mb-6">
          <div>
            <h2 id="admin-editor-heading" className="text-2xl font-bold">
              {initial.name ? `編輯 ${initial.name}` : "新增飲料"}
            </h2>
            <p className="text-sm text-slate-500">
              儲存只更新草稿，發布後才會顯示在網站。
            </p>
          </div>
          <button
            className="admin-btn"
            type="button"
            onClick={close}
            aria-label="關閉編輯"
          >
            <X size={20} />
          </button>
        </div>
        {!!Object.keys(errors).length && (
          <p
            id="admin-editor-error"
            role="alert"
            className="mb-5 rounded-lg bg-red-50 p-4 text-red-700"
          >
            請修正下方標示的 {Object.keys(errors).length} 個欄位，再儲存。
          </p>
        )}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void submit(false);
          }}
          noValidate
          className="grid gap-5"
        >
          <section className="admin-card grid gap-5">
            <h3 className="font-bold text-lg">基本資料</h3>
            <div className="admin-grid">
              <FormField label="飲料名稱" required error={errors.name}>
                <input
                  className="admin-input"
                  aria-invalid={!!errors.name}
                  value={item.name}
                  maxLength={160}
                  onChange={(e) => change("name", e.target.value)}
                  placeholder="例如：珍珠奶茶"
                />
              </FormField>
              <FormField label="菜單分類" required error={errors.category}>
                <select
                  className="admin-input"
                  aria-invalid={!!errors.category}
                  value={item.categoryId || ""}
                  onChange={(e) => {
                    const category = document.brand.categories?.find(
                      (c) => c.id === e.target.value,
                    );
                    update({
                      ...item,
                      categoryId: category?.id,
                      menuCategory: category?.name || "",
                    });
                  }}
                >
                  <option value="">請選擇分類</option>
                  {document.brand.categories?.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label || c.name}
                    </option>
                  ))}
                </select>
              </FormField>
            </div>
            <FormField
              label="商品介紹"
              hint="文字框會隨內容長高，也可拖曳右下角調整。"
              error={errors.note}
            >
              <GrowingTextarea
                value={item.note || ""}
                onChange={(value) => change("note", value)}
                aria-invalid={!!errors.note}
                placeholder="飲品特色、口感、茶底…"
              />
            </FormField>
            <FormField label="點餐提醒" error={errors.reminder}>
              <GrowingTextarea
                value={item.reminder || ""}
                onChange={(value) => change("reminder", value)}
                aria-invalid={!!errors.reminder}
                placeholder="例如：固定甜度、供應時間…"
              />
            </FormField>
            <FormField
              label="飲料標籤"
              hint="一行一個，最多 10 個；輸入「推薦」會同步標示為推薦飲品。"
              error={errors.tags}
            >
              <GrowingTextarea
                rows={4}
                value={tagsText}
                onChange={(value) => {
                  setTagsText(value);
                  setDirty(true);
                }}
                aria-invalid={!!errors.tags}
              />
            </FormField>
          </section>
          <ItemOptions
            document={document}
            item={item}
            onChange={update}
            error={errors.options}
          />
          <section className="admin-card grid gap-5">
            <div>
              <h3 className="font-bold text-lg">
                杯型與地區價格 <span className="text-orange-600">＊</span>
              </h3>
              <p className="text-sm text-slate-500">
                價格留空表示未提供，0 元請填 0。
              </p>
            </div>
            {errors.cups && (
              <p className="admin-error" role="alert">
                {errors.cups}
              </p>
            )}
            {types.map((type) => {
              const cup = cupFor(type.id, type.size);
              return (
                <div
                  key={type.id}
                  className="rounded-xl border border-slate-200 p-4"
                >
                  <label className="admin-row font-semibold">
                    <input
                      type="checkbox"
                      checked={!!cup}
                      onChange={() =>
                        toggleCup(type.id, type.size, type.capacity)
                      }
                    />
                    {type.size}
                    {type.capacity && ` · ${type.capacity}`}
                  </label>
                  {cup && (
                    <div className="grid gap-3 mt-4">
                      {document.regions.map((region) => (
                        <div key={region.id} className="admin-grid items-end">
                          <FormField
                            label={`${region.name}價格`}
                            error={errors[`price-${cup.size}-${region.id}`]}
                          >
                            <input
                              type="number"
                              inputMode="numeric"
                              min="0"
                              max="1000000"
                              step="1"
                              className="admin-input"
                              aria-invalid={
                                !!errors[`price-${cup.size}-${region.id}`]
                              }
                              value={cup.prices[region.id]?.price ?? ""}
                              onChange={(e) =>
                                price(cup.size, region.id, e.target.value)
                              }
                              placeholder="未提供"
                            />
                          </FormField>
                          <label className="admin-row pb-3">
                            <input
                              type="checkbox"
                              checked={
                                cup.prices[region.id]?.available !== false
                              }
                              onChange={(e) =>
                                availability(
                                  cup.size,
                                  region.id,
                                  e.target.checked,
                                )
                              }
                            />{" "}
                            此地區有供應
                          </label>
                        </div>
                      ))}
                      {!!allTemperatureChoices.length && (
                        <div className="rounded-lg bg-blue-50 p-3">
                          <label className="admin-row font-semibold">
                            <input
                              type="checkbox"
                              checked={!!cup.showWhenChoiceIds?.length}
                              onChange={(e) =>
                                setCupCondition(
                                  cup.size,
                                  e.target.checked
                                    ? [allTemperatureChoices[0].id]
                                    : [],
                                )
                              }
                            />
                            特殊杯型：選到指定冰量／溫度才顯示
                          </label>
                          {!!cup.showWhenChoiceIds?.length && (
                            <div className="admin-row mt-3">
                              {allTemperatureChoices.map((choice) => (
                                <label className="admin-row" key={choice.id}>
                                  <input
                                    type="checkbox"
                                    checked={
                                      cup.showWhenChoiceIds?.includes(
                                        choice.id,
                                      ) || false
                                    }
                                    onChange={(e) => {
                                      const next = e.target.checked
                                        ? [
                                            ...(cup.showWhenChoiceIds || []),
                                            choice.id,
                                          ]
                                        : (cup.showWhenChoiceIds || []).filter(
                                            (id) => id !== choice.id,
                                          );
                                      if (next.length)
                                        setCupCondition(cup.size, next);
                                    }}
                                  />
                                  {choice.label}
                                </label>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </section>
          <section className="admin-card grid gap-5">
            <h3 className="font-bold text-lg">其他設定</h3>
            <div className="admin-grid">
              <label className="admin-row">
                <input
                  type="checkbox"
                  checked={item.active}
                  onChange={(e) => change("active", e.target.checked)}
                />
                商品上架
              </label>
              <FormField label="限定活動">
                <select
                  className="admin-input"
                  value={item.activity || ""}
                  onChange={(e) => change("activity", e.target.value)}
                >
                  <option value="">常態菜單</option>
                  {document.activities?.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </FormField>
            </div>
            <details>
              <summary className="cursor-pointer font-semibold text-blue-700">
                資料來源與內部備註
              </summary>
              <div className="grid gap-4 mt-4">
                <FormField label="資料來源（僅後台）" error={errors.source}>
                  <GrowingTextarea
                    value={item.source || ""}
                    onChange={(value) => change("source", value)}
                    aria-invalid={!!errors.source}
                  />
                </FormField>
                <FormField
                  label="內部備註（僅後台）"
                  error={errors.internalNote}
                >
                  <GrowingTextarea
                    value={item.internalNote || ""}
                    onChange={(value) => change("internalNote", value)}
                    aria-invalid={!!errors.internalNote}
                  />
                </FormField>
              </div>
            </details>
          </section>
          <div className="admin-row sticky bottom-0 bg-[#f8fbff] py-4 border-t border-slate-200">
            <button
              type="submit"
              className="admin-btn admin-btn-primary"
              disabled={busy}
            >
              {busy ? "儲存中…" : "儲存草稿"}
            </button>
            <button
              type="button"
              className="admin-btn"
              disabled={busy}
              onClick={() => void submit(true)}
            >
              儲存並新增下一杯
            </button>
            <button type="button" className="admin-btn" onClick={close}>
              取消
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
