"use client";
import { useState } from "react";
import type { AdminDocument } from "../types";
import { clone } from "../types";
import { FormField } from "./FormField";

export function ActivitiesEditor({
  document,
  busy,
  onSave,
  onDirtyChange,
}: {
  document: AdminDocument;
  busy: boolean;
  onSave: (next: AdminDocument) => Promise<boolean>;
  onDirtyChange: (dirty: boolean) => void;
}) {
  const [rows, setRows] = useState(() => clone(document.activities));
  const [error, setError] = useState("");
  const update = (next: typeof rows) => {
    setRows(next);
    onDirtyChange(true);
  };
  async function save() {
    if (
      rows.length > 200 ||
      rows.some((r) => !r.name.trim() || r.name.length > 160)
    ) {
      setError("活動名稱不可空白，最多 160 字；最多 200 個活動。");
      return;
    }
    const next = clone(document);
    next.activities = rows.map((r) => ({ ...r, name: r.name.trim() }));
    if (await onSave(next)) {
      setError("");
      onDirtyChange(false);
    }
  }
  return (
    <section className="admin-card grid gap-5">
      <div>
        <h2 className="text-xl font-bold">限定活動</h2>
        <p className="text-sm text-slate-500 mt-2">
          暫停活動會讓所屬飲料暫時從前台隱藏，草稿發布後生效。
        </p>
      </div>
      {rows.map((row, i) => (
        <div
          key={row.id}
          className="admin-grid rounded-xl border border-slate-200 p-4"
        >
          <FormField label="活動名稱" required>
            <input
              className="admin-input"
              value={row.name}
              onChange={(e) =>
                update(
                  rows.map((r, index) =>
                    i === index ? { ...r, name: e.target.value } : r,
                  ),
                )
              }
            />
          </FormField>
          <div className="admin-row">
            <label className="admin-row">
              <input
                type="checkbox"
                checked={row.active}
                onChange={(e) =>
                  update(
                    rows.map((r, index) =>
                      i === index ? { ...r, active: e.target.checked } : r,
                    ),
                  )
                }
              />
              活動上架
            </label>
            <button
              className="admin-btn admin-btn-danger"
              disabled={document.items.some((item) => item.activity === row.id)}
              onClick={() => update(rows.filter((r) => r.id !== row.id))}
            >
              刪除
            </button>
          </div>
        </div>
      ))}
      {error && (
        <p className="admin-error" role="alert">
          {error}
        </p>
      )}
      <div className="admin-row">
        <button
          className="admin-btn"
          onClick={() =>
            update([
              ...rows,
              {
                id: `activity-${crypto.randomUUID()}`,
                name: "",
                active: false,
              },
            ])
          }
        >
          ＋ 新增活動
        </button>
        <button
          className="admin-btn admin-btn-primary"
          disabled={busy}
          onClick={() => void save()}
        >
          儲存活動草稿
        </button>
      </div>
    </section>
  );
}
