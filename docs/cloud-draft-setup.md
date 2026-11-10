# Supabase cloud draft milestone — 2026-10-29

## What is live

Project `tea-menu` (`rdbcwhuhxahekxhrwekd`, ap-northeast-2). New `/cloud.html` uses Supabase Auth + Data API directly. No server credentials or secret keys are used in the browser. `cloud-config.js` contains only the project URL and the modern publishable key. Browser requests do not depend on the ChatGPT connector.

This page is a first vertical slice, not the completed menu CMS: administrator signs in with the user-created email/password, edits one example drink, saves into cloud drafts, reloads the saved row. The separate `connection-test-dezheng` store key keeps this test separate from production menu import. The default price is null, with no regional or current-price assumptions.

Existing `/admin.html` remains the local prototype; existing public menu files remain unchanged. That page now links to the cloud test. No cloud publishing, regional price UI, or public read endpoint is implemented yet. Do not imply ordinary menu edits already reach Supabase.

## Database changes

Remote migrations applied through Supabase `apply_migration`:

- `initialize_private_menu_drafts`: `menu_admins` (Auth user UUID allowlist, active flag) and `menu_drafts` (store key, JSON document, revision, updated timestamp), RLS enabled, anonymous grants revoked, authenticated membership SELECT restricted to self. Only active allowlisted administrators can SELECT/INSERT/UPDATE drafts. No DELETE grant, no client INSERT/UPDATE grant on membership. UPDATE column grants allow only document changes.
- `restrict_auto_rls_event_trigger_execution`: revoke public/anon/authenticated EXECUTE on Supabase's bootstrap-generated SECURITY DEFINER `public.rls_auto_enable()` event-trigger function, as flagged by advisors. This does not disable the DDL event trigger.

SQL source is retained under `database/` as bootstrap/reference scripts, not fabricated Supabase CLI migration filenames. Remote migration history is authoritative. Only the single confirmed, user-created Auth account was separately enrolled using its verified email lookup; no Auth credential was read or changed. Auth user deletion cascades its allowlist membership; deactivating/removing membership immediately blocks subsequent draft API requests.

Draft JSON currently validates object shape, brand name, items array, and maximum 1MB serialized size. It is deliberately not the final normalized regional-price schema. Full per-item schema/business validation is still needed before production import/publish.

## Session / conflict behavior

Access token exists only in page memory; no local/session storage and no refresh flow. Password input is cleared on submit, never logged or saved. Reload requires signing in again. Failed/expired sessions do not grant data access; unsaved text is kept on in-page expiry. Logout clears in-page session and sends Auth local-session logout. No registration UI.

Draft PATCH filters by store key and loaded revision. Database trigger increments revision and stamps server time. An empty update result or duplicate insert reports a conflict rather than claiming success. Lost/timeout responses are reported as unconfirmed; reload is required to know whether the write committed.

## Checks performed

- `database/test-cloud-access.sql`: actual database transaction under authenticated admin / other authenticated / anon roles. Verified administrator insert/select/update, revision increment, stale revision write rejection, no unauthenticated access, no nonadministrator access, no self-promotion. Entire probe transaction rolled back; no probe data persists.
- `tests/cloud-client.cjs`: mock HTTP contract checks for auth, membership, token use, expiry, invalid credentials, network failure, create/update conflict, zero/null handling, and no browser token persistence.
- Prior menu, search, copying, dialogs, and admin model/flow checks passed.
- Actual anonymous REST read denied; preflight tested for hosted origin.
- Managed browser preview visually checked the signed-out page. Actual user-password login and browser save/reload are intentionally left to user acceptance testing; no password was requested or substituted. Phone layout not device-tested.
- Security advisors: bootstrap function privilege warnings resolved; remaining existing warning is leaked password protection disabled. See https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection . Performance advisors returned no findings.

## Next

1. User logs into `/cloud.html`, saves and reloads the test draft (including after a page reload/relogin).
2. In Supabase Auth Sign In / Providers, disable public signup (not configurable by available connector tools; allowlist already protects menu data). Check email provider settings. Signup being disabled must be verified before claiming this is complete.
3. Implement shared final data model, including regional menu versions and common frontend rendering; integrate existing CMS with authenticated cloud persistence.
4. Add private version history, atomic per-store publish and a separate sanitized public read model (exclude sources/internal notes), then connect public menu loading/cache.

The Site audience was preserved, including its existing external viewer. Supabase administrative access is a separate allowlist; a Site viewer is not automatically a menu administrator.
