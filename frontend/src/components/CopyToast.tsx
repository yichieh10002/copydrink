export function CopyToast({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <div className="copy-toast" role="status" aria-live="polite">
      ✓ 已複製，可以貼到群組囉！
    </div>
  );
}
