export { applyCasualtiesToUnit } from './casualties/apply-casualties-to-unit';
export type { CasualtyAllocation } from './casualties/casualty-allocation';
export { calculateCasualties } from './casualties/calculate-casualties';
export type { CalculateCasualtiesInput, CasualtyResult } from './casualties/calculate-casualties';
export { calculateLocalPressure } from './combat/calculate-local-pressure';
export type {
  CalculateLocalPressureInput,
  LocalPressureResult,
} from './combat/calculate-local-pressure';
export type { CombatSideSnapshot } from './combat/combat-side-snapshot';
export { detectContactZones } from './contact/detect-contact-zones';
export type { DetectContactZonesInput } from './contact/detect-contact-zones';
export { resolveContact } from './contact/resolve-contact';
export type { ContactResolution, ResolveContactInput } from './contact/resolve-contact';
export { cellIndexForPosition } from './grid/cell-index-for-position';
export { createGrid } from './grid/create-grid';
export type {
  CreateGridInput,
  TerrainCellContext,
  TerrainCellDefinition,
} from './grid/create-grid';
export { projectBattlefield } from './grid/project-battlefield';
export type { ProjectBattlefieldInput } from './grid/project-battlefield';
export { advanceUnit } from './movement/advance-unit';
export type { AdvanceUnitInput, AdvanceUnitResult } from './movement/advance-unit';
export { calculateMovementStep } from './movement/calculate-movement-step';
export type { CalculateMovementStepInput, MovementStep } from './movement/calculate-movement-step';
export { getFormationProfile } from './movement/formation-profile';
export type { FormationProfile } from './movement/formation-profile';
export type { MovementMode } from './movement/movement-mode';
export type { RandomSource } from './rng/random-source';
export { createSeededRandom, SeededRandom } from './rng/seeded-random';
export { assertBattleState, findBattleStateViolations } from './state/assert-battle-state';
export type { BattleStateViolation, BattleStateViolationCode } from './state/assert-battle-state';
export type { CreateBattleStateInput } from './state/battle-state-input';
export { createBattleState } from './state/create-battle-state';
