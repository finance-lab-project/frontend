# Configurable-category storage and JSON backup v3

**Export every previous budget in the previous app before upgrading.** This is
an experimental breaking change, requiring explicit human approval before
release. No automatic migration or destructive reset is provided. Old v2
`finance-lab:budget:<year>-<MM>` keys remain untouched. They can be read by the
previous app on the same origin/profile; they are not displayed by this build.
Retain that app and its exports. Clearing site data can erase both versions.

## Catalog and monthly data

The reviewed `categoryCatalog.ts` model is app-wide across months. Its ten starter
IDs (`starter-01` through `starter-10`) and labels come directly from #9.
`categories` array order is display/export order. Labels are trimmed, nonempty
text; duplicate labels are allowed, while active IDs must be unique. `usedIds`
contains every active and retired ID, so deleting a definition cannot reuse its
identity. Investments are separate from spending.

- `finance-lab:v3:catalog` stores `{ categories: [{ id, label }], usedIds: [...] }`.
- `finance-lab:v3:budget:<year>-<MM>` stores `{ income, spending, investments }`.
  `spending` has exactly one own string amount for every active catalog ID.
  Years in storage are numeric (for example `1-01`); backup months use `0001-01`.
- Missing or unknown spending IDs are errors. No amounts are reassigned,
  discarded, or filled with zero when reading saved data. A new unsaved month
  explicitly creates empty strings for every category in the current catalog.
- Amounts retain their exact strings. Empty means unentered; otherwise the
  existing finite nonnegative number rule applies, including exponent notation.
  Invalid draft edits are visible but do not persist or export. Totals include
  all spending IDs exactly once and subtract investments separately.
- Reading/navigating does not initialize storage. The first valid edit or
  confirmed restore writes the catalog and month. If the first month write
  fails, catalog initialization is rolled back. Browser storage has no durable
  multi-key transaction or cross-tab lock; keep downloaded backups.

Corrupt monthly data, an invalid catalog, or a missing catalog when v3 months
exist blocks editing/export and leaves the stored bytes untouched. Restore a
valid matching-catalog backup to explicitly replace a corrupt month. If the
catalog is missing/corrupt, recover the original catalog from a retained v3
backup before loading those months; the app does not guess from starter IDs.
A separate fresh browser profile can restore a backup for recovery/inspection.

## Backup contract

Only numeric `formatVersion: 3` is accepted. Each document contains exactly:

```json
{
  "formatVersion": 3,
  "month": "2027-02",
  "catalog": {
    "categories": [
      { "id": "custom-bike", "label": "Bicycle repairs" }
    ],
    "usedIds": ["retired-example", "custom-bike"]
  },
  "income": "100.00",
  "spending": { "custom-bike": "12.50" },
  "investments": "5"
}
```

This is one month's backup plus the app-wide catalog, not an archive of every
month. Back up each month separately. JSON preserves IDs, labels, display order,
used-ID history, and amount strings. JSON v1/v2 and future versions fail with an
unsupported-version message before current-schema validation. CSV cannot be
restored. Files must be valid UTF-8 JSON, at most 1 MiB; one initial BOM is allowed.
See [synthetic v3 fixtures](../fixtures/budget-backup/v3/manifest.json).

Preview shows the backup's own labels and amounts without writing. On restore:

1. A fresh profile with no v3 catalog/months can adopt the supplied catalog.
2. Otherwise the catalog must match the stored definitions, order, and used-ID
   history. A different catalog is rejected without modifying any month. Import
   it into a separate fresh browser profile instead. Catalog management is #11.
3. The dialog names the target month, including empty amounts, and explicitly
   warns that replacement has no undo. Cancel/Escape preserves all stored data.
4. After confirmation the destination and catalog are rechecked; changes require
   new approval. Only that month's data is replaced. Other months and v2 keys
   remain untouched. A write failure reports failure without resetting the UI.

CSV is an inspection export with quoted `Type,Category ID,Category,Amount`
columns in catalog order, a UTF-8 BOM, and CRLF lines. Custom IDs/labels that could
be spreadsheet formulas receive an apostrophe prefix; JSON remains lossless.

No category-management controls, automatic legacy migration, backend contract,
or changes to separate learning issue #23 are included.
