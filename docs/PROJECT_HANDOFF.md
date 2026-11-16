# Copydrink 專案接手文件

最後更新：2026-11-16（Asia/Taipei）。

## 先看這裡

**使用者於 2026-11-16 要求「部署吧」，累積修正已部署至原本 Vercel 預覽專案，狀態 READY。功能版本 e1048d2，包含跑馬條、選項點擊區、彈窗遮罩關閉、近白菜單及淺藍複製預覽區。線上畫面尚未驗收，詳見本次部署紀錄。**

不必重新詢問專案背景、尋找整個網站或重做插畫。先確認工作副本與 Git 狀態，再依使用者當次要求往下做。

## 目前狀態

| 項目 | 已確認狀態 |
| --- | --- |
| 工作分支 | `ui/claude-visual-refresh` |
| 最新功能提交 | `e1048d2d0ea544c1e759e4897679f4addec1c73c`：淺藍複製預覽區與文字／按鈕對比 |
| 最近成功部署的功能版本 | `e1048d2`：包含目前所有累積功能修正 |
| 尚未部署 | **有**：2026-11-16 動效三項調整（首頁載入骨架、觸控按壓回饋、Hero 進場時間），在 `/Users/yichieh/Desktop/copydrink` **已提交於本機、未推送、未部署**，見下方紀錄 |
| 最新預覽狀態 | 2026-11-16 查驗 `READY`，建置成功；77 個來源檔 SHA1 全數與本機一致 |
| 舊版還原點 | Tag `copydrink-before-layered-hero-20261115` → `b32a81699bbbc6e152efb78eec16359578d2ded7` |
| 程式保存 | 本文件隨最新來源快照同步 GitHub 分支；GitHub 提交 SHA 與原本機功能 SHA 不同，請看上方接手說明 |

本文件與入口文件會另外提交，因此之後 `HEAD` 可能是文件提交，並不代表又有新功能版本。

## 正確的工作位置

這次實際使用的根目錄：

```text
/workspace/scratch/a7db30489a21/site-workspace/.sites-checkout
```

Next.js 前台：

```text
/workspace/scratch/a7db30489a21/site-workspace/.sites-checkout/frontend
```

原產出環境根目錄的 `origin` 是 `git.chatgpt-team.site` 上的 Sites 來源儲存庫。GitHub 專案為 `yichieh10002/copydrink`。使用者於 2026-11-16 要求同步最新版，這份文件隨最新來源快照同步到 GitHub 的 `ui/claude-visual-refresh` 分支，接在原本 `e6c3eea` 後面，不改寫遠端歷史。

**GitHub 同步提交會有新的 SHA，原本機功能 SHA `e1048d2` 不會因此出現在 GitHub commit 清單中。不要再以找不到該 SHA 判定版本不正確：新版應包含三張 `home-hero-*.webp`、首頁 `hero-layer`、`src/lib/useDialogBackdrop.ts` 與本文件。以遠端最新提交及實際來源內容核對。**

在使用者桌面接手時，以 `/Users/yichieh/Desktop/copydrink` 等實際 clone 路徑為準；下方 `/workspace/...` 只是原產出環境的位置。先 `git status` 確認是否有未提交修改，禁止為了 pull 擅自 reset、clean 或覆蓋 Claude 的既有修改。乾淨且可快轉時才執行 `git fetch origin`、切換 `ui/claude-visual-refresh`，以及 `git pull --ff-only origin ui/claude-visual-refresh`。若分支分歧或有本機修改，先比較差異再整合。

先執行：

```sh
cd /workspace/scratch/a7db30489a21/site-workspace/.sites-checkout
git status --short
git branch --show-current
git log -6 --oneline
git show-ref --tags
```

如果新環境找不到上述目錄，先檢查使用者指定的專案，再搜尋現存工作副本。先前只搜尋四、五層，曾漏掉這個較深且隱藏的 checkout。可用以下有針對性的方式，不要掃描 `node_modules`：

```sh
find /workspace/scratch -type d \( -name node_modules -o -name .next \) -prune \
  -o -type f -path '*/.git/refs/tags/copydrink-before-layered-hero-20261115' -print
```

本機路徑與本機服務不是永久網址；目錄不存在時要回報實際缺少的來源，不能只根據這份文件宣稱已找回程式。

## 專案結構與邊界

