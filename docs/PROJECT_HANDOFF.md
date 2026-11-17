# Copydrink 專案接手文件

> 2026-11-17 最新：新版後台在本機 `feature/admin-workspace-v2` 開發，回退標記 `admin-v1-before-rebuild-20261117`。未推送、未部署、未寫入 Supabase；舊後台不變。已完成的範圍、未完成的功能與驗證見 [admin-v2-rebuild.md](admin-v2-rebuild.md)。下方 11/16 舊部署紀錄仍供追溯，不表示這次後台已上線。

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

## 2026-11-16 手機裁切修正（最新線上來源 fd248d6；本次未部署）

- 最新 Vercel `dpl_DTXdV6e6rhEvbA6ez6DmSZKtiVFx`／`https://copydrink-github-preview-nh7pxkqdr-yichiehs-projects-5086e20d.vercel.app` 是 GitHub `fd248d622550e7b080bd7817f04ab52c8e57c55e`，並非舊工作副本 a9783e8。這次從該實際線上來源建立獨立工作樹 `/workspace/scratch/745b259be742/copydrink-mobile`，分支 `fix/mobile-framing-20261116`。
- 問題：mobile characters 用 auto 72% 並置中偏30px，畫面越長素材越大，因原圖左半為留白，熊貓與右側男孩被裁掉；文案離 sticky header 太近。
- 修正：characters 改由視窗寬控制 clamp(620px,185vw,1140px) 並右下對齊；cup 195vw右下對齊，解除插畫大小對整段高度的依賴。文字頂部改 header offset +40px；取消固定最低高度，文案底部留白由380–540px減至260–360px；半糖標籤改由底部38%定位。僅620px以下生效，保留最新線上文案與其餘設定。
- 瀏覽器實際檢查 iframe 外寬360／390px（桌機 scrollbar佔15px，內容寬345／375px）：三名角色可見、無橫向溢出，header與eyebrow間距47.8125px。768px一併檢視，未修改其既有排版。
- 截圖 `/workspace/shared/copydrink-mobile-check.jpg` 為本機QA，不是Vercel部署畫面。臨時 QA HTML 不納入產品或部署。
- 沒有推送GitHub或部署，現有暫時公開設定未變更。要部署本次修正，必須使用此新工作樹，不能從a9783e8舊副本發版覆蓋fd248d6。
- 注意：fd248d6相較舊副本缺少部分先前SEO、logo、頁尾與CSS修改；本次只修手機裁切，不擅自整份還原。後續整合應逐項比較，安全檢查報告在舊工作副本docs/SECURITY_REVIEW.md。

- 最終production build（含TypeScript）、設計token與git diff --check通過；沒有新增與CSS實作重複的測試。

## 2026-11-16 手機修正版 Vercel 預覽

- 小潔要求查看此修正版部署，本次從新工作樹發布 `08b6bc9b4a5d5614e70bacca71cb3c402be05212`，基底fd248d6。已核對GitHub仍fd248d6，沒有覆蓋新的遠端修改。
- Deployment `dpl_9VyfQJLFxdPUQMSrki6oeSNuBTjz`。
- URL：https://copydrink-github-preview-49zh24cfw-yichiehs-projects-5086e20d.vercel.app
- 沿用既有Team/Project，preview，直接Vercel files部署；未推送GitHub或修改正式別名，維持ssoProtection.enabled=false的暫時公開設定。
- 已有production build/TypeScript/設計token/diff檢查及手機寬度瀏覽器驗證，本次來源未變不重複建置；不包含臨時QA HTML。

- 最終READY；匿名HTTP GET 200、無登入轉址，HTML含首頁Hero與店家區。上段未部署為歷史狀態，此修正已上線。

## 2026-11-16 切換頁面捲動修正（尚未部署）

- 小潔指出從首頁進店家時會由底部滑到頂部，要求先修正。原因是base.css將html全站設scroll-behavior:smooth；Next.js 16預設不會為路由自動覆寫smooth，安裝版upgrading/version-16.md已核對。
- 將全域html捲動改為auto；BackToTop按鈕原本已用window.scrollTo顯式指定smooth（尊重prefers-reduced-motion），不需增加路由effect或手動scrollTo，保留Next.js返回位置恢復。
- 本機瀏覽器實測：首頁往下至店家列表後點得正，切換完成/stores/dezheng的scrollY=0；瀏覽器back後回到首頁scrollY=1181（與點選前的位置一致）；點回頂部按鈕後先仍在1181，再觀察動畫完成到0。computed scrollBehavior=auto。
- 設計token與git diff --check通過。純一行CSS，不增加與實作重複的單元測試；未做手機Safari實機驗收。
- 本次只修改並本機提交，沒有推送／部署。現有線上仍為dpl_9VyfQJLFxdPUQMSrki6oeSNuBTjz，暫時公開設定不變。

