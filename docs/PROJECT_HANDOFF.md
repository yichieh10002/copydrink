# Copydrink 專案接手文件

## 2026-11-17 最新交接（Asia/Taipei；優先讀本節）

**11/18 單杯選項編輯顯示收斂（本機，未部署）**：一沐日測試杯畫面中，同一筆單杯「熱飲」同時出現在指定選項勾選列與下方新增選項編輯列，看起來像重複。`ItemOptions` 的指定選項列現在只列店家原有選項；`AdditionalChoices` 在「只提供指定選項」模式下，讓每筆單杯新增選項於自己的編輯列勾選「使用」。資料結構和前台投影未改，新增選項仍預設選用，可自行取消、重新啟用、編輯或移除。後續檢查補上移除最後一筆新增選項時 `fixedChoiceId` 的安全回退，避免對不存在的下一筆選項取 `id`。`npm run build`、`npm run typecheck`、20 項 `npm run test`、`npm run format:check`、`git diff --check` 通過；尚未在預覽介面點選驗收，**尚未推送或部署**，線上預覽仍是下方 `dpl_3kJM...`。一沐日草稿／正式版未修改。下一步在收到明確預覽部署要求後更新受保護 Preview，檢查此勾選與單杯新增互動；前台完整規則組合可在下一間新店首次發布時一起驗收。

**11/18 組合規則前台資料流檢查（本機測試，未部署）**：欲建立隔離測試店的 SQL 請求回 `INVALID_ARGUMENT`，隨後唯讀確認測試鍵 `menu-copydrink-rule-check-20261118` 在草稿與發布表皆為 0；沒有建立或發布資料。一沐日草稿仍 revision 18、正式版 16。改以真實測試杯相同條件加入整合測試：前台店家投影只收上架杯、杯型僅中杯、甜度固定文字與唯一熱飲選項、小抄輸出「驗收測試飲料｜中杯｜甜度固定｜熱飲｜1 杯」。20 項測試、typecheck、format:check 通過。這證實共用資料運算，**尚未在受保護預覽中實際點選前台 UI**。測試只新增於本機，未推送或部署；前台功能來源未變。後續若要實際 UI 驗收，使用後台建立隔離測試店，不要發布一沐日整家店。

**11/18 一沐日僅中杯驗收（草稿）**：小潔將下架「測試飲料」從大杯切為僅中杯並儲存。唯讀核對草稿 revision 18、`active=false`、`cups` 僅一筆中杯／全台 $45；`fixedSugar=甜度固定` 及 `optionOverrides.sweetness.mode=fixed-text` 保留，溫度 `custom` 仍僅指向一筆熱飲（單杯新增選項）。正式版來源仍 revision 16，沒有發布此次測試。這驗證草稿資料保存與切換杯型，尚未驗證前台實際畫面及複製字串。不要在一沐日整家發布此測試杯；後續可移除這杯草稿資料，或在隔離測試店實測前台。

**11/18 一沐日測試杯（僅草稿，未發布）**：小潔在一沐日既有店新增下架「測試飲料」。唯讀核對 `menu-400939f6-2e43-4c0c-aaea-42701633e78f` 草稿 revision 17、正式版來源仍 revision 16；測試杯 `active=false`、甜度 override `fixed-text` 且 `fixedSugar=甜度固定`，溫度 override `custom` 只選一筆單杯新增的 `熱飲`，大杯單區 $50。店家原本的冰量群沒有熱飲；畫面上勾選的「熱飲」與下方可編輯的「熱飲」是同一筆新增 choice，不是兩筆前台選項。**這步只證實草稿保存與資料結構，尚未驗收實際前台複製；不要發布一沐日整家店來測試。**先前助手建議用「預覽草稿」檢查溫度選項不正確：`PublishPanel` 的草稿預覽只列上架飲料與地區價格，不展示選項，而這杯目前下架也不會列出。未擅自修改草稿。下一步若要實測前台，應使用隔離測試店發布，或先就既有一沐日草稿繼續測杯型／必填驗證，不將測試杯帶上正式站。

