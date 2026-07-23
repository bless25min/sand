# Batch 04 Validation — Loot, Inventory, and Hornplate Shield

Date: 2026-07-23  
Scope: TASK-009 and TASK-010

## Delivered

- Seeded Greyfang loot generation for wolf pelt, monster fang, and horn plate.
- Stable loot IDs, quantities, rarity, source, and battlefield positions.
- Radius- and weight-limited post-battle recovery with partial collection.
- Inventory state and deterministic normal, emergency, and rout loss.
- Static material, recipe, and hornplate shield definitions.
- Pure crafting and heavy-infantry equipment application.
- Contact-aware frontal defense and actual local-pressure calculation.
- Movement penalties from both reduced mobility and increased equipment weight.
- Renderer-owned hornplate visual style projection.
- A responsive player-facing causal-chain panel from drop through next battle.

## Causal Evidence

The deterministic MVP loop test proves:

```text
greyfang-mvp-loot seed
→ 13 wolf pelts + 11 monster fangs + 2 horn plates recovered
→ recipe materials consumed
→ hornplate-heavy-shield created
→ first heavy infantry equipped
→ frontal defense 10 → 16
→ frontal defending pressure 11,000 → 17,600
→ mobility 2.0 → 1.6 and equipment weight 0 → 3
→ next movement step becomes shorter
→ point style changes from blue to hornplate bronze
```

## Automated Evidence

- `pnpm check`: passed.
  - TypeScript production and test projects: passed.
  - ESLint and Prettier: passed.
  - Dependency Cruiser: 123 modules and 276 dependencies, no violations.
  - Knip: no unused files, exports, or dependencies.
  - Vitest: 35 files, 96 tests, all passed.
  - All nine buildable workspace projects: passed.
- `pnpm test:e2e`: one WebGL and progression-loop scenario passed.

Wrangler could not write its optional debug log outside the workspace sandbox.
Worker type generation and deployment dry-run still completed with exit code 0.
No production deployment was requested or performed.

## Browser Evidence

- 1,280 × 900 desktop viewport:
  - one WebGL canvas;
  - 2,000 visual points;
  - visible hornplate heavy formation;
  - four-stage progression panel.
- 390 × 844 mobile viewport:
  - document width equals viewport width;
  - no horizontal overflow;
  - complete battlefield and progression evidence;
  - console warning/error list is empty.

## Boundary Evidence

- `simulation-core` owns seeded drops and battle effects.
- `progression-core` accepts material and equipment definitions as inputs and
  has no production dependency on `game-data`.
- `game-data` owns Greyfang-specific content only.
- `pixi-renderer` maps appearance IDs without importing simulation or
  progression rules.
- `apps/web` is the only layer that composes all four concerns.
