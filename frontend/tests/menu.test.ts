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
test("舊資料的固定甜度若未對到實際選項，不會誤鎖第一個選項", () => {
  const d = document(),
    item = d.items[0];
  item.fixedSugar = "甜度固定";
  const group = effectiveGroups(d, item, item.cups[0]).find(
    (g) => g.role === "sweetness",
  );
  assert.equal(group?.mode, "inherit");
  assert.equal(group?.required, true);
});
