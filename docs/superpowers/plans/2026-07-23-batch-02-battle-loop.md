# Batch 02 Battle Loop Implementation Plan

> Scope: TASK-004 movement and formations, TASK-005 grid projection, and TASK-006
> contact/casualties. Pixi rendering, loot, inventory, progression, AI parsing, and
> persistence remain out of scope.

## Goal

Produce a deterministic, framework-free battle-loop core in which every rule has:

- one focused input contract;
- one explicit output contract;
- no hidden global state;
- no direct UI, Pixi, HTTP, or Worker dependency;
- an independent red/green test;
- a public export only when another package needs the behavior.

## Dependency Direction

```text
shared-types
      ↑
simulation-core
```

`shared-types` owns serializable data contracts. `simulation-core` owns pure
calculations and state transitions. No renderer or app code participates in this batch.

## Task 1: Extend stable projection and contact contracts

**Create**

- `packages/shared-types/src/contact/contact-type.ts`
- `packages/shared-types/src/contact/contact-zone.ts`

**Modify**

- `packages/shared-types/src/grid/grid-state.ts`
- `packages/shared-types/src/index.ts`

**Contracts**

Add these dynamic fields to `GridCellState`:

```ts
readonly factionDensity: Readonly<Record<string, number>>;
readonly factionPressure: Readonly<Record<string, number>>;
readonly factionMorale: Readonly<Record<string, number>>;
readonly factionCohesion: Readonly<Record<string, number>>;
readonly factionFlow: Readonly<Record<string, Vec2>>;
```

Add:

```ts
type ContactType = 'FRONTAL' | 'FLANK' | 'REAR' | 'RANGED' | 'CHARGE' | 'ENCIRCLEMENT';

interface ContactZone {
  readonly id: string;
  readonly cellIndices: readonly number[];
  readonly attackingFactionId: string;
  readonly defendingFactionId: string;
  readonly attackingUnitIds: readonly string[];
  readonly defendingUnitIds: readonly string[];
  readonly contactNormal: Vec2;
  readonly width: number;
  readonly attackingPressure: number;
  readonly defendingPressure: number;
  readonly contactType: ContactType;
}
```

**TDD**

1. Extend `battle-state.test.ts` with a populated grid cell and a `ContactZone` usage.
2. Run `pnpm test` and `pnpm typecheck`; verify contract compilation fails.
3. Add the focused contract files and public exports.
4. Run `pnpm typecheck` and `pnpm test`; verify green.

## Task 2: Implement formation profiles

**Create**

- `packages/simulation-core/src/movement/formation-profile.ts`
- `packages/simulation-core/src/movement/formation-profile.test.ts`

**Input**

- `FormationType`.

**Output**

```ts
interface FormationProfile {
  readonly speedMultiplier: number;
  readonly frontageMultiplier: number;
  readonly depthMultiplier: number;
  readonly fatigueMultiplier: number;
}
```

Profiles are immutable lookup data. Dense Block is slower and deeper than Line;
Column is the fastest marching formation; Square is the slowest.

**TDD**

1. Test all six formations are defined.
2. Test Dense Block is slower and deeper than Line.
3. Test Column is faster than Dense Block.
4. Implement only the lookup and unknown-value exhaustiveness guard.

## Task 3: Implement a pure movement step

**Create**

- `packages/simulation-core/src/movement/movement-mode.ts`
- `packages/simulation-core/src/movement/calculate-movement-step.ts`
- `packages/simulation-core/src/movement/calculate-movement-step.test.ts`
- `packages/simulation-core/src/movement/advance-unit.ts`
- `packages/simulation-core/src/movement/advance-unit.test.ts`

**Input**

```ts
interface CalculateMovementStepInput {
  readonly position: Vec2;
  readonly target: Vec2;
  readonly mobility: number;
  readonly fatigue: number;
  readonly formation: FormationType;
  readonly equipmentWeight: number;
  readonly carryingCapacity: number;
  readonly terrainMovementCost: number;
  readonly deltaSeconds: number;
  readonly mode: 'NORMAL' | 'FORCED_MARCH';
}
```

