# Phase 05 Legion Growth Validation

Date: 2026-07-23

## Verified Source

- Commit range: `18def5286adf54eba90a3d20ab63cc9fe9bd094e..26f2b4d5c83ad0207654c8e3ad9327cd15b72472`
- Verified source commit: `26f2b4d5c83ad0207654c8e3ad9327cd15b72472`
- Scope: Phase 5 legion experience, recovery, promotion, trade-offs, snapshot composition,
  player-facing evidence, and cross-platform repository gates.

## Commands and Status

| Command                                                                                                                  | Exit | Evidence                                                                                                                            |
| ------------------------------------------------------------------------------------------------------------------------ | ---: | ----------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm.cmd format:check` before the formatting fix                                                                        |    1 | RED: 199 files reported because `core.autocrlf=true` conflicted with Prettier's default line-ending policy.                         |
| `.\node_modules\.bin\prettier.cmd --check . --end-of-line auto` before the formatting fix                                |    1 | RED narrowed to 26 Phase 5 and `.superpowers/sdd` scratch files.                                                                    |
| `pnpm.cmd format:check` after the formatting fix                                                                         |    0 | All matched files use Prettier code style.                                                                                          |
| First `pnpm.cmd check`                                                                                                   |    1 | Knip found the unused exported type `LegionGrowthBattleMetrics`; preceding typecheck, lint, format, and architecture stages passed. |
| `pnpm.cmd deadcode` after keeping the metrics type internal                                                              |    0 | Knip GREEN with no unused files, exports, or dependencies.                                                                          |
| Fresh `pnpm.cmd check`                                                                                                   |    0 | Complete repository gate passed.                                                                                                    |
| `pnpm.cmd test:e2e`                                                                                                      |    0 | Playwright passed 1 of 1 tests.                                                                                                     |
| `.\node_modules\.bin\vitest.cmd run apps/web/src/legion-growth/create-legion-growth-snapshot.test.ts --reporter=verbose` |    0 | Focused deterministic snapshot suite passed 5 of 5 tests.                                                                           |
| Read-only Vite SSR numeric invariant assertion                                                                           |    0 | Printed and asserted the exact class and formation values below.                                                                    |
| `git diff --check 18def52..HEAD`                                                                                         |    0 | No whitespace errors.                                                                                                               |
| `git diff --stat 18def52..HEAD`                                                                                          |    0 | Phase 5 source, tests, approved plan/spec formatting, and gate configuration only.                                                  |
| `git status --short` after restoring generated declarations                                                              |    0 | Empty before this validation document was created.                                                                                  |

## Complete Gate Evidence

- TypeScript production and test projects: passed.
- ESLint: passed.
- Prettier: passed.
- Dependency Cruiser: no violations across 156 modules and 344 dependencies.
- Knip: passed.
- Vitest: 47 test files and 137 tests passed.
- Workspace builds: all nine buildable projects passed, including the Worker API type
  generation and deploy dry-run and the Vite web production build.
- Web build: 778 modules transformed; production assets emitted successfully.
- Playwright: 1 test passed. It asserts one PixiJS canvas, a 2,000-point battlefield, two
  legion promotion cards, both promoted class names, no alert, and no page errors.

Wrangler reported `EPERM` while attempting to write optional debug logs outside the
workspace sandbox. Worker type generation and the deployment dry-run still completed, the
build command exited 0, and the generated `apps/worker-api/worker-configuration.d.ts` change
was restored rather than committed.

## Deterministic Class Trade-offs

The focused snapshot tests and the read-only numeric assertion both use the fixed Phase 5
fixtures.

### Heavy Shield Guard

- Attack: `8 -> 8`.
- Frontal defense: `10 -> 14`.
- Attacking pressure: `603.592 -> 716.7655`.
- Defending pressure: `754.49 -> 1254.339625`.
- One-second movement distance: `1.311 -> 1.11435`.

The infantry promotion therefore raises defensive pressure while reducing movement distance,
as required by the defensive class trade-off.

### Beast Hunter Marksman

- Attack: `9 -> 12`.
- Frontal defense: `6 -> 5.5`.
- Attacking pressure: `549.79171875 -> 928.537125`.
- Defending pressure: `366.5278125 -> 425.579515625`.
- One-second movement distance: `1.9665 -> 2.16315`.

The archer promotion therefore raises attack pressure and movement distance while lowering
frontal defense, as required by the offensive class trade-off.

## Recovery and Formation Invariants

- Infantry: `80 active + 12 wounded`; treatment returns 7 to active duty, then 8 recruits
  replenish the formation to `95 active + 5 wounded = 100`.
- Archers: `75 active + 15 wounded`; treatment returns 10 to active duty, then 10 recruits
  replenish the formation to `95 active + 5 wounded = 100`.
- Both final formation totals equal, and never exceed, their `initialTroopCount` limit of 100.
- Treatment moves troops from wounded to active without creating troops.
- Reinforcement reserves wounded slots and fills only the remaining formation vacancy.

## Deployment Evidence

Deployment was intentionally not performed during this local verification phase. Live
evidence will be appended only after the final whole-branch review and after the reviewed
source commit is deployed.

- Deployment ID: pending.
- Deployment source commit: pending final review.
- Production URL and HTTP evidence: pending.
- Live build label, promoted class cards, canvas count, and console evidence: pending.
