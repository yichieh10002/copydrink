import type { AdminDocument, AdminItem } from "./types";
import { clone } from "./types";
import { legacyGroups } from "@/lib/menu";

export type SortMode = "menu" | "newest" | "category" | "name";

export function sortedItems(
  items: AdminItem[],
  mode: SortMode,
  categories: AdminDocument["brand"]["categories"] = [],
) {
  const rows = items.map((item, index) => ({ item, index }));
  if (mode === "newest")
    rows.sort((a, b) => {
      if (a.item.createdAt && b.item.createdAt)
        return (
          b.item.createdAt.localeCompare(a.item.createdAt) || b.index - a.index
        );
      if (a.item.createdAt) return -1;
      if (b.item.createdAt) return 1;
      return b.index - a.index;
    });
  if (mode === "name")
    rows.sort((a, b) => a.item.name.localeCompare(b.item.name, "zh-Hant"));
  if (mode === "category")
    rows.sort((a, b) => {
      const ai =
        categories?.findIndex(
          (c) => c.id === a.item.categoryId || c.name === a.item.menuCategory,
        ) ?? -1;
      const bi =
        categories?.findIndex(
          (c) => c.id === b.item.categoryId || c.name === b.item.menuCategory,
        ) ?? -1;
      return (ai < 0 ? 999 : ai) - (bi < 0 ? 999 : bi) || a.index - b.index;
    });
  return rows.map((row) => row.item);
}

export function buildItem(
  document: AdminDocument,
  original?: AdminItem,
): AdminItem {
  if (original) return clone(original);
  return {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    name: "",
    brand: document.brand.name,
    menuCategory:
      document.brand.categories?.[0]?.name || document.brand.menus?.[0] || "",
    categoryId: document.brand.categories?.[0]?.id,
    note: "",
    reminder: "",
    source: "",
    internalNote: "",
    tags: [],
    recommended: false,
    active: false,
    activity: "",
    cups: [],
  };
}

export function validateItem(item: AdminItem, document: AdminDocument) {
  const errors: Record<string, string> = {};
  if (!item.name.trim()) errors.name = "請填寫飲料名稱";
  if (item.name.length > 160) errors.name = "飲料名稱最多 160 字";
  if (
    !item.categoryId ||
    !document.brand.categories?.some((c) => c.id === item.categoryId)
  )
    errors.category = "請選擇菜單分類";
  if (!item.cups.length) errors.cups = "請至少選擇一種杯型";
  for (const key of ["note", "reminder", "source", "internalNote"] as const)
    if ((item[key] || "").length > 2000) errors[key] = "最多 2000 字";
  if (
    (item.tags || []).length > 10 ||
    (item.tags || []).some((t) => !t.trim() || t.length > 24)
  )
    errors.tags = "最多 10 個標籤，每個最多 24 字";
  for (const cup of item.cups)
    for (const region of document.regions) {
      const p = cup.prices[region.id];
      if (
        !p ||
        (p.price !== null &&
          (!Number.isInteger(p.price) || p.price < 0 || p.price > 1_000_000))
      )
        errors[`price-${cup.size}-${region.id}`] =
          "請填 0～1000000 的整數，或留空";
    }
  const defaults = document.brand.optionGroups?.length
    ? document.brand.optionGroups
    : legacyGroups(document);
  for (const [id, override] of Object.entries(item.optionOverrides || {})) {
    if (override.mode === "custom" && !(override.choiceIds || []).length)
      errors.options = `「${defaults.find((g) => g.id === id)?.name || id}」請至少選一個選項`;
    const existing = defaults.find((g) => g.id === id)?.choices || [];
    const extra = override.additionalChoices || [];
    if (
      extra.length > 20 ||
      extra.some(
        (choice) =>
          !choice.id ||
          !choice.label.trim() ||
          choice.label.length > 60 ||
          !Number.isInteger(choice.price ?? 0) ||
          (choice.price ?? 0) < 0 ||
          (choice.price ?? 0) > 1_000_000 ||
          existing.some(
            (original) => original.label.trim() === choice.label.trim(),
          ),
      ) ||
      new Set(extra.map((choice) => choice.id)).size !== extra.length ||
      new Set(extra.map((choice) => choice.label.trim())).size !== extra.length
    )
      errors.options =
        "單杯新增選項不可重複或留空；加價請填 0～1000000 的整數，最多 20 筆。";
  }
  for (const group of item.optionGroups || []) {
    if (
      group.inheritDefault === false &&
      (!group.name.trim() ||
        group.name.length > 160 ||
        !group.choices.length ||
        group.choices.some(
          (c) =>
            !c.label.trim() ||
            !Number.isInteger(c.price ?? 0) ||
            (c.price ?? 0) < 0,
        ))
    )
      errors.options = "客製項目需要名稱和有效選項；加價請填非負整數。";
  }
  return errors;
}

export function upsertItem(document: AdminDocument, item: AdminItem) {
  const next = clone(document),
    index = next.items.findIndex((i) => i.id === item.id);
  if (index < 0) next.items.push(item);
  else next.items[index] = item;
  return next;
}
