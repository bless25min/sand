# Combat Experience Recovery Design

**Approved:** 2026-07-27

## Outcome

Restore a readable, exciting six-hero RPG loop without changing deterministic
battle outcomes, loot rolls, skill composition, or progression rules.

The first session must teach by playing: enter the first hunt, select a target,
cast six consecutive hero skills, see each result, collect loot, then discover
equipment and skill configuration through a persistent training checklist.

## Battle Presentation

- `simulation-core` remains the only owner of battle outcomes.
- A web-only projection converts each returned `GuildBattleEvent` into a
  sequential `CombatBeat`.
- A tap resolves immediately but locks further battle input while its beats play.
- Cast, damage, status, reaction, bounce, echo, defeat, relay, and finisher beats
  are shown one by one; reduced motion keeps the same discrete states with no
  long animation.
- The acting hero remains visually identified throughout playback. The next hero
  is revealed only when playback finishes.
- Relay intensity is strictly tiered from 1 through 6. Each tier adds visible
  trails, scale, contrast, impact treatment, and stronger optional haptics/audio.
- The sixth relay owns a full battlefield finisher state and leaves the result
  visible until loot is collected.
- The battlefield contains six visible hero formations, all living enemies,
  a target route, hit/status overlays, and an event ribbon. It is never reduced
  to a text-only result card.
- Audio and vibration are optional progressive enhancement. Failure or browser
  denial never blocks play.

## First Session

- A new profile starts on a focused quest page with one dominant action:
  `開始第一場教學戰`.
- The former pre-battle party/skill/equipment tour is removed.
- Battle guidance progresses through `select_target`, `relay_1` … `relay_6`,
  then `collect_reward`. It cannot advance because the player merely changed
  order.
- Every relay coach names the current hero, the relay count, and the immediate
  action. Reorder remains available and is explained in context, not required.
- After victory, the coach moves to a persistent guild training checklist:
  inspect equipment, equip loot, forge once, inspect skills, fuse/equip, replay.
- Exactly one actionable target is emphasized per step. Auto-scroll runs only
  when the focused target is outside the viewport and never during combat
  playback.

## Guild Information Hierarchy

- Quest: first recommended hunt dominates; other hunts are compact until the
  player expands them.
- Party: six heroes and order are visible together; the selected hero is named.
- Skills: selected hero, six equipped slots, and recommended skill choices appear
  before filters and the full library.
- Equipment: the selected hero and three equipment slots appear before inventory
  and advanced forge controls.
- Navigation remains permanently available on guild screens with plain-language
  labels and a visible current-page state.

## Mobile Requirements

- At 375–390 px, the battlefield occupies a meaningful visible area and is not
  clipped by the command dock.
- Six battle skills are a scoped 2 × 3 grid with at least 56 px height and
  readable names.
- No critical label uses ellipsis as its only explanation.
- Target, current hero, relay count, next hero, and current impact remain visible.
- No horizontal scrolling; safe-area padding is preserved.

## Verification

- Pure projection tests prove event-to-beat mapping and increasing relay tiers.
- Reducer tests prove the tutorial persists through all six actors and that
  reordering cannot skip it.
- Component tests prove a real battlefield, visible formations, current actor,
  impact layers, and scoped 2 × 3 controls.
- Task-oriented mobile E2E completes the first hunt and post-battle configuration
  without depending on hidden guide IDs as its primary navigation.
- Run affected tests during TDD, then one consolidated `pnpm check` and one E2E
  run after all source work is complete.
