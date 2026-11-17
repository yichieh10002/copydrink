import assert from "node:assert/strict";
import { test } from "node:test";
import {
  buildItem,
  sortedItems,
  upsertItem,
  validateItem,
  reconcileChoices,
  optionEditorState,
  changeOptionMode,
} from "../src/features/admin/model";
import { effectiveGroups } from "../src/lib/menu";
import { copyDrinkText } from "../src/lib/copy";
import { buildQuickStores } from "../src/lib/quick-stores";
import type { AdminDocument, AdminItem } from "../src/features/admin/types";

const document: AdminDocument = {
  schemaVersion: 2,
  scope: "menu-cms",
  activities: [],
  brand: {
    name: "測試店",
    menus: ["奶茶", "果茶"],
    categories: [
      { id: "milk", name: "奶茶" },
      { id: "fruit", name: "果茶" },
    ],
    cupTypes: [{ id: "medium", size: "中杯", capacity: "500ml" }],
  },
  regions: [{ id: "north", name: "北部", enabled: true }],
  items: [
    {
      id: "first",
      name: "珍珠奶茶",
      menuCategory: "奶茶",
      categoryId: "milk",
      cups: [
        { size: "中杯", prices: { north: { price: 55, available: true } } },
      ],
      active: true,
    },
    {
      id: "second",
      name: "水果茶",
      menuCategory: "果茶",
      categoryId: "fruit",
      cups: [
        { size: "中杯", prices: { north: { price: 65, available: true } } },
      ],
      active: true,
    },
    {
      id: "third",
      name: "紅茶拿鐵",
      menuCategory: "奶茶",
      categoryId: "milk",
      cups: [
        { size: "中杯", prices: { north: { price: 60, available: true } } },
      ],
      active: false,
    },
  ],
};

test("最新、分類和原順序只調整列表視圖，不改寫草稿", () => {
  const original = document.items.map((i) => i.id);
  assert.deepEqual(
    sortedItems(document.items, "newest").map((i) => i.id),
    ["third", "second", "first"],
  );
  assert.deepEqual(
    sortedItems(document.items, "category", document.brand.categories).map(
      (i) => i.id,
    ),
    ["first", "third", "second"],
  );
  assert.deepEqual(
    document.items.map((i) => i.id),
    original,
  );
});

test("店家選項插入與重排不會把舊識別碼配到別的選項", () => {
  const old = [
    { id: "normal", label: "正常冰", price: 0 },
    { id: "less", label: "少冰", price: 0 },
  ];
  const inserted = reconcileChoices(
    old,
    ["正常冰", "微冰", "少冰"],
    "temperature",
  );
  assert.equal(inserted[0].id, "normal");
  assert.equal(inserted[2].id, "less");
  assert.notEqual(inserted[1].id, "less");
  const reordered = reconcileChoices(old, ["少冰", "正常冰"], "temperature");
  assert.deepEqual(
    reordered.map((choice) => choice.id),
    ["less", "normal"],
  );
  const renamed = reconcileChoices(old, ["正常冰", "少少冰"], "temperature");
  assert.equal(renamed[1].id, "less");
});

