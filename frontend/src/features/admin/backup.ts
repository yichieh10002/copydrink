import type { AdminDocument } from "./types";

export function parseDraftBackup(text: string, expectedStoreKey: string) {
  if (new Blob([text]).size > 2_000_000)
    throw new Error("備份檔案超過 2 MB，請確認檔案來源。");
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch {
    throw new Error("備份不是有效的 JSON 檔案。");
  }
  if (!value || typeof value !== "object") throw new Error("備份格式不正確。");
  const record = value as Record<string, unknown>;
  const document = record.document as Partial<AdminDocument> | undefined;
  if (record.store_key !== expectedStoreKey)
    throw new Error("這份備份屬於其他店家，無法匯入目前店家。");
  if (
    !Number.isInteger(record.revision) ||
    Number(record.revision) < 1 ||
    !document ||
    document.scope !== "menu-cms" ||
    document.schemaVersion !== 2 ||
    !document.brand ||
    typeof document.brand.name !== "string" ||
    !document.brand.name.trim() ||
    !Array.isArray(document.items) ||
    !Array.isArray(document.regions) ||
    !Array.isArray(document.activities)
  )
    throw new Error("備份缺少必要的菜單資料，無法匯入。");
  return {
    document: document as AdminDocument,
    revision: record.revision as number,
  };
}