**Output**

```ts
interface MovementStep {
  readonly position: Vec2;
  readonly distanceMoved: number;
  readonly fatigue: number;
  readonly fatigueDelta: number;
  readonly arrived: boolean;
}
```

**Formula**

```text
speed =
mobility
× formation speed multiplier
× fatigue multiplier
× encumbrance multiplier
× march-mode multiplier
÷ terrain movement cost
```

- fatigue multiplier is bounded from `0.5` to `1`;
- encumbrance multiplier is bounded from `0.35` to `1`;
- Forced March speed multiplier is `1.4`;
- Forced March fatigue multiplier is `2`;
- output position cannot overshoot the target;
- fatigue is bounded from `0` to `1`;
- invalid negative/non-finite inputs throw before calculation.

`advanceUnit` is a thin adapter that consumes a `UnitState`, delegates to the
calculator, and returns a new `UnitState`. It must not mutate the source object.

**Acceptance tests**

- normal movement advances toward the target without overshoot;
- Forced March travels farther and gains more fatigue;
- heavy equipment travels less than light equipment;
- higher terrain cost slows movement;
- arrival removes the active target and returns execution state to `IDLE`;
- source `UnitState` remains unchanged.

## Task 4: Create and address the battle grid

**Create**

- `packages/simulation-core/src/grid/create-grid.ts`
- `packages/simulation-core/src/grid/create-grid.test.ts`
- `packages/simulation-core/src/grid/cell-index-for-position.ts`
- `packages/simulation-core/src/grid/cell-index-for-position.test.ts`

**Input/Output**

- `createGrid(input?): GridState`
- `cellIndexForPosition(position, width, height): number`

The default grid is exactly `128 × 128`. A caller may provide smaller positive
integer dimensions and a terrain callback for focused tests. Cell addressing uses
floor-and-clamp so out-of-bounds actors remain represented instead of disappearing.

**Acceptance tests**

- default grid has 16,384 cells;
- all dynamic records and actor ID arrays start empty;
- terrain callback controls terrain and movement cost;
- negative and oversized positions map to the nearest boundary cell;
- invalid dimensions throw.

## Task 5: Project actors into grid cells

**Create**

- `packages/simulation-core/src/grid/project-battlefield.ts`
- `packages/simulation-core/src/grid/project-battlefield.test.ts`

**Input**

```ts
interface ProjectBattlefieldInput {
  readonly grid: GridState;
  readonly units: readonly UnitState[];
  readonly monsterGroups: readonly MonsterGroupState[];
}
```

**Output**

- a new `GridState`; terrain/static cell data is preserved;
- dynamic density, morale, cohesion, flow, and actor IDs are rebuilt from input.

**Rules**

- unit and monster troop counts both contribute to `factionDensity`;
- multiple actors may occupy the same cell;
- morale, cohesion, and flow use troop-count weighted averages;
- projection never mutates the input grid or actors;
- the sum of all faction densities equals total active troop count;
- zero-troop actors contribute no density.

**Acceptance tests**

- movement between projections moves density to the new cell;
- overlapping friendly and hostile actors remain separately addressable;
- multi-actor overlap adds density instead of replacing it;
- total density conserves troop count exactly;
- terrain movement cost survives reprojection.

## Task 6: Detect deterministic contact zones

**Create**

- `packages/simulation-core/src/contact/detect-contact-zones.ts`
- `packages/simulation-core/src/contact/detect-contact-zones.test.ts`

**Input**

- a projected `GridState`;
- current units and monster groups for actor-to-faction mapping.

**Output**

- one deterministic MVP `ContactZone` per cell containing at least two factions.

The two factions with greatest local density participate. Ties are resolved by faction
ID. Actor IDs are assigned to the matching side. Initial pressures are zero and initial
contact type is `FRONTAL`; later tactical classifiers may replace this without changing
the detection contract.

**Acceptance tests**

