# Battlefield-As-Skill-Explanation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace overlapping combat HUDs and engine-field skill cards with a responsive battlefield that previews the exact player-visible result of every prepared skill.

**Architecture:** `simulation-core` remains the sole result source. Web derives small presentation models from all six deterministic previews, while Pixi receives portrait/landscape scene coordinates and renders HP, status, routes, and effects in a uniformly fitted viewport.

**Tech Stack:** React 19, TypeScript 6, PixiJS 8, Vitest 4, Playwright 1.61, Vite 8, Cloudflare Pages.

## Global Constraints

- Normal combat shows outcomes, not raw power, specialization, trigger, or Component terminology.
- Mobile battle remains one `100dvh` screen with no page scroll.
- Preview is non-mutating and exactly matches formal resolution.
- HTML unit controls are invisible, at least 48px, and pairwise non-overlapping.
- Preserve modified `AGENTS.md` and `docs/AI_DEVELOPMENT_SPEC.md`.
- Do not use `Math.random`; do not move battle outcomes outside simulation-core.

---

## File Map

- Create `packages/pixi-renderer/src/guild-combat/fit-combat-viewport.ts`: pure uniform fit.
- Create `packages/pixi-renderer/src/guild-combat/fit-combat-viewport.test.ts`: portrait and landscape fit contract.
- Modify `packages/pixi-renderer/src/guild-combat/contracts.ts`: add scene layout.
- Modify `packages/pixi-renderer/src/guild-combat/mount-guild-combat-stage.ts`: ResizeObserver-driven renderer/world fit.
- Modify `packages/pixi-renderer/src/guild-combat/draw-units.ts`: compact bars, status deltas, no persistent identity labels.
- Create `apps/web/src/guild-rpg/hooks/use-battlefield-layout.ts`: reactive portrait/landscape media query.
- Modify `apps/web/src/guild-rpg/presentation/battle-scene.ts`: two non-overlapping formations.
- Modify `apps/web/src/guild-rpg/presentation/battle-scene.test.ts`: layout and preview projection.
- Create `apps/web/src/guild-rpg/presentation/skill-tile-presentation.ts`: outcome-only tile model.
- Create `apps/web/src/guild-rpg/presentation/skill-tile-presentation.test.ts`: damage, healing, status, hit, and readiness labels.
- Create `apps/web/src/guild-rpg/components/BattleFocusHud.tsx`: current actor/target corner HUD.
- Modify `apps/web/src/guild-rpg/components/BattleScreen.tsx`: derive all six previews once.
- Modify `apps/web/src/guild-rpg/components/CombatBattlefield.tsx`: responsive scene and focus HUD.
- Modify `apps/web/src/guild-rpg/components/SixSkillControls.tsx`: render intent name and actual outcome.
- Modify `apps/web/src/guild-rpg/components/SkillOutcomePreviewPanel.tsx`: one compact result/cause strip plus optional separated detail.
- Modify `apps/web/src/guild-rpg/components/BattleCommandDock.tsx`: pass preview map without layout shift.
- Modify `apps/web/src/guild-rpg/guild-combat.css`: safe HUD zones, 3×2 tiles, non-overlapping controls.
- Modify component tests and `apps/web/e2e/guild-rpg-release.spec.ts`: geometry, copy, preview, cast, and viewport proof.

### Task 1: Responsive battlefield with focus-only HUD

**Interfaces:**

- Produces `fitCombatViewport(scene, viewport): { scale; x; y }`.
- Produces `GuildCombatScene.layout: 'portrait' | 'landscape'`.
- Produces `useBattlefieldLayout(): GuildCombatScene['layout']`.

- [ ] **Step 1: Write failing renderer and scene tests**

```ts
expect(fitCombatViewport({ width: 600, height: 900 }, { width: 390, height: 647 })).toEqual({
  scale: 0.65,
  x: 0,
  y: 31,
});
expect(createBattleScene(battle, { relay: 1, layout: 'portrait' }).units).toMatchObject([
  { x: 100, y: 650 },
  { x: 300, y: 650 },
]);
```

