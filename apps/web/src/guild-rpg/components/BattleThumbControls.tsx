import { GUILD_GAME_CONTENT } from '@expedition/game-data';
import type { GuildSkillDefinition } from '@expedition/shared-types';
import { useEffect, useState } from 'react';

import type { GuildRpgAction, GuildRpgState } from '../state/game-reducer';
import { ThumbCommandDeck, type ThumbDeckAction } from './ThumbCommandDeck';

interface BattleThumbControlsProps {
  state: GuildRpgState;
  dispatch: React.Dispatch<GuildRpgAction>;
}

type BattleThumbPage = 'skill' | 'target' | 'tactics';

const ACTION_SLOTS = ['primary', 'secondary', 'choice-a'] as const;

export function BattleThumbControls({ state, dispatch }: BattleThumbControlsProps) {
  const battle = state.battle!;
  const leader = battle.units.find((unit) => unit.isLeader)!;
  const skills = leader.skillIds.map((id) => GUILD_GAME_CONTENT.skills[id]!);
  const [page, setPage] = useState<BattleThumbPage>('skill');
  const [allySkillId, setAllySkillId] = useState<string>();
  const ready = battle.pendingLeaderId === leader.id;
  const selectedTarget = battle.units.find((unit) => unit.id === battle.selectedTargetId);

  useEffect(() => {
    if (ready) setPage('skill');
  }, [ready]);

  function useSkill(skill: GuildSkillDefinition) {
    if (!ready) return;
    if (skill.target === 'ally') {
      setAllySkillId(skill.id);
      setPage('target');
      return;
    }
    const targetId = skill.target === 'self' ? leader.id : battle.selectedTargetId;
    if (targetId) dispatch({ type: 'USE_SKILL', skillId: skill.id, targetId });
  }

  let actions: readonly ThumbDeckAction[];
  let title: string;
  if (page === 'skill') {
    title = ready ? `${leader.name}可以下令` : `${leader.name}蓄力中`;
    actions = skills.map((skill, index) => ({
      id: skill.id,
      label: skill.name,
      detail: skill.description,
      slot: ACTION_SLOTS[index] ?? 'choice-b',
      tone: index === 0 ? 'primary' : 'default',
      disabled: !ready || battle.leaderAuto,
      onPress: () => useSkill(skill),
    }));
  } else if (page === 'target') {
    const targets = battle.units.filter((unit) =>
      allySkillId
        ? unit.side === 'heroes' && unit.currentHp > 0
        : unit.side === 'enemies' && unit.currentHp > 0,
    );
    title = allySkillId ? '選擇治療對象' : `目標：${selectedTarget?.name ?? '未選擇'}`;
    actions = targets.map((target, index) => ({
      id: target.id,
      label: target.name,
      detail: `${Math.ceil(target.currentHp)} / ${target.stats.hp} HP`,
      slot: ACTION_SLOTS[index] ?? 'choice-b',
      selected: !allySkillId && target.id === battle.selectedTargetId,
      tone: index === 0 ? 'primary' : 'default',
      onPress: () => {
        if (allySkillId && ready) {
          dispatch({ type: 'USE_SKILL', skillId: allySkillId, targetId: target.id });
          setAllySkillId(undefined);
        } else {
          dispatch({ type: 'SELECT_TARGET', targetId: target.id });
        }
        setPage('skill');
      },
    }));
  } else {
    title = battle.leaderAuto ? '隊長由 AI 自動下令' : '隊長由玩家手動下令';
    actions = [
      {
        id: 'auto',
        label: battle.leaderAuto ? '切回手動' : '開啟自動',
        detail: '隊長指揮',
        slot: 'primary',
        tone: 'primary',
        selected: battle.leaderAuto,
        onPress: () => dispatch({ type: 'TOGGLE_AUTO' }),
      },
      ...([1, 2] as const).map((speed) => ({
        id: `speed-${speed}`,
        label: `${speed}x`,
        detail: '戰鬥速度',
        slot: speed === 1 ? ('secondary' as const) : ('choice-a' as const),
        selected: state.speed === speed,
        onPress: () => dispatch({ type: 'SET_SPEED', speed }),
      })),
    ];
  }

  return (
    <ThumbCommandDeck
      ariaLabel="戰鬥操作"
      eyebrow={ready ? 'COMMAND READY' : 'ACTION GAUGE'}
      title={title}
      status={selectedTarget ? `鎖定 ${selectedTarget.name}` : undefined}
      feedback={state.message}
      tabs={[
        {
          id: 'skill',
          label: '技能',
          selected: page === 'skill',
          onSelect: () => setPage('skill'),
        },
        {
          id: 'target',
          label: '目標',
          selected: page === 'target',
          onSelect: () => {
            setAllySkillId(undefined);
            setPage('target');
          },
        },
        {
          id: 'tactics',
          label: '戰術',
          selected: page === 'tactics',
          onSelect: () => setPage('tactics'),
        },
      ]}
      actions={actions}
    />
  );
}
