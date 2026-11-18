"use client";
import { useState } from "react";
import type { Draft, Publication } from "../types";

export function PublishPanel({
  draft,
  history,
  busy,
  onPublish,
  onRestore,
}: {
  draft: Draft;
  history: Publication[];
  busy: boolean;
  onPublish: () => void;
  onRestore: (publication: Publication) => void;
}) {
  const [preview, setPreview] = useState(false);
  const current = history.find((p) => p.is_current);
  return (
    <div className="grid gap-5">
      <section className="admin-card">
        <h2 className="text-xl font-bold">發布此店</h2>
        <p className="my-3 text-slate-600">
          目前草稿版本 {draft.revision}。
          {current
            ? `目前網站使用草稿版本 ${current.source_revision}，發布於 ${new Date(current.published_at).toLocaleString("zh-TW")}`
            : "這家店尚未發布。"}
        </p>
        <div className="admin-row">
          <button className="admin-btn" onClick={() => setPreview((v) => !v)}>
            {preview ? "收起草稿預覽" : "預覽草稿"}
          </button>
          <button
            className="admin-btn admin-btn-primary"
            disabled={busy || !preview}
            onClick={onPublish}
          >
            發布此店
          </button>
        </div>
        {preview && (
          <div className="mt-5 rounded-xl border border-blue-200 bg-blue-50 p-4">
            <h3 className="font-bold mb-3">
              {draft.document.brand.name} · 草稿預覽
            </h3>
            <p className="text-sm text-slate-600 mb-3">
              依目前草稿列出上架飲料與各地區價格；發布前請再確認完整菜單。
            </p>
            {draft.document.items
              .filter(
                (item) =>
                  item.active &&
                  (!item.activity ||
                    draft.document.activities?.some(
                      (a) => a.id === item.activity && a.active,
                    )),
              )
              .map((item) => (
                <article key={item.id} className="bg-white rounded-lg p-3 mb-2">
                  <strong>{item.name}</strong>
                  <small className="ml-3 text-slate-500">
                    {item.menuCategory}
                  </small>
                  {item.cups.map((cup) => (
                    <p key={cup.size} className="text-sm mt-1">
                      {cup.size}：
                      {draft.document.regions
                        .filter((r) => r.enabled)
                        .map(
                          (r) =>
                            `${r.name} ${cup.prices[r.id]?.available === false ? "不供應" : cup.prices[r.id]?.price == null ? "價格未提供" : `$${cup.prices[r.id].price}`}`,
                        )
                        .join(" · ")}
                    </p>
                  ))}
                </article>
              ))}
            {!draft.document.items.some((item) => item.active) && (
              <p className="text-slate-500">目前沒有上架飲料。</p>
            )}
          </div>
        )}
        <p className="mt-3 text-sm text-slate-500">
          發布會更新網站上的菜單；下方保留目前正式版及最近 5 次發布。
        </p>
      </section>
      <section className="admin-card">
        <h2 className="text-xl font-bold mb-3">發布紀錄</h2>
        <p className="text-sm text-slate-500 mb-3">
          較舊版本已私有封存；需要找回時可請管理者協助。
        </p>
        {!history.length && <p>尚無發布紀錄。</p>}
        {history.map((p) => (
          <div
            key={p.id}
            className="admin-row justify-between border-t border-slate-200 py-4"
          >
            <span>
              草稿版本 {p.source_revision} ·{" "}
              {new Date(p.published_at).toLocaleString("zh-TW")}{" "}
              {p.is_current && (
                <strong className="text-blue-700">（目前正式版）</strong>
              )}
            </span>
            {!p.is_current && (
              <button
                className="admin-btn"
                disabled={busy}
                onClick={() => onRestore(p)}
              >
                還原成草稿
              </button>
            )}
          </div>
        ))}
      </section>
    </div>
  );
}
