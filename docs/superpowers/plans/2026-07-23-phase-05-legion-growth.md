# Phase 5 Legion Growth Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete the deterministic experience, leveling, recovery, reinforcement, infantry promotion, archer promotion, and next-battle evidence loop for Phase 5.

**Architecture:** Stable cross-package contracts live in `shared-types`, immutable MVP rules and definitions live in `game-data`, and pure state transitions live in focused `progression-core` files. `simulation-core` remains unchanged and consumes only promoted `UnitState` values; the Web app acts as a thin composition root and renders a deterministic snapshot.

**Tech Stack:** TypeScript 6 strict mode, Vitest 4, React 19 server-render tests, PixiJS battlefield projection, Playwright 1.61, Vite 8, pnpm 11, Cloudflare Pages.

## Global Constraints

- Complete both promotion lines in this batch: `infantry` → `heavy-shield-guard` and `archer` → `beast-hunter-marksman`.
- Keep simulation rules in `packages/simulation-core`.
- Keep cross-package stable contracts only in `packages/shared-types`.
- Import workspace packages through `@expedition/<package>`, never through another package's `src`.
- Only thin composition roots may coordinate multiple feature modules.
- Do not use `Math.random`.
- Add a failing test before every production behavior.
- Keep every production file independently testable, single-purpose, and explicit about input and output.
- Run local tests after each task and `pnpm.cmd check` after the batch.
- Deploy the verified build to the existing Cloudflare Pages project `ai-expedition-legion-rpg`.

---

## File Structure

### Cross-package contracts

- `packages/shared-types/src/progression/experience.ts`: experience awards and static rule shapes.
- `packages/shared-types/src/events/growth-event.ts`: traceable growth event contract.
- `packages/shared-types/src/units/unit-stat-modifiers.ts`: additive stat modifier contract.
- `packages/shared-types/src/skills/skill-definition.ts`: skill data contract.
- `packages/shared-types/src/units/unit-class-definition.ts`: promotion target contract.

### Static game data

- `packages/game-data/src/progression/experience-rules.ts`: fixed MVP experience values and caps.
- `packages/game-data/src/progression/experience-rules.test.ts`: data integrity checks.
- `packages/game-data/src/skills/shield-wall-training.ts`: heavy shield passive data.
- `packages/game-data/src/skills/beast-hunting-manual.ts`: marksman passive data.
- `packages/game-data/src/classes/heavy-shield-guard.ts`: infantry promotion data.
- `packages/game-data/src/classes/beast-hunter-marksman.ts`: archer promotion data.
- `packages/game-data/src/classes/legion-class-definitions.test.ts`: exact promotion trade-off checks.

### Pure progression rules

- `packages/progression-core/src/experience/calculate-experience-awards.ts`: validate and total capped awards.
- `packages/progression-core/src/experience/apply-unit-experience.ts`: apply experience, rollover levels, and emit events.
- `packages/progression-core/src/recovery/treat-wounded.ts`: move wounded troops back to active duty.
- `packages/progression-core/src/recovery/replenish-unit.ts`: fill non-reserved formation vacancies.
- `packages/progression-core/src/promotion/apply-unit-stat-modifiers.ts`: apply additive stat deltas.
- `packages/progression-core/src/promotion/promote-unit.ts`: validate and atomically apply one promotion.
- One colocated test file for each production rule above.

### Web composition and presentation

- `apps/web/src/legion-growth/create-legion-growth-snapshot.ts`: deterministic two-unit Phase 5 composition root.
- `apps/web/src/legion-growth/create-legion-growth-snapshot.test.ts`: full infantry and archer integration evidence.
- `apps/web/src/legion-growth/LegionGrowthPanel.tsx`: render-only section for both promotion lines.
- `apps/web/src/legion-growth/LegionGrowthPanel.test.tsx`: panel copy and evidence checks.
- `apps/web/src/App.tsx`: add the Phase 5 panel and build label.
- `apps/web/src/App.test.tsx`: app-level presence checks.
- `apps/web/src/styles.css`: responsive growth cards and evidence ledgers.
- `apps/web/e2e/battlefield.spec.ts`: browser checks for both classes and the existing PixiJS canvas.
- `docs/reviews/phase-05-legion-growth-validation.md`: verification and deployment evidence.

---

### Task 1: Shared Growth Contracts and Experience Data

**Files:**

- Create: `packages/shared-types/src/progression/experience.ts`
- Create: `packages/shared-types/src/events/growth-event.ts`
- Create: `packages/shared-types/src/units/unit-stat-modifiers.ts`
- Create: `packages/shared-types/src/skills/skill-definition.ts`
- Create: `packages/shared-types/src/units/unit-class-definition.ts`
- Modify: `packages/shared-types/src/index.ts`
- Create: `packages/game-data/src/progression/experience-rules.ts`
- Create: `packages/game-data/src/progression/experience-rules.test.ts`
- Modify: `packages/game-data/src/index.ts`

**Interfaces:**

- Produces: `ExperienceAward`, `ExperienceReason`, `ExperienceRule`, `GrowthEvent`, `GrowthEventType`, `UnitStatModifiers`, `SkillDefinition`, `SkillType`, `UnitClassDefinition`.
- Produces: `EXPERIENCE_RULES: Readonly<Record<ExperienceReason, ExperienceRule>>`.

- [ ] **Step 1: Write the failing game-data test**

