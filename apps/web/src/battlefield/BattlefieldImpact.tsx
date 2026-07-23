import type { BattlefieldImpactHud } from '../game-session/create-battlefield-hud';

export function BattlefieldImpact({ impact }: { readonly impact: BattlefieldImpactHud | null }) {
  if (impact === null) return null;

  return (
    <div
      className={`battlefield-impact battlefield-impact--${impact.kind}`}
      role="status"
      aria-live="polite"
    >
      <strong>{impact.label}</strong>
      <span>
        {impact.playerLoss > 0 ? `我軍 −${impact.playerLoss}` : '我軍無損'}
        {' · '}
        灰牙 −{impact.enemyLoss}
      </span>
    </div>
  );
}
