import { CheckIcon } from "@phosphor-icons/react/dist/csr/Check";
export function CopyToast({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <div className="copy-toast" role="status" aria-live="polite">
      <CheckIcon size={18} weight="bold" aria-hidden="true" />
      已複製，可以貼到群組囉！
    </div>
  );
}
