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

## Commands

- `pnpm dev`
- `pnpm test`
- `pnpm typecheck`
- `pnpm arch:check`
- `pnpm deadcode`
- `pnpm check`