```typescript
import { describe, expect, it } from 'vitest';

import { EXPERIENCE_RULES } from './experience-rules';

describe('EXPERIENCE_RULES', () => {
  it('defines every Phase 5 reward and settlement cap', () => {
    expect(EXPERIENCE_RULES).toEqual({
      BATTLE_PARTICIPATION: { experiencePerOccurrence: 40, settlementCap: 40 },
      COMMAND_COMPLETED: { experiencePerOccurrence: 20, settlementCap: 40 },
      FORMATION_HELD: { experiencePerOccurrence: 25, settlementCap: 25 },
      ALLY_PROTECTED: { experiencePerOccurrence: 25, settlementCap: 25 },
      MONSTER_DEFEATED: { experiencePerOccurrence: 10, settlementCap: 50 },
      BREAKTHROUGH_COMPLETED: { experiencePerOccurrence: 30, settlementCap: 30 },
      ROUT_SURVIVED: { experiencePerOccurrence: 20, settlementCap: 20 },
      UNKNOWN_NODE_EXPLORED: { experiencePerOccurrence: 50, settlementCap: 50 },
    });
  });
});
```

- [ ] **Step 2: Run the focused test and confirm the missing-module failure**

Run:

```powershell
pnpm.cmd exec vitest run packages/game-data/src/progression/experience-rules.test.ts
```

Expected: FAIL because `./experience-rules` does not exist.

- [ ] **Step 3: Add the contracts and fixed rules**

`packages/shared-types/src/progression/experience.ts`:

```typescript
export type ExperienceReason =
  | 'BATTLE_PARTICIPATION'
  | 'COMMAND_COMPLETED'
  | 'FORMATION_HELD'
  | 'ALLY_PROTECTED'
  | 'MONSTER_DEFEATED'
  | 'BREAKTHROUGH_COMPLETED'
  | 'ROUT_SURVIVED'
  | 'UNKNOWN_NODE_EXPLORED';

export interface ExperienceAward {
  readonly reason: ExperienceReason;
  readonly quantity: number;
  readonly evidenceIds: readonly string[];
}

export interface ExperienceRule {
  readonly experiencePerOccurrence: number;
  readonly settlementCap: number;
}
```

`packages/shared-types/src/events/growth-event.ts`:

```typescript
export type GrowthEventType =
  | 'EXPERIENCE_AWARDED'
  | 'LEVEL_GAINED'
  | 'CLASS_CHANGED'
  | 'WOUNDED_TREATED'
  | 'REINFORCEMENTS_ADDED';

export interface GrowthEvent {
  readonly id: string;
  readonly unitId: string;
  readonly type: GrowthEventType;
  readonly causes: readonly string[];
  readonly effects: Readonly<Record<string, number | string | boolean>>;
}
```

`packages/shared-types/src/units/unit-stat-modifiers.ts`:

```typescript
export interface UnitStatModifiers {
  readonly attack?: number;
  readonly defense?: number;
  readonly frontalDefense?: number;
  readonly mobility?: number;
  readonly discipline?: number;
  readonly commandEfficiency?: number;
}
```

`packages/shared-types/src/skills/skill-definition.ts`:

```typescript
import type { UnitStatModifiers } from '../units/unit-stat-modifiers';

export type SkillType = 'PASSIVE' | 'TACTICAL' | 'REACTION' | 'COMMAND' | 'FIELD';

export interface SkillDefinition {
  readonly id: string;
  readonly name: string;
  readonly type: SkillType;
  readonly description: string;
  readonly statModifiers: UnitStatModifiers;
}
```

`packages/shared-types/src/units/unit-class-definition.ts`:

```typescript
import type { UnitStatModifiers } from './unit-stat-modifiers';

export interface UnitClassDefinition {
  readonly id: string;
  readonly name: string;
  readonly sourceClassId: string;
  readonly minimumLevel: number;
  readonly skillIds: readonly string[];
  readonly passiveIds: readonly string[];
  readonly appearanceIds: readonly string[];
  readonly statModifiers: UnitStatModifiers;
}
```

`packages/game-data/src/progression/experience-rules.ts`:

```typescript
import type { ExperienceReason, ExperienceRule } from '@expedition/shared-types';

export const EXPERIENCE_RULES: Readonly<Record<ExperienceReason, ExperienceRule>> = {
  BATTLE_PARTICIPATION: { experiencePerOccurrence: 40, settlementCap: 40 },
  COMMAND_COMPLETED: { experiencePerOccurrence: 20, settlementCap: 40 },
  FORMATION_HELD: { experiencePerOccurrence: 25, settlementCap: 25 },
  ALLY_PROTECTED: { experiencePerOccurrence: 25, settlementCap: 25 },
  MONSTER_DEFEATED: { experiencePerOccurrence: 10, settlementCap: 50 },
  BREAKTHROUGH_COMPLETED: { experiencePerOccurrence: 30, settlementCap: 30 },
  ROUT_SURVIVED: { experiencePerOccurrence: 20, settlementCap: 20 },
  UNKNOWN_NODE_EXPLORED: { experiencePerOccurrence: 50, settlementCap: 50 },
};
```

Export every new contract and `EXPERIENCE_RULES` from the package index files with explicit named exports.

- [ ] **Step 4: Run the focused test and typecheck**

Run:

```powershell
pnpm.cmd exec vitest run packages/game-data/src/progression/experience-rules.test.ts
pnpm.cmd typecheck
```

Expected: PASS with one focused test and zero TypeScript errors.

- [ ] **Step 5: Commit the contracts and rules**

```powershell
git add packages/shared-types/src packages/game-data/src
git commit -m "feat: define legion growth contracts"
```

---

### Task 2: Capped Experience Calculation

**Files:**

