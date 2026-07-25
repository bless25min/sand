import type { HuntRewards, QuestRewards } from '@expedition/shared-types';

function isHuntRewards(rewards: QuestRewards): rewards is HuntRewards {
  return 'axes' in rewards && 'huntId' in rewards;
}

interface HuntResultSummaryProps {
  rewards: QuestRewards;
}

export function HuntResultSummary({ rewards }: HuntResultSummaryProps) {
  if (!isHuntRewards(rewards)) return null;
  const badges = [
    rewards.axes.multiKill >= 2 ? `MULTI KILL ×${rewards.axes.multiKill}` : undefined,
    rewards.axes.chainWipe ? 'CHAIN WIPE' : undefined,
    rewards.axes.annihilation ? 'ANNIHILATION' : undefined,
    rewards.axes.perfectAnnihilation ? 'PERFECT ANNIHILATION' : undefined,
    rewards.axes.bossChest ? 'BOSS + GUARDS CHEST' : undefined,
  ].filter((badge): badge is string => Boolean(badge));

  return (
    <section className="gr-hunt-summary" data-escalation-stage="overflow" aria-label="狩獵結算">
      <div className="gr-hunt-summary__badges">
        {badges.map((badge) => (
          <strong key={badge}>{badge}</strong>
        ))}
      </div>
      <div className="gr-hunt-summary__stats">
        <span>
          掉落倍率 <b>×{rewards.axes.quantityMultiplier.toFixed(2)}</b>
        </span>
        <span>
          共享溢傷 <b>{Math.round(rewards.axes.sharedOverflow)}</b>
        </span>
      </div>
      <div className="gr-hunt-summary__materials">
        <p>敵人材料</p>
        {rewards.materials.map((material) => (
          <span key={material.id}>
            {material.name} <b>×{material.quantity}</b>
          </span>
        ))}
      </div>
    </section>
  );
}