- a single-faction cell produces no contact;
- an overlapping player unit and monster group produces one contact;
- repeated calls produce byte-equivalent zones and stable IDs;
- non-participating third-faction actors are excluded from the two primary sides.

## Task 7: Calculate local pressure

**Create**

- `packages/simulation-core/src/combat/combat-side-snapshot.ts`
- `packages/simulation-core/src/combat/formation-combat-modifier.ts`
- `packages/simulation-core/src/combat/calculate-local-pressure.ts`
- `packages/simulation-core/src/combat/calculate-local-pressure.test.ts`

**Input**

- a `ContactZone`;
- attacker and defender `CombatSideSnapshot`.

**Output**

```ts
interface LocalPressureResult {
  readonly attackingPressure: number;
  readonly defendingPressure: number;
  readonly lineShift: number;
}
```

Pressure uses troop count, attack/defense, morale, cohesion, fatigue, formation, and
contact type. `lineShift` is normalized to `[-1, 1]`.

**Acceptance tests**

- equivalent Dense Blocks produce equal pressure and zero line shift;
- a materially stronger attacker produces positive line shift;
- the same attacker has greater pressure in `FLANK` than `FRONTAL`;
- zero-troop sides produce zero finite pressure, never `NaN`.

## Task 8: Calculate and apply bounded casualties

**Create**

- `packages/simulation-core/src/casualties/casualty-allocation.ts`
- `packages/simulation-core/src/casualties/calculate-casualties.ts`
- `packages/simulation-core/src/casualties/calculate-casualties.test.ts`
- `packages/simulation-core/src/casualties/apply-casualties-to-unit.ts`
- `packages/simulation-core/src/casualties/apply-casualties-to-unit.test.ts`

**Inputs/Outputs**

- `calculateCasualties(pressure, troop counts, RandomSource): CasualtyResult`
- `applyCasualtiesToUnit(unit, allocation): UnitState`

One RNG draw creates a bounded `0.90–1.10` exchange-intensity modifier shared by both
sides. Per-resolution losses are capped at 5% and can never remove the last remaining
troop. Invalid or over-budget allocations throw.

The state transition must preserve:

```text
initialTroopCount
= troopCount + woundedCount + deadCount
+ routedCount + missingCount + capturedCount
```

**Acceptance tests**

- same seed and inputs produce the same losses;
- a stronger side inflicts more losses;
- no side is instantly annihilated;
- zero pressure produces zero casualties;
- category application preserves force conservation;
- input `UnitState` remains unchanged.

## Task 9: Resolve contact and emit events

**Create**

- `packages/simulation-core/src/contact/resolve-contact.ts`
- `packages/simulation-core/src/contact/resolve-contact.test.ts`

**Input**

- zone, attacker snapshot, defender snapshot, tick, and `RandomSource`.

**Output**

```ts
interface ContactResolution {
  readonly zone: ContactZone;
  readonly lineShift: number;
  readonly attackerLosses: number;
  readonly defenderLosses: number;
  readonly events: readonly BattleEvent[];
}
```

The coordinator may call pressure and casualty functions, but contains no duplicate
formula. It emits one deterministic `CASUALTIES_APPLIED` event whose `effects` include
both losses and line shift.

**Acceptance tests**

- homogeneous formations stalemate;
- stronger attacker advances;
- flank contact is more effective;
- no instant annihilation;
- repeated same-seed resolution produces identical output;
- event tick, actor IDs, cause, and effects are complete.

## Task 10: Public exports and Batch 02 gate

**Modify**

- `packages/simulation-core/src/index.ts`

Export only stable caller-facing contracts and functions. Keep internal helpers private
unless another package needs them.

**Verification**

Run independently:

```powershell
pnpm.cmd format
pnpm.cmd typecheck
pnpm.cmd lint
pnpm.cmd format:check
pnpm.cmd arch:check
pnpm.cmd deadcode
pnpm.cmd test
pnpm.cmd build
rg -n "Math\\.random" apps packages
```

Create `docs/reviews/batch-02-validation.md` using only observed results, then commit the
batch as one reversible checkpoint on `codex/project-expedition-mvp`.
