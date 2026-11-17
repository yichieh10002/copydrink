# Copydrink 資安檢查紀錄

檢查日期：2026-11-16（Asia/Taipei）。產品來源 `0faa733`；檢查開始前工作樹乾淨。這是第一輪原始碼與正式資料庫唯讀檢查，不是完整滲透測試或安全保證。

## 結論與開放狀態

維持 Vercel 登入保護。本次沒有改產品程式、發布資料、RLS、帳號、存取設定或部署；沒有建立測試帳號、嘗試密碼或改動真實菜單。已發布菜單的 Supabase Data API 原本就允許匿名讀取；Vercel 保護僅擋網站入口，不代表公開 API 也被登入保護。

核心資料隔離已有資料庫實證；公開前先處理內部備註的發布邊界，再補 Next.js 安全標頭與管理登入強化。

## 已確認的防護

| 項目 | 證據與結果 | 範圍／限制 |
| --- | --- | --- |
| 草稿／管理者／發布表均有 RLS | 正式 `pg_class` 查驗三張表 `relrowsecurity=true` | 表擁有者不受 RLS 限制屬 PostgreSQL 預期行為；不把 privileged MCP 查到資料當成公開可讀 |
| 匿名訪客隔離 | 真實 HTTP GET：目前菜單 200、有資料；舊版查詢 200、0 列；草稿／管理名單／發布者欄位均 401、SQLSTATE 42501 | 只做 GET，沒有匿名寫入或 RPC 變更呼叫 |
| 一般登入者隔離 | 正式 DB 的 READ ONLY transaction，以合成非管理者 subject + authenticated role 查詢：草稿0、管理名單0、舊發布0、目前發布14 | 驗證資料層角色與 JWT subject 條件；沒有建立真實登入帳號，未做瀏覽器登入實測 |
| 無自行升級管理者權限 | 正式 grant：authenticated 對 menu_admins 僅 SELECT，policy 只看自己的 membership；沒有可用 INSERT/UPDATE/DELETE grant | 管理者撤權後，新的資料請求會再次判斷 active；既有 access token 登出後的剩餘有效期尚未實測 |
| 寫入與發布授權 | 草稿 INSERT/UPDATE 與發布 INSERT/UPDATE policy 都檢查 auth.uid 對應的 active 管理者；UPDATE 有 USING 和 WITH CHECK | 本次不執行真實寫入；不是成功發布／還原的端到端驗收 |
| 發布／還原 RPC | 正式 pg_proc：security invoker、空 search_path、匿名無 EXECUTE；函式內再次查 active 管理者及 expected revision；發布有 transaction advisory lock | authenticated 的 EXECUTE 不是直接授權發布，仍須通過函式及 RLS |
| 特權函式 | rls_auto_enable 是 SECURITY DEFINER event trigger，anon/authenticated 均無 EXECUTE；其他發布函式非 definer | 沒有修改函式權限 |
| 登入憑證處理 | cloud-client 的 access token 只留記憶體，不存 localStorage/sessionStorage；登入後讀管理者名單，未授權則清除 token；表單送出即清空密碼欄 | 記憶體保存不等於防止所有 XSS；不宣稱 JWT 可以即時失效 |
| 文字與連結 | Next.js 文字用 React 一般輸出，未找到 dangerouslySetInnerHTML；CMS DOM helper 用 textContent；店家／頁尾來源連結限定 HTTP(S)、外開附 noopener noreferrer | 未做瀏覽器惡意輸入測試；Logo URL 尚未統一限制來源與協定 |
| 金鑰掃描 | 目前 Git 追蹤文字檔，排除測試，掃描 sb_secret、service_role JWT、私鑰標記，未命中；雲端程式使用 publishable key | 未掃完整 Git 歷史、遠端環境、所有第三方憑證格式或產出 bundle；publishable key 依賴 RLS，不是密碼 |
| 套件掃描 | frontend npm audit --omit=dev：info/low/moderate/high/critical 都0 | 只代表當下 npm advisory database 未回報正式依賴已知漏洞，不涵蓋程式邏輯漏洞 |

## 已發現與待處理

### 1. 優先：內部備註跟著整份草稿公開

- 正式 `publish_menu_draft` 直接取 `menu_drafts.document` 再存進可匿名讀取的 `menu_publications.document`。
- 後台商品編輯有 `internalNote` 欄位；公開快照實際有200個品項帶此欄位，目前非空的筆數為0。這證明欄位公開，不證明曾有內容外洩。
- `frontend/src/lib/menu.ts` 將完整 JSON 保存在 `store.document`，TypeScript 型別沒有 internalNote 並不會把執行時欄位移除。只在畫面隱藏、只修改前端元件或將網站放在 Vercel 保護後面，都不能修正匿名 API 的欄位可讀性。
- 建議修正：定義公開菜單的欄位白名單／投影，在資料庫發布邊界排除 internalNote 和其他僅供管理的欄位；草稿及復原語意需一起設計，保留管理者內部備註。評估歷史快照，若曾有私密內容須一併清理；本次查到目前非空內容0。
- 修正後驗證：在隔離 fixture 填入內部備註，驗證草稿保留、公開 JSON／RSC 不含、匿名 API 不可讀，且還原不會意外丟失管理備註。不要用真實機密當測試資料。

### 2. 管理登入：外洩密碼防護未啟用

- Supabase security advisor 只有一項 WARNING：auth_leaked_password_protection。
- 這不是「密碼已外洩」的證據，代表目前沒有啟用此額外檢查。
- 應確認方案是否支援、成本及現有帳號流程，再啟用合適的密碼保護。MFA、註冊開關、Auth rate limit／CAPTCHA 實際設定本次尚未查驗，不推測已開啟或關閉。
- 官方說明：https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection

