import type { ChainEvent } from '@expedition/shared-types';

const eventText: Record<ChainEvent['type'], string> = {
  MODULE_TRIGGERED: '模組啟動',
  RESOURCE_CHANGED: '資源變化',
  MODULE_LOCKED: '模組鎖定',
  THREAT_DEFEATED: '威脅擊破',
  THREAT_HIT: '威脅命中',
  BOSS_PHASE_TWO: '頭目第二階段',
  MODULE_REVIVED: '模組復原',
  CHAIN_LIMIT_REACHED: '連鎖上限',
};

const resourceText = {
  PROGRESS: '進度',
  INTEGRITY: '完整度',
  INSTABILITY: '不穩定度',
  CREDITS: '點數',
} as const;

function signedDelta(delta: number): string {
  return delta.toLocaleString('zh-TW', { signDisplay: 'always' });
}

export function ChainPlayback(props: {
  events: ChainEvent[];
  visibleCount: number;
  playing: boolean;
  onSkip: () => void;
}) {
  const visible = props.events.slice(0, props.visibleCount);
  return (
    <section
      className={`sb-chain ${props.playing ? 'is-playing' : ''}`}
      aria-labelledby="chain-title"
    >
      <header>
        <div>
          <p className="sb-kicker">DETERMINISTIC EVENT STREAM</p>
          <h2 id="chain-title">連鎖紀錄</h2>
        </div>
        <span aria-live="polite">
          {props.playing ? `執行中 ${props.visibleCount}/${props.events.length}` : '等待執行'}
        </span>
      </header>
      <ol aria-live="polite">
        {visible.length === 0 && <li className="sb-chain__empty">放置模組後執行回合。</li>}
        {visible.map((event) => (
          <li className={`sb-event sb-event--${event.type.toLowerCase()}`} key={event.sequence}>
            <span>{String(event.sequence).padStart(2, '0')}</span>
            <b>{eventText[event.type]}</b>
            <p>{event.message}</p>
            {event.type === 'RESOURCE_CHANGED' && (
              <strong>
                {event.resourceChanges
                  .map((change) => `${resourceText[change.resource]} ${signedDelta(change.delta)}`)
                  .join('、')}
              </strong>
            )}
            {event.value !== undefined && <strong>{signedDelta(event.value)}</strong>}
            {event.moduleInstanceId && <small>模組 ID：{event.moduleInstanceId}</small>}
          </li>
        ))}
      </ol>
      {props.playing && (
        <button type="button" className="sb-ghost" onClick={props.onSkip}>
          跳過播放，立即套用
        </button>
      )}
    </section>
  );
}
