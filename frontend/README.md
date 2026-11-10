# copydrink 前台（Next.js）

這是與現有靜態站並行的 React 前台。後台仍在 `../dist/admin.html`，且不會因本目錄的變更而改寫。

目前是開發中的第一版，畫面及舊功能尚未逐項驗收。開發伺服器的網址只供目前工作環境使用，會停止或休眠；提供穩定的使用者預覽前，需要另設可執行 Next.js 的預覽部署。現行 Sites 設定仍指向 `../dist/` 靜態站，不能只把部署目錄改成這個專案。

```sh
cd frontend
npm ci
npm run dev
```

預設讀取現有 Supabase 公開的已發布快照；環境變數 `SUPABASE_URL`、`SUPABASE_PUBLISHABLE_KEY` 可以覆蓋預設連線，`NEXT_PUBLIC_SITE_URL` 用於 canonical 與 sitemap。正式切換前需設定新站網址並驗證管理員發布後可更新。
