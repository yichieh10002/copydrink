"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AdminClient, AdminRequestError } from "./client";
import { buildItem, upsertItem } from "./model";
import {
  clone,
  type Draft,
  type DraftHeader,
  type AdminDocument,
  type AdminItem,
  type Publication,
  type WarmDraft,
  type WarmDocument,
} from "./types";
import { ItemEditor } from "./components/ItemEditor";
import { ItemList } from "./components/ItemList";
import { PublishPanel } from "./components/PublishPanel";
import { CategoryEditor } from "./components/CategoryEditor";
import { StoreSettings } from "./components/StoreSettings";
import { RecommendationsEditor } from "./components/RecommendationsEditor";
import { ActivitiesEditor } from "./components/ActivitiesEditor";
import { WarmEditor } from "./components/WarmEditor";
import { Toast, type Notice } from "./components/Toast";
import { AdminLogin } from "./components/AdminLogin";
import { AdminSidebar, type AdminTab } from "./components/AdminSidebar";
import { StorePicker, NewStoreDialog } from "./components/StorePicker";
import { ConfirmDialog, type Confirmation } from "./components/ConfirmDialog";

const client = new AdminClient();
export function AdminWorkspace() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [headers, setHeaders] = useState<DraftHeader[]>([]);
  const [storeSearch, setStoreSearch] = useState("");
  const [newStoreName, setNewStoreName] = useState("");
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [history, setHistory] = useState<Publication[]>([]);
  const [warm, setWarm] = useState<WarmDraft | null | undefined>(undefined);
  const [warmHistory, setWarmHistory] = useState<Publication[]>([]);
  const [tab, setTab] = useState<AdminTab>("items");
  const [editing, setEditing] = useState<AdminItem | null>(null);
  const [dirtyForm, setDirtyForm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);
  const tell = useCallback(
    (kind: Notice["kind"], message: string) =>
      setNotice({ id: Date.now(), kind, message }),
    [],
  );
  const [confirm, setConfirm] = useState<Confirmation | null>(null);

  useEffect(() => {
    const guard = (e: BeforeUnloadEvent) => {
      if (editing || dirtyForm) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", guard);
    return () => window.removeEventListener("beforeunload", guard);
  }, [editing, dirtyForm]);
  function navigate(next: AdminTab | null) {
    if (
      (dirtyForm || editing) &&
      !window.confirm("有尚未儲存的修改，確定離開？")
    )
      return;
    setDirtyForm(false);
    setEditing(null);
    if (next) {
      setWarm(undefined);
      setTab(next);
    } else {
      setDraft(null);
      setWarm(undefined);
      setEditing(null);
    }
  }
  const execute = useCallback(
    async (action: () => Promise<void>) => {
      if (busy) return;
      setBusy(true);
      try {
        await action();
      } catch (error) {
        const message = error instanceof Error ? error.message : "操作失敗";
        if (
          error instanceof AdminRequestError &&
          error.code === "LOGIN_REQUIRED"
        ) {
          setLoggedIn(false);
          setDraft(null);
          setEditing(null);
        }
        tell("error", message);
      } finally {
        setBusy(false);
      }
    },
    [busy, tell],
  );

  async function login(e: React.FormEvent) {
    e.preventDefault();
    await execute(async () => {
      await client.login(email.trim(), password);
      setPassword("");
      setHeaders(await client.list());
      setLoggedIn(true);
      tell("success", "已登入，可讀取雲端草稿。");
    });
  }
  async function load(key: string) {
    await execute(async () => {
      const [record, versions] = await Promise.all([
        client.load(key),
        client.publications(key),
      ]);
      setDraft(record);
      setWarm(undefined);
      setHistory(versions);
      setTab("items");
      tell(
        "success",
        `已載入 ${record.document.brand.name} 草稿版本 ${record.revision}。`,
      );
    });
  }
  async function openWarm() {
    if (
      (dirtyForm || editing) &&
      !window.confirm("有尚未儲存的修改，確定離開？")
    )
      return;
    setDirtyForm(false);
    setEditing(null);
    await execute(async () => {
      const [record, versions] = await Promise.all([
        client.loadWarm(),
        client.publications("site-warm-drink-notices"),
      ]);
      setWarm(record);
      setWarmHistory(versions);
      setDraft(null);
      tell("success", "已載入溫熱飲提醒草稿。");
    });
  }
  async function saveWarm(document: WarmDocument) {
    let success = false;
    await execute(async () => {
      const record = await client.saveWarm(warm || null, document);
      setWarm(record);
      tell(
        "success",
        `提醒已儲存為草稿版本 ${record.revision}，網站尚未更新。`,
      );
      success = true;
    });
    return success;
  }
  function publishWarm() {
    if (!warm) {
      tell("error", "請先儲存提醒草稿。");
      return;
    }
    if (dirtyForm) {
      tell("error", "請先儲存尚未完成的提醒修改。");
      return;
    }
    setConfirm({
      title: "發布溫熱飲提醒",
      message: `將草稿版本 ${warm.revision} 更新到網站。`,
      action: async () => {
        await execute(async () => {
          await client.publish(warm);
          setWarmHistory(await client.publications(warm.store_key));
          tell("success", "溫熱飲提醒已發布。");
        });
      },
    });
  }
  async function createStore(e: React.FormEvent) {
    e.preventDefault();
    const name = newStoreName.trim();
    if (!name || name.length > 160) {
      tell("error", "請填寫店家名稱，最多 160 字。");
      return;
    }
    if (headers.some((h) => h.brand.name === name)) {
      tell("error", "店家名稱已存在。");
      return;
    }
    await execute(async () => {
      const record = await client.create(name);
      setHeaders(await client.list());
      setDraft(record);
      setHistory([]);
      setTab("categories");
      setCreating(false);
      setNewStoreName("");
      tell("success", `已建立 ${name} 草稿。請先新增分類，再新增飲料。`);
    });
  }
  async function save(document: AdminDocument, message: string) {
    if (!draft) return false;
    let succeeded = false;
    await execute(async () => {
      const record = await client.save(draft, document);
      setDraft(record);
      setHeaders((old) =>
        old.map((h) =>
          h.store_key === record.store_key
            ? {
                ...h,
                revision: record.revision,
                updated_at: record.updated_at,
                brand: { name: record.document.brand.name },
              }
            : h,
        ),
      );
      tell("success", `${message}草稿版本 ${record.revision}；網站尚未更新。`);
      succeeded = true;
    });
    return succeeded;
  }
  async function saveItem(item: AdminItem, addNext: boolean) {
    if (!draft) return false;
    const success = await save(
      upsertItem(draft.document, item),
      "飲料已儲存，",
    );
    if (success) {
      setEditing(addNext ? buildItem(draft.document) : null);
    }
    return success;
  }
  async function move(item: AdminItem, direction: -1 | 1) {
    if (!draft) return;
    const document = clone(draft.document),
      index = document.items.findIndex((i) => i.id === item.id),
      target = index + direction;
    if (index < 0 || target < 0 || target >= document.items.length) return;
    [document.items[index], document.items[target]] = [
      document.items[target],
      document.items[index],
    ];
    await save(document, "商品順序已儲存，");
  }
  function remove(item: AdminItem) {
    removeMany([item.id]);
  }
  function removeMany(ids: string[]) {
    if (!draft || !ids.length) return;
    const names = draft.document.items
      .filter((item) => ids.includes(item.id))
      .map((item) => item.name);
    setConfirm({
      title: `刪除 ${names.length} 杯飲料`,
      message: `即將刪除 ${names.slice(0, 5).join("、")}${names.length > 5 ? "等飲料" : ""}。正式網站會等下次發布才更新。`,
      action: async () => {
        const document = clone(draft.document);
        document.items = document.items.filter((i) => !ids.includes(i.id));
        if (document.brand.topPicks?.itemIds)
          document.brand.topPicks.itemIds =
            document.brand.topPicks.itemIds.filter((id) => !ids.includes(id));
        if (document.brand.topPicks?.notes)
          for (const id of ids) delete document.brand.topPicks.notes[id];
        await save(document, "飲料已刪除，");
      },
    });
  }
  async function batch(ids: string[], active: boolean) {
    if (!draft || !ids.length) return false;
    const document = clone(draft.document);
    document.items = document.items.map((item) =>
      ids.includes(item.id) ? { ...item, active } : item,
    );
    return save(document, `${ids.length} 杯已${active ? "上架" : "下架"}，`);
  }
  function publish() {
    if (!draft) return;
    setConfirm({
      title: `發布 ${draft.document.brand.name}`,
      message: `即將把草稿版本 ${draft.revision} 發布至網站。請先確認商品、價格與上下架狀態。`,
      action: async () => {
        await execute(async () => {
          await client.publish(draft);
          setHistory(await client.publications(draft.store_key));
          tell("success", "菜單已發布。請重新整理網站確認內容。");
        });
      },
    });
  }
  function restore(p: Publication) {
    if (!draft) return;
    setConfirm({
      title: `還原草稿版本 ${p.source_revision}`,
      message: "這會覆蓋目前草稿，並建立新草稿版本；不會立即修改正式網站。",
      action: async () => {
        await execute(async () => {
          const record = await client.restore(p.id, draft.revision);
          setDraft(record);
          tell(
            "success",
            `已還原為草稿版本 ${record.revision}，正式網站未變更。`,
          );
        });
      },
    });
  }
  const matching = useMemo(
    () =>
      headers.filter((h) =>
        h.brand.name
          .toLocaleLowerCase()
          .includes(storeSearch.toLocaleLowerCase()),
      ),
    [headers, storeSearch],
  );
  if (!loggedIn)
    return (
      <div className="min-h-screen grid place-items-center p-4">
        <AdminLogin
          email={email}
          password={password}
          busy={busy}
          onEmail={setEmail}
          onPassword={setPassword}
          onSubmit={login}
        />
        <Toast notice={notice} onClose={() => setNotice(null)} />
      </div>
    );
  return (
    <div className="admin-shell">
      <AdminSidebar
        hasStore={!!draft}
        onNavigate={navigate}
        onWarm={() => void openWarm()}
        onLogout={() => {
          if (
            (dirtyForm || editing) &&
            !window.confirm("有尚未儲存的修改，確定登出？")
          )
            return;
          void execute(async () => {
            await client.logout();
            setLoggedIn(false);
            setHeaders([]);
            setDraft(null);
            setEditing(null);
            setWarm(undefined);
            setDirtyForm(false);
            tell("success", "已登出。");
          });
        }}
      />
      <main className="admin-main">
        <div className="admin-row justify-between mb-7">
          <div>
            <p className="text-blue-700 text-sm font-bold">MENU STUDIO</p>
            <h2 className="text-3xl font-black mt-1">
              {draft
                ? draft.document.brand.name
                : warm !== undefined
                  ? "溫熱飲提醒"
                  : "店家列表"}
            </h2>
            <p className="text-slate-500 text-sm mt-2">
              {draft
                ? `草稿版本 ${draft.revision} · 最後更新 ${new Date(draft.updated_at).toLocaleString("zh-TW")}`
                : warm !== undefined
                  ? "首頁溫熱飲提醒獨立儲存與發布"
                  : "選擇店家後管理菜單"}
            </p>
          </div>
          {draft && (
            <button
              className="admin-btn"
              onClick={() => {
                const data = JSON.stringify(draft, null, 2),
                  blob = new Blob([data], { type: "application/json" }),
                  href = URL.createObjectURL(blob),
                  a = window.document.createElement("a");
                a.href = href;
                a.download = `${draft.store_key}-draft-${draft.revision}.json`;
                a.click();
                setTimeout(() => URL.revokeObjectURL(href), 1000);
                tell("success", "草稿備份已下載。");
              }}
            >
              匯出草稿備份
            </button>
          )}
        </div>
        {warm !== undefined ? (
          <WarmEditor
            key={warm?.revision || "empty"}
            record={warm}
            history={warmHistory}
            busy={busy}
            onSave={saveWarm}
            onPublish={publishWarm}
            onDirtyChange={setDirtyForm}
          />
        ) : draft ? (
          tab === "items" ? (
            <ItemList
              document={draft.document}
              busy={busy}
              onEdit={setEditing}
              onCopy={(item) =>
                setEditing({
                  ...clone(item),
                  id: crypto.randomUUID(),
                  createdAt: new Date().toISOString(),
                  name: "",
                  active: false,
                })
              }
              onCreate={() => setEditing(buildItem(draft.document))}
              onMove={(item, direction) => void move(item, direction)}
              onRemove={remove}
              onRemoveMany={removeMany}
              onBatch={batch}
            />
          ) : tab === "categories" ? (
            <CategoryEditor
              key={draft.store_key}
              document={draft.document}
              busy={busy}
              onSave={(document) => save(document, "分類已儲存，")}
              onDirtyChange={setDirtyForm}
            />
          ) : tab === "settings" ? (
            <StoreSettings
              key={draft.store_key}
              document={draft.document}
              busy={busy}
              onSave={(document) => save(document, "店家設定已儲存，")}
              onDirtyChange={setDirtyForm}
            />
          ) : tab === "recommendations" ? (
            <RecommendationsEditor
              key={draft.store_key}
              document={draft.document}
              busy={busy}
              onSave={(document) => save(document, "推薦已儲存，")}
              onDirtyChange={setDirtyForm}
            />
          ) : tab === "activities" ? (
            <ActivitiesEditor
              key={draft.store_key}
              document={draft.document}
              busy={busy}
              onSave={(document) => save(document, "活動已儲存，")}
              onDirtyChange={setDirtyForm}
            />
          ) : (
            <PublishPanel
              draft={draft}
              history={history}
              busy={busy}
              onPublish={publish}
              onRestore={restore}
            />
          )
        ) : (
          <StorePicker
            stores={matching}
            search={storeSearch}
            busy={busy}
            onSearch={setStoreSearch}
            onCreate={() => setCreating(true)}
            onReload={() =>
              void execute(async () => {
                setHeaders(await client.list());
                tell("success", "店家清單已更新。");
              })
            }
            onOpen={(key) => void load(key)}
          />
        )}
      </main>
      {draft && editing && (
        <ItemEditor
          key={editing.id}
          document={draft.document}
          initial={editing}
          busy={busy}
          onClose={() => setEditing(null)}
          onSave={saveItem}
        />
      )}
      {confirm && (
        <ConfirmDialog
          value={confirm}
          busy={busy}
          onClose={() => setConfirm(null)}
          onConfirm={() => {
            const action = confirm.action;
            setConfirm(null);
            void action();
          }}
        />
      )}
      {creating && (
        <NewStoreDialog
          name={newStoreName}
          busy={busy}
          onName={setNewStoreName}
          onSubmit={createStore}
          onClose={() => setCreating(false)}
        />
      )}
      <Toast notice={notice} onClose={() => setNotice(null)} />
    </div>
  );
}
