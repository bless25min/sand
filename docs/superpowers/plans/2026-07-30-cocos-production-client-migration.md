# Cocos Production Client Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `executing-plans` inline. Project policy
> prohibits subagent-driven development unless the user explicitly requests delegation.

**Goal:** Deliver one complete six-hero hunt in a free Cocos Creator client, playable on the
deployed Web build and exportable to Windows without changing deterministic battle outcomes.

**Architecture:** Existing simulation/data/shared packages remain authoritative. A new pure
`presentation-core` compiles battle events into cancellable visual beats; Cocos owns input, scene,
animation, audio and UI, and advances only when each beat reports completion.

**Tech Stack:** Cocos Creator 3.8.8, TypeScript 6, esbuild 0.28.1, Vitest 4, Playwright 1.61.

## Global Constraints

- No paid runtime, Spine dependency, `Math.random`, DOM-only client behavior or Cocos-owned outcome.
- Preserve dirty `AGENTS.md` and `docs/AI_DEVELOPMENT_SPEC.md`.
- Fixed single-screen layouts at 375×812, 390×844, 1280×720 and 1920×1080.
- Six heroes, three enemies, six skills per hero and at most one skill drop per victory.
- Materials are summarized separately; one page holds 20 non-material drops.
- Use affected tests during work, then one consolidated review, `pnpm check` and platform builds.

---

### Task 1: Boot the Real Battle Core in Cocos

**Player outcome:** Open the new client and see the deterministic quest, six heroes and three
enemies loaded from current game data.

**Files:** Create `apps/game-client-cocos/{package.json,tsconfig.json,project.json}`,
`apps/game-client-cocos/assets/scripts/bootstrap/GameBootstrap.ts`,
`scripts/sync-cocos-runtime.mjs`, `scripts/sync-cocos-runtime.test.ts`;
modify root `package.json`, `pnpm-workspace.yaml`, `tsconfig.json`.

**Interface:**

```ts
export interface ExpeditionRuntime {
  createProfile(): GuildProfile;
  startQuest(profile: GuildProfile, questId: string): GuildGameState;
  previewSkill(input: SkillPreviewInput): SkillPreview;
  resolveAction(input: BattleActionInput): BattleActionResult;
}
```

- [ ] Write a failing sync test proving one browser/native-safe ESM bundle exports the interface.
- [ ] Run `.\node_modules\.bin\vitest.cmd run scripts/sync-cocos-runtime.test.ts`; expect RED.
- [ ] Add the Cocos 3.8.8 project, esbuild sync script and typed bootstrap; run sync and expect GREEN.
- [ ] Open/build the boot scene and verify the roster IDs equal current game-data fixtures.

### Task 2: Complete Single-Screen Command Interaction

**Player outcome:** Tap a battlefield hero, inspect six skills, tap a skill and enemy to attack;
tapping the selected skill again attacks the current target. Remaining actors can be reordered.

**Files:** Create `packages/presentation-core/src/{index.ts,command-lens.ts,layout.ts}` and tests;
create Cocos scripts under `assets/scripts/battle/{BattleScene,UnitView,SkillDock,CommandLens,
TurnOrderController}.ts`; create prefabs under `assets/prefabs/battle/`.

**Interfaces:**

```ts
export function createCommandLens(input: CommandLensInput): CommandLensModel;
export function resolveBattleLayout(viewport: Viewport): BattleLayout;
```

- [ ] Write failing tests for select→inspect→target, repeat-tap execute, readiness reasons,
      damage/hit separation, order edits and all four viewport layouts.
- [ ] Run the focused presentation tests; expect RED, then implement pure models until GREEN.
- [ ] Bind Cocos nodes to those models; no separate unit button frames and no vertical scroll.
- [ ] Verify every visible value comes from simulation preview rather than Cocos arithmetic.

### Task 3: Event-Driven Escalating Combat Presentation

**Player outcome:** Every hero attacks immediately in sequence; relay, stack, chain, burst and
finisher beats become visibly and audibly stronger, including single-target echo/ricochet.

**Files:** Create `packages/presentation-core/src/{sequence,combat-cue,combo-tier}.ts` and tests;
create Cocos scripts under `assets/scripts/playback/{PlaybackDirector,ActorAnimator,CameraDirector,
VfxDirector,AudioDirector,DamageNumberPool}.ts`; create `assets/{animations,vfx,audio,art}/battle/`.

**Interfaces:**

```ts
export function compilePresentation(events: readonly GuildBattleEvent[]): PresentationSequence;
export interface BeatPlayer {
  play(beat: PresentationBeat, signal: AbortSignal): Promise<void>;
}
```

- [ ] Write failing tests for causal order, six escalation tiers, echo routing, skip, abort,
      animation timeout recovery and reduced motion.
- [ ] Implement the pure compiler and director contract; run focused tests until GREEN.
- [ ] Add original layered actor art, clips, particles, trails, hit-stop, camera and pooled numbers.
- [ ] Record a golden hunt trace proving every beat completes before the next actor begins.

### Task 4: Victory and Twenty-Drop Loot Burst

**Player outcome:** Victory transitions directly to an explosive reward reveal: materials summarize
at top, up to 20 mixed items fit one page, rarity drives color and tap opens details in place.

**Files:** Create `packages/presentation-core/src/loot-layout.ts` and test; create Cocos scripts
under `assets/scripts/rewards/{RewardScene,LootGrid,LootItemView,LootDetailSheet}.ts` and prefabs
under `assets/prefabs/rewards/`.

- [ ] Write failing tests for 4×5 fit, one skill maximum, material exclusion, rarity colors,
      Overkill quality progression and detail-sheet focus restoration.
- [ ] Implement the pure loot model and Cocos reward scene; run focused tests until GREEN.
- [ ] Verify a baseline win is low quality and escalating conditions increase quantity/quality.

### Task 5: Web and Windows Release Outputs

**Player outcome:** The same save and hunt can be played by touch in Web Mobile, mouse in Web
Desktop and pointer/controller-compatible Windows output.

**Files:** Create `apps/game-client-cocos/build-config/{web-mobile,web-desktop,windows}.json`,
`scripts/build-cocos.mjs`, `scripts/run-cocos-e2e.mjs`; modify root scripts and deployment staging.

- [ ] Write a failing build-config test for version, scenes, output paths and platform names.
- [ ] Implement reproducible Creator CLI builds and a managed preview server with guaranteed stop.
- [ ] Run Cocos Web E2E across the four viewports and launch the Windows executable smoke test.
- [ ] Stage the Web output for Cloudflare without replacing production until final verification.

### Task 6: Consolidated Quality Gate and Test Deployment

**Player outcome:** A public test URL provides the full hunt with no clipping, dead input,
ambiguous skill text, overlapping HUD, stalled animation or unreadable loot.

**Files:** Modify only findings in the files above; update this plan’s checkboxes and release notes.

- [ ] Review the complete player flow against every design requirement and fix all findings once.
- [ ] Run focused follow-up tests, then `pnpm.cmd check` exactly once after source stabilizes.
- [ ] Build Web/Windows again; run E2E and confirm managed test ports are closed.
- [ ] Commit one implementation batch, push, deploy Cloudflare Pages and verify canonical assets.
- [ ] Provide the live URL, Windows artifact path, verified checks and remaining store-signing gates.
