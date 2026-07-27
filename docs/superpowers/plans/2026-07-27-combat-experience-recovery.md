# Combat Experience Recovery Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> superpowers:executing-plans to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver a readable first session and an escalating, sequential six-hero
battle presentation while preserving deterministic RPG rules and loot.

**Architecture:** `simulation-core` continues to resolve actions synchronously.
The web package projects traceable events into timed presentation beats and
temporarily locks command input. Onboarding state follows completed player
actions, then becomes a persistent post-victory training checklist.

**Tech Stack:** React 19, TypeScript, CSS, Vitest, Playwright.

## Global Constraints

- Do not change battle outcomes or use `Math.random`.
- Keep the approved design and this plan below 150 lines.
- One player-visible batch; affected tests during TDD, one `pnpm check` at end.
- Preserve uncommitted `AGENTS.md` and `docs/AI_DEVELOPMENT_SPEC.md`.

---

### Task 1: Recover the Complete Player Experience

**Files:**

- Create: `apps/web/src/guild-rpg/presentation/combat-beats.ts`
- Create: `apps/web/src/guild-rpg/presentation/combat-beats.test.ts`
- Create: `apps/web/src/guild-rpg/hooks/use-combat-playback.ts`
- Create: `apps/web/src/guild-rpg/effects/combat-sensation.ts`
- Create: `apps/web/src/guild-rpg/components/CombatBattlefield.tsx`
- Create: `apps/web/src/guild-rpg/components/FirstSessionCard.tsx`
- Create: `apps/web/src/guild-rpg/components/GuildTrainingChecklist.tsx`
- Modify: `apps/web/src/guild-rpg/components/BattleScreen.tsx`
- Modify: `apps/web/src/guild-rpg/components/SixSkillControls.tsx`
- Modify: `apps/web/src/guild-rpg/components/TurnOrderRail.tsx`
- Modify: `apps/web/src/guild-rpg/components/GuildScreen.tsx`
- Modify: `apps/web/src/guild-rpg/GuildRpgApp.tsx`
- Modify: `apps/web/src/guild-rpg/onboarding/first-hunt-coach.ts`
- Modify: `apps/web/src/guild-rpg/onboarding/first-hunt-coach.test.ts`
- Modify: `apps/web/src/guild-rpg/state/create-game-state.ts`
- Modify: `apps/web/src/guild-rpg/state/create-game-state.test.ts`
- Modify: `apps/web/src/guild-rpg/state/game-reducer.ts`
- Modify: `apps/web/src/guild-rpg/state/game-reducer.test.ts`
- Modify: `apps/web/src/guild-rpg/components/deterministic-six-hero-flow.test.tsx`
- Modify: `apps/web/src/guild-rpg/guild-rpg.css`
- Modify: `apps/web/e2e/guild-rpg-release.spec.ts`

**Interfaces:**

- `createCombatBeats(events, relay): readonly CombatBeat[]`
- `relayPresentation(relay): RelayPresentation`
- `useCombatPlayback(events, relay, reducedMotion): CombatPlayback`
- `playCombatSensation(beat, preferences): void`
- `CombatBattlefield` consumes battle units, selected target, current beat,
  acting hero, next hero, relay tier, and target selection callback.

- [ ] **Step 1: Write projection and tutorial RED tests**

Add tests asserting every meaningful event maps to an ordered beat, relay visual
power increases from 1–6, and the sixth is a finisher. Replace the old onboarding
expectation with:

```ts
[
  'start_hunt',
  'select_target',
  'relay_1',
  'relay_2',
  'relay_3',
  'relay_4',
  'relay_5',
  'relay_6',
  'collect_reward',
  'equip_loot',
  'forge_loot',
  'inspect_skills',
  'fuse_skill',
  'equip_fused',
  'replay',
  'complete',
];
```

Run:
`pnpm vitest run apps/web/src/guild-rpg/presentation/combat-beats.test.ts apps/web/src/guild-rpg/onboarding/first-hunt-coach.test.ts apps/web/src/guild-rpg/state/game-reducer.test.ts`

Expected: FAIL because projection and relay tutorial steps do not exist.

- [ ] **Step 2: Implement pure presentation and tutorial state**

Implement event categorization, delay/intensity metadata, `relayPresentation`,
new guide copy/focus targets, fresh-state `start_hunt`, battle progression after
each successful `USE_SKILL`, and post-victory checklist transitions. Reordering
must not mutate tutorial progress.

Run the Step 1 command. Expected: PASS.

- [ ] **Step 3: Write battlefield and mobile RED tests**

Assert markup contains `data-combat-battlefield`, six hero formations,
enemy formations, a target route, `data-combat-beat`, current/next hero labels,
and relay tier. Scope CSS assertions to the mobile `.gr-battle-skills` rule and
require `repeat(2, minmax(0, 1fr))`, 56 px targets, and a battlefield minimum.

Run:
`pnpm vitest run apps/web/src/guild-rpg/components/deterministic-six-hero-flow.test.tsx`

Expected: FAIL because the real battlefield and scoped rules are absent.

- [ ] **Step 4: Implement staged combat presentation**

Implement the playback hook, optional WebAudio/vibration output, tactical
formations, event ribbons, floating numbers/status bursts, target route, input
lock, active/next hero transitions, escalating relay CSS, and persistent sixth
finisher. Connect reduced-motion behavior and prevent combat auto-scroll.

Run the Step 3 command plus projection tests. Expected: PASS.

- [ ] **Step 5: Write and implement first-session information hierarchy**

Add component assertions for one dominant first-hunt CTA, a short three-step
explanation, a post-victory training checklist, selected-hero context, and
progressive quest details. Implement focused quest, party, skill, and equipment
introductions without hiding the permanent navigation or advanced controls.

Run all `apps/web/src/guild-rpg/**/*.test.ts?(x)` tests. Expected: PASS.

- [ ] **Step 6: Replace brittle release E2E acceptance**

Use visible roles and text for the primary first-session journey. At 390 × 844,
assert battlefield/formations/relay visibility, input lock during a beat,
six sequential actor changes, 2 × 3 controls, victory collection, training
checklist, equipment/forge/skills/fusion/replay, and no horizontal crop or page
errors. Keep save migration coverage.

- [ ] **Step 7: Consolidated verification and review**

Run `pnpm check`, then `pnpm test:e2e`. Review the whole diff once for outcome
ownership, tutorial dead ends, mobile overlap, optional-output failure safety,
and unrelated changes. Fix findings, rerun the focused affected verification,
and record exact results.
