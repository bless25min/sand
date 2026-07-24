# SYSTEM BREAKER Meta Loop Design

Date: 2026-07-24  
Status: Approved by the user's instruction to complete the recommended work in sequence.

## Outcome

Finishing a run changes the next run in a visible, selectable way. The loop stays intentionally small: collect and improve fragments, choose one carry-in, unlock Hard difficulty, and improve persistent best scores.

## Batch Boundary

This batch owns local profile progression and difficulty. It does not add accounts, cloud sync, currencies, crafting, achievements, daily quests, or a battle pass.

## Local Profile

`SystemBreakerProfile` is versioned and stores:

- fragments keyed by stable `moduleId`;
- selected fragment ID or no selection;
- unlocked difficulties;
- selected difficulty;
- best score for each difficulty;
- completed runs and victories.

The profile is persisted as one localStorage value. Existing `system-breaker-fragment` data is migrated once and preserved.

## Fragment Collection

- A terminal run awards the run's saved fragment.
- A new fragment enters the collection at level 1.
- A duplicate increases its bonus by 1, capped at 3.
- The latest canonical display name replaces the prior name for the same ID.
- Players select at most one fragment before accepting a world contract.
- The active fragment and its exact bonus are visible during the run.
- The selection can be cleared; no fragment is a valid choice.

## Difficulty

- `NORMAL` is always unlocked.
- The first Normal victory unlocks `HARD`.
- Hard multiplies threat progress targets and integrity damage by 1.25, adds 2 instability on failed threats, and multiplies earned score by 1.5.
- Scaling lives in `simulation-core`; React only displays effective values.
- Hard awards progression through the same fragment rules, avoiding a second reward economy.

## Player Surfaces

- Entry shows collection count, completed runs, victories, and best scores.
- World contract shows difficulty selection and fragment carry-in selection.
- Game HUD shows active difficulty and carried fragment.
- Ending shows new fragment or upgrade, personal-best status, and newly unlocked difficulty.
- All controls are native buttons/selects with visible selected, disabled, focus, and reduced-motion states.

## Data Flow

1. The web initializer loads or migrates a profile.
2. Contract choices update reducer state.
3. `createSystemBreakerRun` receives difficulty and the selected fragment.
4. The pure core resolves the run and returns its terminal fragment.
5. `recordSystemBreakerResult(profile, run)` returns the next profile and reward summary.
6. React persists the returned profile and renders the summary.

## Module Boundaries

- `shared-types/system-breaker`: profile and difficulty contracts.
- `simulation-core/system-breaker/meta`: initial profile, profile evolution, and difficulty rules.
- `web/system-breaker/storage`: validation, migration, load, and save ports.
- Feature-local React components render profile, loadout, and reward state.

## Acceptance

- Tests cover first fragment, duplicate upgrade, cap 3, selection, Normal victory unlock, difficulty scaling, best-score updates, and legacy migration.
- Replay uses the newly updated profile without reloading the page.
- A completed run followed by replay visibly applies the selected fragment.
- Mobile entry and contract remain free of horizontal overflow.
- `pnpm check`, production build, and live two-run smoke test pass.

