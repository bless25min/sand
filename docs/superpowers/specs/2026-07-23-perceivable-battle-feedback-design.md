# Perceivable Battle Feedback Design

Date: 2026-07-23  
Status: Approved direction; written review pending

## Goal

Turn the existing clickable battle slice into a perceptibly playable MVP: every fixed order must produce an immediate, visible, and understandable response without changing the deterministic battle rules.

## Success Criteria

- At a 1280 x 720 viewport, the battlefield and command controls are visible at the same time.
- Selecting a unit visibly identifies it on the battlefield.
- `ADVANCE`, `HOLD`, `ATTACK`, `CHANGE_FORMATION`, and `RETREAT` each produce distinct feedback.
- A command result states the unit, action, and consequence instead of only the generic event type.
- Movement transitions from the previous visual snapshot instead of rebuilding the Pixi application.
- Contact shows troop and morale deltas; retreat shows a retreating visual state.
- Automated tests fail when command feedback exists only as a Tick change.

## Considered Approaches

### A. Persistent renderer and compact tactical cockpit — selected

Keep one Pixi application mounted, update it through `setPoints`, and place a compact command/readout panel beside the battlefield. Add small overlays for selection, intent, and recent result.

This fixes the renderer lifecycle and visibility problems without replacing the current command model.

### B. Sticky command bar only

Keep the existing renderer and pin controls over the page. This is the smallest patch, but commands would still cause canvas replacement, generic event text, and indistinguishable states.

### C. Direct map controls

Allow selecting units and targets directly on the canvas. This is closer to an RTS, but introduces input picking, target validation, path previews, and new command semantics outside this batch.

## Architecture

### `packages/pixi-renderer`

- `createVisualPoints` remains the pure source-to-point mapper.
- `reconcileVisualPoints(previous, next)` produces points that start at the previous rendered position and move toward the next snapshot.
- `mountPointCloud` owns one Pixi application and updates it through `setPoints`.
- Visual execution states include selected, holding, attacking, retreating, routing, and casualty presentation without owning battle outcomes.

### `apps/web/src/battlefield`

- `BattlefieldDemo` mounts once and calls `setPoints` when sources change.
- `createBattlefieldFeedback` converts selected unit and last order into renderer-only markers and labels.
- React owns accessible textual equivalents for every visual marker.

### `apps/web/src/game-session`

- `createCommandFeedback` is a pure display-model function.
- Input: previous battle state, current battle state, and selected unit.
- Output: action label, tone, summary, troop delta, morale delta, and movement description.
- `PlayableExpedition` remains the thin composition root.
- Battle rules and outcomes remain in `simulation-core`.

## Interaction Layout

- Desktop: battlefield and tactical console use a two-column cockpit within one viewport.
- The command area stays visible while the battlefield animates.
- Mobile: battlefield remains above a sticky command bar.
- The selected unit gets a high-contrast marker and matching roster state.
- A command banner appears immediately after every order.
- Attack/contact uses a target line and impact pulse; troop and morale deltas appear in the readout.
- Hold uses a defensive marker; formation change labels the new formation; retreat uses an outbound trail.

## Testing

- Unit tests for `createCommandFeedback` cover all five actions and combat deltas.
- Unit tests for point reconciliation prove previous positions are retained as animation origins.
- Component tests prove the same mounted renderer receives updates without application recreation.
- E2E verifies the battlefield and controls overlap the viewport, each command changes accessible feedback, formation changes are named, and retreat is visible.
- Run affected tests during implementation, then one `pnpm check` and one `pnpm test:e2e` at the batch gate.

## Non-Goals

- No changes to combat formulas, enemy AI, unit progression, or loot.
- No direct canvas targeting, drag selection, camera controls, sound, or new art assets.
- No new shared abstraction unless a second package consumes the contract.

## Risks and Controls

- Point identity must stay stable during reconciliation; key by visual point ID and unit ID.
- Renderer updates may arrive before async mount finishes; retain the latest pending snapshot.
- Overlays must not intercept command input.
- Accessible text is the source of E2E truth; pixel differences remain supplementary evidence.