**11/17 單杯固定規則已部署受保護 Preview（最新）**：小潔明確要求「部署預覽」。本機功能提交 `9872456`，tree `c0283a6f5a99908c0f82c20506925139bdeecf86`；GitHub 預覽分支 `preview/admin-workspace-v2-20261117` 提交 `040379bc8c6f649f44ca01ada4a643c3ad408e40`，上傳 tree 與本機功能 tree 完全一致。Vercel 部署 `dpl_3kJM569jS6ujcvxjmGqMHbgQ9yw9` 已 `READY`，網址 `https://copydrink-github-preview-mzpu16va7-yichiehs-projects-5086e20d.vercel.app/admin`。新增單杯固定甜度／冰量文字輸入與必填驗證、「只做熱飲」快速套用及僅中杯操作提示。部署前 19 項測試、typecheck、style:check、format:check、production build、diff check 均通過；曾發現 `model.ts` 一處 Prettier 格式並在 `9872456` 修正。Vercel project `prj_FewA218UKpJkao7G8BWRigxZw66p` 最新 deployment 與上述一致，`target=null`；`ssoProtection.enabled=true`／`all_except_custom_domains`。正式站／別名與 Supabase 均未修改。**尚未在登入後實際畫面驗收新增操作、儲存／發布或手機介面**；下一步先在隔離測試店檢查固定文字、只做熱飲、僅中杯及複製結果，不直接改正式店家。前一個預覽 `dpl_7Vg2nZxRkozbg3Mdz3z4su9uxEdR` 可作程式回退參考，以下對它描述為「最新」或「尚未部署」皆為舊紀錄。

**11/17 最新受保護 Preview，取代本節以下各處的「待部署／舊預覽」狀態**：本機功能 HEAD `89f5b2f`、tree `86dba068eefca5d25b264fecaa5cad2e76a794ca`，已同步至 GitHub 預覽分支 `preview/admin-workspace-v2-20261117` 的提交 `15fb0cd62995b711a57056f13957ec0e4d179f08`，上傳 tree 完全一致。Vercel Preview `dpl_7Vg2nZxRkozbg3Mdz3z4su9uxEdR` 為 `READY`：`https://copydrink-github-preview-kmf57vjvl-yichiehs-projects-5086e20d.vercel.app/`，後台 `/admin`，無飲 `/stores/wuwin`。本次包含舊資料固定甜度／冰量在原欄顯示、後台舊限制提示、自由填寫預填和搜尋圖示間距。部署前 17 項測試、typecheck、style:check、format:check、build 通過。實際開啟受保護預覽的「小時候冬瓜茶」：甜度欄唯讀顯示「甜度固定」，冰量仍可選；選少冰後複製預覽為「小時候冬瓜茶｜大杯｜甜度固定｜少冰｜1 杯」，按鈕可用，沒有新增另一組「固定甜度」客製。**此處只驗證這一杯的桌機前台；得正另見下節，後台編輯、手機版或全部 17 杯尚未驗收。** 部署後重查 Vercel 專案：最新 deployment 即 `dpl_7Vg2nZxRkozbg3Mdz3z4su9uxEdR`、`READY`，SSO `enabled=true`／`all_except_custom_domains`，`target=null`。沒有更動正式別名或 Supabase。先前 Preview `dpl_AAV5om7jqBUCEJ8YZ5sWyT7R3iC4` 可作程式回退參考；它仍有本次修正前的顯示問題。下文 11/17「尚未部署」的段落是當時的歷史進度，不代表現在的版本。

**11/17 得正固定冰量回歸**：同一預覽開啟「芝士奶蓋春烏龍」，中杯 16oz／大杯 22oz 保留，原「冰量／溫度」欄唯讀顯示「少冰（店家固定）」，沒有溫熱可選。選微糖（3分甜）後複製預覽為「芝士奶蓋春烏龍｜中杯｜微糖（3分甜）｜少冰｜1 杯」，複製按鈕啟用。只做前台操作與唯讀驗證，沒有修改草稿或發布；其他得正四杯與後台編輯尚待查驗。

