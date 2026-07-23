import type { SystemBreakerRun } from '@expedition/shared-types';

export function ResourceStrip({ run }: { run: SystemBreakerRun }) {
  const threat = run.genome.threats[run.round - 1] ?? run.genome.threats.at(-1)!;
  const rows = [
    ['PROGRESS', run.resources.PROGRESS, threat.targetProgress, 'cyan'],
    ['INTEGRITY', run.resources.INTEGRITY, 100, 'green'],
    ['INSTABILITY', run.resources.INSTABILITY, 100, 'magenta'],
    ['CREDITS', run.resources.CREDITS, 40, 'amber'],
  ] as const;
  return (
    <section className="sb-resources" aria-label="系統資源">
      {rows.map(([id, value, maximum, color]) => (
        <div className={`sb-resource sb-resource--${color}`} key={id}>
          <span>{run.genome.aliases[id]}</span>
          <strong>
            {Math.round(value)}
            {id === 'PROGRESS' && <small> / {maximum}</small>}
          </strong>
          <progress value={Math.min(value, maximum)} max={maximum} aria-label={`${id} ${value}`} />
        </div>
      ))}
    </section>
  );
}
