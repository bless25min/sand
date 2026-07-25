import { GUILD_GAME_CONTENT } from '@expedition/game-data';
import type { GuildSkillDefinition } from '@expedition/shared-types';

import type { GuildRpgAction, GuildRpgState } from '../state/game-reducer';

interface BattleCommandProps {
  state: GuildRpgState;
  dispatch: React.Dispatch<GuildRpgAction>;
}

function actionTargets(state: GuildRpgState, skill: GuildSkillDefinition) {
  const battle = state.battle!;
  if (skill.target === 'enemy') {
    return battle.units.filter((unit) => unit.id === battle.selectedTargetId && unit.currentHp > 0);
  }
  if (skill.target === 'self') {
    return battle.units.filter((unit) => unit.id === battle.pendingLeaderId);
  }
  return battle.units.filter((unit) => unit.side === 'heroes' && unit.currentHp > 0);
}

export function BattleCommand({ state, dispatch }: BattleCommandProps) {
  const battle = state.battle!;
  const leader = battle.units.find((unit) => unit.isLeader)!;
  const leaderSkills = leader.skillIds.map((id) => GUILD_GAME_CONTENT.skills[id]!);

  return (
    <section className={`gr-command ${battle.pendingLeaderId ? 'is-ready' : ''}`}>
      <div>
        <p>{battle.pendingLeaderId ? 'COMMAND READY' : 'WAITING FOR GAUGE'}</p>
        <h2>
          {battle.pendingLeaderId
            ? `${leader.name}等待你的命令`
            : battle.leaderAuto
              ? '隊長正依職責自動行動'
              : '行動量表蓄力中'}
        </h2>
      </div>
      <div className="gr-command__actions">
        {battle.pendingLeaderId &&
          leaderSkills.flatMap((skill) =>
            actionTargets(state, skill).map((target) => (
              <button
                type="button"
                key={`${skill.id}-${target.id}`}
                onClick={() =>
                  dispatch({ type: 'USE_SKILL', skillId: skill.id, targetId: target.id })
                }
              >
                <strong>{skill.name}</strong>
                <span>{skill.target === 'ally' ? `→ ${target.name}` : skill.description}</span>
              </button>
            )),
          )}
      </div>
    </section>
  );
}