- Create: `packages/progression-core/src/experience/calculate-experience-awards.ts`
- Create: `packages/progression-core/src/experience/calculate-experience-awards.test.ts`
- Modify: `packages/progression-core/src/index.ts`

**Interfaces:**

- Consumes: `ExperienceAward`, `ExperienceReason`, `ExperienceRule`.
- Produces: `calculateExperienceAwards(input: CalculateExperienceAwardsInput): ExperienceCalculationResult`.
- Produces success details with `reason`, `quantity`, `awardedExperience`, and combined `evidenceIds`.

- [ ] **Step 1: Write failing tests for totals, caps, and atomic validation**

```typescript
import { EXPERIENCE_RULES } from '@expedition/game-data';
import { describe, expect, it } from 'vitest';

import { calculateExperienceAwards } from './calculate-experience-awards';

describe('calculateExperienceAwards', () => {
  it('groups repeated reasons and caps the settlement total', () => {
    const result = calculateExperienceAwards({
      awards: [
        { reason: 'MONSTER_DEFEATED', quantity: 3, evidenceIds: ['wolf-a'] },
        { reason: 'MONSTER_DEFEATED', quantity: 4, evidenceIds: ['wolf-b'] },
        { reason: 'BATTLE_PARTICIPATION', quantity: 1, evidenceIds: ['battle-1'] },
      ],
      rules: EXPERIENCE_RULES,
    });

    expect(result).toEqual({
      ok: true,
      totalExperience: 90,
      details: [
        {
          reason: 'MONSTER_DEFEATED',
          quantity: 7,
          awardedExperience: 50,
          evidenceIds: ['wolf-a', 'wolf-b'],
        },
        {
          reason: 'BATTLE_PARTICIPATION',
          quantity: 1,
          awardedExperience: 40,
          evidenceIds: ['battle-1'],
        },
      ],
    });
  });

  it.each([
    [{ reason: 'COMMAND_COMPLETED', quantity: 0, evidenceIds: ['command-1'] }, 'INVALID_QUANTITY'],
    [
      { reason: 'COMMAND_COMPLETED', quantity: 1.5, evidenceIds: ['command-1'] },
      'INVALID_QUANTITY',
    ],
    [{ reason: 'COMMAND_COMPLETED', quantity: 1, evidenceIds: [] }, 'MISSING_EVIDENCE'],
  ] as const)('rejects invalid award %j atomically', (award, reason) => {
    expect(calculateExperienceAwards({ awards: [award], rules: EXPERIENCE_RULES })).toEqual({
      ok: false,
      reason,
      awardIndex: 0,
    });
  });
});
```

- [ ] **Step 2: Run the focused test and confirm the missing-function failure**

Run:

```powershell
pnpm.cmd exec vitest run packages/progression-core/src/experience/calculate-experience-awards.test.ts
```

Expected: FAIL because the module does not exist.

- [ ] **Step 3: Implement grouped calculation with a discriminated result**

Create these public result types in the implementation file:

```typescript
export type ExperienceCalculationFailureReason =
  'INVALID_QUANTITY' | 'MISSING_EVIDENCE' | 'MISSING_EXPERIENCE_RULE';

export interface ExperienceAwardDetail {
  readonly reason: ExperienceReason;
  readonly quantity: number;
  readonly awardedExperience: number;
  readonly evidenceIds: readonly string[];
}

export type ExperienceCalculationResult =
  | {
      readonly ok: true;
      readonly totalExperience: number;
      readonly details: readonly ExperienceAwardDetail[];
    }
  | {
      readonly ok: false;
      readonly reason: ExperienceCalculationFailureReason;
      readonly awardIndex: number;
    };
```

Validate every award before calculating. Preserve first-seen reason order, aggregate quantities and evidence IDs by reason, clamp `quantity * experiencePerOccurrence` to `settlementCap`, and never mutate the input arrays.

- [ ] **Step 4: Run focused tests and progression-core typecheck**

Run:

```powershell
pnpm.cmd exec vitest run packages/progression-core/src/experience/calculate-experience-awards.test.ts
pnpm.cmd --filter @expedition/progression-core typecheck
```

Expected: PASS.

- [ ] **Step 5: Commit the calculator**

```powershell
git add packages/progression-core/src/experience packages/progression-core/src/index.ts
git commit -m "feat: calculate capped legion experience"
```

---

### Task 3: Experience Rollover and Growth Events

**Files:**

- Create: `packages/progression-core/src/experience/apply-unit-experience.ts`
- Create: `packages/progression-core/src/experience/apply-unit-experience.test.ts`
- Modify: `packages/progression-core/src/index.ts`

**Interfaces:**

- Consumes: successful `ExperienceCalculationResult`, `UnitState`, and caller-provided `eventId`.
- Produces: `applyUnitExperience(input: ApplyUnitExperienceInput): ApplyUnitExperienceResult`.
- Produces deterministic `EXPERIENCE_AWARDED` and `${eventId}:level:${level}` events.

- [ ] **Step 1: Write failing tests for one level, multiple levels, overflow, and immutability**

