# Deterministic Six-Hero Loot Build Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the three-hero eight-card command prototype with the approved deterministic six-hero loot RPG, then perform one consolidated review, full verification, push, and deployment.

**Architecture:** Stable contracts live in `shared-types`, authored grammar and drop pools in `game-data`, and all battle/progression outcomes in pure `simulation-core`. React renders four permanent pages and traceable events; seeded `RandomSource` owns every loot roll.

**Tech Stack:** TypeScript 6, React 19, Vite 8, Vitest 4, Playwright, pnpm workspaces, Cloudflare Pages.

## Global Constraints

- Authority: `docs/superpowers/specs/2026-07-27-deterministic-six-hero-loot-build-design.md`.
- One player-visible batch; direct TDD; affected tests during work; one consolidated `pnpm check` and `pnpm test:e2e` after source settles.
- Six heroes, six always-available skills each, three equipment slots each, default order plus current-round reordering.
- Exactly three elements, six specializations, thirty trigger conditions; no Build gate, draw pile, random cooldown, standalone gem, character-level growth, `Math.random`, or player damage multiplier.
- Preserve the user's existing `AGENTS.md` and `docs/AI_DEVELOPMENT_SPEC.md` edits.
- Prefer one implementation commit and, only if review finds issues, one review-fix commit.

---

### Task 1: Version-4 contracts and authored grammar

**Files:**
- Create: `packages/shared-types/src/guild-rpg/skill-build.ts`
- Modify: `packages/shared-types/src/guild-rpg/{content,equipment,battle-state,profile,game-state,index}.ts`
- Create: `packages/game-data/src/guild-rpg/skill-build/{attributes,specializations,triggers,skill-forms,equipment-cores,validate}.ts`
- Modify: `packages/game-data/src/guild-rpg/{adventurers,equipment,index}.ts`
- Test: `packages/game-data/src/guild-rpg/skill-build/skill-build-content.test.ts`

**Interfaces:**
- Produce `GuildElement`, `SkillSpecialization`, `TriggerCondition`, `SkillComponent`, `OwnedSkill`, `FusedSkill`, `StatusLayers`, `RoundOrder`, and v4 `GuildProfile`.
- `ELEMENTS.length === 3`, `SPECIALIZATIONS.length === 6`, `TRIGGERS.length === 30`; the validator enumerates all 540 one-star structures.

- [ ] Write failing content tests for exact counts, unique IDs, six adventurers, six legal starter skills each, three equipment slots, integer roll ranges, and all 540 structures.
- [ ] Run `pnpm vitest run packages/game-data/src/guild-rpg/skill-build/skill-build-content.test.ts`; expect failures for missing v4 contracts/catalogs.
- [ ] Add focused contracts/catalogs, export them through package indexes, replace three-role unions with six stable adventurer IDs, and keep every file single-purpose.
- [ ] Re-run the focused test; expect all assertions to pass.

### Task 2: Deterministic status, trigger, fusion, and immediate relay engine

**Files:**
- Create: `packages/simulation-core/src/guild-rpg/skills/{resolve-skill,resolve-trigger,resolve-element-reaction,resolve-target-route}.ts`
- Create: `packages/simulation-core/src/guild-rpg/round-order/{create-round-order,choose-next-adventurer,complete-turn}.ts`
- Create: `packages/simulation-core/src/guild-rpg/skills/{skill-engine,trigger-matrix}.test.ts`
- Modify: `packages/simulation-core/src/guild-rpg/combo/{calculate-hunt-damage,infinite-engine}.ts`
- Modify: `packages/simulation-core/src/guild-rpg/profile/{create-profile,start-quest}.ts`
- Modify: `packages/simulation-core/src/guild-rpg/index.ts`

**Interfaces:**
- `resolveSkill({ battle, actorId, skillId, targetId, content }): { battle, events }` resolves base clauses left-to-right, then queued triggers.
- `chooseNextAdventurer(order, actorId)` may move only an unacted living hero; actual position drives relay triggers.
- Damage is `max(0, base + skill + equipment + consumedLayers + additions - reduction)`; each repeat, bounce, or echo is a separate event.

- [ ] Write failing tests for fire/grass/water layers and reactions, six specializations, thirty triggers, additive damage, same-target echo, retarget, Overkill continuation, cycle collapse, six immediate actors, and current-round reorder/reset.
- [ ] Run `pnpm vitest run packages/simulation-core/src/guild-rpg/skills packages/simulation-core/src/guild-rpg/round-order`; expect missing-engine failures.
- [ ] Implement the event queue and round order, remove player multiplier paths, enforce one rule per causal source, and retain one always-legal base effect.
- [ ] Re-run focused tests plus `pnpm vitest run packages/simulation-core/src/guild-rpg/combo`; expect pass without NaN, negative overflow, or non-termination.

### Task 3: Loot, reversible fusion, equipment cores, forging, and save migration