**11/17 後台「小時候冬瓜茶」截圖待確認網址**：小潔上傳編輯此杯的截圖，甜度選單仍顯示「沿用店家預設」，與預期「沿用舊版固定說明」不符。唯讀查 Supabase `menu-wuwin` 草稿 revision 38：`wu42` 的 `fixedSugar=甜度固定`、`fixedIce=null`、無 `optionGroups`、`optionOverrides={}`；店家甜度群 `id=sweetness`、`role=sweetness`，選項無「甜度固定」。現行 `optionEditorState` 應回傳 `legacy-fixed`，且最新部署的來源包含該選項；舊提交 `961e7cf` 的 UI 則一律以 `override.mode || inherit` 顯示，與截圖一致。Vercel project 最新仍為 `dpl_7Vg2nZxRkozbg3Mdz3z4su9uxEdR` READY，SSO 開啟。**尚未看到小潔當時網址或登入後最新版後台實際畫面，舊分頁／舊不可變部署網址是推測，未能斷言。**下一步請她從上方最新 `/admin` 連結重開並重新登入，回到無飲這杯；若仍顯示沿用，請帶網址截圖追查。勿在不符預期的編輯器儲存或發布；本輪沒有修改資料或程式，只有這筆文件紀錄。

**11/17 小潔確認新版畫面與單杯規則需求（本機待部署）**：她的第二張「小時候冬瓜茶」截圖已顯示「沿用舊版固定說明」及「甜度固定」，確認當前新版後台有讀到舊值；先前截圖的來源網址仍未確認。她希望以後自行修改或新增固定甜度／冰量、僅中杯、僅熱飲，不必依賴舊資料沿襲。本機編輯器已新增「固定說明（自訂文字）」並直接輸入固定文字，仍顯示在原甜度／冰量欄及複製文字；空白固定說明會在儲存前顯示必填錯誤。冰量區加「只做熱飲」按鈕：沿用店家熱飲選項，若店家未提供則僅為此杯新增；明確套用時會取代該杯既有杯型溫度條件，保留杯型與價格，遇到舊限制會先提示確認。杯型價格區說明只勾中杯即可設為僅中杯，取消其他杯型會移除其價格。舊資料直接修改固定說明時轉為可編輯規則，沒有對 Supabase 寫入或發布。19 項測試、TypeScript、設計 token、格式與 production build 通過；**尚未推送／部署，受保護預覽仍是上述 `dpl_7Vg...`，此新操作尚待實際畫面驗收**。下一步檢查本機 diff，之後收到明確部署指示再推到受保護 Preview；先以隔離測試店驗證儲存、發布與前台複製，不在正式店家直接試寫。

小潔正在檢查新版後台預覽，助手負責保存交接資訊。她暫時不操作 Supabase。**不要把資料庫當成要替換的舊版**：新後台直接讀寫原本的 Supabase 草稿及發布表。正式後台入口尚未切換，新後台預覽仍需 Vercel 登入；網站保持受保護，不要擅自開放或部署。

**11/17 後台真實操作驗收**：小潔在自己的瀏覽器登入受保護預覽，建立隔離店家 `menu-7b2ef0e3-df15-4efa-96cc-34483cf67627`（Copydrink 驗收測試）、分類「測試飲品」、飲料「驗收奶茶」，預覽並發布草稿版本 4（大杯全台 $45）。助手以 Supabase 核對，模擬匿名讀取及受保護前台頁 `/stores/7b2ef0e3-df15-4efa-96cc-34483cf67627` 均看到飲料和價格；選微糖、少冰後複製按鈕啟用。小潔再改 $46、儲存版本 5 並發布；前台快取更新後顯示 $46。她把版本 4 還原為草稿版本 6，資料庫核對草稿 $45、正式版仍 $46；再次發布後前台快取更新為 $45。三次發布紀錄 ID 依序 `71ef6b1a-ceba-4334-b3e5-78199d63a05a`、`304e2b04-a1ed-4e01-93fe-7b9abba46473`、`43db90a8-99f3-4c46-92a7-72b0fec78948`。發布後前台有約一分鐘快取窗口，初次新店開啟曾短暫顯示 404；待快取更新正常。**已在確認前台 $45 後清理此測試店的 1 筆草稿與 3 筆發布，核對該鍵兩表均為 0；全表數量從 16／140／15（草稿／發布／目前正式）回到 15／137／14。** 本輪沒有修改其他店家。此前 `database/test-publications.sql` 交易演練也完成並 `ROLLBACK`。這僅驗收上述流程，不能宣稱整個新版後台已驗收或正式入口已切換。

