import { useMemo } from 'react';

import { createMvpLoopSnapshot } from '../expedition/create-mvp-loop-snapshot';
import { ExpeditionLoopPanel } from '../expedition/ExpeditionLoopPanel';
import { PlayableExpedition } from '../game-session/PlayableExpedition';
import { createLegionGrowthSnapshot } from '../legion-growth/create-legion-growth-snapshot';
import { LegionGrowthPanel } from '../legion-growth/LegionGrowthPanel';

export function LegacyExpedition() {
  const mvpLoop = useMemo(createMvpLoopSnapshot, []);
  const legionGrowth = useMemo(createLegionGrowthSnapshot, []);

  return (
    <main className="app-shell">
      <header className="command-header">
        <div className="brand-lockup">
          <p className="eyebrow">AI 魔獸領域遠征軍團 RPG</p>
          <div>
            <h1>Project Expedition</h1>
            <p className="subtitle">遠征軍戰術沙盤</p>
          </div>
        </div>
        <div className="build-badge">
          <span>LEGACY</span>
          <strong>0.7.0 · COMBAT SLICE</strong>
        </div>
      </header>
      <PlayableExpedition />
      <details className="developer-evidence">
        <summary>
          <span>開發驗證資料</span>
          <small>規則閉環、裝備差異與轉職線</small>
        </summary>
        <div className="developer-evidence__content">
          <ExpeditionLoopPanel snapshot={mvpLoop} />
          <LegionGrowthPanel snapshot={legionGrowth} />
          <footer className="system-note">
            <span>RULE-DRIVEN PLAYABLE PROJECTION</span>
            PixiJS 只讀取即時狀態；固定軍令與戰鬥結果由 Simulation Core 決定。
          </footer>
        </div>
      </details>
    </main>
  );
}
