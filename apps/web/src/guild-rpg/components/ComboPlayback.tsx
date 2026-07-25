import type { GuildRpgState } from '../state/game-reducer';
import { createPlaybackProjection } from '../playback/playback-model';
import { COMBO_STAGE_LABEL } from '../presenters';

interface ComboPlaybackProps {
  state: GuildRpgState;
  eventStartIndex?: number;
  visibleEventCount?: number;
}

export function ComboPlayback({
  state,
  eventStartIndex = 0,
  visibleEventCount,
}: ComboPlaybackProps) {
  const runtime = state.battle!.combo!;
  const projection = createPlaybackProjection(
    runtime,
    eventStartIndex,
    visibleEventCount ?? runtime.events.length - eventStartIndex,
  );
  return (
    <section
      className="gr-combo-playback"
      data-escalation-stage={projection.stage}
      data-impact-kind={projection.currentImpact.kind}
      data-playback-progress={`${projection.progress.visible}/${projection.progress.total}`}
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      <div className="gr-playback-impact" aria-hidden="true">
        {projection.currentImpact.label}
      </div>
      <header>
        <div>
          <p>{COMBO_STAGE_LABEL[projection.stage]}</p>
          <h2>軍令結算紀錄</h2>
        </div>
        <dl>
          <div>
            <dt>連擊</dt>
            <dd>{projection.metrics.comboCount}</dd>
          </div>
          <div>
            <dt>傷害</dt>
            <dd>{projection.metrics.totalDamage}</dd>
          </div>
          <div>
            <dt>OVERKILL</dt>
            <dd>{projection.metrics.totalOverkill}</dd>
          </div>
          <div>
            <dt>共享溢傷</dt>
            <dd>{projection.metrics.annihilationOverflow}</dd>
          </div>
        </dl>
      </header>
      <ol>
        {projection.events
          .slice(-10)
          .reverse()
          .map((event) => (
            <li key={event.id} data-kind={event.kind}>
              <span>{event.kind.replaceAll('_', ' ')}</span>
              {event.message}
            </li>
          ))}
      </ol>
    </section>
  );
}
