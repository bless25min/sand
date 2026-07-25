# Guild RPG Completion Hardening

Date: 2026-07-25
Status: Approved by the user's instruction to complete the three previously proposed batches in order.

## Goal

Raise the shipped Guild RPG from a mechanically complete prototype to a readable, content-complete,
production-connected release without changing deterministic battle ownership.

## Batch 1: Observable Command Playback

The simulation still resolves one command synchronously and emits the complete event list. The Web
state adds a presentation-only `playback` screen with an event cursor:

`battle -> playback -> battle | rewards`

- Release computes the exact final battle once.
- Playback reveals only events emitted by that release.
- A presentation clock advances the cursor; 2x reveals larger batches.
- Reduced-motion reveals the batch together without motion.
- Skip completes playback without changing battle or rewards.
- An active battle returns to command composition; victory or defeat proceeds to rewards.
- React never recalculates damage, targets, triggers, Overkill, or loot.

## Batch 2: Three Complete Hunts

Greyfang remains the onboarding hunt. The mine and shrine receive the same content contract:

- every enemy publishes a readable trait and at least one favored Build;
- boss protection is explicit where guards are present;
- every hunt has enemy-exclusive material and equipment tables;
- every hunt has a boss-plus-guards Annihilation chest;
- the three Builds each have at least one favorable interaction per hunt.

This batch adds data and content tests only; it does not add new combo primitives.

## Batch 3: Production Hardening

The Pages deployment includes an advanced-mode `_worker.js`. It serves the SPA shell and proxies
`/api/*` to the existing `project-expedition-api` Worker through the existing hosting handler.
`API_BASE_URL` may override the upstream; otherwise the committed production Worker URL is used.

The default document title and description describe the Guild RPG. Vite creates explicit React,
Pixi, and preserved-prototype chunks so the default entry bundle remains below 500 kB without
removing the legacy query switches.

## Error and Accessibility Rules

- Missing or invalid API upstreams continue to return machine-readable 503/502 responses.
- Playback owns no durable state; refresh falls back to the last saved guild state.
- The playback screen exposes a polite status region, a visible skip action, and reduced-motion CSS.
- Hidden legacy prototypes remain functional; AI failure still uses their deterministic fallback.

## Verification

- Reducer tests prove release enters playback and only completion changes screens.
- Component tests prove staged causality, skip, 2x, and reduced-motion contracts.
- Content tests prove all three hunts satisfy trait, Build-counter, equipment, and chest requirements.
- Hosting tests prove `_worker.js`, default upstream selection, SPA fallback, and API proxy behavior.
- Production build proves no JavaScript chunk exceeds 500 kB.
- `pnpm check`, browser desktop/mobile smoke tests, API health, Pages deployment state, and live bundle
  hashes gate the final deployment.
