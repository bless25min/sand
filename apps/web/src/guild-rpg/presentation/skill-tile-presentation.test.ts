import { previewSkillOutcome } from '@expedition/simulation-core';
import { describe, expect, it } from 'vitest';

import { createGuildRpgState } from '../state/create-game-state';
import { createSkillEngineContent } from '../state/create-skill-engine-content';
import { guildRpgReducer } from '../state/game-reducer';
import { createSkillTilePresentation, previewCause } from './skill-tile-presentation';

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

    expect(createSkillTilePresentation(skill, preview)).toEqual({
      intentName: '引火',
      primaryKind: 'damage',
      primaryValue: preview.totalDamage,
      hits: 2,
      statusDelta: { kind: 'burn', amount: 3 },
      readiness: 'ready',
    });
    expect(previewCause(preview)).toBe('因為這是戰鬥第一招，額外效果已發動');
  });
});
