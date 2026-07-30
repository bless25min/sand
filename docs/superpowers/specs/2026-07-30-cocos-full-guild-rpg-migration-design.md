# Project Expedition Cocos Full Guild RPG Migration

**Date:** 2026-07-30  
**Status:** Approved by the active goal to migrate every player-facing Guild RPG flow.

## Problem

The first Cocos release implemented one battle and a reward overlay. The shipping React Guild RPG
contains 34 state-changing commands across guild, quest, party, skills, equipment, battle, rewards,
preferences, tutorial and persistence. Treating a playable battle slice as a migrated product was a
scope error.

## Completion Definition

Migration is complete only when Cocos provides every current Guild RPG player flow:

1. Versioned save load, v1-v5 migration, automatic persistence and new-game recovery.
2. Fixed-screen guild shell with quest, party, skills and equipment pages.
3. Four campaign zones, quest locks, records, challenges and ascension selection.
4. Six-member selection and persistent default relay order.
5. Six skill slots per hero, inventory filters, equip, fusion, component reorder/replacement and
   dismantle.
6. Three equipment slots, inventory pagination, equip/compare, forge, core transplant, lock,
   favorite, single and batch salvage.
7. Battle target/actor/skill interaction, current-order edits, carry-order setting, abandon,
   victory and defeat.
8. Reward inspection, equip-to-hero, keep, route to equipment/fusion and replay.
9. First-hunt tutorial, audio/haptics/motion preferences and tutorial replay.
10. One uninterrupted loop from loaded guild to hunt, rewards, build change, replay and reload.

Archived `LegacyExpedition` and `SystemBreaker` prototypes are not part of the shipping Guild RPG
and remain available in the React reference client.

## Architecture

Create `packages/guild-session-core` as the single platform-neutral application state machine.
It owns `GuildRpgState`, all 34 `GuildRpgAction` variants, tutorial progression, reward reduction,
preference codecs and save migration. It consumes `game-data`, `simulation-core` and
`shared-types`; it has no React, DOM, Cocos or storage implementation dependency.

React becomes a thin adapter that imports the shared session package. Cocos bundles the same
package through `scripts/cocos-runtime-entry.ts`. Web uses `localStorage`; native Cocos uses
`sys.localStorage`, both through the same `GuildSavePort`.

`GuildGameController` is the Cocos composition root. It owns one session state, dispatches actions,
persists after profile/preference changes and switches among `GuildScene`, `BattleScene` and
`RewardScene`. Cocos never calculates outcomes.

## Interface and Information Design

The guild is a fixed app shell: resource strip, one content viewport and four bottom destinations.
Collection pages show compact rows/cards first; selecting one opens a detail sheet over the same
screen. No primary flow requires document scrolling.

Quest, hero, skill, equipment and loot use the same interaction grammar:

- tap an entity to select it;
- the central action area explains the immediate consequence;
- tap the primary action to commit;
- destructive actions require a second explicit confirmation;
- closing details restores the previous selection.

Battle retains direct battlefield selection and causal visual feedback. Management screens favor
comparison and clear next actions over combat spectacle.

## State and Error Handling

Every dispatch returns a valid state and a player-facing message. Invalid selections leave state
unchanged. Corrupt saves fall back to a new profile without overwriting the source until a valid
replacement is stored. Terminal battle states reject further commands. Animation cancellation
restores an interactive, fully rendered state.

## Verification

- Contract tests enumerate all 34 actions and prove the shared session reducer owns them.
- Reference parity tests replay representative React action sequences against the extracted core.
- Pure view-model tests cover fixed-screen layout, pagination, selection and detail restoration.
- Cocos E2E covers first hunt, reward collection, equipment, forge, skill equip/fusion, party order,
  replay and reload at mobile and desktop sizes.
- `pnpm check`, Cocos Web builds, Windows native build/smoke and live Cloudflare verification are
  mandatory before completion.
