import assert from "node:assert/strict";
import { test } from "node:test";
import {
  buildItem,
  sortedItems,
  upsertItem,
  validateItem,
} from "../src/features/admin/model";
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
