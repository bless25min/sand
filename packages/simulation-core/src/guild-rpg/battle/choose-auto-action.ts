import type {
  BattleAction,
  GuildBattleState,
  GuildSkillDefinition,
} from '@expedition/shared-types';

function firstLivingEnemy(battle: GuildBattleState) {
  const selected = battle.units.find(
    (unit) => unit.id === battle.selectedTargetId && unit.side === 'enemies' && unit.currentHp > 0,
  );
  return selected ?? battle.units.find((unit) => unit.side === 'enemies' && unit.currentHp > 0);
}

function highestThreatHero(battle: GuildBattleState) {
  let target = battle.units.find((unit) => unit.side === 'heroes' && unit.currentHp > 0);
  for (const unit of battle.units) {
    if (unit.side !== 'heroes' || unit.currentHp <= 0) continue;
    if (!target || unit.threat > target.threat) target = unit;
  }
  return target;
}

export function chooseAutoAction(
  battle: GuildBattleState,
  actorId: string,
  skills: Readonly<Record<string, GuildSkillDefinition>>,
): BattleAction {
  const actor = battle.units.find((unit) => unit.id === actorId && unit.currentHp > 0);
  if (!actor) throw new Error(`Living actor not found: ${actorId}`);

  if (actor.side === 'enemies') {
    const target = highestThreatHero(battle);
    if (!target) throw new Error('No living hero target');
    return { actorId, skillId: 'basic_attack', targetId: target.id };
  }

  if (actor.role === 'cleric' && actor.skillIds.includes('healing_prayer')) {
    const wounded = battle.units
      .filter((unit) => unit.side === 'heroes' && unit.currentHp > 0)
      .sort((left, right) => left.currentHp / left.stats.hp - right.currentHp / right.stats.hp)[0];
    if (wounded && wounded.currentHp / wounded.stats.hp < 0.72) {
      return { actorId, skillId: 'healing_prayer', targetId: wounded.id };
    }
  }

  if (actor.role === 'vanguard' && !actor.guarding && actor.skillIds.includes('shield_wall')) {
    return { actorId, skillId: 'shield_wall', targetId: actor.id };
  }

  const target = firstLivingEnemy(battle);
  if (!target) throw new Error('No living enemy target');
  const preferredSkill = actor.role === 'ranger' ? 'focused_shot' : 'basic_attack';
  const skillId = actor.skillIds.includes(preferredSkill) ? preferredSkill : 'basic_attack';
  if (!skills[skillId]) throw new Error(`Unknown skill: ${skillId}`);
  return { actorId, skillId, targetId: target.id };
}
