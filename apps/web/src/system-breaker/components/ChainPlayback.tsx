import type { ChainEvent } from '@expedition/shared-types';

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
            <b>{event.type.replaceAll('_', ' ')}</b>
            <p>{event.message}</p>
            {event.value !== undefined && <strong>+{event.value}</strong>}
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
