# First Annihilation Release Quality Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `executing-plans` inline. Project policy
> prohibits subagent-driven development unless the user explicitly requests delegation.

**Goal:** Make a fresh player's first border hunt self-explanatory, pausable, audiovisual, and
climactic from mobile Build selection through first Annihilation and replay.

**Architecture:** Deterministic boss-phase events remain in `simulation-core`; `game-data` declares
the phase. Feature-local preferences, coach, cue projections, Web Audio, haptics, and UI never own
outcomes. Existing profile saves remain version 2; preferences use an independent versioned key.

**Tech Stack:** TypeScript, React 19, Vitest, CSS, Web Audio, Vibration API, pnpm, Cloudflare Pages.

## Global Constraints

- Preserve user-modified `AGENTS.md` and `docs/AI_DEVELOPMENT_SPEC.md`.
- No balance, scarcity, economy, new-hunt, account, analytics, or monetization work.
- No `Math.random`; major simulation results emit traceable events.
- Required mobile actions remain in the 360–430 px right-thumb deck with 56 px targets.
- Reduced motion preserves state and removes camera motion, flashes, and long transitions.
- Use focused RED/GREEN tests, one consolidated review, then one `pnpm check`.

---

### Task 1: Guide and Pause the First Hunt

**Player outcome:** A fresh player selects a Build on mobile, enters a clock-paused coach, follows
the retaliation signature route, can skip/replay guidance, and can pause or abandon safely.

**Files:** Create `preferences/guild-preferences.ts` and test,
`onboarding/first-hunt-coach.ts` and test, `mobile/build-thumb-actions.ts` and test,
`components/GuildSettingsPanel.tsx`; modify `GuildRpgApp.tsx`, `GuildMobileStage.tsx`,
`GuildMobileFocus.tsx`, `BattleScreen.tsx`, `BattleThumbControls.tsx`, reducer, clock hook, storage
tests, mobile contract tests, and Guild/Battle/mobile CSS.

**Interfaces:**

```ts
type TutorialState = "active" | "complete" | "skipped";
interface GuildPreferences { version: 1; tutorial: TutorialState; masterVolume: number;
  musicEnabled: boolean; hapticsEnabled: boolean; motion: "system" | "reduced"; }
parseGuildPreferences(serialized: string | null, hasProfile: boolean): GuildPreferences;
createFirstHuntCoach(input: CoachInput): { step: CoachStep; paused: boolean; message: string };
createBuildThumbActions(input: BuildActionsInput): readonly ThumbDeckAction[];
```

- [x] Write tests asserting fresh/legacy/invalid preference defaults; Build tab selection; coach
      steps `target → brace → riposte → sweep → preview → release → loot → replay`; pause clock and
      playback gating; settings, skip, replay, defeat, and abandon controls.
- [x] Run the focused files and verify RED for missing exports, `build` page, pause state, and coach.
- [x] Implement the parsers/projections first, then reducer actions `SET_PAUSED`,
      `SET_TUTORIAL`, and `ABANDON_HUNT`; wire four Guild tabs and stable Battle primary action.
- [x] Re-run focused tests, typecheck, and ESLint on touched files; verify GREEN and commit
      `feat: guide the first annihilation`.

### Task 2: Open the Wolf Execution Window

**Player outcome:** Defeating the final guard while the alpha lives emits one visible, previewable
execution phase, retargets the boss, and gives the next release a distinct climax.

**Files:** Modify shared hunt/runtime contracts; modify `game-data` hunts/validator/tests; create
`simulation-core/.../resolve-boss-phase.ts`; modify command resolver, combo tests, preview tests,
playback model/tests, battle presenter/tests, `BattleUnitCard.tsx`, and battle/playback CSS.

**Interfaces:**

```ts
interface HuntBossPhase { id: string; bossEnemyId: string;
  activateAfterEnemyIds: readonly string[]; pressureLabel: string; cueId: string; }
type ComboEventKind = ExistingComboEventKind | "boss_phase";
resolveBossPhase(input: BossPhaseInput): { event?: ComboEvent; selectedTargetId?: string };
```

- [ ] Write tests for content references, exact one-time activation after the last guard, no event
      after boss death, automatic boss target, cloned-preview parity, execution label, and stage cue.
- [ ] Run focused core/data/web tests and verify RED for missing phase contracts and resolver.
- [ ] Implement the declarative phase and invoke the pure resolver after each defeated guard; keep
      damage unchanged and include phase state in runtime so repeated commands cannot re-emit it.
- [ ] Re-run focused tests, typecheck, and ESLint; verify GREEN and commit
      `feat: open wolf execution phase`.

### Task 3: Hear and Feel the Causal Chain

**Player outcome:** Stack, trigger, block, break, hit, kill, Overkill, boss execution,
Annihilation, loot, and rule activation each have bounded sound/haptic identities.

**Files:** Create `presentation/sensation-cues.ts` and test,
`effects/browser-sensation-output.ts` and test, `hooks/use-sensation-output.ts`; modify preferences,
settings, App, Battle/Playback/Reward/Guild screens, and motion/impact CSS.

**Interfaces:**

```ts
type SensationCueId = "stack" | "trigger" | "block" | "break" | "hit" | "kill" |
  "overkill" | "boss-execution" | "annihilation" | "loot" | "rule-online";
projectSensationCues(input: CueProjectionInput): readonly SensationCueId[];
interface SensationOutput { unlock(): void; play(cue: SensationCueId): void;
  setPaused(paused: boolean): void; dispose(): void; }
```

- [ ] Write tests for ordered/deduplicated cue projection, volume clamp, muted/unsupported adapters,
      bounded haptic patterns, user-gesture unlock, pause/visibility suspension, and reduced motion.
- [ ] Run focused tests and verify RED for the missing projection and browser adapter.
- [ ] Implement injected AudioContext/vibration ports, procedural gain envelopes and pulse bed; hook
      only to newly visible events/messages so React rerenders never replay old cues.
- [ ] Re-run focused tests, typecheck, and ESLint; verify GREEN and commit
      `feat: amplify battle sensation cues`.

### Task 4: Prove and Release Batch 1

**Player outcome:** A fresh production player completes the guided first-hunt chain on phone and
desktop with pause/settings, phase, audio fallback, rewards, and replay free of dead ends.

- [ ] Run every Guild RPG test, then a consolidated requirement review; fix findings with failing
      regressions and rerun affected tests.
- [ ] Run `pnpm check` once; build/serve the exact commit and inspect fresh-save, existing-save,
      skip, defeat, abandon, muted, unsupported haptics, reduced motion, reload, and replay paths at
      375×812, 390×844, and desktop.
- [ ] Record validation under `docs/reviews/`, commit excluding protected files, push the remote
      default branch, deploy exact assets to `ai-expedition-legion-rpg`, and verify deployment ID,
      canonical/immutable 200 responses, live JS/CSS hashes, console, and production full flow.
