"use client";
import { useState } from "react";
import type { AdminDocument } from "../types";
import { clone } from "../types";
import { FormField } from "./FormField";

export function CategoryEditor({
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
  const [categories, setCategories] = useState(() =>
    clone(document.brand.categories || []),
  );
  const [error, setError] = useState("");
  const change = (index: number, key: "name" | "label", value: string) => (
    onDirtyChange(true),
    setCategories((old) =>
      old.map((c, i) => (i === index ? { ...c, [key]: value } : c)),
    )
  );
  const move = (i: number, delta: number) => (
    onDirtyChange(true),
    setCategories((old) => {
      const next = [...old],
        target = i + delta;
      if (target < 0 || target >= next.length) return old;
      [next[i], next[target]] = [next[target], next[i]];
      return next;
    })
  );
  async function save() {
    const names = categories.map((c) => c.name.trim());
    if (
      !categories.length ||
      names.some((n) => !n || n.length > 160) ||
      new Set(names).size !== names.length
    ) {
      setError("分類名稱不可空白、重複或超過 160 字。");
      return;
    }
    if (categories.some((c) => !c.id || c.id.length > 80)) {
      setError("分類識別碼格式不正確。");
      return;
    }
    const next = clone(document);
    next.brand.categories = categories.map((c) => ({
      ...c,
      name: c.name.trim(),
      label: c.label?.trim() || c.name.trim(),
    }));
    next.brand.menus = next.brand.categories.map((c) => c.name);
    const brand = next.brand as typeof next.brand & {
      categoryLabels?: Record<string, string>;
    };
    brand.categoryLabels = Object.fromEntries(
      next.brand.categories.map((c) => [c.name, c.label || c.name]),
    );
    const oldBrand = document.brand as typeof document.brand & {
      categoryTags?: Record<string, string[]>;
    };
    const nextBrand = next.brand as typeof next.brand & {
      categoryTags?: Record<string, string[]>;
    };
    nextBrand.categoryTags = Object.fromEntries(
      next.brand.categories.map((c) => [
        c.name,
        oldBrand.categoryTags?.[
          document.brand.categories?.find((old) => old.id === c.id)?.name ||
            c.name
        ] ||
          c.tags ||
          [],
      ]),
    );
    next.items = next.items.map((item) => ({
      ...item,
      menuCategory:
        next.brand.categories?.find((c) => c.id === item.categoryId)?.name ||
        item.menuCategory,
    }));
    if (await onSave(next)) {
      setError("");
      onDirtyChange(false);
    }
  }
  return (
    <section className="admin-card grid gap-5">
      <div>
        <h2 className="text-xl font-bold">菜單分類</h2>
        <p className="text-sm text-slate-500 mt-2">
          順序會影響前台分類。修改名稱會同步更新所屬飲料。
        </p>
      </div>
      {categories.map((c, i) => (
        <div
          className="admin-grid rounded-xl border border-slate-200 p-4"
          key={c.id}
        >
          <FormField label={`分類 ${i + 1} 名稱`} required>
            <input
              className="admin-input"
              value={c.name}
              onChange={(e) => change(i, "name", e.target.value)}
            />
          </FormField>
          <FormField label="前台顯示名稱">
            <input
              className="admin-input"
              value={c.label || ""}
              onChange={(e) => change(i, "label", e.target.value)}
            />
          </FormField>
          <div className="admin-row">
            <button
              type="button"
              className="admin-btn"
              disabled={i === 0}
              onClick={() => move(i, -1)}
            >
              上移
            </button>
            <button
              type="button"
              className="admin-btn"
              disabled={i === categories.length - 1}
              onClick={() => move(i, 1)}
            >
              下移
            </button>
            <button
              type="button"
              className="admin-btn admin-btn-danger"
              disabled={document.items.some((item) => item.categoryId === c.id)}
              onClick={() => {
                onDirtyChange(true);
                setCategories((old) => old.filter((x) => x.id !== c.id));
              }}
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
          type="button"
          className="admin-btn"
          onClick={() => {
            onDirtyChange(true);
            setCategories((old) => [
              ...old,
              {
                id: `category-${crypto.randomUUID()}`,
                name: "",
                label: "",
                tags: [],
              },
            ]);
          }}
        >
          ＋ 新增分類
        </button>
        <button
          type="button"
          className="admin-btn admin-btn-primary"
          disabled={busy}
          onClick={() => void save()}
        >
          儲存分類草稿
        </button>
      </div>
    </section>
  );
}