## 2026-11-16 恢復被新版來源蓋回的分隔線／預覽樣式（尚未部署）

- 小潔確認首頁統計直線、頁尾橫線與複製文字外框曾改過卻回舊版。原因是目前線上與新工作樹的基底fd248d6未包含早先0faa733及73472ec的調整；本次在現用分支逐項恢復，不覆蓋最新手機版。
- 新增--color-decorative-divider：品牌深藍18%透明混色；統計左線改1px，頁尾橫線套同色。共用copy-preview output改border:0，白底和文字保留，自填及飲品設定同步。
- 依先前明確要求，也再次移除新版基底帶回的頁尾GitHub問題回報與失效指引。
- 保留c774984的全站auto捲動、08b6bc9的手機裁切修正。沒有改其餘樣式或資料，未推送／部署；線上仍是dpl_9VyfQJLFxdPUQMSrki6oeSNuBTjz。
- 設計token、TypeScript型別與git diff --check皆通過。本次不新增瀏覽器畫面驗收。

## 2026-11-16 恢復確認版 Logo／印章／桌機頁首（尚未部署）

- 小潔指出Logo也被舊版蓋回；從已確認提交0c8492d精準取回BrandLogo.tsx與copydrink-logo-handdrawn-white.png，不重新生成、不換設計。
- 共用Logo同步頁首與頁尾印章；恢復StampBorder斑駁雙圈。保留上一筆已補回的頁尾淡藍分隔線與已刪除的問題回報。
- 恢復901px以上Logo圖案21×20px、字標71×16px、gap4px（原尺寸50%），導覽列最大寬960px；手機Logo尺寸不變。沒有覆蓋最新手機Hero規則。
- 待部署整批：c774984路由捲動、a2536f0淡藍線／去預覽框／移除回報，以及這次Logo與印章／桌機頁首恢復。線上仍是08b6bc9版，沒有自動推送或部署。

- production build（含TypeScript）、設計token、git diff --check通過；本次未新增瀏覽器畫面驗收。

## 2026-11-16 整批恢復與捲動修正部署

- 小潔明確要求一起部署；產品來源 `a66aa18089daea6b462b16e5269616eabe9c506d`，包含c774984、a2536f0及a66aa18。發布前核對GitHub仍fd248d6，沒有新的遠端差異。
- 內容：進店家直接到頂部、瀏覽器返回恢復位置、回頂部按鈕保留平滑；淡藍分隔線、複製output無邊框、移除頁尾問題回報；確認版Logo與斑駁印章、桌機半尺寸Logo與960px導覽列；保留手機裁切修正。
- Deployment `dpl_E2faKQ4964qjQnZHxnzHVab8Jizd`，既有Vercel project/team，preview，直接files部署。未推送GitHub或修改正式別名；ssoProtection維持關閉的暫時公開狀態，等小潔要求恢復。
- URL：https://copydrink-github-preview-n0zpvpwhn-yichiehs-projects-5086e20d.vercel.app
- 產品來源在前回合已通過production build/TypeScript/token/diff；捲動與手機裁切已做本機瀏覽器檢查，沒有重跑未變更來源的建置。

- 最終READY；匿名GET首頁200、不轉登入。線上HTML確認新版Logo路徑、無問題回報入口；下載實際CSS確認decorative-divider、html auto捲動及copy-preview output border:0皆已生效。上方待部署為歷史紀錄，整批目前已部署。

## 2026-11-16 恢復背景大字透明度（尚未部署）

- 小潔指出背景COPYDRINK大字透明度被舊版來源蓋回；在目前分支hero.css共用.hero-giant恢復opacity:0.3，即原確認的30%不透明度。桌機／手機共用，未加模糊或改動版型／動畫。
- 前次整批已部署a66aa18，此次只有透明度待部署；目前線上仍dpl_E2faKQ4964qjQnZHxnzHVab8Jizd。其他已恢復的Logo、淡藍分隔線、去框與捲動不動。

## 2026-11-16 店家 Logo 陰影縮小（尚未部署）

- 小潔要求店家資訊區Logo陰影擴散小一些。只將store-intro-main .store-logo由shadow-lg改為shadow-md：淺色從0 20px 50px 12%改0 4px 20px 8%，減少偏移、模糊範圍與濃度；深色沿用對應token。
- 套用所有店家詳細頁，首頁卡片與其他元件陰影不變。與背景大字opacity:0.3一起待部署；上一批修正已在線上dpl_E2faKQ4964qjQnZHxnzHVab8Jizd。