```typescript
import { createUnitState } from '@expedition/test-fixtures';
import { describe, expect, it } from 'vitest';

import { applyUnitExperience } from './apply-unit-experience';

describe('applyUnitExperience', () => {
  it('levels once and preserves overflow with traceable events', () => {
    const unit = createUnitState({ level: 1, experience: 80 });
    const result = applyUnitExperience({
      unit,
      calculation: {
        ok: true,
        totalExperience: 65,
        details: [
          {
            reason: 'FORMATION_HELD',
            quantity: 1,
            awardedExperience: 25,
            evidenceIds: ['formation-1'],
          },
          {
            reason: 'BATTLE_PARTICIPATION',
            quantity: 1,
            awardedExperience: 40,
            evidenceIds: ['battle-1'],
          },
        ],
      },
      eventId: 'growth-infantry',
    });

    expect(result.unit).toMatchObject({ level: 2, experience: 45 });
    expect(result.levelsGained).toBe(1);
    expect(result.events.map((event) => event.id)).toEqual([
      'growth-infantry',
      'growth-infantry:level:2',
    ]);
    expect(result.events[0]?.causes).toEqual(['formation-1', 'battle-1']);
    expect(unit).toMatchObject({ level: 1, experience: 80 });
  });

  it('can cross multiple level thresholds', () => {
    const result = applyUnitExperience({
      unit: createUnitState({ level: 1, experience: 0 }),
      calculation: { ok: true, totalExperience: 350, details: [] },
      eventId: 'growth-multi',
    });

    expect(result.unit).toMatchObject({ level: 3, experience: 50 });
    expect(result.levelsGained).toBe(2);
  });
});
```

- [ ] **Step 2: Run the focused test and confirm the missing-module failure**

Run:

```powershell
pnpm.cmd exec vitest run packages/progression-core/src/experience/apply-unit-experience.test.ts
```

Expected: FAIL because the module does not exist.

- [ ] **Step 3: Implement deterministic rollover**

Use this input and output:

```typescript
export interface ApplyUnitExperienceInput {
  readonly unit: UnitState;
  readonly calculation: Extract<ExperienceCalculationResult, { readonly ok: true }>;
  readonly eventId: string;
}

export interface ApplyUnitExperienceResult {
  readonly unit: UnitState;
  readonly levelsGained: number;
  readonly events: readonly GrowthEvent[];
}
```

Start with `unit.experience + calculation.totalExperience`. While the remainder is at least `level * 100`, subtract that threshold and increment the level. Emit the award event only when experience gained is greater than zero. Emit one level event for each crossed threshold and deduplicate evidence IDs in first-seen order.

- [ ] **Step 4: Run focused tests and the Phase 5A gate**

Run:

```powershell
pnpm.cmd exec vitest run packages/game-data/src/progression/experience-rules.test.ts packages/progression-core/src/experience
pnpm.cmd typecheck
```

Expected: PASS with deterministic event IDs and no type errors.

- [ ] **Step 5: Commit Phase 5A**

```powershell
git add packages/progression-core/src/experience packages/progression-core/src/index.ts
git commit -m "feat: apply legion levels and growth events"
```

---

### Task 4: Wounded Treatment

**Files:**

- Create: `packages/progression-core/src/recovery/treat-wounded.ts`
- Create: `packages/progression-core/src/recovery/treat-wounded.test.ts`
- Modify: `packages/progression-core/src/index.ts`

**Interfaces:**

- Produces: `treatWounded(input: TreatWoundedInput): TreatWoundedResult`.
- Failure returns `INVALID_TREATMENT_CAPACITY` and the original unit reference.
- Success returns `event: GrowthEvent | undefined`.

- [ ] **Step 1: Write failing tests for partial treatment, zero work, and invalid capacity**

```typescript
import { createUnitState } from '@expedition/test-fixtures';
import { describe, expect, it } from 'vitest';

import { treatWounded } from './treat-wounded';

describe('treatWounded', () => {
  it('moves only treatable wounded troops back to active duty', () => {
    const unit = createUnitState({
      troopCount: 70,
      initialTroopCount: 100,
      woundedCount: 20,
      deadCount: 10,
      missingCount: 3,
    });
    const result = treatWounded({ unit, treatmentCapacity: 12, eventId: 'treatment-1' });

    expect(result).toMatchObject({
      ok: true,
      treatedCount: 12,
      remainingWoundedCount: 8,
      unit: { troopCount: 82, woundedCount: 8, deadCount: 10, missingCount: 3 },
      event: { id: 'treatment-1', type: 'WOUNDED_TREATED' },
    });
  });

  it('returns no event when nobody can be treated', () => {
    const result = treatWounded({
      unit: createUnitState(),
      treatmentCapacity: 10,
      eventId: 'treatment-zero',
    });

    expect(result).toMatchObject({ ok: true, treatedCount: 0, event: undefined });
  });

  it('rejects a non-integer capacity without replacing the unit', () => {
    const unit = createUnitState({ woundedCount: 5 });
    const result = treatWounded({ unit, treatmentCapacity: 1.5, eventId: 'treatment-bad' });

    expect(result).toEqual({ ok: false, reason: 'INVALID_TREATMENT_CAPACITY', unit });
    if (!result.ok) expect(result.unit).toBe(unit);
  });
});
```

- [ ] **Step 2: Run the focused test and confirm failure**

Run:

```powershell
pnpm.cmd exec vitest run packages/progression-core/src/recovery/treat-wounded.test.ts
```

Expected: FAIL because the module does not exist.

- [ ] **Step 3: Implement the treatment transition**

Use a discriminated union. Reject values that are negative, non-finite, or not integers. Compute:

```typescript
const availableActiveSlots = Math.max(0, unit.initialTroopCount - unit.troopCount);
const treatedCount = Math.min(unit.woundedCount, treatmentCapacity, availableActiveSlots);
```

Only update `troopCount` and `woundedCount`. Event causes contain the unit ID; effects contain `treatedCount` and `remainingWoundedCount`.

- [ ] **Step 4: Run the focused test**

Run:

```powershell
pnpm.cmd exec vitest run packages/progression-core/src/recovery/treat-wounded.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit treatment**

```powershell
git add packages/progression-core/src/recovery/treat-wounded.ts packages/progression-core/src/recovery/treat-wounded.test.ts packages/progression-core/src/index.ts
git commit -m "feat: treat wounded legion troops"
```

---

### Task 5: Formation-Safe Reinforcement

**Files:**

- Create: `packages/progression-core/src/recovery/replenish-unit.ts`
- Create: `packages/progression-core/src/recovery/replenish-unit.test.ts`
- Modify: `packages/progression-core/src/index.ts`

**Interfaces:**

- Produces: `replenishUnit(input: ReplenishUnitInput): ReplenishUnitResult`.
- Failure returns `INVALID_RECRUIT_COUNT` and the original unit reference.
- Success reports added, unused, remaining vacancy, and `event: GrowthEvent | undefined`.

- [ ] **Step 1: Write failing tests for wounded reservations, excess recruits, and invalid input**

```typescript
import { createUnitState } from '@expedition/test-fixtures';
import { describe, expect, it } from 'vitest';

import { replenishUnit } from './replenish-unit';

describe('replenishUnit', () => {
  it('keeps wounded formation slots reserved', () => {
    const result = replenishUnit({
      unit: createUnitState({ troopCount: 70, initialTroopCount: 100, woundedCount: 20 }),
      availableRecruits: 15,
      eventId: 'recruits-1',
    });

    expect(result).toMatchObject({
      ok: true,
      addedCount: 10,
      unusedRecruitCount: 5,
      remainingVacancy: 0,
      unit: { troopCount: 80, woundedCount: 20 },
      event: { id: 'recruits-1', type: 'REINFORCEMENTS_ADDED' },
    });
  });

  it('does not create an event for a full formation', () => {
    const result = replenishUnit({
      unit: createUnitState(),
      availableRecruits: 5,
      eventId: 'recruits-zero',
    });

    expect(result).toMatchObject({
      ok: true,
      addedCount: 0,
      unusedRecruitCount: 5,
      event: undefined,
    });
  });

  it('rejects negative recruits atomically', () => {
    const unit = createUnitState({ troopCount: 90 });
    const result = replenishUnit({
      unit,
      availableRecruits: -1,
      eventId: 'recruits-bad',
    });

    expect(result).toEqual({ ok: false, reason: 'INVALID_RECRUIT_COUNT', unit });
  });
});
```

- [ ] **Step 2: Run the focused test and confirm failure**

Run:

```powershell
pnpm.cmd exec vitest run packages/progression-core/src/recovery/replenish-unit.test.ts
```

Expected: FAIL because the module does not exist.

- [ ] **Step 3: Implement vacancy-aware reinforcement**

Validate a non-negative finite integer, then compute:

```typescript
const availableVacancy = Math.max(0, unit.initialTroopCount - unit.troopCount - unit.woundedCount);
const addedCount = Math.min(availableRecruits, availableVacancy);
```

Only update `troopCount`. Preserve all casualty fields. Event effects contain `addedCount` and `remainingVacancy`.

- [ ] **Step 4: Run the Phase 5B gate**

Run:

```powershell
pnpm.cmd exec vitest run packages/progression-core/src/recovery
pnpm.cmd --filter @expedition/progression-core typecheck
```

Expected: PASS; active plus wounded never exceeds initial strength.

- [ ] **Step 5: Commit Phase 5B**

```powershell
git add packages/progression-core/src/recovery packages/progression-core/src/index.ts
git commit -m "feat: replenish legion formations safely"
```

---

### Task 6: Promotion Data and Additive Stat Application

**Files:**

- Create: `packages/game-data/src/skills/shield-wall-training.ts`
- Create: `packages/game-data/src/skills/beast-hunting-manual.ts`
- Create: `packages/game-data/src/classes/heavy-shield-guard.ts`
- Create: `packages/game-data/src/classes/beast-hunter-marksman.ts`
- Create: `packages/game-data/src/classes/legion-class-definitions.test.ts`
- Modify: `packages/game-data/src/index.ts`
- Create: `packages/progression-core/src/promotion/apply-unit-stat-modifiers.ts`
- Create: `packages/progression-core/src/promotion/apply-unit-stat-modifiers.test.ts`
- Modify: `packages/progression-core/src/index.ts`

**Interfaces:**

- Produces constants `SHIELD_WALL_TRAINING`, `BEAST_HUNTING_MANUAL`, `HEAVY_SHIELD_GUARD`, and `BEAST_HUNTER_MARKSMAN`.
- Produces `LEGION_SKILLS: Readonly<Record<string, SkillDefinition>>`.
- Produces `applyUnitStatModifiers(unit: UnitState, modifiers: UnitStatModifiers): UnitState`.

- [ ] **Step 1: Write failing data and stat tests**

The data test must assert:

```typescript
expect(HEAVY_SHIELD_GUARD).toMatchObject({
  id: 'heavy-shield-guard',
  sourceClassId: 'infantry',
  minimumLevel: 2,
  skillIds: ['shield-wall-training'],
  passiveIds: ['shield-wall-training'],
  appearanceIds: ['class-heavy-shield-guard'],
  statModifiers: { defense: 1, frontalDefense: 2, mobility: -0.2 },
});
expect(SHIELD_WALL_TRAINING.statModifiers).toEqual({
  frontalDefense: 2,
  mobility: -0.1,
});
expect(BEAST_HUNTER_MARKSMAN).toMatchObject({
  id: 'beast-hunter-marksman',
  sourceClassId: 'archer',
  minimumLevel: 2,
  skillIds: ['beast-hunting-manual'],
  passiveIds: ['beast-hunting-manual'],
  appearanceIds: ['class-beast-hunter-marksman'],
  statModifiers: { attack: 1, defense: -1, mobility: 0.1 },
});
expect(BEAST_HUNTING_MANUAL.statModifiers).toEqual({
  attack: 2,
  frontalDefense: -0.5,
  mobility: 0.15,
});
```

The stat test must start from `createUnitState()` and assert that attack, defense, frontal defense, mobility, discipline, and command efficiency receive additive deltas while troop and casualty fields remain unchanged. It must also assert the source unit is not mutated.

- [ ] **Step 2: Run both focused tests and confirm missing modules**

Run:

```powershell
pnpm.cmd exec vitest run packages/game-data/src/classes/legion-class-definitions.test.ts packages/progression-core/src/promotion/apply-unit-stat-modifiers.test.ts
```

Expected: FAIL because the definitions and modifier function do not exist.

- [ ] **Step 3: Add exact definitions and the modifier function**

Use the exact values from the assertions. Skill definitions have `type: 'PASSIVE'` and these names:

- `shield-wall-training`: `盾牆訓練`
- `beast-hunting-manual`: `獵獸操典`

Implement `applyUnitStatModifiers` as an immutable spread that adds every supported optional modifier, defaulting each missing delta to zero. Round every updated value to four decimal places with:

```typescript
const add = (base: number, delta = 0) => Number((base + delta).toFixed(4));
```

- [ ] **Step 4: Run focused tests and architecture checks**

Run:

```powershell
pnpm.cmd exec vitest run packages/game-data/src/classes/legion-class-definitions.test.ts packages/progression-core/src/promotion/apply-unit-stat-modifiers.test.ts
pnpm.cmd typecheck
pnpm.cmd arch:check
```

Expected: PASS; progression-core has no runtime dependency on game-data.

- [ ] **Step 5: Commit promotion data and stat application**

```powershell
git add packages/game-data/src packages/progression-core/src/promotion/apply-unit-stat-modifiers.ts packages/progression-core/src/promotion/apply-unit-stat-modifiers.test.ts packages/progression-core/src/index.ts
git commit -m "feat: define legion promotion tradeoffs"
```

---

### Task 7: Atomic Shared Promotion Rule

**Files:**

- Create: `packages/progression-core/src/promotion/promote-unit.ts`
- Create: `packages/progression-core/src/promotion/promote-unit.test.ts`
- Modify: `packages/progression-core/src/index.ts`

**Interfaces:**

- Consumes: a unit, one `UnitClassDefinition`, skill definitions by ID, and an event ID.
- Produces: `promoteUnit(input: PromoteUnitInput): PromotionResult`.
- Failure precedence: wrong source class, level too low, missing skill definition.

- [ ] **Step 1: Write failing tests for both classes and all atomic failures**

Use a table with:

```typescript
[
  {
    definition: HEAVY_SHIELD_GUARD,
    unit: createUnitState({ classId: 'infantry', level: 2 }),
    expected: {
      classId: 'heavy-shield-guard',
      attack: 10,
      defense: 11,
      frontalDefense: 14,
      mobility: 1.7,
      skillIds: ['shield-wall-training'],
      passiveIds: ['shield-wall-training'],
      appearanceIds: ['class-heavy-shield-guard'],
    },
  },
  {
    definition: BEAST_HUNTER_MARKSMAN,
    unit: createUnitState({
      unitType: 'ARCHER',
      classId: 'archer',
      level: 2,
      formation: 'LOOSE',
    }),
    expected: {
      classId: 'beast-hunter-marksman',
      attack: 13,
      defense: 9,
      frontalDefense: 9.5,
      mobility: 2.25,
      skillIds: ['beast-hunting-manual'],
      passiveIds: ['beast-hunting-manual'],
      appearanceIds: ['class-beast-hunter-marksman'],
    },
  },
];
```

For each success, assert a `CLASS_CHANGED` event whose effects contain `fromClassId` and `toClassId`. Add separate failure tests for `WRONG_SOURCE_CLASS`, `LEVEL_TOO_LOW`, and `MISSING_SKILL_DEFINITION`; every failure must retain the exact source unit reference.

- [ ] **Step 2: Run the focused test and confirm failure**

Run:

```powershell
pnpm.cmd exec vitest run packages/progression-core/src/promotion/promote-unit.test.ts
```

Expected: FAIL because the module does not exist.

- [ ] **Step 3: Implement one shared atomic promotion**

Define:

```typescript
export type PromotionFailureReason =
  'WRONG_SOURCE_CLASS' | 'LEVEL_TOO_LOW' | 'MISSING_SKILL_DEFINITION';

