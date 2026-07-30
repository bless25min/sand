# Causal Command Lens Recovery Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan as one player-visible batch.

**Goal:** Make one mobile battle screen explain actor, target, skill cause, added result and
next relay without duplicate cards, unexplained dots, overlays or scrolling.

**Architecture:** Keep all combat truth in `simulation-core`. Extend the existing pure web
presentation model with compact cause/result stages, then let React replace command surfaces by
mode. Pixi and transparent unit controls only project selection, intent and preview state.

**Tech Stack:** React 19, TypeScript, PixiJS, Vitest, Playwright, Cloudflare Pages.

## Global Constraints

- Follow `docs/superpowers/specs/2026-07-30-causal-command-lens-recovery-design.md`.
- Preserve user changes in `AGENTS.md` and `docs/AI_DEVELOPMENT_SPEC.md`.
- Do not change combat formulas, content, progression, enemies or loot.
- Add failing tests before production behavior.
- Run affected tests while editing, `pnpm check` once at the batch gate, and E2E once before deploy.
- Do not leave a Vite or Playwright server running.

---

### Task 1: Deliver the causal command lens

**Files:**

- Modify: `apps/web/src/guild-rpg/presentation/skill-action-presentation.ts`
- Modify: `apps/web/src/guild-rpg/presentation/skill-action-presentation.test.ts`
- Modify: `apps/web/src/guild-rpg/presentation/skill-command-intent.ts`
- Modify: `apps/web/src/guild-rpg/presentation/skill-command-intent.test.ts`
- Modify: `apps/web/src/guild-rpg/components/SixSkillControls.tsx`
- Modify: `apps/web/src/guild-rpg/components/SixSkillControls.test.tsx`
- Modify: `apps/web/src/guild-rpg/components/SkillOutcomePreviewPanel.tsx`
- Modify: `apps/web/src/guild-rpg/components/SkillOutcomePreviewPanel.test.tsx`
- Modify: `apps/web/src/guild-rpg/components/BattleCommandDock.tsx`
- Modify: `apps/web/src/guild-rpg/components/CombatBattlefield.tsx`
- Modify: `apps/web/src/guild-rpg/components/BattlefieldUnitControls.tsx`
- Modify: `apps/web/src/guild-rpg/components/deterministic-six-hero-flow.test.tsx`
- Modify: `apps/web/src/guild-rpg/guild-combat.css`
- Create: `packages/pixi-renderer/src/guild-combat/unit-selection-marker.ts`
- Create: `packages/pixi-renderer/src/guild-combat/unit-selection-marker.test.ts`
- Modify: `packages/pixi-renderer/src/guild-combat/draw-units.ts`
- Modify: `apps/web/e2e/guild-rpg-release.spec.ts`

**Interfaces:**

- Extend `SkillActionPresentation` with `baseLabel`, `conditionLabel`, `conditionState`,
  `addedLabel`, and optional `nextRelay`.
- Extend `chooseSkillIntent` so a second tap on the armed skill returns a cast intent.
- Render one `.gr-skill-cause` in each usable skill; never render `.gr-skill-ready`.
- Render one `.gr-causal-preview` only while armed; remove `.gr-command-context`.
- Render tutorial copy as `.gr-guide-callout` inside the focused battlefield or skill control.
- Produce `unitSelectionMarker(unit)` so every unit receives at most one selection marker.

- [ ] **Step 1: RED — lock player-visible information ownership**

  Require the idle dock to omit `.gr-command-context` and `.gr-battle-guide-strip`; require every
  usable skill to expose one cause label, a named readiness state and no `.gr-skill-ready`.
  Require the battlefield HUD names to occur once and the selected target to use one marker.

- [ ] **Step 2: Run the component tests and observe failure**

  Run:
  `.\node_modules\.bin\vitest.cmd run apps/web/src/guild-rpg/presentation/skill-action-presentation.test.ts apps/web/src/guild-rpg/presentation/skill-command-intent.test.ts apps/web/src/guild-rpg/components/SixSkillControls.test.tsx apps/web/src/guild-rpg/components/SkillOutcomePreviewPanel.test.tsx apps/web/src/guild-rpg/components/deterministic-six-hero-flow.test.tsx`

  Expected: fail on missing cause stages and the still-present guide/context/ready-dot markup.

- [ ] **Step 3: GREEN — derive compact cause, result and relay presentation**

  Map the first ready combo step, otherwise the first blocked step, to:

  ```ts
  {
    baseLabel: baseDamage > 0 ? `先傷${baseDamage}` : `先療${preview.totalHealing}`,
    conditionLabel: triggerPhrase(step.triggerId),
    conditionState: step.readiness,
    addedLabel: step.chaseDamage > 0 ? `追加傷${step.chaseDamage}` : statusLabel,
    nextRelay: preview.nextRelays[0]
  }
  ```

  Keep screen-reader text complete; keep visual labels short.

- [ ] **Step 4: GREEN — replace stacked command surfaces**

  Remove the independent guide and actor→target row. Put a short anchored guide label on the
  focused enemy or first skill. In choose mode render skill name, base result and
  `condition → added result`; in preview mode render one base/condition/result flow, target HP
  change, next relay and one confirm action. A second tap on the armed skill confirms.

- [ ] **Step 5: GREEN — reduce battlefield selection vocabulary**

  Make actor, target, intent and preview selectors mutually distinct and non-stacking. Keep HUDs
  edge-aligned and compact; reserve the center for impacts and status transitions.

- [ ] **Step 6: Run focused tests until green and review the diff**

  Run the Step 2 command. Check no combat calculation entered React/Pixi and no protected user
  file entered the diff.

- [ ] **Step 7: RED/GREEN — lock the real mobile loop**

  Update E2E for no duplicate context, anchored guide, visible cause/result, target selection
  without cast, second skill tap confirmation, resolve collapse, next actor and no-scroll at
  375×667, 390×844, 430×932 and 1280×800.

- [ ] **Step 8: Consolidated verification and release**

  Run affected E2E, confirm port 4173 is clear, run `pnpm check`, commit the scoped files, push
  `codex/project-expedition-mvp`, deploy `apps/web/dist` to Pages project
  `ai-expedition-legion-rpg`, and verify canonical plus immutable URLs and the live mobile flow.
