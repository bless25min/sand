import type { BattlefieldHudModel } from '../game-session/create-battlefield-hud';
import { BattlefieldImpact } from './BattlefieldImpact';

interface MeterProps {
  readonly label: string;
  readonly value: number;
  readonly tone?: 'danger' | 'warning';
}

function Meter({ label, value, tone }: MeterProps) {
  return (
    <div className="hud-meter">
      <span>{label}</span>
      <progress
        className={tone === undefined ? undefined : `hud-meter--${tone}`}
        max="100"
        value={value}
        aria-label={`${label} ${value}%`}
      />
      <strong>{value}%</strong>
    </div>
  );
}

export function BattlefieldHud({ model }: { readonly model: BattlefieldHudModel }) {
  return (
    <div className="battlefield-hud">
      <div className="battle-objective">
        <span>作戰目標</span>
        <strong>{model.objective}</strong>
      </div>

      <section className="hud-card hud-card--unit" aria-label={`選中部隊：${model.selected.name}`}>
        <div className="hud-card__heading">
          <div>
            <span>已選軍團 · {model.selected.role}</span>
            <strong>{model.selected.name}</strong>
          </div>
          <b>{model.selected.formation}</b>
        </div>
        <p>
          <strong>{model.selected.troops.toLocaleString()}</strong>
          <span> / {model.selected.initialTroops.toLocaleString()} 人</span>
        </p>
        <Meter label="士氣" value={model.selected.moralePercent} />
        <Meter label="凝聚" value={model.selected.cohesionPercent} />
        <Meter label="疲勞" value={model.selected.fatiguePercent} tone="warning" />
      </section>

      <section
        className="hud-card hud-card--enemy"
        aria-label={`${model.enemy.name}，意圖：${model.enemy.intentLabel}`}
        data-enemy-intent={model.enemy.intent}
      >
        <div className="hud-card__heading">
          <div>
            <span>敵軍意圖</span>
            <strong>{model.enemy.name}</strong>
          </div>
          <b>{model.enemy.intentLabel}</b>
        </div>
        <p>
          <strong>{model.enemy.troops.toLocaleString()}</strong>
          <span> / {model.enemy.initialTroops.toLocaleString()} 隻</span>
        </p>
        <Meter label="敵軍士氣" value={model.enemy.moralePercent} tone="danger" />
      </section>

      <BattlefieldImpact impact={model.impact} />
    </div>
  );
}
