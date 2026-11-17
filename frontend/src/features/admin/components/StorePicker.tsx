import type { FormEvent } from "react";
import type { DraftHeader } from "../types";

export function StorePicker({
  stores,
  search,
  busy,
  onSearch,
  onCreate,
  onReload,
  onOpen,
}: {
  stores: DraftHeader[];
  search: string;
  busy: boolean;
  onSearch: (value: string) => void;
  onCreate: () => void;
  onReload: () => void;
  onOpen: (key: string) => void;
}) {
  return (
    <section className="admin-card">
      <div className="admin-row justify-between mb-5">
        <h3 className="text-xl font-bold">選擇店家</h3>
        <button className="admin-btn admin-btn-primary" onClick={onCreate}>
          新增店家
        </button>
        <button className="admin-btn" disabled={busy} onClick={onReload}>
          重新讀取
        </button>
      </div>
      <input
        className="admin-input mb-5 max-w-lg"
        type="search"
        aria-label="搜尋店家"
        placeholder="搜尋店家…"
        value={search}
        onChange={(e) => onSearch(e.target.value)}
      />
      <div className="grid gap-3">
        {stores.map((h) => (
          <button
            key={h.store_key}
            className="text-left rounded-xl border border-slate-200 p-4 hover:bg-blue-50"
            disabled={busy}
            onClick={() => onOpen(h.store_key)}
          >
            <strong>{h.brand.name}</strong>
            <span className="block text-sm text-slate-500 mt-1">
              草稿版本 {h.revision}
            </span>
          </button>
        ))}
        {!stores.length && <p className="text-slate-500">沒有符合條件的店家</p>}
      </div>
    </section>
  );
}

export function NewStoreDialog({
  name,
  busy,
  onName,
  onSubmit,
  onClose,
}: {
  name: string;
  busy: boolean;
  onName: (value: string) => void;
  onSubmit: (event: FormEvent) => void;
  onClose: () => void;
}) {
  return (
    <div
      className="admin-overlay items-center justify-center"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <form
        onSubmit={onSubmit}
        className="admin-card m-4 w-full max-w-md grid gap-5"
        role="dialog"
        aria-modal="true"
        aria-labelledby="new-store-title"
      >
        <h2 id="new-store-title" className="text-xl font-bold">
          新增店家
        </h2>
        <p className="text-sm text-slate-500">
          先建立店家草稿，再設定分類、杯型與飲料；不會立刻出現在網站。
        </p>
        <label className="admin-field">
          <span className="admin-field-label">
            店家名稱 <span className="text-orange-600">＊</span>
          </span>
          <input
            className="admin-input"
            value={name}
            onChange={(e) => onName(e.target.value)}
            maxLength={160}
            required
            autoFocus
          />
        </label>
        <div className="admin-row">
          <button className="admin-btn admin-btn-primary" disabled={busy}>
            建立草稿
          </button>
          <button className="admin-btn" type="button" onClick={onClose}>
            取消
          </button>
        </div>
      </form>
    </div>
  );
}