test("舊版單杯限制在後台顯示原選項，明確改為店家預設才移除", () => {
  const temperature = {
    id: "temperature",
    name: "冰量／溫熱",
    role: "temperature" as const,
    kind: "single" as const,
    required: true,
    choices: [
      { id: "normal", label: "正常冰", price: 0 },
      { id: "less", label: "少冰", price: 0 },
    ],
  };
  const legacy: AdminItem = {
    ...document.items[0],
    optionGroups: [
      {
        ...temperature,
        inheritDefault: false,
        choices: [temperature.choices[1]],
      },
    ],
  };
  const withOptions: AdminDocument = {
    ...document,
    brand: { ...document.brand, optionGroups: [temperature] },
  };
  assert.equal(optionEditorState(legacy, temperature).mode, "legacy");
  assert.deepEqual(
    optionEditorState(legacy, temperature).choices.map((c) => c.label),
    ["少冰"],
  );
  const restricted = changeOptionMode(legacy, temperature, "custom");
  assert.deepEqual(restricted.optionOverrides?.temperature.choiceIds, ["less"]);
  assert.deepEqual(
    effectiveGroups(withOptions, restricted, restricted.cups[0])
      .find((g) => g.id === "temperature")
      ?.choices.map((c) => c.label),
    ["少冰"],
  );
  const inherited = changeOptionMode(legacy, temperature, "inherit");
  assert.deepEqual(
    effectiveGroups(withOptions, inherited, inherited.cups[0])
      .find((g) => g.id === "temperature")
      ?.choices.map((c) => c.label),
    ["正常冰", "少冰"],
  );
  const fixed = changeOptionMode(legacy, temperature, "fixed");
  assert.equal(fixed.optionOverrides?.temperature.fixedChoiceId, "less");
  assert.equal(
    effectiveGroups(withOptions, fixed, fixed.cups[0]).find(
      (g) => g.id === "temperature",
    )?.mode,
    "fixed",
  );
  assert.equal(
    optionEditorState(
      changeOptionMode(fixed, temperature, "legacy"),
      temperature,
    ).mode,
    "legacy",
  );
  assert.equal(optionEditorState(legacy, temperature).mode, "legacy");
  const special = {
    ...legacy,
    optionGroups: [
      {
        ...temperature,
        inheritDefault: false,
        choices: [{ id: "special", label: "固定微冰", price: 0 }],
      },
    ],
  };
  const specialCustom = changeOptionMode(special, temperature, "custom");
  assert.deepEqual(
    effectiveGroups(withOptions, specialCustom, specialCustom.cups[0])
      .find((g) => g.id === "temperature")
      ?.choices.map((c) => c.label),
    ["固定微冰"],
  );
  const oldFixed = { ...legacy, fixedIce: "少冰" };
  assert.equal(optionEditorState(oldFixed, temperature).mode, "legacy-fixed");
  assert.equal(
    optionEditorState({ ...oldFixed, optionGroups: [] }, temperature).mode,
    "legacy-fixed",
  );
  assert.equal(
    optionEditorState({ ...oldFixed, fixedIce: "冰量固定" }, temperature)
      .unmatchedFixedLabel,
    "冰量固定",
  );
  const specialFixed = { ...oldFixed, optionGroups: [], fixedIce: "冰量固定" };
  assert.equal(
    optionEditorState(specialFixed, temperature).mode,
    "legacy-fixed",
  );
  const specialGroups = effectiveGroups(
    withOptions,
    specialFixed,
    specialFixed.cups[0],
  );
  const specialTemperature = specialGroups.find(
    (g) => g.role === "temperature",
  );
  assert.equal(specialTemperature?.mode, "fixed");
  assert.deepEqual(
    specialTemperature?.choices.map((c) => c.label),
    ["冰量固定"],
  );
  assert.equal(
    copyDrinkText({
      item: specialFixed,
      brand: "測試店",
      size: "中杯",
      selections: [
        {
          role: "temperature",
          name: "冰量／溫熱",
          choices: specialTemperature!.choices,
        },
      ],
      quantity: 1,
    }),
    "珍珠奶茶｜中杯｜冰量固定｜1 杯",
  );
  const withSweetness: AdminDocument = {
    ...withOptions,
    brand: {
      ...withOptions.brand,
      optionGroups: [
        {
          id: "sweetness",
          name: "甜度",
          role: "sweetness",
          kind: "single",
          required: true,
          choices: [{ id: "half", label: "半糖", price: 0 }],
        },
        temperature,
      ],
    },
  };
  const specialSugar = { ...specialFixed, fixedSugar: "甜度固定" };
  const quick = buildQuickStores([
    {
      key: "test",
      slug: "test",
      publishedAt: "2026-11-17T00:00:00Z",
      document: withSweetness,
      items: [specialSugar],
      regions: withSweetness.regions,
    },
  ]);
  assert.equal(quick[0].items[0].fixedSugar, "甜度固定");
  assert.equal(quick[0].items[0].fixedIce, "冰量固定");
  assert.deepEqual(quick[0].items[0].sugars, ["甜度固定"]);
  assert.equal(
    optionEditorState(oldFixed, temperature).fixedChoice?.label,
    "少冰",
  );
  const noLongerFixed = changeOptionMode(oldFixed, temperature, "inherit");
  assert.equal(noLongerFixed.fixedIce, null);
  assert.deepEqual(
    effectiveGroups(withOptions, noLongerFixed, noLongerFixed.cups[0])
      .find((g) => g.id === "temperature")
      ?.choices.map((c) => c.label),
    ["正常冰", "少冰"],
  );
  const coldOnly = {
    ...oldFixed,
    variants: [{ size: "中杯", temp: "冷" }],
  };
  const withHot: AdminDocument = {
    ...withOptions,
    brand: {
      ...withOptions.brand,
      optionGroups: [
        {
          ...temperature,
          choices: [
            ...temperature.choices,
            { id: "hot", label: "熱", price: 0 },
          ],
        },
      ],
    },
  };
  const inheritedColdOnly = changeOptionMode(
    coldOnly,
    withHot.brand.optionGroups![0],
    "inherit",
  );
  assert.deepEqual(inheritedColdOnly.variants, coldOnly.variants);
  assert.deepEqual(
    effectiveGroups(withHot, inheritedColdOnly, inheritedColdOnly.cups[0])
      .find((g) => g.id === "temperature")
      ?.choices.map((c) => c.label),
    ["正常冰", "少冰"],
  );
  const topping = {
    id: "topping",
    name: "配料",
    role: "topping" as const,
    kind: "multiple" as const,
    required: false,
    choices: [
      { id: "pearl", label: "珍珠", price: 10 },
      { id: "jelly", label: "茶凍", price: 10 },
    ],
  };
  const limited = { ...legacy, optionGroups: [], allowedToppings: ["珍珠"] };
  assert.equal(optionEditorState(limited, topping).mode, "legacy");
  assert.deepEqual(
    optionEditorState(limited, topping).choices.map((c) => c.label),
    ["珍珠"],
  );
  assert.equal(
    changeOptionMode(limited, topping, "inherit").allowedToppings,
    null,
  );
});

