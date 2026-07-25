import type { QuestRewards } from '@expedition/shared-types';

import { rewardSpectacleCues, SPECTACLE_CUE_REGISTRY } from '../presentation/spectacle-registry';

interface RewardSpectacleLayersProps {
  rewards: QuestRewards;
}

export function RewardSpectacleLayers({ rewards }: RewardSpectacleLayersProps) {
  const cues = rewardSpectacleCues(rewards);

  return (
    <div className="gr-reward-spectacle" data-reward-cues={cues.join(' ')} aria-hidden="true">
      <div className="gr-reward-spectacle__burst" />
      {cues.map((cueId, index) => {
        const cue = SPECTACLE_CUE_REGISTRY[cueId];
        return (
          <strong
            className="gr-reward-spectacle__cue"
            data-reward-cue={cueId}
            style={{ animationDelay: `${index * 180}ms` }}
            key={cueId}
          >
            {cue.label}
          </strong>
        );
      })}
    </div>
  );
}
