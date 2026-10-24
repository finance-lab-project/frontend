# Static frontend deployment

Target: **https://finance-lab-project.com/**, from
[`finance-lab-project/frontend`](https://github.com/finance-lab-project/frontend).
This guide prepares [issue #4](https://github.com/finance-lab-project/frontend/issues/4);
it is not evidence that the site is deployed.

## Architecture and limitations

GitHub Actions installs the lockfile, checks the application, and builds Vite's
`dist/`. GitHub Pages hosts those static HTML, JavaScript, and CSS files. React
runs in the browser; budget edits stay in `localStorage` and are never submitted
to a backend. The Vite base is `/` for the custom domain root. This build is not
intended for a repository subpath on `github.io`.

**Experimental use only.** Use synthetic data for release verification. Storage
belongs to one browser profile and origin, can be cleared or unavailable, and
provides no automatic backups, synchronization, or authentication. Budgets on a
previous domain or localhost do not appear on the new domain. The existing JSON
v2 download/restore feature is a manual backup option; keep backups separately.
Hosting requests reveal ordinary web request metadata to the host, but contain
no budget fields. There are no backend services or paid infrastructure here.

## Human setup before the first release

Issue #4 reserves **DNS, organization-domain verification, Pages settings, and
public exposure for explicit human approval and execution**. Codex must not
perform these changes. Never paste credentials or private browser data into
issues, logs, screenshots, or artifacts.

1. Review and approve the implementation PR, then merge it through the normal
   human review process.
2. In repository **Settings → Environments**, create `github-pages`. Add a human
   maintainer as a **required reviewer**, disable administrator bypass, and
   restrict **Selected branches and tags** to the **branch** `main` only (no tag
   rules). A solo maintainer may leave prevention of self-review disabled.
   Configure this before dispatch: an automatically created environment has no
   approval rules. See [GitHub's environment instructions](https://docs.github.com/en/actions/how-tos/deploy/configure-and-manage-deployments/manage-environments).
3. In organization **Settings → Pages**, verify ownership of
   `finance-lab-project.com` using the exact TXT name/value GitHub supplies. Keep
   the verification record after success. Follow the
   [domain verification instructions](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/verifying-your-custom-domain-for-github-pages).
4. In repository **Settings → Pages**, select **GitHub Actions** as the build and
   deployment source and save custom domain `finance-lab-project.com` **before**
   pointing DNS at Pages. Custom Actions deployments do not require a `CNAME`
   file; the repository setting owns the domain.
5. At the DNS provider, replace the apex's existing hosting records with the
   GitHub Pages `A` records below. Recheck the current
   [GitHub domain instructions](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site)
   before changing DNS. Remove conflicting apex records only; preserve unrelated
   mail and verification records. IPv6 is optional; remove stale apex `AAAA`
   records or use GitHub's documented IPv6 values. Do not add wildcard records.

   ```text
   @  A  185.199.108.153
   @  A  185.199.109.153
   @  A  185.199.110.153
   @  A  185.199.111.153
   ```

6. Follow the release procedure below. Wait for Pages' DNS check and certificate
   provisioning, then enable **Enforce HTTPS**. DNS/certificate provisioning may
   take up to 24 hours. Do not mark public verification complete until a browser
   successfully loads the custom domain with a valid certificate.

## Release and artifact approval

The existing **CI** workflow handles verification and Pages in one pipeline;
there is no second CI build. Pull requests and `main` pushes run checks only.
Only **Run workflow → main** (`workflow_dispatch`) in this organization repository
can upload a Pages artifact or enter the deployment job. Deployment requires
successful verification and approval of the protected `github-pages` environment.
The build has `contents: read`; only deployment has `pages: write` and
`id-token: write`. No personal tokens or deployment secrets are needed. This
follows [GitHub's custom workflow model](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).

1. Before releasing, open the repository's **Deployments → github-pages** history
   and record the last successful deployment's full source SHA and Actions run
   URL. For the first release, record that no previous deployment exists.
2. A human opens **Actions → CI → Run workflow**, selects `main`, and runs it.
3. Wait for `verify` to pass. Check its full source SHA against the reviewed
   change and inspect the run's `github-pages` artifact before approval. It is
   retained for seven days. Download and extract the artifact ZIP and its
   `artifact.tar`; expect `index.html` and built assets, without source secrets
   or local data. Serve the extracted directory with a local static server when
   checking it in a browser; opening HTML as a file does not test root asset URLs.
4. Review the waiting `deploy` job and approve the environment only for that
   artifact/run. Deployment consumes the artifact from the same run without a
   rebuild. Let one release finish before approving another; cancel obsolete
   waiting runs so an older candidate cannot overwrite the chosen release.
5. Read the completed deployment logs and summary. Record the **full deployed
   source SHA**, **Actions run URL**, **deployment URL**, and the browser results
   below in the implementation PR or issue. A green build alone is not deployment
   evidence. The deployment summary records its SHA and returned Pages URL.

## Verify the actual public release

Use a fresh browser profile with synthetic data and inspect the **public URL**,
not just `npm run preview`. Keep a local check clearly labeled as local evidence.

```sh
dig finance-lab-project.com A +noall +answer
dig finance-lab-project.com AAAA +noall +answer
curl -I https://finance-lab-project.com/
curl -I http://finance-lab-project.com/
```

Confirm the `A` answers match GitHub Pages; any `AAAA` answers must also point to
Pages. HTTPS must succeed without bypassing certificate validation, and HTTP
must redirect to HTTPS after enforcement. Check Pages settings for an active
certificate and record the DNS results and UTC verification time.

In browser DevTools, preserve the Network log across reloads:

1. Open `https://finance-lab-project.com/`. Confirm the budget UI is styled, JS
   and CSS load successfully under `/assets/`, the console has no application
   errors, and the browser reports a valid HTTPS connection.
2. Note the displayed month. Enter income **5000**, Groceries spending **1200**, and
   investments **800**. With other amounts empty, summary totals must be income
   **5000**, spending **1200**, investments **800**, remaining **3000**.
3. Go to the next month: it must start empty. Enter income **6000**, Groceries **1500**,
   and investments **900**; remaining must be **3600**. Navigate back and confirm
   the first month's values and **3000** remaining are unchanged.
4. Reload `/` and confirm the first month's data persists (start this test in the
   current month, which the app selects on startup). Navigate forward and confirm
   the second month's data persists too. Month navigation is in-page state;
   there are no nested URL routes or deep-link fallback requirements.
5. Inspect Network during edits and navigation: there must be no budget submission
   via Fetch/XHR, WebSocket, beacon, or form requests. Reloads should fetch only
   static resources. Confirm the monthly records in Application → Local Storage
   contain only the synthetic values used for this test.

Evidence checklist (fill with observed results; do not pre-mark as passed):

- Previous successful SHA and run URL (or first release).
- New full deployed source SHA, run URL, and deployment URL.
- UTC time, DNS answers, HTTPS/certificate and HTTP redirect results.
- Public JS/CSS loading, navigation, totals, month isolation, reload persistence.
- Network inspection showing no budget submission; any remaining failures.

## Roll back a failed release

Use the prior successful SHA/run recorded above or find it in
**Deployments → github-pages** and its linked successful Actions run. Do not infer
the deployed version from the latest `main` commit or a successful build alone.

Cancel obsolete waiting releases. Prepare a small revert PR that restores the
last working static application/configuration on `main`, retaining this manual
approval workflow. Review the diff against the prior deployed SHA, run CI, and
obtain human approval to merge. Then dispatch **CI** on `main`, inspect its new
artifact, approve deployment, and repeat the public smoke test. Record the new
rollback commit SHA and the prior known-good SHA; they are different commits.
This procedure still works after old artifacts expire and does not require a
force push, a different deployment branch, or DNS changes.

A static release does not clear or rewrite browser budgets. Keep the same HTTPS
origin and preserve the existing storage keys and format in the rollback diff;
do not clear site data or import/restore a backup as a deployment step. Test
that previously saved synthetic months survive reload after rollback. If a
future change alters storage compatibility, review that separately before
rolling back. If the first deployment fails, there is no prior release: fix
forward through a reviewed PR and the same approval procedure.
