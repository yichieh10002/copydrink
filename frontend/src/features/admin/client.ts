import type {
  Draft,
  DraftHeader,
  Publication,
  AdminDocument,
  WarmDraft,
  WarmDocument,
} from "./types";

const endpoint =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://rdbcwhuhxahekxhrwekd.supabase.co";
const key =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  "sb_publishable_43Eq9sL1L0opGRsjICs-yw_LkzcL12E";

export class AdminRequestError extends Error {
  constructor(
    message: string,
    public code = "REQUEST",
  ) {
    super(message);
  }
}

export class AdminClient {
  private token: string | null = null;

  private async request<T>(
    path: string,
    options: {
      method?: string;
      body?: unknown;
      auth?: boolean;
      prefer?: string;
    } = {},
  ): Promise<T> {
    const { method = "GET", body, auth = true, prefer } = options;
    if (auth && !this.token)
      throw new AdminRequestError("請重新登入菜單工作室。", "LOGIN_REQUIRED");
    const response = await fetch(endpoint + path, {
      method,
      cache: "no-store",
      signal: AbortSignal.timeout(15000),
      headers: {
        apikey: key,
        "Content-Type": "application/json",
        ...(auth ? { Authorization: `Bearer ${this.token}` } : {}),
        ...(prefer ? { Prefer: prefer } : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    }).catch(() => {
      throw new AdminRequestError(
        "連線失敗，儲存狀態尚未確認。請重新讀取草稿。",
        "NETWORK",
      );
    });
    if (response.status === 204) return null as T;
    let result: unknown;
    try {
      result = await response.json();
    } catch {
      throw new AdminRequestError("伺服器回應格式異常。");
    }
    if (!response.ok) {
      if (response.status === 401) {
        this.token = null;
        throw new AdminRequestError(
          "登入已過期，請重新登入。",
          "LOGIN_REQUIRED",
        );
      }
      if (response.status === 403)
        throw new AdminRequestError("此帳號沒有管理權限。", "FORBIDDEN");
      if (
        response.status === 409 ||
        (result as { code?: string })?.code === "40001"
      )
        throw new AdminRequestError(
          "草稿已被其他操作更新。請先備份目前輸入，再重新讀取。",
          "CONFLICT",
        );
      if (response.status === 429)
        throw new AdminRequestError("操作太頻繁，請稍候重試。", "RATE_LIMIT");
      throw new AdminRequestError(
        auth
          ? "操作未完成，請重新讀取確認資料狀態。"
          : "登入失敗，請檢查帳號與密碼。",
      );
    }
    return result as T;
  }

  async login(email: string, password: string) {
    this.token = null;
    const session = await this.request<{
      access_token: string;
      user: { id: string };
    }>("/auth/v1/token?grant_type=password", {
      method: "POST",
      body: { email, password },
      auth: false,
    });
    if (!session.access_token || !session.user?.id)
      throw new AdminRequestError("登入回應不完整。");
    this.token = session.access_token;
    try {
      const rows = await this.request<Array<{ active: boolean }>>(
        `/rest/v1/menu_admins?select=active&user_id=eq.${encodeURIComponent(session.user.id)}`,
      );
      if (!rows.some((row) => row.active))
        throw new AdminRequestError("此帳號尚未取得管理權限。", "FORBIDDEN");
    } catch (error) {
      try {
        await this.logout();
      } catch {
        /* the local token is cleared regardless */
      }
      throw error;
    }
  }

  async logout() {
    try {
      if (this.token)
        await this.request("/auth/v1/logout?scope=local", { method: "POST" });
    } finally {
      this.token = null;
    }
  }

  async list(): Promise<DraftHeader[]> {
    const all: DraftHeader[] = [];
    for (let offset = 0; ; offset += 200) {
      const rows = await this.request<DraftHeader[]>(
        `/rest/v1/menu_drafts?select=store_key,revision,updated_at,brand:document->brand&document->>scope=eq.menu-cms&order=store_key&limit=200&offset=${offset}`,
      );
      all.push(...rows);
      if (rows.length < 200) return all;
    }
  }

  async load(storeKey: string) {
    const rows = await this.request<Draft[]>(
      `/rest/v1/menu_drafts?select=store_key,document,revision,updated_at&store_key=eq.${encodeURIComponent(storeKey)}`,
    );
    if (!rows[0])
      throw new AdminRequestError("找不到店家草稿，或帳號沒有權限。");
    return rows[0];
  }

  async save(draft: Draft, document: AdminDocument) {
    const rows = await this.request<Draft[]>(
      `/rest/v1/menu_drafts?select=store_key,document,revision,updated_at&store_key=eq.${encodeURIComponent(draft.store_key)}&revision=eq.${draft.revision}`,
      { method: "PATCH", body: { document }, prefer: "return=representation" },
    );
    if (!rows.length)
      throw new AdminRequestError(
        "草稿版本已改變，尚未儲存。請備份輸入後重新讀取。",
        "CONFLICT",
      );
    return rows[0];
  }

  async create(name: string) {
    const document: AdminDocument = {
      scope: "menu-cms",
      schemaVersion: 2,
      brand: {
        name,
        menus: [],
        categories: [],
        cupTypes: [{ id: "large", size: "大杯", capacity: "" }],
        sugars: ["全糖", "少糖", "半糖", "微糖", "一分糖", "無糖"],
        ices: ["正常冰", "少冰", "微冰", "去冰", "常溫", "溫飲", "熱飲"],
        toppings: [],
        tags: [],
      },
      regions: [{ id: "all", name: "全台", enabled: true }],
      activities: [],
      items: [],
    };
    const rows = await this.request<Draft[]>(
      "/rest/v1/menu_drafts?select=store_key,document,revision,updated_at",
      {
        method: "POST",
        body: { store_key: `menu-${crypto.randomUUID()}`, document },
        prefer: "return=representation",
      },
    );
    if (!rows.length)
      throw new AdminRequestError("建立店家失敗，請重新讀取確認。");
    return rows[0];
  }

  async publications(storeKey: string) {
    return this.request<Publication[]>(
      `/rest/v1/menu_publications?select=id,source_revision,published_at,is_current&store_key=eq.${encodeURIComponent(storeKey)}&order=published_at.desc,id.desc&limit=6`,
    );
  }
  async loadWarm() {
    const rows = await this.request<WarmDraft[]>(
      "/rest/v1/menu_drafts?select=store_key,document,revision,updated_at&store_key=eq.site-warm-drink-notices",
    );
    return rows[0] || null;
  }
  async saveWarm(record: WarmDraft | null, document: WarmDocument) {
    const base =
      "/rest/v1/menu_drafts?select=store_key,document,revision,updated_at";
    const rows = record
      ? await this.request<WarmDraft[]>(
          `${base}&store_key=eq.site-warm-drink-notices&revision=eq.${record.revision}`,
          {
            method: "PATCH",
            body: { document },
            prefer: "return=representation",
          },
        )
      : await this.request<WarmDraft[]>(base, {
          method: "POST",
          body: { store_key: "site-warm-drink-notices", document },
          prefer: "return=representation",
        });
    if (!rows.length)
      throw new AdminRequestError(
        "提醒草稿版本已改變，請重新讀取確認。",
        "CONFLICT",
      );
    return rows[0];
  }

  async publish(draft: Pick<Draft, "store_key" | "revision">) {
    return this.request<unknown[]>("/rest/v1/rpc/publish_menu_draft", {
      method: "POST",
      body: {
        p_store_key: draft.store_key,
        p_expected_revision: draft.revision,
      },
    });
  }

  async restore(id: string, revision: number) {
    const rows = await this.request<Draft[]>(
      "/rest/v1/rpc/restore_menu_publication",
      {
        method: "POST",
        body: { p_publication_id: id, p_expected_revision: revision },
      },
    );
    if (!rows.length)
      throw new AdminRequestError("還原未完成，請重新讀取確認。");
    return rows[0];
  }
}