**11/17 真實草稿唯讀核對及後續修正（尚未部署）**：15 筆草稿中 13 筆與目前正式版來源 revision 相同；烏弄原茶草稿版本 8 比目前正式版 7 新，未替使用者發布；`connection-test-dezheng` 為無正式發布的舊測試草稿，未擅自刪除。龜記「極品紅茶」大杯三區價格，草稿、正式版與小潔的新版後台截圖一致：北 $40／中 $35／南 $35，均有供應。小潔另提供得正「芝士奶蓋春烏龍」編輯截圖，冰量欄顯示「沿用店家預設」，但既有 `optionGroups.temperature.inheritDefault=false` 且僅有「少冰」；此處 UI 讀不到舊版單杯限制。已在本機修正 `ItemOptions`／`model`：顯示「沿用舊版單杯限制」及實際選項，保留舊資料語意；只有明確改選店家預設才移除限制，切換固定／指定選項仍使用原選項。新增相關測試，17 項測試、TypeScript、格式、設計 token、diff check、production build 通過。**此修正尚未推送或部署，目前受保護預覽仍顯示舊 UI；不要讓小潔在該杯儲存。** 部署後以既有得正杯子做唯讀畫面驗證，再處理其他特殊客製與登入驗收。

**11/17 溫熱飲提醒唯讀驗收**：小潔截圖顯示新版後台草稿版本 2、正式版 2，第一筆「一沐日：熱飲僅提供中杯，約 600ml」及第二筆「大茗本位製茶堂」與資料一致。助手在受保護前台點「熱飲注意」，看見 8 筆已發布提醒，包含一沐日 600ml、再睡五分鐘 480ml、得正溫／熱飲加收 5 元。沒有修改提醒資料。尚未測提醒的儲存、發布或還原；接著可驗證管理員重新登入及未儲存提示。

**11/17 重新登入及未儲存提醒**：小潔回報重新整理後正常重新登入，店家列表正常載入；此結果來自她自己的瀏覽器操作，助手未操作其登入畫面。她在龜記既有飲料做未儲存提醒測試：暫改名稱、不儲存／發布，關閉時有確認視窗；取消後仍在編輯器，確認放棄後離開。助手唯讀核對 Supabase 草稿仍為 revision 112、品名「極品紅茶」，沒有測試字樣。這項驗收完成，未修改正式店家資料。接下來須驗收尚未覆蓋的特殊選項、登入防護及新後台其餘操作。

**11/17 必填驗證驗收**：小潔在受保護預覽編輯龜記「青四季春」，清空飲料名稱並按「儲存草稿」；截圖顯示頁首「請修正下方標示的 1 個欄位」錯誤摘要，名稱欄紅框及「請填寫飲料名稱」提示。助手唯讀核對龜記草稿仍為 revision 112，原名「青四季春」仍存在，`updated_at` 未變（2026-11-09 10:22:56 UTC）。此項必填錯誤顯示及未寫入驗收通過；尚待小潔確認離開編輯視窗時放棄這次未儲存的改動。

**11/17 菜單列表搜尋／排序驗收與小修（本地待部署）**：小潔在受保護預覽檢查 UG 菜單，搜尋「烏龍」時 25 杯中顯示 10 杯，並回報排序切換與回原順序正常；截圖只直接呈現搜尋結果及「菜單原有順序」，排序其餘狀態依她的操作回報。助手唯讀核對 UG 草稿仍為 revision 60，`updated_at` 為 2026-11-09 09:47:38 UTC，沒有清單操作寫入。從截圖發現搜尋圖示與第一字重疊：`.admin-input` 的 `padding` 覆蓋 `pl-10`，已用專用 `.admin-search-input` 42px 左內距修正，圖示加 `pointer-events-none`。TypeScript、格式、設計 token、production build、diff check 通過。此小修尚未推送／部署，預覽仍顯示重疊；下一步可測「篩選分類」畫面並避免按批次或上下移。

**11/17 分類篩選**：小潔回報在 UG 菜單將「篩選分類」切換到指定分類、再回「全部分類」的顯示正常；此項來自她的操作回報，沒有新的截圖或資料庫寫入驗證。接著檢查手機版後台列表及飲料編輯視窗的排版／可操作性，不需要對正式店家儲存。

