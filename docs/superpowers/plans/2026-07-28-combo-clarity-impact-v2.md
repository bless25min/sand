# Combo Clarity and Combat Impact V2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make every prepared skill readable as condition → consequence → next relay, then play the same causal result as a fast escalating combat sequence.

**Architecture:** `simulation-core` extends the existing exact preview with component-level trigger semantics and post-cast next-relay differences. React maps those facts to compact Traditional Chinese UI; Pixi and the playback projector group/speed existing events without deciding outcomes.

**Tech Stack:** TypeScript 6, React 19, PixiJS 8, Vitest 4, Playwright 1.61, Vite 8, Cloudflare Pages.

## Global Constraints

- Never render `total × hits`; render named `段`, `追擊`, and `總傷`.
- Mobile remains one `100dvh` screen with no page scroll or overlapping controls.
- Preview and formal resolution use the same pure simulation path.
- Do not add skills, triggers, balance changes, combat randomness, or multiplication formulas.
- Preserve modified `AGENTS.md` and `docs/AI_DEVELOPMENT_SPEC.md`.
- Use affected tests during implementation, one consolidated review, then `pnpm.cmd check` and `pnpm.cmd test:e2e`.

---

## File Map

- Modify `packages/simulation-core/src/guild-rpg/skills/resolve-skill-component.ts`: attach causal IDs to trigger/core bonus damage.
- Modify `packages/simulation-core/src/guild-rpg/skills/preview-skill-outcome.ts`: expose segment, chase, component readiness, and next-relay facts.
- Modify `packages/simulation-core/src/guild-rpg/skills/preview-skill-outcome.test.ts`: exact semantic preview coverage.
- Modify `apps/web/src/guild-rpg/presentation/skill-tile-presentation.ts`: map semantic preview to concise player copy.
- Modify `apps/web/src/guild-rpg/presentation/skill-tile-presentation.test.ts`: number order and trigger language.
- Modify `apps/web/src/guild-rpg/components/SixSkillControls.tsx`: render three-row tiles without multiplication signs.
- Modify `apps/web/src/guild-rpg/components/SkillOutcomePreviewPanel.tsx`: render up to three condition → effect steps and next relay.
- Modify component tests and `apps/web/src/guild-rpg/guild-combat.css`: single-screen layout and accessibility.
- Modify `apps/web/src/guild-rpg/presentation/combat-beats.ts`: remove empty narration beats and apply rapid-hit cadence.
- Modify `apps/web/src/guild-rpg/presentation/combat-beats.test.ts`: grouped trigger and escalating cadence proof.
- Modify `packages/pixi-renderer/src/guild-combat/combat-effect-plan.ts`: nonlinear relay power and actual hit-stop timing.
- Modify `packages/pixi-renderer/src/guild-combat/mount-guild-combat-stage.ts`: honor hit stop and finisher emphasis.
- Modify renderer tests and `apps/web/e2e/guild-rpg-release.spec.ts`: live semantics, spectacle, geometry, full loop.

### Task 1: Exact combo semantics from simulation-core

**Interfaces:**

```ts
interface SkillComboStepPreview {
  componentId: string;
  triggerId: TriggerCondition;
  readiness: TriggerReadiness;
  damageSegments: number;
  chaseSegments: number;
  chaseDamage: number;
}
interface SkillOutcomePreview {
  damageSegments: number;
  chaseSegments: number;
  comboSteps: readonly SkillComboStepPreview[];
  nextRelay?: { actorId: string; newlyReadySkillIds: readonly string[] };
}
```

- [ ] Write failing tests proving one base hit plus one trigger is `2段`, `1追擊`, and that a fire setup newly readies the next actor's `previous_fire` skill.
- [ ] Run `.\node_modules\.bin\vitest.cmd run packages/simulation-core/src/guild-rpg/skills/preview-skill-outcome.test.ts` and verify semantic fields are missing.
- [ ] Add deterministic `causalId` / `parentCausalId` links for consumed-layer, matched-trigger, and equipment-core bonus damage.
- [ ] Extend `previewSkillOutcome()` from the already-resolved battle and `previewTriggerReadiness()`; do not resolve a second divergent outcome.
- [ ] Rerun the focused simulation tests and require PASS.

### Task 2: Three-row skill tiles and selected combo rail

**Interfaces:**

```ts
interface SkillTilePresentation {
  segments: number;
  totalLabel: string;
  triggerSummary: string;
  readyCount: number;
}
```

- [ ] Write failing presentation/component tests requiring `2段`, `總傷30`, `開戰✓ → 追傷6`, full selected component steps, and no `×2`.
- [ ] Run the three affected Web Vitest files and verify the new copy/markup is absent.
- [ ] Map all 30 trigger IDs to short condition, missing-condition, and readiness labels in the presentation layer.
- [ ] Render one-star trigger summaries and multi-star `連招 N/M 已亮`; expose exact accessible labels with the same semantics.
- [ ] Replace the selected cause sentence with a three-column combo rail plus `本次` and `接棒` summaries.
- [ ] Update CSS with a 64–72px tile budget, truncation only on names, and no font below 10px.
- [ ] Rerun affected Web tests and require PASS at server-rendered component level.

### Task 3: Fast causal playback and escalating impact

**Interfaces:**

```ts
interface CombatBeat {
  sourceEventIds: readonly number[];
  comboIndex?: number;
  delayMs: number;
}
```

- [ ] Write failing beat tests proving narration-only `triggered` events merge into their bonus hit, consecutive same-component hits use 55–90ms cadence, and the last hit holds longer.
- [ ] Run combat beat and renderer plan tests and verify failure.
- [ ] Project causal trigger + child damage as one visible chain beat while preserving every source event ID for traceability.
- [ ] Apply nonlinear relay values: stronger trails from relay 3, environment emphasis from 4, finisher anticipation at 5, and dark/flash release at 6.
- [ ] Honor `hitStopMs` in the Pixi ticker; Reduced Motion skips timing but keeps numbers, routes, statuses, and condition evidence.
- [ ] Rerun the focused playback/renderer tests and require PASS.

### Task 4: Integrated player flow and release

- [ ] Extend `guild-rpg-release.spec.ts` to assert six tiles have named segments/totals, no multiplication glyph, target switching recomputes conditions, first click previews, second click casts, next actor changes, and no pairwise overlap.
- [ ] Run all affected Vitest files, perform one consolidated diff review, fix findings, and rerun only affected checks.
- [ ] Run `pnpm.cmd check`; require typecheck, lint, formatting, architecture, dead-code, unit tests, and builds to pass.
- [ ] Run `pnpm.cmd test:e2e`; require all E2E tests to pass, then verify port 4173 is closed.
- [ ] Commit only the intended batch as `feat: clarify combos and amplify combat impact`.
- [ ] Push `codex/project-expedition-mvp`, deploy the exact commit to Cloudflare Pages production, and verify the canonical 390×844 live DOM, interaction, console, and HTTP response.
