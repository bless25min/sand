import type { BoardCommand, SystemBreakerRun } from '@expedition/shared-types';

import { ModuleRuleText } from './ModuleRuleText';

export function SystemBoard(props: {
  run: SystemBreakerRun;
  selectedInstanceId: string | null;
  activeInstanceId: string | null;
  disabled?: boolean;
  onSelect: (instanceId: string | null) => void;
  onCommand: (command: BoardCommand) => void;
}) {
  return (
    <section className="sb-board-panel" aria-labelledby="board-title">
      <header>
        <div>
          <p className="sb-kicker">
            EXECUTION GRID · {props.run.board.size}×{props.run.board.size}
          </p>
          <h2 id="board-title">系統盤面</h2>
        </div>
        <span>{props.selectedInstanceId ? '選擇目標格位' : '選擇模組後放置'}</span>
      </header>
      <div
        className="sb-board"
        style={{ '--board-size': props.run.board.size } as React.CSSProperties}
      >
        {props.run.board.cells.map((cell) => {
          const definition = props.run.genome.modules.find(
            (module) => module.id === cell.module?.definitionId,
          );
          const active = cell.module?.instanceId === props.activeInstanceId;
          return (
            <article
              className={[
                'sb-cell',
                cell.blocked || cell.locked ? 'sb-cell--blocked' : '',
                active ? 'sb-cell--active' : '',
                definition ? `sb-cell--${definition.role.toLowerCase()}` : '',
              ].join(' ')}
              key={cell.index}
            >
              <button
                type="button"
                className="sb-cell__target"
                aria-label={`格位 ${cell.index + 1}`}
                aria-current={active ? 'step' : undefined}
                disabled={props.disabled || cell.blocked || cell.locked}
                onClick={() => {
                  if (props.selectedInstanceId)
                    props.onCommand({
                      type: 'PLACE',
                      instanceId: props.selectedInstanceId,
                      cellIndex: cell.index,
                    });
                  else if (cell.module) props.onSelect(cell.module.instanceId);
                }}
              >
                <span className="sb-cell__index">0{cell.index + 1}</span>
                {definition && cell.module ? (
                  <>
                    {(cell.blocked || cell.locked) && (
                      <span className="sb-cell__blocked sb-cell__blocked--badge">LOCKED</span>
                    )}
                    <small>{definition.role}</small>
                    <strong>{definition.name}</strong>
                    <em>LV.{cell.module.level}</em>
                    <ModuleRuleText
                      definition={definition}
                      cooldownRemaining={cell.module.cooldownRemaining}
                    />
                    <b>+{definition.baseValue * cell.module.level}</b>
                  </>
                ) : cell.blocked || cell.locked ? (
                  <strong className="sb-cell__blocked">LOCKED</strong>
                ) : (
                  <span className="sb-cell__empty">＋ 放置</span>
                )}
                {active && <span className="sb-cell__active-label">目前執行中</span>}
              </button>
              {cell.module && (
                <button
                  type="button"
                  className="sb-cell__sell"
                  disabled={props.disabled}
                  onClick={() =>
                    props.onCommand({ type: 'SELL', instanceId: cell.module!.instanceId })
                  }
                >
                  出售
                </button>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}
