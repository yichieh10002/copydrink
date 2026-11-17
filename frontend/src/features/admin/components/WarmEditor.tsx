"use client";
import { useState } from "react";
import type { WarmDocument, WarmDraft, Publication } from "../types";
import { clone } from "../types";
import { FormField, GrowingTextarea } from "./FormField";

const empty: WarmDocument = {
  scope: "site-settings",
  schemaVersion: 1,
  kind: "warm-drink-notices",
  brand: { name: "溫熱飲提醒" },
  items: [],
  notices: [
    ["再睡五分鐘", "熱飲為中杯，約 480ml"],
    ["一沐日", "熱飲僅 600ml"],
    ["得正", "溫／熱飲加收 5 元"],
    ["茶湯會", "熱飲僅提供中杯 16oz"],
    ["有飲", "溫熱飲僅提供中杯 500ml"],
    ["約翰紅茶公司", "熱飲僅提供中杯，加 5 元"],
    ["大茗", "熱飲僅提供中杯 600ml"],
    ["茶太 Chatime", "溫熱飲僅提供中杯 16oz"],
    ["龜記", "溫熱飲僅提供中杯"],
  ].map(([brand, note], i) => ({
    id: `default-${i}`,
    brand,
    note,
    enabled: true,
    order: i + 1,
  })),
};

export function WarmEditor({
  record,
  history,
  busy,
  onSave,
  onPublish,
  onDirtyChange,
}: {
  record: WarmDraft | null;
  history: Publication[];
  busy: boolean;
  onSave: (document: WarmDocument) => Promise<boolean>;
  onPublish: () => void;
  onDirtyChange: (dirty: boolean) => void;
}) {
  const [value, setValue] = useState(() => clone(record?.document || empty));
  const [error, setError] = useState("");
  const update = (next: WarmDocument) => {
    setValue(next);
    onDirtyChange(true);
  };
  const list = value.notices;
  const move = (i: number, delta: number) => {
    const next = [...list],
      target = i + delta;
    if (target < 0 || target >= next.length) return;
    [next[i], next[target]] = [next[target], next[i]];
    update({ ...value, notices: next });
  };
  async function save() {
    if (
      list.length > 100 ||
      list.some(
        (n) =>
          !n.brand.trim() ||
          n.brand.length > 80 ||
          !n.note.trim() ||
          n.note.length > 300,
      )
    ) {
      setError(
        "每筆需要店名與提醒內容；店名最多 80 字，提醒最多 300 字，最多 100 筆。",
      );
      return;
    }
    const next = clone(value);
    next.notices = list.map((n, i) => ({
      ...n,
      brand: n.brand.trim(),
      note: n.note.trim(),
      order: i + 1,
    }));
    if (await onSave(next)) {
      setError("");
      onDirtyChange(false);
    }
  }
  const current = history.find((p) => p.is_current);
  return (
    <section className="admin-card grid gap-5">
      <div>
        <h2 className="text-xl font-bold">溫熱飲店家注意</h2>
        <p className="text-sm text-slate-500 mt-2">
          獨立儲存並發布；網站要重新整理才會看到新提醒。
        </p>
        <p className="text-sm text-slate-500">
          {record ? `草稿版本 ${record.revision}` : "尚無雲端草稿"} ·{" "}
          {current
            ? `目前正式版 ${current.source_revision}`
            : "目前使用網站內建提醒"}
        </p>
      </div>
      {list.map((n, i) => (
        <div
          className="rounded-xl border border-slate-200 p-4 grid gap-3"
          key={n.id}
        >
          <div className="admin-grid">
            <FormField label={`店家 ${i + 1} 名稱`} required>
              <input
                className="admin-input"
                value={n.brand}
                onChange={(e) =>
                  update({
                    ...value,
                    notices: list.map((x) =>
                      x.id === n.id ? { ...x, brand: e.target.value } : x,
                    ),
                  })
                }
              />
            </FormField>
            <label className="admin-row self-end pb-3">
              <input
                type="checkbox"
                checked={n.enabled}
                onChange={(e) =>
                  update({
                    ...value,
                    notices: list.map((x) =>
                      x.id === n.id ? { ...x, enabled: e.target.checked } : x,
                    ),
                  })
                }
              />
              啟用
            </label>
          </div>
          <FormField label="提醒內容" required>
            <GrowingTextarea
              value={n.note}
              onChange={(v) =>
                update({
                  ...value,
                  notices: list.map((x) =>
                    x.id === n.id ? { ...x, note: v } : x,
                  ),
                })
              }
            />
          </FormField>
          <div className="admin-row">
            <button
              className="admin-btn"
              disabled={i === 0}
              onClick={() => move(i, -1)}
            >
              上移
            </button>
            <button
              className="admin-btn"
              disabled={i === list.length - 1}
              onClick={() => move(i, 1)}
            >
              下移
            </button>
            <button
              className="admin-btn admin-btn-danger"
              onClick={() =>
                update({ ...value, notices: list.filter((x) => x.id !== n.id) })
              }
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
            update({
              ...value,
              notices: [
                ...list,
                {
                  id: crypto.randomUUID(),
                  brand: "",
                  note: "",
                  enabled: true,
                  order: list.length + 1,
                },
              ],
            })
          }
        >
          ＋ 新增提醒
        </button>
        <button
          className="admin-btn admin-btn-primary"
          disabled={busy}
          onClick={() => void save()}
        >
          儲存提醒草稿
        </button>
        <button
          className="admin-btn"
          disabled={busy || !record}
          onClick={onPublish}
        >
          發布提醒
        </button>
      </div>
      <p className="text-xs text-slate-500">請先儲存草稿並檢查內容，再發布。</p>
    </section>
  );
}
