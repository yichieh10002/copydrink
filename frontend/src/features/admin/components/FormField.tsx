"use client";
import { useEffect, useRef } from "react";

type Props = {
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: React.ReactNode;
};
export function FormField({ label, required, error, hint, children }: Props) {
  return (
    <label className="admin-field">
      <span className="admin-field-label">
        {label}{" "}
        {required && (
          <span className="text-orange-600" aria-label="必填">
            ＊
          </span>
        )}
      </span>
      {children}
      {hint && <small className="text-slate-500">{hint}</small>}
      {error && (
        <small className="admin-error" role="alert">
          {error}
        </small>
      )}
    </label>
  );
}

export function GrowingTextarea({
  value,
  onChange,
  rows = 5,
  ...props
}: Omit<
  React.TextareaHTMLAttributes<HTMLTextAreaElement>,
  "onChange" | "value"
> & { value: string; onChange: (value: string) => void }) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    if (ref.current) {
      ref.current.style.height = "auto";
      ref.current.style.height = `${Math.max(ref.current.scrollHeight, 138)}px`;
    }
  }, [value]);
  return (
    <textarea
      ref={ref}
      className="admin-input"
      rows={rows}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      {...props}
    />
  );
}
