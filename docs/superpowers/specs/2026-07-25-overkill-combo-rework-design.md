# Overkill Combo Rework

Date: 2026-07-25
Status: Approved concept; written specification awaiting review.

## Product Goal

The game serves one primary feeling: the player builds a combat engine, releases it, and watches it
escalate into an excessive combo and a rain of loot.

The repeatable loop is:

`hunt target -> assemble build -> stack one command -> release -> chain -> overkill -> loot rain -> rebuild`

The game does not pursue competitive balance. It must provide several materially different ways to
become overwhelmingly powerful while keeping every cause, trigger, and reward understandable.

## Final Decisions

- Cards have no global mana, energy, or ascending-cost requirement.
- Creativity comes from trigger conditions, ordering, party composition, equipment, and enemy state.
- Enemies continue acting at an initially tuned 0.25x speed while the player assembles a command.
- The player may release early for safety or keep extending the command for a larger payoff.
- Once released, the complete command resolves without interruption or further player input.
- A chain continues after lethal damage; remaining output becomes Overkill.
- Failure grants enemy-specific materials but never equipment.
- A kill unlocks that enemy's equipment table.
- Individual Overkill and encounter-wide Annihilation are independent, stackable reward axes.
- More ordinary quests, generic stat affixes, and visual polish are deferred until one hunt is fun.

## Free-Form Command Stack

Each adventurer contributes cards. A card contains:

- stable ID, owner, and readable name;
- input triggers and emitted tags;
- targeting rule and hit pattern;
- immediate effect;
- follow-up triggers;
- support sockets and equipment modifiers;
- trace text explaining why it activated.

Cards do not consume a universal resource. A combo exists when one result satisfies another card's
trigger. Examples include Block, Hit, Critical, Marked, Burning, Healed, Killed, and Overkill.

One command begins when the player selects an initiator and arranges available cards or branches.
The command ends only when its trigger queue is empty. Every resolved action receives a causal ID so
the battle report can reconstruct the entire chain.

## Build System

Build depth comes from rule changes rather than more additive stats:

- Talents define starting triggers; skill cards define attacks, protection, healing, and finishers.
- Supports alter targeting and routing; equipment adds conversions; attributes provide overflow fuel.
- Party composition connects otherwise separate trigger families.

Example rule changes include ricochet on Mark, healing overflow becoming holy damage, Block copying
the next projectile, Critical above 100% becoming critical tiers, and kills spreading all debuffs.

The target is not equal build strength. The target is that boss burst, swarm chaining, retaliation,
healing conversion, summoning, and status detonation can each become absurd in different hunts.

## Enemy and Hunt Contract

Every hunt publishes enemy traits, resistances, break conditions, materials, equipment families,
and exclusive jackpot items. Enemies must be powerful enough that delaying release creates risk.

Enemy structures intentionally favor different engines:

- a high-health boss rewards focused Overkill;
- a swarm rewards area damage and kill chaining;
- a boss with guards rewards spread and corpse explosions;
- segmented monsters reward penetration and ricochet;
- summoners reward reset-on-kill engines;
- reviving groups reward synchronized delayed detonation.

Players repeat a hunt to improve loot efficiency, not merely to prove they can win.

## Loot Resolution

Loot is resolved in this order:

1. No kill: award only recoverable materials from that enemy.
2. Kill: add rolls from that enemy's exclusive equipment table.
3. Individual Overkill: improve that enemy's item quality, rarity, affix tier, and jackpot chance.
4. Multi-kill in one command: increase quantity and material multiplication.
5. Kill at least three reward-bearing enemies in one command: award `CHAIN WIPE`.
6. End with no reward-bearing enemy alive after starting with at least two: award `ANNIHILATION`.
7. If every such enemy began at 90% HP or higher: award `PERFECT ANNIHILATION`.
8. Kill a boss and all guards together: add an exclusive annihilation chest.

One command may contain hundreds of cards and hits; it still counts as one shot until control returns
to the player. After the last enemy dies, remaining output enters a shared `Annihilation Overflow`
pool that improves all encounter drops.

## Feedback Sequence

The presentation follows a fixed escalation curve:

1. **Stack and Commit:** cards connect, the predicted trigger count grows, and Release names the command.
2. **Accelerate and Break:** later cards resolve faster until kills cascade and the battlefield clears.
3. **Overflow and Loot rain:** show reward multipliers, then scatter equipment, materials, and chests.

Mobile interaction remains inside the right-thumb zone: choose a card or branch, inspect the current
stack, undo the last choice, and press one dominant Release button. Detailed causality and equipment
inspection may use the passive upper area.

## Simulation and Performance

Combat remains deterministic and independent of React or rendering. The simulation owns a trigger
queue and emits compact events; the renderer batches repeated hits, numbers, particles, and drops.

An effect instance may react only once to the same causal event. The chain compiler detects a
positive closed loop. Instead of freezing or silently cutting it off, it emits an `Infinite Engine`
event, grants the hunt's top Overflow reward tier, and ends the repeating branch.

Simulation output is never discarded because the screen cannot draw every hit. Presentation may
aggregate thousands of identical events into waves while preserving exact damage and loot results.

## Architecture Boundaries

- `shared-types`: stable card, trigger, command, hunt, event, and reward contracts.
- `simulation-core`: command compilation, trigger resolution, Overkill, Annihilation, and loot math.
- `game-data`: adventurers, cards, supports, equipment rules, enemies, and exclusive drop tables.
- `web/guild-rpg`: right-thumb composition, playback, feedback, inspection, and persistence adapters.

The existing guild, profile, save, and responsive shell remain. The current gauge attack/heal/guard
battle is replaced rather than wrapped in another layer.

## First Playable Rework Boundary

The first rework proves one golden hunt with:

- three adventurers, at least twelve cards, and three distinct build engines;
- one boss plus guards, exclusive drops, and material-only failure recovery;
- kill-gated equipment plus Overkill, Chain Wipe, Annihilation, and Perfect Annihilation;
- uninterrupted release, loot rain, and equipment that changes the next command graph.

Acceptance requires that the same hunt supports at least three visibly different successful engines,
that a one-command full wipe is achievable, and that improving Overkill materially increases the
quantity or quality of the displayed loot.

## Verification

- Pure and property tests prove trigger order, causality, loop conversion, invariants, and loot gates.
- Contract tests prove simulation code does not import React, PixiJS, HTTP, or Workers.
- Reducer and browser tests prove the full hunt loop, save, right-thumb control, and responsive playback.
- Manual review verifies escalation, readable causality, one-shot annihilation, and loot rain.
