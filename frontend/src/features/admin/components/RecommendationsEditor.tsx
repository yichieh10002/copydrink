"use client";
import { useState } from "react";
import type { AdminDocument } from "../types";
import { clone } from "../types";
import { FormField, GrowingTextarea } from "./FormField";

export function RecommendationsEditor({
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
  const [top, setTop] = useState(() =>
    clone(
      document.brand.topPicks || {
        enabled: false,
        title: "必喝 TOP",
        description: "",
        itemIds: [],
        notes: {},
      },
    ),
  );
  const [error, setError] = useState("");
  const ids = top.itemIds || [];
  const notes = top.notes || {};
  const update = (next: typeof top) => {
    setTop(next);
    onDirtyChange(true);
  };
  const move = (index: number, delta: number) => {
    const next = [...ids],
      target = index + delta;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    update({ ...top, itemIds: next });
  };
  async function save() {
    if (!top.title?.trim() || top.title.length > 40) {
      setError("請輸入必喝 TOP 標題，最多 40 字。");
      return;
    }
    if (
      (top.description || "").length > 300 ||
      ids.length > 30 ||
      Object.values(notes).some((note) => note.length > 160)
    ) {
      setError("介紹最多 300 字、推薦最多 30 杯、每杯備註最多 160 字。");
      return;
    }
    const next = clone(document);
    next.brand.topPicks = {
      enabled: !!top.enabled,
      title: top.title.trim(),
      description: top.description?.trim() || "",
      itemIds: ids,
      notes: Object.fromEntries(
        ids
          .map((id) => [id, notes[id]?.trim() || ""])
          .filter(([, note]) => note),
      ),
    };
    if (await onSave(next)) {
      setError("");
      onDirtyChange(false);
    }
  }
  return (
    <section className="admin-card grid gap-5">
      <div>
        <h2 className="text-xl font-bold">必喝 TOP</h2>
        <p className="text-slate-500 text-sm">
          選擇推薦飲料，調整前台顯示順序及每杯備註。
        </p>
      </div>
      <label className="admin-row">
        <input
          type="checkbox"
          checked={!!top.enabled}
          onChange={(e) => update({ ...top, enabled: e.target.checked })}
        />
        在前台顯示必喝 TOP
      </label>
      <FormField label="入口名稱" required>
        <input
          className="admin-input"
          value={top.title || ""}
          maxLength={40}
          onChange={(e) => update({ ...top, title: e.target.value })}
        />
      </FormField>
      <FormField label="簡短介紹">
        <GrowingTextarea
          value={top.description || ""}
          onChange={(v) => update({ ...top, description: v })}
        />
      </FormField>
      <label className="admin-field max-w-xl">
        <span className="admin-field-label">新增推薦飲料</span>
        <select
          className="admin-input"
          value=""
          onChange={(e) => {
            if (e.target.value)
              update({ ...top, itemIds: [...ids, e.target.value] });
          }}
        >
          <option value="">請選擇飲料</option>
          {document.items
            .filter((i) => !ids.includes(i.id))
            .map((item) => (
              <option key={item.id} value={item.id}>
                {item.name} · {item.menuCategory}
              </option>
            ))}
        </select>
      </label>
      {ids.map((id, index) => {
        const item = document.items.find((i) => i.id === id);
        if (!item) return null;
        return (
          <div key={id} className="rounded-xl border border-slate-200 p-4">
            <div className="admin-row justify-between">
              <strong>
                {index + 1}. {item.name}
              </strong>
              <div className="admin-row">
                <button
                  className="admin-btn"
                  disabled={index === 0}
                  onClick={() => move(index, -1)}
                >
                  上移
                </button>
                <button
                  className="admin-btn"
                  disabled={index === ids.length - 1}
                  onClick={() => move(index, 1)}
                >
                  下移
                </button>
                <button
                  className="admin-btn admin-btn-danger"
                  onClick={() =>
                    update({ ...top, itemIds: ids.filter((x) => x !== id) })
                  }
                >
                  移除
                </button>
              </div>
            </div>
            <FormField label="推薦喝法／備註">
              <input
                className="admin-input mt-3"
                maxLength={160}
                value={notes[id] || ""}
                onChange={(e) =>
                  update({ ...top, notes: { ...notes, [id]: e.target.value } })
                }
              />
            </FormField>
          </div>
        );
      })}
      {error && (
        <p className="admin-error" role="alert">
          {error}
        </p>
      )}
      <button
        className="admin-btn admin-btn-primary w-fit"
        disabled={busy}
        onClick={() => void save()}
      >
        儲存推薦草稿
      </button>
    </section>
  );
}
