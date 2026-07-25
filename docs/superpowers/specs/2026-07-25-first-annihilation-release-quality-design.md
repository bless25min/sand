# First Annihilation Release Quality

Date: 2026-07-25
Status: Awaiting written-spec confirmation.

## Player Outcome

A fresh player opens the game, understands the selected engine, completes the retaliation signature
route, sees the wolf pack break into an execution window, reaches Annihilation, equips the best
drop, and returns to replay without external instruction or an unreachable control.

This batch improves the first hunt only where a reusable contract is required. It does not add new
hunts, card pools, forging, art-production pipelines, economy work, or balance changes.

## First-Run Guidance

Fresh profiles start in a guided state. The mobile Guild adds a Build page before Quest so the
player can inspect and select all three engines. `反擊壁壘` remains preselected, and its panel states
the fantasy, signature cards, counter target, and payoff.

Starting the border hunt pauses the battle clock and opens a compact coach panel inside the
right-thumb deck. The ordered guidance is:

1. confirm the execution target;
2. play `架盾`;
3. play `盾後反擊`;
4. play `破陣橫掃`;
5. inspect predicted events, kills, and Overkill;
6. release and watch or skip playback;
7. process each drop through recommended equip;
8. return and use `帶新引擎重刷`.

The player may skip guidance at any step. Invalid actions remain available but the coach explains
why they do not advance the signature route. Guidance completion and skip state persist separately
from the deterministic profile and migrate independently from version-2 saves.

## Pause and Preferences

`GuildPreferences` is a feature-local versioned record:

```ts
interface GuildPreferences {
  version: 1;
  tutorial: 'active' | 'complete' | 'skipped';
  masterVolume: number;
  musicEnabled: boolean;
  hapticsEnabled: boolean;
  motion: 'system' | 'reduced';
}
```

Preferences use a separate local-storage key and safe parser. Invalid data restores defaults.
Fresh players default to active guidance, volume `0.45`, music on, supported haptics on, and system
motion. When a profile save exists but no preference record exists, guidance defaults to skipped so
existing players are not forced back through onboarding.

Pause is runtime UI state. It stops the battle clock and guidance progression but never rewinds or
changes simulation state. Opening Settings or the first coach step pauses automatically. Resume,
sound, music, haptics, motion, tutorial replay, and return-to-guild actions stay reachable from the
right-thumb deck. A confirmation protects abandoning an active hunt.

## Audiovisual Feedback

A feature-local cue projection maps existing events and presentation stages to semantic cue IDs:

`stack`, `trigger`, `block`, `break`, `hit`, `kill`, `overkill`, `annihilation`, `loot`,
`rule-online`, and `boss-execution`.

The browser adapter uses Web Audio oscillators/noise and gain envelopes, initialized only after a
player gesture. It owns no game timing and fails silently when audio is unavailable. Music is a
low-volume procedural pulse that intensifies during playback and stops on pause or hidden tabs.

The haptic adapter maps cue IDs to bounded vibration patterns and checks preference and API support.
Tests inject fake audio and haptic ports; production code never reads hardware APIs in simulation.

## Wolf Execution Phase

The border hunt declares one presentation-relevant boss phase. After a resolved effect defeats the
last living guard while the wolf alpha remains alive, simulation emits one traceable `boss_phase`
combo event with the phase ID `alpha_execution_window`. The event can occur only once per battle.

The phase does not increase difficulty. It exposes the already-existing loss of guard protection,
retargets the alpha when necessary, changes its pressure copy to `處決窗口`, and gives the next
release a boss-execution cue, backdrop treatment, and climax pause. Preview uses the same phase rule
against its cloned battle, so predicted and resolved events agree.

## UI and Recovery

- Mobile Guild tabs become Build, Quest, Party, and Inventory without exceeding five deck actions.
- The Build focus card and deck permit previous, next, and activate using one thumb.
- Battle exposes Pause/Settings without moving the release button.
- Coach, Settings, and pause layers never cover the active primary action or enemy HP.
- Reload returns to Guild with saved preferences and profile; active battles are not claimed saved.
- Defeat explains materials retained and offers Guild return plus tutorial replay.
- All controls expose names, pressed/selected state, disabled reasons, and 56 px minimum targets.

## Architecture

- `shared-types`: add only the boss-phase/event contracts consumed by game data and simulation.
- `game-data`: declare the border alpha execution phase and validate its references.
- `simulation-core`: derive and emit the phase event exactly once; preview reuses the same resolver.
- `web/guild-rpg`: preferences storage, coach projection, pause state, cue projection/adapters,
  Build mobile actions, and presentation layers.
- No outcome branch is introduced in React, CSS, audio, or haptic code.

## Verification

- TDD for preference parsing, mobile Build actions, coach progression, pause gating, cue projection,
  audio/haptic fallbacks, boss phase emission, preview parity, and one-time phase behavior.
- Existing version-2 save and reduced-motion tests remain green.
- Fresh-save browser flow at 375×812 and 390×844 completes the entire guidance and replay chain.
- Desktop exposes the same pause/settings and audiovisual state without mobile overlays.
- Muted, unsupported audio, unsupported haptics, reduced motion, reload, defeat, skip, and abandon
  paths have no dead controls or console errors.
- `pnpm check`, exact committed build, Cloudflare deployment record, live hashes, and production
  full-flow proof gate completion.
