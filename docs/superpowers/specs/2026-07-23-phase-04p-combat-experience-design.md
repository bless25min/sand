# Phase 04P Combat Experience Design

## Status

- Date: 2026-07-23
- Authority: `docs/AI_DEVELOPMENT_SPEC.md`
- Player outcome: one readable command-turn battle that fits the desktop viewport and
  produces distinct movement, ranged attack, contact, morale, and routing feedback.

## Problem

The current loop is functionally traceable but presents itself as an engineering
dashboard. The battlefield starts below the fold, diagnostics compete with commands,
four geometric point groups lack readable status, and static progression demonstrations
are shown beside the live session. The playable battle also bypasses the existing
Greyfang encirclement planner.

## Chosen Direction

Use a command-turn tactical cockpit. Each order advances one deterministic simulation
turn, then the battlefield and HUD expose the result. This preserves the current
Functional Core while making cause and effect readable.

The UI Pro Max research contributes the immersive full-screen pattern, dark felt-green
and warm-gold palette, 150–300 ms interaction timing, explicit focus states, a small
z-index scale, and reduced-motion support. Hyperrealistic 3D and sci-fi typography are
rejected because they hurt performance, accessibility, and the grounded dark-fantasy
direction.

## Scope

### 1. One-screen battle cockpit

- At 1280 × 720, mission status, battlefield, unit selection, commands, enemy intent,
  and the latest result must be visible without scrolling.
- The battlefield receives at least 65% of cockpit width.
- Build labels and renderer diagnostics move into one collapsed developer-evidence
  disclosure below the live loop.
- Static progression snapshots remain available only inside that disclosure; they no
  longer compete with the active battle.

### 2. Distinct command-turn outcomes

- `ADVANCE`: the selected unit moves normally while Greyfang executes a rule-owned
  hunting or encirclement plan.
- Archer `ATTACK`: inside ranged distance and outside contact distance, resolve a
  deterministic volley without inventing results in React.
- Other `ATTACK`: preserve forced movement and contact resolution.
- `HOLD`: preserve position while the enemy advances; the HUD labels the defensive
  intent.
- `CHANGE_FORMATION` and `RETREAT`: keep current rules and make their state immediately
  visible.

### 3. Rule-owned Greyfang intent

- `simulation-core` uses `planGreyfangMovement` for playable turns.
- A focused movement adapter applies the returned target and speed without moving rule
  ownership into the renderer.
- The resulting `HUNTING`, `ENCIRCLING`, `ENGAGED`, or `ROUTING` state is exposed as an
  enemy-intent label and visual treatment.

### 4. Readable battlefield state

- `VisualUnitSource` carries normalized morale, fatigue, and cohesion because the
  renderer needs them.
- Cohesion affects formation spacing, morale affects opacity/orientation stability, and
  fatigue affects visual trailing. Effects remain deterministic.
- DOM overlays label friendly formations and Greyfang intent without covering the point
  cloud.
- Contact or ranged losses produce a short impact pulse and floating loss values.
- Color is never the only state indicator; labels and shapes remain present.

## Architecture

- `simulation-core/session`: Greyfang movement and ranged-volley facts.
- `shared-types`: only stable event or visual contracts used by multiple packages.
- `pixi-renderer`: deterministic state-to-point presentation, no combat outcomes.
- `apps/web/game-session`: reducer composition and player-facing feedback.
- `apps/web/battlefield`: overlays, labels, impact pulse, and scene composition.
- React may select and display facts but may not calculate casualties, morale, loot, or
  monster tactics.

## File Boundaries

- Each new rule function receives one explicit input object and returns one result.
- Enemy-intent copy, unit HUD projection, and impact projection remain separate pure
  web adapters.
- Battlefield components receive view models rather than the entire session.
- Existing files near 150 lines are split only when this batch adds a second change
  reason.

## Testing

- Simulation tests prove deterministic ranged casualties and Greyfang encirclement is
  used by the playable turn.
- Renderer tests prove morale, fatigue, and cohesion change point projection
  deterministically.
- Web adapter tests prove intent, labels, and impact values come from state deltas.
- React tests prove engineering evidence is collapsed and the active cockpit leads the
  page.
- Playwright proves the 1280 × 720 cockpit overlap, one persistent canvas, distinct
  advance/ranged/contact feedback, visible enemy intent, and no page errors.

## Exit Gates

1. A player can identify objective, selected unit, enemy intent, and available orders
   in the first viewport.
2. Advance, archer attack, melee contact, formation change, and retreat have distinct
   text and visual states.
3. Archer attack can damage Greyfang before contact through `simulation-core`.
4. Greyfang can visibly enter `ENCIRCLING` through the existing planner.
5. Primary page height at 1280 × 720 is under 900 px before a post-battle phase.
6. The main page contains no open diagnostic grid or static growth report.
7. One Canvas persists across commands and the 2,000-point budget remains intact.
8. `pnpm check` and `pnpm test:e2e` pass.

## Deferred

- Domain routes, supplies, persistence, natural-language commands, AI narrative.
- Additional monster families, sound production, camera zoom, and authored art assets.
- Full Phase 5 growth integration; this batch removes its static report from the active
  play surface and prepares a later rule-connected settlement screen.
