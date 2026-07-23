# Batch 04 Plan — Loot, Inventory, and Hornplate Shield

Date: 2026-07-23  
Scope: TASK-009 and TASK-010  
Method: TDD, vertical slices, functional core / imperative shell

## Outcome

Complete the first deterministic progression loop:

```text
Greyfang defeat
→ positioned loot
→ battlefield recovery
→ inventory
→ retreat loss
→ hornplate shield crafting
→ heavy infantry equipment
→ next-battle defense, weight, movement, and appearance change
```

## Module Boundaries

### `packages/shared-types`

Data contracts only:

- material IDs and definitions;
- positioned loot drops;
- inventory stacks and state;
- retreat outcome;
- equipment definitions and crafting recipes;
- unit loadout fields required by simulation and rendering.

No formulas, storage, UI, or package implementation dependencies.

### `packages/game-data`

Static, validated MVP definitions:

- wolf pelt;
- monster fang;
- horn plate;
- hornplate shield recipe;
- hornplate shield equipment trade-offs.

No mutable inventory and no combat calculation.

### `packages/simulation-core`

Battle facts:

- seeded Greyfang loot generation;
- contact-aware unit combat snapshots;
- actual frontal-defense use in local pressure.

No inventory ownership, crafting, React, or PixiJS.

### `packages/progression-core`

Progression rules:

- empty inventory creation;
- battlefield recovery under radius and weight constraints;
- deterministic retreat loss;
- recipe validation and crafting;
- equipment eligibility and stat application.

All functions are pure and return new state.

### `packages/pixi-renderer`

Visual projection only:

- map `HORNPLATE_SHIELD` appearance to a distinct point style;
- never calculate crafting success or combat modifiers.

### `apps/web`

Composition and presentation:

- assemble one deterministic MVP loop snapshot;
- feed equipped appearance into the battlefield;
- show drop, recovery, crafting, and before/after battle effects.

## TDD Sequence

1. Add shared contracts and update the unit fixture.
2. Test and implement material/equipment/recipe data.
3. Test and implement seeded positioned Greyfang loot.
4. Test and implement recovery into a weight-limited inventory.
5. Test and implement deterministic retreat loss.
6. Test and implement hornplate shield crafting.
7. Test and implement heavy-infantry equipment application.
8. Test and implement frontal combat snapshot behavior.
9. Test and implement hornplate visual style projection.
10. Compose the deterministic loop in the web application.
11. Add browser assertions for progression evidence and appearance.

## Acceptance Tests

- Identical seed and battle result produce identical loot IDs, quantities, and
  positions.
- Generated drops include wolf pelt and monster fang; horned alpha defeat adds
  horn plate.
- Recovery only collects reachable material that fits capacity.
- Unrecovered drops remain positioned on the battlefield.
- Emergency retreat loses more inventory than normal retreat; rout loses more
  than emergency retreat.
- Crafting consumes the exact recipe and adds one equipment instance.
- Insufficient materials cannot mutate inventory.
- Hornplate shield rejects non-heavy-infantry units.
- Equipping the shield increases frontal defense and equipment weight, reduces
  mobility, and records its appearance ID.
- Frontal contact uses the increased frontal defense; flank contact does not.
- The next movement step is shorter with the shield equipped.
- The point cloud uses the hornplate appearance without importing progression
  or simulation rules.
- Unit, architecture, dead-code, type, lint, format, build, and Playwright gates
  pass.

## Exit Gate

The batch is complete only when a test demonstrates the whole causal chain:

```text
seeded drop
→ recovered ingredients
→ crafted shield
→ equipped heavy infantry
→ greater frontal pressure resistance
→ slower movement
→ distinct battlefield point style
```
