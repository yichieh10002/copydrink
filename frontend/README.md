# copydrink 前台（Next.js）

這是與現有靜態站並行的 React 前台。後台仍在 `../dist/admin.html`，且不會因本目錄的變更而改寫。

接手前先讀 [專案交接文件](../docs/PROJECT_HANDOFF.md)，其中記錄目前工作版本、既有 Vercel 預覽與尚未部署的修改。部分功能已有驗證，不能據此認定所有舊功能皆已驗收。

開發伺服器的網址只供目前工作環境使用，會停止或休眠。現行 Sites 設定仍指向 `../dist/` 靜態站，Next.js 前台使用獨立的 Vercel 預覽專案，不能只把 Sites 部署目錄改成這個目錄。

```sh
cd frontend
npm ci
npm run dev
```

預設讀取現有 Supabase 公開的已發布快照；環境變數 `SUPABASE_URL`、`SUPABASE_PUBLISHABLE_KEY` 可以覆蓋預設連線，`NEXT_PUBLIC_SITE_URL` 用於 canonical 與 sitemap。正式切換前需設定新站網址並驗證管理員發布後可更新。
