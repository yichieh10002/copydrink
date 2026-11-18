import assert from "node:assert/strict";
import { test } from "node:test";
import { parseDraftBackup } from "../src/features/admin/backup";

const backup = {
  store_key: "menu-test",
  revision: 4,
  document: {
    scope: "menu-cms",
    schemaVersion: 2,
    brand: { name: "測試店" },
    regions: [{ id: "all", name: "全台", enabled: true }],
    activities: [],
    items: [],
  },
};

test("只接受同店、可還原的草稿備份", () => {
  assert.deepEqual(parseDraftBackup(JSON.stringify(backup), "menu-test"), {
    document: backup.document,
    revision: 4,
  });
  assert.throws(
    () => parseDraftBackup(JSON.stringify(backup), "menu-other"),
    /其他店家/,
  );
  assert.throws(() => parseDraftBackup("{", "menu-test"), /JSON/);
  assert.throws(
    () =>
      parseDraftBackup(
        JSON.stringify({
          ...backup,
          document: { ...backup.document, items: null },
        }),
        "menu-test",
      ),
    /必要的菜單資料/,
  );
});
