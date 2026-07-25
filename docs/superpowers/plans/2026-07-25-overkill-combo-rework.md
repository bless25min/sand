# Overkill Combo Rework Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `executing-plans` inline. Project policy
> prohibits subagent-driven development unless the user explicitly requests delegation.

**Goal:** Replace the shallow gauge battle with a complete free-form command combo, Overkill,
Annihilation, exclusive loot, build progression, and loot-rain replay loop.

**Architecture:** A deterministic combo kernel resolves typed data from a bounded content grammar.
React composes commands and plays emitted events; it never decides combat or loot. About 90% of
content is declarative, while rare legendary rules use isolated tested pure handlers.

**Tech Stack:** TypeScript, React, Vitest, fast-check, CSS, versioned localStorage.

## Global Constraints

- No global mana, energy, card-cost ladder, `Math.random`, or React-owned battle outcomes.
- Work in `guild-rpg`; preserve prior prototypes and the existing right-thumb shell.
- Split by testability and responsibility; no feature file may become a generic dumping ground.
- Run only affected tests during batches, then one consolidated `pnpm check`.
- Preserve uncommitted `AGENTS.md` and `docs/AI_DEVELOPMENT_SPEC.md`.

## Shared Contract Shape

```ts
type CardCatalog = Readonly<Record<string, ComboCardDefinition>>;
type RuleCatalog = Readonly<Record<string, ComboRuleDefinition>>;
interface CommandDraft {
  cardIds: readonly string[];
}
interface CompiledCommand {
  cardIds: readonly string[];
  diagnostics: readonly string[];
}
interface ComboContent {
  cards: CardCatalog;
  rules: RuleCatalog;
  builds: readonly BuildDefinition[];
}
interface CompiledBuild {
  cardIds: readonly string[];
  ruleIds: readonly string[];
}
interface TriggerQueueInput {
  battle: GuildBattleState;
  command: CompiledCommand;
  rules: RuleCatalog;
}
interface TriggerQueueResult {
  battle: GuildBattleState;
  events: readonly ComboEvent[];
  infinite: boolean;
}
interface HuntRewardInput {
  profile: GuildProfile;
  battle: GuildBattleState;
  hunt: HuntDefinition;
}
```

---

### Task 1: Playable Free-Form Command Release

**Player outcome:** Arrange cards from three heroes, release once, and watch a causal uninterrupted
combo damage training enemies while those enemies pressure the party during composition.

**Files:**

- Create: `packages/shared-types/src/guild-rpg/combo/content.ts`
- Create: `packages/shared-types/src/guild-rpg/combo/runtime.ts`
- Create: `packages/simulation-core/src/guild-rpg/combo/compile-command.ts`
- Create: `packages/simulation-core/src/guild-rpg/combo/resolve-command.ts`
- Create: `packages/simulation-core/src/guild-rpg/combo/advance-composition.ts`
- Create: `packages/simulation-core/src/guild-rpg/combo/combo.test.ts`
- Create: `packages/game-data/src/guild-rpg/combo/cards.ts`
- Create: `apps/web/src/guild-rpg/components/CommandComposer.tsx`
- Create: `apps/web/src/guild-rpg/components/ComboPlayback.tsx`, `state/reduce-combo-action.ts`
- Modify: guild-rpg type/data/simulation indexes, `game-reducer.ts`, `BattleScreen.tsx`

**Interfaces:**

```ts
compileCommand(draft: CommandDraft, cards: CardCatalog): CompiledCommand
resolveCommand(battle: GuildBattleState, command: CompiledCommand, rules: RuleCatalog): GuildBattleState
advanceComposition(battle: GuildBattleState, elapsedMs: number): GuildBattleState
```

- [x] Write tests for tag prerequisites, causal event order, no universal cost, 0.25x enemy pressure,
      full resolution after lethal damage, and deterministic identical inputs.
- [x] Run `pnpm vitest run packages/simulation-core/src/guild-rpg/combo/combo.test.ts`; verify RED.
- [x] Add the minimal contracts, 12 cards, compiler, resolver, pressure step, reducer actions, composer,
      and playback required by those tests and the mobile interaction contract.
- [x] Re-run the combo and guild-rpg component/reducer tests; verify GREEN.
- [x] Perform one Task 1 review, fix findings, run the affected tests, and commit the batch.

### Task 2: Three Build Engines and Content Factory

**Player outcome:** Switch among retaliation, ricochet annihilation, and healing-overflow builds;
equipment visibly changes the command graph and resulting chain.

**Files:**

