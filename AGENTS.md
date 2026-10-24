# Frontend agent instructions

## Learning-first, issue-first work

- Work only under a human-approved issue brief with a goal, scope, and acceptance
  criteria. A request to implement a specific issue approves that brief; ask
  about material ambiguity before implementing it.
- Make the smallest change that satisfies the issue. Preserve existing behavior
  and patterns; avoid unrelated refactoring, dependencies, infrastructure, or
  work on future issues.
- Explain the change, relevant tradeoffs, and actual verification so the human
  maintainer can understand and explain the result. Before merge, record the
  maintainer's learning checkpoint and decision in PR discussion; never claim
  human understanding or approval on their behalf.
- Human approval is required before merge or deployment. An implementation
  request does not authorize either action.

## Public data safeguards

Assume code, issues, PRs, comments, logs, fixtures, screenshots, and artifacts
may be public. Use synthetic examples only. Never introduce real personal,
financial, employer, credential, local filesystem-path, or other sensitive
information, including browser data and private backup/export files.

## Verification and pull requests

- Run checks relevant to the change. The frontend baseline is `npm ci`,
  `npm run lint`, `npm test`, `npm run build`, and `git diff --check`.
- Review each PR against its linked issue and acceptance criteria. Report
  concrete in-scope correctness, regression, security, or data-loss problems;
  do not block on speculative or out-of-scope robustness or architecture.
- Include a concise summary, issue reference, exact tested commit SHA, exact
  commands/checks and observed results, and intentional limitations or follow-ups
  in every PR. Use `Closes #<issue-number>` only when the issue is fully
  implemented; otherwise state the remaining work.
- Report only completed, observed verification. Pending or uninspected GitHub
  checks are not passing checks. Verify PR checks before requesting merge.
  Passing tests do not establish security; report audit findings separately.

## AI commit attribution

For substantial agent contributions, attribute only the agent that performed
the work. Add `AI-Agent`, `AI-Model`, and `AI-Reasoning` commit trailers only when
the corresponding execution metadata is reliably known; omit unknown fields.
Use a `Co-authored-by` trailer only for a verified GitHub-compatible identity:

```text
AI-Agent: Codex
Co-authored-by: Codex <199175422+chatgpt-codex-connector[bot]@users.noreply.github.com>
```

Do not invent identities or attribute discussion-only or minor assistance as
substantial implementation work.