| 路徑 | 用途 |
| --- | --- |
| `frontend/` | 目前修改與 Vercel 預覽的 Next.js 前台 |
| `frontend/src/app/page.tsx` | 首頁標題、搜尋、統計、三層插畫與藍色跑馬條 |
| `frontend/src/app/styles/hero.css` | 桌機 Hero、分層插畫、轉章、標籤、跑馬條 |
| `frontend/src/app/styles/responsive.css` | 900px／620px 以下的平板與手機配置 |
| `frontend/src/app/styles/motion.css` | 淡入、旋轉、跑馬等動畫與減少動態偏好 |
| `frontend/src/app/styles/touch-motion.css` | 觸控裝置的動畫／hover 限制 |
| `frontend/src/app/styles/tokens.css` | 顏色、字級、間距等設計變數 |
| `frontend/src/components/SiteFooter.tsx`、`styles/footer.css` | 頁尾插畫、手寫標語、聲明 |
| `frontend/src/lib/data.ts` | 從既有已發布菜單快照讀取前台資料 |
| `dist/` | 既有靜態站，包含 `admin.html` 後台 |
| `.openai/hosting.json` | 既有 Sites 靜態站設定，仍指向 `dist/` |
| `docs/` | 資料、後台、團購與架構等既有說明 |

資料存在 Supabase；前台讀已發布快照，各店家獨立儲存與發布。本次是外觀修改，不需要改 schema、權限、資料或後台流程。

## 最近的修改與原因

### `39a6249`：首頁分層插畫

- 使用選定的藍色海景、熊貓與雙胞胎方案。
- 三層素材均已存在，不需要重新生成或下載原圖：
  - `frontend/public/assets/home-hero-background.webp`：背景海景。
  - `frontend/public/assets/home-hero-cup.webp`：右側大杯。
  - `frontend/public/assets/home-hero-characters.webp`：三位角色。
- 更新 `frontend/public/assets/footer-slogan-handwritten.webp` 頁尾字圖。
- 保留大字、旋轉圓章與藍色跑馬條；素材須清晰，避免低解析替換。
- 桌機逐層淡入設定在 `hero.css`／`motion.css`；觸控裝置原本就有停用部分動畫的規則，不要擅自全部開啟。

### `a4c1ae5`：手機位置修正（已部署）

問題：圓章以整個 Hero 的百分比定位，壓到品牌統計數字；背景上緣有水平接縫。

修正：900px 以下將文字與插畫拆成兩個 grid row，裝飾改跟隨插畫區；620px 以下圓章縮成 64px，標籤收回邊界內。背景漸層遮罩依插畫高度從底部計算，避免影像上緣形成切線。

驗證：本機 360／390px 畫面確認數字與圓章不重疊；768px 也有預覽檢查；建置與 TypeScript 通過。部署後桌機確認仍正常。

### `c1109ea`：跑馬條灰色三角區塊（已納入 11/16 預覽部署）

問題：傾斜 `.marquee-band` 下方的陰影與外層露出的頁面底色，形成灰色楔形區塊。

修正僅在 `frontend/src/app/styles/hero.css`：

- 移除 `.marquee-band` 的 `box-shadow: var(--shadow-lg)`。
- `.marquee` 下半部背景使用 `--color-store-directory`，與後面的店家區一致；上半部保持透明，讓插畫正常銜接。
- 保留原有傾斜角度、藍色與跑馬動畫。

驗證：`git diff --check` 與 `npm run build` 通過；本機瀏覽器確認跑馬條下方不再有灰色區塊，店家區銜接正常。當時依使用者要求沒有部署或推送；其後已納入 11/16 的預覽部署。

### `cbe05f3`：選項、遮罩關閉、菜單底色（已納入 11/16 預覽部署）