**Files:**
- Create: `packages/simulation-core/src/guild-rpg/skills/{fuse-skills,replace-fused-component,dismantle-skill}.ts`
- Create: `packages/simulation-core/src/guild-rpg/progression/{generate-skill-drop,migrate-profile-v4}.ts`
- Modify: `packages/simulation-core/src/guild-rpg/rewards/{calculate-hunt-rewards,apply-rewards,create-hunt-equipment-item}.ts`
- Modify: `packages/simulation-core/src/guild-rpg/equipment/forge-equipment.ts`
- Test: `packages/simulation-core/src/guild-rpg/progression/v4-progression.test.ts`
- Modify/Test: `apps/web/src/guild-rpg/storage/{guild-save.ts,guild-save.test.ts}`

**Interfaces:**
- Fusion accepts two or three same-element owned skills, preserves component rolls/order, occupies one slot, supports single-component replacement, and dismantles back to exact components.
- Rewards emit 4–6 items from hunt-authored element/specialization/trigger pools; forge actions are `calibrate | reforge | lock | transplant | salvage`.
- Migration writes `expedition:guild-rpg:v4`, retains a v3 backup, adds three heroes, imports old cards/equipment/progress, and converts XP/levels to materials.

- [ ] Write failing tests for seeded drops, displayed integer ranges, reversible two/three-star fusion, no auto-sell, non-linear forge actions, and lossless v1/v2/v3 migration.
- [ ] Run the two focused test files; expect v4 and fusion failures.
- [ ] Implement progression and persistence; remove XP rewards, level stat scaling, linear upgrade, inventory auto-sell, and Build-selected loadouts.
- [ ] Re-run progression, reward, forge, profile, and save tests; expect deterministic pass.

### Task 4: Four-page RPG UI, six-skill combat, complete onboarding, and spectacle

**Files:**
- Create: `apps/web/src/guild-rpg/components/{TeamOrderPanel,SkillLoadoutPanel,SkillFusionWorkbench,SixSkillControls,TurnOrderRail}.tsx`
- Modify: `apps/web/src/guild-rpg/components/{GuildMobileStage,GuildScreen,BattleScreen,RewardScreen,Inventory,ForgeWorkbench}.tsx`
- Modify: `apps/web/src/guild-rpg/state/{game-reducer,reduce-combo-action}.ts`
- Rewrite/Test: `apps/web/src/guild-rpg/onboarding/{first-hunt-coach.ts,first-hunt-coach.test.ts}`
- Modify: `apps/web/src/guild-rpg/{guild-rpg,battle,mobile-battle,mobile-guild,rewards}.css`
- Modify: `apps/web/src/guild-rpg/presentation/{spectacle-registry,battle-sensation-model}.ts`
- Test: `apps/web/src/guild-rpg/components/deterministic-six-hero-flow.test.tsx`

**Interfaces:**
- Permanent navigation is `quest | party | skills | equipment`; fusion nests under skills and forge under equipment.
- Combat renders a 2×3 skill grid and six-portrait rail; tapping a skill immediately dispatches resolution, tapping an unacted portrait chooses the next actor.
- Coach advances only from real intents through navigation, order, loadout, equipment, hunt, target, skill, reorder, reward, fusion, equip, and replay.

- [ ] Write failing reducer/component/coach tests for the complete flow, trigger readiness, temporary order, reward actions, accessible 48px controls, and no single-button hidden interface.
- [ ] Run `pnpm vitest run apps/web/src/guild-rpg`; expect new-flow failures.
- [ ] Implement the four pages, reducer intents, readable cards, chain-gap previews, event-driven spectacle, compact coach, and responsive no-overlay layout.
- [ ] Re-run Guild RPG web tests; expect pass and no obsolete eight-card composer assertions.

### Task 5: Twelve target-farm hunts and production E2E

**Files:**
- Modify: `packages/game-data/src/guild-rpg/campaign/{frontier,deepmine,ember,storm,zones}.ts`
- Modify: `packages/game-data/src/guild-rpg/combo/{hunts,validate-content}.ts`
- Create: `apps/web/e2e/guild-rpg-release.spec.ts`
- Modify: `scripts/run-e2e.mjs`

- [ ] Write failing content/E2E assertions for twelve fire/grass/water hunts, public drop pools, guaranteed bosses, fresh-save onboarding, six-hero battle, reorder, reward, fusion, equip, replay, and v3 migration.
- [ ] Run affected content tests and `pnpm test:e2e`; expect failures before content/UI completion.
- [ ] Author the twelve pools and active-route E2E without using `?legacy=1`; keep legacy coverage separate.
- [ ] Re-run affected tests only; expect the complete player journey to pass locally.

### Task 6: One consolidated completion gate, commit, push, and deploy

- [ ] Audit every design bullet against source/tests, scan for stale Build/level/gem/multiplier UI paths, and fix only uncovered release requirements.
- [ ] Run one consolidated `pnpm check`, then one `pnpm test:e2e`; both must exit 0.
- [ ] Browser-check fresh v4 and migrated v3 flows at 375×667, 390×844, and desktop: zero crop, overlay, horizontal overflow, console error, dead end, duplicate reward, or trigger mismatch.
- [ ] Perform one consolidated code review; fix all Critical/Important findings and run one focused follow-up verification.
- [ ] Commit the complete source, push `codex/project-expedition-mvp`, deploy `apps/web/dist` to Cloudflare Pages, and verify immutable/canonical assets plus both production save flows.
