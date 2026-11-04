# Issue #10 verification

Local production build checked on 2026-11-04 in isolated Chromium profiles,
using synthetic data only. This is not deployment evidence.

## Automated checks

- `npm ci`: clean lockfile installation (113 packages; npm reported zero vulnerabilities).
- `npm run lint`: passed.
- `npm test`: 701 tests passed across 12 files.
- `npm run build`: TypeScript and Vite production build passed.
- `git diff --check`: passed. The CSV fixture intentionally uses CRLF; its
  targeted `.gitattributes` rule preserves those bytes and permits CR at EOL.

Tests cover starter/custom catalogs, category identity and order, used-ID
history, exact amount strings, totals, monthly isolation, malformed/missing
amounts and catalogs, v1/v2/future backup rejection, CSV quoting/formula handling,
round trips, explicit destructive replacement, stale approvals, and write failure.

## Browser observations

Served with `npm run preview -- --host 127.0.0.1 --port 4173 --strictPort` and
checked through Playwright CLI in two fresh profiles. Inspected screenshots at
1280 × 960 and 320 × 800; no page-level horizontal overflow at 320 px.

| Check | Observed result |
| --- | --- |
| Fresh budget | Ten reviewed spending categories in order; income and investments separate; upgrade warning visible. |
| November sample | Income 5000, Groceries 1200, investments 800 → remaining 3000. |
| December sample | Income 6000, Groceries 1500, investments 900 → remaining 3600; November unchanged after navigating back/reloading. |
| Invalid edit | `1e` showed an error; last valid stored amount remained unchanged. |
| Storage isolation | Synthetic legacy v2 bytes remained unchanged through editing, export, restore, and reload. |
| Downloads | Actual JSON/CSV files downloaded with the selected month in their filenames. Inspected JSON catalog/amounts and CSV IDs/labels/order, BOM and CRLF. |
| Unsupported backups | Both v1 and v2 fixtures showed “Only JSON v3”; restore disabled; stored data unchanged. |
| Catalog conflict | Custom backup previewed its own labels, then restore refused a different existing app-wide catalog without writes. |
| Native confirmation | Cancel initially focused; native modal verified; Escape and keyboard Cancel changed no data and returned focus to Restore. Tab/Enter activated explicit replacement. |
| JSON round trip | Changed income to 999, restored the downloaded 5000 backup, reloaded, and re-exported. Downloaded JSON compared byte-for-byte equal; other-month and v2 storage unchanged. |
| Custom profile | Fresh profile restored `valid/custom.json`; income 100, custom spending 19.5, investments 5 → remaining 75.5. Custom catalog appeared in new months and survived reload. Downloaded JSON equaled the fixture; CSV preserved the quoted label and stable IDs. |
| Corrupt storage | A synthetic orphan amount blocked editing/export after reload; all stored bytes remained unchanged. |

No application runtime errors were observed. Initial page loads requested an
unprovided `favicon.ico` and returned 404; the final console inspection reported
zero errors/warnings. No favicon change is included.

Screenshots: [desktop defaults](default-desktop.png), [320 px defaults](default-mobile.png),
[320 px restore confirmation](restore-mobile.png), [320 px custom catalog](custom-mobile.png).

## Intentional limits and approval

No automatic migration; old backups require the previous app. A monthly backup
with a different catalog must be restored in a separate fresh profile. Missing
or corrupt shared catalogs require recovery, not an automatic reset. Browser
storage remains local, non-transactional across keys, and without a cross-tab lock.

Category-management controls remain in #11. Learning #23 is separate and untouched.
Human review and explicit approval of the breaking change are required before
merge/release. No merge or deployment was performed.
