# Batch 03 Validation — Pixi Projection and Greyfang Wolves

Date: 2026-07-23  
Scope: TASK-007 and TASK-008

## Delivered

- A renderer-only visual contract with explicit point shape, state, animation seed,
  and unit ownership.
- Exact proportional allocation of a fixed 2,000-point visual budget.
- Deterministic offsets for dense block, line, column, loose, square, and wedge
  formations.
- Pure visual transitions for active, casualty, and routing points.
- One PixiJS `ParticleContainer` layer using a shared texture atlas.
- A responsive React battlefield projection with WebGL diagnostics.
- Greyfang pack creation, hunting, encirclement, engagement, retreat, routing,
  and idempotent leader-loss morale events in the simulation core.

## Automated Evidence

- `pnpm check`: passed.
  - TypeScript project references and test typecheck: passed.
  - ESLint: passed.
  - Prettier check: passed.
  - Dependency Cruiser: 91 modules and 193 dependencies, no violations.
  - Knip dead-code scan: passed.
  - Vitest: 25 files, 76 tests, all passed.
  - Production builds: all nine buildable workspace projects passed.
- `pnpm test:e2e`: one Playwright WebGL battlefield scenario passed.
- Source scan: no production use of `Math.random`.

Wrangler emitted sandbox-only warnings when it could not write its optional debug
log under the user profile. Type generation and dry-run bundling still completed
with exit code 0; no remote deployment was attempted.

## Browser Evidence

- Desktop projection rendered one canvas, 2,000 points, and WebGL.
- A 390 px viewport rendered the complete battlefield at 364 × 205 px without
  cropping the right-side Greyfang formation.
- Browser console warning/error collection returned an empty list.
- Visual review confirmed that dense and wedge points remain individually
  readable after responsive scaling.

## Boundary Evidence

- `simulation-core` contains Greyfang rules and has no renderer dependency.
- `pixi-renderer` translates read-only visual sources and owns no casualty,
  morale, or combat decisions.
- `apps/web` composes the demo snapshot and presents diagnostics only.
- Architecture fitness rules passed after the new renderer and simulation
  modules were added.
