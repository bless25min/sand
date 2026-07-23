# Batch 03 Visual Projection and Greyfang Wolves Plan

> Scope: TASK-007 PixiJS point cloud and TASK-008 Greyfang wolf pack. This batch does
> not implement loot, inventory, equipment, AI command parsing, or persistence.

## Goal

Render a deterministic 2,000-point battlefield projection and add the first monster
behavior without allowing rendering code to own simulation truth.

## Dependency Direction

```text
shared-types ← simulation-core
shared-types ← pixi-renderer ← web
```

`pixi-renderer` must not import `simulation-core`. The web composition root may translate
simulation snapshots into renderer input. Visual points never store HP, equipment,
pathfinding, cooldowns, AI decisions, or casualty truth.

## Task 1: Install and pin PixiJS

Use `pixi.js@8.19.0`, the current stable v8 release verified on 2026-07-23.

**Modify**

- `packages/pixi-renderer/package.json`
- `packages/pixi-renderer/tsconfig.json`
- `apps/web/package.json`
- `apps/web/tsconfig.json`
- `pnpm-lock.yaml`

The renderer depends on `pixi.js` and `@expedition/shared-types`. The web app depends on
`@expedition/pixi-renderer`. No simulation package receives a Pixi dependency.

## Task 2: Define visual-only contracts

**Create**

- `packages/pixi-renderer/src/contracts/point-shape.ts`
- `packages/pixi-renderer/src/contracts/point-state.ts`
- `packages/pixi-renderer/src/contracts/visual-point.ts`
- `packages/pixi-renderer/src/contracts/visual-unit-source.ts`

**Contracts**

```ts
type PointShape = 'CIRCLE' | 'SQUARE' | 'TRIANGLE' | 'DIAMOND';
type PointState = 'ACTIVE' | 'CASUALTY' | 'ROUTING';

interface VisualPoint {
  readonly id: number;
  readonly unitId: string;
  readonly factionId: string;
  readonly position: Vec2;
  readonly targetPosition: Vec2;
  readonly rotation: number;
  readonly scale: number;
  readonly alpha: number;
  readonly shape: PointShape;
  readonly color: number;
  readonly state: PointState;
  readonly stateAgeSeconds: number;
  readonly animationSeed: number;
}
```

`VisualUnitSource` contains only the visual projection fields required to create points:
IDs, faction, active troop count, position, target, direction, formation, execution state,
shape, color, and visual scale.

## Task 3: Allocate a fixed point budget

**Create**

- `packages/pixi-renderer/src/points/allocate-point-counts.ts`
- `packages/pixi-renderer/src/points/allocate-point-counts.test.ts`

Use proportional largest-remainder allocation.

**Acceptance**

- total allocation equals `min(total troops, point budget)`;
- a 2,000-point budget produces exactly 2,000 points when troop count allows;
- zero-troop units receive zero;
- ties are stable by source order;
- invalid troop counts and budgets throw.

## Task 4: Calculate deterministic formation offsets

**Create**

- `packages/pixi-renderer/src/formations/create-formation-offset.ts`
- `packages/pixi-renderer/src/formations/create-formation-offset.test.ts`

The function consumes point index, point count, formation, spacing, and animation seed.
It returns a `Vec2` offset only.

**Acceptance**

- identical inputs produce identical offsets;
- Line is wider than Column;
- Column is deeper than Line;
- Dense Block is compact;
- Loose formation includes deterministic non-random jitter;
- Square and Wedge use visibly distinct layouts.

## Task 5: Create visual points

**Create**

- `packages/pixi-renderer/src/points/create-visual-points.ts`
- `packages/pixi-renderer/src/points/create-visual-points.test.ts`

The creator composes budget allocation and formation offsets. IDs and animation seeds use
a local deterministic string hash, never `Math.random`.

**Acceptance**

- four sources with enough troops create exactly 2,000 unique point IDs;
- point ownership matches allocated counts;
- points begin at formation-relative source positions;
- routing sources create `ROUTING` points;
- the same inputs produce byte-equivalent output;
- input sources remain unchanged.

## Task 6: Advance point visuals without changing simulation

**Create**