**11/17 手機版後台與預覽保護**：小潔用手機在受保護預覽檢查菜單商品列表和飲料編輯視窗，回報畫面及操作都正常；此結果依她的操作回報，助手未操作其手機。助手回讀 Vercel project `prj_FewA218UKpJkao7G8BWRigxZw66p`：最新部署仍為 `dpl_AAV5om7jqBUCEJ8YZ5sWyT7R3iC4`、READY，`ssoProtection.enabled=true`、`deploymentType=all_except_custom_domains`，正式別名未切換。本次只驗證保護設定，沒有重新做匿名 HTTP 連線測試。前述舊菜單選項與搜尋欄小修仍在本地，尚未推送／部署；下一步部署後才可在預覽站唯讀驗收這些修正。

**11/17 舊資料客製規則唯讀回歸（本地待部署）**：得正草稿 revision 157 的五款芝士奶蓋飲品皆有 `fixedIce=少冰`，專屬溫度群組僅「少冰」，`variants` 只有中杯／大杯的冷飲；本地後台會顯示固定少冰與舊杯型溫度限制。切換到「沿用店家預設」也不會消除 `variants`，已補回歸測試確認冷飲限制仍生效。無飲 WUWIN 共 **17 杯**的 `fixedSugar=甜度固定` 不對應店家甜度選項（全糖／少糖／半糖／微糖／1分糖／無糖），且無單杯群組或固定 override；前台目前不會因這個字串鎖定甜度。當中四款冰沙另有 `allowedToppings=[]` 表示無配料。本地後台新增不匹配固定值提示，提醒人工核對，沒有自行指定甜度或改動資料。17 項測試、TypeScript、格式、設計 token、production build、diff check 通過。此輪唯讀查詢沒有寫入；改動只在本地，線上預覽尚未包含。

**11/17 使用者釐清固定甜度語意與本地修正（待部署）**：小潔指出「甜度固定／固定冰」是該杯自己的特殊固定說明，**本來就不在店家預設甜度／冰量選項內**，不可推成全糖／半糖或讓顧客再選。唯讀核對 WUWIN 17 杯 `fixedSugar=甜度固定`，例如「小時候冬瓜茶」的 `reminder` 同樣寫「僅供冰飲｜甜度固定」，沒有指定哪一種甜度，且 17 杯都沒有單杯群組或固定 override。已將本地前台 `effectiveGroups` 修為：舊固定值若不匹配預設選項，就在**原甜度／冰量欄**產生單一固定說明，不另建立客製群組、不誤選第一個預設比例；設定彈窗顯示該值且無需顧客選擇，複製文字帶入原說明。自填小抄選到飲料時預填該固定說明（仍可自行輸入）。後台顯示「沿用舊版固定說明」及正確提示，不擅自改寫資料庫。原本上一段所述「前台不鎖定」是**線上舊版現況**，不是此本地修正後的預期。17 項測試、TypeScript、格式、設計 token、production build、diff check 通過；沒有推送／部署，使用者手機預覽仍是舊版。

**11/17 正式版唯讀核對**：目前正式發布的無飲 WUWIN `menu-wuwin` 來源草稿 revision 38，確實有 17 杯 `fixedSugar=甜度固定`；得正 `menu-dezheng` 正式來源 revision 157，有 5 杯 `fixedIce`。因此本地固定說明修正會影響實際公開菜單的 WUWIN 17 杯與得正 5 杯，並非只影響未發布草稿。這輪僅查 `is_current=true` 的正式發布紀錄，未改動資料；仍需部署本地變更後做登入預覽的前台實際畫面驗收。

**11/17 舊資料選項相容性補強（本地待部署）**：唯讀掃描真實草稿，舊欄位有 `fixedSugar` 17 筆、`fixedIce` 5 筆、`allowedToppings` 4 筆、`variants` 99 筆、`optionGroups` 173 筆；新 `optionOverrides` 2 筆。得正五款芝士飲料同時有單杯「少冰」選項與 `fixedIce=少冰`，原本只顯示舊版限制仍會漏說「固定」。現已在本地後台把符合實際選項的固定冰量／甜度顯示為「沿用舊版固定選項」及固定值；舊配料白名單顯示為舊版單杯限制；舊杯型溫度 variants 加上保留生效提示。明確切換「沿用店家預設」才清掉對應舊欄位與舊單杯群組，改成自訂配料時清除舊白名單。對不到選項的舊固定字串不強行固定第一個選項。17 項測試、TypeScript、格式、設計 token、production build、diff check 通過；未推送／未部署。預覽仍是上述 `dpl_AAV5om7jqBUCEJ8YZ5sWyT7R3iC4`，其畫面**尚未**包含本節修正；不要在舊預覽儲存上述特殊杯子。