- Create: `packages/shared-types/src/guild-rpg/combo/rules.ts`
- Create: `packages/simulation-core/src/guild-rpg/combo/effect-registry.ts`, `effects/resolve-damage-effect.ts`, `effects/resolve-routing-effect.ts`
- Create: `packages/simulation-core/src/guild-rpg/combo/resolve-trigger-queue.ts`
- Create: `packages/simulation-core/src/guild-rpg/combo/infinite-engine.ts`
- Create: `packages/simulation-core/src/guild-rpg/combo/rules.test.ts`
- Create: `packages/game-data/src/guild-rpg/combo/rules.ts`
- Create: `packages/game-data/src/guild-rpg/combo/builds.ts`
- Create: `packages/game-data/src/guild-rpg/combo/validate-content.ts`
- Create: `apps/web/src/guild-rpg/dev/BuildWorkbench.tsx`
- Modify: equipment/profile contracts, content indexes, guild preparation and inventory UI

**Interfaces:**

```ts
resolveTriggerQueue(input: TriggerQueueInput): TriggerQueueResult
validateComboContent(content: ComboContent): readonly ContentDiagnostic[]
compileBuild(profile: GuildProfile, content: ComboContent): CompiledBuild
```

- [x] Write tests for trigger/selector/transform vocabulary, the three anchor builds, equipment graph
      changes, invalid content diagnostics, causal-cycle conversion, and `Infinite Engine`.
- [x] Run the focused rules/content/profile tests; verify RED.
- [x] Implement the bounded registry, declarative rules, three build loadouts, content validator,
      profile selection, and development workbench without adding per-item UI logic.
- [x] Re-run affected core, data, profile, reducer, and component tests; verify GREEN.
- [x] Perform one Task 2 review, fix findings, run the affected tests, and commit the batch.

### Task 3: Overkill, Annihilation, and Loot Rain

**Player outcome:** Failure yields materials only; kills unlock exclusive equipment; individual
Overkill raises quality, while multi-kill, Chain Wipe, Annihilation, and Perfect Annihilation stack
quantity and jackpot rewards before loot scatters across the result screen.

**Files:**

- Create: `packages/shared-types/src/guild-rpg/hunt.ts`
- Create: `packages/simulation-core/src/guild-rpg/rewards/calculate-hunt-rewards.ts`
- Create: `packages/simulation-core/src/guild-rpg/rewards/calculate-hunt-rewards.test.ts`
- Create: `packages/game-data/src/guild-rpg/combo/hunts.ts`
- Create: `apps/web/src/guild-rpg/components/LootRain.tsx`
- Create: `apps/web/src/guild-rpg/components/HuntResultSummary.tsx`, `state/reduce-hunt-result.ts`
- Modify: profile/reward contracts, reward generation, reducer, save adapter, reward UI and CSS

**Interfaces:**

```ts
calculateHuntRewards(input: HuntRewardInput, random: RandomSource): HuntRewards
```

- [x] Write tests for material-only failure, kill-gated tables, enemy-specific items, every reward
      axis, shared post-kill Overflow, deterministic rarity, save migration, and no lost overflow.
- [x] Run focused reward/storage tests; verify RED.
- [x] Implement hunt reward math, materials, exclusive rule-bearing items, reward transitions,
      migration, result summary, batched loot rain, and item decisions.
- [x] Re-run reward, profile, storage, reducer, and reward-component tests; verify GREEN.
- [x] Perform one Task 3 review, fix findings, run the affected tests, and commit the batch.

### Task 4: Complete Strong Hunt and Replay Experience

**Player outcome:** Farm a boss with guards using all three builds, risk longer composition under
enemy pressure, achieve one-command annihilation, equip the drops, and replay for visibly better
Overkill and loot efficiency on mobile or desktop.

**Files:**

- Create: `packages/simulation-core/src/guild-rpg/combo/golden-hunt.test.ts`
- Create: `apps/web/src/guild-rpg/components/combo-flow-contract.test.tsx`
- Modify: combo hunt data, battle/reward/guild components, presenters, reducer, save, mobile CSS
- Modify: `docs/superpowers/plans/2026-07-25-overkill-combo-rework.md`

- [ ] Write the golden-flow and UI contract tests for three successful engines, strong enemy
      pressure, early safe release, full wipe, exclusive loot, rebuild, replay, and persistence.
- [ ] Run the focused golden-flow and UI tests; verify RED.
- [ ] Complete boss/guard behaviors, counter traits, trace presentation, responsive right-thumb
      controls, playback escalation, accessibility, reduced motion, and replay statistics.
- [ ] Re-run all guild-rpg tests; verify GREEN, then perform one consolidated requirements review.
- [ ] Fix review findings, run `pnpm check` once, and manually verify 375x812, 390x844, and desktop.
- [ ] Commit the complete reviewed rework while excluding the two protected user-modified files.