- [ ] **Step 2: Run focused tests and verify failure**

Run: `.\node_modules\.bin\vitest.cmd run packages/pixi-renderer/src/guild-combat/fit-combat-viewport.test.ts apps/web/src/guild-rpg/presentation/battle-scene.test.ts`
Expected: FAIL because the fit helper and portrait layout do not exist.

- [ ] **Step 3: Implement uniform resizing, portrait formation, and compact unit drawing**

```ts
export const fitCombatViewport = (scene: Size, viewport: Size) => {
  const scale = Math.min(viewport.width / scene.width, viewport.height / scene.height);
  return {
    scale,
    x: (viewport.width - scene.width * scale) / 2,
    y: (viewport.height - scene.height * scale) / 2,
  };
};
```

Use portrait scene `600×900`; enemies occupy the upper formation, heroes a 3×2 lower formation. Resize the renderer and position the world from the helper. Draw only a short HP bar and status/preview pips on ordinary units; render actor and target values in `BattleFocusHud`.

- [ ] **Step 4: Add component/E2E geometry assertions and pass focused tests**

Assert each `[data-battle-unit]` rectangle has zero intersection with every peer and only `[data-focus-actor]` / `[data-focus-target]` expose visible identity data.

## Task 2: Outcome-first skill selection and battlefield preview

**Interfaces:**

- Produces `SkillTilePresentation { intentName; primaryValue; hits; statusDelta; readiness }`.
- `BattleScreen` produces `ReadonlyMap<string, SkillOutcomePreview>` for the active actor’s six skills.
- `SixSkillControls` consumes the preview map; selected preview remains the existing formal preview.

- [ ] **Step 1: Write failing presentation and component tests**

```ts
expect(createSkillTilePresentation(skill, preview)).toMatchObject({
  intentName: '引火',
  primaryValue: '30',
  hits: 2,
  statusDelta: { kind: 'burn', amount: 3 },
});
expect(screen.queryByText(/威力|疊層|開戰|追燃/)).not.toBeInTheDocument();
```

- [ ] **Step 2: Run focused tests and verify failure**

Run: `.\node_modules\.bin\vitest.cmd run apps/web/src/guild-rpg/presentation/skill-tile-presentation.test.ts apps/web/src/guild-rpg/components/SkillOutcomePreviewPanel.test.ts apps/web/src/guild-rpg/components/deterministic-six-hero-flow.test.tsx`
Expected: FAIL because skill tiles still expose engine fields and raw power.

- [ ] **Step 3: Implement all-six previews and outcome-only controls**

Map element/specialization to short intent names, display formal total damage/healing, hit count, and the largest relevant status delta. Selected preview updates HP ghosting, per-unit status deltas, routes, and affected-unit glow. The visible strip contains only outcome glyphs and at most one plain-language cause; detailed results are grouped by affected unit.

- [ ] **Step 4: Verify interaction and accessibility**

Assert first tap arms without a battle event, second tap casts current target, armed target tap redirects and casts, live-region output names affected units, and Reduced Motion preserves HP/status/path information.

## Batch Review, Verification, and Release

- [ ] Run affected tests after implementation, then one consolidated diff review.
- [ ] Fix review findings in the same batch and rerun only affected tests.
- [ ] Run `pnpm.cmd check` once after source stabilizes.
- [ ] Run `pnpm.cmd test:e2e`; require all 375×667, 390×844, 430×932, and 1280×800 cases to pass and port 4173 to be closed afterward.
- [ ] Commit only intended source/tests/plan changes: `feat: make battlefield explain every skill`.
- [ ] Push `codex/project-expedition-mvp`, deploy the exact commit to Cloudflare Pages, and verify canonical production at `https://ai-expedition-legion-rpg.pages.dev/`.
