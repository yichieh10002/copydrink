export type Confirmation = {
  title: string;
  message: string;
  action: () => Promise<void>;
};

export function ConfirmDialog({
  value,
  busy,
  onConfirm,
  onClose,
}: {
  value: Confirmation;
  busy: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <div
      className="admin-overlay items-center justify-center"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <section
        className="admin-card m-4 max-w-md w-full"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="admin-confirm-title"
      >
        <h2 id="admin-confirm-title" className="text-xl font-bold">
          {value.title}
        </h2>
        <p className="my-5 text-slate-600">{value.message}</p>
        <div className="admin-row">
          <button
            className="admin-btn admin-btn-primary"
            disabled={busy}
            onClick={onConfirm}
          >
            確認
          </button>
          <button className="admin-btn" onClick={onClose}>
            取消
          </button>
        </div>
      </section>
    </div>
  );
}
