import type { FormEvent } from "react";

type Props = {
  email: string;
  password: string;
  busy: boolean;
  onEmail: (value: string) => void;
  onPassword: (value: string) => void;
  onSubmit: (event: FormEvent) => void;
};

export function AdminLogin({
  email,
  password,
  busy,
  onEmail,
  onPassword,
  onSubmit,
}: Props) {
  return (
    <form onSubmit={onSubmit} className="admin-card w-full max-w-md grid gap-5">
      <div>
        <strong className="text-blue-700 text-sm">copydrink · ADMIN</strong>
        <h1 className="text-2xl font-bold mt-2">菜單工作室</h1>
        <p className="text-slate-500 text-sm mt-1">
          請使用已授權的管理者帳號登入。
        </p>
      </div>
      <label className="admin-field">
        <span className="admin-field-label">
          電子信箱 <span className="text-orange-600">＊</span>
        </span>
        <input
          className="admin-input"
          type="email"
          autoComplete="username"
          value={email}
          onChange={(e) => onEmail(e.target.value)}
          required
        />
      </label>
      <label className="admin-field">
        <span className="admin-field-label">
          密碼 <span className="text-orange-600">＊</span>
        </span>
        <input
          className="admin-input"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => onPassword(e.target.value)}
          required
        />
      </label>
      <button className="admin-btn admin-btn-primary" disabled={busy}>
        登入
      </button>
      <p className="text-xs text-slate-500">
        登入狀態只保存在目前頁面，重新整理需要重新登入。
      </p>
    </form>
  );
}
