# Project Expedition Development Rules

## Authority

1. `docs/AI_DEVELOPMENT_SPEC.md`
2. Approved design documents under `docs/superpowers/specs/`
3. Approved implementation plans under `docs/superpowers/plans/`

## Boundaries

- Keep simulation rules in `packages/simulation-core`.
- Keep cross-package stable contracts only in `packages/shared-types`.
- React, PixiJS, Worker routes, HTTP, and AI adapters must not own battle outcomes.
- Import workspace packages through `@expedition/<package>`, never through another package's `src`.
- Prefer feature-local types until a second package needs the contract.
- Only thin composition roots may coordinate multiple feature modules.
- Do not use `Math.random`; inject `RandomSource`.
- Preserve military-order conflicts and generate traceable events for major results.

## Change Standard

- Split by independent testability, single responsibility, and explicit input/output.
- Use AHA; do not create shared abstractions for coincidental similarity.
- Add a failing test before production behavior.
- Run local checks first, then `pnpm check` at batch completion.

## Batch Efficiency

- Define each batch as one player-visible, independently testable outcome.
- Keep design and plan documents under 150 lines each; reference source files instead of copying code.
- During implementation, run only affected tests. Run `pnpm check` once at batch completion and once before deployment only when the source changed afterward.
- Perform one consolidated review per batch, not one review or commit per helper.
- Split files near 150 lines when they contain multiple change reasons; otherwise record why keeping the file whole is clearer.

## Batch Execution Policy

- Default to direct TDD or `executing-plans` for an approved batch.
- Do not use `subagent-driven-development` unless the user explicitly requests per-task agent delegation.
- A helper, file, pure function, or internal layer is not a separate task. Task boundaries must be player-visible outcomes.
- Do not create separate briefs, reports, implementer agents, reviewer agents, or commits for each helper.
- Use affected tests during implementation, then one consolidated batch review after the player-visible outcome works.
- Fix consolidated review findings in the same batch and run one focused follow-up verification. Do not start recursive reviewer cycles unless a critical issue remains unresolved.
- Prefer one implementation commit plus, when necessary, one review-fix commit per batch.
- Avoid broad repository scans, generated bundles, and large external schemas when a targeted file or query can answer the question.

## Commands

- `pnpm dev`
- `pnpm test`
- `pnpm typecheck`
- `pnpm arch:check`
- `pnpm deadcode`
- `pnpm check`