## 2026-11-16 必喝TOP前三名獎牌（尚未部署）

- 小潔同意前三名加同款線條獎牌icon與霧金／灰藍／淺銅標籤。共用TopPicks使用既有Phosphor MedalIcon，只在index<3顯示，aria-hidden避免重複朗讀，TOP數字保留；第4名以後原樣。
- 僅排名標籤著色，整列背景、點擊設定與複製行為不變。新增淺／深色對應rank tokens，標籤用inline-flex容納icon；無新增套件或client boundary。
- 尚未部署，與背景大字30%不透明度、店家Logo陰影縮小一起待發佈。現有暫時公開設定不變。

## 2026-11-16 小抄欄位標題辨識（尚未部署）

- 小潔要求每個欄位標題前有細長藍色直條，必填星號改紅／橘。使用3px寬、1em高、右距8px的空白CSS pseudo-element，覆蓋飲品dialog與自填小抄的legend、label.field及PickerInput標題；不在每個選項前加條。
- RequiredMark共用顏色改為--color-required：淺色#ad3f21、深色#ffb08a，與藍條分開；保留aria-label必填、原fieldset/legend/label關聯與選項互動，沒有使用文字方塊字元或新增JS。
- 設計token與git diff --check通過；純CSS沒有新增鏡像測試或瀏覽器驗收。
- 與前三名獎牌、背景大字30%不透明度及Logo陰影縮小一起尚未部署。線上仍dpl_E2faKQ4964qjQnZHxnzHVab8Jizd，暫時公開設定不變。

## 2026-11-16 小抄標題／前三名獎牌等整批部署

- 小潔明確要求部署，來源f4dc02f441bc0bea7f3b43c940a9fd53fe31fd54。包含背景大字opacity0.3、店家Logo shadow-md、TOP1–3獎牌與配色、小抄欄位細藍直條及橘紅必填星號，保留之前修正。
- 已核對GitHub仍fd248d6；本機production build/TypeScript/設計token/diff通過，生成next-env.d.ts已還原。直接Vercel files部署，不推送GitHub。
- Deployment dpl_9ESNpvqNCKuTznfpuoAygZVVE92i，既有Team/Project、preview，暫時公開設定維持，不改正式別名。
- URL：https://copydrink-github-preview-62vhg9py7-yichiehs-projects-5086e20d.vercel.app

- 最終READY；匿名首頁與得正頁HTTP200，實際部署CSS確認hero opacity0.3、required token、欄位標題marker、前三名rank tokens、Logo shadow-md；店家HTML有data-rank1/2/3。以上待部署項目現已整批上線，沒有新的瀏覽器畫面驗收。

## 2026-11-16 恢復桌機Hero較低高度（尚未部署）

- 小潔指出電腦首頁又變高；目前基底仍為max(760px,100svh)，新版換版時漏掉先前8643b80的桌機高度規則。
- 精準取回該提交901px以上的Hero高度／留白／圖層縮放／店家區頂部間距：max(600px,75svh)、header+24px/底40px，h1 16px、搜尋24px、統計20px；人物與杯auto112%靠右下，店家上留白32px／標題下24px。
- 保留最新手機CSS、現有文案、背景大字opacity0.3與其他已發布調整。Loading共用CSS同步套用；極矮視窗仍允許內容自然撐高。
- 本次僅本機保存，未推送／部署，線上仍dpl_9ESNpvqNCKuTznfpuoAygZVVE92i。

## 2026-11-16 小抄複製預覽配色收斂（尚未部署）

- 小潔明確駁回「拿掉飲料文字白底」；保留.copy-preview output的白色／深色主題paper底、深藍字、原圓角與無邊框，不改內容或功能。
- 其他依討論調整：整區淺藍更淡（新增copy-preview-surface，light #f1f6fc／dark #203247）；標題改muted深灰、text-small、weight600；底部分隔改既有淡藍decorative-divider。
- 重設改灰色icon＋文字、無框透明背景，保留至少44px點擊高與既有focus；可複製按鈕仍藍底白字；停用按鈕底色改更淡灰（light #f0f2f5／dark #2a333d），文字維持muted可讀。
- 共用CSS同步飲品設定與首頁自填小抄，必填橘紅星號與藍色標題直條保留。
- 設計token及git diff --check通過；本次純CSS，未新增瀏覽器驗收。尚未部署，與桌機Hero高度恢復一起待發布；線上仍dpl_9ESNpvqNCKuTznfpuoAygZVVE92i。

## 2026-11-16 桌機首頁高度與小抄配色部署完成

