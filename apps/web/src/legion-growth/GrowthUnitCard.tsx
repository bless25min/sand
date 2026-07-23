import type { LegionGrowthUnitSnapshot } from './legion-growth-types';

const EXPERIENCE_REASON_LABELS = {
  BATTLE_PARTICIPATION: '參與戰鬥',
  COMMAND_COMPLETED: '完成軍令',
  FORMATION_HELD: '維持陣形',
  MONSTER_DEFEATED: '擊敗魔獸',
} as const;

interface GrowthMetric {
  readonly label: string;
  readonly before: number;
  readonly after: number;
}

interface GrowthUnitCardProps {
  readonly unit: LegionGrowthUnitSnapshot;
}

function formatMetric(value: number): string {
  return Number.isInteger(value) ? value.toLocaleString('zh-TW') : value.toFixed(2);
}

function experienceReasonLabel(reason: string): string {
  const labels: Readonly<Record<string, string>> = EXPERIENCE_REASON_LABELS;
  return labels[reason] ?? reason;
}

function metricOutcome(metric: GrowthMetric): string {
  if (metric.after > metric.before) return '收益';
  if (metric.after < metric.before) return '代價';
  return '持平';
}

function growthMetrics(unit: LegionGrowthUnitSnapshot): readonly GrowthMetric[] {
  return [
    { label: '攻擊', before: unit.before.attack, after: unit.after.attack },
    { label: '防禦', before: unit.before.defense, after: unit.after.defense },
    { label: '正面防禦', before: unit.before.frontalDefense, after: unit.after.frontalDefense },
    { label: '機動', before: unit.before.mobility, after: unit.after.mobility },
    {
      label: '移動距離',
      before: unit.beforeMetrics.distanceMoved,
      after: unit.afterMetrics.distanceMoved,
    },
    {
      label: '進攻壓力',
      before: unit.beforeMetrics.attackingPressure,
      after: unit.afterMetrics.attackingPressure,
    },
    {
      label: '防守壓力',
      before: unit.beforeMetrics.defendingPressure,
      after: unit.afterMetrics.defendingPressure,
    },
  ];
}

export function GrowthUnitCard({ unit }: GrowthUnitCardProps) {
  const titleId = `${unit.after.id}-growth-title`;

  return (
    <article className="growth-unit-card" aria-labelledby={titleId} data-testid="growth-unit-card">
      <header className="growth-card-heading">
        <div>
          <p>{unit.before.name}</p>
          <h3 id={titleId}>{unit.className}</h3>
        </div>
        <span>{unit.skillName}</span>
      </header>

      <ol className="growth-timeline" aria-label={`${unit.className}成長歷程`}>
        {unit.experienceDetails.map((detail) => (
          <li key={detail.reason}>
            <span>{experienceReasonLabel(detail.reason)}</span>
            <strong>
              {detail.quantity} 次 · +{detail.awardedExperience} EXP
            </strong>
          </li>
        ))}
      </ol>

      <dl className="growth-summary">
        <div>
          <dt>總獲得經驗</dt>
          <dd>+{unit.experienceGained} EXP</dd>
        </div>
        <div>
          <dt>等級與溢出</dt>
          <dd>
            LV {unit.before.level} → {unit.after.level} · {unit.after.experience} EXP
          </dd>
        </div>
        <div>
          <dt>傷兵治療</dt>
          <dd>{unit.treatedCount} 人</dd>
        </div>
        <div>
          <dt>補員</dt>
          <dd>{unit.reinforcementCount} 人</dd>
        </div>
      </dl>

      <section className="growth-next-battle" aria-label={`${unit.className}下一場戰鬥`}>
        <h4>下一場戰鬥</h4>
        <dl className="growth-metrics">
          {growthMetrics(unit).map((metric) => {
            const outcome = metricOutcome(metric);
            return (
              <div key={metric.label}>
                <dt>{metric.label}</dt>
                <dd>
                  <span>
                    {formatMetric(metric.before)} → {formatMetric(metric.after)}
                  </span>
                  <em className={outcome === '代價' ? 'negative' : undefined}>{outcome}</em>
                </dd>
              </div>
            );
          })}
        </dl>
      </section>
    </article>
  );
}
