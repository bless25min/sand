# Mobile Climax Reclamation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reclaim the complete mobile battlefield and make the first reward visible immediately.

**Architecture:** Keep the coach contract as the single guide source, let `ThumbCommandDeck` progressively reveal only the focused command, and scope layout overrides to playback and reward presentation.

**Tech Stack:** React 19, TypeScript 6, CSS, Vitest, Vite.

## Global Constraints

- Presentation only; do not change simulation or balance.
- Preserve desktop and unguided command access.
- Preserve unstaged user changes in `AGENTS.md` and `docs/AI_DEVELOPMENT_SPEC.md`.
- Run affected tests during TDD and `pnpm check` once at completion.

---

### Task 1: Complete mobile climax flow

**Files:**

- Modify: `apps/web/src/guild-rpg/components/ThumbCommandDeck.tsx`
- Modify: `apps/web/src/guild-rpg/components/ComboPlaybackScreen.tsx`
- Modify: `apps/web/src/guild-rpg/components/RewardScreen.tsx`
- Modify: `apps/web/src/guild-rpg/components/RewardThumbControls.tsx`
- Modify: `apps/web/src/guild-rpg/thumb-command-deck.css`
- Modify: `apps/web/src/guild-rpg/mobile-battle.css`
- Modify: `apps/web/src/guild-rpg/mobile-rewards.css`
- Test: `apps/web/src/guild-rpg/components/mobile-climax-contract.test.tsx`

- [ ] Write failing tests for focused command filtering, inline feedback, playback ownership, compact reward ordering, and zero-time wording.
- [ ] Run the focused test and confirm RED.
- [ ] Filter guided actions/tabs and render feedback in the deck header.
- [ ] Add playback-specific height and horizontal-control CSS.
- [ ] Compact the mobile reward surface while retaining decision-critical item information.
- [ ] Replace tutorial zero-time copy with an annihilation result label.
- [ ] Run the focused and adjacent mobile-flow tests and confirm GREEN.
- [ ] Verify 375×667 and 390×844 selection, playback, and rewards in a real browser.
- [ ] Review the batch once, fix findings, run `pnpm check`, and commit.
