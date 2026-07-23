import { BattlefieldDemo } from './battlefield/BattlefieldDemo';

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
          <strong>0.3.0 · GREYFANG</strong>
        </div>
      </header>

      <BattlefieldDemo />

      <footer className="system-note">
        <span>VISUAL PROJECTION ONLY</span>
        PixiJS 只讀取快照；兵力、傷亡、士氣與戰鬥結果由 Simulation Core 決定。
      </footer>
    </main>
  );
}
