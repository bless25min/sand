import { GUILD_GAME_CONTENT } from '@expedition/game-data';

import { createCampaignProgressModel } from '../presentation/campaign-progress-model';
import type { GuildRpgAction, GuildRpgState } from '../state/game-reducer';
import { BuildWorkbench } from '../dev/BuildWorkbench';
import { AdventurerCard } from './AdventurerCard';
import { GuildMobileStage } from './GuildMobileStage';
import { Inventory } from './Inventory';
import { CampaignZonePanel } from './CampaignZonePanel';

interface GuildScreenProps {
  state: GuildRpgState;
  dispatch: React.Dispatch<GuildRpgAction>;
}

export function GuildScreen({ state, dispatch }: GuildScreenProps) {
  const materialCount = Object.values(state.profile.materials).reduce(
    (total, quantity) => total + quantity,
    0,
  );
  const campaign = createCampaignProgressModel({
    content: GUILD_GAME_CONTENT,
    unlockedQuestIds: state.profile.unlockedQuestIds,
    questRecords: state.profile.questRecords,
  });
  return (
    <main className="gr-shell">
      <header className="gr-topbar">
        <a className="gr-brand" href="/" aria-label="遠征者公會首頁">
          <span>EXPEDITION GUILD</span>
          <strong>遠征者公會</strong>
        </a>
        <div className="gr-resources">
          <span>金幣</span>
          <strong>{state.profile.gold}</strong>
          <span>背包</span>
          <strong>{state.profile.inventory.length}/20</strong>
          <span>材料</span>
          <strong>{materialCount}</strong>
        </div>
      </header>

      <section className="gr-hero" aria-labelledby="guild-title">
        <div>
          <p className="gr-eyebrow">PREPARE · QUEST · LOOT · REPEAT</p>
          <h1 id="guild-title">三人小隊，一次更好的遠征。</h1>
          <p>
            切換軍令引擎，讓三名冒險者的卡牌與裝備規則連成同一條因果鏈。
            反覆攻略、換裝重組，讓下一次釋放更快進入 Overkill。
          </p>
        </div>
        <aside>
          <span>公會戰報</span>
          <strong>{state.message}</strong>
        </aside>
      </section>

      <GuildMobileStage state={state} dispatch={dispatch} />

      <div className="gr-guild-desktop">
        <BuildWorkbench state={state} dispatch={dispatch} />
        <section className="gr-section" aria-labelledby="party-title">
          <div className="gr-section__heading">
            <div>
              <p>ACTIVE PARTY</p>
              <h2 id="party-title">遠征隊伍</h2>
            </div>
            <span>裝備可加入新的規則節點；隊長仍代表隊伍視角</span>
          </div>
          <div className="gr-party-grid">
            {state.profile.party.map((member) => {
              const definition = GUILD_GAME_CONTENT.adventurers.find(
                (candidate) => candidate.id === member.definitionId,
              )!;
              return (
                <AdventurerCard
                  key={member.definitionId}
                  adventurer={member}
                  definition={definition}
                  isLeader={state.profile.leaderId === member.definitionId}
                  onSetLeader={() =>
                    dispatch({ type: 'SET_LEADER', adventurerId: member.definitionId })
                  }
                />
              );
            })}
          </div>
        </section>

        <section className="gr-section" aria-labelledby="quest-title">
          <div className="gr-section__heading">
            <div>
              <p>QUEST BOARD</p>
              <h2 id="quest-title">遠征委託</h2>
            </div>
            <span>{campaign.headline}</span>
          </div>
          {campaign.transitionLabel && (
            <div className="gr-campaign-transition" role="status">
              <span>{campaign.complete ? 'CAMPAIGN CONQUERED' : 'NEW WARFRONT OPEN'}</span>
              <strong>{campaign.transitionLabel}</strong>
            </div>
          )}
          <div className="gr-campaign-map">
            {GUILD_GAME_CONTENT.zones.map((zone, zoneIndex) => (
              <CampaignZonePanel
                zone={zone}
                zoneIndex={zoneIndex}
                progress={campaign.zones[zoneIndex]!}
                campaignComplete={campaign.complete}
                profile={state.profile}
                dispatch={dispatch}
                key={zone.id}
              />
            ))}
          </div>
        </section>

        <Inventory state={state} dispatch={dispatch} />
      </div>
    </main>
  );
}
