# First Annihilation Release Quality Validation

## Scope

Batch 1 delivers one uninterrupted, mobile-first first-hunt loop:

1. select the recommended Build;
2. enter Border Pack;
3. break both guards with the three-card retaliation route;
4. enter the traceable wolf execution phase;
5. finish the alpha with the six-card execution route;
6. reach annihilation rewards and exclusive loot.

The batch also includes pause-safe settings, replayable guidance, procedural sensation output,
reduced-motion and haptic preferences, playback skip, safe hunt abandon, and boss-phase content
validation.

## Consolidated Review Fixes

- Sensation cues deduplicate by battle-event ID, so repeated command causal IDs no longer silence
  later impacts.
- Playback selects the latest milestone, so `boss_phase` remains the execution climax even when an
  earlier overkill event exists.
- The coach validates the exact route prefix, promotes the next required card into the visible
  thumb slots, offers one-tap recovery for a wrong card, and adds a preview confirmation gate.
- The first hunt is a two-wave route. The second wave targets the living alpha instead of the
  already-defeated scout.
- Tutorial replay completes only after a successful replay returns to the guild.
- Closing settings restores the exact pre-modal pause state.
- Pause, page visibility, and disposal stop active oscillators and cancel vibration.
- Boss phases are validated for duplicate IDs, dangling enemy references, and missing cue IDs.
- Mobile settings and abandon actions use a 56 px minimum touch height.

## Automated Verification

`pnpm check` completed with exit code `0`.

- TypeScript project and test type-checks passed.
- ESLint and Prettier checks passed.
- Dependency architecture check passed: 430 modules and 1,086 dependencies, zero violations.
- Knip dead-code check passed.
- Vitest passed: 111 files and 398 tests.
- Every workspace build passed.
- Wrangler emitted a sandbox-only warning while trying to write its debug log under AppData; Worker
  type generation and dry-run upload still completed successfully.

Focused regression coverage includes:

- repeated causal IDs with distinct event IDs;
- boss-phase precedence over overkill;
- wrong-route recovery and preview-to-release transition;
- two-wave guard-break-to-annihilation completion;
- tutorial replay lifecycle and cross-hunt isolation;
- exact pause restoration;
- active audio and haptic cancellation;
- boss-phase content diagnostics;
- visible mobile promotion of every execution-route card.

## Browser Verification

The fresh 375 px mobile flow was completed locally and on the immutable production deployment using
only visible controls.

- Fresh entry opened on Build and exposed the quest action without a dead end.
- `架盾 → 盾後反擊 → 破陣橫掃` opened `孤王處刑窗`.
- The coach automatically continued with
  `鷹眼標記 → 貫心箭 → 彈射箭雨 → 晨光祈禱 → 溢光裁決 → 輝光爆裂`.
- Both waves required preview confirmation before the primary release action.
- Final playback reached `ANNIHILATION`, `BOSS + GUARDS CHEST`, and reachable loot controls.
- Browser error log count was zero.

## Deployment Evidence

- Project: `ai-expedition-legion-rpg`
- Environment: Production
- Branch metadata: `main`
- Source: `ac4f2b1`
- Deployment ID: `1a31e7b3-d8b6-4716-8d6c-811e0e459744`
- Immutable URL: `https://1a31e7b3.ai-expedition-legion-rpg.pages.dev/`
- Canonical URL: `https://ai-expedition-legion-rpg.pages.dev/`
- Immutable and canonical HTML: `200`, byte-identical
- JavaScript: `/assets/index-C3M3CRe5.js`, `200`, `application/javascript`
- JavaScript SHA-256:
  `5A04E20A56ECFABDDDB9435204DBD383B742C54DD5AB936B0F0B703D89666BFE`, identical to local
- CSS: `/assets/index-BiTF5VPl.css`, `200`, `text/css; charset=utf-8`
- CSS SHA-256:
  `E9DFDC9708C24864A022A2096E16FD2E8678C53FF4BF6E65B848B528D9DB07BF`, identical to local
