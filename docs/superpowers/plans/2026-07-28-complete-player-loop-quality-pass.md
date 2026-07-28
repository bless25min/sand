# Complete Player Loop Quality Pass Implementation Plan

> **For Codex:** Execute this plan with `executing-plans`, direct TDD, one consolidated review, and one final `pnpm check`.

**Goal:** Deliver a one-screen mobile RPG loop whose combat state follows its animation, whose skills explain their combo cause visually, and whose reward/preparation surfaces remain readable at full content density.

**Architecture:** Simulation-core remains authoritative for battle outcomes and exposes a deterministic playback projection. React selects the projected battle frame while Pixi renders compact unit HUDs. Reward and preparation screens use progressive disclosure: compact collections first, one selected detail drawer second.

**Tech:** TypeScript, React, PixiJS, Vitest, Playwright, Vite, Cloudflare Pages.

---

## Task 1: Simulation-owned combat playback

**Files:**

- Create: `packages/simulation-core/src/guild-rpg/battle/project-battle-playback.ts`
- Create: `packages/simulation-core/src/guild-rpg/battle/project-battle-playback.test.ts`
- Modify: `packages/simulation-core/src/guild-rpg/index.ts`
- Modify: `apps/web/src/guild-rpg/state/game-reducer.ts`
- Modify: `apps/web/src/guild-rpg/components/BattleScreen.tsx`
- Test: `apps/web/src/guild-rpg/components/deterministic-six-hero-flow.test.tsx`

1. Add failing simulation tests proving damage, healing, status, defeat, and final-frame state appear only when their event becomes visible.
2. Implement `projectBattlePlayback(before, final, events, visibleCount)` in simulation-core; apply additive event deltas and return the exact final battle on the last event.
3. Store `playbackStartBattle` when `USE_SKILL` resolves, project the displayed battle from playback cursor, and keep command input locked until playback completes.
4. Add a web test proving HP does not jump to the final value before the corresponding event.
5. Run: `pnpm vitest run packages/simulation-core/src/guild-rpg/battle/project-battle-playback.test.ts apps/web/src/guild-rpg/components/deterministic-six-hero-flow.test.tsx`

## Task 2: Compact battlefield HUD and causal skill controls

**Files:**

- Modify: `packages/pixi-renderer/src/guild-combat/draw-units.ts`
- Modify: `packages/pixi-renderer/src/guild-combat/combat-unit-hud.ts`
- Modify: `packages/pixi-renderer/src/guild-combat/combat-unit-hud.test.ts`
- Modify: `apps/web/src/guild-rpg/components/SixSkillControls.tsx`
- Modify: `apps/web/src/guild-rpg/components/SkillOutcomePreviewPanel.tsx`
- Modify: `apps/web/src/guild-rpg/components/BattleCommandDock.tsx`
- Modify: `apps/web/src/styles/guild-combat.css`

1. Add failing HUD tests for compact name/HP/status output and selected target preview without duplicate stat panels.
2. Render unit identity, HP bar, and status pips directly on each figure; remove overlapping button-like frames and long preview text.
3. Add a causal strip to the armed skill: element/status → specialization → trigger readiness → hits/damage. Keep formulas inside one optional detail drawer.
4. Preserve the interaction contract: first skill tap arms and previews; target tap casts; second tap casts on the current target.
5. Show relay escalation through animation/cue intensity rather than paragraphs.
6. Run affected Pixi and web component tests.

## Task 3: Twenty-item reward summary

**Files:**

- Modify: `apps/web/src/guild-rpg/components/RewardScreen.tsx`
- Modify: `apps/web/src/guild-rpg/state/game-reducer.ts`
- Modify: `apps/web/src/styles/guild-rewards.css`
- Create: `apps/web/src/guild-rpg/components/RewardScreen.test.tsx`

1. Add failing tests with 20 non-material drops proving all entries are simultaneously present, materials are separate, there is no pager, and only one detail drawer opens.
2. Replace the one-item carousel with a density-aware 4×5 compact loot grid; use icon, rarity edge, short name, and recommendation marker.
3. Open one bottom detail drawer on tap for rolls, cores/components, comparison, and next action.
4. Add reducer-supported direct equipment action and replay action where the state has enough context; route skill changes to the correct preparation page.
5. Make the reward coach visible without occupying a second panel.
6. Run the reward component and reducer tests.

## Task 4: Preparation and onboarding progressive disclosure

**Files:**

- Modify: `apps/web/src/guild-rpg/components/GuildScreen.tsx`
- Modify: `apps/web/src/guild-rpg/components/SkillLoadoutPanel.tsx`
- Modify: `apps/web/src/guild-rpg/components/EquipmentWorkbench.tsx`
- Modify: `apps/web/src/guild-rpg/components/QuestBoard.tsx`
- Modify: `apps/web/src/styles/guild-interface.css`
- Modify: `apps/web/src/styles/guild-rpg.css`
- Test: `apps/web/src/guild-rpg/components/guild-screen.test.tsx`

1. Add failing tests proving the active onboarding instruction is visible without opening help and the selected hero/slot is always explicit.
2. Keep the six-member selector compact; show one hero’s six slots and a short recommended set before the full filtered library.
3. Keep equipment slots and comparison summary visible; move forging, salvage, filters, and formulas into contextual drawers.
4. Raise essential text and control sizes, remove empty vertical space, and keep secondary copy hidden until tapped.
5. Run affected guild/preparation tests.

## Task 5: One-screen regression gate and release

**Files:**

- Modify: `apps/web/e2e/guild-rpg-release.spec.ts`
- Modify: responsive CSS only where failures demonstrate a need

1. Extend E2E assertions for 375×667, 390×844, 430×932, and 1280×800: no document scroll, no battlefield/dock overlap, no clipped controls, 44px primary targets, visible coach, readable armed-skill chain, and 20-drop containment.
2. Run one consolidated diff review; fix only player-visible or regression-critical findings.
3. Run focused verification, then `pnpm check`.
4. Run `pnpm test:e2e` through `scripts/run-e2e.mjs`; confirm its managed server port closes.
5. Commit the batch, push `codex/project-expedition-mvp`, deploy `dist` to the existing Cloudflare Pages project, and verify the production URL returns the new build.