- 原生 radio／checkbox 放大為 22×22px；`.inline-check`、`.pill`、文字分隔選項的 label 至少 44px 高，點整行文字也能操作。保留原生語意、鍵盤與 checked 行為。
- 新增 `frontend/src/lib/useDialogBackdrop.ts`：以 Pointer Events 與 dialog 實際邊界判斷，只有按下及放開都在遮罩外圍才關閉，避免在內容操作或由內往外拖曳時誤關。取消手勢清除暫存 pointer ID。
- 自填小抄、熱飲注意、搜尋、飲品設定、推薦榜單、配料與頁尾說明統一使用此處理；飲品設定仍呼叫原本 `onClose` 清除選取狀態，原本關閉按鈕與 Escape 行為保留。
- 淺色店家頁菜單底色 `--color-menu-canvas: #fdfdfe`，系列標題 `--color-menu-heading: #fafbfc`；`body:has(.menu-section)` 讓兩側與頁尾波浪前的空隙一致。深色另有對應變數。
- 將既有手機插畫遮罩色抽成 `--color-mask-solid`，讓設計變數檢查通過，視覺不變。
- 驗證：正式建置（含 TypeScript）、`npm run style:check`、`git diff --check` 通過。本機 Chromium 的 390px iframe 實測點「加入署名」文字可勾選並出現欄位，點「一般填寫」可切換 radio；量測勾選框 22px、整行高度 44px，radio label 高 47.5px。
- 本機實測自填小抄與飲品設定可點灰色遮罩關閉，點甜度會更新選項且維持彈窗；菜單本體與 body 底色皆為 `rgb(253, 253, 254)`，標題為 `rgb(250, 251, 252)`。尚未在實機 iOS Safari 驗收。
- 當時尚未推送或部署；其後已納入 11/16 的預覽部署。其後來源快照已同步 GitHub 分支，見上方接手說明。

### `e1048d2`：淺藍複製預覽區（已納入 11/16 預覽部署）

- 修改 `frontend/src/app/styles/order.css` 的共用 `.copy-preview`，同步套用到自填小抄及飲品設定的複製區。
- 預覽區底色使用 `--color-selected`（淺色模式 `#e7eff9`），標題與複製文案使用 `--color-brand-strong`（深藍 `#1a4a8a`）。文案 output 使用白底與藍色細框，重設按鈕同步調整。
- 複製按鈕可用時維持藍底白字；停用時保留灰底，文字改用 `--color-text-muted`，避免過淺。沿用既有語意變數，深色模式也有對應配色。
- 驗證：`npm run build`（含 TypeScript）、`npm run style:check`、`git diff --check` 通過。依實際色碼計算淺色模式對比：預覽標題 7.58:1、複製文案 8.79:1、可用按鈕 6.32:1、停用按鈕 4.61:1。本次沒有追加瀏覽器畫面驗收。
- 當時沒有推送或部署；其後已納入 11/16 的預覽部署。

### 2026-11-16 動效三項調整（Claude，已提交於本機、未推送、未部署）

基準 GitHub 同步提交 `d246949`。評估依據是已部署預覽的量測，結論是動效不需要加強，先修三件事。

- `frontend/src/app/loading.tsx`：首頁載入骨架改成與 Hero 同尺寸的外殼（沿用 `.home-hero`，文案區以 `visibility: hidden` 佔位）。原因：原本共用的矮骨架約 598px，內容串流進來時主區塊被撐開、頁尾被推走，預覽量測首頁 CLS 0.957（桌機 Chrome 157、1470×780，三次重現）。**修改 Hero 文案或結構時，這個檔案要一起改，否則高度會對不上。** 店家頁的 `stores/[slug]/loading.tsx` 未動（量測 CLS 為 0）。
- `frontend/src/app/styles/hero.css`：新增 `.home-hero-loading .hero-copy` 一條規則；三層插畫延遲由 100／500／900ms 改為 0／150／300ms，時長 1000ms 改 700ms（約 1 秒到位）；數字跳動 2200ms＠700ms 改 1200ms＠500ms；說明、搜尋、統計的延遲改為 320／400／500ms。
- `frontend/src/app/styles/touch-motion.css`：檔尾新增觸控專用 `:active` 區塊。卡片與按鈕縮放 0.97，列表型項目換底色 `--color-hover`。原因：觸控裝置的 hover 已被中和，原本全站沒有任何 `:active`，手機點擊沒有視覺回饋。選擇器加 `:not(:disabled)` 是為了和前面的 hover 重設同權重、靠順序勝出，不要拿掉。
- 觸控裝置的進場與循環動畫仍維持停用，沒有開啟任何新動畫。

