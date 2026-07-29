import type { GuildBattleState, StatusLayers } from '@expedition/shared-types';
import type { SkillOutcomePreview } from '@expedition/simulation-core';
import type {
  GuildCombatScene,
  GuildCombatSceneUnit,
  GuildCombatUnitState,
} from '@expedition/pixi-renderer';

import type { VisualEvent } from './visual-events';
import { enemyVisual, heroVisual, zoneVisualForQuest } from './visual-catalog';

export type BattleScene = GuildCombatScene;

export interface BattleSceneContext {
  relay: number;
  layout?: GuildCombatScene['layout'];
  actingActorId?: string;
  nextActorId?: string;
  event?: VisualEvent;
  preview?: SkillOutcomePreview;
  executionWindow?: boolean;
}

const HERO_POSITIONS = [
  { x: 135, y: 330 },
  { x: 245, y: 285 },
  { x: 355, y: 345 },
  { x: 165, y: 450 },
  { x: 285, y: 445 },
  { x: 405, y: 465 },
] as const;

const ENEMY_POSITIONS = [
  { x: 690, y: 210 },
  { x: 825, y: 315 },
  { x: 690, y: 425 },
] as const;

const PORTRAIT_HERO_POSITIONS = [
  { x: 100, y: 650 },
  { x: 300, y: 650 },
  { x: 500, y: 650 },
  { x: 100, y: 805 },
  { x: 300, y: 805 },
  { x: 500, y: 805 },
] as const;

const PORTRAIT_ENEMY_POSITIONS = [
  { x: 110, y: 360 },
  { x: 300, y: 330 },
  { x: 490, y: 360 },
] as const;

const emptyLayers = (): StatusLayers => ({ burn: 0, poison: 0, tide: 0 });

export function createBattleScene(
  battle: GuildBattleState,
  context: BattleSceneContext,
): BattleScene {
  const layout = context.layout ?? 'landscape';
  const heroPositions = layout === 'portrait' ? PORTRAIT_HERO_POSITIONS : HERO_POSITIONS;
  const enemyPositions = layout === 'portrait' ? PORTRAIT_ENEMY_POSITIONS : ENEMY_POSITIONS;
  let heroIndex = 0;
  let enemyIndex = 0;
  const units = battle.units.map((unit): GuildCombatSceneUnit => {
    const position =
      unit.side === 'heroes'
        ? heroPositions[Math.min(heroIndex++, heroPositions.length - 1)]!
        : enemyPositions[Math.min(enemyIndex++, enemyPositions.length - 1)]!;
    const selected = battle.selectedTargetId === unit.id;
    const preview = context.preview?.units.find(({ id }) => id === unit.id);
    const comboReady = context.preview?.nextRelays.some(({ actorId }) => actorId === unit.id);
    const hit = context.event?.targetId === unit.id && context.event.phase === 'impact';
    const state: GuildCombatUnitState =
      unit.currentHp <= 0
        ? context.executionWindow && unit.side === 'enemies'
          ? 'broken'
          : 'defeated'
        : hit
          ? 'hit'
          : unit.id === context.actingActorId
            ? 'acting'
            : unit.id === context.nextActorId
              ? 'next'
              : selected
                ? 'targeted'
                : 'idle';
    return {
      id: unit.id,
      name: unit.name,
      side: unit.side,
      x: position.x,
      y: position.y,
      currentHp: unit.currentHp,
      maxHp: unit.stats.hp,
      attack: unit.stats.attack,
      defense: unit.stats.defense,
      hpRatio: Math.max(0, Math.min(1, unit.currentHp / Math.max(1, unit.stats.hp))),
      state,
      selected,
      statusLayers: unit.statusLayers ?? emptyLayers(),
      defenseReduction: unit.defenseReduction ?? 0,
      strengthened: unit.strengthened ?? 0,
      ...(comboReady ? { comboReady: true } : {}),
      ...(preview
        ? {
            preview: {
              afterHp: preview.afterHp,
              damage: preview.damage,
              healing: preview.healing,
              afterStatus: preview.afterStatus,
              afterDefenseReduction: preview.afterDefenseReduction,
              afterStrengthened: preview.afterStrengthened,
            },
          }
        : {}),
      ...(unit.side === 'heroes' ? { hero: heroVisual(unit.id) } : { enemy: enemyVisual(unit.id) }),
    };
  });
  return {
    width: layout === 'portrait' ? 600 : 1_000,
    height: layout === 'portrait' ? 900 : 560,
    layout,
    questId: battle.questId,
    zone: zoneVisualForQuest(battle.questId),
    relay: Math.max(1, Math.min(6, Math.trunc(context.relay))),
    units,
    ...(context.event ? { event: context.event } : {}),
    ...(context.preview
      ? {
          preview: {
            actorId: context.preview.actorId,
            targetIds: context.preview.executionWindow
              ? [context.preview.targetId]
              : context.preview.units
                  .filter(({ side, damage }) => side === 'enemies' && damage > 0)
                  .map(({ id }) => id),
            totalDamage: context.preview.executionWindow
              ? context.preview.finisherPower
              : context.preview.totalDamage,
            ...(context.preview.events.find(({ element }) => element !== undefined)?.element
              ? {
                  element: context.preview.events.find(({ element }) => element !== undefined)!
                    .element!,
                }
              : {}),
          },
        }
      : {}),
  };
}
