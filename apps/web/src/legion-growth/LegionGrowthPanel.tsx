import type { LegionGrowthSnapshot } from './legion-growth-types';
import { GrowthUnitCard } from './GrowthUnitCard';
import './legion-growth.css';

interface LegionGrowthPanelProps {
  readonly snapshot: LegionGrowthSnapshot;
}

export function LegionGrowthPanel({ snapshot }: LegionGrowthPanelProps) {
  return (
    <section
      className="legion-growth-panel"
      aria-labelledby="legion-growth-title"
      data-testid="legion-growth"
    >
      <header className="growth-heading">
        <div>
          <p className="section-kicker">PHASE 5 · LEGION GROWTH</p>
          <h2 id="legion-growth-title">軍團成長與雙線轉職</h2>
        </div>
        <span className="growth-status">戰後整備完成</span>
      </header>

      <div className="growth-card-grid">
        {snapshot.units.map((unit) => (
          <GrowthUnitCard key={unit.after.id} unit={unit} />
        ))}
      </div>
    </section>
  );
}
