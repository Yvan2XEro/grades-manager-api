# Code of Conduct

We want the development of this platform to remain inclusive, safe, and aligned with the client’s expectations. This Code of Conduct applies to everyone who contributes to the repository (engineers, reviewers, testers, designers, etc.).

## Principles

1. **Respect** – Discrimination, harassment, and offensive language are not tolerated. Keep discussions professional and constructive.
2. **Transparency** – Share progress, blockers, and risks clearly. Document architectural decisions so onboarding and reviews stay efficient.
3. **Accountability** – Test and self-review your work before requesting feedback. Critical modules (auth, grades, analytics) require dedicated test coverage.
4. **Quality gate** – Run `bun run check` (or at minimum `bun check`) before pushing. Fix all lint and format issues—especially "fixable" findings—so the main branches stay clean and reviewers don't need to comment on mechanical fixes.
5. **Confidentiality** – Never leak personal data or infrastructure secrets in issues, PRs, or logs.
6. **Internationalization** – Every UI surface (apps/web or future clients) must use the i18next stack. Do not merge hard-coded strings, and never rely on default fallbacks: add the corresponding keys to the locale JSON files, regenerate the types with `bun run --filter web i18n:gen`, and verify that `t()` never renders raw keys in the UI.
7. **Timely feedback** – Pull requests should receive a response within one business day. When disagreements arise, rely on facts (tests, benchmarks, direct references to the specs).
8. **Branch discipline** – The `dev` branch is the shared source of truth. Always branch from `dev` and target `dev` in pull requests so the latest changes stay synchronized.

## Reporting

Report any violation to the product leadership team with factual evidence (screenshots, links to commits or comments). Sanctions may range from warnings to removal from the project.

Thank you for helping maintain a healthy environment that meets the institution’s priorities.
