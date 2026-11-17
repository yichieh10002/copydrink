"use client";
import { useEffect } from "react";
export type Notice = { id: number; kind: "success" | "error"; message: string };
export function Toast({
  notice,
  onClose,
}: {
  notice: Notice | null;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(onClose, notice.kind === "error" ? 9000 : 5500);
    return () => clearTimeout(timer);
  }, [notice, onClose]);
  if (!notice) return null;
  return (
    <div
      className="admin-toast"
      data-kind={notice.kind}
      role={notice.kind === "error" ? "alert" : "status"}
    >
      <div className="admin-row">
        <strong>{notice.kind === "error" ? "操作未完成" : "操作成功"}</strong>
        <button
          type="button"
          className="ml-auto"
          onClick={onClose}
          aria-label="關閉提示"
        >
          ×
        </button>
      </div>
      <p className="mt-1 text-sm">{notice.message}</p>
    </div>
  );
}
