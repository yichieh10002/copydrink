# Copydrink 前台設計規範

這份規範只適用於 `frontend`；後台與資料格式不受影響。所有主題數值集中在 `src/app/styles/tokens.css`。元件樣式依功能放在 `base.css`、`home.css`、`store.css`、`menu.css`、`order.css`、`utilities.css`、`modal.css`；`responsive.css` 處理版面變化，`theme.css` 只保留切換控制與圖片的深色處理。`layout.tsx` 控制匯入順序。

## 顏色與深色模式

只用語意色票，不在頁面或元件檔寫十六進位顏色。`--color-canvas` 是頁面底色，`--color-paper` 是卡片或彈窗，`--color-surface` 是另一層表面，`--color-field` 是輸入框，`--color-text`、`--color-text-muted` 是主要與輔助文字，`--color-border` 是分隔線。品牌操作使用 `--color-brand` 與 `--color-on-brand`；深色橫幅與頁尾使用 `--color-navy`、`--color-on-dark`。選取狀態、提醒、停用、遮罩、焦點、骨架與圖片裝飾都有專用 token。

切換深色模式時，`html[data-theme="dark"]` 只改這些 token；元件不應各自新增深色覆蓋。新增顏色時先確認它代表的用途，擴充兩套 token，再使用該變數。品牌色上的文字與深色橫幅上的文字不可混用。

## 排版與尺寸

字體由 `--font-sans`、`--font-display`、`--font-editorial` 控制。正文基準為瀏覽器預設 16px，輔助字從 `--text-small`（14px）與 `--text-caption`（13px）選用；互動元件不要用 `--text-micro`（11px），這個尺寸只留給裝飾性標籤。標題使用 `--text-title-sm`、`--text-section`、`--text-title`、`--text-display`，手機展示標題與彈窗標題各有獨立 token。字級不得在元件中直接寫數值。

間距採 4px 基準，常用 `--space-1` 至 `--space-16`；圓角用 `--radius-*`；陰影用 `--shadow-*`。特殊的圖像比例、單一控件的內距或尺寸可留在元件樣式中，反覆出現的數值應提升為 token。可點擊的主要操作目標至少約 44px 高；焦點可見樣式由 `base.css` 管理。

## 響應與動態

內容最大寬度是 `--content-width`；900px 以下收斂首頁和店家雙欄，620px 以下切為手機單欄。檢查至少 360px、620px、桌面寬度，注意長品名、中文字換行、選項捲動、彈窗安全區與鍵盤遮擋。新增功能必須在深淺色及手機寬度各檢查一次。

互動時間由 `--motion-*` 和 `--ease-*` 控制。只有首頁視覺進場、彈窗進場與操作回饋需要動態，避免在每張菜單卡上加入持續動畫。`prefers-reduced-motion: reduce` 應關閉非必要動態與平滑捲動。

## 修改流程

先選語意 token，再改對應元件 CSS，最後在 `responsive.css` 調整手機排列。不要在 TSX 寫零散的色彩、字級或深色判斷；不要以全站 selector 修補單一元件。`npm run style:check` 會拒絕在元件 CSS 直接寫色碼和字級。完成後執行 `npm run typecheck`、`npm test`、`npm run style:check`、`npm run format:check`、`npm run build`，並人工檢查兩種主題的首頁、菜單、搜尋和兩種複製彈窗。