export interface PromoteUnitInput {
  readonly unit: UnitState;
  readonly classDefinition: UnitClassDefinition;
  readonly skillDefinitions: Readonly<Record<string, SkillDefinition>>;
  readonly eventId: string;
}

export type PromotionResult =
  | { readonly ok: true; readonly unit: UnitState; readonly event: GrowthEvent }
  | {
      readonly ok: false;
      readonly reason: PromotionFailureReason;
      readonly unit: UnitState;
      readonly missingSkillId?: string;
    };
```

Validate all prerequisites before changing any state. Apply class modifiers once, then each class skill modifier in listed order. Add IDs without duplicates. Return one final copied unit and one class-change event.

- [ ] **Step 4: Run the Phase 5C and 5D gate**

Run:

```powershell
pnpm.cmd exec vitest run packages/game-data/src/classes packages/progression-core/src/promotion
pnpm.cmd typecheck
pnpm.cmd arch:check
```

Expected: PASS; both promotion paths use `promoteUnit`.

- [ ] **Step 5: Commit both promotion lines**

```powershell
git add packages/progression-core/src/promotion/promote-unit.ts packages/progression-core/src/promotion/promote-unit.test.ts packages/progression-core/src/index.ts
git commit -m "feat: promote infantry and archers atomically"
```

---

### Task 8: Deterministic Dual-Class Web Snapshot

**Files:**

- Create: `apps/web/src/legion-growth/create-legion-growth-snapshot.ts`
- Create: `apps/web/src/legion-growth/create-legion-growth-snapshot.test.ts`

**Interfaces:**

- Consumes: Phase 5 game data and progression functions plus existing movement and local-pressure functions.
- Produces: `createLegionGrowthSnapshot(): LegionGrowthSnapshot`.
- Produces one `LegionGrowthUnitSnapshot` for infantry and one for archer.

- [ ] **Step 1: Write the failing full-loop integration test**

```typescript
import { describe, expect, it } from 'vitest';

