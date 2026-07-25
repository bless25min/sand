# Knight & Dragon Inspired Guild RPG MVP

Date: 2026-07-25
Status: Approved direction; awaiting written-spec review.

## Product Goal

Build the project's primary game architecture around the proven loop:

`guild preparation -> quest -> real-time gauge battle -> loot and experience -> equipment decision -> retry or advance`

The implementation may reproduce general mechanics, but must not copy Knight & Dragon names,
story, artwork, text, data, or screen composition.

## One-Day Boundary

The MVP is complete only when a player can finish and repeat the whole loop. It includes:

- three fixed adventurers;
- three replayable quests;
- real-time action gauges;
- one player-controlled leader and two automated allies;
- target selection, skills, threat/aggro, victory, and defeat;
- experience, levels, text-only equipment drops, compare/equip/sell;
- quest unlocking and a versioned local save;
- responsive keyboard-accessible web UI.

It excludes recruitment, class changes, six-unit parties, crafting, materials, injury, supply,
natural-language orders, AI-generated worlds, Pixi battlefield movement, accounts, and cloud saves.

## Player Loop

1. Start with Vanguard, Ranger, and Cleric.
2. Inspect equipment and choose an unlocked quest.
3. Enter a 20-45 second battle.
4. Gauges fill independently from Speed.
5. Allies act from deterministic role policies. The player chooses the leader's skill and target.
6. Victory grants experience, gold, and two text equipment choices.
7. Compare each item against the equipped slot, then equip, keep, or sell.
8. Replay for better rolls or challenge the newly unlocked quest.
9. Defeat causes no inventory or currency loss and returns directly to preparation.

## Day-One Content

### Party

- Vanguard: high HP/defense; attack and taunt/guard skills.
- Ranger: high attack/speed; attack and focused-shot skills.
- Cleric: healing power; attack and heal skills.
- Stats: HP, Attack, Defense, Speed, and Healing.
- Slots: Weapon, Armor, Accessory.

### Quests

1. Border Pack: onboarding and basic target choice.
2. Abandoned Mine: punishes a party without defense and healing.
3. Dragon Shrine: boss damage check and first repeat-farming goal.

Each quest has a stable ID, recommended level, enemy formation, first-clear reward, loot table,
unlock rule, and deterministic battle seed.

### Equipment

- Five rarities and three slots.
- A base item supplies one main stat.
- An item rolls zero to two affixes from a twelve-affix data table.
- Affixes must affect actual combat behavior or derived combat stats.
- The comparison projection shows every increase and decrease before equipping.
- Inventory is capped at 20 items; selling creates gold.
- No equipment image or appearance contract is required.

## Battle Contract

- Simulation advances through explicit elapsed-time input; React timers never decide outcomes.
- A ready unit acts once and resets its gauge.
- Auto policies are pure functions of visible battle state.
- Vanguard prioritizes protection when an ally is threatened.
- Cleric heals below a documented HP threshold; otherwise attacks.
- Enemies target the highest threat, with stable-order tie breaking.
- The leader waits for player input when ready; Auto mode may delegate it to the same pure policy.
- Speed modes change presentation cadence, not simulation results.
- All randomness uses injected `RandomSource`; identical state, input, and seed give identical output.

## Architecture

```text
shared-types/guild-rpg     cross-package battle, quest, equipment, and save contracts
simulation-core/guild-rpg pure battle, policy, loot, and reward functions
game-data/guild-rpg       adventurers, skills, affixes, enemies, and quests
web/guild-rpg             reducer, timer shell, local storage adapter, and components
```

- Keep feature-local types out of `shared-types` until a second package consumes them.
- Do not reuse legion `UnitState`; troop, formation, morale, and casualty fields are wrong concepts.
- Reuse the existing seeded random interface and repository fitness checks.
- Do not make a generic RPG engine in the first batch.
- The default app renders `GuildRpgApp`.
- Preserve prior prototypes behind explicit query parameters; do not delete them in this batch.

## UI Structure

- Guild screen: party summary, equipped stats, inventory, and quest list.
- Battle screen: enemy row above, party row below, gauges, HP, current target, and skill controls.
- Reward screen: experience/level changes and two equipment comparison cards.
- Use CSS/DOM cards and bars. No canvas or new art dependency is required.
- At 375 px, primary action, ready unit, target, and comparison remain visible without horizontal
  scrolling.
- Respect focus-visible and reduced-motion preferences.

## Persistence

`GuildSaveV1` stores party progression, equipment, inventory, gold, quest unlocks, best clears, and
the next deterministic loot seed. Invalid or future save versions fail closed to a new profile.
Ephemeral battle timers, selections, and animation state are never persisted.

## Verification

- Pure tests: gauge order, threat targeting, healing policy, defeat safety, seeded loot, item
  comparison, equip effects, rewards, and unlocks.
- One reducer integration test proves:
  `start -> win -> receive loot -> equip -> replay -> changed combat result`.
- Build and architecture checks prove React does not own combat outcomes.
- Browser smoke test proves the three-screen loop, local persistence, mobile width, and no dead
  controls.

## Acceptance

- A new player starts the first battle within 30 seconds.
- All three quests can be cleared and replayed.
- Every victory grants usable progression.
- Equipping an item visibly changes the next battle.
- Defeat allows immediate adjustment and retry without loss.
- Refresh preserves durable progress.
- The deployed production URL completes the loop without developer fixtures or console commands.

## Later Evolution

After retention of this loop is validated:

1. expand from adventurers to six legion leaders;
2. add class changes, skills, crafting, and deeper equipment interactions;
3. replace direct leader skill input with natural-language military orders;
4. add the optimized Pixi legion battlefield as a presentation adapter;
5. reintroduce AI theme generation only after the deterministic game remains playable without it.

## References

- https://dgjam.com/knightdragonen/battleguide/
- https://dgjam.com/knightdragon3/guideen/
- https://dgjam.com/knightdragonen/qa-help/