test("複製／新建飲料需要分類與杯型，0 元價格有效", () => {
  const item = buildItem(document);
  assert.equal(validateItem(item, document).name, "請填寫飲料名稱");
  assert.equal(validateItem(item, document).cups, "請至少選擇一種杯型");
  item.name = "新飲料";
  item.cups = [
    { size: "中杯", prices: { north: { price: 0, available: true } } },
  ];
  assert.deepEqual(validateItem(item, document), {});
  assert.equal(upsertItem(document, item).items.length, 4);
  assert.equal(document.items.length, 3);
});

test("拒絕無效價格與超長內部欄位", () => {
  const item: AdminItem = {
    ...document.items[0],
    cups: [{ size: "中杯", prices: { north: { price: -1, available: true } } }],
    internalNote: "a".repeat(2001),
  };
  const errors = validateItem(item, document);
  assert.ok(errors["price-中杯-north"]);
  assert.ok(errors.internalNote);
});

test("單杯客製未選選項與無效加價會被攔下", () => {
  const item: AdminItem = {
    ...document.items[0],
    optionOverrides: { sweetness: { mode: "custom", choiceIds: [] } },
    optionGroups: [
      {
        id: "custom",
        name: "奶蓋",
        kind: "single" as const,
        role: "custom" as const,
        required: false,
        inheritDefault: false,
        choices: [{ id: "milk", label: "加奶蓋", price: -2 }],
      },
    ],
  };
  assert.ok(validateItem(item, document).options);
  item.optionOverrides!.sweetness.choiceIds!.push("sweetness-0");
  item.optionGroups![0].choices[0].price = 10;
  assert.deepEqual(validateItem(item, document), {});
});

test("單杯新增選項不可重複或填負數，合法熱飲可存入草稿", () => {
  const doc = structuredClone(document);
  doc.brand.optionGroups = [
    {
      id: "temperature",
      name: "冰量",
      kind: "single",
      role: "temperature",
      required: true,
      choices: [{ id: "cold", label: "少冰" }],
    },
  ];
  const item = structuredClone(doc.items[0]);
  item.optionOverrides = {
    temperature: {
      additionalChoices: [
        { id: "hot", label: "熱飲", temperature: "hot", price: 5 },
      ],
    },
  };
  assert.deepEqual(validateItem(item, doc), {});
  item.optionOverrides.temperature.additionalChoices![0].price = -1;
  assert.ok(validateItem(item, doc).options);
  item.optionOverrides.temperature.additionalChoices![0].price = 5;
  item.optionOverrides.temperature.additionalChoices![0].label = "少冰";
  assert.ok(validateItem(item, doc).options);
});