import { createLegionGrowthSnapshot } from './create-legion-growth-snapshot';

describe('createLegionGrowthSnapshot', () => {
  it('replays both growth paths deterministically', () => {
    const first = createLegionGrowthSnapshot();
    expect(createLegionGrowthSnapshot()).toEqual(first);
    expect(first.units.map((entry) => entry.after.classId)).toEqual([
      'heavy-shield-guard',
      'beast-hunter-marksman',
    ]);
    expect(first.units.every((entry) => entry.after.level === 2)).toBe(true);
    expect(first.units.every((entry) => entry.events.length > 0)).toBe(true);
  });

  it('makes infantry tougher and slower in the next battle', () => {
    const infantry = createLegionGrowthSnapshot().units[0];
    expect(infantry?.after.frontalDefense).toBeGreaterThan(infantry?.before.frontalDefense ?? 0);
    expect(infantry?.afterMetrics.defendingPressure).toBeGreaterThan(
      infantry?.beforeMetrics.defendingPressure ?? 0,
    );
    expect(infantry?.afterMetrics.distanceMoved).toBeLessThan(
      infantry?.beforeMetrics.distanceMoved ?? 0,
    );
  });

  it('makes archers hit harder and move farther with lower frontal defense', () => {
    const archer = createLegionGrowthSnapshot().units[1];
    expect(archer?.after.attack).toBeGreaterThan(archer?.before.attack ?? 0);
    expect(archer?.after.frontalDefense).toBeLessThan(archer?.before.frontalDefense ?? 0);
    expect(archer?.afterMetrics.attackingPressure).toBeGreaterThan(
      archer?.beforeMetrics.attackingPressure ?? 0,
    );
    expect(archer?.afterMetrics.distanceMoved).toBeGreaterThan(
      archer?.beforeMetrics.distanceMoved ?? 0,
    );
  });
});
```

- [ ] **Step 2: Run the focused test and confirm failure**

Run:

```powershell
pnpm.cmd exec vitest run apps/web/src/legion-growth/create-legion-growth-snapshot.test.ts
```

Expected: FAIL because the module does not exist.

- [ ] **Step 3: Implement the thin deterministic composition root**

Define:

```typescript
export interface LegionGrowthBattleMetrics {
  readonly attackingPressure: number;
  readonly defendingPressure: number;
  readonly distanceMoved: number;
}

export interface LegionGrowthUnitSnapshot {
  readonly experienceDetails: readonly ExperienceAwardDetail[];
  readonly experienceGained: number;
  readonly levelsGained: number;
  readonly treatedCount: number;
  readonly reinforcementCount: number;
  readonly className: string;
  readonly skillName: string;
  readonly before: UnitState;
  readonly after: UnitState;
  readonly beforeMetrics: LegionGrowthBattleMetrics;
  readonly afterMetrics: LegionGrowthBattleMetrics;
  readonly events: readonly GrowthEvent[];
}

