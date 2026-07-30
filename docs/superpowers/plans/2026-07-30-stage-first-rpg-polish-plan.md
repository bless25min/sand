# Stage-first RPG polish implementation

1. Add failing project assertions for focus stages, battle backdrop, three-part command lens,
   separated outcome badges, and action headlines.
2. Implement feature-local procedural guild focus artwork and integrate it into all four pages.
3. Add a presentation-only battle backdrop below units.
4. Recompose the command lens into 起手 → 觸發 → 爆發 with explicit readiness.
5. Add an escalating action headline driven by the existing relay tier and presentation playback.
6. Run focused tests and Cocos typecheck, then `pnpm check`.
7. Build web-mobile, run the complete Cocos browser E2E, and inspect live mobile screenshots.
8. Commit, push, deploy the exact commit to Cloudflare Pages and the configured Sites project,
   then verify the canonical production URL.
