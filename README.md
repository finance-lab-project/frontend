# Finance Lab frontend

Experimental React/TypeScript monthly budget application, built with Vite.
[finance-lab-project/frontend](https://github.com/finance-lab-project/frontend)
is its permanent home; [anton415/finance-lab](https://github.com/anton415/finance-lab)
is the legacy source. The planned future domain is `finance-lab-project.com`;
this repository does not configure or deploy it.

## Current v0.1 scope and limitations

The application supports income, 15 fixed spending categories, investments,
calculated totals, and separate budgets for each month. Categories are not
customizable. There is no login, backend integration, cross-device sync, or
server backup. This is an experimental learning project preparing for v0.1.0,
not a released financial service. Use synthetic data in examples, fixtures,
screenshots, issues, and pull requests; never commit real financial or personal
data, credentials, or private exports.

Valid edits are saved in browser `localStorage`, scoped to the browser profile
and origin (scheme, host, and port), with a separate key for each month. Another
browser, device, or origin has different storage. Clearing site data can erase
budgets; blocked or full storage can prevent saving. Incomplete or invalid
amount edits remain in the UI and are not saved. There is no server copy to
recover from.

Use **Export and backup** to download the selected month as CSV for inspection
or JSON v2 for a lossless backup. Only JSON v2 can be previewed and restored;
CSV and historical JSON v1 are not restore formats. Keep downloaded backups
separately from browser storage. Restoring a month can replace its existing data
and requires confirmation in the UI.

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
A future static host would serve only the built `dist/` files; Node.js is used
to build and test the application, not to store users' budgets.

## Project structure

- `src/main.tsx`, `src/App.tsx`, `src/index.css`: browser entry point and budget UI.
- `src/budgetModel.ts`, `src/learning/budgetTotals.ts`: categories, amounts, and totals.
- `src/budgetStorage.ts`: monthly browser persistence.
- `src/budgetBackup*.ts`, `src/budgetRestore.ts`, `src/BudgetBackupPreview.tsx`:
  JSON validation, file preview, and restore.
- `src/budgetExport.ts`, `src/downloadFile.ts`: JSON/CSV export and downloads.
- `src/**/*.test.{ts,tsx}`, `fixtures/`: tests and synthetic backup/export examples.
- `vite.config.ts`, `tsconfig*.json`: build and test configuration.
- `.github/workflows/ci.yml`: verification on pull requests and pushes to `main`.

## Contributing and verification

Start with an approved issue brief and follow [AGENTS.md](AGENTS.md). Keep each
change small enough for the maintainer to explain and review. CI independently
installs the lockfile on a fresh Ubuntu runner with Node 24, then runs lint,
tests, and the production build. It does not release or deploy the application.
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
