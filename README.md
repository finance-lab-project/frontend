# Finance Lab frontend

Experimental React/TypeScript monthly budget application, built with Vite.
[finance-lab-project/frontend](https://github.com/finance-lab-project/frontend)
is its permanent home; [anton415/finance-lab](https://github.com/anton415/finance-lab)
is the legacy source. The target public URL is
`https://finance-lab-project.com/`. Deployment requires human setup and approval;
see the [GitHub Pages deployment guide](docs/deployment.md).

## Experimental category model — export before upgrading

**Breaking change: export every previous budget in the previous app before
upgrading.** This version starts a new v3 data model with ten starter spending
categories from [#9](https://github.com/finance-lab-project/frontend/issues/9).
Investments remain separate. The previous v2 keys are preserved, but their
budgets are not displayed or automatically migrated. JSON v1/v2 backups are
unsupported here: retain the previous app and its exports for recovery.
Clearing site data can permanently erase both versions. Human review and
explicit approval of this breaking change are required before release.

The app-wide category catalog supports custom IDs and labels through v3 backups;
Settings category-management controls belong to #11. There is no login, backend,
cross-device sync, or server backup. Use synthetic data in examples, fixtures,
screenshots, issues, and pull requests; never commit real financial or personal
data, credentials, or private exports.

Valid edits are saved in browser `localStorage`, scoped to the browser profile
and origin (scheme, host, and port), with separate v3 catalog and monthly keys.
Loading or navigating to an empty month does not write data. Invalid edits stay
in the UI without saving. Storage errors are visible; corrupt data or missing
category amounts block editing and export instead of silently resetting totals.

Use **Settings → Data & Backup** to download the selected month as CSV for
inspection or JSON v3 for a lossless backup. Preview is read-only; restoration
requires confirmation and replaces only the selected backup month. A fresh
profile adopts the backup catalog. An existing catalog must match exactly;
restore a different catalog in a separate browser profile with no v3 budgets.
Keep downloaded backups separately. See the [v3 format and recovery rules](docs/budget-v3.md).

## Local development

Install [Node.js 24 LTS](https://nodejs.org/en/about/previous-releases) and npm,
then clone this repository and enter its directory:

```sh
git clone https://github.com/finance-lab-project/frontend.git
cd frontend
npm ci
npm run dev
```

Open the local URL printed by Vite. No environment variables, accounts, or
backend services are needed.

| Command | Purpose |
| --- | --- |
| `npm ci` | Install exactly the dependencies recorded in `package-lock.json`. |
| `npm run dev` | Start the local Vite development server. |
| `npm run lint` | Check source with Oxlint. |
| `npm test` | Run Vitest tests once, using jsdom for browser APIs. |
| `npm run build` | Type-check with TypeScript, then bundle static assets into `dist/`. |
| `npm run preview` | Serve the built `dist/` locally for inspection; run the build first. |

The development and preview servers are local tools, not public hosting.
GitHub Pages serves only the built `dist/` files; Node.js is used
to build and test the application, not to store users' budgets.

## Project structure

- `src/main.tsx`, `src/App.tsx`, `src/index.css`: browser entry point and budget UI.
- `src/categoryCatalog.ts`, `src/budgetModel.ts`: category definitions, amounts, and totals.
- `src/budgetStorage.ts`: monthly browser persistence.
- `src/budgetBackup*.ts`, `src/budgetRestore.ts`, `src/BudgetBackupPreview.tsx`:
  JSON validation, file preview, and restore.
- `src/budgetExport.ts`, `src/downloadFile.ts`: JSON/CSV export and downloads.
- `src/**/*.test.{ts,tsx}`, `fixtures/`: tests and synthetic backup/export examples.
- `vite.config.ts`, `tsconfig*.json`: build and test configuration.
- `.github/workflows/ci.yml`: verification and manually approved Pages deployment.
- `docs/deployment.md`: hosting setup, release verification, and rollback.

## Contributing and verification

Start with an approved issue brief and follow [AGENTS.md](AGENTS.md). Keep each
change small enough for the maintainer to explain and review. CI independently
installs the lockfile on a fresh Ubuntu runner with Node 24, then runs lint,
tests, and the production build. Pull requests only verify. After a reviewed PR is merged, pushes to `main`
automatically build a Pages release candidate; a human must inspect the artifact
and approve deployment through the protected `github-pages` environment. Manual
`workflow_dispatch` on `main` remains an option for approved redeployment/rollback.
See [the deployment guide](docs/deployment.md) for the release approval gate.
A successful CI run is not proof of security or durable browser storage.

For dependency triage, run `npm audit` and `npm audit --omit=dev` and distinguish
browser runtime exposure from development, build, and test tooling. Record
findings and any remediation issue in the PR; do not apply automatic fixes.

Follow the [separate learning workflow](AGENTS.md#separate-learning-workflow):
learning is tracked in linked issues such as
[#17](https://github.com/finance-lab-project/frontend/issues/17), owned by the
human maintainer and ChatGPT. Learning completion is independent of software
acceptance and is not a PR merge condition. Human code review and approval
remain required before merge or deployment.