- 小潔明確要求部署，來源1134a749c78c5a86fdab54d5faa2544b2c0d67bf，包含30f99f1桌機Hero高度恢復與1134a74預覽配色。飲料文字白底／深藍字／無框保留，手機排版不變。
- production build、TypeScript、設計token、git diff --check通過；生成next-env.d.ts已還原。核對GitHub仍fd248d6，Vercel前次最新為dpl_9ESNpvqNCKuTznfpuoAygZVVE92i。直接files部署，沒有推送GitHub或變更正式別名。
- Deployment：dpl_Dyv6k57zEKQc2jhhFwvgQ2VuhhW2，preview，READY，既有project/team，暫時公開權限維持。
- URL：https://copydrink-github-preview-d6vomqs7v-yichiehs-projects-5086e20d.vercel.app
- 匿名首頁與得正頁HTTP200、不轉登入；下載線上CSS確認75svh、preview新色、停用按鈕新色、output paper底及無框reset。這次未新增瀏覽器畫面驗收。上述兩項待部署均已上線，目前無新的產品修改待部署。

## 2026-11-16 手機版浮動導覽透明度（尚未部署）

- 小潔希望截圖右下「回頂部／回全部」按鈕透明一點。手機版620px以下共用容器背景由paper 90%改為72%，與桌機既有glass透明度相近；背景模糊6px改8px，保留藍色文字／icon、點擊範圍與功能。淺色／深色由paper token自動對應。
- 只修改frontend/src/app/styles/base.css；設計token檢查與git diff --check通過，純CSS低風險變更未新增瀏覽器驗收。已本機提交，未推送／部署；最新線上仍為dpl_Dyv6k57zEKQc2jhhFwvgQ2VuhhW2，URL記於上一節。

## 2026-11-16 浮動導覽透明度同步電腦版（尚未部署）

- 小潔補充電腦版也要透明。共用.floating-nav背景改成以paper token混合64%不透明，桌機由原glass 72%降低、手機由前筆72%再降低；移除手機背景覆寫，只保留手機較低的8px模糊。其他共用glass token和站內元件不動，淺／深色皆適用。
- 樣式token及git diff --check通過，純CSS；本機提交，未推送／部署。以上一節手機72%為歷史中間狀態，待部署的最終桌機與手機均為64%。線上仍dpl_Dyv6k57zEKQc2jhhFwvgQ2VuhhW2。

## 2026-11-17 浮動導覽部署與預覽站重新上鎖

- 小潔要求先關閉網站公開，再部署剩餘修改。Vercel專案prj_FewA218UKpJkao7G8BWRigxZw66p的ssoProtection恢復deploymentType=all_except_custom_domains；設定回讀enabled=true。最新與前版deployment網址匿名GET都回302導往Vercel驗證，沒有網站內容。此設定僅保護Vercel站點，Supabase匿名公開菜單API仍依自身RLS公開。
- 產品來源be0d480557194c68f7c2b7303656dce4b96336fe，包含7ca80be與be0d480，最終手機／電腦浮動導覽容器背景paper 64%不透明。部署前production build/TypeScript、設計token、diff通過，生成next-env.d.ts已還原；GitHub遠端仍fd248d6。直接Vercel files preview部署，沒有推送GitHub或調整正式別名。
- Deployment dpl_J4BikEXE77PV467HADVwiJaPxkTx，READY；網址：https://copydrink-github-preview-51jt2j06u-yichiehs-projects-5086e20d.vercel.app
- 未以登入身分做瀏覽器畫面驗收；產品來源與保護設定已核對。剩餘安全修補依舊工作副本docs/SECURITY_REVIEW.md：發布欄位投影／備註、Next安全標頭、登入防護等；本批未處理。以上浮動導覽修改已部署，無其他待部署產品變更。

## 2026-11-17 資安修補準備（尚未套用／部署）

- 目前工作副本新增 `docs/SECURITY_REVIEW.md`，其中 2026-11-17 節是最新狀態，前段為歷史基線。`database/harden-publications.sql` 是尚未執行的交易修補稿；`database/test-publications.sql` 增加發布／還原私人欄位回歸檢查。`frontend/next.config.ts` 增加基本安全標頭與有限範圍 CSP，尚未部署。
- 正式 DB 唯讀核對資料與 Supabase advisor；資料庫工具的回滾測試確認逾時，沒有修改正式資料或設定。Next production build、TypeScript、設計 token、routes-manifest 標頭及 diff 通過；尚未完成真實 HTTP／DB 交易驗證。Vercel 仍維持 SSO 登入保護，最新部署仍為 dpl_J4BikEXE77PV467HADVwiJaPxkTx。下一步先驗證資料庫交易與保留語意，再按結果套用及部署；不要把本機修補稿描述成已生效。
