import { createMvpLoopSnapshot } from './expedition/create-mvp-loop-snapshot';
import { ExpeditionLoopPanel } from './expedition/ExpeditionLoopPanel';
import { PlayableExpedition } from './game-session/PlayableExpedition';
import { createLegionGrowthSnapshot } from './legion-growth/create-legion-growth-snapshot';
import { LegionGrowthPanel } from './legion-growth/LegionGrowthPanel';

const MVP_LOOP = createMvpLoopSnapshot();
const LEGION_GROWTH = createLegionGrowthSnapshot();

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
          <strong>0.6.0 · PLAYABLE LOOP</strong>
        </div>
      </header>

      <PlayableExpedition />

      <ExpeditionLoopPanel snapshot={MVP_LOOP} />

      <LegionGrowthPanel snapshot={LEGION_GROWTH} />

      <footer className="system-note">
        <span>RULE-DRIVEN PLAYABLE PROJECTION</span>
        PixiJS 只讀取即時狀態；固定軍令與戰鬥結果由 Simulation Core 決定。
      </footer>
    </main>
  );
}
