# Stage-first RPG polish

## Player outcome

The fixed-screen client should read as a finished squad RPG before the player reads any copy.
Every screen gets one obvious focal object, and combat causality is shown as a short visual chain.

## Problems

- Guild pages cluster controls at the edges and leave the center visually empty.
- Battle units and effects sit on a near-black field without depth, lanes, or a clash line.
- Skill previews require reading small prose and mentally reconstructing trigger causality.
- Damage, hit count, and chase count compete in the same line.
- Existing playback effects lack one persistent, escalating headline that marks relay and finisher beats.

## Design

### Guild focus stages

- Quest: a compact expedition route connects departure, encounter, and reward nodes.
- Party: the selected hero owns the center, with role, skill sockets, equipment sockets, and relay position.
- Skills: the selected skill is decomposed into element, trigger, and result nodes.
- Equipment: the selected hero owns a three-slot paper doll with Chinese slot labels.
- Existing lists remain the interaction surface; the stage is presentation, not a new workflow.

### Battle stage

- Add a non-interactive procedural backdrop below units: horizon glow, mountain silhouettes,
  enemy/hero territories, ground rings, and a central clash line.
- Backdrop contrast stays below units, HP bars, and action VFX.
- Decorative motion is not required, so reduced-motion behavior remains unchanged.

### Command lens

- Use three visual cards: 起手 → 觸發 → 爆發.
- Each card has a short condition and one readiness word: 必定, 可觸發, 命中後, 未滿足.
- Show 總傷, 命中, 追擊 in separate badges. Never use multiplication notation.
- Keep skill name, actor attack, and target defense visible but secondary.

### Playback headline

- Show the compact skill name at action start.
- Escalate the headline by relay tier: STRIKE, CHAIN 2+, FINISHER.
- Use scale, opacity, color, and a short hold; no explanatory combat log is added.

## Boundaries

- No changes to simulation outcomes, damage, loot, progression, or build legality.
- Cocos owns presentation only.
- All pages remain usable at 414 × 698 without scrolling.

## Acceptance

- Quest, party, skills, and equipment each visibly fill the central stage.
- Battle has an environment behind units and effects.
- A selected skill exposes a three-part causal chain and separated outcome badges.
- Every executed action produces a readable escalating headline.
- Cocos typecheck, project tests, full check, web-mobile build, and Cocos E2E pass.
