import { GUILD_GAME_CONTENT } from '@expedition/game-data';
import type { EquipmentItem, GuildProfile } from '@expedition/shared-types';
import { describe, expect, it } from 'vitest';

import { createSeededRandom } from '../../rng/seeded-random';
import { compileBuild } from '../combo/compile-build';
import { compileCommand } from '../combo/compile-command';
import { resolveCommand } from '../combo/resolve-command';
import { resolveTriggerQueue } from '../combo/resolve-trigger-queue';
import { createGuildProfile } from '../profile/create-profile';
import { startGuildQuest } from '../profile/start-quest';
import { forgeEquipmentItem, previewForgeEquipmentItem } from './forge-equipment';

const item: EquipmentItem = {
  id: 'forge-scout-charm',
  baseId: 'scout_charm',
  name: '斥候追風符',
  slot: 'accessory',
  rarity: 'rare',
  mainStat: { stat: 'speed', value: 5, sourceId: 'scout_charm', label: '斥候追風符' },
  affixes: [{ stat: 'attack', value: 4, sourceId: 'savage', label: '兇猛' }],
  sellValue: 40,
  sourceEnemyId: 'wolf_scout',
};

function equippedProfile() {
  const base = createGuildProfile(GUILD_GAME_CONTENT);
  return {
    ...base,
    gold: 200,
    materials: { scout_fang: 3 },
    party: base.party.map((member, index) =>
      index === 0 ? { ...member, equipment: { accessory: item } } : member,
    ),
  };
}

function equippedItem(profile: GuildProfile) {
  return profile.party[0]!.equipment.accessory!;
}

describe('equipment forge', () => {
  it('upgrades, infuses, and rerolls an equipped item through deterministic costs', () => {
    const upgraded = forgeEquipmentItem(
      equippedProfile(),
      item.id,
      'upgrade',
      GUILD_GAME_CONTENT,
      createSeededRandom('forge-upgrade'),
    );
    expect(upgraded.profile.gold).toBe(170);
    expect(upgraded.profile.materials.scout_fang).toBe(2);
    expect(equippedItem(upgraded.profile).forgeRank).toBe(1);
    expect(equippedItem(upgraded.profile).mainStat.value).toBeGreaterThan(5);

    const infused = forgeEquipmentItem(
      upgraded.profile,
      item.id,
      'infuse',
      GUILD_GAME_CONTENT,
      createSeededRandom('forge-infuse'),
    );
    expect(infused.profile.gold).toBe(125);
    expect(infused.profile.materials.scout_fang).toBe(1);
    expect(equippedItem(infused.profile).ruleIds).toContain('retaliation_bash');
    expect(infused.profile.discoveredRuleIds).toContain('retaliation_bash');

    const rerolled = forgeEquipmentItem(
      infused.profile,
      item.id,
      'reroll',
      GUILD_GAME_CONTENT,
      createSeededRandom('forge-reroll'),
    );
    expect(rerolled.profile.gold).toBe(100);
    expect(rerolled.profile.materials.scout_fang).toBe(0);
    expect(equippedItem(rerolled.profile).affixes[0]?.sourceId).not.toBe('savage');
    expect(rerolled.profile.forgeSequence).toBe(3);
    expect(rerolled.profile.progressionEvents).toHaveLength(3);
  });

  it('routes an infused equipment rule into causal battle events and spectacle cues', () => {
    const infused = forgeEquipmentItem(
      equippedProfile(),
      item.id,
      'infuse',
      GUILD_GAME_CONTENT,
      createSeededRandom('causal-infusion'),
    ).profile;
    const compiled = compileBuild(infused, GUILD_GAME_CONTENT);
    const battle = startGuildQuest(infused, 'border_pack', GUILD_GAME_CONTENT);
    const command = compileCommand({ cardIds: ['brann_brace'] }, GUILD_GAME_CONTENT.cards);
    const resolved = resolveCommand(battle, command, GUILD_GAME_CONTENT.cards);
    const rules = Object.fromEntries(
      compiled.ruleIds.map((ruleId) => [ruleId, GUILD_GAME_CONTENT.rules[ruleId]!]),
    );
    const result = resolveTriggerQueue({ battle: resolved, command, rules });
    const infusedEvent = result.events.find(
      (event) =>
        event.kind === 'rule_triggered' &&
        event.message.includes(GUILD_GAME_CONTENT.rules.retaliation_bash!.name),
    );

    expect(infusedEvent).toMatchObject({ cueId: 'block' });
  });

  it('previews the exact material and rejects equipment without an authored forge binding', () => {
    const profile = equippedProfile();
    const preview = previewForgeEquipmentItem(profile, item.id, 'infuse', GUILD_GAME_CONTENT);
    expect(preview).toMatchObject({
      materialId: 'scout_fang',
      materialName: '斥候狼牙',
      resultLabel: expect.stringContaining('格擋反震'),
    });

    const unbound: EquipmentItem = {
      id: 'unbound',
      baseId: 'unknown',
      name: item.name,
      slot: item.slot,
      rarity: item.rarity,
      mainStat: item.mainStat,
      affixes: item.affixes,
      sellValue: item.sellValue,
    };
    const unboundProfile = {
      ...profile,
      inventory: [unbound],
      materials: { scout_fang: 99 },
      party: profile.party.map((member) => ({ ...member, equipment: {} })),
    };
    const result = forgeEquipmentItem(
      unboundProfile,
      unbound.id,
      'upgrade',
      GUILD_GAME_CONTENT,
      createSeededRandom('unbound'),
    );

    expect(result.profile).toBe(unboundProfile);
    expect(result.message).toContain('沒有對應素材');
  });
});