驗證（本機 `next start`，埠 4177）：`npm run build`、`npm run typecheck`、`npm test`（8/8）、`npm run style:check`、Prettier、`git diff --check` 通過。首頁 CLS 在 1440×780 與 390×844（模擬觸控）皆為 0；骨架與實際 Hero 高度相同（1440 寬 811＝811px，390 寬 827＝827px）；串流 HTML 內確認有骨架。**未驗證**：`:active` 回饋沒有在實機 iOS Safari／Android 上按過；進場節奏的觀感需要小潔看過；本機資料回應快，慢速網路下的骨架停留時間未測。

本機 `node_modules` 原為舊版，缺 `@phosphor-icons/react`，已用 `npm ci` 依 lockfile 重裝。`next build` 改到的 `next-env.d.ts` 已還原。

**同日追加（已提交於本機、未推送、未部署）**：店家頁資訊卡入場由 `hero-in`（上移 40px＋縮放 0.9＋旋轉 -4°、1000ms）改為共用的 `fade-up`（淡入＋上移 24px、500ms）；店家 logo 的 `bob` 無限晃動移除（logo 靜止時不再歪斜）；`hero-in` keyframes 已無人使用而刪除。檔案：`styles/store.css`、`styles/motion.css`。建置、`style:check`、Prettier 通過；本機確認套用。店家頁載入位移也已修（同一筆提交）：`styles/order.css` 的 `.loading-page` 加上 `min-height: 100svh`，並用和 `.store-hero` 相同的負 `margin-top`（`--header-offset`）貼頂。原因同首頁：骨架比視窗矮、頁尾先出現再被推走，且實際內容貼頂而骨架從 header 下方開始。本機量測功夫茶頁 1024×768 的 CLS 由 0.237 降到 0，390×844 為 0；首頁複測仍為 0。`.loading-page` 目前只有 `stores/[slug]/loading.tsx` 使用。

尚未處理的評估建議（等小潔決定）：移除跑馬條星星旋轉與「口味」漸層循環、確認後刪除被插畫蓋住的三個 `hero-glow`、Hero 離開畫面時暫停循環動畫、店家卡片捲動進場範圍收短、搜尋彈窗補進場動畫、`home-hero-background.webp`（1.4MB）與 `copydrink-logo-short-black.webp`（530kB，顯示僅約 190px 寬）壓縮。

## Vercel 預覽的精確資訊

| 項目 | 值 |
| --- | --- |
| Team slug | `yichiehs-projects-5086e20d` |
| Team ID | `team_Psh7hzLfJ6JW38xbK1r8IeIK` |
| Project | `copydrink-github-preview` |
| Project ID | `prj_FewA218UKpJkao7G8BWRigxZw66p` |
| 最新成功部署 ID | `dpl_84G47rgGXDgYyizWQYs11Hx6kCc2` |
| 最新成功部署 URL | https://copydrink-github-preview-qc7hbt2m1-yichiehs-projects-5086e20d.vercel.app/ |
| 對應功能版本 | `e1048d2d0ea544c1e759e4897679f4addec1c73c`，含所有累積功能修正 |
| Framework／Root Directory | `nextjs`／`frontend` |
| 環境 | Preview；建立部署時省略 `target`，不要使用 `production` |

`copydrink-github-preview.vercel.app` 是較早的固定網址，不能直接當成這份最新預覽。前一個插畫部署是 `dpl_9XK9vSYQiAX5LAqCEmKA5QB8xiNP`，網址包含 `1r2wmyyu6`，之後還有 `jycboo5lk` 手機修正版；兩者現均已被上表的 11/16 版本取代。

專案有 Vercel Authentication。需要檢查受保護頁面時，優先使用已連接的 Vercel 工具；必要時取得短效分享連結再檢查瀏覽器，不要關閉部署保護。本文件不保存分享參數，因為會過期。

### 2026-11-16 本次部署驗證範圍

- Vercel 回傳 `READY`；建置紀錄顯示 `Build Completed` 與 `Deployment completed`。
- 使用 authenticated `list_deployment_files` 比對部署來源與本機：77 個檔案 SHA1 全數一致，包含新增的 `useDialogBackdrop.ts`。
- 自動審核拒絕 `get_access_to_vercel_url`，理由是建立持有者可存取的臨時分享連結會擴大存取範圍。本次沒有建立分享連結，也未改用會建立分享連結的 `web_fetch_vercel_url`，未更動部署保護。
- 因此本次未完成部署後瀏覽器畫面驗收；已完成的本機互動驗證與色彩對比紀錄見上方功能紀錄。開啟預覽仍可能需要使用者的 Vercel 登入權限。
- 若後續需要建立新分享連結，先依當時授權及審核結果處理，不要繞過拒絕。不需要為此再部署一次。

