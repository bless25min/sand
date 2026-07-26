import { GUILD_GAME_CONTENT } from '@expedition/game-data';
import type { GuildProfile, ZoneDefinition } from '@expedition/shared-types';

import type { CampaignZoneProgress } from '../presentation/campaign-progress-model';
import { createHuntSensationModel } from '../presentation/hunt-sensation-model';
import { formatTime } from '../presenters';
import type { GuildRpgAction } from '../state/game-reducer';

interface CampaignZonePanelProps {
  zone: ZoneDefinition;
  zoneIndex: number;
  progress: CampaignZoneProgress;
  campaignComplete: boolean;
  profile: GuildProfile;
  dispatch: React.Dispatch<GuildRpgAction>;
}

const STATUS_LABELS = {
  locked: '戰線鎖定',
  active: '目前戰線',
  cleared: '區域完破',
} as const;

export function CampaignZonePanel({
  zone,
  zoneIndex,
  progress,
  campaignComplete,
  profile,
  dispatch,
}: CampaignZonePanelProps) {
  return (
    <section
      className="gr-campaign-zone"
      data-campaign-zone={zone.id}
      data-zone-status={progress.status}
      data-zone-palette={zone.palette}
      aria-labelledby={`${zone.id}-title`}
    >
      <header className="gr-campaign-zone__header">
        <div>
          <p>{zone.subtitle}</p>
          <h3 id={`${zone.id}-title`}>
            <span>0{zoneIndex + 1}</span>
            {zone.name}
          </h3>
          <strong>{zone.description}</strong>
        </div>
        <aside>
          <b>{STATUS_LABELS[progress.status]}</b>
          <span>
            {progress.clearedQuestCount}/{progress.totalQuestCount} CLEARED
          </span>
          <i aria-hidden="true">
            <span
              style={{
                width: `${(progress.clearedQuestCount / progress.totalQuestCount) * 100}%`,
              }}
            />
          </i>
        </aside>
      </header>

      <div className="gr-quest-grid">
        {zone.questIds.map((questId) => {
          const quest = GUILD_GAME_CONTENT.quests.find((candidate) => candidate.id === questId)!;
          const questIndex = GUILD_GAME_CONTENT.quests.findIndex(
            (candidate) => candidate.id === questId,
          );
          const hunt = GUILD_GAME_CONTENT.hunts.find((candidate) => candidate.questId === questId)!;
          const unlocked = profile.unlockedQuestIds.includes(quest.id);
          const record = profile.questRecords[quest.id];
          const sensation = createHuntSensationModel(
            quest.id,
            profile.selectedBuildId,
            GUILD_GAME_CONTENT,
          );
          return (
            <article
              className={`gr-card gr-quest ${unlocked ? '' : 'is-locked'}`}
              data-current-quest={progress.currentQuestId === quest.id || undefined}
              key={quest.id}
            >
              <span className="gr-quest__index">{String(questIndex + 1).padStart(2, '0')}</span>
              <p>
                {unlocked
                  ? record
                    ? `已通關 ×${record.clears}`
                    : `建議 Lv.${quest.recommendedLevel}`
                  : '尚未解鎖'}
              </p>
              <h4>{quest.name}</h4>
              <p>{quest.description}</p>
              <div className="gr-quest__pressure">
                <b>壓力</b>
                <span>{hunt.pressureLabel}</span>
                <b>破局</b>
                <span>{hunt.counterBrief}</span>
              </div>
              <div className="gr-quest__intel">
                <strong>
                  {sensation.build.payoffLabel} · 可破{' '}
                  {sensation.counterTargets.join('、') || '等待切換 Build'}
                </strong>
                <span>處刑順序：{sensation.executionOrder.join(' → ')}</span>
                <span>專屬掉落：{sensation.exclusiveDropNames.join('、')}</span>
                {sensation.chestName && <b>殲滅寶箱：{sensation.chestName}</b>}
              </div>
              <dl>
                <div>
                  <dt>最佳</dt>
                  <dd>{formatTime(record?.bestClearMs)}</dd>
                </div>
                <div>
                  <dt>最高溢傷</dt>
                  <dd>{record?.bestOverkill ?? '—'}</dd>
                </div>
                <div>
                  <dt>掉落效率</dt>
                  <dd>
                    {record?.bestLootMultiplier ? `×${record.bestLootMultiplier.toFixed(2)}` : '—'}
                  </dd>
                </div>
                <div>
                  <dt>最高品質</dt>
                  <dd>{record?.bestItemQuality ?? '—'}</dd>
                </div>
              </dl>
              <button
                type="button"
                className="gr-button gr-button--primary"
                disabled={!unlocked}
                title={unlocked ? undefined : '先完成上一個遠征委託'}
                onClick={() => dispatch({ type: 'START_QUEST', questId: quest.id })}
              >
                {unlocked
                  ? record
                    ? campaignComplete
                      ? '完破重刷'
                      : '帶新引擎重刷'
                    : '開始遠征'
                  : '需要前置勝利'}
              </button>
            </article>
          );
        })}
      </div>

      {progress.status === 'cleared' && (
        <footer className="gr-zone-transition">
          <span>WARFRONT CLEARED</span>
          <strong>{zone.transitionLabel}</strong>
        </footer>
      )}
    </section>
  );
}
