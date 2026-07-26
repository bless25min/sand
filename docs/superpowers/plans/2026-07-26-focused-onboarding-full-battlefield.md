# Focused Onboarding Full Battlefield Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make every first-hunt instruction readable and actionable while keeping every combat unit visible on short mobile screens.

**Architecture:** Extend the pure first-hunt coach with presentation-ready progress and one focus target. Render that contract once inside `ThumbCommandDeck`, simplify first-time mission information, and reserve the mobile battle grid exclusively for header plus battlefield.

**Tech Stack:** React 19, TypeScript 6, CSS, Vitest, Vite.

## Global Constraints

- Keep battle outcomes in `packages/simulation-core`; this batch changes presentation only.
- Do not change enemy, card, loot, equipment, or timing balance.
- At most one element may have `data-guide-focus="true"`.
- Guided text must remain complete at 375 × 667 and 390 × 844.
- Run affected tests during implementation and `pnpm check` once at batch completion.
- Preserve unstaged user changes in `AGENTS.md` and `docs/AI_DEVELOPMENT_SPEC.md`.

---

### Task 1: Focused first-hunt guidance and uncropped mobile battlefield

**Files:**

- Modify: `apps/web/src/guild-rpg/onboarding/first-hunt-coach.ts`
- Modify: `apps/web/src/guild-rpg/onboarding/first-hunt-coach.test.ts`
- Modify: `apps/web/src/guild-rpg/components/ThumbCommandDeck.tsx`
- Modify: `apps/web/src/guild-rpg/components/GuildMobileStage.tsx`
- Modify: `apps/web/src/guild-rpg/components/GuildMobileFocus.tsx`
- Modify: `apps/web/src/guild-rpg/components/BattleThumbControls.tsx`
- Modify: `apps/web/src/guild-rpg/components/RewardThumbControls.tsx`
- Modify: `apps/web/src/guild-rpg/components/mobile-flow-contract.test.tsx`
- Modify: `apps/web/src/guild-rpg/thumb-command-deck.css`
- Modify: `apps/web/src/guild-rpg/mobile-battle.css`

**Interfaces:**

- `CoachInput.mobilePage?: 'build' | 'quest' | 'party' | 'inventory'`
- `FirstHuntCoach` produces `step`, `phaseLabel`, `stepNumber`, `stepTotal`, `title`, `message`, `focusId`, and optional `expectedCardId`.
- `ThumbCommandDeck.guide?: FirstHuntCoach`; actions resolve as `action:${action.id}` and tabs as `tab:${tab.id}`.
- `GuildMobileFocus.guided?: boolean` hides advanced first-mission intelligence only while guidance is active.

- [x] **Step 1: Write failing coach-contract tests**

```ts
expect(createFirstHuntCoach(input({ screen: 'guild', mobilePage: 'build' }))).toMatchObject({
  step: 'quest',
  title: '前往第一個任務',
  focusId: 'tab:quest',
  stepNumber: 1,
  stepTotal: 2,
});
expect(createFirstHuntCoach(input({ screen: 'guild', mobilePage: 'quest' }))).toMatchObject({
  step: 'start',
  focusId: 'action:start-quest',
  stepNumber: 2,
});
expect(createFirstHuntCoach(input())).toMatchObject({
  focusId: 'action:brann_brace',
  phaseLabel: '軍令引導',
});
```

- [x] **Step 2: Run the coach tests and confirm RED**

Run: `node node_modules/vitest/vitest.mjs run apps/web/src/guild-rpg/onboarding/first-hunt-coach.test.ts`

Expected: FAIL because `mobilePage`, progress fields, titles, and focus IDs do not exist.

- [x] **Step 3: Implement the pure guide contract**

```ts
export interface FirstHuntCoach {
  step: FirstHuntCoachStep;
  paused: boolean;
  phaseLabel: string;
  stepNumber: number;
  stepTotal: number;
  title: string;
  message: string;
  focusId?: string;
  expectedCardId?: string;
}
```

Return `tab:quest`, `action:start-quest`, `action:${expectedCardId}`, `action:undo`, `action:release`, `action:equip`, and `action:return-guild` from the matching states.

- [x] **Step 4: Run the coach tests and confirm GREEN**

Run the Step 2 command.

Expected: all first-hunt coach tests pass.

- [x] **Step 5: Write failing rendering and CSS contract tests**

```ts
expect(markup).toContain('新手引導 1/2');
expect(markup).toContain('data-guide-focus="true"');
expect(markup.match(/data-guide-focus="true"/g) ?? []).toHaveLength(1);
expect(css).toContain('grid-template-areas:');
expect(css).toContain('.gr-battle > .gr-coach');
expect(css).toContain('@media (max-width: 800px) and (max-height: 720px)');
```

Also assert guided quest markup omits `處刑順序` and non-guided markup retains it.

- [x] **Step 6: Run rendering tests and confirm RED**

Run: `node node_modules/vitest/vitest.mjs run apps/web/src/guild-rpg/components/mobile-flow-contract.test.tsx`

Expected: FAIL because guide rendering, unique focus markers, simplified intel, and explicit mobile grid areas are absent.

- [x] **Step 7: Implement one readable guide surface**

Render a `.gr-thumb-deck__guide` containing:

```tsx
<span>{guide.phaseLabel} {guide.stepNumber}/{guide.stepTotal}</span>
<strong>{guide.title}</strong>
<p>{guide.message}</p>
```

Set `data-guide-focus="true"` only when the generated action or tab ID equals `guide.focusId`. Pass `guide={coach}` from guild, battle, and rewards; pass `guided={Boolean(coach)}` into `GuildMobileFocus`.

- [x] **Step 8: Fix mobile battle ownership and short-screen density**

Use `grid-template-areas: 'header' 'battlefield'`, assign the header and battlefield explicitly, and set `.gr-battle > .gr-coach { display: none; }` on mobile. For `max-height: 720px`, reduce unit-card padding/min-height and hide trait prose while retaining every unit name, HP, pressure, and execution marker.

- [x] **Step 9: Run affected tests and confirm GREEN**

Run: `node node_modules/vitest/vitest.mjs run apps/web/src/guild-rpg/onboarding/first-hunt-coach.test.ts apps/web/src/guild-rpg/components/mobile-flow-contract.test.tsx apps/web/src/guild-rpg/components/combo-flow-contract.test.tsx apps/web/src/guild-rpg/state/game-reducer.test.ts`

Expected: all affected tests pass.

- [x] **Step 10: Verify real mobile flows**

At 375 × 667 and 390 × 844, complete Build → 任務 → 開始 → recommended cards → preview → release. Assert one guide focus, guide text does not overflow, battlefield units stay within battlefield bounds, horizontal overflow is zero, and browser exceptions are zero.

- [x] **Step 11: Consolidated review, full gate, commit, deploy**

Review the complete diff once, fix all Critical/Important findings, run `pnpm check`, commit source and validation evidence, push `codex/project-expedition-mvp`, deploy `apps/web/dist` to Pages production, compare local/immutable/canonical asset hashes, and smoke-test production mobile.