**最新預覽部署（11/17 通用 404）**：本機功能提交 `961e7cf`，tree `929336a63a3229efc6b2b99608566c4dd80ad31b` 同步至 GitHub 預覽分支提交 `c07a6cc316430b6a3346fbda25ed9584f0af632d`。Vercel `dpl_AAV5om7jqBUCEJ8YZ5sWyT7R3iC4` 已 `READY`：`https://copydrink-github-preview-9h9my8pe8-yichiehs-projects-5086e20d.vercel.app/`；後台加 `/admin`。新增全站 `global-not-found`，與店家頁共用品牌 404 畫面，響應式樣式與回首頁入口。Next.js 16.4.6 `experimental.globalNotFound` 配合兩套 root layout，建置列出 `/_not-found`。typecheck、style:check、format:check、build 通過；本機 `next start` 遇執行環境 `uv_interface_addresses` 錯誤，故尚未完成 HTTP／登入後桌機手機畫面驗收。Vercel SSO `enabled=true`／`all_except_custom_domains`，正式站未切換。接著小潔驗收預覽，之後以隔離測試店家走新增、預覽、發布、前台顯示及還原流程。

**最新預覽部署（11/17 字標及種類標籤）**：本機功能提交 `c8a05fb`，tree `393e46ee027994212a4af3dbf3c53b1111ab5572` 同步至 GitHub 預覽分支提交 `0158c7fc9b1198316dfbc9221e01651a7787baf8`。Vercel `dpl_FJ13ZPaFtkq8CF2n3N7uSDbKWimx` 已 `READY`：`https://copydrink-github-preview-mudayrri6-yichiehs-projects-5086e20d.vercel.app/`，後台加 `/admin`。頁首／頁尾共用 `BrandLogo` 換上黑色自訂 `copydrink` 字標，以 SVG 遮色沿用現有品牌色；保留杯子圖；種類篩選新增同色「種類（可複選）」。typecheck、style:check、format:check 和 build 通過。Vercel SSO `enabled=true`、`all_except_custom_domains`，正式站未切換；登入後實際畫面尚待驗收。

**最新預覽部署（11/17 後續）**：小潔要求部署，已把本機 `934b5ea` 的完整 tree `af79d0fdba7f88fe2028ed2e50792ab2261acd75` 同步為 GitHub 預覽分支提交 `9147e9223408025eacae3da88fa4a0096b266638`，Vercel Preview `dpl_5KAQch7WE8RbzUpgGciatsUxnPzc` 已 `READY`：`https://copydrink-github-preview-gcqryxi2q-yichiehs-projects-5086e20d.vercel.app/`；後台路徑加 `/admin`。包含新杯子 Logo、必喝 TOP 排名、店家選項 ID 修正、文件和安全測試檔。Vercel 專案 `ssoProtection.enabled=true`／`all_except_custom_domains`，`target=null`，正式站與正式別名未切換。已核對本機 tree SHA 與上傳 tree 完全一致、部署提交及 READY；尚未在登入後瀏覽器驗收實際畫面。

同日接續：小潔上傳黑色蠟筆毛邊杯子圖，要求替換官網 Logo 並注意上色。Next.js 共用 `BrandLogo` 已改用原圖作杯子，透過 SVG 反向亮度遮色移除白底／臉部深色方框，沿用 `currentColor`（頁首與頁尾品牌藍色）；字標與其他內容不動。新素材 `frontend/public/assets/copydrink-cup-crayon-black.png`，改動 `frontend/src/components/BrandLogo.tsx`。typecheck、style:check、format:check、production build 通過；已包含於上方最新預覽，尚未完成登入後真實瀏覽器畫面驗收。生成式去背嘗試吃掉五官，沒有採用；原圖保留五官較準確。

