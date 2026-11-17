import type { AdminDocument, AdminItem } from "./types";
import { clone } from "./types";
import { legacyGroups, temperature } from "@/lib/menu";
import type { Choice, OptionGroup } from "@/lib/types";

export function optionEditorState(item: AdminItem, group: OptionGroup) {
  const own = item.optionGroups?.find(
    (own) => own.id === group.id && own.inheritDefault === false,
  );
  const override = item.optionOverrides?.[group.id] || {};
  const legacyToppings =
    group.role === "topping" && Array.isArray(item.allowedToppings)
      ? group.choices.filter((choice) =>
          item.allowedToppings?.includes(choice.label),
        )
      : undefined;
  const choices = own?.choices || legacyToppings || group.choices;
  const fixedLabel =
    group.role === "sweetness"
      ? item.fixedSugar
      : group.role === "temperature"
        ? item.fixedIce
        : null;
  const fixedChoice = choices.find(
    (choice) =>
      fixedLabel &&
      (choice.label === fixedLabel ||
        choice.label.startsWith(fixedLabel + "（") ||
        choice.label.startsWith(fixedLabel + " ")),
  );
  const unmatchedFixedLabel = fixedLabel && !fixedChoice ? fixedLabel : null;
  const legacy = own || legacyToppings || fixedChoice || unmatchedFixedLabel;
  return {
    own,
    legacy,
    override,
    mode:
      legacy && (!override.mode || override.mode === "inherit")
        ? fixedChoice || unmatchedFixedLabel
          ? "legacy-fixed"
          : "legacy"
        : override.mode || "inherit",
    choices,
    fixedChoice,
    unmatchedFixedLabel,
  };
}

export function changeOptionMode(
  item: AdminItem,
  group: OptionGroup,
  mode: string,
): AdminItem {
  const { own, legacy, override, choices } = optionEditorState(item, group);
  if (mode === "inherit" || mode === "legacy" || mode === "legacy-fixed") {
    const optionOverrides = { ...item.optionOverrides };
    delete optionOverrides[group.id];
    return {
      ...item,
      optionOverrides,
      ...(mode === "inherit" && group.role === "sweetness"
        ? { fixedSugar: null }
        : {}),
      ...(mode === "inherit" && group.role === "temperature"
        ? { fixedIce: null }
        : {}),
      ...(mode === "inherit" && group.role === "topping"
        ? { allowedToppings: null }
        : {}),
      optionGroups:
        mode === "inherit" && own
          ? item.optionGroups?.filter((entry) => entry !== own)
          : item.optionGroups,
    };
  }
  if (mode === "fixed-text")
    return setFixedDescription(
      item,
      group,
      (group.role === "sweetness" ? item.fixedSugar : item.fixedIce) ||
        (group.role === "sweetness" ? "甜度固定" : "冰量固定"),
    );
  const firstId = choices[0]?.id;
  return {
    ...item,
    ...(group.role === "sweetness" ? { fixedSugar: null } : {}),
    ...(group.role === "temperature" ? { fixedIce: null } : {}),
    ...(group.role === "topping" && (mode === "custom" || mode === "fixed")
      ? { allowedToppings: null }
      : {}),
    optionOverrides: {
      ...item.optionOverrides,
      [group.id]: {
        ...override,
        mode,
        choiceIds:
          mode === "custom" && legacy
            ? choices.map((choice) => choice.id)
            : mode === "fixed" && firstId
              ? [firstId]
              : override.choiceIds,
        fixedChoiceId: firstId,
      },
    },
  };
}

export function setFixedDescription(
  item: AdminItem,
  group: OptionGroup,
  label: string,
): AdminItem {
  if (group.role !== "sweetness" && group.role !== "temperature") return item;
  const own = item.optionGroups?.find((entry) => entry.id === group.id);
  const surcharge =
    item.optionOverrides?.[group.id]?.hotSurcharge ?? own?.hotSurcharge;
  return {
    ...item,
    ...(group.role === "sweetness"
      ? { fixedSugar: label }
      : { fixedIce: label, variants: undefined }),
    cups: item.cups.map((cup) => {
      const optionChoiceIds = { ...cup.optionChoiceIds };
      delete optionChoiceIds[group.id];
      return {
        ...cup,
        optionChoiceIds,
        ...(group.role === "temperature" ? { showWhenChoiceIds: [] } : {}),
      };
    }),
    optionGroups: item.optionGroups?.filter((own) => own.id !== group.id),
    optionOverrides: {
      ...item.optionOverrides,
      [group.id]: {
        mode: "fixed-text",
        ...(group.role === "temperature" && surcharge !== undefined
          ? { hotSurcharge: surcharge }
          : {}),
      },
    },
  };
}

export function setOnlyHot(item: AdminItem, group: OptionGroup): AdminItem {
  if (group.role !== "temperature") return item;
  const override = item.optionOverrides?.[group.id] || {};
  const own = item.optionGroups?.find((entry) => entry.id === group.id);
  const surcharge = override.hotSurcharge ?? own?.hotSurcharge;
  const choices = [...group.choices, ...(override.additionalChoices || [])];
  const hotChoices = choices.filter((choice) => temperature(choice) === "hot");
  const added: Choice | null = hotChoices.length
    ? null
    : {
        id: `hot-${crypto.randomUUID()}`,
        label: "熱飲",
        price: 0,
        temperature: "hot",
      };
  return {
    ...item,
    fixedIce: null,
    variants: undefined,
    optionGroups: item.optionGroups?.filter((own) => own.id !== group.id),
    cups: item.cups.map((cup) => {
      const optionChoiceIds = { ...cup.optionChoiceIds };
      delete optionChoiceIds[group.id];
      return { ...cup, optionChoiceIds, showWhenChoiceIds: [] };
    }),
    optionOverrides: {
      ...item.optionOverrides,
      [group.id]: {
        mode: "custom",
        choiceIds: (added ? [added] : hotChoices).map((choice) => choice.id),
        additionalChoices: [
          ...(override.additionalChoices || []),
          ...(added ? [added] : []),
        ],
        hotCupSizes: [],
        ...(surcharge !== undefined ? { hotSurcharge: surcharge } : {}),
      },
    },
  };
}

export type SortMode = "menu" | "newest" | "category" | "name";

export function reconcileChoices(
  previous: Choice[],
  labels: string[],
  prefix: string,
  prices?: number[],
): Choice[] {
  const remaining = new Set(previous.map((choice) => choice.id));
  return labels.map((label, index) => {
    const exact = previous.find(
      (choice) => remaining.has(choice.id) && choice.label === label,
    );
    const samePosition = previous[index];
    const renamed =
      samePosition &&
      remaining.has(samePosition.id) &&
      !labels.includes(samePosition.label)
        ? samePosition
        : undefined;
    const source = exact || renamed;
    if (source) remaining.delete(source.id);
    return {
      ...source,
      id: source?.id || `${prefix}-${crypto.randomUUID()}`,
      label,
      price: prices ? prices[index] : (source?.price ?? 0),
    };
  });
}

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
    if (
      override.mode === "fixed-text" &&
      !(
        defaults.find((group) => group.id === id)?.role === "sweetness"
          ? item.fixedSugar
          : item.fixedIce
      )?.trim()
    )
      errors.options = "請填寫固定顯示文字";
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
