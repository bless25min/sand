import { GUILD_GAME_CONTENT } from '@expedition/game-data';
import { compileBuild } from '@expedition/simulation-core';

import type { GuildRpgAction, GuildRpgState } from '../state/game-reducer';

interface BuildWorkbenchProps {
  state: GuildRpgState;
  dispatch: React.Dispatch<GuildRpgAction>;
}

export function BuildWorkbench({ state, dispatch }: BuildWorkbenchProps) {
  const compiled = compileBuild(state.profile, GUILD_GAME_CONTENT);
  const selectedBuild = GUILD_GAME_CONTENT.builds.find((build) => build.id === compiled.buildId)!;
  const equipmentRuleIds = new Set(
    state.profile.party.flatMap((member) =>
      Object.values(member.equipment).flatMap((item) => item?.ruleIds ?? []),
    ),
  );

  return (
    <section className="gr-section gr-build-workbench" aria-labelledby="build-title">
      <div className="gr-section__heading">
        <div>
          <p>BUILD WORKBENCH</p>
          <h2 id="build-title">軍令引擎</h2>
        </div>
        <span>切換規則圖；裝備會直接加入新的觸發節點</span>
      </div>
      <div className="gr-build-grid">
        {GUILD_GAME_CONTENT.builds.map((build) => (
          <article
            className={`gr-card ${build.id === compiled.buildId ? 'is-selected' : ''}`}
            key={build.id}
          >
            <p>{build.id === compiled.buildId ? 'ACTIVE ENGINE' : 'ENGINE'}</p>
            <h3>{build.name}</h3>
            <span>{build.description}</span>
            <button
              type="button"
              className="gr-button gr-button--quiet"
              disabled={build.id === compiled.buildId}
              onClick={() => dispatch({ type: 'SET_BUILD', buildId: build.id })}
            >
              {build.id === compiled.buildId ? '目前 Build' : '切換 Build'}
            </button>
          </article>
        ))}
      </div>
      <div className="gr-build-graph">
        <div>
          <span>目前 Build</span>
          <strong>{selectedBuild.name}</strong>
        </div>
        <div>
          <span>可用卡牌</span>
          <strong>{compiled.cardIds.length}</strong>
        </div>
        <div>
          <span>目前規則</span>
          <strong>
            {compiled.ruleIds
              .map((ruleId) => GUILD_GAME_CONTENT.rules[ruleId]?.name ?? ruleId)
              .join(' → ')}
          </strong>
        </div>
        <div>
          <span>裝備節點</span>
          <strong>{equipmentRuleIds.size || '尚無'}</strong>
        </div>
      </div>
    </section>
  );
}
