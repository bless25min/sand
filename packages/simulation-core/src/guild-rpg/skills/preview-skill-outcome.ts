import type { BattleUnit, GuildBattleEvent, StatusLayers } from '@expedition/shared-types';

import { resolveSkill, type ResolveSkillInput } from './resolve-skill';

const emptyLayers = (): StatusLayers => ({ burn: 0, poison: 0, tide: 0 });

const eventTotal = (
  events: readonly GuildBattleEvent[],
  kinds: ReadonlySet<GuildBattleEvent['kind']>,
  targetId?: string,
) =>
  events
    .filter(
      (event) => kinds.has(event.kind) && (targetId === undefined || event.targetId === targetId),
    )
    .reduce((sum, event) => sum + (event.amount ?? 0), 0);

export interface SkillOutcomeUnitPreview {
  id: string;
  side: BattleUnit['side'];
  beforeHp: number;
  afterHp: number;
  maxHp: number;
  damage: number;
  healing: number;
  beforeStatus: StatusLayers;
  afterStatus: StatusLayers;
  beforeDefenseReduction: number;
  afterDefenseReduction: number;
  beforeStrengthened: number;
  afterStrengthened: number;
  defeated: boolean;
}

export interface SkillOutcomePreview {
  actorId: string;
  skillId: string;
  targetId: string;
  events: readonly GuildBattleEvent[];
  totalDamage: number;
  totalHealing: number;
  overkill: number;
  units: readonly SkillOutcomeUnitPreview[];
}

const unitPreview = (
  before: BattleUnit,
  after: BattleUnit,
  events: readonly GuildBattleEvent[],
): SkillOutcomeUnitPreview => ({
  id: before.id,
  side: before.side,
  beforeHp: before.currentHp,
  afterHp: after.currentHp,
  maxHp: before.stats.hp,
  damage: eventTotal(events, new Set(['damage', 'reaction']), before.id),
  healing: Math.max(0, after.currentHp - before.currentHp),
  beforeStatus: before.statusLayers ?? emptyLayers(),
  afterStatus: after.statusLayers ?? emptyLayers(),
  beforeDefenseReduction: before.defenseReduction ?? 0,
  afterDefenseReduction: after.defenseReduction ?? 0,
  beforeStrengthened: before.strengthened ?? 0,
  afterStrengthened: after.strengthened ?? 0,
  defeated: before.currentHp > 0 && after.currentHp <= 0,
});

export function previewSkillOutcome(input: ResolveSkillInput): SkillOutcomePreview {
  const resolved = resolveSkill(input);
  const units = input.battle.units.map((before) => {
    const after = resolved.battle.units.find(({ id }) => id === before.id) ?? before;
    return unitPreview(before, after, resolved.events);
  });
  return {
    actorId: input.actorId,
    skillId: input.skillId,
    targetId: input.targetId,
    events: resolved.events,
    totalDamage: eventTotal(resolved.events, new Set(['damage', 'reaction'])),
    totalHealing: units.reduce((sum, unit) => sum + unit.healing, 0),
    overkill: eventTotal(resolved.events, new Set(['overkill'])),
    units,
  };
}