### 3. Next.js 未定義應用層安全標頭

- `frontend/next.config.ts` 只有 reactStrictMode，未定義 headers；repo 沒有 Next.js middleware/proxy 或 Vercel headers 設定。
- 舊靜態站的 `dist/_headers` 不會自動成為目前 Next.js 前台的設定。Vercel 自動提供的傳輸層標頭不等於已配置應用 CSP。
- 待補並驗證：nosniff、Referrer-Policy、Permissions-Policy、frame-ancestors／防嵌入策略；CSP 需配合 Next.js inline hydration、外部 Google Fonts 與 Logo 圖片，先測試／Report-Only，不能盲貼舊靜態站 policy。
- 本次沒有取得通過登入保護後的部署回應標頭，不宣稱線上所有安全標頭都缺少。
- 官方設定：https://nextjs.org/docs/app/api-reference/config/next-config-js/headers

### 4. 其餘補強與未驗證

- 自填小抄的署名、備註及部分自由欄位未統一 maxLength；只是本地文字複製，現有路徑不送單、不寫 DB，優先度低於發布資料邊界，但應限制過長內容避免畫面／剪貼簿負擔。
- Logo 圖片地址直接用 img src，未建立協定／來源白名單；實際程式沒有由伺服器抓任意 Logo 的邏輯，不能因此稱為 SSRF；仍須評估第三方圖片追蹤、data URL 類型與後台圖片處理的大小限制。
- 後台實際已存在店家 Logo 的本地檔案選取：FileReader → Image → canvas 縮至256px → data:image/webp 隨文件保存。與先前「沒有檔案上傳」的口語範圍不同：前台訪客沒有上傳流程，管理後台有圖片匯入，後續需獨立驗收。
- 正式 DB trigger 已啟用，但後台新增選填欄位與其型別／長度／URL 是否全部在資料層覆蓋，仍須逐項比對。
- 備份還原演練、寫入／撤權／登出後 access token 行為、Auth rate limit、跨裝置管理流程及完整 CSP 尚待查驗。

## 本次測試與下一步

- `node tests/cloud-client.cjs`：通過（mock Auth/API、allowlist、過期與版本衝突；非瀏覽器實際登入）。
- `node tests/cms-model.cjs`：通過（菜單與杯型驗證）。
- `node tests/cms-flow.cjs`：通過（DOM harness + mock cloud，非真實 DB 發布）。
- 真實 API 五項匿名 GET、正式 DB policy/grant/函式檢查、一般非管理者 READ ONLY 查詢完成。
- 下一階段先處理第1項公開欄位投影及復原語意，再處理第3項 Next.js headers；設定變更與發布後仍需驗證，現在不開放網站、不更動現有菜單。

## 2026-11-17 修補進度（目前僅本機，尚未套用）

- 目前工作副本是 `/workspace/scratch/745b259be742/copydrink-mobile`，以本節為最新狀態。Vercel 專案已重新開啟 SSO 登入保護；新舊預覽網址匿名請求都導往 Vercel 驗證。這不影響 Supabase 公開菜單 API 的匿名讀取。
- 正式 DB 唯讀複查：135 筆發布（14 筆目前版本）、目前版本 243 個品項含 `internalNote` 與 `source` 鍵；所有發布版本 `internalNote` 非空 0 筆，`source` 非空 861 筆。`source` 在後台標為「僅後台」，因此也列入移除清單。
- `database/harden-publications.sql` 已備好公開菜單投影：menu-cms 根、品牌、品項各自依白名單保留欄位；公開表的 BEFORE INSERT/UPDATE document trigger 擋住直接寫入與 RPC 發布夾帶的管理欄位；交易內先把舊版本的後台欄位存入無客戶端權限的 tea_private 封存表，再清理既有公開版本。若期間出現非空內部備註，交易會拒絕執行，需先檢視與保存。還原舊版時，對 ID 相同的品項保留**目前草稿**的 `internalNote`/`source`；在目前草稿中不存在的舊品項無法自動還原舊 `source`，管理者需補記。
- `database/test-publications.sql` 加入假備註／來源，斷言發布後不在公開 JSON 且還原不丟現有草稿備註。此交易測試尚未在正式 DB 執行；資料庫工具要求確認但確認逾時，因此沒有寫入、沒有執行 migration。唯讀核對目前 14 份菜單投影的 root/brand 欄位沒有漏掉現存鍵，品項只會排除 `internalNote` 和 `source`；精簡 JSON 投影語法的 SELECT 已成功執行。完整 trigger／還原交易仍須在隔離環境或授權的回滾測試中驗證。
- `frontend/next.config.ts` 增加 nosniff、Referrer-Policy、Permissions-Policy、X-Frame-Options DENY，以及限定 frame-ancestors/base-uri/object-src 的 CSP。完整 script-src CSP 仍待依 Next.js inline hydration 與外部資源做 Report-Only 測試。Next production build 與型別、設計 token 檢查通過，建置 routes-manifest 已列出五個標頭；本機 HTTP preview 因執行環境網路介面錯誤未取得實際回應，且尚未部署，線上回應標頭沒有變更。
- Supabase security advisor 唯讀複查仍只回報 `auth_leaked_password_protection` warning；登入設定、管理員撤權／備份演練及圖片匯入限制仍未完成。後續先完成資料庫交易測試與部署後匿名 API 驗證，再部署 Next 標頭並核對真實回應；產品與資料庫現在仍是原版本。
