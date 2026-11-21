import assert from "node:assert/strict";
import test from "node:test";
import {
  allTemperatureChoices,
  effectiveGroups,
  priceFor,
  storeFromPublication,
  visibleCups,
} from "../src/lib/menu";
import { copyDrinkText } from "../src/lib/copy";
import type { MenuDocument } from "../src/lib/types";

const cold = {
  id: "cold",
  label: "少冰",
  price: 0,
  temperature: "cold" as const,
};
const hot = { id: "hot", label: "熱飲", price: 5, temperature: "hot" as const };
function document(): MenuDocument {
  return {
    schemaVersion: 2,
    scope: "menu-cms",
    brand: {
      name: "測試店",
      optionGroups: [
        {
          id: "sweetness",
          name: "甜度",
          kind: "single",
          role: "sweetness",
          required: true,
          choices: [{ id: "sugar", label: "三分糖", price: 0 }],
        },
        {
          id: "temperature",
          name: "冰量／溫熱",
          kind: "single",
          role: "temperature",
          required: true,
          choices: [cold],
        },
        {
          id: "topping",
          name: "配料",
          kind: "multiple",
          role: "topping",
          required: false,
          choices: [{ id: "pearl", label: "珍珠", price: 10 }],
        },
      ],
    },
    regions: [
      { id: "north", name: "北", enabled: true },
      { id: "south", name: "南", enabled: false },
    ],
    items: [
      {
        id: "tea",
        name: "曼非紅茶",
        menuCategory: "紅茶",
        active: true,
        cups: [
          { size: "大杯", prices: { north: { available: true, price: 40 } } },
          { size: "中杯", prices: { north: { available: true, price: 35 } } },
        ],
        optionGroups: [
          {
            id: "temperature",
            name: "冰量／溫度",
            kind: "single",
            role: "temperature",
            required: true,
            inheritDefault: false,
            choices: [cold, hot],
            hotCupSizes: ["中杯"],
            hotSurcharge: 5,
          },
        ],
      },
    ],
  };
}
test("熱飲只在中杯可選，並與加價選項相連", () => {
  const d = document(),
    item = d.items[0];
  assert.deepEqual(
    effectiveGroups(d, item, item.cups[0])
      .find((g) => g.role === "temperature")
      ?.choices.map((c) => c.id),
    ["cold"],
  );
  assert.deepEqual(
    allTemperatureChoices(d, item, "north").map((c) => c.id),
    ["cold", "hot"],
  );
  assert.deepEqual(
    visibleCups(d, item, "north", "hot").map((c) => c.size),
    ["中杯"],
  );
  assert.equal(priceFor(item.cups[1], "north"), 35);
  assert.equal(priceFor(item.cups[1], "north")! + hot.price!, 40);
});

test("單杯新增客製化依建立順序顯示在選填配料之前", () => {
  const d = document();
  const item = d.items[0];
  item.optionGroups!.push(
    {
      id: "milk-foam",
      name: "生奶蓋口味",
      kind: "single",
      role: "custom",
      required: true,
      inheritDefault: false,
      choices: [{ id: "sea-salt", label: "海鹽生奶蓋", price: 0 }],
    },
    {
      id: "tea-base",
      name: "茶底",
      kind: "single",
      role: "custom",
      required: false,
      inheritDefault: false,
      choices: [{ id: "oolong", label: "烏龍", price: 0 }],
    },
  );
  assert.deepEqual(
    effectiveGroups(d, item, item.cups[0]).map((group) => group.id),
    ["sweetness", "temperature", "milk-foam", "tea-base", "topping"],
  );
});