- `packages/pixi-renderer/src/points/advance-visual-point.ts`
- `packages/pixi-renderer/src/points/advance-visual-point.test.ts`

**Input**

- `VisualPoint`;
- delta seconds;
- interpolation rate;
- optional routing flow;
- casualty fade duration.

**Output**

- a new `VisualPoint`.

**Rules**

- Active points interpolate toward targets without overshoot;
- Routing points add visual flow and seeded lateral wobble;
- Casualty points remain in place and fade to alpha zero;
- visual updates never alter source unit or battle state.

## Task 7: Build the Pixi particle layer

**Create**

- `packages/pixi-renderer/src/layers/pixi-point-layer.ts`
- `packages/pixi-renderer/src/layers/pixi-point-layer.test.ts`
- `packages/pixi-renderer/src/textures/create-point-textures.ts`

Use PixiJS v8 `ParticleContainer` and `Particle`. One layer owns all particles.

**Forbidden**

- per-point React components;
- per-point event listeners;
- per-point collision objects;
- rule calculations inside the layer.

**Acceptance**

- syncing 2,000 snapshots yields 2,000 particles;
- a second sync updates existing particles rather than doubling them;
- missing IDs remove particles;
- shape selects the supplied texture;
- destroy releases the container and particle map.

## Task 8: Mount one WebGL battlefield

**Create**

- `packages/pixi-renderer/src/mount/mount-point-cloud.ts`
- `apps/web/src/battlefield/create-demo-sources.ts`
- `apps/web/src/battlefield/BattlefieldDemo.tsx`
- `apps/web/e2e/battlefield.spec.ts`

**Modify**

- `packages/pixi-renderer/src/index.ts`
- `apps/web/src/App.tsx`
- `apps/web/src/styles.css`

The React app mounts one canvas host and one Pixi `Application` with WebGL preference.
The renderer creates four visual formations and exactly 2,000 points. A single ticker
advances visual interpolation and syncs the batch.

Expose visible diagnostics:

- point count;
- renderer type;
- initialization time;
- rule ownership statement.

The canvas has no point-level DOM nodes or listeners.

## Task 9: Implement Greyfang wolf rules

**Create**

- `packages/simulation-core/src/monsters/greyfang-wolf/greyfang-wolf-profile.ts`
- `packages/simulation-core/src/monsters/greyfang-wolf/create-greyfang-pack.ts`
- `packages/simulation-core/src/monsters/greyfang-wolf/create-greyfang-pack.test.ts`
- `packages/simulation-core/src/monsters/greyfang-wolf/plan-greyfang-movement.ts`
- `packages/simulation-core/src/monsters/greyfang-wolf/plan-greyfang-movement.test.ts`
- `packages/simulation-core/src/monsters/greyfang-wolf/apply-greyfang-leader-loss.ts`
- `packages/simulation-core/src/monsters/greyfang-wolf/apply-greyfang-leader-loss.test.ts`

**Modify**

- `packages/shared-types/src/monsters/monster-group-state.ts`
- `packages/simulation-core/src/index.ts`

Add optional `leaderId` to `MonsterGroupState`.

**Rules**

- new packs use low cohesion (`0.35`);
- movement speed multiplier is `1.25`;
- distant targets produce `HUNTING`;
- targets within surround range produce `ENCIRCLING` with a deterministic flank target;
- close targets produce `ENGAGED`;
- leader loss reduces morale by `0.35` and cohesion by `0.15`;
- leader loss is idempotent through a `GREYFANG_LEADER_LOST` status;
- sufficiently low post-loss morale routes the pack;
- leader loss emits one deterministic `MORALE_CHANGED` event.

## Task 10: Browser and performance evidence

Run the built preview in a real browser and record:

- OS and browser engine;
- renderer backend;
- point count;
- initialization duration;
- whether the canvas rendered;
- whether browser console errors occurred.

This is a 2,000-point MVP measurement only. Do not add Web Workers, TypedArrays, WebGPU
requirements, or custom shaders without evidence.

## Task 11: Batch gate

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
pnpm.cmd test:e2e
rg -n "Math\\.random" apps packages
```

Create `docs/reviews/batch-03-validation.md` from observed results and commit one
reversible Batch 03 checkpoint on `codex/project-expedition-mvp`.
