# Battlefield Command Lens Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan as one player-visible batch.

**Goal:** Replace the combat information dashboard with a battlefield-first
choose-preview-confirm-resolve loop that is readable and satisfying on one mobile screen.

**Architecture:** Keep combat truth in `simulation-core`. Add focused web presentation
models for terse skill outcomes and selected-skill sentences, make `BattleScreen` own an
explicit preview state and confirm action, and project the same trigger semantics into
the Pixi playback. Replace, rather than stack, command surfaces.

**Tech Stack:** React 19, TypeScript, PixiJS, Vitest, Playwright, Cloudflare Pages.

## Global Constraints

- Preserve user changes in `AGENTS.md` and `docs/AI_DEVELOPMENT_SPEC.md`.
- Do not change combat formulas, build content, loot, enemies, or progression.
- Add a failing test before every production behavior.
- Use affected tests during implementation; run `pnpm check` once at the batch gate.
- Keep the 375×667, 390×844, 430×932 and 1280×800 battle shells scroll-free.

---

### Task 1: Deliver the battlefield command lens

**Files:**
- Modify: `apps/web/src/guild-rpg/presentation/skill-command-intent.test.ts`
- Modify: `apps/web/src/guild-rpg/presentation/skill-command-intent.ts`
- Create: `apps/web/src/guild-rpg/presentation/skill-action-presentation.test.ts`
- Create: `apps/web/src/guild-rpg/presentation/skill-action-presentation.ts`
- Modify: `apps/web/src/guild-rpg/components/SixSkillControls.tsx`
- Modify: `apps/web/src/guild-rpg/components/SkillOutcomePreviewPanel.test.tsx`
- Modify: `apps/web/src/guild-rpg/components/SkillOutcomePreviewPanel.tsx`
- Modify: `apps/web/src/guild-rpg/components/BattleCommandDock.tsx`
- Modify: `apps/web/src/guild-rpg/components/BattleScreen.tsx`
- Modify: `apps/web/src/guild-rpg/components/BattlefieldUnitControls.tsx`
- Modify: `apps/web/src/guild-rpg/components/CombatBattlefield.tsx`
- Modify: `apps/web/src/guild-rpg/guild-combat.css`
- Modify: `apps/web/src/guild-rpg/presentation/combat-beat-cue.test.ts`
- Modify: `apps/web/src/guild-rpg/presentation/combat-beat-cue.ts`
- Modify: `apps/web/e2e/guild-rpg-release.spec.ts`

**Interfaces:**
- Produces: `createSkillActionPresentation(skill, preview)` with a compact tile outcome,
  one natural-language result sentence, one unmet-condition sentence, and status delta.
- Produces: `chooseSkillIntent(skillId)` and `chooseTargetIntent(targetId)` that only arm
  or select; casting occurs only through `confirmSkillIntent(armedSkillId, targetId)`.

- [ ] **Step 1: RED — lock explicit confirmation and player-language contracts**

  Update intent and presentation tests to require target taps to remain selection-only,
  require a separate confirm result, and reject `已亮`, `出招亮`, `起手`, `事件`, and
  `data-next-relay` from the primary preview.

- [ ] **Step 2: Run focused tests and observe the expected failures**

  Run:
  `.\node_modules\.bin\vitest.cmd run apps/web/src/guild-rpg/presentation/skill-command-intent.test.ts apps/web/src/guild-rpg/presentation/skill-action-presentation.test.ts apps/web/src/guild-rpg/components/SkillOutcomePreviewPanel.test.tsx`

  Expected: failures because explicit confirmation and the focused presentation do not
  exist.

- [ ] **Step 3: GREEN — implement explicit selection, preview and confirmation**

  Add the presentation model, make all target taps selection-only, add one
  `對{target}施放` button, replace the six-card grid with six compact switch tabs while a
  skill is selected, and remove event and relay text cards from the primary surface.

- [ ] **Step 4: Run focused tests until green, then refactor**

  Run the Step 2 command. Split presentation-only logic from components, keep
  `BattleScreen` as the thin state coordinator, and rerun until all focused tests pass.

- [ ] **Step 5: RED/GREEN — unify battlefield HUD and combat cues**

  Add failing component/cue assertions for focused actor and target HUDs, transparent
  unit controls, target-only prediction, trigger-specific chase labels, and relay cues
  without generic total callouts. Implement the smallest projection and CSS changes,
  then run the affected component, cue, Pixi plan, and renderer tests.

- [ ] **Step 6: RED/GREEN — verify the whole mobile player loop**

  Update E2E to require one confirm action, no target auto-cast, no report-like preview,
  compact unselected skills, no overlap at all four viewports, visible semantic trigger
  escalation, six relays, victory and the existing loot flow. Run `pnpm test:e2e` and
  confirm port 4173 closes.

- [ ] **Step 7: Consolidated batch gate**

  Run `pnpm check`, review the complete diff once, fix only findings tied to this player
  outcome, and run one focused follow-up plus `pnpm check` again only if source changed.

- [ ] **Step 8: Release and production proof**

  Commit without the two protected user files, push `codex/project-expedition-mvp`,
  deploy `apps/web/dist` to Cloudflare Pages project `ai-expedition-legion-rpg`, verify
  canonical and immutable URLs, then browser-test 390×844 selection, preview, confirm,
  playback, next actor and no-scroll behavior.
