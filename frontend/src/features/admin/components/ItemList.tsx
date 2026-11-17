"use client";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  Copy,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import type { AdminDocument, AdminItem } from "../types";
import { sortedItems, type SortMode } from "../model";

export function ItemList({
  document,
  busy,
  onEdit,
  onCopy,
  onRemove,
  onMove,
  onCreate,
  onBatch,
  onRemoveMany,
}: {
  document: AdminDocument;
  busy: boolean;
  onEdit: (item: AdminItem) => void;
  onCopy: (item: AdminItem) => void;
  onRemove: (item: AdminItem) => void;
  onMove: (item: AdminItem, direction: -1 | 1) => void;
  onCreate: () => void;
  onBatch: (ids: string[], active: boolean) => Promise<boolean>;
  onRemoveMany: (ids: string[]) => void;
}) {
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortMode>("menu");
  const [category, setCategory] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  useEffect(() => {
    setSelected((old) =>
      old.filter((id) => document.items.some((item) => item.id === id)),
    );
  }, [document.items]);
  const toggle = (id: string) =>
    setSelected((old) =>
      old.includes(id) ? old.filter((x) => x !== id) : [...old, id],
    );
  const rows = useMemo(
    () =>
      sortedItems(document.items, sort, document.brand.categories).filter(
        (item) =>
          (!category || item.categoryId === category) &&
          (item.name + item.menuCategory)
            .toLocaleLowerCase()
            .includes(search.trim().toLocaleLowerCase()),
      ),
    [document, search, sort, category],
  );
  return (
    <section className="admin-card">
      <div className="admin-row justify-between">
        <div>
          <h2 className="text-xl font-bold">菜單商品</h2>
          <p className="text-sm text-slate-500">
            草稿共 {document.items.length} 杯・目前顯示 {rows.length} 杯
          </p>
        </div>
        <button
          className="admin-btn admin-btn-primary"
          onClick={onCreate}
          disabled={busy}
        >
          <Plus size={18} /> 新增飲料
        </button>
      </div>
      <div className="admin-grid my-5">
        <label className="admin-field">
          <span className="admin-field-label">搜尋飲料</span>
          <span className="relative">
            <Search
              className="absolute left-3 top-3 text-slate-400"
              size={20}
            />
            <input
              className="admin-input pl-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="品名或分類"
            />
          </span>
        </label>
        <label className="admin-field">
          <span className="admin-field-label">排序方式</span>
          <select
            className="admin-input"
            value={sort}
            onChange={(e) => setSort(e.target.value as SortMode)}
          >
            <option value="menu">菜單原有順序</option>
            <option value="newest">最新加入優先</option>
            <option value="category">依分類排列</option>
            <option value="name">依品名排列</option>
          </select>
        </label>
      </div>
      <label className="admin-field mb-5 max-w-sm">
        <span className="admin-field-label">篩選分類</span>
        <select
          className="admin-input"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          <option value="">全部分類</option>
          {document.brand.categories?.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label || c.name}
            </option>
          ))}
        </select>
      </label>
      <div className="admin-row mb-4">
        <strong className="text-sm text-slate-600">
          已選 {selected.length} 杯
        </strong>
        <button
          className="admin-btn"
          disabled={busy || !selected.length}
          onClick={() => {
            void onBatch(selected, true).then((ok) => {
              if (ok) setSelected([]);
            });
          }}
        >
          批次上架
        </button>
        <button
          className="admin-btn"
          disabled={busy || !selected.length}
          onClick={() => {
            void onBatch(selected, false).then((ok) => {
              if (ok) setSelected([]);
            });
          }}
        >
          批次下架
        </button>
        <button
          className="admin-btn admin-btn-danger"
          disabled={busy || !selected.length}
          onClick={() => onRemoveMany(selected)}
        >
          批次刪除
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="admin-table">
          <thead>
            <tr>
              <th>
                <input
                  type="checkbox"
                  aria-label="選取目前顯示的飲料"
                  checked={
                    !!rows.length &&
                    rows.every((item) => selected.includes(item.id))
                  }
                  onChange={(e) =>
                    setSelected((old) =>
                      e.target.checked
                        ? [...new Set([...old, ...rows.map((item) => item.id)])]
                        : old.filter(
                            (id) => !rows.some((item) => item.id === id),
                          ),
                    )
                  }
                />
              </th>
              <th>飲料</th>
              <th>分類</th>
              <th>杯型與價格</th>
              <th>狀態</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((item) => (
              <tr key={item.id}>
                <td>
                  <input
                    type="checkbox"
                    aria-label={`選取 ${item.name}`}
                    checked={selected.includes(item.id)}
                    onChange={() => toggle(item.id)}
                  />
                </td>
                <td className="font-semibold">{item.name}</td>
                <td>{item.menuCategory}</td>
                <td className="text-sm">
                  {item.cups
                    .map(
                      (c) =>
                        `${c.size} ${document.regions
                          .filter((r) => r.enabled)
                          .map((r) =>
                            c.prices[r.id]?.price == null
                              ? "—"
                              : `$${c.prices[r.id].price}`,
                          )
                          .join("/")}`,
                    )
                    .join("、")}
                </td>
                <td>{item.active ? "上架" : "下架"}</td>
                <td>
                  <div className="admin-row flex-nowrap">
                    <button
                      className="admin-btn"
                      title="編輯"
                      aria-label={`編輯 ${item.name}`}
                      onClick={() => onEdit(item)}
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      className="admin-btn"
                      title="複製成新飲料"
                      aria-label={`複製 ${item.name}`}
                      onClick={() => onCopy(item)}
                    >
                      <Copy size={16} />
                    </button>
                    <button
                      className="admin-btn"
                      title="上移"
                      aria-label={`上移 ${item.name}`}
                      disabled={
                        busy ||
                        sort !== "menu" ||
                        document.items[0].id === item.id
                      }
                      onClick={() => onMove(item, -1)}
                    >
                      <ArrowUp size={16} />
                    </button>
                    <button
                      className="admin-btn"
                      title="下移"
                      aria-label={`下移 ${item.name}`}
                      disabled={
                        busy ||
                        sort !== "menu" ||
                        document.items.at(-1)?.id === item.id
                      }
                      onClick={() => onMove(item, 1)}
                    >
                      <ArrowDown size={16} />
                    </button>
                    <button
                      className="admin-btn admin-btn-danger"
                      title="刪除"
                      aria-label={`刪除 ${item.name}`}
                      onClick={() => onRemove(item)}
                      disabled={busy}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!rows.length && (
          <p className="py-8 text-center text-slate-500">沒有符合條件的飲料</p>
        )}
      </div>
      <p className="mt-4 text-xs text-slate-500">
        排序下拉只改變這裡的檢視方式；舊資料沒有建立時間，會依原始順序推估最新。使用上移／下移並儲存草稿才會改變菜單中的商品順序。
      </p>
    </section>
  );
}
