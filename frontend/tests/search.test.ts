import assert from "node:assert/strict";
import { test } from "node:test";
import { matchesSearch } from "../src/lib/search";

test("搜尋忽略空白與注音聲調，並比對資料中的別名", () => {
  assert.equal(matchesSearch(["得 正", "ㄉㄜˊ ㄓㄥˋ"], "ㄉㄜㄓㄥ"), true);
  assert.equal(matchesSearch(["得正"], "ㄉ"), false);
});
