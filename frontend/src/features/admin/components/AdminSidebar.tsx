export type AdminTab =
  | "items"
  | "categories"
  | "settings"
  | "recommendations"
  | "activities"
  | "publish";

const tabs: { id: AdminTab; label: string }[] = [
  { id: "items", label: "菜單商品" },
  { id: "categories", label: "菜單分類" },
  { id: "settings", label: "店家設定" },
  { id: "recommendations", label: "必喝 TOP" },
  { id: "activities", label: "限定活動" },
  { id: "publish", label: "發布紀錄" },
];

export function AdminSidebar({
  hasStore,
  onNavigate,
  onWarm,
  onLogout,
}: {
  hasStore: boolean;
  onNavigate: (tab: AdminTab | null) => void;
  onWarm: () => void;
  onLogout: () => void;
}) {
  return (
    <aside className="admin-side">
      <h1 className="text-xl font-black tracking-wide mb-1">copydrink</h1>
      <p className="text-blue-100 text-sm mb-8">菜單工作室 · 新版預覽</p>
      <nav className="grid gap-2" aria-label="後台選單">
        <button
          className="text-left rounded-lg p-3 hover:bg-white/15"
          onClick={() => onNavigate(null)}
        >
          店家列表
        </button>
        <button
          className="text-left rounded-lg p-3 hover:bg-white/15"
          onClick={onWarm}
        >
          溫熱飲提醒
        </button>
        {hasStore &&
          tabs.map((tab) => (
            <button
              key={tab.id}
              className="text-left rounded-lg p-3 hover:bg-white/15"
              onClick={() => onNavigate(tab.id)}
            >
              {tab.label}
            </button>
          ))}
      </nav>
      <button className="mt-10 text-sm underline" onClick={onLogout}>
        登出
      </button>
    </aside>
  );
}
