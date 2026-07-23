import { BattlefieldDemo } from './battlefield/BattlefieldDemo';
import { createMvpLoopSnapshot } from './expedition/create-mvp-loop-snapshot';
import { ExpeditionLoopPanel } from './expedition/ExpeditionLoopPanel';

const MVP_LOOP = createMvpLoopSnapshot();

export function App() {
  return (
    <main className="app-shell">
      <header className="command-header">
        <div>
          <p className="eyebrow">AI 魔獸領域遠征軍團 RPG</p>
          <h1>Project Expedition</h1>
          <p className="subtitle">遠征軍戰術沙盤</p>
        </div>
        <div className="build-badge">
          <span>BUILD</span>
          <strong>0.4.0 · LOOT LOOP</strong>
        </div>
      </header>

      <BattlefieldDemo heavyAppearanceIds={MVP_LOOP.equippedUnit.appearanceIds} />

      <ExpeditionLoopPanel snapshot={MVP_LOOP} />

      <footer className="system-note">
        <span>VISUAL PROJECTION ONLY</span>
        PixiJS 只讀取快照；兵力、傷亡、士氣與戰鬥結果由 Simulation Core 決定。
      </footer>
    </main>
  );
}
