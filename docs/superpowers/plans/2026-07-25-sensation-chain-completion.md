# Sensation Chain Completion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `executing-plans` inline. Project policy
> prohibits subagent-driven development unless the user explicitly requests delegation.

**Goal:** Turn the existing Guild RPG into one uninterrupted engine-building power fantasy:
understand the hunt, compose a lethal route, preview it, release escalating destruction, collect a
small set of meaningful drops, equip the best owner, and immediately replay with a stronger engine.

**Architecture:** Deterministic preview and reward decisions remain pure functions in
`simulation-core`; declarative fantasy, signature-route, hunt, and equipment links live in
`game-data`; React only presents derived state and dispatches intent. Playback may exaggerate timing,
motion, sound-ready cues, and screen impact but never owns battle outcomes.

**Tech Stack:** TypeScript, React 19, Vitest, CSS, pnpm workspace, Cloudflare Pages.

## Global Constraints

- Optimize only for clarity, continuity, strategic linkage, and sensation; do not introduce balance
  work, scarcity gates, new currencies, or long-term progression systems.
- Preserve free-form commands, deterministic simulation, the three existing builds, and the
  360–430 px right-thumb interaction contract.
- Keep preview failure non-blocking, reduced motion state-complete, and skip at full climax.
- Preserve uncommitted `AGENTS.md` and `docs/AI_DEVELOPMENT_SPEC.md`.
- Use affected tests while implementing, then one consolidated review and one `pnpm check`.

## Shared Contract Shape

```ts
interface BuildDefinition {
  fantasy: string;
  payoffLabel: string;
  signatureCardIds: readonly string[];
  accent: string;
}
interface ComboCommandPreview {
  eventCount: number;
  totalDamage: number;
  defeatedEnemyIds: readonly string[];
  overkill: number;
  milestones: readonly ("multi-kill" | "chain-wipe" | "annihilation" | "chest")[];
}
previewComboCommand(input: PreviewComboCommandInput): ComboCommandPreview
```

---

### Task 1: See the Destruction Route Before Release

**Player outcome:** Every hunt and battle explains the selected engine, enemy pressure, execution
target, signature route, predicted damage/kills/Overkill, reward ladder, and next useful card.

**Files:**

- Modify: `packages/shared-types/src/guild-rpg/combo/content.ts`, `hunt.ts`
- Modify: `packages/game-data/src/guild-rpg/combo/builds.ts`, `hunts.ts`, `validate-content.ts`
- Create: `packages/simulation-core/src/guild-rpg/combo/preview-command.ts`
- Modify: `packages/simulation-core/src/guild-rpg/combo/combo.test.ts`, `index.ts`
- Create: `apps/web/src/guild-rpg/presentation/battle-sensation-model.ts`
- Modify: `BattleScreen.tsx`, `BattleUnitCard.tsx`, `CommandComposer.tsx`,
  `BattleThumbControls.tsx`, `battle.css`, `battle-command.css`, mobile battle CSS and tests

- [x] Write failing core/content/presenter tests for clone-safe preview, milestones, build identity,
      pressure labels, guard/counter context, signature progress, and next-card guidance.
- [x] Run the focused tests and verify RED for missing behavior, not syntax.
- [x] Add the minimal metadata, preview resolver, presentation model, battle cockpit, execution-target
      treatment, and forecast panels; preview exceptions must leave compose/release usable.
- [x] Re-run focused core/data/web tests and verify GREEN.
- [x] Review the player-visible Task 1 chain once, fix findings, and commit.

### Task 2: Release Into an Escalating Annihilation

**Player outcome:** Stack, trigger, break, Overkill, and Annihilation read as a rising sequence;
natural acceleration and layered impact make the same deterministic event stream feel explosive.

**Files:**

- Modify: `apps/web/src/guild-rpg/playback/playback-model.ts` and tests
- Modify: `apps/web/src/guild-rpg/hooks/use-combo-playback.ts`
- Modify: `ComboPlayback.tsx`, `ComboPlaybackScreen.tsx`, `BattleUnitCard.tsx`
- Modify: battle/playback CSS and `combo-flow-contract.test.tsx`

- [x] Write failing model/component tests for all five stages, event-aware acceleration, current
      impact, kill/Overkill/annihilation cues, climax-preserving skip, and reduced-motion semantics.
- [x] Run focused playback/component tests and verify RED.
- [x] Derive presentation stages from emitted events, add layered hit/guard-break/kill/Overkill
      emphasis, accelerate dense chains, and preserve final projection when skipped.
- [x] Re-run focused tests and verify GREEN.
- [x] Review the player-visible Task 2 chain once, fix findings, and commit.

### Task 3: Turn Loot Into the Next Engine

**Player outcome:** A wipe produces one exclusive decision per defeated enemy plus one chest,
deterministic affixes, an obvious best owner and full before/after effect, then a replay prompt that
states what rule just joined the engine.

**Files:**

- Modify: `packages/shared-types/src/guild-rpg/hunt.ts`, equipment contracts
- Modify: `packages/game-data/src/guild-rpg/combo/hunts.ts`
- Modify: `calculate-hunt-rewards.ts` and tests, `resolve-item-choice.ts`
- Create: `apps/web/src/guild-rpg/presentation/equipment-sensation-model.ts`
- Modify: `EquipmentCard.tsx`, `RewardScreen.tsx`, `GuildScreen.tsx`, reward/guild CSS
- Modify: reducer, golden-flow, storage, presenter, component, and mobile contract tests

- [x] Write failing reward/presenter/reducer/UI tests for bounded decision drops, rarity affix counts,
      source/build/rule links, best-owner default, full comparison, activated-rule feedback, records,
      and one-tap replay cue.
- [x] Run focused tests and verify RED.
- [x] Generate one item per eligible enemy and one annihilation chest, select affixes from the
      existing catalog deterministically, enrich equipment presentation, and close the guild loop.
- [x] Re-run all Guild RPG tests and verify GREEN.
- [x] Perform one consolidated requirements review, fix findings, rerun focused verification,
      commit, then run `pnpm check` once.

### Task 4: Production Proof

**Player outcome:** The complete sensation chain works at 375×812, 390×844, and desktop in the
committed production build without dead ends, obscured controls, unclear next actions, or stale
assets.

- [x] Build and serve the exact commit; inspect all three viewports and reduced motion through the
      complete hunt → release → loot → equip → replay flow.
- [x] Fix only blocking chain regressions, rerun affected tests and `pnpm check` if source changed.
- [x] Push the branch, deploy the exact commit to Cloudflare Pages, and verify deployment ID, live
      asset/hash, HTTP response, and the production player flow.