test("店家預設沒有熱飲時，只讓指定飲料額外提供熱飲", () => {
  const d = document();
  const target = d.items[0];
  target.optionGroups = undefined;
  target.optionOverrides = {
    temperature: {
      mode: "inherit",
      additionalChoices: [
        { id: "drink-hot", label: "熱飲", temperature: "hot", price: 5 },
      ],
    },
  };
  const other = { ...target, optionOverrides: undefined };
  assert.deepEqual(
    effectiveGroups(d, target, target.cups[0])
      .find((group) => group.role === "temperature")
      ?.choices.map((choice) => choice.id),
    ["cold", "drink-hot"],
  );
  assert.deepEqual(
    effectiveGroups(d, other, other.cups[0])
      .find((group) => group.role === "temperature")
      ?.choices.map((choice) => choice.id),
    ["cold"],
  );
  assert.deepEqual(
    d.brand.optionGroups
      ?.find((group) => group.role === "temperature")
      ?.choices.map((choice) => choice.id),
    ["cold"],
  );
});
test("單杯熱飲加價覆蓋熱飲選項金額，不重複加價", () => {
  const d = document(),
    item = d.items[0];
  item.optionGroups![0].hotSurcharge = 7;
  const group = effectiveGroups(d, item, item.cups[1]).find(
    (g) => g.role === "temperature",
  );
  assert.equal(group?.choices.find((c) => c.id === "hot")?.price, 7);
  assert.equal(group?.choices.find((c) => c.id === "cold")?.price, 0);
});
test("僅選熱飲才顯示的中杯不會平時出現在杯型", () => {
  const d = document(),
    item = d.items[0];
  item.cups[1].showWhenChoiceIds = ["hot"];
  item.cups[1].optionChoiceIds = { temperature: ["hot"] };
  assert.deepEqual(
    visibleCups(d, item, "north").map((c) => c.size),
    ["大杯"],
  );
  assert.deepEqual(
    visibleCups(d, item, "north", "hot").map((c) => c.size),
    ["中杯"],
  );
});
test("只保留正式上架、啟用地區、可供應的飲料；零元價格保留", () => {
  const d = document();
  d.items[0].cups[0].prices.north.price = 0;
  d.items.push({ ...d.items[0], id: "draft", active: false });
  const store = storeFromPublication({
    store_key: "menu-test",
    document: d,
    published_at: "2026-01-01",
  });
  assert.equal(store?.items.length, 1);
  assert.deepEqual(
    store?.regions.map((x) => x.name),
    ["北"],
  );
  assert.equal(priceFor(store!.items[0].cups[0], "north"), 0);
});
test("複製文字包含選擇與數量，不會帶入未選的欄位", () => {
  assert.equal(
    copyDrinkText({
      item: { name: "曼非紅茶" },
      brand: "約翰紅茶公司",
      size: "中杯",
      selections: [
        {
          role: "sweetness",
          name: "甜度",
          choices: [{ id: "sugar", label: "三分糖" }],
        },
        { role: "temperature", name: "冰量／溫熱", choices: [hot] },
        { role: "topping", name: "配料", choices: [] },
      ],
      quantity: 1,
      includeBrand: false,
    }),
    "曼非紅茶｜中杯｜三分糖｜熱飲｜1 杯",
  );
});
test("固定甜度、單杯熱飲與僅中杯一起輸出正確小抄", () => {
  const d = document();
  const item = d.items[0];
  item.name = "驗收測試飲料";
  item.cups = [
    { size: "中杯", prices: { north: { available: true, price: 45 } } },
  ];
  item.optionGroups = undefined;
  item.fixedSugar = "甜度固定";
  item.optionOverrides = {
    sweetness: { mode: "fixed-text" },
    temperature: {
      mode: "custom",
      choiceIds: ["drink-hot"],
      additionalChoices: [
        { id: "drink-hot", label: "熱飲", price: 0, temperature: "hot" },
      ],
    },
  };
  const store = storeFromPublication({
    store_key: "menu-rule-check",
    document: d,
    published_at: "2026-11-18",
  });
  assert.deepEqual(
    store?.items.map((drink) => drink.name),
    ["驗收測試飲料"],
  );
  assert.deepEqual(
    visibleCups(d, item, "north").map((cup) => cup.size),
    ["中杯"],
  );
  const groups = effectiveGroups(d, item, item.cups[0]);
  assert.deepEqual(
    groups
      .filter(
        (group) => group.role === "sweetness" || group.role === "temperature",
      )
      .map((group) => [
        group.role,
        group.choices.map((choice) => choice.label),
      ]),
    [
      ["sweetness", ["甜度固定"]],
      ["temperature", ["熱飲"]],
    ],
  );
  assert.equal(
    copyDrinkText({
      item,
      brand: d.brand.name,
      size: "中杯",
      selections: groups.map((group) => ({
        role: group.role,
        name: group.name,
        choices:
          group.role === "sweetness" || group.role === "temperature"
            ? group.choices
            : [],
      })),
      quantity: 1,
    }),
    "驗收測試飲料｜中杯｜甜度固定｜熱飲｜1 杯",
  );
});
test("舊資料的特殊固定甜度直接顯示原說明，不誤鎖第一個預設選項", () => {
  const d = document(),
    item = d.items[0];
  item.fixedSugar = "甜度固定";
  const group = effectiveGroups(d, item, item.cups[0]).find(
    (g) => g.role === "sweetness",
  );
  assert.equal(group?.mode, "fixed");
  assert.equal(group?.required, false);
  assert.deepEqual(
    group?.choices.map((choice) => choice.label),
    ["甜度固定"],
  );
  assert.equal(group?.fixedChoiceId, "sweetness-legacy-fixed");
});
