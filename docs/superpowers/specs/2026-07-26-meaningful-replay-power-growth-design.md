# Meaningful Replay & Power Growth — Design

## Outcome

After the twelve-hunt campaign, every return to the guild offers an immediate power
decision and a visible reason to replay. The loop is:

`choose 8-card loadout → forge a rule-bearing item → declare a challenge/Ascension → hunt → break a record → complete the archive`

The design deliberately maximises clarity, spectacle, causality, and forward motion.
It does not add scarcity, failure taxes, or balance gates.

## Player-visible systems

### Loadout arsenal

- The authored arsenal grows from 12 to 16 cards.
- Every Build owns a default legal eight-card loadout.
- A player swaps one active card for one reserve card; the loadout can never become
  incomplete or contain duplicates.
- Battle composition exposes only the selected eight cards.
- Build signatures remain legal in every default loadout.

### Forge

- Every owned item, including equipped items, can be forged.
- `upgrade` spends 30 gold and one matching enemy material, adds a fixed main-stat
  surge, and raises its forge rank.
- `infuse` spends 45 gold and one material, deterministically adds the next rule not
  already on the item.
- `reroll` spends 25 gold and one material, deterministically replaces its affix from
  the authored catalog.
- Each result is persisted and announced. An infused equipment rule enters the same
  simulation rule graph as Build rules, so it emits traceable `rule_triggered` events
  and spectacle cues.

### Hunt challenges

Every hunt owns four authored challenges:

1. Clear with one released command.
2. Reach the hunt's authored Overkill threshold.
3. Clear through an authored Build route.
4. Trigger the hunt's execution condition.

Completions are evaluated by `simulation-core` from causal battle events and are
permanent. Challenges award a celebratory completion state, not a progression gate.

### Archive and records

The archive has enemy, equipment, rule, Build, zone, and challenge collections.
Entries show discovered/completed state without hiding their identity or purpose.
Records include fastest clear, highest Overkill, best one-command chain, highest item
quality, challenge completion, and collection completion.

### Ascended hunts

Campaign completion unlocks three authored Ascensions that reuse every hunt:

- **Crimson Pressure**: higher enemy pressure and an ember spectacle motif.
- **Signature Route**: declares the selected Build signature as the route objective.
- **Annihilation Weather**: raises spectacle intensity and Overkill pressure.

Ascension is explicitly selected before launch. It changes runtime pressure, route
context, and presentation cues while preserving the authored hunt and reward loop.

## Ownership and contracts

- `game-data` owns cards, default loadouts, challenges, archive entries, and Ascensions.
- `simulation-core` owns loadout mutation, forge outcomes/costs, challenge evaluation,
  Ascension runtime effects, discovery, and records.
- `shared-types` contains only contracts crossing those packages and the web app.
- React only dispatches intents and renders returned state; it never decides battle,
  forge, challenge, or discovery outcomes.
- Random forge behavior uses the injected `RandomSource`; no `Math.random`.

## Save migration

The current profile becomes version 3 and moves to
`expedition:guild-rpg:v3`. The loader falls back through v2 and v1, normalising:

- all four default eight-card loadouts;
- empty completed-challenge and discovery sets;
- forge sequence zero;
- existing quest records with new record fields left optional.

Existing campaign unlock reconstruction remains unchanged.

## Interface

- Desktop: loadout editor under Build, forge under Inventory, archive/replay command
  centre after the campaign board.
- Mobile: retain the four fixed thumb tabs. Build utility opens loadout, the Inventory
  focus action opens forge, and Quest utility opens archive/Ascension.
- All modal actions remain thumb-reachable, have 56 px targets, name their cost and
  result before confirmation, and return to the same underlying page.

## Acceptance

- Exactly 16 cards; every Build has a unique, legal eight-card default.
- v1/v2 saves load as v3 without losing campaign or equipment.
- All forge actions are deterministic and can modify equipped items.
- Equipment infusion produces causal rule events and cues in an actual hunt.
- 48 challenges exist and can be evaluated from simulation evidence.
- Three Ascensions visibly alter pressure/route/spectacle context.
- Archive and record completion survive reload.
- Desktop and 375 px mobile complete the entire new loop without overflow or dead ends.
