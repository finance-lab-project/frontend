# Frontend agent instructions

## Issue-first implementation

- Work only under a human-approved implementation issue brief with a goal,
  scope, and acceptance criteria. A request to implement a specific issue
  approves that brief; ask about material ambiguity before implementing it.
- Make the smallest change that satisfies the issue. Preserve existing behavior
  and patterns; avoid unrelated refactoring, dependencies, infrastructure, or
  work on future issues.
- Implementation PRs cover code, tests, and technical evidence. Explain the
  change, relevant tradeoffs, and actual verification for human code review.
- Human code review and approval are required before merge or deployment. An
  implementation request does not authorize either action.

## Separate learning workflow

- Track learning in separate issues linked to the corresponding implementation
  issues and PRs. Learning issues are owned by the human maintainer and ChatGPT.
- Learning completion is independent of software acceptance and is not a PR
  merge condition.
- Codex must never conduct, assess, or certify that learning, or close learning
  issues. The human maintainer closes them after learning with ChatGPT.

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
