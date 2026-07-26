# Tactical Sand Table Spectacle Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add deterministic formations, target routes, and impact collapse behind the existing battle HUD.

**Architecture:** A presentation-only tactical layer receives visible units, selected target, motif, and the existing impact projection. Fixed formation indices create scale without randomness or simulation ownership.

**Tech Stack:** React 19, TypeScript 6, CSS, SVG, Vitest, Vite.

## Global Constraints

- Never derive or alter battle outcomes in React.
- Never use `Math.random`; formation output must be deterministic.
- Keep the layer non-interactive and behind all readable HUD content.
- Run affected tests during TDD and `pnpm check` once at completion.

---

### Task 1: Add deterministic tactical spectacle

**Files:**

- Create: `apps/web/src/guild-rpg/components/BattlefieldTacticalLayer.tsx`
- Create: `apps/web/src/guild-rpg/components/BattlefieldTacticalLayer.test.tsx`
- Modify: `apps/web/src/guild-rpg/components/BattleScreen.tsx`
- Modify: `apps/web/src/guild-rpg/components/ComboPlaybackScreen.tsx`
- Create: `apps/web/src/guild-rpg/tactical-battlefield.css`
- Modify: guild RPG CSS entrypoint

- [ ] Write a failing component test for six deterministic formations and selected/impact state.
- [ ] Run the focused test and confirm RED.
- [ ] Render fixed hero and enemy formations, target reticle, and motif route.
- [ ] Map only existing selected, impacted, and defeated facts into data attributes.
- [ ] Mount the layer in command and playback battlefields.
- [ ] Add responsive CSS with HUD-safe stacking and reduced mobile density.
- [ ] Run focused and battle-flow tests and confirm GREEN.
- [ ] Verify mobile and desktop battle interaction, crop bounds, and console output.
- [ ] Review the batch once, fix findings, run `pnpm check`, and commit.
