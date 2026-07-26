# Meaningful Replay & Power Growth — Implementation Plan

**Goal:** Turn campaign completion into an explicit, persistent replay-and-power loop
without moving gameplay outcomes into React.

**Architecture:** Extend cross-package contracts minimally, author replay content in
`game-data`, keep every mutation/evaluation in `simulation-core`, then expose three
focused guild surfaces through the existing desktop sections and four-tab mobile deck.

## 1. Arsenal and profile v3

- Add failing content, compile-build, profile, and save migration tests.
- Add four cards and `defaultCardIds` to each Build.
- Extend `GuildProfile` with loadouts, discovery, challenges, forge sequence/events.
- Create/load v3 defaults; migrate v1/v2; keep campaign unlock reconstruction.
- Add `swapBuildLoadoutCard`; compile only the selected eight.

**Proof:** Every default is legal/unique/eight cards; swap remains eight; old save
retains records/equipment and starts the same hunt.

## 2. Forge and equipment causality

- Add failing upgrade/infuse/reroll tests, including equipped-item mutation.
- Extend equipment with forge rank and discovery provenance.
- Implement deterministic costs, material resolution, and injected-random reroll.
- Persist bounded forge events and discoveries.
- Prove an infused rule enters `compileBuild`, emits `rule_triggered`, and carries a
  spectacle cue during a hunt.

**Proof:** All three operations persist, spend the authored cost, and visibly change
an item; the causal event test crosses profile → build → battle.

## 3. Challenges, Ascensions, archive, and records

- Add failing content validation and outcome evaluation tests.
- Author four challenges per hunt, three Ascensions, and generated archive entries.
- Add card IDs and command/chain counters to causal combo evidence.
- Evaluate challenge completion and update discoveries/records with rewards.
- Apply Ascension pressure, route, and cue context in `startGuildQuest`.

**Proof:** 48 valid challenges, three runtime-distinct Ascensions, and persisted
fastest/chain/Overkill/quality/challenge/collection records.

## 4. Desktop and mobile completion loop

- Add reducer tests for loadout, forge, and Ascended launch intents.
- Add loadout editor, forge workbench, and archive/replay command centre.
- Add the same surfaces as thumb-reachable overlays from Build, Inventory, and Quest.
- Add focused component/mobile-flow tests and responsive CSS.
- Keep existing tutorial, rewards, four-tab layout, and campaign navigation intact.

**Proof:** A player can configure, forge, launch Ascended, clear, inspect newly
completed challenges/records, reload, and repeat on desktop and 375 px mobile.

## 5. Release

- Run affected tests during each slice, then one consolidated `pnpm check`.
- Perform one consolidated code review; fix all Critical/Important findings and run
  focused follow-up checks.
- Browser-test desktop, 375×812, and 390×844 for flow, target size, overflow, runtime
  errors, and persisted reload.
- Commit once for implementation, optionally once for review fixes; push, deploy
  Cloudflare Pages, compare local/immutable/canonical asset hashes, and smoke the full
  production loop.
