# Reusable Combat Spectacle Quality Validation

## Scope

Batch 2 turns combat feedback into one reusable, traceable presentation system:

1. cards, rules, enemies, hunts, and rewards author stable spectacle identities;
2. simulation events preserve cue provenance without transferring battle ownership to the UI;
3. web projections map events to bounded visual, audio, and haptic feedback;
4. playback renders hit-stop, shake, flash, trails, numbers, execution backdrops, and loot tiers;
5. mobile and reduced-motion modes retain clarity while lowering motion density.

## Consolidated Review

The single batch review found no Critical issues and seven Important issues. All were fixed in the
same batch:

- Effect semantics now win over incompatible authored cues, so damage cannot appear as healing and
  break/trigger damage keeps its target and amount.
- Playback derives visible boss phases from visible events instead of the final resolved runtime.
- The battlefield remounts on each newly visible event so repeated hit, flash, trail, and number
  animations replay reliably.
- Foreground effect layers render above units while battlefield hit-stop and shake affect the
  actual combat content.
- Reduced-motion mode keeps reward titles visible while disabling motion and burst decoration.
- Enemy palettes, roles, auras, defeat identities, hunt labels, and Build audio pitch now affect the
  renderer instead of remaining metadata only.
- Multi-cue rewards use one ordered haptic pattern and scheduled pitched tones instead of
  overlapping or replacing each other.
- Desktop trails are bounded at six; mobile retains at most three.

## Focused Verification

- Spectacle contract and content validation tests.
- Effect-semantic cue projection and legacy fallback tests.
- Playback boss-phase visibility tests.
- Component contracts for foreground layers, unit states, hunt identity, and tiered rewards.
- Ordered reward haptic and Build-pitched audio tests.
- Mobile flow, reduced-motion CSS, combo flow, and playback regression tests.

## Batch Gate

Final `pnpm check`, responsive browser proof, production deployment evidence, and immutable asset
hashes are recorded after the review-fix source is frozen.
