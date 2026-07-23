# Batch 02 Validation

Date: 2026-07-23

## Completed

- TASK-004 Movement and formations
- TASK-005 Grid projection
- TASK-006 Contact and casualties

## Independent Modules

- Formation profile lookup
- Pure movement-step calculation
- Unit movement adapter
- Grid creation
- Position-to-cell addressing
- Battlefield projection
- Contact-zone detection
- Local pressure calculation
- Bounded casualty calculation
- Unit casualty state transition
- Contact resolution and event emission
- Reusable unit and monster test builders

## Verification

- `pnpm typecheck`: passed; production references and test sources checked.
- `pnpm lint`: passed.
- `pnpm format:check`: passed.
- `pnpm arch:check`: passed; 65 modules and 126 dependencies checked with no violations.
- `pnpm deadcode`: passed with no findings or configuration hints.
- `pnpm test`: passed; 17 test files and 50 tests.
- `pnpm build`: passed; 9 workspace projects built, including Vite production output and a Wrangler dry run.
- `rg -n "Math\\.random" apps packages`: no matches, as expected.

## Acceptance Evidence

- Normal movement advances without overshoot.
- Forced March moves farther and adds more fatigue.
- Heavy equipment and high-cost terrain reduce movement.
- All six MVP formations have focused profiles.
- Default grid contains exactly 16,384 cells.
- Multiple actors can overlap in one cell.
- Projected density conserves active troop count.
- Reprojection moves density without mutating source state or terrain.
- Single-faction cells do not create contact zones.
- Multi-faction contact selection is stable and deterministic.
- Equivalent Dense Blocks produce zero line shift.
- Stronger attackers advance and inflict more losses.
- Flank attacks are more effective than frontal attacks.
- Per-resolution casualties are capped and cannot remove the last troop.
- Casualty category updates preserve force conservation.
- Same seed and inputs produce identical contact resolutions and events.

## Boundary Evidence

- `shared-types` owns serializable contact and projection contracts.
- `simulation-core` owns calculations and state transitions.
- Test builders live in `test-fixtures`; production packages do not import them.
- Formula helpers are private unless another package needs their contract.

## Source Integrity

- `docs/AI_DEVELOPMENT_SPEC.md` SHA-256 remains
  `60A4B87082E4C956B0F232934DE7007D5308B391EB5AC4B142EB178EEA319AEA`.