同日後續：小潔以必喝 TOP 截圖要求前三名獎牌改成實色 icon、拿掉排名膠囊外框，第四名以後灰底深灰字。`frontend/src/components/TopPicks.tsx` 的前三名 `MedalIcon` 改為 `weight="fill"`；`frontend/src/app/styles/store.css` 的排名標籤保留既有柔和金／銀／銅底色，移除描邊，非前三名沿用中性灰底與灰字 token。飲料名稱／列表排版不動，淺色深色 token 共用。typecheck、style:check、format:check、production build 通過；已包含於上方最新預覽。

| 項目 | 現況 |
| --- | --- |
| 本回合工作副本 | `/workspace/scratch/745b259be742/copydrink-mobile`，分支 `feature/admin-workspace-v2`；`origin` 是 Sites 來源倉庫 `git.chatgpt-team.site`，GitHub 專案另為 `yichieh10002/copydrink`。先 `git status --short`、`git log -5 --oneline`，不要假定 scratch 路徑在新環境仍存在。 |
| 交接前功能基線 | `df9179a`：記錄已套用的資料庫修補；前面 `4e566f4` 交易測試、`e94cc7c` 店家選項 ID 修正。這些提交未推送／未重新部署；交接文件提交會再新增一筆 commit。下一次接手先重新核對 HEAD。 |
| 最新可供使用者檢查的新版後台 | `https://copydrink-github-preview-mzpu16va7-yichiehs-projects-5086e20d.vercel.app/admin`；Vercel deployment `dpl_3kJM569jS6ujcvxjmGqMHbgQ9yw9`，`READY`；GitHub 預覽分支 `preview/admin-workspace-v2-20261117`、提交 `040379bc8c6f649f44ca01ada4a643c3ad408e40`，tree 與本機 `9872456` 完全一致。前一個 `kmf57vjvl` 可作回退參考。 |
| Vercel 專案 | Team `yichiehs-projects-5086e20d`／`team_Psh7hzLfJ6JW38xbK1r8IeIK`；project `copydrink-github-preview`／`prj_FewA218UKpJkao7G8BWRigxZw66p`；framework Next.js，root `frontend`，Preview。正式站／別名沒有因新版後台切換。 |
| 回退 | 原靜態後台 `dist/admin.html` 保留；改版前 tag `admin-v1-before-rebuild-20261117` → `fdd97ad`；舊預覽 `dpl_4WXhjZLifuT1PdLoz1WaBSSNeNHf`。程式回退不能回復已發布資料，發布前仍須備份草稿。 |
| Supabase | Project `tea-menu`，ID `rdbcwhuhxahekxhrwekd`；原本 `public.menu_drafts`、`public.menu_publications`、`public.menu_admins`，均啟用 RLS。正式 DB 於 11/17 套用 `sanitize_public_menu_publications_20261117`；SQL 檔 `database/harden-publications.sql`，回滾測試 `database/test-publications.sql`。沒有建立新資料庫。 |
| 資料庫修補及驗收後核對 | 草稿 15、發布紀錄 137、目前正式版 14；sanitizer trigger 1；120 份舊版管理欄位快照存在私有 `tea_private.publication_private_snapshots`；公開品項 `source`／`internalNote` 鍵 0。模擬匿名角色只讀目前 14 份版本，舊版 0。隔離測試店家已清理。 |

### 使用者目前的驗收與待做