export interface LegionGrowthSnapshot {
  readonly units: readonly LegionGrowthUnitSnapshot[];
}
```

Create fixed 1st-level infantry and archer units with wounded troops and formation vacancies. Give infantry participation, formation, and monster awards; give archer participation, command, and monster awards. Use the public Phase 5 functions in order: calculate, apply, treat, replenish, promote. Throw only when a fixed internal fixture produces a failure, because that indicates invalid application data. Calculate movement and frontal pressure before and after using existing simulation-core public exports.

- [ ] **Step 4: Run focused integration tests and typecheck**

Run:

```powershell
pnpm.cmd exec vitest run apps/web/src/legion-growth/create-legion-growth-snapshot.test.ts
pnpm.cmd typecheck
```

Expected: PASS with both class trade-offs entering existing simulation formulas.

- [ ] **Step 5: Commit the snapshot**

```powershell
git add apps/web/src/legion-growth
git commit -m "feat: compose dual legion growth snapshot"
```

---

### Task 9: Legion Growth Panel and Browser Evidence

**Files:**

- Create: `apps/web/src/legion-growth/LegionGrowthPanel.tsx`
- Create: `apps/web/src/legion-growth/LegionGrowthPanel.test.tsx`
- Modify: `apps/web/src/App.tsx`
- Modify: `apps/web/src/App.test.tsx`
- Modify: `apps/web/src/styles.css`
- Modify: `apps/web/e2e/battlefield.spec.ts`

**Interfaces:**

- Consumes: a completed `LegionGrowthSnapshot`.
- Produces: render-only `LegionGrowthPanel`.
- Keeps the existing battlefield and loot-loop panels unchanged.

- [ ] **Step 1: Write failing render and E2E assertions**

The render test creates a snapshot and must assert the static markup contains:

```typescript
expect(markup).toContain('軍團成長與雙線轉職');
expect(markup).toContain('重盾衛隊');
expect(markup).toContain('盾牆訓練');
expect(markup).toContain('獵獸射手');
expect(markup).toContain('獵獸操典');
expect(markup).toContain('傷兵治療');
expect(markup).toContain('補員');
expect(markup).toContain('下一場戰鬥');
```

Extend `App.test.tsx` to assert the Phase 5 heading and both class names. Extend Playwright to locate `[data-testid="legion-growth"]`, require two `[data-testid="growth-unit-card"]` elements, and require exact visible text for both class names while retaining the one-canvas and no-page-error assertions.

- [ ] **Step 2: Run render tests and confirm failure**

Run:

```powershell
pnpm.cmd exec vitest run apps/web/src/legion-growth/LegionGrowthPanel.test.tsx apps/web/src/App.test.tsx
```

Expected: FAIL because the panel does not exist and App does not render Phase 5.

- [ ] **Step 3: Implement the render-only panel and responsive styles**

`LegionGrowthPanel` must:

- Use `<section data-testid="legion-growth">`.
- Map `snapshot.units` into exactly two `<article data-testid="growth-unit-card">` cards.
- Display experience reason rows, total gained experience, level and overflow, treatment count, reinforcement count, class and skill names.
- Display before and after attack, defense, frontal defense, mobility, movement distance, attacking pressure, and defending pressure.
- Use labels `收益` and `代價` so each promotion communicates a trade-off.
- Never import game-data, progression-core, or simulation-core.

Add responsive CSS under `.legion-growth-panel`, `.growth-card-grid`, `.growth-unit-card`, `.growth-timeline`, and `.growth-metrics`. Reuse the existing color tokens and typography; at `max-width: 760px`, collapse the two-card grid and metric columns to one column.

Update App:

```tsx
const LEGION_GROWTH = createLegionGrowthSnapshot();

<LegionGrowthPanel snapshot={LEGION_GROWTH} />;
```

Set the build badge to `0.5.0 · LEGION GROWTH`.

- [ ] **Step 4: Run Phase 5E local gates**

Run:

```powershell
pnpm.cmd exec vitest run apps/web/src/legion-growth apps/web/src/App.test.tsx
pnpm.cmd --filter @expedition/web build
pnpm.cmd test:e2e
```

Expected: render tests PASS, Vite build succeeds, one canvas renders, two promotion cards are visible, and page errors are empty.

- [ ] **Step 5: Commit the Web vertical slice**

```powershell
git add apps/web/src apps/web/e2e/battlefield.spec.ts
git commit -m "feat: display dual legion growth paths"
```

---

### Task 10: Full Verification, Review Record, and Cloudflare Pages Deployment

**Files:**

- Create: `docs/reviews/phase-05-legion-growth-validation.md`

**Interfaces:**

- Consumes: all Phase 5 commits.
- Produces: reproducible local, browser, and deployment proof.

- [ ] **Step 1: Run the complete repository gate**

Run:

```powershell
pnpm.cmd check
pnpm.cmd test:e2e
```

Expected:

- TypeScript strict build succeeds.
- ESLint succeeds.
- Prettier check succeeds.
- dependency-cruiser succeeds.
- Knip succeeds.
- Vitest succeeds.
- All package and app builds succeed.
- Playwright succeeds with one PixiJS canvas and two promotion cards.

- [ ] **Step 2: Review the final diff against the approved design**

Run:

```powershell
git diff --check 18def52..HEAD
git diff --stat 18def52..HEAD
git status --short
```

Expected: no whitespace errors and no unrelated changes.

- [ ] **Step 3: Write the verification record**

Create `docs/reviews/phase-05-legion-growth-validation.md` with:

- The exact commit range.
- Commands and exit status.
- Vitest and Playwright test counts.
- Proof that infantry defense pressure rises and distance falls.
- Proof that archer attack pressure and distance rise while frontal defense falls.
- Proof that treatment and reinforcement preserve formation limits.
- A deployment section stating that live evidence will be appended after the verified source commit is deployed.

- [ ] **Step 4: Commit the verification record before deployment**

```powershell
git add docs/reviews/phase-05-legion-growth-validation.md
git commit -m "docs: verify phase 5 legion growth"
```

- [ ] **Step 5: Build and deploy the committed source**

Run:

```powershell
$phaseSha = git rev-parse HEAD
pnpm.cmd --filter @expedition/web build
npx.cmd wrangler pages deploy apps/web/dist --project-name ai-expedition-legion-rpg --branch main --commit-hash $phaseSha --commit-message "Phase 5 legion growth"
```

Expected: Wrangler returns a successful deployment for `ai-expedition-legion-rpg`.

- [ ] **Step 6: Verify production behavior**

Verify:

- `https://ai-expedition-legion-rpg.pages.dev/` returns HTTP 200.
- The generated JavaScript asset returns HTTP 200.
- The live browser shows build `0.5.0 · LEGION GROWTH`.
- The live browser shows `重盾衛隊` and `獵獸射手`.
- The live browser contains one canvas and no console errors.

- [ ] **Step 7: Append deployment evidence and commit the final record**

Update only the deployment evidence fields in `docs/reviews/phase-05-legion-growth-validation.md`, then run:

```powershell
git add docs/reviews/phase-05-legion-growth-validation.md
git commit -m "docs: record phase 5 deployment"
```

Expected: clean working tree and a reproducible Phase 5 deployment record.
