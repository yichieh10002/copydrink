import assert from "node:assert/strict";
import { test } from "node:test";
import { copyDrinkText } from "../src/lib/copy";

test("自填筆記的空白欄位不產生多餘分隔符", () => {
  assert.equal(
    copyDrinkText({
      item: { name: "春烏龍" },
      brand: "",
      size: "",
      selections: [],
      quantity: 1,
      includeBrand: true,
      order: ["signature", "brand", "drink"],
    }),
    "春烏龍｜1 杯",
  );
});

test("署名與店家可以重新排序，價格依勾選顯示", () => {
  assert.equal(
    copyDrinkText({
      item: { name: "春烏龍" },
      brand: "得正",
      size: "大杯",
      selections: [],
      quantity: 2,
      signature: "小潔",
      includeBrand: true,
      includePrice: true,
      price: 35,
      order: ["brand", "drink", "signature"],
    }),
    "得正｜春烏龍｜大杯｜2 杯｜$35｜小潔",
  );
});
