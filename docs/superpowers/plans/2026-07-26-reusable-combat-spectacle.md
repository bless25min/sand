# Reusable Combat Spectacle Implementation Plan

**Goal:** Give every battle and reward event a reusable visual/sonic identity while keeping combat
outcomes deterministic and mobile controls readable.

**Architecture:** Shared IDs connect data, simulation events, and web projections. Game data authors
identity; simulation copies cue IDs; pure web projections choose bounded layers; React/CSS/audio
render without owning outcomes.

## Task 1: Declare and Trace Spectacle Identity

**Player outcome:** Cards, rules, enemy families, Builds, hunts, and bosses retain recognizable
identity through the whole hunt.

**Files:** Shared spectacle contracts and exports; combo card/rule/hunt contracts; game-data
cards/rules/builds/hunts/validators/tests; simulation command and rule resolution/tests.

- [ ] RED: invalid cue, missing enemy identity, missing/duplicate hunt beat, and missing event cue
      tests.
- [ ] Add the exhaustive cue and motif IDs, enemy identity, and hunt beat contracts.
- [ ] Author current cards, rules, three Builds, eight enemies, and three hunts; reserve command
      resonance for Batch 3.
- [ ] Copy card/rule cue IDs into emitted events without changing damage or event order.
- [ ] Run shared/data/simulation focused tests and commit.

## Task 2: Project the Reusable Spectacle

**Player outcome:** Stack, trigger, block, hit, heal, ricochet, kill, execution, Overkill, and
Annihilation produce distinct but consistent feedback.

**Files:** Create `presentation/spectacle-registry.ts` and tests,
`presentation/unit-spectacle-state.ts` and tests; modify playback model/tests, sensation cues/tests,
tone/haptic patterns/tests, battle sensation model/tests.

- [ ] RED: exhaustive registry, event/reward projection, layer-budget, unit-state priority, and new
      audio/haptic identity tests.
- [ ] Implement pure registry and projections; derive ricochet from event cue IDs, never messages.
- [ ] Extend reward transition cues to loot → chest → legendary.
- [ ] Run focused web presentation/effect tests and commit.

## Task 3: Render Combat and Reward Layers

**Player outcome:** Playback visibly stops, shakes, flashes, trails, numbers, changes backdrop, and
lands on execution/loot climaxes while each unit remains readable.

**Files:** Create `CombatSpectacleLayers.tsx`, `RewardSpectacleLayers.tsx`; modify playback, unit,
reward components; add `combat-spectacle.css`; update app CSS imports and contract tests.

- [ ] RED: layer, motif, unit-state, reward-climax, mobile-budget, and reduced-motion contracts.
- [ ] Render bounded semantic layers with unit/family/build/hunt data attributes.
- [ ] Keep spectacle below the right-thumb deck and preserve final reduced-motion state.
- [ ] Run focused component tests, typecheck, and lint; commit.

## Task 4: Review, Verify, and Release Batch 2

- [ ] Run all affected Guild RPG tests and one consolidated requirement review; fix findings with
      regressions and rerun focused checks.
- [ ] Run `pnpm check` once after source settles.
- [ ] Prove 375×812, 390×844, and desktop Build motifs, unit states, all impact kinds, reduced
      motion, reward layers, pause/settings, and a complete hunt.
- [ ] Record `docs/reviews/reusable-combat-spectacle-validation.md`, commit excluding protected
      files, push, deploy exact assets to `ai-expedition-legion-rpg` production, and verify
      deployment metadata, hashes, console, and full production flow.
