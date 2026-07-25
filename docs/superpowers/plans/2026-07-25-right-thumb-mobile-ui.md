# Right-Thumb Mobile UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `executing-plans` inline. Do not use
> subagent-driven development for this batch.

**Goal:** Make the complete guild RPG loop operable from a stable lower-right command deck on a
portrait phone.

**Architecture:** Add one feature-local deck component and small index helpers, then adapt Guild,
Battle, and Reward screens without changing reducers or simulation packages. Desktop keeps its
current controls; mobile gains focused content and context-specific deck actions.

**Tech Stack:** React 19, TypeScript, CSS, Vitest SSR contracts, existing reducer and browser smoke
tests.

## Global Constraints

- Follow `docs/superpowers/specs/2026-07-25-right-thumb-mobile-ui-design.md`.
- Do not change battle outcomes, save data, rewards, equipment effects, or game content.
- Keep all new UI types under `apps/web/src/guild-rpg`.
- Use affected tests during implementation and one consolidated `pnpm check` at batch completion.
- Keep required mobile taps inside the right-thumb deck; hit targets are at least 56 by 56 pixels.
- Preserve the user's existing `docs/AI_DEVELOPMENT_SPEC.md` changes.

---

### Task 1: Lock the Mobile Interaction Contract

**Files:**

- Create: `apps/web/src/guild-rpg/mobile/thumb-deck-model.ts`
- Create: `apps/web/src/guild-rpg/mobile/thumb-deck-model.test.ts`
- Create: `apps/web/src/guild-rpg/components/ThumbCommandDeck.tsx`
- Create: `apps/web/src/guild-rpg/components/mobile-flow-contract.test.tsx`

**Interfaces:**

- Produces `wrapThumbIndex(index: number, length: number, delta: -1 | 1): number`.
- Produces `pageSlice<T>(items: readonly T[], page: number, pageSize: number)`.
- Produces `ThumbCommandDeck` with labelled tabs, slotted actions, status, and feedback.

- [x] Write failing tests for empty and wrapping indexes, paged inventory, primary slot, selected
      tab, disabled semantics, and Guild/Battle/Reward deck labels.

```tsx
expect(markup).toContain('data-thumb-command-deck="true"');
expect(markup).toContain('data-thumb-slot="primary"');
expect(markup).toContain('aria-current="page"');
```

- [x] Run
      `pnpm exec vitest run apps/web/src/guild-rpg/mobile/thumb-deck-model.test.ts apps/web/src/guild-rpg/components/mobile-flow-contract.test.tsx`
      and confirm failure is caused by the missing model and deck.
- [x] Implement the two pure helpers and semantic deck shell only; do not wire screen actions yet.
- [x] Run the same tests and keep screen-contract assertions failing while model and deck assertions
      pass.

### Task 2: Wire the Complete Right-Thumb Loop

**Files:**

- Modify: `apps/web/src/guild-rpg/components/GuildScreen.tsx`
- Modify: `apps/web/src/guild-rpg/components/Inventory.tsx`
- Modify: `apps/web/src/guild-rpg/components/AdventurerCard.tsx`
- Create: `apps/web/src/guild-rpg/components/BattleThumbControls.tsx`
- Modify: `apps/web/src/guild-rpg/components/BattleScreen.tsx`
- Modify: `apps/web/src/guild-rpg/components/EquipmentCard.tsx`
- Create: `apps/web/src/guild-rpg/components/RewardThumbControls.tsx`
- Modify: `apps/web/src/guild-rpg/components/RewardScreen.tsx`

**Interfaces:**

- Guild pages are `quest | party | inventory`.
- Battle pages are `skill | target | tactics`.
- Reward controls receive the focused item, selected adventurer, and existing reducer dispatch.
- Screen components remain composition roots; the deck never imports game rules.

- [x] Make the Guild contract green with focused quest, party, and two-item inventory paging.
      Required start, leader, item selection, target adventurer, and equip actions use the deck.
- [x] Make the Battle contract green. Skills retain fixed positions while disabled; target selection
      returns to Skill; ally-target skills request a recipient inside Target; Auto and speed use Tactics.
- [x] Make the Reward contract green. Focus one item, cycle adventurer, equip or keep, confirm sell
      twice, and return after all items resolve.
- [x] Run the two affected tests plus
      `pnpm exec vitest run apps/web/src/guild-rpg/state/game-reducer.test.ts` and confirm all pass.

### Task 3: Mobile Layout, Accessibility, and Consolidated Verification

**Files:**

- Create: `apps/web/src/guild-rpg/thumb-command-deck.css`
- Modify: `apps/web/src/guild-rpg/guild-rpg.css`
- Modify: `apps/web/src/guild-rpg/guild-screen.css`
- Modify: `apps/web/src/guild-rpg/party.css`
- Modify: `apps/web/src/guild-rpg/quest-board.css`
- Modify: `apps/web/src/guild-rpg/battle.css`
- Modify: `apps/web/src/guild-rpg/battle-command.css`
- Modify: `apps/web/src/guild-rpg/rewards.css`
- Modify: `apps/web/src/guild-rpg/reward-items.css`
- Modify: `apps/web/src/guild-rpg/GuildRpgApp.tsx`

- [x] Import the deck stylesheet and add mobile-only focused content. Use `100dvh`,
      `env(safe-area-inset-bottom)`, a 12–16 pixel right inset, 56-pixel minimum targets, reserved
      content space, visible pressed/focus/selected/disabled states, and reduced-motion handling.
- [x] Keep the existing desktop grids and command controls above 800 pixels.
- [x] Run one consolidated `pnpm check`; fix only batch-related findings and run one focused
      follow-up for any fix.
- [x] Browser-test the complete loop at 375 by 812 and 390 by 844: start, select target, attack,
      Auto, 2x, reward decisions, return, inventory equip, reload, and no console errors or overflow.
- [x] Perform one consolidated diff review against the spec, then commit the implementation once.
- [ ] Build the exact commit, push it to the configured Sites source mirror, save a version, deploy
      privately, poll to `succeeded`, and verify the live bundle hash matches the local build.
