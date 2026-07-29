# Causal Combat Player Experience Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace high hidden combat values and automatic relay damage with a readable low-base, condition-driven six-hero chain whose interface, animation, onboarding, and loot all expose the same causal result.

**Architecture:** `simulation-core` remains the only authority for values, trigger gates, status snapshots, causal events, and previews. Shared types carry quality and trace data; game data supplies only 1–5 content; React progressively reveals the resolved preview; Pixi stages those events without deciding outcomes.

**Tech Stack:** TypeScript 6, React 19, PixiJS 8, Vitest 4, Playwright 1.61, Vite 8, Cloudflare Pages.

## Global Constraints

- Base attack/defense/speed/healing is 1; quality and atomic strengths are integers 1–5; no damage multiplication or `Math.random`.
- Secondary fused components execute only when their pre-cast condition is ready; the first component always performs its base action.
- Preview and playback consume the exact formal simulation result; UI and Pixi never recalculate battle outcomes.
- Battle is one `100dvh` screen at 375/390/430px; no page scroll, overlapping unit labels, or `damage × hits` notation.
- Preserve modified `AGENTS.md` and `docs/AI_DEVELOPMENT_SPEC.md`; use affected tests, one consolidated review, one `pnpm.cmd check`, and one managed `pnpm.cmd test:e2e`.

## File Map

- Shared contracts: `packages/shared-types/src/guild-rpg/{skill-build,equipment,profile}.ts`.
- Data and rolls: `packages/game-data/src/guild-rpg/{adventurers,equipment}.ts`, `campaign/*.ts`, `skill-build/*.ts`, `packages/simulation-core/src/guild-rpg/{skills/create-owned-skill,rewards/create-hunt-equipment-item}.ts`.
- Save migration: `packages/simulation-core/src/guild-rpg/progression/migrate-profile-v5.ts`, `profile/create-profile.ts`, `apps/web/src/guild-rpg/storage/guild-save.ts`.
- Resolution and preview: `packages/simulation-core/src/guild-rpg/skills/{resolve-skill,resolve-skill-component,preview-skill-outcome,preview-trigger-readiness}.ts`.
- Player surfaces: `apps/web/src/guild-rpg/components/{BattleScreen,BattleFocusHud,SixSkillControls,SkillOutcomePreviewPanel,RewardScreen}.tsx`, `presentation/skill-tile-presentation.ts`, `onboarding/first-hunt-coach.ts`, `guild-combat.css`, `guild-rewards.css`.
- Spectacle: `apps/web/src/guild-rpg/presentation/combat-beats.ts`, `hooks/use-combat-playback.ts`, `packages/pixi-renderer/src/guild-combat/{combat-effect-plan,mount-guild-combat-stage}.ts`.
- Tests: colocated Vitest files plus `apps/web/e2e/guild-rpg-release.spec.ts`.

### Task 1: Low atomic values appear in real battles and loot

**Produces:**

```ts
export type QualityRank = 1 | 2 | 3 | 4 | 5;
interface SkillComponent {
  qualityRank: QualityRank;
  power: QualityRank;
  layerStrength: QualityRank;
  triggerAddition: QualityRank;
  repeatCount: number;
}
interface EquipmentItem {
  qualityRank: QualityRank;
}
interface GuildProfile {
  version: 5;
}
const rankForRarity: Record<GuildItemRarity, QualityRank> = {
  common: 1,
  uncommon: 2,
  rare: 3,
  epic: 4,
  legendary: 5,
};
```

- [ ] Add failing content/reward/profile/storage tests requiring six heroes to use `{ attack: 1, defense: 1, speed: 1, healing: 1 }`, enemy attack/defense 1–5, starter skill rank 1, equipment main value equal to rarity rank, and exactly one skill drop.
- [ ] Run the affected `game-data`, reward, profile, and storage Vitest files; require failures on old values/version.
- [ ] Add `QualityRank`, clamp every skill roll/core/affix to `1..qualityRank`, make weapon/armor/accessory main values equal `rankForRarity[rarity]`, and normalize campaign HP separately from attack/defense.
- [ ] Implement `migrateProfileV5(value, content)` with `toRank(value,min,max) = clamp(1,5,1 + round(4*(value-min)/max(1,max-min)))`; preserve stars, components, inventory, order, IDs, and write v4 source to `expedition:guild-rpg:v4:backup`.
- [ ] Rerun focused tests; require exact 1–5 assertions and lossless v1–v4 migration PASS.

### Task 2: Only real conditions create additive combo damage

**Consumes:** `QualityRank`, v5 components. **Produces:**

