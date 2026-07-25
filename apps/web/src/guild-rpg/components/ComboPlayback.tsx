import type { GuildRpgState } from '../state/game-reducer';
import { COMBO_STAGE_LABEL, comboEscalationStage } from '../presenters';

interface ComboPlaybackProps {
  state: GuildRpgState;
}

export function ComboPlayback({ state }: ComboPlaybackProps) {
  const runtime = state.battle!.combo!;
  const stage = comboEscalationStage(runtime);
  return (
    <section
      className="gr-combo-playback"
      data-escalation-stage={stage}
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      <header>
        <div>
          <p>{COMBO_STAGE_LABEL[stage]}</p>
          <h2>軍令結算紀錄</h2>
        </div>
        <dl>
          <div>
            <dt>連擊</dt>
            <dd>{runtime.metrics.comboCount}</dd>
          </div>
          <div>
            <dt>傷害</dt>
            <dd>{runtime.metrics.totalDamage}</dd>
          </div>
          <div>
            <dt>OVERKILL</dt>
            <dd>{runtime.metrics.totalOverkill}</dd>
          </div>
          <div>
            <dt>共享溢傷</dt>
            <dd>{runtime.metrics.annihilationOverflow}</dd>
          </div>
        </dl>
      </header>
      <ol>
        {runtime.events
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