### 下次真的要求部署時

1. 確認使用者當次確實要求部署；沒有新授權時，不要自動重部署或切換正式站。
2. 確認 Team、Project、工作分支、完整提交 SHA、乾淨的 Git 狀態及待部署差異。
3. 讀取 `frontend/package.json` 與目前安裝版本的說明，執行必要建置檢查。
4. 本次成功方式是 Vercel `create_deployment` 的來源檔案部署，並非 GitHub 自動部署。使用上述既有 project，`files` 路徑從 `frontend/` 開始，設定 root directory 為 `frontend`。
5. 排除 `.git`、`node_modules`、`.next`、`.env*`、`*.tsbuildinfo` 等非來源或敏感檔案。
6. 未變更檔可引用前次部署的 SHA1／size；新二進位素材用 `upload_file` 上傳後引用 SHA1／size，文字檔可用 inline base64。來源清單由檔案實際內容產生，不要手抄或假設 code-mode 的記憶變數仍存在。
7. 舊部署來源樹的工具輸出可能以 `src/frontend/` 開頭；建立新部署時使用 `frontend/`，不要把來源包成 `src/frontend/frontend/`。
8. `create_deployment` 回傳 `INITIALIZING` 不等於完成；持續確認直到 `READY`，失敗則看 build logs。
9. 開啟新部署實際頁面檢查，回報新網址、提交及驗證範圍，更新本文件。未經要求不切換正式站、不更動舊別名。

Vercel 工具可透過可用工具清單按名稱尋找 `get_project`、`get_deployment`、`list_deployment_files`、`upload_file`、`create_deployment`、`get_access_to_vercel_url`，每次以當下工具 schema 為準。不要將 API 憑證寫進腳本或文件。

## 本機建置與畫面檢查

```sh
cd frontend
# node_modules 不在時才安裝：npm ci
npm run build
# 單獨需要型別檢查時：npm run typecheck
git diff --check
npm run start -- --hostname 0.0.0.0 --port 4177
```

純 CSS 小修改不用額外新增與實作一模一樣的測試；以建置與實際畫面檢查為主。數據讀取成功不代表每個互動都已驗收，回報時要區分。

這個工作環境有兩個容易踩到的點：

- 執行環境與瀏覽器的 localhost 可能不互通。曾在 shell 啟動成功，瀏覽器仍顯示 `ERR_CONNECTION_REFUSED`；後來在桌面終端啟動同份程式後可以開啟。這不代表專案程式壞了。
- 桌面終端的 PATH 可能沒有 `npm`／`node`。先確認執行檔是否存在；本次可用 `/opt/codex/runtimes/codex-primary-runtime/dependencies/node/bin/node`，在 `frontend/` 內執行 `node_modules/next/dist/bin/next start --hostname 0.0.0.0 --port <未占用埠>`。此路徑依環境可能改變。
- 未指定 hostname 時曾遇到 `uv_interface_addresses` 錯誤；明確指定 `0.0.0.0` 後可啟動。
- 手機檢查曾使用暫存 HTML，以 360／390／768px 寬的 iframe 指向本機 Next.js；iframe 的寬度能觸發實際 media query。暫存檢查頁不是產品的一部分，不要一起部署。
- `next build` 可能自動修改 `frontend/next-env.d.ts`。檢查差異；只有確定是本次建置生成、原先沒有使用者修改時，才還原這個生成檔，不要混進純 CSS 提交。

## 下一步

預覽部署仍是 `e1048d2` 的內容。本機有上述動效三項調整已提交但尚未推送；等小潔看過本機畫面後，再決定是否推送與部署，以及要不要做其餘評估建議。無須重做已完成的插畫拆層。

## 給下一段對話的開場文字

```text
請接續 Copydrink。先讀專案根目錄 AGENTS.md 與 docs/PROJECT_HANDOFF.md，再查 git status、目前分支與最近提交。以文件和實際程式確認最新進度，特別區分已部署與未部署；這次先不要部署。
已知工作根目錄：/workspace/scratch/a7db30489a21/site-workspace/.sites-checkout
```