```ts
type ComponentGate = { componentId: string; baseAction: boolean; triggerReady: boolean };
const openingHit = (attack: number, power: number, defense: number) =>
  Math.max(1, attack + power - defense);
const followUpHit = (strength: number) => Math.max(1, Math.min(5, strength));
```

- [ ] Add failing `resolve-skill`/trigger-matrix tests proving: opening common naked damage ≤4; secondary unready components emit nothing; a skill cannot create then read its own status; weaken affects only later hits; strengthened clears after one eligible event; no free relay damage; 100+ damage has causal ancestors from at least three actors.
- [ ] Run those tests and require failures against unconditional components, pre-hit weaken, persistent strengthen, and relay echoes.
- [ ] Snapshot battle/status/readiness once before casting; let component 1 perform its base action but gate its trigger bonus, skip components 2–3 unless ready, and apply actor/equipment attack only to the first hit.
- [ ] Reorder each component to base hit → specialization/status → eligible trigger/core children; cap every child event at its 1–5 source, consume one chase budget per component, clear used strengthen, and delete automatic relay/finisher damage while retaining non-damaging relay markers.
- [ ] Give all emitted damage/reaction/status/core events stable `causalId`, `parentCausalId`, `actorId`, and `componentId`; rerun focused tests and require PASS.

### Task 3: A player understands the next link without reading formulas

**Produces:**

```ts
interface SkillOutcomePreview {
  totalDamage: number;
  damageSegments: number;
  comboSteps: readonly {
    componentId: string;
    readiness: TriggerReadiness;
    missingStatus?: StatusLayer;
    eventIds: readonly number[];
  }[];
  nextRelays: readonly { actorId: string; readySkillIds: readonly string[] }[];
}
```

- [ ] Add failing preview/presentation/component/onboarding tests requiring six tiles to show name, element, total, hit pips, status delta, 1–3 lit/dim nodes, and no formula/`×`; selected preview must expose HP ghost loss, route, status change, and newly lit next actors/skills.
- [ ] Run focused Web and preview tests; require failures for missing nodes, next-relay map, and causal tutorial.
- [ ] Derive preview fields only from `resolveSkill()` events and pre-cast readiness; render default, selected, and expanded-detail layers without duplicating calculations.
- [ ] Keep direct battlefield selection and two-tap casting; anchor HP/name/status to unit bases, place preview between battlefield and skill grid, focus the default next actor after cast, and light every alternative actor that can continue the chain.
- [ ] Replace relay-number tutorial copy with one causal path: target → low hit/status → lit next skill → trigger node → layer spend → loot/new link; rerun focused tests and require PASS.

### Task 4: Real causal depth controls spectacle and reward readability

- [ ] Add failing beat/Pixi/reward tests requiring cause-linked beats, sequential per-hit numbers plus one final total, relay-depth stages 1–6, reduced-motion evidence, and a 4×5 rarity-framed loot grid whose selected detail explains newly enabled skill links.
- [ ] Run focused beat, renderer, and `RewardScreen` tests; require failures on non-causal relay spectacle or power-only recommendations.
- [ ] Compute visual depth from distinct causal actors/parents, not turn index; stage hit → trail → reaction → short shake → battlefield pressure → stored-event finisher, group middle events, and cap the final presentation at 2 seconds with tap-to-accelerate.
- [ ] Rank loot recommendations by newly ready equipped skills/routes before fixed values; keep materials in one top strip, one skill drop in the same 20-slot grid, rarity frame separate from element icon, and details closed by default.
- [ ] Rerun focused tests and require PASS, including reduced motion and color-independent labels.

### Task 5: Consolidated mobile release gate

- [ ] Extend `guild-rpg-release.spec.ts` to play the causal tutorial at 390×844, switch target and actor, preview then cast, complete a three-actor link and six-actor finisher, inspect one of 20 rewards, migrate v4, and assert no page scroll/label overlap at 375×667, 390×844, and 430×932.
- [ ] Run affected Vitest files, review the complete diff once against the approved spec, fix findings, and rerun only affected checks.
- [ ] Run `pnpm.cmd check`; require typecheck, lint, formatting, architecture, dead-code, unit tests, and all builds PASS.
- [ ] Run `pnpm.cmd test:e2e`; require all managed E2E cases PASS, then verify port 4173 is closed before any retry.
- [ ] Commit the intended batch as `feat: rebuild combat around visible causal chains`; push `codex/project-expedition-mvp`, deploy that exact commit to Cloudflare Pages, and verify canonical live HTTP, DOM interaction, console, 390×844 geometry, and asset commit identity.
