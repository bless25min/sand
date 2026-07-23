import type { SystemBreakerRun } from '@expedition/shared-types';

import type { PlaybackSpeed } from '../system-breaker-reducer';

const MODIFIER_TEXT: Record<string, string> = {
  NONE: '無額外干擾',
  BLOCK_EDGE: '封鎖最外側格位',
  OVERLOAD: '每次模組觸發都會增加失控值',
  COUNTER_ROLE: '壓制你目前最高輸出的模組角色',
  LOCK_TOP_OUTPUT: '鎖定盤面中最高輸出格',
};

export function RoundControls(props: {
  run: SystemBreakerRun;
  speed: PlaybackSpeed;
  disabled?: boolean;
  onSpeed: (speed: PlaybackSpeed) => void;
  onExecute: () => void;
}) {
  const threat = props.run.genome.threats[props.run.round - 1]!;
  return (
    <section className="sb-threat" aria-labelledby="threat-title">
      <div className="sb-threat__round">
        <span>ROUND</span>
        <strong>{String(props.run.round).padStart(2, '0')}</strong>
        <small>/ 07</small>
      </div>
      <div className="sb-threat__copy">
        <p className="sb-kicker">{threat.kind} · NEXT THREAT</p>
        <h2 id="threat-title">{threat.name}</h2>
        <p>{threat.telegraph}</p>
        <span>{MODIFIER_TEXT[threat.modifier] ?? threat.modifier}</span>
      </div>
      <div className="sb-threat__action">
        <label htmlFor="playback-speed">播放速度</label>
        <select
          id="playback-speed"
          disabled={props.disabled}
          value={props.speed}
          onChange={(event) => props.onSpeed(Number(event.target.value) as PlaybackSpeed)}
        >
          <option value={1}>1× 戰術觀察</option>
          <option value={2}>2× 快速重刷</option>
          <option value={0}>瞬間結算</option>
        </select>
        <button
          type="button"
          className="sb-primary"
          disabled={props.disabled}
          onClick={props.onExecute}
        >
          執行本回合 <span aria-hidden="true">▶</span>
        </button>
      </div>
    </section>
  );
}
