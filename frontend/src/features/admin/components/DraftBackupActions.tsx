"use client";
import { useRef } from "react";
import type { Draft } from "../types";
import { parseDraftBackup } from "../backup";

export function downloadDraftBackup(draft: Draft) {
  const blob = new Blob([JSON.stringify(draft, null, 2)], {
      type: "application/json",
    }),
    href = URL.createObjectURL(blob),
    link = window.document.createElement("a");
  link.href = href;
  link.download = `${draft.store_key}-draft-${draft.revision}.json`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(href), 1000);
}

export function DraftBackupActions({
  draft,
  busy,
  onImport,
  onError,
  onSuccess,
}: {
  draft: Draft;
  busy: boolean;
  onImport: (document: Draft["document"], sourceRevision: number) => void;
  onError: (message: string) => void;
  onSuccess: (message: string) => void;
}) {
  const fileInput = useRef<HTMLInputElement>(null);
  function download() {
    downloadDraftBackup(draft);
    onSuccess("草稿備份已下載。");
  }
  async function pick(file?: File) {
    if (!file) return;
    try {
      if (file.size > 2_000_000)
        throw new Error("備份檔案超過 2 MB，請確認檔案來源。");
      const backup = parseDraftBackup(await file.text(), draft.store_key);
      onImport(backup.document, backup.revision);
    } catch (error) {
      onError(error instanceof Error ? error.message : "無法讀取備份檔案。");
    } finally {
      if (fileInput.current) fileInput.current.value = "";
    }
  }
  return (
    <div className="admin-row">
      <button className="admin-btn" disabled={busy} onClick={download}>
        匯出草稿備份
      </button>
      <button
        className="admin-btn"
        disabled={busy}
        onClick={() => fileInput.current?.click()}
      >
        匯入草稿備份
      </button>
      <input
        ref={fileInput}
        type="file"
        accept=".json,application/json"
        className="sr-only"
        aria-label="選擇草稿備份 JSON 檔案"
        onChange={(event) => void pick(event.target.files?.[0])}
      />
    </div>
  );
}
