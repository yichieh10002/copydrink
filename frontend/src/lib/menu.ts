import type {
  Choice,
  Cup,
  MenuDocument,
  MenuItem,
  OptionGroup,
  Store,
} from "./types";

export function temperature(choice: Choice): "cold" | "warm" | "hot" {
  if (choice.temperature) return choice.temperature;
  return /熱/.test(choice.label)
    ? "hot"
    : /溫|常溫/.test(choice.label)
      ? "warm"
      : "cold";
}
export function isActive(document: MenuDocument, item: MenuItem) {
  return (
    item.active &&
    (!item.activity ||
      document.activities?.some((a) => a.id === item.activity && a.active))
  );
}
export function availableCups(item: MenuItem, regionId: string) {
  return (item.cups || []).filter(
    (c) =>
      c.prices?.[regionId]?.available !== false &&
      c.prices?.[regionId] !== undefined,
  );
}
export function priceFor(cup: Cup, regionId: string) {
  return cup.prices?.[regionId]?.price ?? null;
}
export function legacyGroups(document: MenuDocument): OptionGroup[] {
  const b = document.brand;
  return [
    {
      id: "sweetness",
      name: "甜度",
      kind: "single",
      role: "sweetness",
      required: true,
      choices: (b.sugars || []).map((label, i) => ({
        id: "sweetness-" + i,
        label,
        price: 0,
      })),
    },
    {
      id: "temperature",
      name: "冰量／溫熱",
      kind: "single",
      role: "temperature",
      required: true,
      choices: (b.ices || []).map((label, i) => ({
        id: "temperature-" + i,
        label,
        price: 0,
      })),
    },
    {
      id: "topping",
      name: "配料",
      kind: "multiple",
      role: "topping",
      required: false,
      choices: (b.toppings || []).map((t, i) => ({
        id: "topping-" + i,
        label: t.name,
        price: t.price,
      })),
    },
  ].filter((g) => g.choices.length) as OptionGroup[];
}
export function effectiveGroups(
  document: MenuDocument,
  item: MenuItem,
  cup: Cup,
): OptionGroup[] {
  const defaults = document.brand.optionGroups?.length
    ? document.brand.optionGroups
    : legacyGroups(document);
  const custom = item.optionGroups || [];
  const candidates = defaults
    .map((g) => {
      const own = custom.find((x) => x.id === g.id);
      if (!own) return g;
      return own.inheritDefault === false
        ? { ...g, ...own }
        : {
            ...g,
            name: own.name || g.name,
            kind: own.kind || g.kind,
            required: own.required ?? g.required,
            maxChoices: own.maxChoices,
            hotCupSizes: own.hotCupSizes,
            hotSurcharge: own.hotSurcharge,
          };
    })
    .concat(
      custom.filter(
        (g) =>
          g.inheritDefault === false && !defaults.some((x) => x.id === g.id),
      ),
    );
  return candidates.flatMap((g) => {
    const override = item.optionOverrides?.[g.id],
      mode = override?.mode || "inherit";
    if (mode === "disabled") return [];
    let choices = g.choices || [];
    if (mode === "custom" || mode === "fixed")
      choices = choices.filter((c) => override?.choiceIds?.includes(c.id));
    const allowed = cup.optionChoiceIds?.[g.id];
    if (Array.isArray(allowed))
      choices = choices.filter((c) => allowed.includes(c.id));
    const hotSizes = g.hotCupSizes?.length
      ? g.hotCupSizes
      : override?.hotCupSizes;
    if (g.role === "temperature" && hotSizes?.length)
      choices = choices.filter(
        (c) => temperature(c) !== "hot" || hotSizes.includes(cup.size),
      );
    if (g.role === "temperature" && item.variants?.length) {
      const temps = new Set(
        item.variants.filter((v) => v.size === cup.size).map((v) => v.temp),
      );
      if (temps.size)
        choices = choices.filter((c) =>
          temps.has({ cold: "冷", warm: "溫", hot: "熱" }[temperature(c)]),
        );
    }
    if (g.role === "topping" && Array.isArray(item.allowedToppings))
      choices = choices.filter((c) => item.allowedToppings?.includes(c.label));
    if (!choices.length) return [];
    const fixedLabel = g.role === "sweetness" ? item.fixedSugar : item.fixedIce;
    const matchingFixedChoice = choices.find(
      (c) =>
        fixedLabel &&
        (c.label === fixedLabel ||
          c.label.startsWith(fixedLabel + "（") ||
          c.label.startsWith(fixedLabel + " ")),
    );
    const fixed =
      mode === "fixed" || (mode === "inherit" && !!matchingFixedChoice);
    const fixedChoiceId =
      override?.fixedChoiceId || matchingFixedChoice?.id || choices[0].id;
    return [
      {
        ...g,
        choices,
        required: fixed ? false : g.required,
        mode: fixed ? "fixed" : mode,
        fixedChoiceId: fixed ? fixedChoiceId : undefined,
      },
    ];
  });
}
export function visibleCups(
  document: MenuDocument,
  item: MenuItem,
  regionId: string,
  temperatureChoiceId?: string,
) {
  const cups = availableCups(item, regionId),
    regular = cups.filter((c) => !c.showWhenChoiceIds?.length);
  const conditional = temperatureChoiceId
    ? cups.filter((c) => c.showWhenChoiceIds?.includes(temperatureChoiceId))
    : [];
  return conditional.length
    ? conditional
    : regular.filter(
        (c) =>
          !temperatureChoiceId ||
          effectiveGroups(document, item, c).some(
            (g) =>
              g.role === "temperature" &&
              g.choices.some((x) => x.id === temperatureChoiceId),
          ),
      );
}
export function allTemperatureChoices(
  document: MenuDocument,
  item: MenuItem,
  regionId: string,
) {
  const seen = new Set<string>();
  return availableCups(item, regionId)
    .flatMap((c) =>
      effectiveGroups(document, item, c)
        .filter((g) => g.role === "temperature")
        .flatMap((g) => g.choices),
    )
    .filter((c) => !seen.has(c.id) && !!seen.add(c.id));
}
export function itemTags(item: MenuItem) {
  return item.tags?.length
    ? item.tags
    : (item as MenuItem & { recommended?: boolean }).recommended
      ? ["推薦"]
      : [];
}
export function storeFromPublication(row: {
  store_key: string;
  document: unknown;
  published_at: string;
}): Store | null {
  const d = row.document as MenuDocument;
  if (
    !d ||
    d.scope !== "menu-cms" ||
    d.schemaVersion !== 2 ||
    !d.brand?.name ||
    !Array.isArray(d.items) ||
    !Array.isArray(d.regions)
  )
    return null;
  const regions = d.regions.filter((r) => r.enabled);
  const items = d.items.filter(
    (i) =>
      isActive(d, i) && regions.some((r) => availableCups(i, r.id).length > 0),
  );
  return {
    key: row.store_key,
    slug: slugFor(row.store_key, d.brand.name),
    publishedAt: row.published_at,
    document: d,
    regions,
    items,
  };
}
const knownSlugs: Record<string, string> = {
  得正: "dezheng",
  龜記: "guiji",
  一沐日: "yimu",
  約翰紅茶公司: "johntea",
  UG: "ug",
  青山: "qingshan",
  "HOHO DRINKS 河河飲品": "hoho-drinks",
  "無飲 WUWIN": "wuwin",
};
export function slugFor(key: string, name: string) {
  return knownSlugs[name] || key.replace(/^menu-/, "");
}
export function formatPrice(price: number | null) {
  return price === null ? "價格未提供" : `$${price}`;
}
