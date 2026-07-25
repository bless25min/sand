import type { HuntRewards, QuestRewards } from '@expedition/shared-types';
import type { CSSProperties } from 'react';

function isHuntRewards(rewards: QuestRewards): rewards is HuntRewards {
  return 'axes' in rewards && 'huntId' in rewards;
}

interface LootRainProps {
  rewards: QuestRewards;
}

export function LootRain({ rewards }: LootRainProps) {
  if (!isHuntRewards(rewards)) return null;
  const drops = [
    ...rewards.materials.flatMap((material) =>
      Array.from({ length: Math.min(material.quantity, 8) }, (_, index) => ({
        id: `${material.id}-${index}`,
        label: material.name,
        kind: 'material',
      })),
    ),
    ...rewards.items.map((item) => ({
      id: item.id,
      label: item.name,
      kind: item.jackpot ? 'jackpot' : 'equipment',
    })),
  ];
  const batches = Array.from({ length: Math.ceil(drops.length / 12) }, (_, index) =>
    drops.slice(index * 12, index * 12 + 12),
  );

  return (
    <div className="gr-loot-rain" data-loot-rain="true" aria-hidden="true">
      {batches.map((batch, batchIndex) => (
        <div className="gr-loot-rain__batch" key={batchIndex}>
          {batch.map((drop, index) => (
            <span
              className={`gr-loot-rain__drop gr-loot-rain__drop--${drop.kind}`}
              style={
                {
                  '--loot-delay': `${batchIndex * 0.45 + index * 0.055}s`,
                  '--loot-column': index % 12,
                } as CSSProperties
              }
              title={drop.label}
              key={drop.id}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
