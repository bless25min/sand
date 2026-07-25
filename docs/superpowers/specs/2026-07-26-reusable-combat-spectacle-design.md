# Reusable Combat Spectacle Design

Date: 2026-07-26  
Status: Approved by the four-batch release direction.

## Player Outcome

Every visible combat event has an immediate, consistent impact language without making different
Builds, enemy families, hunts, bosses, and loot climaxes feel interchangeable.

The player should read the event from motion, color, sound, number treatment, and unit state before
reading the combat log.

## Vocabulary

One shared spectacle vocabulary covers:

- stack, trigger, block, break, hit, heal, ricochet, kill;
- Overkill, boss execution, Annihilation;
- chest opening and legendary loot.

Each cue declares label, intensity, hit-stop duration, shake distance, flash, trail, number tone,
backdrop, procedural tone, and bounded haptic identity. Presentation code projects this vocabulary;
it never changes simulation outcomes.

## Data Identity

`shared-types` owns only cross-package spectacle IDs and stable declarative contracts.

- Cards and rules may declare a spectacle cue ID.
- Builds use one of four motifs: ember retaliation, storm ricochet, radiance overflow, and command
  resonance reserved for Batch 3's fourth Build.
- Enemies declare family, role, palette, aura, and defeat treatment.
- Every hunt declares three authored beats: opening, execution, and annihilation.

`game-data` supplies identities. `simulation-core` copies declared cue IDs into traceable events.
React never infers combat meaning from localized message text.

## Reusable Layers

`CombatSpectacleLayers` renders a bounded stack:

1. hunt/build backdrop;
2. screen flash;
3. directional trails;
4. hit-stop/shake frame;
5. damage/heal/Overkill number;
6. execution or climax title.

`RewardSpectacleLayers` reuses the same registry for chest and legendary escalation above the
existing deterministic loot rain.

Unit cards expose one state at a time:

`idle → pressure → hit/block/heal → break → defeated`, with `execution` overriding living boss
states. Heroes and enemies use the same state contract but retain role/family identity.

## Layer Budgets

- Desktop: six trails, one number, one flash, one backdrop, one title.
- Mobile: three trails and the same semantic layers; controls remain above spectacle layers.
- Reduced motion: no shake, hit-stop transform, travel, flash animation, or falling motion.
  Backdrop, final unit state, number, and title remain visible.
- All spectacle layers are `aria-hidden`; live combat meaning stays in the existing status region.

## Architecture

- `simulation-core`: copies declarative cue IDs only.
- `game-data`: authors motifs, enemy identities, and three hunt beats.
- `apps/web/presentation`: cue registry and pure event/reward/unit projections.
- React: renders projections and data attributes.
- CSS/Web Audio/haptics: consume projections with bounded fallbacks.

No `Math.random`, viewport-dependent outcomes, DOM-owned damage, or per-hunt React branches.

## Validation

- Registry exhaustiveness and bounded duration/intensity tests.
- Content validators for identity references and exactly three distinct hunt beats.
- Simulation tests proving card/rule cue traceability.
- Playback tests for heal, block, ricochet, kill, phase, Overkill, and Annihilation.
- Component contracts for all layers, unit states, motifs, reward climax, mobile budgets, and reduced
  motion.
- Consolidated review, `pnpm check`, mobile/desktop browser proof, production deployment, live hash
  match, and complete production hunt.