1. 小潔正在受保護預覽中自行登入、檢查操作；收到她的畫面、錯誤或意見後，先修對應問題。**沒有收到她驗收完成，不要稱新版已正式可用。**
2. `e94cc7c` 修正店家預設選項增刪、排序時沿原標籤保留 ID，通過 16 項前後台測試／建置／格式檢查；已包含於最新預覽。讓小潔繼續驗收此版本。
3. 新版後台選定一家店後，主內容標題右側有「匯出草稿備份」；會在瀏覽器下載 `<store_key>-draft-<revision>.json`，每次只匯出目前選取店家，不是全資料庫備份，也**沒有匯入／覆蓋按鈕**。驗收時已提醒小潔匯出測試店草稿，但未確認她裝置上的下載結果。必要時規劃安全的全店備份／還原演練，勿把私有快照當完整備份。
4. 隔離店家的新增、儲存、預覽、三次發布、前台顯示、還原草稿及清理已通過；龜記地區價格、溫熱提醒清單唯讀驗收通過，管理員重新登入與未儲存提醒由小潔回報正常，資料庫 revision 未變。得正舊版單杯限制及其他舊選項的後台顯示修正已進入最新受保護預覽，**尚待唯讀畫面驗收**。之後還需驗收其他特殊選項，才決定是否切換正式入口。勿用正式店家測試寫入。
5. 使用者偏好每店保留「目前正式版＋前 5 次發布」，目前**僅記錄決策，未實作清理，也沒刪除舊紀錄**。在發布與還原驗收後才實作與清理。
6. 安全後續：部署／驗證 Next.js 基本安全標頭和有限 CSP（程式已在本機、線上尚未驗證）、登入保護及資料備份；Supabase advisor 仍有 leaked password protection 未啟用。私有封存表 RLS 無 policy 是刻意不授權客戶端角色。詳見 [SECURITY_REVIEW.md](SECURITY_REVIEW.md)。

### 架構、圖片匯入與部署方式

- 新後台 Next.js `/admin` 在 `frontend/src/app/(admin)/admin`，主要功能拆於 `frontend/src/features/admin/`；使用 `frontend/src/features/admin/client.ts` 透過 Supabase REST／Auth 讀寫同一資料庫，JWT 只在頁面記憶體。舊 `dist/admin.html` 未動；前台 `/`、`/stores/[slug]` 不變。
- 新後台「匯出草稿備份」是瀏覽器 `Blob` 產生 JSON 並下載到使用者裝置；店家 Logo 選本地圖片後在瀏覽器處理成 WebP data URL 隨草稿保存，不是上傳到 Supabase Storage。後台畫面與舊版的實際差異、已做功能見 [admin-v2-rebuild.md](admin-v2-rebuild.md)。
- 新後台最新 Preview 是 GitHub 預覽分支建立的獨立受保護部署。舊前台預覽曾使用 Vercel `create_deployment` 來源檔案上傳：掃描 `frontend/`，排除 `.git`、`node_modules`、`.next`、`.env*`、`*.tsbuildinfo`，新素材可由 `upload_file` 傳 SHA1／size，文字檔 inline base64；根目錄仍是 `frontend`。兩種部署途徑不可混成「已推送就等於已部署」，部署後一定查 deployment `READY` 與實際來源。詳細舊流程見下方「Vercel 預覽的精確資訊」。
- 沒有當次明確部署要求就只修改／檢查／記錄，不推送可能自動部署的分支；不切正式別名、不關閉 Vercel Authentication。需要部署時先檢查 `frontend/AGENTS.md`、`npm run build`、`npm run typecheck`、`npm run test`、`npm run style:check`、`npm run format:check`；不要假設建置通過就等於登入、手機版與發布流程驗收通過。
- 不記錄權杖、Cookie、密碼、分享參數或 API 秘鑰。Supabase public publishable key 是前端公開設定，授權仍由 RLS 管；不要把私有管理欄位、完整草稿備份放進公開 Git。

---

## 2026-11-16 舊版前台與部署紀錄（歷史資料，以下「目前／最新」不代表 11/17 現況）

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

## 2026-11-17 資安修補準備（歷史紀錄；資料庫修補已套用）

- 當時新增 `docs/SECURITY_REVIEW.md` 並準備 `database/harden-publications.sql`、`database/test-publications.sql`；資料庫修補及交易測試現已執行，最新結果見該文件末節。`frontend/next.config.ts` 增加基本安全標頭與有限範圍 CSP，尚未部署。
- 正式 DB 唯讀核對資料與 Supabase advisor；資料庫工具的回滾測試確認逾時，沒有修改正式資料或設定。Next production build、TypeScript、設計 token、routes-manifest 標頭及 diff 通過；尚未完成真實 HTTP／DB 交易驗證。Vercel 仍維持 SSO 登入保護，最新部署仍為 dpl_J4BikEXE77PV467HADVwiJaPxkTx。下一步先驗證資料庫交易與保留語意，再按結果套用及部署；不要把本機修補稿描述成已生效。
