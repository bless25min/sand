import { previewSkillOutcome } from '@expedition/simulation-core';
import type { GuildSkillItem } from '@expedition/shared-types';
import { describe, expect, it } from 'vitest';

import { createGuildRpgState } from '../state/create-game-state';
import { createSkillEngineContent } from '../state/create-skill-engine-content';
import { guildRpgReducer } from '../state/game-reducer';
import { createSkillTilePresentation } from './skill-tile-presentation';

describe('skill tile presentation', () => {
  it('shows the current outcome instead of engine fields', () => {
    const state = guildRpgReducer(createGuildRpgState(), {
      type: 'START_QUEST',
      questId: 'border_pack',
    });
    const battle = state.battle!;
    const actorId = battle.roundOrder!.activeAdventurerId!;
    const targetId = battle.selectedTargetId!;
    const member = state.profile.party.find(({ definitionId }) => definitionId === actorId)!;
    const skill = state.profile.skillInventory.find(({ id }) => id === member.skillIds[0])!;
    const preview = previewSkillOutcome({
      battle,
      actorId,
      targetId,
      skillId: skill.id,
      content: createSkillEngineContent(state.profile),
    });

    expect(createSkillTilePresentation(skill, preview)).toMatchObject({
      intentName: '引火',
      primaryKind: 'damage',
      primaryValue: preview.totalDamage,
      segments: 2,
      chases: 1,
      statusDelta: { kind: 'burn', amount: 3 },
      readiness: 'ready',
      readyCount: 1,
      stepCount: 1,
      triggerSummary: '開戰✓ → 追傷6',
      comboSteps: [
        {
          conditionLabel: '開戰',
          readiness: 'ready',
          readinessLabel: '已成立',
          effectLabel: '追傷6',
        },
      ],
    });
  });

  it('summarizes fused skills by how many combo conditions are already lit', () => {
    const state = guildRpgReducer(createGuildRpgState(), {
      type: 'START_QUEST',
      questId: 'border_pack',
    });
    const battle = state.battle!;
    const actorId = battle.roundOrder!.activeAdventurerId!;
    const targetId = battle.selectedTargetId!;
    const member = state.profile.party.find(({ definitionId }) => definitionId === actorId)!;
    const skill = state.profile.skillInventory.find(({ id }) => id === member.skillIds[0])!;
    const preview = previewSkillOutcome({
      battle,
      actorId,
      targetId,
      skillId: skill.id,
      content: createSkillEngineContent(state.profile),
    });
    const first = skill.components[0]!;
    const fusedSkill = {
      ...skill,
      stars: 3,
      components: [
        first,
        { ...first, id: `${first.id}:2`, triggerId: 'previous_fire' },
        { ...first, id: `${first.id}:3`, triggerId: 'target_burning' },
      ],
    } as GuildSkillItem;
    const fusedPreview = {
      ...preview,
      comboSteps: [
        preview.comboSteps[0]!,
        {
          ...preview.comboSteps[0]!,
          componentId: `${first.id}:2`,
          triggerId: 'previous_fire' as const,
        },
        {
          ...preview.comboSteps[0]!,
          componentId: `${first.id}:3`,
          triggerId: 'target_burning' as const,
          readiness: 'not-ready' as const,
          chaseSegments: 0,
          chaseDamage: 0,
        },
      ],
    };

    expect(createSkillTilePresentation(fusedSkill, fusedPreview).triggerSummary).toBe(
      '連招 2/3 已亮',
    );
  });

  it('turns all sixth-relay choices into clear execution styles after an early clear', () => {
    const state = guildRpgReducer(createGuildRpgState(), {
      type: 'START_QUEST',
      questId: 'border_pack',
    });
    const battle = state.battle!;
    const actorId = battle.roundOrder!.activeAdventurerId!;
    const targetId = battle.selectedTargetId!;
    const member = state.profile.party.find(({ definitionId }) => definitionId === actorId)!;
    const skill = state.profile.skillInventory.find(({ id }) => id === member.skillIds[0])!;
    const base = previewSkillOutcome({
      battle,
      actorId,
      targetId,
      skillId: skill.id,
      content: createSkillEngineContent(state.profile),
    });
    const execution = {
      ...base,
      executionWindow: true,
      finisherPower: 40,
      relayEchoes: 5,
      totalDamage: 0,
      overkill: 40,
      damageSegments: 0,
      chaseSegments: 0,
    };

    expect(createSkillTilePresentation(skill, execution)).toMatchObject({
      execution: true,
      primaryKind: 'finisher',
      primaryValue: 40,
      segments: 5,
      triggerSummary: '第六棒✓ → 全軍終結',
    });
  });

  it('uses a rising overkill recovery before the sixth relay instead of showing execution zero', () => {
    const state = guildRpgReducer(createGuildRpgState(), {
      type: 'START_QUEST',
      questId: 'border_pack',
    });
    const battle = state.battle!;
    const actorId = battle.roundOrder!.activeAdventurerId!;
    const targetId = battle.selectedTargetId!;
    const member = state.profile.party.find(({ definitionId }) => definitionId === actorId)!;
    const skill = state.profile.skillInventory.find(({ id }) => id === member.skillIds[0])!;
    const base = previewSkillOutcome({
      battle,
      actorId,
      targetId,
      skillId: skill.id,
      content: createSkillEngineContent(state.profile),
    });

    expect(
      createSkillTilePresentation(skill, {
        ...base,
        executionWindow: true,
        finisherPower: 0,
        relayEchoes: 4,
        totalDamage: 0,
        overkill: 26,
        damageSegments: 0,
        chaseSegments: 0,
      }),
    ).toMatchObject({
      execution: true,
      primaryKind: 'effect',
      primaryValue: 26,
      segments: 4,
      triggerSummary: '第5棒✓ → 餘震回收',
    });
  });
});
