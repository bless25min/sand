# Guild RPG Formal Release Four-Batch Roadmap

Date: 2026-07-25
Status: Approved direction; execute in order.

## Outcome

Move the deployed Guild RPG from a strong vertical slice to a self-explanatory, audiovisual,
content-rich formal web release. Every batch must ship one player-visible outcome and preserve the
deterministic `hunt → command → playback → loot → equip → replay` chain.

The product serves power fantasy. Do not add scarcity, balance work, monetization, accounts,
analytics, social systems, or unrelated platform work.

## Global Boundaries

- `simulation-core` owns battle, boss-phase, reward, forging, and challenge outcomes.
- `game-data` owns declarative heroes, cards, Builds, hunts, enemies, drops, audiovisual cue IDs,
  zones, challenges, and codex entries.
- `shared-types` contains only contracts used by at least two packages.
- React presents projections and dispatches intent; CSS, Web Audio, haptics, and animation never
  determine outcomes.
- Random outcomes use injected `RandomSource`; never use `Math.random`.
- Every major result emits a traceable event.
- New saves and existing version-2 saves must remain playable.
- Mobile required actions stay inside the 360–430 px right-thumb contract.
- Reduced motion preserves the final state and removes camera motion, flashes, and long transitions.

## Batch 1: First Annihilation Release Quality

**Player outcome:** A fresh player can choose an engine on mobile, learn the signature route while
time is paused, hear and feel every payoff, break the wolf pack into a visible execution phase, and
reach the first Annihilation without external explanation.

Deliver:

- Mobile Build page and engine selection.
- Skippable guided first hunt: target, stack, preview, release, playback, loot, equip, replay.
- Pause plus sound, music, haptic, and reduced-motion preferences.
- Browser-safe procedural audio cues and optional haptics unlocked by player gesture.
- Traceable wolf-boss execution phase after its guards fall.
- First-run, loss, reload, and settings recovery with no dead end.

## Batch 2: Reusable Combat Spectacle

**Player outcome:** Every emitted event has a consistent visual and sonic impact vocabulary, while
each Build, enemy family, boss, and reward climax still has a distinct identity.

Deliver:

- Presentation cue registry for stack, trigger, block, break, hit, heal, ricochet, kill, Overkill,
  phase change, Annihilation, chest, and legendary loot.
- Reusable hit-stop, shake, flash, trail, damage-number, execution, backdrop, and loot layers.
- Hero and enemy visual identities with idle, pressure, hit, break, defeated, and execution states.
- Build palettes and audiovisual motifs for retaliation, ricochet, healing overflow, and the fourth
  Build introduced in Batch 3.
- Layer budgets and reduced-motion fallbacks that keep mobile controls readable.

## Batch 3: Formal Content Scale

**Player outcome:** The player clears a four-zone, twelve-hunt campaign whose enemies, bosses,
counters, spectacle beats, and exclusive drops remain recognizably different.

Required content floor:

- 4 zones and exactly 12 ordered hunts, including the current border, mine, and shrine identities.
- At least 18 distinct enemy definitions and 6 bosses with traceable phase changes.
- 4 anchor Builds with different fantasies, signature routes, and counter coverage.
- Every hunt: one execution order, at least one unique pressure/counter interaction, one exclusive
  drop per enemy, one Annihilation chest, and three authored spectacle cues.
- Zone completion panels, next-zone transition, campaign completion, and immediate replay.

Content must use factories and validators so a new hunt is primarily data authoring, not new React
or simulation branches.

## Batch 4: Meaningful Replay and Power Growth

**Player outcome:** Replaying changes the engine, audiovisual payoff, equipment graph, objectives,
and records instead of merely increasing stored currency.

Deliver:

- Build-specific loadouts: choose 8 active cards from at least 16 authored cards.
- Forge actions that spend gold and enemy materials on deterministic upgrade, rule infusion, and
  affix reroll outcomes.
- Equipment rules change causal events and presentation cues, not only stats.
- Per-hunt challenge set: one-command wipe, Overkill threshold, Build route, and boss execution.
- Enemy, equipment, rule, Build, zone, and challenge codex with completion state.
- Ascended hunt modifiers that reuse existing content while changing pressure, route, and spectacle.
- Best-chain, best-Overkill, fastest-clear, highest-quality, challenge, and collection records.

## Release Gates

Each batch requires focused RED/GREEN tests, all affected Guild RPG tests, one consolidated review,
`pnpm check`, 375×812, 390×844, and desktop browser proof, exact committed Cloudflare deployment,
live asset hash verification, and one complete production player flow.

The four-batch goal is complete only when all requirements above are implemented, verified in the
current source, and proven in production.
