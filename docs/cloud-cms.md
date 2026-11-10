# Cloud menu workspace — 2026-10-30

`/admin.html` is the authenticated Supabase menu workspace. `/admin-local.html` keeps the previous browser-local prototype, and `/cloud.html` keeps the first connection test.

## Draft and publication flow

- Every store has an independent `menu_drafts` row. Saving a draft never changes the public site.
- **發布此店** calls the transactional `publish_menu_draft` RPC with the draft revision last read by the editor. A revision mismatch stops publication and asks the administrator to reload.
- `menu_publications` stores immutable document snapshots. A partial unique index permits exactly one current version per store; publication retires the previous current row and inserts the next snapshot in one transaction.
- The workspace lists publication history. **還原成目前草稿** copies a historical snapshot into a new draft revision; it does not alter the public version until the administrator previews and publishes again.
- The public site anonymously reads only current publications and only the columns needed to render menus. RLS hides history from anonymous users. Author IDs and historical rows remain administrator-only.
- A store without a publication continues to use the built-in verified test dataset. Once that store is published, its cloud snapshot replaces only that store in the browser.

## Public rendering

- Published schema v2 documents replace the matching store without requiring a Site deployment.
- Enabled regions become a public multi-select filter. All is the default; card prices show explicit labels such as `$35（北部）・$40（南部）`.
- Zero price remains `$0`; null price displays `價格未提供`; unavailable region/cup combinations are omitted.
- The copy dialog includes the selected region and uses that region's reference price. Product and store reminders remain advisory text and do not disable sugar/ice choices.
- Published item/activity status controls visibility. Disabled regions and inactive activities do not reach the public renderer.
- If the public Data API is temporarily unavailable, the page loads the built-in menu instead of becoming blank.

## Data and access

- Schema v2: `{schemaVersion:2,scope:'menu-cms',brand,activities,regions,items}`. Each cup owns a complete regional price map `{price:number|null,available:boolean}`.
- Original source images did not identify geography, so seeded drafts use `提供圖片（地區未標示）`; no regional claims are invented.
- Admin Auth tokens stay in page memory. Drafts and full publication history require the active `menu_admins` allowlist.
- RPC functions are `SECURITY INVOKER`, executable by `authenticated` only, and still pass through grants and RLS. Anonymous callers cannot publish or restore.

## Verification

- `database/test-publications.sql` verifies two releases leave exactly one current version, anonymous readers see only the current row, and restoring history creates a newer draft. The transaction rolls back.
- `tests/published-data.cjs` verifies store replacement, active items/activities, enabled regions, and zero/null prices.
- `tests/cloud-client.cjs` verifies publication/history/restore requests and stale-revision conflicts.
- `tests/cms-flow.cjs` verifies the publish confirmation and current-version state in the workspace.
- Managed browser QA verified the publish confirmation/history UI and public regional card, filter, and copy text.
- Security advisor has no new database warnings. The existing project-level leaked-password-protection warning remains: https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection

## Shared store pages and categories

All selected stores use the shared full-menu and compact store overview. Category names, tags and order are managed in the 菜單分類 tab with stable IDs. Existing schema-v2 documents are upgraded in memory and persisted only on explicit draft save. See [shared-menu-architecture.md](shared-menu-architecture.md).
